import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import SearchIcon from '@material-ui/icons/Search';
import Autocomplete from '@material-ui/lab/Autocomplete';
import TextField from '@material-ui/core/TextField';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';

interface IInputPros {
  inputHandler: (e: string) => void;
  options: string[];
  label: string;
  factory: IFileBrowserFactory;
  getFiles: (types: string[]) => string[];
  types: string[];
}

const useStyles = makeStyles(theme => ({
  root: {
    padding: '2px 4px',
    display: 'flex',
    alignItems: 'center',
    width: 250,
    height: 30
  },
  input: {
    marginLeft: theme.spacing(1),
    flex: 1
  },
  iconButton: {
    padding: 10
  },
  divider: {
    height: 28,
    margin: 4
  }
}));

export default function Inputs(Props: IInputPros) {
  const classes = useStyles();
  const [value, setValue] = React.useState(Props.options[0]);
  const [inputValue, setInputValue] = React.useState('');
  const [files, setFiles] = React.useState(Props.options);

  const handerClick = (): void => {
    Props.inputHandler(value);
  };

  Props.factory.defaultBrowser.model.pathChanged.connect((value: any) => {
    console.log('The path is changed: OK');
    const f = Props.getFiles(Props.types);
    setFiles(f);
    setValue(f[0]);
  });

  return (
    <Paper component="form" className={classes.root}>
      <Autocomplete
        value={value}
        onChange={(event, newValue) => {
          setValue(newValue as string);
        }}
        inputValue={inputValue}
        onInputChange={(event, newInputValue) => {
          setInputValue(newInputValue);
        }}
        id="controllable-states-demo"
        options={files}
        style={{ width: 300 }}
        renderInput={params => (
          <TextField {...params} label={Props.label} variant="outlined" />
        )}
      />
      <Divider className={classes.divider} orientation="vertical" />
      <IconButton
        color="primary"
        className={classes.iconButton}
        aria-label="directions"
        onClick={handerClick}
      >
        <SearchIcon />
      </IconButton>
    </Paper>
  );
}
