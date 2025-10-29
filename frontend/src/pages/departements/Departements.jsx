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
  Button,
  Stack
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  Add as AddIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Print as PrintIcon
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
  getEmployes,
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
    severity: "success",
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
  const [usersMap, setUsersMap] = useState({});
  const [processing, setProcessing] = useState(false);
  
  // ✅ NOUVEAU ÉTAT POUR PDF
  const [generatingPDF, setGeneratingPDF] = useState(false);

  // --- Récupération utilisateur et statut superutilisateur ---
  useEffect(() => {
    const fetchUserAndData = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        navigate("/");
        return;
      }

      try {
        const user = await getCurrentUser();
        setCurrentUser(user);

        if (!isSuperuserProp) {
          const superuser = await isSuperuser();
          setIsSuperuserState(superuser);
        }

        await fetchUsersMap();
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

  // Récupérer la map des utilisateurs
  const fetchUsersMap = async () => {
    try {
      const employes = await getEmployes();
      const users = {};
      
      employes.forEach(emp => {
        if (emp.id) {
          const nomComplet = emp.nom || emp.prenom ? `${emp.prenom || ''} ${emp.nom || ''}`.trim() : emp.email || `Employé ${emp.id}`;
          users[emp.id] = nomComplet;
        }
      });
      
      setUsersMap(users);
    } catch (err) {
      console.error("Erreur lors du chargement des utilisateurs:", err);
    }
  };

  // --- CRUD Départements ---
  const fetchDepartements = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDepartements();
      setDepartements(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erreur lors du chargement des départements:", err);
      setError("Erreur lors du chargement des départements");
      showSnackbar("Impossible de charger les départements", "error");
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour obtenir le nom du créateur
  const getCreatorName = (departement) => {
    if (!departement.created_by) {
      return "Utilisateur inconnu";
    }

    if (departement.created_by_name) {
      return departement.created_by_name;
    }

    if (departement.created_by_username) {
      return departement.created_by_username;
    }

    if (usersMap[departement.created_by]) {
      return usersMap[departement.created_by];
    }

    if (currentUser && departement.created_by === currentUser.id) {
      return currentUser.nom || currentUser.prenom ? `${currentUser.prenom || ''} ${currentUser.nom || ''}`.trim() : currentUser.email || "Vous";
    }

    return `Utilisateur ${departement.created_by}`;
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
        nbr_employe: departement.nbr_employe || 0,
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
    console.log("🚀 Début de handleSubmit", { formData, editingDepartement });

    if (!validateForm()) {
      console.log("❌ Validation échouée", formErrors);
      showSnackbar("Veuillez corriger les erreurs dans le formulaire", "error");
      return;
    }

    setProcessing(true);
    
    try {
      // Préparer les données
      const submitData = {
        id_departement: formData.id_departement.trim(),
        nom: formData.nom.trim(),
        responsable: formData.responsable.trim(),
        description: formData.description?.trim() || "",
        localisation: formData.localisation?.trim() || "",
      };

      console.log("📤 Données à envoyer:", submitData);

      // SweetAlert de chargement
      const loadingSwal = Swal.fire({
        title: editingDepartement ? 'Mise à jour...' : 'Création...',
        text: 'Traitement en cours',
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Appel API
      if (editingDepartement) {
        console.log("🔄 Mode édition");
        await updateDepartement(editingDepartement.id_departement, submitData);
      } else {
        console.log("➕ Mode création");
        await createDepartement(submitData);
      }

      // Fermer SweetAlert de chargement
      await loadingSwal.close();

      // Message de succès
      await Swal.fire({
        icon: "success",
        title: "Succès !",
        text: editingDepartement ? "Département modifié avec succès" : "Département créé avec succès",
        confirmButtonColor: "#1976d2",
        timer: 2000,
        showConfirmButton: false
      });
      
      // Rafraîchir les données
      await fetchDepartements();
      
      // Fermer le modal
      handleCloseDialog();
      
      // Snackbar de confirmation
      showSnackbar(
        editingDepartement ? "Département modifié avec succès" : "Département créé avec succès", 
        "success"
      );
      
      console.log("✅ Opération terminée avec succès");
      
    } catch (err) {
      console.error("❌ Erreur lors de l'opération:", err);
      
      let errorMessage = "Erreur lors de l'opération";
      
      if (err.response) {
        errorMessage = err.response.data?.message || `Erreur ${err.response.status}`;
      } else if (err.request) {
        errorMessage = "Impossible de contacter le serveur";
      } else {
        errorMessage = err.message || errorMessage;
      }
      
      // Fermer SweetAlert de chargement si ouvert
      Swal.close();
      
      // Message d'erreur
      await Swal.fire({
        icon: "error",
        title: "Erreur",
        text: errorMessage,
        confirmButtonColor: "#d32f2f",
      });
      
      showSnackbar(errorMessage, "error");
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Êtes-vous sûr ?",
      text: "Cette action est irréversible !",
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
        const deleteResult = Swal.fire({
          title: 'Suppression en cours',
          text: 'Suppression du département...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        await deleteDepartement(id);
        
        Swal.close();
        
        await Swal.fire({
          icon: "success",
          title: "Supprimé !",
          text: "Département supprimé avec succès",
          confirmButtonColor: "#1976d2",
          timer: 2000,
          showConfirmButton: false
        });
        
        await fetchDepartements();
        showSnackbar("Département supprimé avec succès", "success");
      } catch (err) {
        console.error("Erreur lors de la suppression:", err);
        const errorMessage = err.message || "Impossible de supprimer";
        
        Swal.close();
        
        await Swal.fire({
          icon: "error",
          title: "Erreur",
          text: errorMessage,
          confirmButtonColor: "#d32f2f",
        });
        
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

  const handleChangePage = (event, newPage) => setPage(newPage);
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredData = departements.filter(
    (d) =>
      (d.id_departement || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.nom || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.responsable || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (getCreatorName(d) || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress />
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
          ml: { md: open ? `240px` : 0 },
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        {/* Titre + boutons */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 2,
            mb: 3,
          }}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: "bold", mb: 1 }}>
              Gestion des Départements
            </Typography>
            <Typography color="text.secondary">
              Gérez les départements de votre entreprise
            </Typography>
          </Box>
          
          {/* ✅ NOUVEAU : STACK AVEC BOUTON PDF ET NOUVEAU DÉPARTEMENT */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>        
            <Fab
              color="primary"
              onClick={() => handleOpenDialog()}
              disabled={processing}
              variant="extended"
              sx={{
                borderRadius: 2,
                minWidth: 200,
                px: 3,
                textTransform: "none",
                fontWeight: "bold",
                fontSize: '1rem'
              }}
            >
              <AddIcon sx={{ mr: 1 }} />
              Nouveau Département
            </Fab>
          </Stack>
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
            placeholder="Rechercher par ID, nom, responsable ou créateur..."
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
                  <IconButton onClick={() => setSearchTerm("")} size="small">
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
          getCreatorName={getCreatorName}
          processing={processing}
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
          processing={processing}
        />

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
            variant="filled"
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default Departements;