import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Slider from '@material-ui/core/Slider';
import { createTheme, ThemeProvider } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import useMediaQuery from '@material-ui/core/useMediaQuery';

interface INglProps {
  uuid: string;
  changeHandler1: (
    event: React.ChangeEvent<unknown>,
    val: number | number[]
  ) => void;
  changeHandler2: (
    event: React.ChangeEvent<unknown>,
    val: number | number[]
  ) => void;
}

export default function VerticalSlider(Props: INglProps) {
  const useStyles = makeStyles({
    root: {
      flexGrow: 1,
      marginTop: '40px',
      width: '900px',
      margin: '0 auto'
    }
  });

  function valuetext(value: number) {
    return `${value}°C`;
  }

  const marks2 = [
    {
      value: -0.04,
      label: '-0.04'
    },
    {
      value: -0.02,
      label: '-0.02'
    },
    {
      value: 0,
      label: '0'
    },
    {
      value: 0.02,
      label: '0.02'
    },
    {
      value: 0.04,
      label: '0.04'
    }
  ];

  const marks1 = [
    {
      value: 0,
      label: '0%'
    },
    {
      value: 20,
      label: '20%'
    },
    {
      value: 40,
      label: '40%'
    },
    {
      value: 60,
      label: '60%'
    },
    {
      value: 80,
      label: '80%'
    },
    {
      value: 100,
      label: '100%'
    }
  ];

  const classes = useStyles();

  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          type: prefersDarkMode ? 'dark' : 'light'
        }
      }),
    [prefersDarkMode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <React.Fragment>
        <div className={classes.root}>
          <Grid container spacing={3} justify="center">
            <Grid item sm={8}>
              <Box
                id={Props.uuid}
                style={{
                  width: '600px',
                  height: '350px',
                  backgroundColor: 'black'
                }}
              ></Box>
            </Grid>
            <Grid item sm={1}>
              <Slider
                orientation="vertical"
                getAriaValueText={valuetext}
                valueLabelDisplay="auto"
                defaultValue={30}
                aria-labelledby="vertical-slider"
                min={0}
                max={100}
                marks={marks1}
                onChange={Props.changeHandler1}
                color={'primary'}
              />
            </Grid>
            <Grid item sm={1}>
              <Slider
                orientation="vertical"
                defaultValue={[0.01, -0.01]}
                aria-labelledby="vertical-slider"
                getAriaValueText={valuetext}
                valueLabelDisplay="on"
                marks={marks2}
                min={-0.04}
                max={0.04}
                step={0.001}
                onChange={Props.changeHandler2}
                color={'secondary'}
              />
            </Grid>
          </Grid>
        </div>
      </React.Fragment>
    </ThemeProvider>
  );
}
