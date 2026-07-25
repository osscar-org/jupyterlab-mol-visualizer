import React from 'react';
import Switch from '@material-ui/core/Switch';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import Divider from '@material-ui/core/Divider';
import { makeStyles } from '@material-ui/core/styles';

interface IToggleProps {
  autoRotate: boolean;
  positiveIsosurfaceVisible: boolean;
  negativeIsosurfaceVisible: boolean;
  structureVisible: boolean;
  isosurfaceVisible: boolean;
  onAutoRotateChange: (checked: boolean) => void;
  onPositiveIsosurfaceChange: (checked: boolean) => void;
  onNegativeIsosurfaceChange: (checked: boolean) => void;
  onStructureChange: (checked: boolean) => void;
  onIsosurfaceChange: (checked: boolean) => void;
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
            checked={Props.autoRotate}
            onChange={event => Props.onAutoRotateChange(event.target.checked)}
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
            checked={Props.positiveIsosurfaceVisible}
            onChange={event =>
              Props.onPositiveIsosurfaceChange(event.target.checked)
            }
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
            checked={Props.negativeIsosurfaceVisible}
            onChange={event =>
              Props.onNegativeIsosurfaceChange(event.target.checked)
            }
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
            checked={Props.structureVisible}
            onChange={event => Props.onStructureChange(event.target.checked)}
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
            checked={Props.isosurfaceVisible}
            onChange={event => Props.onIsosurfaceChange(event.target.checked)}
            name="checkedI"
          />
        </ListItemSecondaryAction>
      </ListItem>
    </List>
  );
}
