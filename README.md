# **jupyterlab-mol-visualizer**: A JupyterLab Launcher to Visualize Molecular Orbital and Structure

![Github Actions Status](https://github.com/osscar-org/jupyterlab-mol-visualizer/workflows/Build/badge.svg)
[![PyPI version](https://badge.fury.io/py/jupyterlab-mol-visualizer.svg)](https://badge.fury.io/py/jupyterlab-mol-visualizer)
[![npm version](https://badge.fury.io/js/jupyterlab-mol-visualizer.svg)](https://badge.fury.io/js/jupyterlab-mol-visualizer)

## Try it with Binder

[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/osscar-org/jupyterlab-mol-visualizer/master?urlpath=lab)

A JupyterLab launcher extension to view the molecular orbitals.

![demo](./binder/demo.gif)

## Requirements

* JupyterLab >= 3.0

## Install

To install the extension, execute:

```bash
pip install jupyterlab-mol-visualizer
```
or

```bash
jupyter labextension install jupyterlab-mol-visualizer
```

## Uninstall

To remove the extension, execute:

```bash
pip uninstall jupyterlab-mol-visualizer
```

## Contributing

### Development install

Note: You will need NodeJS to build the extension package.

The `jlpm` command is JupyterLab's pinned version of
[yarn](https://yarnpkg.com/) that is installed with JupyterLab. You may use
`yarn` or `npm` in lieu of `jlpm` below.

```bash
# Clone the repo to your local environment
# Change directory to the jupyterlab_mol_visualizer directory
# Install package in development mode
pip install -e .
# Link your development version of the extension with JupyterLab
jupyter labextension develop . --overwrite
# Rebuild extension Typescript source after making changes
jlpm run build
```

You can watch the source directory and run JupyterLab at the same time in different terminals to watch for changes in the extension's source and automatically rebuild the extension.

```bash
# Watch the source directory in one terminal, automatically rebuilding when needed
jlpm run watch
# Run JupyterLab in another terminal
jupyter lab
```

With the watch command running, every saved change will immediately be built locally and available in your running JupyterLab. Refresh JupyterLab to load the change in your browser (you may need to wait several seconds for the extension to be rebuilt).

By default, the `jlpm run build` command generates the source maps for this extension to make it easier to debug using the browser dev tools. To also generate source maps for the JupyterLab core extensions, you can run the following command:

```bash
jupyter lab build --minimize=False
```

### Development uninstall

```bash
pip uninstall jupyterlab_mol_visualizer
```

In development mode, you will also need to remove the symlink created by `jupyter labextension develop`
command. To find its location, you can run `jupyter labextension list` to figure out where the `labextensions`
folder is located. Then you can remove the symlink named `jupyterlab-mol-visualizer` within that folder.


# Acknowledgements

We acknowledge support from the EPFL Open Science Fund via the [OSSCAR](http://www.osscar.org) project.

<img src='http://www.osscar.org/wp-content/uploads/2019/03/OSSCAR-logo.png' width='230'>
