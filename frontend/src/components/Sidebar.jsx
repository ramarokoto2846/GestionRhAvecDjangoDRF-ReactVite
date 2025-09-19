import React from "react";
import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider, Toolbar } from "@mui/material";
import { Link, useLocation } from "react-router-dom";
import {
  Home as HomeIcon,
  Apartment as ApartmentIcon,
  People as PeopleIcon,
  AccessTime as AccessTimeIcon,
  BeachAccess as BeachAccessIcon,
  Block as BlockIcon,
  EventAvailable as EventAvailableIcon
} from "@mui/icons-material";

const Sidebar = ({ open, setOpen }) => {
  const location = useLocation();
  
  const menuItems = [
    { text: "Accueil", path: "/Home", icon: <HomeIcon /> },
    { text: "Départements", path: "/departements", icon: <ApartmentIcon /> },
    { text: "Employés", path: "/employes", icon: <PeopleIcon /> },
    { text: "Pointages", path: "/pointages", icon: <AccessTimeIcon /> },
    { text: "Congés", path: "/conges", icon: <BeachAccessIcon /> },
    { text: "Absences", path: "/absences", icon: <BlockIcon /> },
    { text: "Événements", path: "/evenements", icon: <EventAvailableIcon /> }
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <Drawer 
        variant="permanent" 
        sx={{ 
          width: 240, 
          flexShrink: 0, 
          [`& .MuiDrawer-paper`]: { 
            width: 240, 
            boxSizing: "border-box" 
          }, 
          display: { xs: "none", md: "block" } 
        }} 
        open
      >
        <Toolbar />
        <Divider />
        <List>
          {menuItems.map(item => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton 
                component={Link} 
                to={item.path} 
                selected={location.pathname === item.path}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text}/>
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Mobile Drawer */}
      <Drawer 
        anchor="left" 
        open={open} 
        onClose={() => setOpen(false)} 
        sx={{ display: { md: "none" } }}
      >
        <Box sx={{ width: 240 }}>
          <List>
            {menuItems.map(item => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton 
                  component={Link} 
                  to={item.path} 
                  onClick={() => setOpen(false)} 
                  selected={location.pathname === item.path}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text}/>
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </>
  );
};

export default Sidebar;