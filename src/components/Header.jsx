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
  Warning as WarningIcon,
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
import { getEmployes, getPointages } from "../services/api"; // RETIRER getEvenements

// Palette de couleurs ORTM améliorée
const ORTM_COLORS = {
  primary: "#1B5E20",           // Vert ORTM principal
  secondary: "#F9A825",         // Jaune doré
  accent: "#1565C0",            // Bleu pour les éléments d'action
  warning: "#D32F2F",           // Rouge pour les alertes
  background: "#F8F9FA",        // Gris très clair pour fond
  surface: "#FFFFFF",           // Blanc pour surfaces
  text: {
    primary: "#1A237E",         // Bleu foncé pour texte principal
    secondary: "#546E7A",       // Gris bleu pour texte secondaire
    light: "#78909C"           // Gris clair pour texte tertiaire
  }
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
              <div style="font-size: 48px; color: ${ORTM_COLORS.warning}; margin-bottom: 20px;">⚠️</div>
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
          confirmButtonColor: ORTM_COLORS.warning,
          cancelButtonColor: ORTM_COLORS.text.secondary,
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
        confirmButtonColor: ORTM_COLORS.warning,
        cancelButtonColor: ORTM_COLORS.text.secondary,
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
        confirmButtonColor: ORTM_COLORS.warning,
        cancelButtonColor: ORTM_COLORS.text.secondary,
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
        const [employesData, pointagesData] = await Promise.all([
          getEmployes().catch(() => []),
          getPointages().catch(() => []),
        ]);

        // Employés inactifs
        const employesInactifs = employesData.filter(emp => emp.statut === 'inactif');
        const employesNotification = employesInactifs.length > 0 ? [{
          type: "employes_inactifs",
          message: `${employesInactifs.length} employé${employesInactifs.length > 1 ? "s" : ""} inactif${employesInactifs.length > 1 ? "s" : ""}`,
          count: employesInactifs.length
        }] : [];

        // Pointages en cours
        const pointagesEnCours = pointagesData.filter(p => !p.heure_sortie);
        const pointagesNotification = pointagesEnCours.length > 0 ? [{
          type: "pointages",
          message: `${pointagesEnCours.length} pointage${pointagesEnCours.length > 1 ? "s" : ""} en cours`,
          count: pointagesEnCours.length
        }] : [];

        // RETIRER LA SECTION DES ÉVÉNEMENTS
        const allNotifications = [
          ...employesNotification,
          ...pointagesNotification,
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
      case "employes_inactifs": return <WarningIcon sx={{ color: ORTM_COLORS.warning }} />;
      case "pointages": return <AccessTimeIcon sx={{ color: ORTM_COLORS.primary }} />;
      default: return <NotificationsIcon />;
    }
  };

  // Navigation items - RETIRER "Événements"
  const navItems = [
    { label: "Employés", path: "/employes", icon: <PeopleIcon sx={{ mr: 1 }} /> },
    { label: "Départements", path: "/departements", icon: <ApartmentIcon sx={{ mr: 1 }} /> },
    { label: "Pointages", path: "/pointages", icon: <AccessTimeIcon sx={{ mr: 1 }} /> },
    // RETIRER: { label: "Événements", path: "/evenements", icon: <EventIcon sx={{ mr: 1 }} /> },
  ];

  // Drawer content for mobile
  const drawerContent = (
    <Box sx={{ width: 280, bgcolor: ORTM_COLORS.background }} onClick={handleMobileDrawerToggle}>
      <Box sx={{ p: 2, borderBottom: `1px solid ${alpha(ORTM_COLORS.primary, 0.1)}`, bgcolor: ORTM_COLORS.surface }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }} onClick={() => navigate('/statistiques/overview')}>
          <img 
            src={ortmLogo} 
            alt="ORTM Logo" 
            style={{ 
              width: 100,
              height: 100,
              marginRight: 12,
              objectFit: 'contain'
            }} 
          />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: "bold", color: ORTM_COLORS.primary, fontSize: '1.1rem' }}>
              ORTM Madagascar
            </Typography>
            <Typography variant="body2" sx={{ color: ORTM_COLORS.text.secondary, fontSize: '0.8rem' }}>
              Système de Gestion RH
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
                  backgroundColor: alpha(ORTM_COLORS.accent, 0.1),
                  color: ORTM_COLORS.accent,
                  borderRight: `3px solid ${ORTM_COLORS.accent}`
                },
                '&:hover': {
                  backgroundColor: alpha(ORTM_COLORS.primary, 0.05),
                }
              }}
            >
              <ListItemIcon sx={{ color: 'inherit' }}>
                {React.cloneElement(item.icon, { sx: { mr: 0 } })}
              </ListItemIcon>
              <ListItemTextDrawer 
                primary={item.label} 
                primaryTypographyProps={{ 
                  fontWeight: location.pathname === item.path ? 'bold' : 'normal'
                }}
              />
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
                backgroundColor: alpha(ORTM_COLORS.accent, 0.1),
                color: ORTM_COLORS.accent,
                borderRight: `3px solid ${ORTM_COLORS.accent}`
              },
              '&:hover': {
                backgroundColor: alpha(ORTM_COLORS.primary, 0.05),
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
      elevation={1}
      sx={{
        bgcolor: ORTM_COLORS.surface,
        color: ORTM_COLORS.text.primary,
        borderBottom: `2px solid ${alpha(ORTM_COLORS.primary, 0.2)}`,
        zIndex: theme.zIndex.drawer + 1,
        backdropFilter: 'blur(10px)',
        background: `linear-gradient(135deg, ${ORTM_COLORS.surface} 0%, ${alpha(ORTM_COLORS.background, 0.8)} 100%)`
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
            color: ORTM_COLORS.primary,
            '&:hover': {
              backgroundColor: alpha(ORTM_COLORS.primary, 0.1)
            }
          }}
        >
          <MenuIcon />
        </IconButton>

        {/* Logo ORTM à gauche - Logo agrandi */}
        <Box sx={{ display: "flex", alignItems: "center", cursor: 'pointer' }} onClick={() => navigate('/statistiques/overview')}>
          <img 
            src={ortmLogo} 
            alt="ORTM Logo" 
            style={{ 
              width: 60,
              height: 60,
              marginRight: 16,
              objectFit: 'contain'
            }} 
          />
          <Box>
            <Typography variant="h6" sx={{ 
              fontWeight: "bold", 
              color: ORTM_COLORS.primary, 
              lineHeight: 1.2,
              fontSize: '1.3rem'
            }}>
              ORTM
            </Typography>
            <Typography variant="body2" sx={{ 
              color: ORTM_COLORS.text.secondary, 
              fontSize: '0.8rem',
              fontWeight: 500
            }}>
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
          gap: 0.5
        }}>
          {navItems.map((item) => (
            <Button
              key={item.path}
              startIcon={item.icon}
              onClick={() => handleNavigation(item.path)}
              sx={{
                color: location.pathname === item.path ? ORTM_COLORS.accent : ORTM_COLORS.text.secondary,
                fontWeight: location.pathname === item.path ? 'bold' : 'normal',
                textTransform: 'none',
                borderRadius: 3,
                px: 2,
                py: 1,
                minWidth: 'auto',
                fontSize: '0.9rem',
                '&:hover': {
                  bgcolor: alpha(ORTM_COLORS.accent, 0.08),
                  color: ORTM_COLORS.accent,
                  transform: 'translateY(-1px)',
                  boxShadow: `0 2px 8px ${alpha(ORTM_COLORS.accent, 0.2)}`
                },
                '& .MuiButton-startIcon': {
                  color: location.pathname === item.path ? ORTM_COLORS.accent : ORTM_COLORS.text.secondary,
                },
                transition: 'all 0.2s ease-in-out'
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
              color: location.pathname.includes('/statistiques') ? ORTM_COLORS.accent : ORTM_COLORS.text.secondary,
              fontWeight: location.pathname.includes('/statistiques') ? 'bold' : 'normal',
              textTransform: 'none',
              borderRadius: 3,
              px: 2,
              py: 1,
              minWidth: 'auto',
              fontSize: '0.9rem',
              '&:hover': {
                bgcolor: alpha(ORTM_COLORS.accent, 0.08),
                color: ORTM_COLORS.accent,
                transform: 'translateY(-1px)',
                boxShadow: `0 2px 8px ${alpha(ORTM_COLORS.accent, 0.2)}`
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
                width: 300,
                mt: 1.5,
                borderRadius: 3,
                border: `1px solid ${alpha(ORTM_COLORS.primary, 0.1)}`,
                boxShadow: `0 8px 32px ${alpha(ORTM_COLORS.primary, 0.1)}`
              }
            }}
          >
            <Box sx={{ p: 2, borderBottom: `1px solid ${alpha(ORTM_COLORS.primary, 0.1)}` }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", color: ORTM_COLORS.primary }}>
                Vues Statistiques
              </Typography>
              <Typography variant="body2" sx={{ color: ORTM_COLORS.text.secondary, mt: 0.5 }}>
                Analyses et rapports
              </Typography>
            </Box>

            <MenuItem 
              onClick={() => handleNavigation("/statistiques/overview")}
              sx={{
                py: 2,
                borderBottom: `1px solid ${alpha(ORTM_COLORS.primary, 0.05)}`,
                '&:hover': {
                  backgroundColor: alpha(ORTM_COLORS.accent, 0.08)
                }
              }}
            >
              <ListItemIcon>
                <TrendingUpIcon sx={{ color: ORTM_COLORS.accent, fontSize: 28 }} />
              </ListItemIcon>
              <ListItemText
                primary="Vue Globale"
                secondary="Statistiques générales de l'entreprise"
                primaryTypographyProps={{ 
                  color: ORTM_COLORS.text.primary,
                  fontWeight: 'medium'
                }}
                secondaryTypographyProps={{ 
                  color: ORTM_COLORS.text.secondary,
                  fontSize: '0.8rem'
                }}
              />
            </MenuItem>

            <MenuItem 
              onClick={() => handleNavigation("/statistiques/employes")}
              sx={{ 
                py: 2,
                '&:hover': {
                  backgroundColor: alpha(ORTM_COLORS.accent, 0.08)
                }
              }}
            >
              <ListItemIcon>
                <PeopleIcon sx={{ color: ORTM_COLORS.secondary, fontSize: 28 }} />
              </ListItemIcon>
              <ListItemText
                primary="Vue par Employé"
                secondary="Statistiques individuelles des employés"
                primaryTypographyProps={{ 
                  color: ORTM_COLORS.text.primary,
                  fontWeight: 'medium'
                }}
                secondaryTypographyProps={{ 
                  color: ORTM_COLORS.text.secondary,
                  fontSize: '0.8rem'
                }}
              />
            </MenuItem>
          </Menu>
        </Box>

        {/* Notifications et profil à droite */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>

          {/* Notifications */}
          <IconButton
            color="inherit"
            onClick={handleNotificationsClick}
            sx={{
              position: 'relative',
              bgcolor: alpha(ORTM_COLORS.accent, 0.1),
              color: ORTM_COLORS.accent,
              "&:hover": { 
                bgcolor: alpha(ORTM_COLORS.accent, 0.2),
                transform: 'scale(1.05)'
              },
              transition: 'all 0.2s ease-in-out',
              width: 48,
              height: 48
            }}
          >
            <Badge 
              badgeContent={notificationsCount} 
              color="error"
              sx={{
                '& .MuiBadge-badge': {
                  backgroundColor: ORTM_COLORS.warning,
                  color: ORTM_COLORS.surface,
                  fontWeight: 'bold'
                }
              }}
            >
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
                width: 380,
                mt: 1.5,
                borderRadius: 3,
                border: `1px solid ${alpha(ORTM_COLORS.primary, 0.1)}`,
                boxShadow: `0 8px 32px ${alpha(ORTM_COLORS.primary, 0.1)}`
              }
            }}
          >
            <Box sx={{ p: 2, borderBottom: `1px solid ${alpha(ORTM_COLORS.primary, 0.1)}` }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", color: ORTM_COLORS.primary }}>
                Notifications
              </Typography>
              <Typography variant="body2" sx={{ color: ORTM_COLORS.text.secondary }}>
                {notificationsCount} notification(s) en attente
              </Typography>
            </Box>

            {notifications.length === 0 ? (
              <MenuItem sx={{ py: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <NotificationsIcon sx={{ color: ORTM_COLORS.text.light, fontSize: 48, mb: 2 }} />
                <ListItemText
                  primary="Aucune notification"
                  secondary="Tout est à jour dans votre système"
                  primaryTypographyProps={{ 
                    color: ORTM_COLORS.text.primary,
                    textAlign: 'center',
                    fontWeight: 'medium'
                  }}
                  secondaryTypographyProps={{ 
                    color: ORTM_COLORS.text.secondary,
                    textAlign: 'center'
                  }}
                />
              </MenuItem>
            ) : (
              notifications.map((notification, index) => (
                <MenuItem
                  key={`${notification.type}-${index}`}
                  onClick={() => handleNotificationClick(notification.type)}
                  sx={{
                    py: 2,
                    borderBottom: index < notifications.length - 1 ? `1px solid ${alpha(ORTM_COLORS.primary, 0.05)}` : 'none',
                    '&:hover': {
                      backgroundColor: alpha(ORTM_COLORS.accent, 0.08)
                    }
                  }}
                >
                  <ListItemIcon>
                    {getNotificationIcon(notification.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={notification.message}
                    secondary="Cliquez pour voir les détails"
                    primaryTypographyProps={{ 
                      color: ORTM_COLORS.text.primary,
                      fontWeight: 'medium'
                    }}
                    secondaryTypographyProps={{ 
                      color: ORTM_COLORS.text.secondary,
                      fontSize: '0.8rem'
                    }}
                  />
                  <Badge
                    badgeContent={notification.count}
                    sx={{ 
                      ml: 1,
                      '& .MuiBadge-badge': {
                        backgroundColor: ORTM_COLORS.accent,
                        color: ORTM_COLORS.surface,
                        fontWeight: 'bold'
                      }
                    }}
                  />
                </MenuItem>
              ))
            )}
          </Menu>

          {/* Paramètres */}
          <IconButton
            onClick={handleSettingsClick}
            sx={{
              bgcolor: alpha(ORTM_COLORS.text.secondary, 0.1),
              color: ORTM_COLORS.text.secondary,
              "&:hover": { 
                bgcolor: alpha(ORTM_COLORS.text.secondary, 0.2),
                transform: 'scale(1.05)'
              },
              transition: 'all 0.2s ease-in-out',
              width: 48,
              height: 48
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
                width: 320,
                mt: 1.5,
                borderRadius: 3,
                border: `1px solid ${alpha(ORTM_COLORS.primary, 0.1)}`,
                boxShadow: `0 8px 32px ${alpha(ORTM_COLORS.primary, 0.1)}`
              }
            }}
          >
            <Box sx={{ p: 2, borderBottom: `1px solid ${alpha(ORTM_COLORS.primary, 0.1)}` }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", color: ORTM_COLORS.primary }}>
                Profil Utilisateur
              </Typography>
            </Box>

            {user && (
              <Box sx={{ p: 2.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: ORTM_COLORS.accent, 
                      width: 56, 
                      height: 56, 
                      mr: 2.5,
                      fontWeight: "bold",
                      fontSize: "1.3rem",
                      boxShadow: `0 4px 12px ${alpha(ORTM_COLORS.accent, 0.3)}`
                    }}
                  >
                    <PersonIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" sx={{ 
                      fontWeight: "bold", 
                      color: ORTM_COLORS.text.primary,
                      fontSize: '1.1rem'
                    }}>
                      {user.nom || user.prenom ? `${user.prenom || ''} ${user.nom || ''}`.trim() : "Utilisateur"}
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: ORTM_COLORS.text.secondary,
                      backgroundColor: alpha(ORTM_COLORS.primary, 0.1),
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 2,
                      display: 'inline-block',
                      fontWeight: 'medium'
                    }}>
                      {user.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
                    </Typography>
                  </Box>
                </Box>

                {user.email && (
                  <Box sx={{ 
                    display: "flex", 
                    alignItems: "center", 
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: alpha(ORTM_COLORS.background, 0.5),
                    border: `1px solid ${alpha(ORTM_COLORS.primary, 0.1)}`
                  }}>
                    <EmailIcon sx={{ mr: 2, fontSize: 22, color: ORTM_COLORS.accent }} />
                    <Box>
                      <Typography variant="body2" sx={{ 
                        color: ORTM_COLORS.text.secondary,
                        fontSize: '0.8rem'
                      }}>
                        Email
                      </Typography>
                      <Typography variant="body1" sx={{ 
                        color: ORTM_COLORS.text.primary,
                        fontWeight: 'medium'
                      }}>
                        {user.email}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            )}
          </Menu>

          {/* Bouton Déconnexion */}
          <Button
            color="inherit"
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
            variant="outlined"
            size="small"
            sx={{
              borderRadius: 3,
              textTransform: "none",
              fontWeight: "bold",
              borderColor: ORTM_COLORS.warning,
              color: ORTM_COLORS.warning,
              px: 2.5,
              py: 1,
              fontSize: '0.9rem',
              '&:hover': {
                borderColor: ORTM_COLORS.warning,
                backgroundColor: alpha(ORTM_COLORS.warning, 0.1),
                color: ORTM_COLORS.warning,
                transform: 'translateY(-1px)',
                boxShadow: `0 4px 12px ${alpha(ORTM_COLORS.warning, 0.2)}`
              },
              transition: 'all 0.2s ease-in-out'
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
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: 300,
            background: `linear-gradient(180deg, ${ORTM_COLORS.surface} 0%, ${ORTM_COLORS.background} 100%)`
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </AppBar>
  );
};

export default Header;



// import React, { useState, useEffect } from "react";
// import {
//   AppBar,
//   Toolbar,
//   Box,
//   Typography,
//   IconButton,
//   Badge,
//   Avatar,
//   Button,
//   Menu,
//   MenuItem,
//   ListItemIcon,
//   ListItemText,
//   Drawer,
//   List,
//   ListItem,
//   ListItemButton,
//   ListItemText as ListItemTextDrawer,
//   Divider,
// } from "@mui/material";
// import {
//   Notifications as NotificationsIcon,
//   Settings as SettingsIcon,
//   Logout as LogoutIcon,
//   Menu as MenuIcon,
//   Warning as WarningIcon,
//   AccessTime as AccessTimeIcon,
//   Person as PersonIcon,
//   BarChart as BarChartIcon,
//   TrendingUp as TrendingUpIcon,
//   People as PeopleIcon,
//   Apartment as ApartmentIcon,
// } from "@mui/icons-material";
// import { useNavigate, useLocation } from "react-router-dom";
// import Swal from "sweetalert2";
// import { getEmployes, getPointages } from "../services/api";
// import ortmLogo from "./ortm.webp";

// // Global refresh
// let refreshNotificationsCallback = null;
// export const triggerNotificationsRefresh = () => {
//   if (refreshNotificationsCallback) refreshNotificationsCallback();
// };

// const Header = ({ user, onMenuToggle, onLogoutCheck }) => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [anchorEl, setAnchorEl] = useState(null);
//   const [settingsAnchorEl, setSettingsAnchorEl] = useState(null);
//   const [statsAnchorEl, setStatsAnchorEl] = useState(null);
//   const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
//   const [notifications, setNotifications] = useState([]);
//   const [notificationsCount, setNotificationsCount] = useState(0);
//   const [refreshTrigger, setRefreshTrigger] = useState(0);

//   useEffect(() => {
//     refreshNotificationsCallback = () => setRefreshTrigger((p) => p + 1);
//     return () => { refreshNotificationsCallback = null; };
//   }, []);

//   const handleLogout = async () => {
//     try {
//       const pointagesData = await getPointages();
//       const pointagesEnCours = pointagesData.filter(p => !p.heure_sortie);

//       if (pointagesEnCours.length > 0) {
//         const result = await Swal.fire({
//           title: 'Pointages en cours détectés',
//           html: `<strong>${pointagesEnCours.length} pointage(s) en cours</strong><p>Voulez-vous vraiment vous déconnecter ?</p>`,
//           icon: 'warning',
//           showCancelButton: true,
//           confirmButtonText: 'Oui, déconnecter',
//           cancelButtonText: 'Annuler',
//         });
//         if (!result.isConfirmed) {
//           navigate("/pointages");
//           return;
//         }
//       }

//       const confirm = await Swal.fire({
//         title: "Déconnexion",
//         text: "Voulez-vous vraiment vous déconnecter ?",
//         icon: "question",
//         showCancelButton: true,
//         confirmButtonText: "Oui",
//         cancelButtonText: "Annuler",
//       });

//       if (confirm.isConfirmed) {
//         localStorage.removeItem("access_token");
//         localStorage.removeItem("refresh_token");
//         navigate("/");
//       }
//     } catch (error) {
//       const confirm = await Swal.fire({
//         title: "Déconnexion",
//         text: "Voulez-vous vraiment vous déconnecter ?",
//         icon: "question",
//         showCancelButton: true,
//       });
//       if (confirm.isConfirmed) {
//         localStorage.removeItem("access_token");
//         localStorage.removeItem("refresh_token");
//         navigate("/");
//       }
//     }
//   };

//   const openMenu = (setter) => (e) => setter(e.currentTarget);
//   const closeMenu = (setter) => () => setter(null);

//   const handleMobileDrawerToggle = () => setMobileDrawerOpen(!mobileDrawerOpen);
//   const handleNavigation = (path) => {
//     navigate(path);
//     setMobileDrawerOpen(false);
//     closeMenu(setStatsAnchorEl)();
//   };

//   const handleNotificationClick = (type) => {
//     closeMenu(setAnchorEl)();
//     if (type === "employes_inactifs") navigate("/employes");
//     if (type === "pointages") navigate("/pointages");
//   };

//   useEffect(() => {
//     const fetchNotifications = async () => {
//       if (!localStorage.getItem("access_token")) {
//         setNotifications([]);
//         setNotificationsCount(0);
//         return;
//       }

//       try {
//         const [employesData, pointagesData] = await Promise.all([
//           getEmployes().catch(() => []),
//           getPointages().catch(() => []),
//         ]);

//         const employesInactifs = employesData.filter(emp => emp.statut === 'inactif');
//         const pointagesEnCours = pointagesData.filter(p => !p.heure_sortie);

//         const notifs = [];
//         if (employesInactifs.length > 0)
//           notifs.push({ type: "employes_inactifs", message: `${employesInactifs.length} employé(s) inactif(s)`, count: employesInactifs.length });
//         if (pointagesEnCours.length > 0)
//           notifs.push({ type: "pointages", message: `${pointagesEnCours.length} pointage(s) en cours`, count: pointagesEnCours.length });

//         setNotifications(notifs);
//         setNotificationsCount(notifs.length);
//       } catch (err) {
//         setNotifications([]);
//         setNotificationsCount(0);
//       }
//     };

//     fetchNotifications();
//   }, [refreshTrigger]);

//   const getNotificationIcon = (type) => {
//     return type === "employes_inactifs" ? <WarningIcon /> : <AccessTimeIcon />;
//   };

//   const navItems = [
//     { label: "Employés", path: "/employes", icon: <PeopleIcon /> },
//     { label: "Départements", path: "/departements", icon: <ApartmentIcon /> },
//     { label: "Pointages", path: "/pointages", icon: <AccessTimeIcon /> },
//   ];

//   const drawerContent = (
//     <Box onClick={handleMobileDrawerToggle}>
//       <Box>
//         <img src={ortmLogo} alt="ORTM Logo" />
//         <Typography>ORTM Madagascar</Typography>
//         <Typography>Système de Gestion RH</Typography>
//       </Box>
//       <List>
//         {navItems.map((item) => (
//           <ListItem key={item.path} disablePadding>
//             <ListItemButton onClick={() => handleNavigation(item.path)}>
//               <ListItemIcon>{item.icon}</ListItemIcon>
//               <ListItemTextDrawer primary={item.label} />
//             </ListItemButton>
//           </ListItem>
//         ))}
//         <ListItem disablePadding>
//           <ListItemButton onClick={openMenu(setStatsAnchorEl)}>
//             <ListItemIcon><BarChartIcon /></ListItemIcon>
//             <ListItemTextDrawer primary="Statistiques" />
//           </ListItemButton>
//         </ListItem>
//       </List>
//     </Box>
//   );

//   return (
//     <>
//       <AppBar position="fixed">
//         <Toolbar>
//           <IconButton color="inherit" onClick={handleMobileDrawerToggle}>
//             <MenuIcon />
//           </IconButton>

//           <Box onClick={() => navigate("/statistiques/overview")}>
//             <img src={ortmLogo} alt="ORTM Logo" />
//             <Typography>ORTM</Typography>
//             <Typography>Système de Gestion RH</Typography>
//           </Box>

//           <Box>
//             {navItems.map((item) => (
//               <Button key={item.path} color="inherit" onClick={() => handleNavigation(item.path)}>
//                 {item.label}
//               </Button>
//             ))}
//             <Button color="inherit" onClick={openMenu(setStatsAnchorEl)}>
//               Statistiques
//             </Button>
//           </Box>

//           <Box>
//             <IconButton color="inherit" onClick={openMenu(setAnchorEl)}>
//               <Badge badgeContent={notificationsCount} color="error">
//                 <NotificationsIcon />
//               </Badge>
//             </IconButton>

//             <IconButton color="inherit" onClick={openMenu(setSettingsAnchorEl)}>
//               <SettingsIcon />
//             </IconButton>

//             <Button color="inherit" startIcon={<LogoutIcon />} onClick={handleLogout}>
//               Déconnexion
//             </Button>
//           </Box>
//         </Toolbar>
//       </AppBar>

//       {/* Menus */}
//       <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu(setAnchorEl)}>
//         {notifications.length === 0 ? (
//           <MenuItem>Aucune notification</MenuItem>
//         ) : (
//           notifications.map((n, i) => (
//             <MenuItem key={i} onClick={() => handleNotificationClick(n.type)}>
//               <ListItemIcon>{getNotificationIcon(n.type)}</ListItemIcon>
//               <ListItemText primary={n.message} />
//               <Badge badgeContent={n.count} color="primary" />
//             </MenuItem>
//           ))
//         )}
//       </Menu>

//       <Menu anchorEl={settingsAnchorEl} open={Boolean(settingsAnchorEl)} onClose={closeMenu(setSettingsAnchorEl)}>
//         <MenuItem>
//           <Avatar><PersonIcon /></Avatar>
//           <Box>
//             <Typography>
//               {user?.prenom || user?.nom ? `${user.prenom || ""} ${user.nom || ""}`.trim() : "Utilisateur"}
//             </Typography>
//             <Typography>{user?.role === "admin" ? "Administrateur" : "Utilisateur"}</Typography>
//           </Box>
//         </MenuItem>
//       </Menu>

//       <Menu anchorEl={statsAnchorEl} open={Boolean(statsAnchorEl)} onClose={closeMenu(setStatsAnchorEl)}>
//         <MenuItem onClick={() => handleNavigation("/statistiques/overview")}>
//           <ListItemIcon><TrendingUpIcon /></ListItemIcon>
//           <ListItemText primary="Vue Globale" />
//         </MenuItem>
//         <MenuItem onClick={() => handleNavigation("/statistiques/employes")}>
//           <ListItemIcon><PeopleIcon /></ListItemIcon>
//           <ListItemText primary="Vue par Employé" />
//         </MenuItem>
//       </Menu>

//       <Drawer open={mobileDrawerOpen} onClose={handleMobileDrawerToggle}>
//         {drawerContent}
//       </Drawer>

//       <Toolbar />
//     </>
//   );
// };

// export default Header;