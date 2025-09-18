import React, { useState, useEffect } from "react";
import {
  AppBar, Toolbar, Box, Typography, IconButton, Badge, Avatar, Button,
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider,
  Paper, Table, TableContainer, TableHead, TableRow, TableCell, TableBody,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Fab, Alert, Snackbar, Grid, Card, CardContent,
  Chip, MenuItem, CircularProgress, Tooltip, InputAdornment, FormControl, InputLabel, Select
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { format, parseISO, isValid } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from 'react-toastify'; // Added for notifications
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
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';

import { getConges, getEmployes, createConge, updateConge, deleteConge, validerConge, refuserConge, getCurrentUser } from "../../services/api";
import Header, { triggerNotificationsRefresh } from "../../components/Header";

const drawerWidth = 240;

const Conges = () => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [conges, setConges] = useState([]);
  const [employes, setEmployes] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingConge, setEditingConge] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stats, setStats] = useState({ total: 0, enAttente: 0, valides: 0, refuses: 0 });

  const initialFormData = {
    id_conge: "",
    employe: "",
    date_debut: format(new Date(), "yyyy-MM-dd"),
    date_fin: format(new Date(), "yyyy-MM-dd"),
    motif: "",
    motif_refus: "" // Added for edit dialog
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
      const [congesData, employesData] = await Promise.all([
        getConges(),
        getEmployes()
      ]);

      const formattedConges = congesData.map(conge => ({
        ...conge,
        employe_nom: employesData.find(emp => emp.matricule === conge.employe)?.nom_complet ||
          `${employesData.find(emp => emp.matricule === conge.employe)?.prenom || ''} ${employesData.find(emp => emp.matricule === conge.employe)?.nom || ''}`.trim() ||
          conge.employe || 'Inconnu'
      }));

      setConges(formattedConges);
      setEmployes(employesData);

      setStats({
        total: formattedConges.length,
        enAttente: formattedConges.filter(c => c.statut === "en_attente").length,
        valides: formattedConges.filter(c => c.statut === "valide").length,
        refuses: formattedConges.filter(c => c.statut === "refuse").length
      });
      console.log("Congés mis à jour:", formattedConges); // Debug
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

  const handleOpenDialog = (conge = null) => {
    if (conge) {
      setEditingConge(conge);
      setFormData({
        id_conge: conge.id_conge || "",
        employe: conge.employe || "",
        date_debut: conge.date_debut && isValid(parseISO(conge.date_debut)) ? format(parseISO(conge.date_debut), "yyyy-MM-dd") : "",
        date_fin: conge.date_fin && isValid(parseISO(conge.date_fin)) ? format(parseISO(conge.date_fin), "yyyy-MM-dd") : "",
        motif: conge.motif || "",
        motif_refus: conge.motif_refus || "" // Added for edit dialog
      });
    } else {
      setEditingConge(null);
      setFormData(initialFormData);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingConge(null);
    setFormData(initialFormData);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const validateForm = () => {
    if (!formData.employe || !formData.date_debut || !formData.date_fin) {
      showSnackbar("Veuillez remplir tous les champs obligatoires.", "error");
      return false;
    }
    if (formData.id_conge && formData.id_conge.length > 10) {
      showSnackbar("L'ID du congé ne doit pas dépasser 10 caractères.", "error");
      return false;
    }
    if (new Date(formData.date_debut) > new Date(formData.date_fin)) {
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
        id_conge: formData.id_conge || `C${Date.now()}`,
        employe: formData.employe,
        date_debut: formData.date_debut,
        date_fin: formData.date_fin,
        motif: formData.motif || null,
        motif_refus: formData.motif_refus || null // Include motif_refus if editing
      };

      if (editingConge) {
        await updateConge(editingConge.id_conge, payload);
        showSnackbar("Congé modifié avec succès !", "success");
      } else {
        await createConge(payload);
        showSnackbar("Congé créé avec succès ! Un email a été envoyé à l'employé.", "success");
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
      text: "Voulez-vous supprimer ce congé ?",
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
        await deleteConge(id);
        showSnackbar("Congé supprimé avec succès !", "success");
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

  const handleValider = async (id) => {
    const result = await Swal.fire({
      title: "Valider le congé",
      text: "Voulez-vous valider ce congé ? Un email sera envoyé à l'employé.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Oui, valider",
      cancelButtonText: "Annuler",
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      background: theme.palette.background.paper,
      color: theme.palette.text.primary
    });
    if (result.isConfirmed) {
      setActionLoading(true);
      try {
        const response = await validerConge(id);
        toast.success(response.message || "Congé validé avec succès ! Un email a été envoyé à l'employé.");
        await fetchData();
        triggerNotificationsRefresh();
      } catch (error) {
        let errorMessage = error.message || "Erreur lors de la validation.";
        if (error.response?.data) {
          const errors = error.response.data;
          errorMessage = Object.keys(errors)
            .map(key => `${key}: ${Array.isArray(errors[key]) ? errors[key].join(", ") : errors[key]}`)
            .join("; ");
        }
        toast.error(errorMessage);
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleRefuser = async (id) => {
    const result = await Swal.fire({
      title: "Refuser le congé",
      text: "Veuillez indiquer la raison du refus :",
      icon: "question",
      input: "textarea",
      inputPlaceholder: "Entrez la raison du refus...",
      inputAttributes: {
        "aria-label": "Raison du refus"
      },
      showCancelButton: true,
      confirmButtonText: "Oui, refuser",
      cancelButtonText: "Annuler",
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      background: theme.palette.background.paper,
      color: theme.palette.text.primary,
      preConfirm: (motifRefus) => {
        if (!motifRefus) {
          Swal.showValidationMessage("La raison du refus est requise.");
        }
        return motifRefus;
      }
    });
    if (result.isConfirmed) {
      setActionLoading(true);
      try {
        const response = await refuserConge(id, result.value);
        toast.success(response.message || "Congé refusé avec succès ! Un email a été envoyé à l'employé.");
        await fetchData();
        triggerNotificationsRefresh();
      } catch (error) {
        let errorMessage = error.message || "Erreur lors du refus.";
        if (error.response?.data) {
          const errors = error.response.data;
          errorMessage = Object.keys(errors)
            .map(key => `${key}: ${Array.isArray(errors[key]) ? errors[key].join(", ") : errors[key]}`)
            .join("; ");
        }
        toast.error(errorMessage);
      } finally {
        setActionLoading(false);
      }
    }
  };

  const filteredData = conges.filter(conge =>
    (
      (conge.employe_nom || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (conge.id_conge || "").includes(searchTerm) ||
      (conge.motif || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (conge.motif_refus || "").toLowerCase().includes(searchTerm.toLowerCase())
    ) &&
    (statusFilter === "all" || conge.statut === statusFilter)
  );

  const getStatutColor = (statut) => {
    switch (statut) {
      case "valide": return "success";
      case "en_attente": return "warning";
      case "refuse": return "error";
      default: return "default";
    }
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

      {/* Sidebar mobile */}
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
            <Typography variant="h4" sx={{ fontWeight: "bold" }}>Gestion des Congés</Typography>
            <Typography variant="body1" color="text.secondary">Gérez les congés de vos employés</Typography>
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
            Nouveau Congé
          </Fab>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography color="text.secondary">Total Congés</Typography>
                <Typography variant="h4" sx={{ fontWeight: "bold", color: "primary.main" }}>{stats.total}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography color="text.secondary">En Attente</Typography>
                <Typography variant="h4" sx={{ fontWeight: "bold", color: "warning.main" }}>{stats.enAttente}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography color="text.secondary">Validés</Typography>
                <Typography variant="h4" sx={{ fontWeight: "bold", color: "success.main" }}>{stats.valides}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography color="text.secondary">Refusés</Typography>
                <Typography variant="h4" sx={{ fontWeight: "bold", color: "error.main" }}>{stats.refuses}</Typography>
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
                <InputLabel id="status-filter-label">Filtrer par statut</InputLabel>
                <Select
                  labelId="status-filter-label"
                  value={statusFilter}
                  label="Filtrer par statut"
                  onChange={handleStatusFilterChange}
                >
                  <MenuItem value="all">Tous</MenuItem>
                  <MenuItem value="en_attente">En attente</MenuItem>
                  <MenuItem value="valide">Validé</MenuItem>
                  <MenuItem value="refuse">Refusé</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* Conges Table */}
        <Paper sx={{ width: "100%", overflow: "hidden", borderRadius: 3 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>UID Congé</TableCell>
                  <TableCell>Employé</TableCell>
                  <TableCell>Date Début</TableCell>
                  <TableCell>Date Fin</TableCell>
                  <TableCell>Motif</TableCell>
                  <TableCell>Statut</TableCell>
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
                    <TableCell colSpan={7} align="center">Aucun congé trouvé</TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((conge) => (
                    <TableRow key={conge.id_conge} hover>
                      <TableCell>
                        <Chip
                          label={conge.id_conge}
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
                              {conge.employe_nom || conge.employe || "Inconnu"}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {conge.employe_matricule || conge.employe}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {conge.date_debut && isValid(parseISO(conge.date_debut))
                          ? format(parseISO(conge.date_debut), "dd MMMM yyyy", { locale: fr })
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {conge.date_fin && isValid(parseISO(conge.date_fin))
                          ? format(parseISO(conge.date_fin), "dd MMMM yyyy", { locale: fr })
                          : "-"}
                      </TableCell>
                      <TableCell>{conge.motif || "-"}</TableCell>
                      <TableCell>
                        <Chip
                          label={conge.statut || "Inconnu"}
                          color={getStatutColor(conge.statut)}
                          variant="filled"
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Tooltip title="Modifier">
                            <IconButton color="primary" onClick={() => handleOpenDialog(conge)} disabled={actionLoading}>
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Supprimer">
                            <IconButton color="error" onClick={() => handleDelete(conge.id_conge)} disabled={actionLoading}>
                              {actionLoading && deletingId === conge.id_conge ? <CircularProgress size={24} /> : <DeleteIcon />}
                            </IconButton>
                          </Tooltip>
                          {conge.statut === "en_attente" && (
                            <>
                              <Tooltip title="Valider">
                                <IconButton color="success" onClick={() => handleValider(conge.id_conge)} disabled={actionLoading}>
                                  <CheckIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Refuser">
                                <IconButton color="error" onClick={() => handleRefuser(conge.id_conge)} disabled={actionLoading}>
                                  <CloseIcon />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Dialog for Add/Edit Conge */}
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle>
            {editingConge ? "Modifier le congé" : "Nouveau congé"}
          </DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent sx={{ pt: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    margin="dense"
                    label="ID Congé"
                    name="id_conge"
                    value={formData.id_conge}
                    onChange={handleInputChange}
                    required
                    disabled={editingConge !== null}
                    inputProps={{ maxLength: 10 }}
                    helperText="Entrez un ID unique (max 10 caractères)"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="dense" required>
                    <InputLabel id="employe-label">Employé</InputLabel>
                    <Select
                      labelId="employe-label"
                      name="employe"
                      value={formData.employe}
                      onChange={handleInputChange}
                      disabled={employes.length === 0}
                      label="Employé"
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
                    </Select>
                    {employes.length === 0 && (
                      <Typography variant="caption" color="error">Aucun employé disponible</Typography>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    margin="dense"
                    label="Date Début"
                    name="date_debut"
                    type="date"
                    value={formData.date_debut}
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
                    name="date_fin"
                    type="date"
                    value={formData.date_fin}
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
                {editingConge && editingConge.statut === "refuse" && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      margin="dense"
                      label="Raison du Refus"
                      name="motif_refus"
                      value={formData.motif_refus}
                      onChange={handleInputChange}
                      multiline
                      rows={3}
                      disabled
                      helperText="Raison du refus (lecture seule)"
                    />
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3, gap: 1 }}>
              <Button onClick={handleCloseDialog} disabled={actionLoading} color="inherit">
                Annuler
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={actionLoading || !formData.employe || !formData.date_debut || !formData.date_fin || employes.length === 0}
                sx={{ borderRadius: 2, px: 3, py: 1 }}
              >
                {actionLoading ? <CircularProgress size={24} /> : (editingConge ? "Modifier" : "Créer")}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Snackbar for Notifications */}
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

export default Conges;