import React from 'react';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';

interface IToggleProps {
  clickHandler1: () => void;
  clickHandler2: () => void;
  clickHandler3: () => void;
  bclick1: () => void;
  bclick2: () => void;
}

export default function SwitchLabels(Props: IToggleProps) {
  const useStyles = makeStyles(theme => ({
    container: {
      display: 'flex',
      flexWrap: 'wrap',
      position: 'absolute',
      top: 0,
      left: 0,
      height: '100%',
      width: '100%',
      alignItems: 'center'
    },
    textField: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
      width: 200
    },
    formGroup: {
      alignItems: 'center'
    }
  }));
  const classes = useStyles();

  const [state, setState] = React.useState({
    checkedA: false,
    checkedB: true,
    checkedC: true
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

  const handleClick = (): void => {
    Props.bclick1();
    setState({
      checkedA: state.checkedA,
      checkedB: !state.checkedB,
      checkedC: !state.checkedC
    });
  };

  return (
    <div>
      <Grid container spacing={3} justify="center">
        <Grid item sm={3}>
          <Button
            style={{ height: '20px' }}
            color="secondary"
            variant="contained"
            onClick={Props.bclick2}
          >
            Toggle structure
          </Button>
        </Grid>
        <Grid item sm={3}>
          <Button
            style={{ height: '20px' }}
            color="primary"
            variant="contained"
            onClick={handleClick}
          >
            Toggle surface
          </Button>
        </Grid>
      </Grid>
      <Grid container justify="center">
        <FormGroup className={classes.formGroup} row>
          <FormControlLabel
            control={
              <Switch
                checked={state.checkedA}
                onChange={handleChange}
                name="checkedA"
              />
            }
            label="Spin"
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
            label="Alpha"
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
            label="Beta"
          />
        </FormGroup>
      </Grid>
    </div>
  );
}
