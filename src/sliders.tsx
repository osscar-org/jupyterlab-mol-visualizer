import React from 'react';
import { styled, createTheme, ThemeProvider } from '@mui/system';
import Slider from '@mui/material/Slider';

import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';


const PREFIX = 'sliders';

const classes = {
  root: `${PREFIX}-root`
};

const StyledThemeProvider = styled(ThemeProvider)({
  [`& .${classes.root}`]: {
    flexGrow: 1,
    marginTop: '40px',
    width: '900px',
    margin: '0 auto'
  }
});

interface INglProps {
  uuid: string;
  changeHandler1: (
    event: Event,
    val: number | number[],
    activeThumb: number
  ) => void;
  changeHandler2: (
    event: Event,
    val: number | number[],
    activeThumb: number
  ) => void;
}

export default function VerticalSlider(Props: INglProps) {
  function valuetext(value: number) {
    return `${value}°C`;
  }

  const marks2 = [
    {
      value: 0,
      label: '0'
    },
    {
      value: 0.01,
      label: '0.01'
    },
    {
      value: 0.02,
      label: '0.02'
    },
    {
      value: 0.03,
      label: '0.03'
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

  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: prefersDarkMode ? 'dark' : 'light'
        }
      }),
    [prefersDarkMode]
  );

  return (
    <StyledThemeProvider theme={theme}>
      <CssBaseline />
      <React.Fragment>
        <div className={classes.root}>
          <Grid container spacing={3} justifyContent="center">
            <Grid item sm={8}>
              <Box
                id={Props.uuid}
                style={{
                  width: '600px',
                  height: '400px',
                  backgroundColor: 'black'
                }}
              ></Box>
            </Grid>
            <Grid item sm={1}>
              <Typography id="vertical-slider" gutterBottom>
                Transp.
              </Typography>
              <Slider
                style={{ height: '350px' }}
                orientation="vertical"
                getAriaValueText={valuetext}
                valueLabelDisplay="on"
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
              <Typography id="vertical-slider" gutterBottom>
                Isovalue
              </Typography>
              <Slider
                style={{ height: '350px' }}
                orientation="vertical"
                defaultValue={0.01}
                aria-labelledby="vertical-slider"
                getAriaValueText={valuetext}
                valueLabelDisplay="on"
                marks={marks2}
                min={0}
                max={0.04}
                step={0.001}
                onChange={Props.changeHandler2}
                color={'secondary'}
              />
            </Grid>
          </Grid>
        </div>
      </React.Fragment>
    </StyledThemeProvider>
  );
}
