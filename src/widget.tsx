import { ReactWidget } from '@jupyterlab/apputils';

import React from 'react';

import * as NGL from 'ngl';

import * as _ from 'underscore';

import { IDefaultFileBrowser } from '@jupyterlab/filebrowser';
import { PageConfig, URLExt } from '@jupyterlab/coreutils';
import { Message } from '@lumino/messaging';

import VerticalSlider from './sliders';
import SwitchLabels from './switches';
import Inputs from './inputs';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import CenterFocusStrongIcon from '@material-ui/icons/CenterFocusStrong';
import ImageIcon from '@material-ui/icons/Image';
import { createTheme, ThemeProvider } from '@material-ui/core/styles';
import { toArray, map } from '@lumino/algorithm';
import { molIcon } from './icons';

const STRUCTURE_FILE_TYPES = ['sdf', 'cif', 'xyz'];
const ISOSURFACE_FILE_TYPES = ['cube'];

function colorInputValue(color: string): string {
  const normalized = color.toLowerCase();
  const namedColors: { [key: string]: string } = {
    white: '#ffffff',
    black: '#000000'
  };
  if (namedColors[normalized]) {
    return namedColors[normalized];
  }
  if (normalized.length === 7 && normalized.charAt(0) === '#') {
    return normalized;
  }
  if (normalized.length === 4 && normalized.charAt(0) === '#') {
    return (
      '#' +
      normalized.charAt(1) +
      normalized.charAt(1) +
      normalized.charAt(2) +
      normalized.charAt(2) +
      normalized.charAt(3) +
      normalized.charAt(3)
    );
  }
  return '#ffffff';
}

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
  browserFactory: IDefaultFileBrowser;
  theme: string;
  private _stageReady = false;
  viewerBgColor: string;

  constructor(browserFactory: IDefaultFileBrowser, theme: string) {
    super();
    this.addClass('jp-ReactWidget');
    this.addClass('mol-visualizer-widget');
    this.uuid = _.uniqueId('ngl_');
    this.theme = theme;
    this.viewerBgColor = theme === 'light' ? 'white' : '#1a1a2e';

    this.browserFactory = browserFactory;
    this.currentDirectory = URLExt.join(
      PageConfig.getBaseUrl() + '/files',
      this.browserFactory?.model.path + '/'
    );

    this.addStructure = this.addStructure.bind(this);
    this.addIsosurface = this.addIsosurface.bind(this);
    this.getCurrentDirectory = this.getCurrentDirectory.bind(this);
    this.updateDatasource = this.updateDatasource.bind(this);
    this.getFileList = this.getFileList.bind(this);
  }

  /**
   * Initialize the NGL stage after the widget is attached to the DOM.
   */
  onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    // Small delay to ensure the React DOM is fully rendered
    setTimeout(() => {
      if (!this._stageReady) {
        this.visualizer();
        this._stageReady = true;
      }
    }, 50);
  }

  getCurrentDirectory() {
    this.currentDirectory = URLExt.join(
      PageConfig.getBaseUrl() + '/files',
      this.browserFactory?.model.path + '/'
    );
  }

  getFileList(types: string[]): string[] {
    const a = toArray(this.browserFactory?.model.items());
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

    this.stage = new NGL.Stage(this.uuid, {
      backgroundColor: this.viewerBgColor
    });

    window.addEventListener(
      'resize',
      () => {
        if (this.stage) {
          this.stage.handleResize();
        }
      },
      false
    );

    if (this.stage && this.stage.viewer && this.stage.viewer.container) {
      this.stage.viewer.container.addEventListener('dblclick', () => {
        this.stage.toggleFullscreen();
      });
    }
  }

  getFileExtension(filename: string): string {
    return (filename.split('.').pop() || '').toLowerCase();
  }

  async loadXyzAsPdb(filename: string): Promise<File> {
    const response = await fetch(
      URLExt.join(this.currentDirectory, encodeURIComponent(filename))
    );
    if (!response.ok) {
      throw new Error(
        'Unable to read ' + filename + ': HTTP ' + response.status
      );
    }
    const xyzText = await response.text();
    const pdbText = this.xyzToPdb(xyzText);
    // Use File instead of Blob so NGL's getFileInfo can extract the .pdb
    // extension from the name property. Blob has no name, so ext would be "".
    const pdbFilename = filename.replace(/\.xyz$/i, '.pdb');
    return new File([pdbText], pdbFilename, { type: 'text/plain' });
  }

  xyzToPdb(xyzText: string): string {
    const lines = xyzText.split(String.fromCharCode(10));
    const atomCount = Number.parseInt(lines[0]?.trim() || '', 10);
    if (!Number.isFinite(atomCount) || atomCount < 1) {
      throw new Error('Invalid XYZ file: first line must be an atom count');
    }

    const atomLines = lines
      .slice(2)
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .slice(0, atomCount);

    if (atomLines.length < atomCount) {
      throw new Error('Invalid XYZ file: atom rows do not match atom count');
    }

    const pdbLines = atomLines.map((line, index) => {
      const fields = line
        .split(String.fromCharCode(9))
        .join(' ')
        .split(' ')
        .filter(field => field.length > 0);
      const element = this.normalizeElement(fields[0] || 'X');
      const x = Number.parseFloat(fields[1]);
      const y = Number.parseFloat(fields[2]);
      const z = Number.parseFloat(fields[3]);
      if (![x, y, z].every(Number.isFinite)) {
        throw new Error('Invalid XYZ file: atom coordinates must be numbers');
      }
      return this.toPdbAtomLine(index + 1, element, x, y, z);
    });

    return pdbLines.concat(['END']).join(String.fromCharCode(10));
  }

  normalizeElement(value: string): string {
    const letters = value.replace(/[^A-Za-z]/g, '');
    if (!letters) {
      return 'X';
    }
    return letters.charAt(0).toUpperCase() + letters.slice(1, 2).toLowerCase();
  }

  toPdbAtomLine(
    index: number,
    element: string,
    x: number,
    y: number,
    z: number
  ): string {
    // Standard PDB HETATM record (80 columns):
    //  1- 6: "HETATM"
    //  7-11: serial (5, right-aligned)
    // 12-12: space
    // 13-16: atom name (4, left-aligned, element at 13-14)
    // 17-17: altLoc
    // 18-20: residue name ("MOL")
    // 21-21: chain ID
    // 22-26: residue seq (4, right-aligned) + insertion code
    // 27-30: reserved
    // 31-38: x (8.3, right-aligned)
    // 39-46: y (8.3, right-aligned)
    // 47-54: z (8.3, right-aligned)
    // 55-60: occupancy (6.2)
    // 61-66: temp factor (6.2)
    // 67-76: reserved
    // 77-78: element (2, right-aligned)
    // 79-80: charge
    const serial = index.toString().padStart(5, ' ');
    const atomName = element.padStart(2, ' ').padEnd(4, ' ');
    const xCoord = x.toFixed(3).padStart(8, ' ');
    const yCoord = y.toFixed(3).padStart(8, ' ');
    const zCoord = z.toFixed(3).padStart(8, ' ');
    const pdbElement = element.padStart(2, ' ');
    return (
      'HETATM' +
      serial +
      ' ' +
      atomName +
      ' MOL     1    ' +
      xCoord +
      yCoord +
      zCoord +
      '  1.00  0.00          ' +
      pdbElement +
      '  '
    );
  }

  async addStructure(filename: string) {
    if (!filename) {
      return;
    }
    this.updateDatasource();
    this.stage.getComponentsByName('structure1').forEach((element: any) => {
      this.stage.removeComponent(element);
    });

    try {
      const extension = this.getFileExtension(filename);
      const loadOptions: any = { name: 'structure1' };
      const structureSource =
        extension === 'xyz'
          ? await this.loadXyzAsPdb(filename)
          : 'data://' + filename;
      if (extension === 'xyz') {
        loadOptions.ext = 'pdb';
      }

      this.stage
        .loadFile(structureSource, loadOptions)
        .then((o: any) => {
          o.addRepresentation('ball+stick');
          o.autoView();
        })
        .catch((error: any) => {
          console.error('Error loading structure file:', error);
        });
    } catch (error) {
      console.error('Error loading structure file:', error);
    }
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
    if (!this.stage) {
      return;
    }
    this.stage
      .getRepresentationsByName('surface')
      .setParameters({ opacity: e });

    const c1 = this.stage.getComponentsByName('surface_1');
    const c2 = this.stage.getComponentsByName('surface_2');
    if (c1 && c1.list && c1.list[0]) {
      c1.list[0].setVisibility(true);
    }
    if (c2 && c2.list && c2.list[0]) {
      c2.list[0].setVisibility(true);
    }
  }

  updateIsolevel(e: number, filename: string) {
    const comp = this.stage.getComponentsByName(filename);
    if (comp && comp.list && comp.list[0]) {
      comp.list[0].eachRepresentation((reprElem: any) => {
        reprElem.setParameters({ isolevel: e });
      });
    }
  }

  toggleVisibility(filename: string) {
    const a = this.stage.getComponentsByName(filename).list[0];
    if (a) {
      a.setVisibility(!a.visible);
    }
  }

  toggleSpin() {
    if (this.stage) {
      this.stage.toggleSpin();
    }
  }

  setViewerBgColor(color: string) {
    this.viewerBgColor = color;
    if (this.stage) {
      this.stage.setParameters({ backgroundColor: color });
    }
    this.update();
  }

  autoCenter() {
    if (!this.stage) {
      return;
    }
    this.stage.autoView(1000);
  }

  downloadPNG() {
    if (!this.stage) {
      return;
    }
    this.stage
      .makeImage({
        factor: 2,
        antialias: true,
        trim: false,
        transparent: false
      })
      .then((blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mol-viewer.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
  }

  render(): JSX.Element {
    const func1 = (): void => this.toggleSpin();
    const func2 = (): void => this.toggleVisibility('surface_1');
    const func3 = (): void => this.toggleVisibility('surface_2');

    const bfunc1 = (): void => {
      this.toggleVisibility('structure1');
    };

    const bfunc2 = (): void => {
      this.toggleVisibility('surface_1');
      this.toggleVisibility('surface_2');
    };

    const isDark = this.theme === 'dark';

    const muiTheme = createTheme({
      palette: {
        type: isDark ? 'dark' : 'light',
        primary: { main: '#4fc3f7' },
        secondary: { main: '#f06292' }
      }
    });

    return (
      <ThemeProvider theme={muiTheme}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden',
            backgroundColor: isDark ? '#121212' : '#fafafa',
            color: isDark ? '#e0e0e0' : '#212121'
          }}
        >
          {/* Header */}
          <Paper
            elevation={4}
            style={{
              flexShrink: 0,
              backgroundColor: isDark ? '#1e1e1e' : '#f5f5f5',
              borderRadius: 0,
              padding: '8px 16px'
            }}
          >
            <Box display="flex" alignItems="center">
              <molIcon.react tag="span" width="28px" height="28px" />
              <Typography
                variant="h6"
                style={{
                  fontWeight: 600,
                  marginLeft: '12px',
                  color: isDark ? '#e0e0e0' : '#212121'
                }}
              >
                Molecular Orbital Visualizer
              </Typography>
            </Box>
          </Paper>

          {/* Main content: sidebar + viewer */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              minHeight: 0,
              overflow: 'hidden'
            }}
          >
            {/* Left Sidebar */}
            <div
              style={{
                width: '300px',
                minWidth: '300px',
                overflowY: 'auto',
                overflowX: 'hidden',
                padding: '12px',
                backgroundColor: isDark ? '#1e1e1e' : '#fafafa',
                borderRight: `1px solid ${isDark ? '#333333' : '#e0e0e0'}`
              }}
            >
              {/* File Selection */}
              <Paper
                elevation={isDark ? 2 : 1}
                style={{
                  padding: '12px',
                  marginBottom: '12px',
                  backgroundColor: isDark ? '#2c2c2c' : '#ffffff'
                }}
              >
                <Typography
                  variant="overline"
                  display="block"
                  gutterBottom
                  style={{
                    color: isDark ? '#90caf9' : '#1565c0',
                    letterSpacing: '0.5px',
                    lineHeight: 1,
                    fontWeight: 600
                  }}
                >
                  File Selection
                </Typography>
                <Box mb={1.5}>
                  <Inputs
                    getFiles={this.getFileList}
                    types={STRUCTURE_FILE_TYPES}
                    factory={this.browserFactory}
                    label="Structure"
                    options={this.getFileList(STRUCTURE_FILE_TYPES)}
                    inputHandler={this.addStructure}
                  />
                </Box>
                <Inputs
                  getFiles={this.getFileList}
                  types={ISOSURFACE_FILE_TYPES}
                  factory={this.browserFactory}
                  label="Isosurface"
                  options={this.getFileList(ISOSURFACE_FILE_TYPES)}
                  inputHandler={this.addIsosurface}
                />
              </Paper>

              {/* Controls */}
              <Paper
                elevation={isDark ? 2 : 1}
                style={{
                  padding: '12px',
                  marginBottom: '12px',
                  backgroundColor: isDark ? '#2c2c2c' : '#ffffff'
                }}
              >
                <Typography
                  variant="overline"
                  display="block"
                  gutterBottom
                  style={{
                    color: isDark ? '#90caf9' : '#1565c0',
                    letterSpacing: '0.5px',
                    lineHeight: 1,
                    fontWeight: 600
                  }}
                >
                  Controls
                </Typography>
                <SwitchLabels
                  clickHandler1={func1}
                  clickHandler2={func2}
                  clickHandler3={func3}
                  bclick1={bfunc1}
                  bclick2={bfunc2}
                />
                <Box mt={1} display="flex" justifyContent="center" gridGap={8}>
                  <Button
                    size="small"
                    variant="outlined"
                    color="primary"
                    startIcon={<CenterFocusStrongIcon />}
                    onClick={() => this.autoCenter()}
                    style={{ textTransform: 'none', fontSize: '0.75rem' }}
                  >
                    Auto Centre
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="secondary"
                    startIcon={<ImageIcon />}
                    onClick={() => this.downloadPNG()}
                    style={{ textTransform: 'none', fontSize: '0.75rem' }}
                  >
                    Save PNG
                  </Button>
                </Box>
              </Paper>

              {/* Sliders */}
              <Paper
                elevation={isDark ? 2 : 1}
                style={{
                  padding: '12px',
                  marginBottom: '12px',
                  backgroundColor: isDark ? '#2c2c2c' : '#ffffff'
                }}
              >
                <Typography
                  variant="overline"
                  display="block"
                  gutterBottom
                  style={{
                    color: isDark ? '#90caf9' : '#1565c0',
                    letterSpacing: '0.5px',
                    lineHeight: 1,
                    fontWeight: 600
                  }}
                >
                  Display Settings
                </Typography>
                <VerticalSlider
                  uuid={this.uuid}
                  theme={this.theme}
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
                    const value = val as number;
                    this.updateIsolevel(value, 'surface_1');
                    this.updateIsolevel(-value, 'surface_2');
                  }}
                />
              </Paper>

              {/* Viewer Background Color */}
              <Paper
                elevation={isDark ? 2 : 1}
                style={{
                  padding: '12px',
                  marginBottom: '12px',
                  backgroundColor: isDark ? '#2c2c2c' : '#ffffff'
                }}
              >
                <Typography
                  variant="overline"
                  display="block"
                  gutterBottom
                  style={{
                    color: isDark ? '#90caf9' : '#1565c0',
                    letterSpacing: '0.5px',
                    lineHeight: 1,
                    fontWeight: 600
                  }}
                >
                  Viewer Background
                </Typography>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {[
                    { color: 'white', label: 'White' },
                    { color: '#e0e0e0', label: 'Gray' },
                    { color: '#1a1a2e', label: 'Dark' },
                    { color: 'black', label: 'Black' },
                    { color: '#e8f5e9', label: 'Mint' },
                    { color: '#fff3e0', label: 'Warm' },
                    { color: '#e3f2fd', label: 'Sky' },
                    { color: '#263238', label: 'Slate' }
                  ].map(({ color, label }) => (
                    <button
                      key={color}
                      title={label}
                      onClick={() => this.setViewerBgColor(color)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: color,
                        border:
                          this.viewerBgColor === color
                            ? '3px solid #4fc3f7'
                            : color === 'white' ||
                              color === '#e0e0e0' ||
                              color === '#e8f5e9' ||
                              color === '#fff3e0' ||
                              color === '#e3f2fd'
                            ? '1px solid #bdbdbd'
                            : '1px solid #555',
                        cursor: 'pointer',
                        padding: 0,
                        outline: 'none',
                        boxShadow:
                          this.viewerBgColor === color
                            ? '0 0 6px rgba(79,195,247,0.6)'
                            : 'none',
                        transition: 'box-shadow 0.2s, border 0.2s'
                      }}
                    />
                  ))}
                </div>
                <Box mt={1.5} display="flex" alignItems="center" gridGap={8}>
                  <Typography
                    variant="caption"
                    style={{
                      color: isDark ? '#b0b0b0' : '#616161',
                      fontWeight: 500
                    }}
                  >
                    Palette
                  </Typography>
                  <input
                    aria-label="custom background color"
                    title="Custom background color"
                    type="color"
                    value={colorInputValue(this.viewerBgColor)}
                    onChange={event =>
                      this.setViewerBgColor(event.target.value)
                    }
                    style={{
                      width: '44px',
                      height: '32px',
                      padding: 0,
                      border: isDark ? '1px solid #555' : '1px solid #bdbdbd',
                      borderRadius: '4px',
                      backgroundColor: 'transparent',
                      cursor: 'pointer'
                    }}
                  />
                </Box>
              </Paper>

              {/* Tip */}
              <Typography
                variant="caption"
                align="center"
                display="block"
                style={{
                  color: isDark ? '#9e9e9e' : '#9e9e9e',
                  fontSize: '0.7rem',
                  fontStyle: 'italic',
                  padding: '8px 4px'
                }}
              >
                Select structure and cube files from the current directory.
                Double-click the viewer for fullscreen mode.
              </Typography>
            </div>

            {/* Viewer */}
            <div
              style={{
                flex: 1,
                minWidth: 0,
                display: 'flex',
                padding: '8px',
                backgroundColor: isDark ? '#121212' : '#e8e8e8'
              }}
            >
              <div
                id={this.uuid}
                style={{
                  flex: 1,
                  borderRadius: '4px',
                  overflow: 'hidden',
                  boxShadow: isDark
                    ? '0 4px 24px rgba(0,0,0,0.8)'
                    : '0 4px 24px rgba(0,0,0,0.12)'
                }}
              />
            </div>
          </div>
        </div>
      </ThemeProvider>
    );
  }
}
