import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

/**
 * Initialization data for the jupyterlab-mol-visualizer extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-mol-visualizer:plugin',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    console.log('JupyterLab extension jupyterlab-mol-visualizer is activated!');
  }
};

export default plugin;
