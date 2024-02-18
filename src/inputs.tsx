import React from 'react';
import { styled } from '@mui/system';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { IDefaultFileBrowser } from '@jupyterlab/filebrowser';

const PREFIX = 'inputs';

const classes = {
  root: `${PREFIX}-root`,
  input: `${PREFIX}-input`,
  iconButton: `${PREFIX}-iconButton`,
  divider: `${PREFIX}-divider`
};

const Root = styled('div')(({ theme }) => ({
  [`& .${classes.root}`]: {
    padding: '2px 4px',
    display: 'flex',
    alignItems: 'center',
    width: 250,
    height: 30
  },

  [`& .${classes.input}`]: {
    marginLeft: theme.spacing(1),
    flex: 1
  },

  [`& .${classes.iconButton}`]: {
    padding: 10
  },

  [`& .${classes.divider}`]: {
    height: 28,
    margin: 4
  }
}));

interface IInputPros {
  inputHandler: (e: string) => void;
  options: string[];
  label: string;
  factory: IDefaultFileBrowser;
  getFiles: (types: string[]) => string[];
  types: string[];
}

export default function Inputs(Props: IInputPros) {
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
    <Root>
      <Paper component="form" className={classes.root}>
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
          id="controllable-states-demo"
          options={files}
          style={{ width: 300, height: 50 }}
          renderInput={params => (
            <TextField {...params} label={Props.label} variant="outlined" />
          )}
        />
        <Divider className={classes.divider} orientation="vertical" />
        <IconButton
          color="primary"
          style={{ height: 50 }}
          className={classes.iconButton}
          aria-label="directions"
          onClick={handerClick}
          size="large">
          <SearchIcon />
        </IconButton>
      </Paper>
    </Root>
  );
}
