import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  Button,
  TableHead,
  Toolbar,
  TableRow,
  TablePagination,
  Chip,
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  InputAdornment,
  Snackbar,
  Alert,
  DialogTitle,
  Fab,
  Card,
  CardContent,
  CircularProgress,
  alpha,
  styled,
  useTheme,
  IconButton,
} from "@mui/material";

import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Apartment as ApartmentIcon,
  People as PeopleIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  Home as HomeIcon,
  AccessTime as AccessTimeIcon,
  BeachAccess as BeachAccessIcon,
  Block as BlockIcon,
  EventAvailable as EventAvailableIcon,
} from "@mui/icons-material";

import axios from "axios";
import Swal from "sweetalert2";
import {
  getDepartements,
  createDepartement,
  updateDepartement,
  deleteDepartement,
} from "../../services/api";
import Header from "../../components/Header";

// --- Styled Components ---
const ModernDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialog-paper": {
    borderRadius: 16,
    background: "linear-gradient(145deg, #ffffff, #f0f4f8)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    overflow: "hidden",
    transition: "all 0.3s ease-in-out",
  },
}));

const ModernDialogTitle = styled(DialogTitle)(({ theme }) => ({
  background: theme.palette.primary.main,
  color: "white",
  padding: theme.spacing(2, 3),
  fontWeight: "bold",
  fontSize: "1.5rem",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  "& .MuiIconButton-root": {
    color: "white",
  },
}));

const ModernTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: 12,
    transition: "all 0.3s ease",
    background: "rgba(255, 255, 255, 0.9)",
    "&:hover": {
      background: "rgba(255, 255, 255, 1)",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    },
    "&.Mui-focused": {
      boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.2)}`,
    },
  },
  "& .MuiInputLabel-root": {
    fontWeight: 500,
    color: theme.palette.text.secondary,
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: theme.palette.primary.main,
  },
}));

const ModernButton = styled(Button)(({ theme }) => ({
  borderRadius: 12,
  padding: theme.spacing(1.5, 3),
  fontWeight: "bold",
  textTransform: "none",
  transition: "all 0.3s ease",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
  },
}));

const drawerWidth = 240;

const Departements = () => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingDepartement, setEditingDepartement] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "error",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [formErrors, setFormErrors] = useState({});
  const [departements, setDepartements] = useState([]);
  const [user, setUser] = useState(null);
  const [notificationsCount, setNotificationsCount] = useState(3);

  const [formData, setFormData] = useState({
    id_departement: "",
    nom: "",
    responsable: "",
    description: "",
    localisation: "",
    nbr_employe: 0,
  });

  const menuItems = [
    { text: "Accueil", path: "/Home", icon: <HomeIcon /> },
    { text: "Départements", path: "/departements", icon: <ApartmentIcon /> },
    { text: "Employés", path: "/employes", icon: <PeopleIcon /> },
    { text: "Pointages", path: "/pointages", icon: <AccessTimeIcon /> },
    { text: "Congés", path: "/conges", icon: <BeachAccessIcon /> },
    { text: "Absences", path: "/absences", icon: <BlockIcon /> },
    { text: "Événements", path: "/evenements", icon: <EventAvailableIcon /> },
  ];

  // --- Récupération utilisateur via JWT ---
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) return navigate("/");

      try {
        const res = await axios.get("http://localhost:8000/api/users/me/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch (err) {
        console.error(err);
        localStorage.removeItem("access_token");
        navigate("/");
      }
    };
    fetchUser();
    fetchDepartements();
  }, [navigate]);

  // --- CRUD Départements ---
  const fetchDepartements = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDepartements();
      setDepartements(
        Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : []
      );
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Erreur lors du chargement des départements");
      showSnackbar("Impossible de charger les départements");
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.id_departement.trim()) {
      errors.id_departement = "L'ID du département est requis";
    }
    if (!formData.nom.trim()) {
      errors.nom = "Le nom du département est requis";
    }
    if (!formData.responsable.trim()) {
      errors.responsable = "Le responsable est requis";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenDialog = (departement = null) => {
    if (departement) {
      setEditingDepartement(departement);
      setFormData({ 
        ...departement,
        nbr_employe: 0 // Toujours initialiser à 0 dans le formulaire
      });
    } else {
      setEditingDepartement(null);
      setFormData({
        id_departement: "",
        nom: "",
        responsable: "",
        description: "",
        localisation: "",
        nbr_employe: 0, // Toujours initialiser à 0
      });
    }
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingDepartement(null);
    setFormData({
      id_departement: "",
      nom: "",
      responsable: "",
      description: "",
      localisation: "",
      nbr_employe: 0, // Toujours initialiser à 0
    });
    setFormErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      await Swal.fire({
        icon: "error",
        title: "Erreur de validation",
        text: "Veuillez corriger les erreurs dans le formulaire.",
        confirmButtonColor: "#1976d2",
      });
      return;
    }
    try {
      // Préparer les données à envoyer (sans nbr_employe car calculé automatiquement)
      const submitData = {
        id_departement: formData.id_departement,
        nom: formData.nom,
        responsable: formData.responsable,
        description: formData.description,
        localisation: formData.localisation,
        // nbr_employe est géré automatiquement par le backend
      };

      if (editingDepartement) {
        await updateDepartement(editingDepartement.id_departement, submitData);
        await Swal.fire({
          icon: "success",
          title: "Succès",
          text: "Département mis à jour avec succès !",
          confirmButtonColor: "#1976d2",
          timer: 2000,
          timerProgressBar: true,
        });
      } else {
        await createDepartement(submitData);
        await Swal.fire({
          icon: "success",
          title: "Succès",
          text: "Département créé avec succès !",
          confirmButtonColor: "#1976d2",
          timer: 2000,
          timerProgressBar: true,
        });
      }
      await fetchDepartements();
      handleCloseDialog();
    } catch (err) {
      console.error(err);
      const errorMessage =
        err.response?.data?.message || "Erreur lors de l'opération";
      showSnackbar(errorMessage);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Supprimer le département",
      text: "Voulez-vous vraiment supprimer ce département ?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#1976d2",
      cancelButtonColor: "#d33",
      confirmButtonText: "Oui, supprimer",
      cancelButtonText: "Annuler",
      reverseButtons: true,
    });
    if (result.isConfirmed) {
      try {
        await deleteDepartement(id);
        await Swal.fire({
          icon: "success",
          title: "Supprimé",
          text: "Département supprimé avec succès !",
          confirmButtonColor: "#1976d2",
          timer: 2000,
          timerProgressBar: true,
        });
        fetchDepartements();
      } catch (err) {
        console.error(err);
        const errorMessage =
          err.response?.data?.message || "Impossible de supprimer";
        showSnackbar(errorMessage);
      }
    }
  };

  const showSnackbar = (message, severity = "error") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () =>
    setSnackbar({ ...snackbar, open: false });

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredData = departements.filter(
    (d) =>
      (d.id_departement || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (d.nom || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.responsable || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );
  const paginatedData = filteredData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  if (error)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );

  return (
    <Box sx={{ display: "flex" }}>
      {/* Header */}
      <Header
        user={user}
        notificationsCount={notificationsCount}
        onMenuToggle={() => setOpen(!open)}
      />

      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
          },
          display: { xs: "none", md: "block" },
        }}
        open
      >
        <Toolbar />
        <Divider />
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                component={Link}
                to={item.path}
                selected={location.pathname === item.path}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Drawer mobile */}
      <Drawer
        anchor="left"
        open={open}
        onClose={() => setOpen(false)}
        sx={{ display: { md: "none" } }}
      >
        <Box sx={{ width: drawerWidth }}>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  component={Link}
                  to={item.path}
                  onClick={() => setOpen(false)}
                  selected={location.pathname === item.path}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Contenu principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: "#f8fafc",
          minHeight: "100vh",
          p: 3,
          mt: 8,
          ml: { md: `${drawerWidth}px` },
        }}
      >
        {/* Titre + bouton */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
            mb: 3,
          }}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: "bold" }}>
              Gestion des Départements
            </Typography>
            <Typography color="text.secondary">
              Gérez les départements de votre entreprise
            </Typography>
          </Box>
          <Fab
            color="primary"
            onClick={() => handleOpenDialog()}
            sx={{
              borderRadius: 2,
              minWidth: 200,
              px: 3,
              textTransform: "none",
              fontWeight: "bold",
              fontSize: "1rem",
            }}
          >
            <AddIcon sx={{ mr: 1 }} />
            Nouveau Département
          </Fab>
        </Box>

        {/* Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography color="text.secondary">
                  Total Départements
                </Typography>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: "bold", color: "primary.main" }}
                >
                  {departements.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography color="text.secondary">Total Employés</Typography>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: "bold", color: "secondary.main" }}
                >
                  {departements.reduce(
                    (sum, d) => sum + (d.nbr_employe || 0),
                    0
                  )}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Recherche */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
          <TextField
            fullWidth
            placeholder="Rechercher par ID, nom ou responsable..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton onClick={() => setSearchTerm("")}>
                    <CloseIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Paper>

        {/* Tableau */}
        <Paper sx={{ width: "100%", borderRadius: 3 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Nom</TableCell>
                  <TableCell>Responsable</TableCell>
                  <TableCell>Localisation</TableCell>
                  <TableCell>Employés</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.map((row) => (
                  <TableRow key={row.id_departement} hover>
                    <TableCell>
                      <Chip
                        label={row.id_departement || "N/A"}
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{row.nom || "N/A"}</TableCell>
                    <TableCell>{row.responsable || "Non défini"}</TableCell>
                    <TableCell>{row.localisation || "Non défini"}</TableCell>
                    <TableCell>
                      <Chip
                        label={row.nbr_employe || 0}
                        color={
                          row.nbr_employe > 20 ? "success" : "default"
                        }
                        variant="filled"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <IconButton
                          color="primary"
                          onClick={() => handleOpenDialog(row)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDelete(row.id_departement)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {paginatedData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        {searchTerm
                          ? "Aucun département ne correspond à votre recherche"
                          : "Aucun département trouvé"}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {filteredData.length > 0 && (
            <TablePagination>
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredData.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Lignes par page"
            </TablePagination>
          )}
        </Paper>

        {/* Dialog */}
        <ModernDialog open={openDialog} onClose={handleCloseDialog} fullWidth>
          <ModernDialogTitle>
            {editingDepartement
              ? "Modifier Département"
              : "Nouveau Département"}
            <IconButton onClick={handleCloseDialog}>
              <CloseIcon />
            </IconButton>
          </ModernDialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent sx={{ p: 3 }}>
              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <ModernTextField
                    fullWidth
                    label="ID *"
                    value={formData.id_departement}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        id_departement: e.target.value,
                      })
                    }
                    error={!!formErrors.id_departement}
                    helperText={formErrors.id_departement}
                    required
                    disabled={editingDepartement != null}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <ModernTextField
                    fullWidth
                    label="Nom *"
                    value={formData.nom}
                    onChange={(e) =>
                      setFormData({ ...formData, nom: e.target.value })
                    }
                    error={!!formErrors.nom}
                    helperText={formErrors.nom}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <ModernTextField
                    fullWidth
                    label="Responsable *"
                    value={formData.responsable}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        responsable: e.target.value,
                      })
                    }
                    error={!!formErrors.responsable}
                    helperText={formErrors.responsable}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <ModernTextField
                    fullWidth
                    label="Nombre d'employés"
                    type="number"
                    value={0} // Toujours afficher 0 (lecture seule)
                    InputProps={{
                      readOnly: true,
                    }}
                    helperText="Calculé automatiquement"
                  />
                </Grid>
                <Grid item xs={12}>
                  <ModernTextField
                    fullWidth
                    label="Description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        description: e.target.value,
                      })
                    }
                    multiline
                    rows={3}
                  />
                </Grid>
                <Grid item xs={12}>
                  <ModernTextField
                    fullWidth
                    label="Localisation"
                    value={formData.localisation}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        localisation: e.target.value,
                      })
                    }
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3, justifyContent: "space-between" }}>
              <ModernButton
                onClick={handleCloseDialog}
                color="inherit"
                variant="outlined"
              >
                Annuler
              </ModernButton>
              <ModernButton
                type="submit"
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
              >
                {editingDepartement ? "Mettre à jour" : "Enregistrer"}
              </ModernButton>
            </DialogActions>
          </form>
        </ModernDialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default Departements;