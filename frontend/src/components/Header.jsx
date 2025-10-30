import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  IconButton,
  Badge,
  Avatar,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  alpha,
  useTheme,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText as ListItemTextDrawer,
  Divider
} from "@mui/material";
import {
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  Event as EventIcon,
  Warning as WarningIcon,
  BeachAccess as BeachAccessIcon,
  AccessTime as AccessTimeIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  BarChart as BarChartIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Home as HomeIcon,
  Apartment as ApartmentIcon
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import { getConges, getEmployes, getEvenements, getPointages } from "../services/api";

// Définition des couleurs ORTM
const ORTM_COLORS = {
  primary: "#1B5E20",      // Vert ORTM
  secondary: "#F9A825",    // Jaune doré
  background: "#F5F5F5",   // Gris clair
  text: "#212121",         // Noir anthracite
  white: "#FFFFFF"         // Blanc
};

// Import du logo ORTM
import ortmLogo from "./ortm.webp";

// Global refresh trigger
let refreshNotificationsCallback = null;

export const triggerNotificationsRefresh = () => {
  if (refreshNotificationsCallback) {
    refreshNotificationsCallback();
  }
};

const Header = ({ user, onMenuToggle, onLogoutCheck }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState(null);
  const [statsAnchorEl, setStatsAnchorEl] = useState(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Expose refresh function globally
  useEffect(() => {
    refreshNotificationsCallback = () => {
      setRefreshTrigger(prev => prev + 1);
    };
    return () => {
      refreshNotificationsCallback = null;
    };
  }, []);

  const handleLogout = async () => {
    // ✅ VÉRIFICATION DES POINTAGES EN COURS AVANT DÉCONNEXION
    try {
      const pointagesData = await getPointages();
      const pointagesEnCours = pointagesData.filter(p => !p.heure_sortie);
      
      if (pointagesEnCours.length > 0) {
        const result = await Swal.fire({
          title: 'Pointages en cours détectés',
          html: `
            <div style="text-align: center;">
              <div style="font-size: 48px; color: ${ORTM_COLORS.secondary}; margin-bottom: 20px;">⚠️</div>
              <p style="font-size: 18px; margin-bottom: 10px;">
                <strong>${pointagesEnCours.length} pointage(s) en cours</strong>
              </p>
              <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <p>Il y a encore des employés qui n'ont pas enregistré leur heure de sortie.</p>
                <p><strong>Voulez-vous vraiment vous déconnecter ?</strong></p>
              </div>
            </div>
          `,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: ORTM_COLORS.primary,
          cancelButtonColor: ORTM_COLORS.secondary,
          confirmButtonText: 'Oui, se déconnecter',
          cancelButtonText: 'Annuler et vérifier',
          width: 500
        });

        if (!result.isConfirmed) {
          navigate("/pointages");
          return;
        }
      }

      Swal.fire({
        title: "Déconnexion",
        text: "Voulez-vous vraiment vous déconnecter ?",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: ORTM_COLORS.primary,
        cancelButtonColor: ORTM_COLORS.secondary,
        confirmButtonText: "Oui, déconnexion",
        cancelButtonText: "Annuler",
        reverseButtons: true
      }).then(result => {
        if (result.isConfirmed) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          navigate("/");
        }
      });

    } catch (error) {
      console.error("Erreur lors de la vérification des pointages:", error);
      Swal.fire({
        title: "Déconnexion",
        text: "Voulez-vous vraiment vous déconnecter ?",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: ORTM_COLORS.primary,
        cancelButtonColor: ORTM_COLORS.secondary,
        confirmButtonText: "Oui, déconnexion",
        cancelButtonText: "Annuler",
        reverseButtons: true
      }).then(result => {
        if (result.isConfirmed) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          navigate("/");
        }
      });
    }
  };

  const handleNotificationsClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setAnchorEl(null);
  };

  const handleSettingsClick = (event) => {
    setSettingsAnchorEl(event.currentTarget);
  };

  const handleSettingsClose = () => {
    setSettingsAnchorEl(null);
  };

  const handleStatsClick = (event) => {
    setStatsAnchorEl(event.currentTarget);
  };

  const handleStatsClose = () => {
    setStatsAnchorEl(null);
  };

  const handleMobileDrawerToggle = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setMobileDrawerOpen(false);
    handleStatsClose();
  };

  const handleNotificationClick = (type) => {
    handleNotificationsClose();
    if (type === "employes_inactifs") navigate("/employes");
    else if (type === "conges") navigate("/conges");
    else if (type === "evenements") navigate("/evenements");
    else if (type === "pointages") navigate("/pointages");
  };

  // Fetch notifications in parallel
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!localStorage.getItem("access_token")) {
        setNotifications([]);
        setNotificationsCount(0);
        return;
      }

      try {
        const [employesData, congesData, pointagesData, evenementsData] = await Promise.all([
          getEmployes().catch(() => []),
          getConges().catch(() => []),
          getPointages().catch(() => []),
          getEvenements().catch(() => []),
        ]);

        // Employés inactifs
        const employesInactifs = employesData.filter(emp => emp.statut === 'inactif');
        const employesNotification = employesInactifs.length > 0 ? [{
          type: "employes_inactifs",
          message: `${employesInactifs.length} employé${employesInactifs.length > 1 ? "s" : ""} inactif${employesInactifs.length > 1 ? "s" : ""}`,
          count: employesInactifs.length
        }] : [];

        // Congés en attente
        const congesEnAttente = congesData.filter(c => c.statut === 'en_attente');
        const congesNotification = congesEnAttente.length > 0 ? [{
          type: "conges",
          message: `${congesEnAttente.length} congé${congesEnAttente.length > 1 ? "s" : ""} en attente`,
          count: congesEnAttente.length
        }] : [];

        // Pointages en cours
        const pointagesEnCours = pointagesData.filter(p => !p.heure_sortie);
        const pointagesNotification = pointagesEnCours.length > 0 ? [{
          type: "pointages",
          message: `${pointagesEnCours.length} pointage${pointagesEnCours.length > 1 ? "s" : ""} en cours`,
          count: pointagesEnCours.length
        }] : [];

        // Événements à venir ou en cours
        const currentDate = new Date();
        const evenementsNonExpires = evenementsData.filter(e => new Date(e.date_fin) >= currentDate);
        const evenementsNotification = evenementsNonExpires.length > 0 ? [{
          type: "evenements",
          message: `${evenementsNonExpires.length} événement${evenementsNonExpires.length > 1 ? "s" : ""} à venir/en cours`,
          count: evenementsNonExpires.length
        }] : [];

        const allNotifications = [
          ...employesNotification,
          ...congesNotification,
          ...pointagesNotification,
          ...evenementsNotification,
        ];

        setNotifications(allNotifications);
        setNotificationsCount(allNotifications.length);
      } catch (error) {
        console.error("Erreur lors du chargement des notifications:", error.message);
        setNotifications([]);
        setNotificationsCount(0);
      }
    };

    fetchNotifications();
  }, [refreshTrigger]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case "conges": return <BeachAccessIcon sx={{ color: ORTM_COLORS.primary }} />;
      case "employes_inactifs": return <WarningIcon sx={{ color: ORTM_COLORS.secondary }} />;
      case "evenements": return <EventIcon sx={{ color: ORTM_COLORS.primary }} />;
      case "pointages": return <AccessTimeIcon sx={{ color: ORTM_COLORS.secondary }} />;
      default: return <NotificationsIcon />;
    }
  };

  // Navigation items
  const navItems = [
    { label: "Accueil", path: "/home", icon: <HomeIcon sx={{ mr: 1 }} /> },
    { label: "Employés", path: "/employes", icon: <PeopleIcon sx={{ mr: 1 }} /> },
    { label: "Départements", path: "/departements", icon: <ApartmentIcon sx={{ mr: 1 }} /> },
    { label: "Pointages", path: "/pointages", icon: <AccessTimeIcon sx={{ mr: 1 }} /> },
    { label: "Congés", path: "/conges", icon: <BeachAccessIcon sx={{ mr: 1 }} /> },
    { label: "Événements", path: "/evenements", icon: <EventIcon sx={{ mr: 1 }} /> },
  ];

  // Drawer content for mobile
  const drawerContent = (
    <Box sx={{ width: 280, bgcolor: ORTM_COLORS.background }} onClick={handleMobileDrawerToggle}>
      <Box sx={{ p: 2, borderBottom: `1px solid ${alpha(ORTM_COLORS.primary, 0.2)}`, bgcolor: ORTM_COLORS.white }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <img 
            src={ortmLogo} 
            alt="ORTM Logo" 
            style={{ 
              width: 80, 
              height: 80, 
              marginRight: 12,
              objectFit: 'contain'
            }} 
          />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: "bold", color: ORTM_COLORS.primary, fontSize: '1rem' }}>
              ORTM
            </Typography>
            <Typography variant="body2" sx={{ color: ORTM_COLORS.text, fontSize: '0.75rem' }}>
              Système RH
            </Typography>
          </Box>
        </Box>
      </Box>
      <List>
        {navItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton 
              onClick={() => handleNavigation(item.path)}
              selected={location.pathname === item.path}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: alpha(ORTM_COLORS.primary, 0.1),
                  color: ORTM_COLORS.primary,
                  borderRight: `3px solid ${ORTM_COLORS.primary}`
                }
              }}
            >
              <ListItemIcon sx={{ color: 'inherit' }}>
                {React.cloneElement(item.icon, { sx: { mr: 0 } })}
              </ListItemIcon>
              <ListItemTextDrawer primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
        
        {/* Statistiques submenu in drawer */}
        <ListItem disablePadding>
          <ListItemButton 
            onClick={handleStatsClick}
            selected={location.pathname.includes('/statistiques')}
            sx={{
              '&.Mui-selected': {
                backgroundColor: alpha(ORTM_COLORS.primary, 0.1),
                color: ORTM_COLORS.primary,
                borderRight: `3px solid ${ORTM_COLORS.primary}`
              }
            }}
          >
            <ListItemIcon sx={{ color: 'inherit' }}>
              <BarChartIcon />
            </ListItemIcon>
            <ListItemTextDrawer primary="Statistiques" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        bgcolor: ORTM_COLORS.white,
        color: ORTM_COLORS.text,
        borderBottom: `1px solid ${alpha(ORTM_COLORS.primary, 0.2)}`,
        zIndex: theme.zIndex.drawer + 1
      }}
    >
      <Toolbar>
        {/* Menu burger for mobile */}
        <IconButton 
          color="inherit" 
          onClick={handleMobileDrawerToggle}
          sx={{ 
            mr: 2, 
            display: { md: "none" },
            color: ORTM_COLORS.primary
          }}
        >
          <MenuIcon />
        </IconButton>

        {/* Logo ORTM à gauche */}
        <Box sx={{ display: "flex", alignItems: "center", cursor: 'pointer' }} onClick={() => navigate('/home')}>
          <img 
            src={ortmLogo} 
            alt="ORTM Logo" 
            style={{ 
              width: 45, 
              height: 45, 
              marginRight: 12,
              objectFit: 'contain'
            }} 
          />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: "bold", color: ORTM_COLORS.primary, lineHeight: 1.2 }}>
              ORTM
            </Typography>
            <Typography variant="body2" sx={{ color: ORTM_COLORS.text, fontSize: '0.75rem' }}>
              Système de Gestion RH
            </Typography>
          </Box>
        </Box>

        {/* Navigation au centre - Visible sur desktop */}
        <Box sx={{ 
          flexGrow: 1, 
          display: { xs: 'none', md: 'flex' }, 
          justifyContent: 'center',
          alignItems: 'center',
          gap: 1
        }}>
          {navItems.map((item) => (
            <Button
              key={item.path}
              onClick={() => navigate(item.path)}
              startIcon={item.icon}
              sx={{
                color: location.pathname === item.path ? ORTM_COLORS.primary : ORTM_COLORS.text,
                fontWeight: location.pathname === item.path ? 'bold' : 'normal',
                textTransform: 'none',
                borderRadius: 2,
                px: 2,
                '&:hover': {
                  bgcolor: alpha(ORTM_COLORS.primary, 0.1),
                },
                '& .MuiButton-startIcon': {
                  color: location.pathname === item.path ? ORTM_COLORS.primary : ORTM_COLORS.text,
                }
              }}
            >
              {item.label}
            </Button>
          ))}
          
          {/* Menu Statistiques avec sous-menu */}
          <Button
            onClick={handleStatsClick}
            startIcon={<BarChartIcon />}
            sx={{
              color: location.pathname.includes('/statistiques') ? ORTM_COLORS.primary : ORTM_COLORS.text,
              fontWeight: location.pathname.includes('/statistiques') ? 'bold' : 'normal',
              textTransform: 'none',
              borderRadius: 2,
              px: 2,
              '&:hover': {
                bgcolor: alpha(ORTM_COLORS.primary, 0.1),
              }
            }}
          >
            Statistiques
          </Button>

          <Menu
            anchorEl={statsAnchorEl}
            open={Boolean(statsAnchorEl)}
            onClose={handleStatsClose}
            PaperProps={{
              sx: {
                width: 280,
                mt: 1,
                borderRadius: 2,
                border: `1px solid ${alpha(ORTM_COLORS.primary, 0.2)}`
              }
            }}
          >
            <Box sx={{ p: 2, borderBottom: `1px solid ${alpha(ORTM_COLORS.primary, 0.2)}` }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", color: ORTM_COLORS.primary }}>
                Vues Statistiques
              </Typography>
            </Box>

            <MenuItem 
              onClick={() => handleNavigation("/statistiques/overview")}
              sx={{
                py: 2,
                borderBottom: `1px solid ${alpha(ORTM_COLORS.primary, 0.1)}`
              }}
            >
              <ListItemIcon>
                <TrendingUpIcon sx={{ color: ORTM_COLORS.primary }} />
              </ListItemIcon>
              <ListItemText
                primary="Vue Globale"
                secondary="Statistiques générales de l'entreprise"
                primaryTypographyProps={{ color: ORTM_COLORS.text }}
                secondaryTypographyProps={{ color: ORTM_COLORS.text }}
              />
            </MenuItem>

            <MenuItem 
              onClick={() => handleNavigation("/statistiques/employes")}
              sx={{ py: 2 }}
            >
              <ListItemIcon>
                <PeopleIcon sx={{ color: ORTM_COLORS.secondary }} />
              </ListItemIcon>
              <ListItemText
                primary="Vue par Employé"
                secondary="Statistiques individuelles des employés"
                primaryTypographyProps={{ color: ORTM_COLORS.text }}
                secondaryTypographyProps={{ color: ORTM_COLORS.text }}
              />
            </MenuItem>
          </Menu>
        </Box>

        {/* Notifications et profil à droite */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>

          <IconButton
            color="inherit"
            onClick={handleNotificationsClick}
            sx={{
              mr: 1,
              bgcolor: alpha(ORTM_COLORS.primary, 0.1),
              color: ORTM_COLORS.primary,
              "&:hover": { bgcolor: alpha(ORTM_COLORS.primary, 0.2) }
            }}
          >
            <Badge badgeContent={notificationsCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleNotificationsClose}
            PaperProps={{
              sx: {
                maxHeight: 400,
                width: 350,
                mt: 1,
                borderRadius: 2,
                border: `1px solid ${alpha(ORTM_COLORS.primary, 0.2)}`
              }
            }}
          >
            <Box sx={{ p: 2, borderBottom: `1px solid ${alpha(ORTM_COLORS.primary, 0.2)}` }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", color: ORTM_COLORS.primary }}>
                Notifications
              </Typography>
              <Typography variant="body2" sx={{ color: ORTM_COLORS.text }}>
                {notificationsCount} notification(s)
              </Typography>
            </Box>

            {notifications.length === 0 ? (
              <MenuItem sx={{ py: 2 }}>
                <ListItemIcon>
                  <NotificationsIcon sx={{ color: ORTM_COLORS.text }} />
                </ListItemIcon>
                <ListItemText
                  primary="Aucune notification"
                  secondary="Tout est à jour"
                  primaryTypographyProps={{ color: ORTM_COLORS.text }}
                  secondaryTypographyProps={{ color: ORTM_COLORS.text }}
                />
              </MenuItem>
            ) : (
              notifications.map((notification, index) => (
                <MenuItem
                  key={`${notification.type}-${index}`}
                  onClick={() => handleNotificationClick(notification.type)}
                  sx={{
                    py: 1.5,
                    borderBottom: index < notifications.length - 1 ? `1px solid ${alpha(ORTM_COLORS.primary, 0.1)}` : 'none'
                  }}
                >
                  <ListItemIcon>
                    {getNotificationIcon(notification.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={notification.message}
                    secondary="Cliquez pour voir les détails"
                    primaryTypographyProps={{ color: ORTM_COLORS.text }}
                    secondaryTypographyProps={{ color: ORTM_COLORS.text }}
                  />
                  <Badge
                    badgeContent={notification.count}
                    sx={{ 
                      ml: 1,
                      '& .MuiBadge-badge': {
                        backgroundColor: ORTM_COLORS.primary,
                        color: ORTM_COLORS.white
                      }
                    }}
                  />
                </MenuItem>
              ))
            )}
          </Menu>

          <IconButton
            onClick={handleSettingsClick}
            sx={{
              mr: 1,
              bgcolor: alpha(ORTM_COLORS.primary, 0.1),
              color: 'rgrayed',
              "&:hover": { bgcolor: 'gray' }
            }}
          >
            <SettingsIcon />
          </IconButton>

          <Menu
            anchorEl={settingsAnchorEl}
            open={Boolean(settingsAnchorEl)}
            onClose={handleSettingsClose}
            PaperProps={{
              sx: {
                width: 280,
                mt: 1,
                borderRadius: 2,
                border: `1px solid ${alpha(ORTM_COLORS.primary, 0.2)}`
              }
            }}
          >
            <Box sx={{ p: 2, borderBottom: `1px solid ${alpha(ORTM_COLORS.primary, 0.2)}` }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", color: ORTM_COLORS.primary }}>
                Informations utilisateur
              </Typography>
            </Box>

            {user && (
              <Box sx={{ p: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: ORTM_COLORS.primary, 
                      width: 48, 
                      height: 48, 
                      mr: 2,
                      fontWeight: "bold",
                      fontSize: "1.2rem"
                    }}
                  >
                    <PersonIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: ORTM_COLORS.text }}>
                      {user.nom || user.prenom ? `${user.prenom || ''} ${user.nom || ''}`.trim() : "Utilisateur"}
                    </Typography>
                    <Typography variant="body2" sx={{ color: ORTM_COLORS.text }}>
                      {user.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
                    </Typography>
                  </Box>
                </Box>

                {user.email && (
                  <Box sx={{ display: "flex", alignItems: "center", mt: 2 }}>
                    <EmailIcon sx={{ mr: 1.5, fontSize: 20, color: ORTM_COLORS.primary }} />
                    <Typography variant="body2" sx={{ color: ORTM_COLORS.text }}>
                      {user.email}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </Menu>

          <Button
            color="inherit"
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
            variant="outlined"
            size="small"
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: "medium",
              borderColor: ORTM_COLORS.primary,
              color: ORTM_COLORS.primary,
              '&:hover': {
                borderColor: ORTM_COLORS.secondary,
                backgroundColor: alpha(ORTM_COLORS.secondary, 0.1),
                color: ORTM_COLORS.secondary
              }
            }}
          >
            Déconnexion
          </Button>
        </Box>
      </Toolbar>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileDrawerOpen}
        onClose={handleMobileDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 280 },
        }}
      >
        {drawerContent}
      </Drawer>
    </AppBar>
  );
};

export default Header;