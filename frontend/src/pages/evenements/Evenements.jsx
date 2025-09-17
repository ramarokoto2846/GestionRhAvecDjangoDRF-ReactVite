import React, { useState, useEffect } from "react";
import {
  AppBar, Toolbar, Box, Typography, IconButton, Badge, Avatar, Button,
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider,
  Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Chip, Alert, Snackbar, Fab, Card, CardContent, Grid, TablePagination,
  InputAdornment, CircularProgress, alpha
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
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
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

import { getEvenements, createEvenement, updateEvenement, deleteEvenement, getCurrentUser } from "../../services/api";
import Header from "../../components/Header";

const drawerWidth = 240;

const Evenements = () => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [evenements, setEvenements] = useState([]);
  const [currentEvenement, setCurrentEvenement] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [formData, setFormData] = useState({
    id_evenement: "",
    titre: "",
    description: "",
    date_debut: "",
    date_fin: "",
    lieu: ""
  });
  const [errors, setErrors] = useState({});
  const [user, setUser] = useState(null);
  const notificationsCount = 3;

  const menuItems = [
    { text: "Accueil", path: "/Home", icon: <HomeIcon /> },
    { text: "Départements", path: "/departements", icon: <ApartmentIcon /> },
    { text: "Employés", path: "/employes", icon: <PeopleIcon /> },
    { text: "Pointages", path: "/pointages", icon: <AccessTimeIcon /> },
    { text: "Congés", path: "/conges", icon: <BeachAccessIcon /> },
    { text: "Absences", path: "/absences", icon: <BlockIcon /> },
    { text: "Événements", path: "/evenements", icon: <EventAvailableIcon /> }
  ];

  useEffect(() => {
    const fetchUserAndData = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          setError("Vous devez être connecté pour accéder à cette page.");
          navigate("/");
          return;
        }
        setLoading(true);
        const userData = await getCurrentUser();
        setUser(userData);
        await fetchEvenements();
      } catch (error) {
        setError(error.message || "Erreur lors de l'initialisation des données.");
        navigate("/");
      }
    };
    fetchUserAndData();
  }, [navigate]);

  const fetchEvenements = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getEvenements();
      setEvenements(Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []));
    } catch (error) {
      setError("Erreur lors du chargement des événements");
      showSnackbar("Impossible de charger les événements", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (evenement = null) => {
    if (evenement) {
      setCurrentEvenement(evenement);
      setFormData({
        id_evenement: evenement.id_evenement,
        titre: evenement.titre,
        description: evenement.description || "",
        date_debut: formatDateForInput(evenement.date_debut),
        date_fin: formatDateForInput(evenement.date_fin),
        lieu: evenement.lieu || ""
      });
    } else {
      setCurrentEvenement(null);
      setFormData({
        id_evenement: `E${Date.now()}`,
        titre: "",
        description: "",
        date_debut: "",
        date_fin: "",
        lieu: ""
      });
    }
    setErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentEvenement(null);
    setFormData({
      id_evenement: `E${Date.now()}`,
      titre: "",
      description: "",
      date_debut: "",
      date_fin: "",
      lieu: ""
    });
    setErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.id_evenement) newErrors.id_evenement = "ID événement requis";
    if (!formData.titre) newErrors.titre = "Titre requis";
    if (!formData.date_debut) newErrors.date_debut = "Date de début requise";
    if (!formData.date_fin) newErrors.date_fin = "Date de fin requise";
    if (formData.date_debut && formData.date_fin && new Date(formData.date_debut) >= new Date(formData.date_fin)) {
      newErrors.date_fin = "La date de fin doit être postérieure à la date de début";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showSnackbar("Veuillez corriger les erreurs dans le formulaire.", "error");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (currentEvenement) {
        await updateEvenement(currentEvenement.id_evenement, formData);
        showSnackbar("Événement modifié avec succès", "success");
      } else {
        await createEvenement(formData);
        showSnackbar("Événement créé avec succès", "success");
      }
      fetchEvenements();
      handleCloseDialog();
    } catch (error) {
      let errorMessage = error.message || "Erreur lors de l'opération.";
      if (error.response?.data) {
        const errors = error.response.data;
        errorMessage = Object.keys(errors)
          .map(key => `${key}: ${Array.isArray(errors[key]) ? errors[key].join(", ") : errors[key]}`)
          .join("; ");
      }
      showSnackbar(errorMessage, "error");
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Êtes-vous sûr ?",
      text: "Voulez-vous supprimer cet événement ?",
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
      try {
        await deleteEvenement(id);
        showSnackbar("Événement supprimé avec succès", "success");
        fetchEvenements();
      } catch (error) {
        let errorMessage = error.message || "Erreur lors de la suppression.";
        if (error.response?.data) {
          const errors = error.response.data;
          errorMessage = Object.keys(errors)
            .map(key => `${key}: ${Array.isArray(errors[key]) ? errors[key].join(", ") : errors[key]}`)
            .join("; ");
        }
        showSnackbar(errorMessage, "error");
      }
    }
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = parseISO(dateString);
    return format(date, "yyyy-MM-dd'T'HH:mm");
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "";
    const date = parseISO(dateString);
    return format(date, "dd MMMM yyyy HH:mm", { locale: fr });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredEvenements = evenements.filter(
    (evenement) =>
      (evenement.titre || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (evenement.lieu || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const paginatedEvenements = filteredEvenements.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (loading) return <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}><CircularProgress /></Box>;
  if (error) return <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}><Typography color="error">{error}</Typography></Box>;

  return (
    <Box sx={{ display: "flex" }}>
      <Header
        user={user}
        notificationsCount={notificationsCount}
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

      {/* Contenu principal */}
      <Box component="main" sx={{ flexGrow: 1, bgcolor: "#f8fafc", minHeight: "100vh", p: 3, mt: 8, ml: { md: `${drawerWidth}px` }, ml: 5 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: "bold" }}>Gestion des Événements</Typography>
            <Typography variant="body1" color="text.secondary">Gérez les événements de votre entreprise</Typography>
          </Box>
          <Fab
            color="primary"
            onClick={() => handleOpenDialog()}
            sx={{
              borderRadius: 2,
              width: 200,
              mr: 1.25,
              px: 4,
              textTransform: "none",
              fontWeight: "bold",
              fontSize: '1rem'
            }}
          >
            <AddIcon sx={{ mr: 1, fontSize: '1rem' }} />
            Nouvel Événement
          </Fab>
        </Box>

        {/* Statistiques */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography color="text.secondary">Total Événements</Typography>
                <Typography variant="h4" sx={{ fontWeight: "bold", color: "primary.main" }}>{evenements.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Search Bar */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
          <TextField
            fullWidth
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
              endAdornment: searchQuery && <InputAdornment position="end"><IconButton onClick={() => setSearchQuery("")}><CloseIcon /></IconButton></InputAdornment>
            }}
          />
        </Paper>

        {/* Tableau */}
        {filteredEvenements.length === 0 ? (
          <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
            <CardContent sx={{ textAlign: "center", py: 4 }}>
              <CalendarTodayIcon sx={{ fontSize: 60, color: "text.secondary", mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Aucun événement trouvé
              </Typography>
              <Fab
                color="primary"
                onClick={() => handleOpenDialog()}
                sx={{
                  mt: 2,
                  borderRadius: 2,
                  px: 3,
                  textTransform: "none",
                  fontWeight: "bold"
                }}
              >
                <AddIcon sx={{ mr: 1 }} />
                Créer le premier événement
              </Fab>
            </CardContent>
          </Card>
        ) : (
          <Paper sx={{ width: "100%", overflow: "hidden", borderRadius: 3 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Titre</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Début</TableCell>
                    <TableCell>Fin</TableCell>
                    <TableCell>Lieu</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedEvenements.map((evenement) => (
                    <TableRow key={evenement.id_evenement} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.2), color: theme.palette.primary.main }}>
                            <CalendarTodayIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {evenement.titre || "N/A"}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {evenement.id_evenement || "N/A"}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{evenement.description || "Aucune description"}</TableCell>
                      <TableCell>{formatDateForDisplay(evenement.date_debut)}</TableCell>
                      <TableCell>{formatDateForDisplay(evenement.date_fin)}</TableCell>
                      <TableCell>{evenement.lieu || "Non spécifié"}</TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <IconButton color="primary" onClick={() => handleOpenDialog(evenement)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton color="error" onClick={() => handleDelete(evenement.id_evenement)}>
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredEvenements.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Événements par page :"
              labelDisplayedRows={({ from, to, count }) => `${from}–${to} sur ${count}`}
            />
          </Paper>
        )}

        {/* Dialog */}
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle>
            {currentEvenement ? "Modifier l'événement" : "Nouvel événement"}
          </DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent sx={{ pt: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    margin="dense"
                    label="ID Événement"
                    name="id_evenement"
                    value={formData.id_evenement}
                    onChange={handleInputChange}
                    error={!!errors.id_evenement}
                    helperText={errors.id_evenement || "Entrez un ID unique"}
                    disabled={!!currentEvenement}
                    inputProps={{ maxLength: 10 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    margin="dense"
                    label="Titre"
                    name="titre"
                    value={formData.titre}
                    onChange={handleInputChange}
                    error={!!errors.titre}
                    helperText={errors.titre}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    margin="dense"
                    label="Description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    multiline
                    rows={3}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    margin="dense"
                    label="Date et heure de début"
                    name="date_debut"
                    type="datetime-local"
                    value={formData.date_debut}
                    onChange={handleInputChange}
                    error={!!errors.date_debut}
                    helperText={errors.date_debut}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    margin="dense"
                    label="Date et heure de fin"
                    name="date_fin"
                    type="datetime-local"
                    value={formData.date_fin}
                    onChange={handleInputChange}
                    error={!!errors.date_fin}
                    helperText={errors.date_fin}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    margin="dense"
                    label="Lieu"
                    name="lieu"
                    value={formData.lieu}
                    onChange={handleInputChange}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3, gap: 1 }}>
              <Button onClick={handleCloseDialog} color="inherit">
                Annuler
              </Button>
              <Button
                type="submit"
                variant="contained"
                sx={{ borderRadius: 2, px: 3, py: 1 }}
                disabled={!formData.id_evenement || !formData.titre || !formData.date_debut || !formData.date_fin}
              >
                {currentEvenement ? "Modifier" : "Créer"}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default Evenements;