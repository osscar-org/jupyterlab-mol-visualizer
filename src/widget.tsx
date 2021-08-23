import { ReactWidget } from '@jupyterlab/apputils';

import React from 'react';

import * as NGL from '@osscar/ngl';

import * as _ from 'underscore';

import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { PageConfig, URLExt } from '@jupyterlab/coreutils';

import VerticalSlider from './sliders';
import SwitchLabels from './switches';
import Inputs from './inputs';
import Grid from '@material-ui/core/Grid';
import { toArray, map } from '@lumino/algorithm';

/**
 * A Counter Lumino Widget that wraps a CounterComponent.
 */
export class CounterWidget extends ReactWidget {
  /**
   * Constructs a new CounterWidget.
   */

  stage: any;
  uuid: string;
  currentDirectory: string;
  browserFactory: IFileBrowserFactory;

  constructor(browserFactory: IFileBrowserFactory) {
    super();
    this.addClass('jp-ReactWidget');
    this.uuid = _.uniqueId('ngl_');

    this.browserFactory = browserFactory;
    this.currentDirectory = URLExt.join(
      PageConfig.getBaseUrl() + '/files',
      this.browserFactory?.defaultBrowser.model.path + '/'
    );

    window.requestAnimationFrame(() => {
      this.visualizer();
    });

    this.addStructure = this.addStructure.bind(this);
    this.addIsosurface = this.addIsosurface.bind(this);
    this.getCurrentDirectory = this.getCurrentDirectory.bind(this);
    this.updateDatasource = this.updateDatasource.bind(this);
    this.getFileList = this.getFileList.bind(this);
  }

  getCurrentDirectory() {
    this.currentDirectory = URLExt.join(
      PageConfig.getBaseUrl() + '/files',
      this.browserFactory?.defaultBrowser.model.path + '/'
    );
  }

  getFileList(types: string[]): string[] {
    const a = toArray(this.browserFactory?.defaultBrowser.model.items());
    const b = a.filter(
      item =>
        item.type === 'file' &&
        types.includes(item.name.split('.').pop() as string)
    );
    const c = map(b, x => x.name);
    return toArray(c);
  }

  updateDatasource() {
    this.getCurrentDirectory();
    NGL.DatasourceRegistry.add(
      'data',
      new NGL.StaticDatasource(this.currentDirectory)
    );
  }

  visualizer() {
    this.updateDatasource();

    this.stage = new NGL.Stage(this.uuid, { backgroundColor: 'black' });

    window.addEventListener(
      'resize',
      event => {
        this.stage.handleResize();
      },
      false
    );

    this.stage.viewer.container.addEventListener('dblclick', () => {
      this.stage.toggleFullscreen();
    });
  }

  addStructure(filename: string) {
    this.updateDatasource();
    this.stage.getComponentsByName('structure1').forEach((element: any) => {
      this.stage.removeComponent(element);
    });
    this.stage
      .loadFile('data://' + filename, { name: 'structure1' })
      .then((o: any) => {
        o.addRepresentation('ball+stick');

        o.autoView();
      });
  }

  addIsosurface(filename: string) {
    this.updateDatasource();
    this.stage.getComponentsByName('surface_1').forEach((element: any) => {
      this.stage.removeComponent(element);
    });

    this.stage.getComponentsByName('surface_2').forEach((element: any) => {
      this.stage.removeComponent(element);
    });

    this.stage
      .loadFile('data://' + filename, { name: 'surface_1' })
      .then((o: any) => {
        o.addRepresentation('surface', {
          visible: true,
          isolevelType: 'value',
          isolevel: 0.01,
          color: 'blue',
          opacity: 0.7,
          opaqueBack: false
        });

        o.signals.visibilityChanged.add((value: any) => {
          console.log('visibility change to:' + value);
        });

        o.autoView();
      });

    this.stage
      .loadFile('data://' + filename, { name: 'surface_2' })
      .then((o: any) => {
        o.addRepresentation('surface', {
          visible: true,
          isolevelType: 'value',
          isolevel: -0.01,
          color: 'red',
          opacity: 0.7,
          opaqueBack: false
        });
        o.autoView();
      });
  }

  updateIsosurface(e: number) {
    this.stage
      .getRepresentationsByName('surface')
      .setParameters({ opacity: e });

    this.stage.getComponentsByName('surface_1').list[0].setVisibility(true);
    this.stage.getComponentsByName('surface_2').list[0].setVisibility(true);
  }

  updateIsolevel(e: number, filename: string) {
    this.stage
      .getComponentsByName(filename)
      .list[0].eachRepresentation((reprElem: any) => {
        reprElem.setParameters({ isolevel: e });
      });
  }

  toggleVisibility(filename: string) {
    const a = this.stage.getComponentsByName(filename).list[0];
    a.setVisibility(!a.visible);
  }

  setVisibility(filename: string, val: boolean) {
    const a = this.stage.getComponentsByName(filename).list[0];
    a.setVisibility(val);
  }

  toggleSpin() {
    this.stage.toggleSpin();
  }

  render(): JSX.Element {
    const func1 = (): void => this.stage.toggleSpin();
    const func2 = (): void => this.toggleVisibility('surface_1');
    const func3 = (): void => this.toggleVisibility('surface_2');

    const bfunc1 = (): void => {
      this.toggleVisibility('surface_1');
      this.toggleVisibility('surface_2');
    };

    const bfunc2 = (): void => {
      this.toggleVisibility('structure1');
    };

    return (
      <div>
        <VerticalSlider
          uuid={this.uuid}
          changeHandler1={(
            event: React.ChangeEvent<unknown>,
            val: number | number[]
          ): void => {
            const value = (val as number) / 100.0;
            this.updateIsosurface(value);
          }}
          changeHandler2={(
            event: React.ChangeEvent<unknown>,
            val: number | number[]
          ): void => {
            const value = val as number[];
            this.updateIsolevel(value[0], 'surface_1');
            this.updateIsolevel(value[1], 'surface_2');
          }}
        />

        <Grid container spacing={3} justify="center">
          <Grid item sm={4}>
            <Inputs
              getFiles={this.getFileList}
              types={['sdf', 'cif']}
              factory={this.browserFactory}
              label="Structure"
              options={this.getFileList(['sdf', 'cif'])}
              inputHandler={this.addStructure}
            ></Inputs>
          </Grid>
          <Grid item sm={4}>
            <Inputs
              getFiles={this.getFileList}
              types={['cube']}
              factory={this.browserFactory}
              label="Isosurface"
              options={this.getFileList(['cube'])}
              inputHandler={this.addIsosurface}
            ></Inputs>
          </Grid>
        </Grid>

        <SwitchLabels
          clickHandler1={func1}
          clickHandler2={func2}
          clickHandler3={func3}
          bclick1={bfunc1}
          bclick2={bfunc2}
        />
      </div>
    );
  }
}
