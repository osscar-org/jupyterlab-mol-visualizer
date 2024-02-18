import React from 'react';
import { styled } from '@mui/system';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Grid from '@mui/material/Grid';

const PREFIX = 'switches';

const classes = {
  container: `${PREFIX}-container`,
  textField: `${PREFIX}-textField`,
  formGroup: `${PREFIX}-formGroup`
};

const Root = styled('div')( ({ theme }) => ({
  [`& .${classes.container}`]: {
    display: 'flex',
    flexWrap: 'wrap',
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: '100%',
    alignItems: 'center'
  },

  [`& .${classes.textField}`]: {
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(1),
    width: 200
  },

  [`& .${classes.formGroup}`]: {
    alignItems: 'center'
  }
}));

interface IToggleProps {
  clickHandler1: () => void;
  clickHandler2: () => void;
  clickHandler3: () => void;
  bclick1: () => void;
  bclick2: () => void;
}

export default function SwitchLabels(Props: IToggleProps) {
  const [state, setState] = React.useState({
    checkedA: false,
    checkedB: true,
    checkedC: true,
    checkedS: true,
    checkedI: true
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setState({ ...state, [event.target.name]: event.target.checked });

    if (event.target.name === 'checkedA') {
      Props.clickHandler1();
    }
    if (event.target.name === 'checkedB') {
      Props.clickHandler2();
    }
    if (event.target.name === 'checkedC') {
      Props.clickHandler3();
    }
  };

  const handleClick1 = (): void => {
    Props.bclick1();
    setState({
      checkedA: state.checkedA,
      checkedB: state.checkedB,
      checkedC: state.checkedC,
      checkedS: !state.checkedS,
      checkedI: state.checkedI
    });
  };

  const handleClick2 = (): void => {
    Props.bclick2();
    setState({
      checkedA: state.checkedA,
      checkedB: !state.checkedB,
      checkedC: !state.checkedC,
      checkedS: state.checkedS,
      checkedI: !state.checkedI
    });
  };

  return (
    <Root>
      <Grid container spacing={3} justifyContent="center">
        <Grid item sm={3}>
          <FormControlLabel
            control={
              <Switch
                checked={state.checkedS}
                onChange={handleClick1}
                name="checkedS"
              />
            }
            label="Show/hide structure"
          />
        </Grid>
        <Grid item sm={3}>
          <FormControlLabel
            control={
              <Switch
                checked={state.checkedI}
                onChange={handleClick2}
                name="checkedI"
              />
            }
            label="Show/hide isosurface"
          />
        </Grid>
      </Grid>
      <Grid container justifyContent="center">
        <FormGroup className={classes.formGroup} row>
          <FormControlLabel
            control={
              <Switch
                checked={state.checkedA}
                onChange={handleChange}
                name="checkedA"
              />
            }
            label="Auto-rotate"
          />
          <FormControlLabel
            control={
              <Switch
                checked={state.checkedB}
                onChange={handleChange}
                name="checkedB"
                color="primary"
              />
            }
            label="Positive isovalue"
          />
          <FormControlLabel
            control={
              <Switch
                checked={state.checkedC}
                onChange={handleChange}
                name="checkedC"
                color="secondary"
              />
            }
            label="Negative isovalue"
          />
        </FormGroup>
      </Grid>
    </Root>
  );
}
