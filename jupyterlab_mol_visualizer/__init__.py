try:
    from ._version import __version__
except ImportError:
    __version__ = "0.0.0"


def _jupyter_labextension_paths():
    return [{
        "src": "labextension",
        "dest": "jupyterlab_mol_visualizer"
    }]


def _jupyter_server_extension_points():
    return [{"module": "jupyterlab_mol_visualizer"}]


def _load_jupyter_server_extension(server_app):
    from .handlers import setup_handlers

    setup_handlers(server_app.web_app)
    server_app.log.info("Registered jupyterlab_mol_visualizer Fresnel render handler")
