import React from 'react';
import Switch from '@material-ui/core/Switch';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import Divider from '@material-ui/core/Divider';
import { makeStyles } from '@material-ui/core/styles';

interface IToggleProps {
  clickHandler1: () => void;
  clickHandler2: () => void;
  clickHandler3: () => void;
  bclick1: () => void;
  bclick2: () => void;
}

export default function SwitchLabels(Props: IToggleProps) {
  const useStyles = makeStyles(theme => ({
    listItem: {
      paddingLeft: 0,
      paddingRight: 0
    },
    listItemText: {
      fontSize: '0.85rem'
    }
  }));
  const classes = useStyles();

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
    <List dense disablePadding>
      <ListItem className={classes.listItem}>
        <ListItemText
          primary="Auto-rotate"
          classes={{ primary: classes.listItemText }}
        />
        <ListItemSecondaryAction>
          <Switch
            size="small"
            checked={state.checkedA}
            onChange={handleChange}
            name="checkedA"
          />
        </ListItemSecondaryAction>
      </ListItem>
      <Divider component="li" />
      <ListItem className={classes.listItem}>
        <ListItemText
          primary="Positive Isosurface"
          classes={{ primary: classes.listItemText }}
        />
        <ListItemSecondaryAction>
          <Switch
            size="small"
            checked={state.checkedB}
            onChange={handleChange}
            name="checkedB"
            color="primary"
          />
        </ListItemSecondaryAction>
      </ListItem>
      <ListItem className={classes.listItem}>
        <ListItemText
          primary="Negative Isosurface"
          classes={{ primary: classes.listItemText }}
        />
        <ListItemSecondaryAction>
          <Switch
            size="small"
            checked={state.checkedC}
            onChange={handleChange}
            name="checkedC"
            color="secondary"
          />
        </ListItemSecondaryAction>
      </ListItem>
      <Divider component="li" />
      <ListItem className={classes.listItem}>
        <ListItemText
          primary="Show Structure"
          classes={{ primary: classes.listItemText }}
        />
        <ListItemSecondaryAction>
          <Switch
            size="small"
            checked={state.checkedS}
            onChange={handleClick1}
            name="checkedS"
          />
        </ListItemSecondaryAction>
      </ListItem>
      <ListItem className={classes.listItem}>
        <ListItemText
          primary="Show Isosurface"
          classes={{ primary: classes.listItemText }}
        />
        <ListItemSecondaryAction>
          <Switch
            size="small"
            checked={state.checkedI}
            onChange={handleClick2}
            name="checkedI"
          />
        </ListItemSecondaryAction>
      </ListItem>
    </List>
  );
}
