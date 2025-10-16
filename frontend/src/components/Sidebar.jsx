import React from "react";
import { 
  Box, 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Divider, 
  Toolbar,
  Collapse,
  Badge
} from "@mui/material";
import { Link, useLocation } from "react-router-dom";
import {
  Home as HomeIcon,
  Apartment as ApartmentIcon,
  People as PeopleIcon,
  AccessTime as AccessTimeIcon,
  BeachAccess as BeachAccessIcon,
  Block as BlockIcon,
  EventAvailable as EventAvailableIcon,
  Analytics as AnalyticsIcon,
  ExpandLess,
  ExpandMore,
  Person as PersonIcon,
  Groups as GroupsIcon,
  Public as PublicIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Timeline as TimelineIcon
} from "@mui/icons-material";

const Sidebar = ({ open, setOpen }) => {
  const location = useLocation();
  const [statsOpen, setStatsOpen] = React.useState(false);
  
  const handleStatsClick = () => {
    setStatsOpen(!statsOpen);
  };

  const menuItems = [
    { text: "Accueil", path: "/Home", icon: <HomeIcon /> },
    { text: "Départements", path: "/departements", icon: <ApartmentIcon /> },
    { text: "Employés", path: "/employes", icon: <PeopleIcon /> },
    { text: "Pointages", path: "/pointages", icon: <AccessTimeIcon /> },
    { text: "Congés", path: "/conges", icon: <BeachAccessIcon /> },
    { text: "Absences", path: "/absences", icon: <BlockIcon /> },
    { text: "Événements", path: "/evenements", icon: <EventAvailableIcon /> }
  ];

  const statsItems = [
    { 
      text: "Vue d'ensemble", 
      path: "/statistiques/overview", 
      icon: <AnalyticsIcon />,
      badge: "Global"
    },
    { 
      text: "Par Employé", 
      path: "/statistiques/employes", 
      icon: <PersonIcon />,
      description: "Statistiques individuelles"
    },
    { 
      text: "Par Département", 
      path: "/statistiques/departements", 
      icon: <GroupsIcon />,
      description: "Analyse par service"
    },
    { 
      text: "Analyses Détaillées", 
      path: "/statistiques/analyses", 
      icon: <BarChartIcon />,
      description: "Congés, pointages, absences"
    },
    { 
      text: "Rapports PDF", 
      path: "/statistiques/rapports", 
      icon: <PieChartIcon />,
      badge: "Export"
    },
    { 
      text: "Historique", 
      path: "/statistiques/historique", 
      icon: <TimelineIcon />,
      description: "Données sauvegardées"
    }
  ];

  // Vérifier si on est dans une section statistiques
  const isStatsSection = location.pathname.startsWith('/statistiques');

  const drawerContent = (
    <>
      <Toolbar />
      <Divider />
      <List>
        {menuItems.map(item => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton 
              component={Link} 
              to={item.path}
              selected={location.pathname === item.path}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'primary.light',
                  '&:hover': {
                    backgroundColor: 'primary.main',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ color: location.pathname === item.path ? 'primary.main' : 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                primaryTypographyProps={{
                  fontWeight: location.pathname === item.path ? 'bold' : 'normal'
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
        
        <Divider sx={{ my: 1 }} />
        
        {/* Section Statistiques */}
        <ListItem disablePadding>
          <ListItemButton 
            onClick={handleStatsClick}
            selected={isStatsSection}
            sx={{
              '&.Mui-selected': {
                backgroundColor: 'secondary.light',
                '&:hover': {
                  backgroundColor: 'secondary.main',
                },
              },
            }}
          >
            <ListItemIcon sx={{ color: isStatsSection ? 'secondary.main' : 'inherit' }}>
              <AnalyticsIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Statistiques" 
              primaryTypographyProps={{
                fontWeight: isStatsSection ? 'bold' : 'normal'
              }}
            />
            {statsOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        
        <Collapse in={statsOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {statsItems.map((item) => (
              <ListItem key={item.text} disablePadding sx={{ pl: 3 }}>
                <ListItemButton 
                  component={Link} 
                  to={item.path}
                  selected={location.pathname === item.path}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: 'secondary.light',
                      '&:hover': {
                        backgroundColor: 'secondary.main',
                      },
                    },
                    pl: 3,
                  }}
                >
                  <ListItemIcon sx={{ 
                    minWidth: 40,
                    color: location.pathname === item.path ? 'secondary.main' : 'inherit' 
                  }}>
                    {item.badge ? (
                      <Badge 
                        badgeContent={item.badge} 
                        color="primary" 
                        variant="dot"
                        sx={{
                          '& .MuiBadge-badge': {
                            fontSize: '0.6rem',
                            height: '16px',
                            minWidth: '16px',
                          }
                        }}
                      >
                        {item.icon}
                      </Badge>
                    ) : (
                      item.icon
                    )}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text}
                    secondary={item.description}
                    primaryTypographyProps={{
                      fontSize: '0.9rem',
                      fontWeight: location.pathname === item.path ? 'bold' : 'normal'
                    }}
                    secondaryTypographyProps={{
                      fontSize: '0.7rem',
                      lineHeight: 1.2
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Collapse>
      </List>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <Drawer 
        variant="permanent" 
        sx={{ 
          width: 280, 
          flexShrink: 0, 
          [`& .MuiDrawer-paper`]: { 
            width: 280, 
            boxSizing: "border-box",
            backgroundColor: 'background.paper',
            backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))',
          }, 
          display: { xs: "none", md: "block" } 
        }} 
        open
      >
        {drawerContent}
      </Drawer>

      {/* Mobile Drawer */}
      <Drawer 
        anchor="left" 
        open={open} 
        onClose={() => setOpen(false)} 
        sx={{ display: { md: "none" } }}
      >
        <Box sx={{ width: 280 }}>
          {drawerContent}
        </Box>
      </Drawer>
    </>
  );
};

export default Sidebar;