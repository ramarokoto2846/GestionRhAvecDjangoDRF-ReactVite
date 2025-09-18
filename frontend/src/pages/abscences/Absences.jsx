import React, { useState, useEffect } from "react";
import {
  AppBar, Toolbar, Box, Typography, IconButton, Badge, Avatar, Button,
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider,
  Paper, Table, TableContainer, TableHead, TableRow, TableCell, TableBody,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Fab, Alert, Snackbar, Grid, Card, CardContent,
  Switch, FormControlLabel, CircularProgress, MenuItem, Tooltip, InputAdornment
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { format, parseISO, isValid, differenceInDays, getMonth } from "date-fns";
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
import PersonIcon from '@mui/icons-material/Person';

import { getAbsences, createAbsence, updateAbsence, deleteAbsence, getEmployes, getCurrentUser } from "../../services/api";
import Header from "../../components/Header";
import { triggerNotificationsRefresh } from "../../components/Header";

const drawerWidth = 240;

const Absences = () => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [absences, setAbsences] = useState([]);
  const [employes, setEmployes] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAbsence, setEditingAbsence] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [justificationFilter, setJustificationFilter] = useState("all"); // New state for justification filter
  const [monthFilter, setMonthFilter] = useState("all"); // New state for month filter
  const [stats, setStats] = useState({ total: 0, justifiees: 0, nonJustifiees: 0 });

  const initialFormData = {
    id_absence: "",
    employe: "",
    date_debut_absence: format(new Date(), "yyyy-MM-dd"),
    date_fin_absence: format(new Date(), "yyyy-MM-dd"),
    motif: "",
    justifiee: false
  };

  const [formData, setFormData] = useState(initialFormData);

  // List of months for the filter (1-based indexing for display)
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: format(new Date(2025, i, 1), "MMMM", { locale: fr })
  }));

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
      } finally {
        setLoading(false);
      }
    };
    fetchUserAndData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      setError(null);
      const [absencesData, employesData] = await Promise.all([
        getAbsences(),
        getEmployes()
      ]);

      const formattedAbsences = absencesData.map(absence => {
        const dateDebut = parseISO(absence.date_debut_absence);
        const dateFin = parseISO(absence.date_fin_absence);
        const nbrJours = isValid(dateDebut) && isValid(dateFin)
          ? Math.max(differenceInDays(dateFin, dateDebut) + 1, 1)
          : null;
        return {
          ...absence,
          employe_nom: employesData.find(emp => emp.matricule === absence.employe)?.nom_complet ||
                       `${employesData.find(emp => emp.matricule === absence.employe)?.prenom || ''} ${employesData.find(emp => emp.matricule === absence.employe)?.nom || ''}`.trim() ||
                       absence.employe || 'Inconnu',
          nbr_jours: nbrJours
        };
      });

      setAbsences(formattedAbsences);
      setEmployes(employesData);

      setStats({
        total: formattedAbsences.length,
        justifiees: formattedAbsences.filter(a => a.justifiee).length,
        nonJustifiees: formattedAbsences.filter(a => !a.justifiee).length
      });
    } catch (error) {
      const errorMessage = error.message || "Erreur lors du chargement des données.";
      setError(errorMessage);
      showSnackbar(errorMessage, "error");
    }
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleOpenDialog = (absence = null) => {
    if (absence) {
      setEditingAbsence(absence);
      setFormData({
        id_absence: absence.id_absence || "",
        employe: absence.employe || "",
        date_debut_absence: absence.date_debut_absence && isValid(parseISO(absence.date_debut_absence)) ? format(parseISO(absence.date_debut_absence), "yyyy-MM-dd") : "",
        date_fin_absence: absence.date_fin_absence && isValid(parseISO(absence.date_fin_absence)) ? format(parseISO(absence.date_fin_absence), "yyyy-MM-dd") : "",
        motif: absence.motif || "",
        justifiee: absence.justifiee || false
      });
    } else {
      setEditingAbsence(null);
      setFormData(initialFormData);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAbsence(null);
    setFormData(initialFormData);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const validateForm = () => {
    if (!formData.id_absence || !formData.employe || !formData.date_debut_absence || !formData.date_fin_absence) {
      showSnackbar("Veuillez remplir tous les champs obligatoires.", "error");
      return false;
    }
    if (formData.id_absence.length > 10) {
      showSnackbar("L'ID de l'absence ne doit pas dépasser 10 caractères.", "error");
      return false;
    }
    if (new Date(formData.date_debut_absence) > new Date(formData.date_fin_absence)) {
      showSnackbar("La date de début doit être avant ou égale à la date de fin.", "error");
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
        id_absence: formData.id_absence,
        employe: formData.employe,
        date_debut_absence: formData.date_debut_absence,
        date_fin_absence: formData.date_fin_absence,
        motif: formData.motif || null,
        justifiee: formData.justifiee
      };

      if (editingAbsence) {
        await updateAbsence(editingAbsence.id_absence, payload);
        showSnackbar("Absence modifiée avec succès !", "success");
      } else {
        await createAbsence(payload);
        showSnackbar("Absence créée avec succès !", "success");
      }
      handleCloseDialog();
      await fetchData();
      triggerNotificationsRefresh();
    } catch (error) {
      let errorMessage = error.message || "Erreur lors de l'opération.";
      if (error.response?.data) {
        const errors = error.response.data;
        errorMessage = Object.keys(errors)
          .map(key => `${key}: ${Array.isArray(errors[key]) ? errors[key].join(", ") : errors[key]}`)
          .join("; ");
      }
      showSnackbar(errorMessage, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Êtes-vous sûr ?",
      text: "Voulez-vous supprimer cette absence ?",
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
        await deleteAbsence(id);
        showSnackbar("Absence supprimée avec succès !", "success");
        await fetchData();
        triggerNotificationsRefresh();
      } catch (error) {
        let errorMessage = error.message || "Erreur lors de la suppression.";
        if (error.response?.data) {
          const errors = error.response.data;
          errorMessage = Object.keys(errors)
            .map(key => `${key}: ${Array.isArray(errors[key]) ? errors[key].join(", ") : errors[key]}`)
            .join("; ");
        }
        showSnackbar(errorMessage, "error");
      } finally {
        setActionLoading(false);
        setDeletingId(null);
      }
    }
  };

  // Updated filtering logic
  const filteredData = absences.filter(absence => {
    // Search filter
    const matchesSearch =
      (absence.employe_nom || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (absence.id_absence || "").includes(searchTerm) ||
      (absence.motif || "").toLowerCase().includes(searchTerm.toLowerCase());

    // Justification filter
    const matchesJustification =
      justificationFilter === "all" ||
      (justificationFilter === "justified" && absence.justifiee) ||
      (justificationFilter === "unjustified" && !absence.justifiee);

    // Month filter
    const matchesMonth =
      monthFilter === "all" ||
      (isValid(parseISO(absence.date_debut_absence)) &&
        getMonth(parseISO(absence.date_debut_absence)) + 1 === Number(monthFilter));

    return matchesSearch && matchesJustification && matchesMonth;
  });

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
      <Header
        user={user}
        onMenuToggle={() => setOpen(!open)}
      />

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: "border-box" },
          display: { xs: "none", md: "block" }
        }}
        open
      >
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

      <Box component="main" sx={{ flexGrow: 1, bgcolor: "#f8fafc", minHeight: "100vh", p: 3, mt: 8, ml: { md: `${drawerWidth}px` } }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: "bold" }}>Gestion des Absences</Typography>
            <Typography variant="body1" color="text.secondary">Gérez les absences de vos employés</Typography>
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
            Nouvelle Absence
          </Fab>
        </Box>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography color="text.secondary">Total Absences</Typography>
                <Typography variant="h4" sx={{ fontWeight: "bold", color: "primary.main" }}>{stats.total}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography color="text.secondary">Absences Justifiées</Typography>
                <Typography variant="h4" sx={{ fontWeight: "bold", color: "success.main" }}>{stats.justifiees}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography color="text.secondary">Absences Non Justifiées</Typography>
                <Typography variant="h4" sx={{ fontWeight: "bold", color: "error.main" }}>{stats.nonJustifiees}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
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
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                label="Filtrer par justification"
                value={justificationFilter}
                onChange={(e) => setJustificationFilter(e.target.value)}
              >
                <MenuItem value="all">Toutes</MenuItem>
                <MenuItem value="justified">Justifiées</MenuItem>
                <MenuItem value="unjustified">Non Justifiées</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                label="Filtrer par mois"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
              >
                <MenuItem value="all">Tous les mois</MenuItem>
                {months.map((month) => (
                  <MenuItem key={month.value} value={month.value}>
                    {month.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </Paper>

        <Paper sx={{ width: "100%", overflow: "hidden", borderRadius: 3 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employé</TableCell>
                  <TableCell>Date Début</TableCell>
                  <TableCell>Date Fin</TableCell>
                  <TableCell>Nombre de Jours</TableCell>
                  <TableCell>Motif</TableCell>
                  <TableCell>Justifiée</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">Aucune absence trouvée</TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((absence) => (
                    <TableRow key={absence.id_absence} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.2), color: theme.palette.primary.main }}>
                            <PersonIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {absence.employe_nom || absence.employe || "Inconnu"}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {absence.id_absence}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {absence.date_debut_absence && isValid(parseISO(absence.date_debut_absence))
                          ? format(parseISO(absence.date_debut_absence), "dd MMMM yyyy", { locale: fr })
                          : "Date invalide"}
                      </TableCell>
                      <TableCell>
                        {absence.date_fin_absence && isValid(parseISO(absence.date_fin_absence))
                          ? format(parseISO(absence.date_fin_absence), "dd MMMM yyyy", { locale: fr })
                          : "Date invalide"}
                      </TableCell>
                      <TableCell>{absence.nbr_jours || "-"}</TableCell>
                      <TableCell>{absence.motif || "-"}</TableCell>
                      <TableCell>{absence.justifiee ? "Oui" : "Non"}</TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Tooltip title="Modifier">
                            <IconButton color="primary" onClick={() => handleOpenDialog(absence)} disabled={actionLoading}>
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Supprimer">
                            <IconButton color="error" onClick={() => handleDelete(absence.id_absence)} disabled={actionLoading}>
                              {actionLoading && deletingId === absence.id_absence ? <CircularProgress size={24} /> : <DeleteIcon />}
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

        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle>
            {editingAbsence ? "Modifier l'absence" : "Nouvelle absence"}
          </DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent sx={{ pt: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    margin="dense"
                    label="ID Absence"
                    name="id_absence"
                    value={formData.id_absence}
                    onChange={handleInputChange}
                    required
                    inputProps={{ maxLength: 10 }}
                    helperText="Entrez un ID unique (max 10 caractères)"
                    disabled={!!editingAbsence}
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
                    label="Date Début"
                    name="date_debut_absence"
                    type="date"
                    value={formData.date_debut_absence}
                    onChange={handleInputChange}
                    required
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    margin="dense"
                    label="Date Fin"
                    name="date_fin_absence"
                    type="date"
                    value={formData.date_fin_absence}
                    onChange={handleInputChange}
                    required
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    margin="dense"
                    label="Motif"
                    name="motif"
                    value={formData.motif}
                    onChange={handleInputChange}
                    multiline
                    rows={3}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.justifiee}
                        onChange={handleInputChange}
                        name="justifiee"
                      />
                    }
                    label="Justifiée"
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
                disabled={actionLoading || !formData.employe || !formData.date_debut_absence || !formData.date_fin_absence || !formData.id_absence || employes.length === 0}
                sx={{ borderRadius: 2, px: 3, py: 1 }}
              >
                {actionLoading ? <CircularProgress size={24} /> : (editingAbsence ? "Modifier" : "Créer")}
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

export default Absences;