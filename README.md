# `jupyterlab-mol-visualizer`: A JupyterLab Extension to Visualize Molecular Orbitals

[![Build](https://github.com/osscar-org/jupyterlab-mol-visualizer/actions/workflows/build.yml/badge.svg)](https://github.com/osscar-org/jupyterlab-mol-visualizer/actions/workflows/build.yml)

A JupyterLab launcher extension to view the molecular orbitals (MOs).
[NGL](https://github.com/nglviewer/ngl) JavaScript package was employed to visualize the MOs.
The icon of the extension (bundled as `style/molecule.svg`) is adapted from SVG Repo.

![demo](https://raw.githubusercontent.com/osscar-org/jupyterlab-mol-visualizer/main/binder/demo.gif)

## Features

- **Large interactive viewer** — the molecular visualization fills the available screen space with a sidebar
  control panel
- **Structure & isosurface loading** — load `.sdf`, `.cif` (structure) and `.cube` (Gaussian cube) files
  from the current JupyterLab directory
- **Auto-rotate, visibility toggles** — toggle spin, show/hide structure and positive/negative isosurfaces
- **Opacity & isovalue sliders** — fine-tune the display with real-time sliders
- **Viewer background color picker** — choose from 8 preset background colors
- **Auto Centre** — re-centre the camera on the molecule with a smooth animation
- **Save PNG** — export the current view as a high-resolution PNG image
- **Dark & light theme** — adapts to JupyterLab's theme automatically

## Try it with Binder

[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/osscar-org/jupyterlab-mol-visualizer/main?urlpath=lab)

## Requirements

- JupyterLab >= 4.0.0

## Install

To install the extension, execute:

```bash
pip install jupyterlab_mol_visualizer
```

## Uninstall

To remove the extension, execute:

```bash
pip uninstall jupyterlab_mol_visualizer
```

## Contributing

### Development install

Note: You will need NodeJS to build the extension package.

The `jlpm` command is JupyterLab's pinned version of
[yarn](https://yarnpkg.com/) that is installed with JupyterLab. You may use
`yarn` or `npm` in lieu of `jlpm` below. For a faster editable install, `npm`
is recommended.

```bash
# Clone the repo to your local environment
# Change directory to the jupyterlab_mol_visualizer directory
# Install npm dependencies (only needed first time)
npm install
# Install package in development mode
pip install -e "."
```

After the first install, subsequent `pip install -e .` runs are near-instant
(the build step is skipped once the labextension exists). To rebuild the
extension after making TypeScript changes:

```bash
npm run build
```

You can watch the source directory and run JupyterLab at the same time in
different terminals to watch for changes in the extension's source and
automatically rebuild the extension.

```bash
# Watch the source directory in one terminal, automatically rebuilding when needed
npm run watch
# Run JupyterLab in another terminal
jupyter lab
```

With the watch command running, every saved change will immediately be built
locally and available in your running JupyterLab. Refresh JupyterLab to load
the change in your browser (you may need to wait several seconds for the
extension to be rebuilt).

By default, the build generates the source maps for this extension to make it
easier to debug using the browser dev tools. To also generate source maps for
the JupyterLab core extensions, you can run the following command:

```bash
jupyter lab build --minimize=False
```

### Development uninstall

```bash
pip uninstall jupyterlab_mol_visualizer
```

In development mode, you will also need to remove the symlink created by `jupyter labextension develop`
command. To find its location, you can run `jupyter labextension list` to figure out where the `labextensions`
folder is located. Then you can remove the symlink named `jupyterlab_mol_visualizer` within that folder.

### Testing the extension

#### Frontend tests

This extension is using [Jest](https://jestjs.io/) for JavaScript code testing.

To execute them, execute:

```sh
npm install
npm test
```

#### Integration tests

This extension uses [Playwright](https://playwright.dev) for the integration tests (aka user level tests).
More precisely, the JupyterLab helper [Galata](https://github.com/jupyterlab/jupyterlab/tree/master/galata) is used to handle testing the extension in JupyterLab.

More information are provided within the [ui-tests](./ui-tests/README.md) README.

### Packaging the extension

See [RELEASE](RELEASE.md)

## How to cite

When using the content of this repository, please cite the following two articles:

1. D. Du, T. J. Baird, S. Bonella and G. Pizzi, OSSCAR, an open platform for collaborative development of computational tools for education in science, *Computer Physics Communications*, **282**, 108546 (2023).
https://doi.org/10.1016/j.cpc.2022.108546

2. D. Du, T. J. Baird, K. Eimre, S. Bonella, G. Pizzi, Jupyter widgets and extensions for education and research in computational physics and chemistry, *Computer Physics Communications*, **305**, 109353 (2024).
https://doi.org/10.1016/j.cpc.2024.109353


## Acknowledgements

We acknowledge support from the EPFL Open Science Fund via the [OSSCAR](http://www.osscar.org) project.

<img src='https://www.osscar.org/_images/logos.png' width='900'>
