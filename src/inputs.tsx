import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import SearchIcon from '@material-ui/icons/Search';
import Autocomplete from '@material-ui/lab/Autocomplete';
import TextField from '@material-ui/core/TextField';
import { IDefaultFileBrowser } from '@jupyterlab/filebrowser';

interface IInputPros {
  inputHandler: (e: string) => void;
  options: string[];
  label: string;
  factory: IDefaultFileBrowser;
  getFiles: (types: string[]) => string[];
  types: string[];
}

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  iconButton: {
    padding: 8,
    height: 40,
    width: 40
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

  Props.factory.model.pathChanged.connect((value: any) => {
    console.log('The path is changed: OK');
    const f = Props.getFiles(Props.types);
    setFiles(f);
    setValue(f[0]);
  });

  return (
    <div className={classes.root}>
      <Autocomplete
        color="primary"
        value={value}
        onChange={(event, newValue) => {
          setValue(newValue as string);
        }}
        inputValue={inputValue}
        onInputChange={(event, newInputValue) => {
          setInputValue(newInputValue);
        }}
        id={'input-' + Props.label.toLowerCase()}
        options={files}
        size="small"
        style={{ flexGrow: 1 }}
        renderInput={params => (
          <TextField
            {...params}
            label={Props.label}
            variant="outlined"
            size="small"
          />
        )}
      />
      <IconButton
        color="primary"
        className={classes.iconButton}
        aria-label="load"
        onClick={handerClick}
        size="small"
      >
        <SearchIcon fontSize="small" />
      </IconButton>
    </div>
  );
}
