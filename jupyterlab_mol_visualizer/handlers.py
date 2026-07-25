"""Jupyter server handlers for ray traced molecule rendering."""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
from tornado import web

from .fresnel_renderer import render_molecular_orbital


class FresnelRenderHandler(APIHandler):
    """Render the selected structure and cube files with Fresnel."""

    @web.authenticated
    async def post(self) -> None:
        data = self.get_json_body() or {}
        render_structure = self._bool(data, "render_structure", True)
        render_positive = self._bool(data, "render_positive_isosurface", True)
        render_negative = self._bool(data, "render_negative_isosurface", True)
        render_isosurface = render_positive or render_negative

        try:
            if not render_structure and not render_isosurface:
                raise web.HTTPError(400, reason="Enable structure or isosurface before ray tracing")
            structure_path = self._optional_path(data, "structure_path")
            cube_path = self._optional_path(data, "cube_path")
            if render_structure and structure_path is None:
                raise web.HTTPError(400, reason="Missing required field: structure_path")
            if render_isosurface and cube_path is None:
                raise web.HTTPError(400, reason="Missing required field: cube_path")

            result = render_molecular_orbital(
                structure_path,
                cube_path,
                isovalue=float(data.get("isovalue", 0.01)),
                opacity=float(data.get("opacity", 0.68)),
                width=int(data.get("width", 2400)),
                height=int(data.get("height", 1800)),
                samples=int(data.get("samples", 96)),
                background_color=str(data.get("background_color", "white")),
                camera=data.get("camera") if isinstance(data.get("camera"), dict) else None,
                atom_material=str(data.get("atom_material", "glossy")),
                isosurface_material=str(data.get("isosurface_material", "glass")),
                render_structure=render_structure,
                render_positive_isosurface=render_positive,
                render_negative_isosurface=render_negative,
            )
        except web.HTTPError as exc:
            self.set_status(exc.status_code)
            self.set_header("Content-Type", "application/json")
            self.finish(json.dumps({"message": exc.reason}))
            return
        except Exception as exc:
            self.log.exception("Fresnel render failed")
            self.set_status(500)
            self.set_header("Content-Type", "application/json")
            self.finish(json.dumps({"message": str(exc)}))
            return

        self.set_header("Content-Type", "application/json")
        self.finish(json.dumps(result))

    def _required_path(self, data: dict[str, Any], key: str) -> str:
        value = self._optional_path(data, key)
        if value is None:
            raise web.HTTPError(400, reason=f"Missing required field: {key}")
        return value

    def _optional_path(self, data: dict[str, Any], key: str) -> str | None:
        value = data.get(key)
        if value is None or value == "":
            return None
        if not isinstance(value, str):
            raise web.HTTPError(400, reason=f"Invalid field: {key}")
        if not self.contents_manager.file_exists(value):
            raise web.HTTPError(404, reason=f"File not found: {value}")
        return self._to_os_path(value)

    def _bool(self, data: dict[str, Any], key: str, default: bool) -> bool:
        value = data.get(key, default)
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            return value.lower() in {"1", "true", "yes", "on"}
        return bool(value)

    def _to_os_path(self, api_path: str) -> str:
        contents_manager = self.contents_manager
        if hasattr(contents_manager, "_get_os_path"):
            return contents_manager._get_os_path(api_path)  # type: ignore[attr-defined]
        root_dir = getattr(contents_manager, "root_dir", None)
        if root_dir is None:
            raise web.HTTPError(500, reason="The active contents manager does not expose local file paths")
        candidate = Path(root_dir).joinpath(api_path).resolve()
        root = Path(root_dir).resolve()
        if os.path.commonpath([str(root), str(candidate)]) != str(root):
            raise web.HTTPError(403, reason="Path is outside the Jupyter root directory")
        return str(candidate)


def setup_handlers(web_app: Any) -> None:
    host_pattern = ".*$"
    base_url = web_app.settings.get("base_url", "/")
    route_pattern = url_path_join(base_url, "jupyterlab_mol_visualizer", "render")
    web_app.add_handlers(host_pattern, [(route_pattern, FresnelRenderHandler)])
