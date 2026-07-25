"""Fresnel-based ray traced rendering for molecular structures and cube MOs."""

from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO
import base64
import math
from pathlib import Path
from typing import Any, Iterable

BOHR_TO_ANGSTROM = 0.529177210903

ELEMENT_COLORS: dict[str, tuple[float, float, float]] = {
    "H": (1.0, 1.0, 1.0),
    "C": (0.2, 0.2, 0.2),
    "N": (0.1, 0.2, 0.9),
    "O": (0.9, 0.05, 0.05),
    "F": (0.1, 0.8, 0.1),
    "P": (1.0, 0.55, 0.1),
    "S": (1.0, 0.85, 0.1),
    "Cl": (0.1, 0.8, 0.1),
    "Br": (0.55, 0.15, 0.05),
    "I": (0.45, 0.0, 0.75),
}

COVALENT_RADII: dict[str, float] = {
    "H": 0.31,
    "B": 0.85,
    "C": 0.76,
    "N": 0.71,
    "O": 0.66,
    "F": 0.57,
    "P": 1.07,
    "S": 1.05,
    "Cl": 1.02,
    "Br": 1.20,
    "I": 1.39,
}

MATERIAL_PRESETS: dict[str, dict[str, float]] = {
    "matte": {"roughness": 0.85, "specular": 0.0, "spec_trans": 0.0, "metal": 0.0},
    "glossy": {"roughness": 0.32, "specular": 0.35, "spec_trans": 0.0, "metal": 0.0},
    "metal": {"roughness": 0.18, "specular": 0.9, "spec_trans": 0.0, "metal": 1.0},
    "glass": {"roughness": 0.04, "specular": 0.65, "spec_trans": 0.58, "metal": 0.0},
}


ATOM_RADII: dict[str, float] = {
    "H": 0.22,
    "C": 0.32,
    "N": 0.32,
    "O": 0.32,
    "F": 0.30,
    "P": 0.38,
    "S": 0.38,
    "Cl": 0.38,
    "Br": 0.42,
    "I": 0.46,
}


@dataclass
class Structure:
    elements: list[str]
    positions: Any
    bonds: list[tuple[int, int]]


@dataclass
class CubeData:
    origin: Any
    axes: Any
    values: Any
    atom_elements: list[str]
    atom_positions: Any


def render_molecular_orbital(
    structure_path: str,
    cube_path: str,
    *,
    isovalue: float = 0.01,
    opacity: float = 0.68,
    width: int = 2400,
    height: int = 1800,
    samples: int = 96,
    background_color: str = "white",
    camera: dict[str, Any] | None = None,
    atom_material: str = "glossy",
    isosurface_material: str = "glass",
) -> dict[str, str]:
    """Render a structure and positive/negative cube isosurfaces to PNG."""

    try:
        import fresnel
        import numpy as np
        from PIL import Image
        from skimage import measure
    except ImportError as exc:
        missing = getattr(exc, "name", "render dependency")
        raise RuntimeError(
            "Ray tracing requires optional packages. Install Python helpers with "
            "`pip install jupyterlab_mol_visualizer[render]` and install the "
            "Glotzer Fresnel path tracer with `mamba install -c conda-forge fresnel`. "
            f"Missing package: {missing}."
        ) from exc
    except Exception as exc:
        raise RuntimeError(
            "The installed `fresnel` module could not be imported as the Glotzer "
            "Fresnel path tracer. Install Fresnel from conda-forge with "
            "`mamba install -c conda-forge fresnel`; the PyPI `fresnel` "
            "package is unrelated to this renderer."
        ) from exc

    if not hasattr(fresnel, "Scene") or not hasattr(fresnel, "geometry"):
        raise RuntimeError(
            "The imported `fresnel` module is not the Glotzer Fresnel path tracer. "
            "Install Fresnel from conda-forge with "
            "`mamba install -c conda-forge fresnel`; the PyPI `fresnel` package "
            "does not provide the ray tracing API used here."
        )

    structure = read_structure(Path(structure_path), np)
    cube = read_cube(Path(cube_path), np, structure)

    if camera and isinstance(camera.get("rotation"), list):
        rotation = quaternion_to_matrix(camera["rotation"], np)
        # NGL and Fresnel use opposite screen handedness here; a 180 degree
        # vertical-axis correction preserves depth, unlike mirroring the PNG.
        rotation = vertical_axis_correction(np) @ rotation
        center = structure.positions.mean(axis=0)
        structure.positions = rotate_points(structure.positions, rotation, center)
        cube.origin = rotate_points(cube.origin.reshape((1, 3)), rotation, center)[0]
        cube.axes = cube.axes @ rotation.T
        if len(cube.atom_positions):
            cube.atom_positions = rotate_points(cube.atom_positions, rotation, center)

    scene = fresnel.Scene()
    bg = parse_color(background_color, np)
    scene.background_color = bg

    add_isosurface(
        scene,
        fresnel,
        measure,
        np,
        cube,
        abs(isovalue),
        (0.1, 0.25, 0.95),
        opacity,
        isosurface_material,
    )
    add_isosurface(
        scene,
        fresnel,
        measure,
        np,
        cube,
        -abs(isovalue),
        (0.95, 0.1, 0.1),
        opacity,
        isosurface_material,
    )
    add_structure(scene, fresnel, np, structure, atom_material)

    low = structure.positions.min(axis=0)
    high = structure.positions.max(axis=0)
    for comp in (abs(isovalue), -abs(isovalue)):
        try:
            verts, _ = cube_mesh(measure, np, cube, comp)
        except ValueError:
            continue
        if len(verts):
            low = np.minimum(low, verts.min(axis=0))
            high = np.maximum(high, verts.max(axis=0))

    center = (low + high) / 2.0
    span = high - low
    extent = float(np.linalg.norm(span)) or 8.0
    distance = max(extent * 1.8, 8.0)
    view_height = max(float(span[1]), float(span[0]) * height / max(width, 1), 4.0) * 1.18

    scene.camera = fresnel.camera.Orthographic(
        position=tuple((center + np.array((0.0, 0.0, distance))).tolist()),
        look_at=tuple(center.tolist()),
        up=(0.0, 1.0, 0.0),
        height=view_height,
    )

    scene.lights = [
        fresnel.light.Light(direction=(0.2, -0.4, 1.0), color=(1, 1, 1), theta=math.pi / 4),
        fresnel.light.Light(direction=(-0.8, 0.2, 0.5), color=(0.5, 0.55, 0.6), theta=math.pi / 5),
    ]

    output = fresnel.pathtrace(scene, w=width, h=height, samples=samples)
    image = Image.fromarray(output[:].astype("uint8"), mode="RGBA")
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    return {
        "image": base64.b64encode(buffer.getvalue()).decode("ascii"),
        "mime_type": "image/png",
        "filename": Path(cube_path).with_suffix(".fresnel.png").name,
    }


def read_structure(path: Path, np: Any) -> Structure:
    ext = path.suffix.lower()
    if ext == ".xyz":
        return read_xyz(path, np)
    if ext == ".sdf":
        return read_sdf(path, np)
    if ext == ".cif":
        return read_cif(path, np)
    raise ValueError(f"Unsupported structure format: {ext}")


def normalize_element(value: str) -> str:
    letters = "".join(ch for ch in value if ch.isalpha())
    if not letters:
        return "X"
    return letters[:1].upper() + letters[1:2].lower()


def read_xyz(path: Path, np: Any) -> Structure:
    lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
    count = int(lines[0].strip())
    elements: list[str] = []
    coords: list[list[float]] = []
    for line in lines[2 : 2 + count]:
        fields = line.split()
        if len(fields) < 4:
            raise ValueError(f"Invalid XYZ atom row in {path.name}: {line}")
        elements.append(normalize_element(fields[0]))
        coords.append([float(fields[1]), float(fields[2]), float(fields[3])])
    positions = np.asarray(coords, dtype=float)
    return Structure(elements, positions, infer_bonds(elements, positions, np))


def read_sdf(path: Path, np: Any) -> Structure:
    lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
    if len(lines) < 4:
        raise ValueError(f"Invalid SDF file: {path.name}")
    counts = lines[3]
    atom_count = int(counts[0:3])
    bond_count = int(counts[3:6])
    elements: list[str] = []
    coords: list[list[float]] = []
    for line in lines[4 : 4 + atom_count]:
        fields = line.split()
        if len(fields) < 4:
            raise ValueError(f"Invalid SDF atom row in {path.name}: {line}")
        coords.append([float(fields[0]), float(fields[1]), float(fields[2])])
        elements.append(normalize_element(fields[3]))
    bonds: list[tuple[int, int]] = []
    for line in lines[4 + atom_count : 4 + atom_count + bond_count]:
        fields = line.split()
        if len(fields) >= 2:
            bonds.append((int(fields[0]) - 1, int(fields[1]) - 1))
    positions = np.asarray(coords, dtype=float)
    return Structure(elements, positions, bonds or infer_bonds(elements, positions, np))


def read_cif(path: Path, np: Any) -> Structure:
    lines = [line.strip() for line in path.read_text(encoding="utf-8", errors="replace").splitlines()]
    lengths = {"a": None, "b": None, "c": None, "alpha": 90.0, "beta": 90.0, "gamma": 90.0}
    for line in lines:
        if line.startswith("_cell_length_a"):
            lengths["a"] = cif_float(line.split()[1])
        elif line.startswith("_cell_length_b"):
            lengths["b"] = cif_float(line.split()[1])
        elif line.startswith("_cell_length_c"):
            lengths["c"] = cif_float(line.split()[1])
        elif line.startswith("_cell_angle_alpha"):
            lengths["alpha"] = cif_float(line.split()[1])
        elif line.startswith("_cell_angle_beta"):
            lengths["beta"] = cif_float(line.split()[1])
        elif line.startswith("_cell_angle_gamma"):
            lengths["gamma"] = cif_float(line.split()[1])

    elements: list[str] = []
    coords: list[list[float]] = []
    index = 0
    while index < len(lines):
        if lines[index] != "loop_":
            index += 1
            continue
        index += 1
        headers: list[str] = []
        while index < len(lines) and lines[index].startswith("_"):
            headers.append(lines[index])
            index += 1
        if not any(header.startswith("_atom_site") for header in headers):
            continue
        rows: list[list[str]] = []
        while index < len(lines) and lines[index] and not lines[index].startswith(("loop_", "_")):
            if not lines[index].startswith("#"):
                rows.append(lines[index].split())
            index += 1
        header_map = {header: pos for pos, header in enumerate(headers)}
        symbol_key = first_key(header_map, ["_atom_site_type_symbol", "_atom_site_label"])
        cart_keys = ["_atom_site_Cartn_x", "_atom_site_Cartn_y", "_atom_site_Cartn_z"]
        frac_keys = ["_atom_site_fract_x", "_atom_site_fract_y", "_atom_site_fract_z"]
        if symbol_key is None:
            continue
        for row in rows:
            if len(row) < len(headers):
                continue
            elements.append(normalize_element(row[header_map[symbol_key]]))
            if all(key in header_map for key in cart_keys):
                coords.append([cif_float(row[header_map[key]]) for key in cart_keys])
            elif all(key in header_map for key in frac_keys) and all(lengths[k] is not None for k in ("a", "b", "c")):
                frac = np.asarray([cif_float(row[header_map[key]]) for key in frac_keys], dtype=float)
                coords.append((frac @ cell_matrix(lengths, np)).tolist())
        if coords:
            break
    if not coords:
        raise ValueError(f"No atom coordinates found in CIF file: {path.name}")
    positions = np.asarray(coords, dtype=float)
    return Structure(elements, positions, infer_bonds(elements, positions, np))


def cif_float(value: str) -> float:
    return float(value.strip("'").strip('"').split("(")[0])


def first_key(mapping: dict[str, int], names: Iterable[str]) -> str | None:
    for name in names:
        if name in mapping:
            return name
    return None


def cell_matrix(lengths: dict[str, float | None], np: Any) -> Any:
    a = float(lengths["a"] or 1.0)
    b = float(lengths["b"] or 1.0)
    c = float(lengths["c"] or 1.0)
    alpha = math.radians(float(lengths["alpha"] or 90.0))
    beta = math.radians(float(lengths["beta"] or 90.0))
    gamma = math.radians(float(lengths["gamma"] or 90.0))
    va = np.array([a, 0.0, 0.0])
    vb = np.array([b * math.cos(gamma), b * math.sin(gamma), 0.0])
    cx = c * math.cos(beta)
    cy = c * (math.cos(alpha) - math.cos(beta) * math.cos(gamma)) / max(math.sin(gamma), 1e-8)
    cz = math.sqrt(max(c * c - cx * cx - cy * cy, 0.0))
    vc = np.array([cx, cy, cz])
    return np.vstack([va, vb, vc])


def infer_bonds(elements: list[str], positions: Any, np: Any) -> list[tuple[int, int]]:
    bonds: list[tuple[int, int]] = []
    for i in range(len(elements)):
        for j in range(i + 1, len(elements)):
            ri = COVALENT_RADII.get(elements[i], 0.77)
            rj = COVALENT_RADII.get(elements[j], 0.77)
            distance = float(np.linalg.norm(positions[i] - positions[j]))
            if 0.35 < distance <= ri + rj + 0.45:
                bonds.append((i, j))
    return bonds


def read_cube(path: Path, np: Any, structure: Structure | None = None) -> CubeData:
    lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
    if len(lines) < 6:
        raise ValueError(f"Invalid cube file: {path.name}")
    natoms_fields = lines[2].split()
    natoms_raw = int(natoms_fields[0])
    natoms = abs(natoms_raw)
    raw_origin = np.asarray([float(value) for value in natoms_fields[1:4]], dtype=float)
    dims: list[int] = []
    raw_axes: list[list[float]] = []
    for line in lines[3:6]:
        fields = line.split()
        dims.append(abs(int(fields[0])))
        raw_axes.append([float(value) for value in fields[1:4]])

    atom_elements: list[str] = []
    atom_coords: list[list[float]] = []
    for line in lines[6 : 6 + natoms]:
        fields = line.split()
        if len(fields) >= 5:
            atom_number = int(float(fields[0]))
            atom_elements.append(element_from_atomic_number(atom_number))
            atom_coords.append([float(value) for value in fields[2:5]])

    raw_atom_positions = np.asarray(atom_coords, dtype=float) if atom_coords else np.zeros((0, 3), dtype=float)
    scale, offset = cube_scale_and_offset(atom_elements, raw_atom_positions, structure, np)
    origin = raw_origin * scale + offset
    axes = np.asarray(raw_axes, dtype=float) * scale
    atom_positions = raw_atom_positions * scale + offset if len(raw_atom_positions) else raw_atom_positions

    data_start = 6 + natoms
    if natoms_raw < 0 and data_start < len(lines):
        data_start += 1
    values = np.fromstring(" ".join(lines[data_start:]), sep=" ", dtype=float)
    expected = dims[0] * dims[1] * dims[2]
    if values.size < expected:
        raise ValueError(f"Cube grid is incomplete: expected {expected} values, found {values.size}")
    return CubeData(origin, axes, values[:expected].reshape(tuple(dims)), atom_elements, atom_positions)


def cube_scale_and_offset(atom_elements: list[str], atom_positions: Any, structure: Structure | None, np: Any) -> tuple[float, Any]:
    zero = np.zeros(3, dtype=float)
    if structure is None or len(atom_positions) == 0 or len(structure.positions) == 0:
        return BOHR_TO_ANGSTROM, zero

    count = min(len(atom_positions), len(structure.positions))
    candidates = [BOHR_TO_ANGSTROM, 1.0]
    best_scale = candidates[0]
    best_offset = zero
    best_error = float("inf")
    for scale in candidates:
        scaled = atom_positions[:count] * scale
        reference = structure.positions[:count]
        offset = reference.mean(axis=0) - scaled.mean(axis=0)
        error = float(np.sqrt(np.mean(np.sum((scaled + offset - reference) ** 2, axis=1))))
        if error < best_error:
            best_error = error
            best_scale = scale
            best_offset = offset
    return best_scale, best_offset


def element_from_atomic_number(atomic_number: int) -> str:
    elements = [
        "X", "H", "He", "Li", "Be", "B", "C", "N", "O", "F", "Ne",
        "Na", "Mg", "Al", "Si", "P", "S", "Cl", "Ar", "K", "Ca", "Sc",
        "Ti", "V", "Cr", "Mn", "Fe", "Co", "Ni", "Cu", "Zn", "Ga", "Ge",
        "As", "Se", "Br", "Kr", "Rb", "Sr", "Y", "Zr", "Nb", "Mo", "Tc",
        "Ru", "Rh", "Pd", "Ag", "Cd", "In", "Sn", "Sb", "Te", "I", "Xe",
    ]
    if 0 <= atomic_number < len(elements):
        return elements[atomic_number]
    return "X"


def quaternion_to_matrix(quaternion: list[float], np: Any) -> Any:
    if len(quaternion) != 4:
        return np.eye(3)
    x, y, z, w = [float(value) for value in quaternion]
    norm = math.sqrt(x * x + y * y + z * z + w * w)
    if norm == 0:
        return np.eye(3)
    x, y, z, w = x / norm, y / norm, z / norm, w / norm
    return np.asarray(
        [
            [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
            [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
            [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)],
        ],
        dtype=float,
    )


def vertical_axis_correction(np: Any) -> Any:
    return np.asarray(
        [
            [-1.0, 0.0, 0.0],
            [0.0, 1.0, 0.0],
            [0.0, 0.0, -1.0],
        ],
        dtype=float,
    )


def rotate_points(points: Any, rotation: Any, center: Any) -> Any:
    return center + (points - center) @ rotation.T


def cube_mesh(measure: Any, np: Any, cube: CubeData, isovalue: float) -> tuple[Any, Any]:
    values = cube.values
    axes = cube.axes.copy()
    max_voxels = 1600000
    if values.size > max_voxels:
        stride = int(math.ceil((values.size / max_voxels) ** (1.0 / 3.0)))
        values = values[::stride, ::stride, ::stride]
        axes = axes * stride
    if isovalue <= float(values.min()) or isovalue >= float(values.max()):
        raise ValueError("isovalue outside cube data range")
    verts, faces, _normals, _values = measure.marching_cubes(values, level=isovalue, spacing=(1.0, 1.0, 1.0))
    verts = cube.origin + verts @ axes
    return verts, faces.astype("uint32")


def material_preset(material_name: str) -> dict[str, float]:
    return MATERIAL_PRESETS.get(material_name.lower(), MATERIAL_PRESETS["glossy"])


def make_material(
    fresnel: Any,
    color: tuple[float, float, float],
    material_name: str,
    *,
    opacity: float = 1.0,
    primitive_color_mix: float = 0.0,
) -> Any:
    preset = material_preset(material_name)
    material = fresnel.material.Material(
        color=color,
        roughness=preset["roughness"],
        primitive_color_mix=primitive_color_mix,
    )
    if hasattr(material, "specular"):
        material.specular = preset["specular"]
    if hasattr(material, "spec_trans"):
        material.spec_trans = max(
            preset["spec_trans"],
            max(0.0, min(1.0 - float(opacity), 0.95)),
        )
    if hasattr(material, "metal"):
        material.metal = preset["metal"]
    return material


def add_isosurface(
    scene: Any,
    fresnel: Any,
    measure: Any,
    np: Any,
    cube: CubeData,
    isovalue: float,
    color: tuple[float, float, float],
    opacity: float,
    material_name: str,
) -> None:
    try:
        verts, faces = cube_mesh(measure, np, cube, isovalue)
    except ValueError:
        return
    if len(faces) == 0:
        return
    triangle_vertices = verts[faces].reshape((-1, 3)).astype("float32")
    mesh = fresnel.geometry.Mesh(scene, vertices=triangle_vertices, color=color)
    mesh.material = make_material(fresnel, color, material_name, opacity=opacity)


def add_structure(scene: Any, fresnel: Any, np: Any, structure: Structure, material_name: str) -> None:
    if len(structure.elements) == 0:
        return
    spheres = fresnel.geometry.Sphere(scene, N=len(structure.elements))
    spheres.position[:] = structure.positions
    spheres.radius[:] = [ATOM_RADII.get(element, 0.32) for element in structure.elements]
    spheres.material = make_material(fresnel, (1, 1, 1), material_name, primitive_color_mix=1.0)
    spheres.color[:] = [ELEMENT_COLORS.get(element, (0.55, 0.55, 0.55)) for element in structure.elements]
    spheres.outline_width = 0.025

    if structure.bonds:
        cylinders = fresnel.geometry.Cylinder(scene, N=len(structure.bonds))
        cylinders.points[:] = [[structure.positions[i], structure.positions[j]] for i, j in structure.bonds]
        cylinders.radius[:] = [0.075 for _ in structure.bonds]
        cylinders.material = make_material(fresnel, (0.75, 0.75, 0.75), material_name)


def parse_color(color: str, np: Any) -> tuple[float, float, float]:
    named = {"white": "#ffffff", "black": "#000000"}
    color = named.get(color.lower(), color)
    if color.startswith("#") and len(color) == 7:
        return tuple(int(color[i : i + 2], 16) / 255.0 for i in (1, 3, 5))
    return (1.0, 1.0, 1.0)
