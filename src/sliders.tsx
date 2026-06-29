import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Slider from '@material-ui/core/Slider';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';

interface INglProps {
  uuid: string;
  theme: string;
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
      width: '100%',
      paddingTop: '8px'
    },
    slider: {
      padding: '10px 0',
      '& .MuiSlider-rail': {
        height: 4
      },
      '& .MuiSlider-track': {
        height: 4
      },
      '& .MuiSlider-thumb': {
        width: 14,
        height: 14
      }
    }
  });

  const classes = useStyles();

  const marks1 = [
    { value: 0, label: '0%' },
    { value: 25, label: '25%' },
    { value: 50, label: '50%' },
    { value: 75, label: '75%' },
    { value: 100, label: '100%' }
  ];

  const marks2 = [
    { value: 0, label: '0' },
    { value: 0.01, label: '0.01' },
    { value: 0.02, label: '0.02' },
    { value: 0.03, label: '0.03' },
    { value: 0.04, label: '0.04' }
  ];

  const isDark = Props.theme === 'dark';

  return (
    <div className={classes.root}>
      <Box mb={2}>
        <Typography
          variant="caption"
          gutterBottom
          style={{ color: isDark ? '#b0b0b0' : '#616161', fontWeight: 500 }}
        >
          Opacity
        </Typography>
        <Slider
          className={classes.slider}
          defaultValue={30}
          getAriaValueText={value => `${value}%`}
          valueLabelDisplay="auto"
          aria-labelledby="opacity-slider"
          min={0}
          max={100}
          marks={marks1}
          onChange={Props.changeHandler1}
          color="primary"
        />
      </Box>
      <Box mb={2}>
        <Typography
          variant="caption"
          gutterBottom
          style={{ color: isDark ? '#b0b0b0' : '#616161', fontWeight: 500 }}
        >
          Isovalue
        </Typography>
        <Slider
          className={classes.slider}
          defaultValue={0.01}
          aria-labelledby="isovalue-slider"
          getAriaValueText={value => `${value}`}
          valueLabelDisplay="auto"
          marks={marks2}
          min={0}
          max={0.04}
          step={0.001}
          onChange={Props.changeHandler2}
          color="secondary"
        />
      </Box>
    </div>
  );
}
