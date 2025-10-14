import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Fab,
  Card,
  CardContent,
  CircularProgress,
  useTheme,
  TextField,
  InputAdornment,
  IconButton,
  Snackbar,
  Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  Add as AddIcon,
  Search as SearchIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import Swal from "sweetalert2";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import DepartementTableau from "./DepartementTableau";
import DepartementModal from "./DepartementModal";
import {
  getDepartements,
  createDepartement,
  updateDepartement,
  deleteDepartement,
  getCurrentUser,
  isSuperuser,
} from "../../services/api";

const Departements = ({ isSuperuser: isSuperuserProp }) => {
  const theme = useTheme();
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
  const [currentUser, setCurrentUser] = useState(null);
  const [isSuperuserState, setIsSuperuserState] = useState(isSuperuserProp);
  const [notificationsCount, setNotificationsCount] = useState(3);
  const [formData, setFormData] = useState({
    id_departement: "",
    nom: "",
    responsable: "",
    description: "",
    localisation: "",
    nbr_employe: 0,
  });

  // --- Récupération utilisateur et statut superutilisateur ---
  useEffect(() => {
    const fetchUserAndData = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        navigate("/");
        return;
      }

      try {
        // Récupérer les informations de l'utilisateur
        const user = await getCurrentUser();
        setCurrentUser(user);

        // Vérifier le statut de superutilisateur si non passé en prop
        if (!isSuperuserProp) {
          const superuser = await isSuperuser();
          setIsSuperuserState(superuser);
        }

        // Récupérer les départements
        await fetchDepartements();
      } catch (err) {
        console.error("Erreur lors de la récupération de l'utilisateur:", err);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        setCurrentUser(null);
        navigate("/");
      }
    };

    fetchUserAndData();
  }, [navigate, isSuperuserProp]);

  // --- CRUD Départements ---
  const fetchDepartements = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDepartements();
      console.log("Données des départements:", data); // Débogage
      setDepartements(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (err) {
      console.error("Erreur lors du chargement des départements:", err);
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
        nbr_employe: 0, // Toujours initialiser à 0 dans le formulaire
      });
    } else {
      setEditingDepartement(null);
      setFormData({
        id_departement: "",
        nom: "",
        responsable: "",
        description: "",
        localisation: "",
        nbr_employe: 0,
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
      nbr_employe: 0,
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
      console.error("Erreur lors de l'opération:", err);
      const errorMessage = err.message || "Erreur lors de l'opération";
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
        console.error("Erreur lors de la suppression:", err);
        const errorMessage = err.message || "Impossible de supprimer";
        showSnackbar(errorMessage);
      }
    }
  };

  const showSnackbar = (message, severity = "error") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredData = departements.filter(
    (d) =>
      (d.id_departement || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.nom || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.responsable || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex" }}>
      {/* Header */}
      <Header
        user={currentUser}
        notificationsCount={notificationsCount}
        onMenuToggle={() => setOpen(!open)}
      />

      {/* Sidebar */}
      <Sidebar open={open} setOpen={setOpen} />

      {/* Contenu principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: "#f8fafc",
          minHeight: "100vh",
          p: 3,
          mt: 8,
          ml: { md: `240px` },
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
              width: 300,
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
                  {departements.reduce((sum, d) => sum + (d.nbr_employe || 0), 0)}
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
        <DepartementTableau
          data={filteredData}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          onEdit={handleOpenDialog}
          onDelete={handleDelete}
          currentUser={currentUser}
          isSuperuser={isSuperuserState}
        />

        {/* Modal */}
        <DepartementModal
          open={openDialog}
          onClose={handleCloseDialog}
          editingDepartement={editingDepartement}
          formData={formData}
          setFormData={setFormData}
          formErrors={formErrors}
          onSubmit={handleSubmit}
        />

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