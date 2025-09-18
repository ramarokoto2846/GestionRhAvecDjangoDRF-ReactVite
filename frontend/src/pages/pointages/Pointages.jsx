import React, { useState, useEffect } from "react";
import {
  Toolbar, Box, Typography, IconButton, Avatar, Button,
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider,
  Paper, Table, TableContainer, TableHead, TableRow, TableCell, TableBody,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Fab, Alert, Snackbar, Grid, Card, CardContent,
  CircularProgress, MenuItem, Chip, InputAdornment, Tooltip, FormControl, InputLabel, Select
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { format, parseISO, isValid } from "date-fns";
import { fr } from "date-fns/locale";
import Swal from "sweetalert2";

import HomeIcon from "@mui/icons-material/Home";
import PeopleIcon from "@mui/icons-material/People";
import ApartmentIcon from "@mui/icons-material/Apartment";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import BlockIcon from '@mui/icons-material/Block';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';

import { getPointages, createPointage, updatePointage, deletePointage, getEmployes, getCurrentUser } from "../../services/api";
import Header, { triggerNotificationsRefresh } from "../../components/Header";

const drawerWidth = 240;

const Pointages = () => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [pointages, setPointages] = useState([]);
  const [employes, setEmployes] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPointage, setEditingPointage] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ total: 0, withExit: 0, withoutExit: 0 });
  const [detailView, setDetailView] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [exitFilter, setExitFilter] = useState("all"); // New state for exit filter

  const initialFormData = {
    id_pointage: `P${Date.now()}`,
    employe: "",
    date_pointage: format(new Date(), "yyyy-MM-dd"),
    heure_entree: "08:00",
    heure_sortie: "",
    remarque: ""
  };

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    const fetchUserAndData = async () => {
      try {
        if (!localStorage.getItem("access_token")) {
          setError("Vous devez être connecté pour accéder à cette page.");
          navigate("/");
          return;
        }
        setLoading(true);
        const userData = await getCurrentUser();
        setUser(userData);
        await fetchData();
      } catch (error) {
        setError(error.message || "Erreur lors de l'initialisation des données.");
        navigate("/");
      }
    };
    fetchUserAndData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [pointagesData, employesData] = await Promise.all([
        getPointages(),
        getEmployes()
      ]);

      const formattedPointages = pointagesData.map(pointage => ({
        ...pointage,
        employe_nom: employesData.find(emp => emp.matricule === pointage.employe)?.nom_complet ||
                     `${employesData.find(emp => emp.matricule === pointage.employe)?.prenom || ''} ${employesData.find(emp => emp.matricule === pointage.employe)?.nom || ''}`.trim() ||
                     pointage.employe || 'Inconnu',
        employe_details: employesData.find(emp => emp.matricule === pointage.employe) || {}
      }));

      setPointages(formattedPointages);
      setEmployes(employesData);

      setStats({
        total: formattedPointages.length,
        withExit: formattedPointages.filter(p => p.heure_sortie).length,
        withoutExit: formattedPointages.filter(p => !p.heure_sortie).length
      });
      console.log("Pointages mis à jour:", formattedPointages); // Debug
    } catch (error) {
      const errorMessage = error.message || "Erreur lors du chargement des données.";
      setError(errorMessage);
      showSnackbar(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleOpenDialog = (pointage = null) => {
    if (pointage) {
      setEditingPointage(pointage);
      setFormData({
        id_pointage: pointage.id_pointage || "",
        employe: pointage.employe || "",
        date_pointage: pointage.date_pointage && isValid(parseISO(pointage.date_pointage)) ? format(parseISO(pointage.date_pointage), "yyyy-MM-dd") : "",
        heure_entree: pointage.heure_entree ? pointage.heure_entree.slice(0, 5) : "",
        heure_sortie: pointage.heure_sortie ? pointage.heure_sortie.slice(0, 5) : "",
        remarque: pointage.remarque || ""
      });
    } else {
      setEditingPointage(null);
      setFormData({ ...initialFormData, id_pointage: `P${Date.now()}` });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPointage(null);
    setFormData(initialFormData);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleExitFilterChange = (e) => {
    setExitFilter(e.target.value);
  };

  const validateForm = () => {
    if (!formData.id_pointage || !formData.employe || !formData.date_pointage || !formData.heure_entree) {
      showSnackbar("Veuillez remplir tous les champs obligatoires.", "error");
      return false;
    }
    if (formData.id_pointage.length > 10) {
      showSnackbar("L'ID du pointage ne doit pas dépasser 10 caractères.", "error");
      return false;
    }
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(formData.heure_entree)) {
      showSnackbar("Format d'heure d'entrée invalide (utilisez HH:MM).", "error");
      return false;
    }
    if (formData.heure_sortie && !timeRegex.test(formData.heure_sortie)) {
      showSnackbar("Format d'heure de sortie invalide (utilisez HH:MM).", "error");
      return false;
    }
    if (formData.heure_sortie && formData.heure_entree >= formData.heure_sortie) {
      showSnackbar("L'heure de sortie doit être après l'heure d'entrée.", "error");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setActionLoading(true);
    try {
      const payload = {
        id_pointage: formData.id_pointage,
        employe: formData.employe,
        date_pointage: formData.date_pointage,
        heure_entree: `${formData.heure_entree}:00`,
        heure_sortie: formData.heure_sortie ? `${formData.heure_sortie}:00` : null,
        remarque: formData.remarque || null
      };

      if (editingPointage) {
        await updatePointage(editingPointage.id_pointage, payload);
        showSnackbar("Pointage modifié avec succès !", "success");
      } else {
        await createPointage(payload);
        showSnackbar("Pointage créé avec succès !", "success");
      }
      handleCloseDialog();
      await fetchData();
      triggerNotificationsRefresh();
    } catch (error) {
      let errorMessage = error.message || "Erreur lors de l'opération.";
      if (error.response?.data) {
        const errors = error.response.data;
        if (errors.non_field_errors) {
          errorMessage = errors.non_field_errors.join(", ");
        } else {
          errorMessage = Object.keys(errors)
            .map(key => `${key}: ${Array.isArray(errors[key]) ? errors[key].join(", ") : errors[key]}`)
            .join("; ");
        }
      }
      showSnackbar(errorMessage, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Êtes-vous sûr ?",
      text: "Voulez-vous supprimer ce pointage ?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Oui, supprimer",
      cancelButtonText: "Annuler",
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      background: theme.palette.background.paper,
      color: theme.palette.text.primary
    });
    if (result.isConfirmed) {
      setActionLoading(true);
      setDeletingId(id);
      try {
        await deletePointage(id);
        showSnackbar("Pointage supprimé avec succès !", "success");
        await fetchData();
        triggerNotificationsRefresh();
      } catch (error) {
        let errorMessage = error.message || "Erreur lors de la suppression.";
        if (error.response?.data) {
          const errors = error.response.data;
          if (errors.non_field_errors) {
            errorMessage = errors.non_field_errors.join(", ");
          } else {
            errorMessage = Object.keys(errors)
              .map(key => `${key}: ${Array.isArray(errors[key]) ? errors[key].join(", ") : errors[key]}`)
              .join("; ");
          }
        }
        showSnackbar(errorMessage, "error");
      } finally {
        setActionLoading(false);
        setDeletingId(null);
      }
    }
  };

  const showDetails = (pointage) => {
    setDetailView(pointage);
  };

  const closeDetails = () => {
    setDetailView(null);
  };

  // Modified: Added exitFilter to filteredPointages
  const filteredPointages = pointages.filter(pointage =>
    (
      (pointage.employe_nom || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pointage.id_pointage || "").includes(searchTerm)
    ) &&
    (exitFilter === "all" ||
     (exitFilter === "working" && !pointage.heure_sortie) ||
     (exitFilter === "exited" && pointage.heure_sortie))
  );

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
    <Box sx={{ display: "flex" }}>
      {/* AppBar */}
      <Header
        user={user}
        onMenuToggle={() => setOpen(!open)}
      />

      {/* Sidebar */}
      <Drawer variant="permanent" sx={{ width: drawerWidth, flexShrink: 0, [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: "border-box" }, display: { xs: "none", md: "block" } }} open>
        <Toolbar /><Divider />
        <List>
          {menuItems.map(item => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton component={Link} to={item.path} selected={location.pathname === item.path}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Mobile Drawer */}
      <Drawer anchor="left" open={open} onClose={() => setOpen(false)} sx={{ display: { md: "none" } }}>
        <Box sx={{ width: drawerWidth }} role="presentation">
          <List>
            {menuItems.map(item => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton component={Link} to={item.path} onClick={() => setOpen(false)} selected={location.pathname === item.path}>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, bgcolor: "#f8fafc", minHeight: "100vh", p: 3, mt: 8, ml: { md: `${drawerWidth}px` }, ml: 5 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: "bold" }}>Gestion des Pointages</Typography>
            <Typography variant="body1" color="text.secondary">Gérez les pointages de vos employés</Typography>
          </Box>
          <Fab
            color="primary"
            onClick={() => handleOpenDialog()}
            sx={{
              borderRadius: 2,
              width: 300,
              mr: 1.25,
              px: 4,
              textTransform: "none",
              fontWeight: "bold",
              fontSize: '1rem'
            }}
            disabled={actionLoading}
          >
            <AddIcon sx={{ mr: 1 }} />
            Nouveau Pointage
          </Fab>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography color="text.secondary">Total Pointages</Typography>
                <Typography variant="h4" sx={{ fontWeight: "bold", color: "primary.main" }}>{stats.total}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography color="text.secondary">Avec Heure de Sortie</Typography>
                <Typography variant="h4" sx={{ fontWeight: "bold", color: "success.main" }}>{stats.withExit}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography color="text.secondary">Sans Heure de Sortie</Typography>
                <Typography variant="h4" sx={{ fontWeight: "bold", color: "warning.main" }}>{stats.withoutExit}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Search and Filter Bar */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
                  endAdornment: searchTerm && <InputAdornment position="end"><IconButton onClick={() => setSearchTerm("")}><CloseIcon /></IconButton></InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="exit-filter-label">Filtrer par statut</InputLabel>
                <Select
                  labelId="exit-filter-label"
                  value={exitFilter}
                  label="Filtrer par statut"
                  onChange={handleExitFilterChange}
                >
                  <MenuItem value="all">Tous</MenuItem>
                  <MenuItem value="working">En cours de travail</MenuItem>
                  <MenuItem value="exited">Déjà sortis</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* Pointages Table */}
        <Paper sx={{ width: "100%", overflow: "hidden", borderRadius: 3 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Pointage UID</TableCell>
                  <TableCell>Employé</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Heure d'Entrée</TableCell>
                  <TableCell>Heure de Sortie</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : filteredPointages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">Aucun pointage trouvé</TableCell>
                  </TableRow>
                ) : (
                  filteredPointages.map((pointage) => (
                    <TableRow key={pointage.id_pointage} hover>
                      <TableCell>
                        <Chip
                          label={ pointage.id_pointage }
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.2), color: theme.palette.primary.main }}>
                            <PersonIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {pointage.employe_nom || pointage.employe || "Inconnu"}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {pointage.employe_matricule || pointage.employe || "Inconnu"}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {pointage.date_pointage && isValid(parseISO(pointage.date_pointage))
                          ? format(parseISO(pointage.date_pointage), "dd MMMM yyyy", { locale: fr })
                          : "-"}
                      </TableCell>
                      <TableCell>{pointage.heure_entree || "-"}</TableCell>
                      <TableCell>{pointage.heure_sortie || "-"}</TableCell>
                      <TableCell>
                        <Chip
                          label={pointage.heure_sortie ? "Complet" : "En cours"}
                          color={pointage.heure_sortie ? "success" : "warning"}
                          variant="filled"
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Tooltip title="Modifier">
                            <IconButton color="primary" onClick={() => handleOpenDialog(pointage)} disabled={actionLoading}>
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Supprimer">
                            <IconButton color="error" onClick={() => handleDelete(pointage.id_pointage)} disabled={actionLoading}>
                              {actionLoading && deletingId === pointage.id_pointage ? <CircularProgress size={24} /> : <DeleteIcon />}
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Dialog for Details */}
        <Dialog
          open={!!detailView}
          onClose={closeDetails}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle>Détails du pointage #{detailView?.id_pointage}</DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            {detailView && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">ID Pointage</Typography>
                  <Typography variant="body1">{detailView.id_pointage}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Matricule Employé</Typography>
                  <Typography variant="body1">{detailView.employe}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Nom Employé</Typography>
                  <Typography variant="body1">{detailView.employe_nom || "Inconnu"}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Date</Typography>
                  <Typography variant="body1">
                    {detailView.date_pointage && isValid(parseISO(detailView.date_pointage))
                      ? format(parseISO(detailView.date_pointage), "dd MMMM yyyy", { locale: fr })
                      : "-"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Heure d'Entrée</Typography>
                  <Typography variant="body1">{detailView.heure_entree || "-"}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Heure de Sortie</Typography>
                  <Typography variant="body1">{detailView.heure_sortie || "-"}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Remarque</Typography>
                  <Typography variant="body1">{detailView.remarque || "Aucune remarque"}</Typography>
                </Grid>
                {detailView.employe_details && Object.keys(detailView.employe_details).length > 0 && (
                  <>
                    <Grid item xs={12}>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="h6">Informations sur l'employé</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Département</Typography>
                      <Typography variant="body1">{detailView.employe_details.departement || "Non spécifié"}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Poste</Typography>
                      <Typography variant="body1">{detailView.employe_details.poste || "Non spécifié"}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                      <Typography variant="body1">{detailView.employe_details.email || "Non spécifié"}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Téléphone</Typography>
                      <Typography variant="body1">{detailView.employe_details.telephone || "Non spécifié"}</Typography>
                    </Grid>
                  </>
                )}
              </Grid>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3, gap: 1 }}>
            <Button onClick={closeDetails} color="inherit">Fermer</Button>
          </DialogActions>
        </Dialog>

        {/* Dialog for Add/Edit Pointage */}
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle>
            {editingPointage ? "Modifier le pointage" : "Nouveau pointage"}
          </DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent sx={{ pt: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    margin="dense"
                    label="ID Pointage"
                    name="id_pointage"
                    value={formData.id_pointage}
                    onChange={handleInputChange}
                    required
                    disabled={editingPointage !== null}
                    inputProps={{ maxLength: 10 }}
                    helperText="Entrez un ID unique (max 10 caractères)"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    margin="dense"
                    label="Employé"
                    name="employe"
                    value={formData.employe}
                    onChange={handleInputChange}
                    required
                    disabled={employes.length === 0}
                    helperText={employes.length === 0 ? "Aucun employé disponible" : ""}
                  >
                    {employes.length === 0 ? (
                      <MenuItem disabled>Aucun employé disponible</MenuItem>
                    ) : (
                      employes.map((employe) => (
                        <MenuItem key={employe.matricule} value={employe.matricule}>
                          {`${employe.prenom || ""} ${employe.nom || ""} (${employe.matricule})`}
                        </MenuItem>
                      ))
                    )}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    margin="dense"
                    label="Date"
                    name="date_pointage"
                    type="date"
                    value={formData.date_pointage}
                    onChange={handleInputChange}
                    required
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    margin="dense"
                    label="Heure d'Entrée"
                    name="heure_entree"
                    type="time"
                    value={formData.heure_entree}
                    onChange={handleInputChange}
                    required
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ step: 60 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    margin="dense"
                    label="Heure de Sortie"
                    name="heure_sortie"
                    type="time"
                    value={formData.heure_sortie}
                    onChange={handleInputChange}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ step: 60 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    margin="dense"
                    label="Remarque"
                    name="remarque"
                    value={formData.remarque}
                    onChange={handleInputChange}
                    multiline
                    rows={3}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3, gap: 1 }}>
              <Button onClick={handleCloseDialog} disabled={actionLoading} color="inherit">
                Annuler
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={actionLoading || !formData.id_pointage || !formData.employe || !formData.date_pointage || !formData.heure_entree || employes.length === 0}
                sx={{ borderRadius: 2, px: 3, py: 1 }}
              >
                {actionLoading ? <CircularProgress size={24} /> : (editingPointage ? "Modifier" : "Créer")}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default Pointages;