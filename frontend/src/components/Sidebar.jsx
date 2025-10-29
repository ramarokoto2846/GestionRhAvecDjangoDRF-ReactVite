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
  Badge,
  Chip,
  Typography
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
  ];

  // Vérifier si on est dans une section statistiques
  const isStatsSection = location.pathname.startsWith('/statistiques');

  const drawerContent = (
    <>
      <Toolbar />
      <Divider />
      <List sx={{ px: 1 }}>
        {menuItems.map(item => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton 
              component={Link} 
              to={item.path}
              selected={location.pathname === item.path}
              sx={{
                borderRadius: 2,
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  }
                },
                '&:hover': {
                  backgroundColor: 'action.hover',
                }
              }}
            >
              <ListItemIcon sx={{ 
                color: location.pathname === item.path ? 'white' : 'text.secondary',
                minWidth: 40
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                primaryTypographyProps={{
                  fontWeight: location.pathname === item.path ? '600' : 'normal',
                  fontSize: '0.9rem'
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
        
        <Divider sx={{ my: 2 }}>
          <Chip 
            label="ANALYTIQUES" 
            size="small" 
            sx={{ 
              backgroundColor: 'grey.100',
              color: 'text.secondary',
              fontWeight: '600',
              fontSize: '0.7rem'
            }} 
          />
        </Divider>
        
        {/* Section Statistiques */}
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton 
            onClick={handleStatsClick}
            selected={isStatsSection}
            sx={{
              borderRadius: 2,
              '&.Mui-selected': {
                backgroundColor: 'success.light',
                color: 'success.dark',
                '&:hover': {
                  backgroundColor: 'success.main',
                  color: 'white'
                },
                '& .MuiListItemIcon-root': {
                  color: 'inherit',
                }
              },
              '&:hover': {
                backgroundColor: 'action.hover',
              }
            }}
          >
            <ListItemIcon sx={{ 
              color: isStatsSection ? 'inherit' : 'text.secondary',
              minWidth: 40
            }}>
              <AnalyticsIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Statistiques" 
              primaryTypographyProps={{
                fontWeight: isStatsSection ? '600' : 'normal',
                fontSize: '0.9rem'
              }}
            />
            {statsOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        
        <Collapse in={statsOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding sx={{ pl: 1 }}>
            {statsItems.map((item) => (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton 
                  component={Link} 
                  to={item.path}
                  selected={location.pathname === item.path}
                  sx={{
                    borderRadius: 2,
                    pl: 3,
                    '&.Mui-selected': {
                      backgroundColor: 'success.main',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'success.dark',
                      },
                      '& .MuiListItemIcon-root': {
                        color: 'white',
                      }
                    },
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    }
                  }}
                >
                  <ListItemIcon sx={{ 
                    minWidth: 35,
                    color: location.pathname === item.path ? 'white' : 'text.secondary'
                  }}>
                    {item.badge ? (
                      <Badge 
                        badgeContent={item.badge} 
                        color="primary" 
                        size="small"
                        sx={{
                          '& .MuiBadge-badge': {
                            fontSize: '0.5rem',
                            height: '14px',
                            minWidth: '14px',
                            backgroundColor: 'primary.main'
                          }
                        }}
                      >
                        {item.icon}
                      </Badge>
                    ) : (
                      item.icon
                    )}
                  </ListItemIcon>
                  <Box sx={{ flex: 1 }}>
                    <ListItemText 
                      primary={item.text}
                      primaryTypographyProps={{
                        fontSize: '0.85rem',
                        fontWeight: location.pathname === item.path ? '600' : 'normal'
                      }}
                    />
                    {item.description && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: location.pathname === item.path ? 'white' : 'text.disabled',
                          lineHeight: 1.2,
                          display: 'block',
                          mt: 0.2
                        }}
                      >
                        {item.description}
                      </Typography>
                    )}
                  </Box>
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
            backgroundColor: 'background.default',
            borderRight: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
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