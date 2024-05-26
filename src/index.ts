import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { MainAreaWidget, IThemeManager } from '@jupyterlab/apputils';

import { ILauncher } from '@jupyterlab/launcher';

import { CounterWidget } from './widget';

import { IDefaultFileBrowser } from '@jupyterlab/filebrowser';

import { molIcon } from './icons';

/**
 * The command IDs used by the react-widget plugin.
 */
namespace CommandIDs {
  export const create = 'create-react-widget';
}

/**
 * Initialization data for the react-widget extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab_mol_visualizer:plugin',
  autoStart: true,
  optional: [ILauncher, IDefaultFileBrowser, IThemeManager],
  activate: (
    app: JupyterFrontEnd,
    launcher: ILauncher,
    browserFactory: IDefaultFileBrowser,
    themeManager: IThemeManager
  ) => {
    const { commands } = app;
    console.log('JupyterLab extension jupyterlab_mol_visualizer is activated!');

    const command = CommandIDs.create;
    commands.addCommand(command, {
      caption: 'Create a new React Widget',
      label: 'MOs Visualizer',
      icon: molIcon,
      execute: () => {
        let theme = 'dark';
        if (themeManager.theme?.toLowerCase().includes('light')) {
          theme = 'light';
        } else {
          theme = 'dark';
        }

        const content = new CounterWidget(browserFactory, theme);
        const widget = new MainAreaWidget<CounterWidget>({ content });

        // Watch for theme changes
        themeManager.themeChanged.connect((_, args) => {
          const newTheme = args.newValue;
          console.log(`Theme changed to: ${newTheme}`);
          // Add your custom logic here
        });
        widget.title.label = 'MOL Visualizer';
        app.shell.add(widget, 'main');
      }
    });

    if (launcher) {
      launcher.add({
        command
      });
    }
  }
};

export default plugin;
