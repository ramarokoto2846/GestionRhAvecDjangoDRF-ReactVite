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
  useTheme
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
  ReportProblem as ReportProblemIcon
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { getConges, getEmployes, getEvenements, getPointages, getAbsences } from "../services/api";

// Global refresh trigger
let refreshNotificationsCallback = null;

export const triggerNotificationsRefresh = () => {
  if (refreshNotificationsCallback) {
    refreshNotificationsCallback();
  }
};

const Header = ({ user, onMenuToggle }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
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

  const handleLogout = () => {
    Swal.fire({
      title: "Déconnexion",
      text: "Voulez-vous vraiment vous déconnecter ?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#1976d2",
      cancelButtonColor: "#d33",
      confirmButtonText: "Oui, déconnexion",
      cancelButtonText: "Annuler",
      reverseButtons: true
    }).then(result => {
      if (result.isConfirmed) {
        localStorage.removeItem("access_token");
        navigate("/");
      }
    });
  };

  const handleNotificationsClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (type) => {
    handleNotificationsClose();
    if (type === "employes_inactifs") navigate("/employes");
    else if (type === "conges") navigate("/conges");
    else if (type === "evenements") navigate("/evenements");
    else if (type === "pointages") navigate("/pointages");
    else if (type === "absences") navigate("/absences");
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
        const [employesData, congesData, pointagesData, evenementsData, absencesData] = await Promise.all([
          getEmployes().catch(() => []),
          getConges().catch(() => []),
          getPointages().catch(() => []),
          getEvenements().catch(() => []),
          getAbsences().catch(() => [])
        ]);

        // Debug absences data
        console.log("Données des absences:", absencesData);

        // Employés inactifs
        const employesInactifs = employesData.filter(emp => emp.statut === 'inactif');
        const employesNotification = employesInactifs.length > 0 ? [{
          type: "employes_inactifs",
          message: `${employesInactifs.length} Employé${employesInactifs.length > 1 ? "s" : ""} inactif${employesInactifs.length > 1 ? "s" : ""}`,
          count: employesInactifs.length
        }] : [];

        // Congés en attente
        const congesEnAttente = congesData.filter(c => c.statut === 'en_attente');
        const congesNotification = congesEnAttente.length > 0 ? [{
          type: "conges",
          message: `${congesEnAttente.length} Congé${congesEnAttente.length > 1 ? "s" : ""} en attente`,
          count: congesEnAttente.length
        }] : [];

        // Pointages en cours
        const pointagesEnCours = pointagesData.filter(p => !p.heure_sortie);
        const pointagesNotification = pointagesEnCours.length > 0 ? [{
          type: "pointages",
          message: `${pointagesEnCours.length} Pointage${pointagesEnCours.length > 1 ? "s" : ""} en cours`,
          count: pointagesEnCours.length
        }] : [];

        // Événements à venir ou en cours
        const currentDate = new Date();
        const evenementsNonExpires = evenementsData.filter(e => new Date(e.date_fin) >= currentDate);
        const evenementsNotification = evenementsNonExpires.length > 0 ? [{
          type: "evenements",
          message: `${evenementsNonExpires.length} Événement${evenementsNonExpires.length > 1 ? "s" : ""} à venir/en cours`,
          count: evenementsNonExpires.length
        }] : [];

        // Absences non justifiées
        const absencesNonJustifiees = absencesData.filter(a => !a.justifie);
        console.log("Absences non justifiées:", absencesNonJustifiees); // Debug
        const absencesNotification = absencesNonJustifiees.length > 0 ? [{
          type: "absences",
          message: `${absencesNonJustifiees.length} Absence${absencesNonJustifiees.length > 1 ? "s" : ""} non justifiée${absencesNonJustifiees.length > 1 ? "s" : ""}`,
          count: absencesNonJustifiees.length
        }] : [];

        const allNotifications = [
          ...employesNotification,
          ...congesNotification,
          ...pointagesNotification,
          ...evenementsNotification,
          ...absencesNotification
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
      case "conges": return <BeachAccessIcon color="primary" />;
      case "employes_inactifs": return <WarningIcon color="warning" />;
      case "evenements": return <EventIcon color="info" />;
      case "pointages": return <AccessTimeIcon color="secondary" />;
      case "absences": return <ReportProblemIcon color="error" />;
      default: return <NotificationsIcon />;
    }
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        bgcolor: "white",
        color: "text.primary",
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        zIndex: theme.zIndex.drawer + 1
      }}
    >
      <Toolbar>
        <IconButton color="inherit" onClick={onMenuToggle} sx={{ mr: 2, display: { md: "none" } }}>
          <MenuIcon />
        </IconButton>

        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Box sx={{
            width: 40, height: 40, bgcolor: "primary.main", color: "white",
            fontWeight: "bold", display: "flex", justifyContent: "center",
            alignItems: "center", borderRadius: 2, mr: 2
          }}>RH</Box>
          <Typography variant="h6" sx={{ fontWeight: "bold", color: "#1976d2" }}>
            RHManager Pro
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <IconButton
          color="inherit"
          onClick={handleNotificationsClick}
          sx={{
            mr: 1,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.2) }
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
              borderRadius: 2
            }
          }}
        >
          <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              Notifications
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {notificationsCount} notification(s)
            </Typography>
          </Box>

          {notifications.length === 0 ? (
            <MenuItem sx={{ py: 2 }}>
              <ListItemIcon>
                <NotificationsIcon color="disabled" />
              </ListItemIcon>
              <ListItemText
                primary="Aucune notification"
                secondary="Tout est à jour"
              />
            </MenuItem>
          ) : (
            notifications.map((notification, index) => (
              <MenuItem
                key={`${notification.type}-${index}`}
                onClick={() => handleNotificationClick(notification.type)}
                sx={{
                  py: 1.5,
                  borderBottom: index < notifications.length - 1 ? `1px solid ${theme.palette.divider}` : 'none'
                }}
              >
                <ListItemIcon>
                  {getNotificationIcon(notification.type)}
                </ListItemIcon>
                <ListItemText
                  primary={notification.message}
                  secondary="Cliquez pour voir les détails"
                />
                <Badge
                  badgeContent={notification.count}
                  color="primary"
                  sx={{ ml: 1 }}
                />
              </MenuItem>
            ))
          )}
        </Menu>

        <IconButton
          sx={{
            mr: 1,
            bgcolor: alpha(theme.palette.grey[500], 0.1),
            "&:hover": { bgcolor: alpha(theme.palette.grey[500], 0.2) }
          }}
        >
          <SettingsIcon />
        </IconButton>

        {user && (
          <Box sx={{ display: "flex", alignItems: "center", mr: 2 }}>
            <Avatar sx={{ bgcolor: "primary.main", width: 40, height: 40, mr: 1.5, fontWeight: "bold" }}>
              {user.nom?.charAt(0)?.toUpperCase() || user.prenom?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || "U"}
            </Avatar>
            <Box sx={{ display: { xs: "none", sm: "block" } }}>
              <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                {user.nom || user.prenom ? `${user.prenom || ''} ${user.nom || ''}`.trim() : user.email}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
              </Typography>
            </Box>
          </Box>
        )}

        <Button
          color="error"
          onClick={handleLogout}
          startIcon={<LogoutIcon />}
          variant="outlined"
          size="small"
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: "medium"
          }}
        >
          Déconnexion
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Header;