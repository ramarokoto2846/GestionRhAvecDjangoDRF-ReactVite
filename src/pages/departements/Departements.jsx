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
  Stack,
  alpha,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  Add as AddIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Print as PrintIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
  LocationOn as LocationOnIcon,
  Person as PersonIcon,
  Description as DescriptionIcon,
  FilterList as FilterListIcon
} from "@mui/icons-material";
import Swal from "sweetalert2";
import Header from "../../components/Header";
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

// Palette de couleurs ORTM (identique aux autres pages)
const ORTM_COLORS = {
  primary: "#1B5E20",
  primaryLight: "#4CAF50",
  primaryDark: "#0D3D12",
  secondary: "#FFC107",
  secondaryLight: "#FFD54F",
  secondaryDark: "#FF8F00",
  background: "#F8FDF9",
  surface: "#FFFFFF",
  text: "#1A331C",
  error: "#D32F2F",
  success: "#2E7D32",
  warning: "#FF9800",
  info: "#1976D2"
};

// Composant DetailItem identique aux autres pages
const DetailItem = ({ icon, label, value, color = "text.primary", size = "medium" }) => (
  <Box sx={{ 
    display: 'flex', 
    alignItems: 'center', 
    gap: 2, 
    py: size === 'small' ? 0.5 : 1,
    borderRadius: 2,
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: alpha(ORTM_COLORS.primary, 0.02),
    }
  }}>
    <Box sx={{ 
      color: ORTM_COLORS.primary, 
      minWidth: 24,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {icon}
    </Box>
    <Box sx={{ flex: 1 }}>
      <Typography 
        variant={size === 'small' ? 'caption' : 'subtitle2'} 
        color="text.secondary" 
        fontSize={size === 'small' ? '0.75rem' : '0.8rem'}
        fontWeight="500"
      >
        {label}
      </Typography>
      <Typography 
        variant={size === 'small' ? 'body2' : 'body1'} 
        color={color} 
        fontWeight="600"
        sx={{ 
          wordBreak: 'break-word',
          lineHeight: 1.2
        }}
      >
        {value || "Non spécifié"}
      </Typography>
    </Box>
  </Box>
);

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
  const [detailView, setDetailView] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

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

  const showDetails = (departement) => {
    setDetailView(departement);
  };

  const closeDetails = () => {
    setDetailView(null);
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
        setDeletingId(id);
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
      } finally {
        setDeletingId(null);
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

      {/* ✅ CONTENU PRINCIPAL AVEC STYLE IDENTIQUE AUX AUTRES PAGES */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: ORTM_COLORS.background,
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
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* ✅ TITRE + BOUTONS - STYLE IDENTIQUE */}
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
            <Typography variant="h4" sx={{ fontWeight: "bold", mb: 1, color: ORTM_COLORS.text }}>
              Gestion des Départements
            </Typography>
            <Typography color="text.secondary">
              Gérez les départements de votre entreprise
            </Typography>
          </Box>
          
          {/* ✅ BOUTON AVEC STYLE IDENTIQUE */}
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
                fontSize: '1rem',
                background: `linear-gradient(135deg, ${ORTM_COLORS.primary} 0%, ${ORTM_COLORS.primaryLight} 100%)`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${ORTM_COLORS.primaryDark} 0%, ${ORTM_COLORS.primary} 100%)`,
                }
              }}
            >
              <AddIcon sx={{ mr: 1 }} />
              Nouveau Département
            </Fab>
          </Stack>
        </Box>

        {/* ✅ CARTES DE STATISTIQUES - STYLE IDENTIQUE */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              borderRadius: 3, 
              boxShadow: `0 4px 20px ${alpha(ORTM_COLORS.primary, 0.1)}`,
              background: `linear-gradient(135deg, ${ORTM_COLORS.surface} 0%, ${alpha(ORTM_COLORS.primary, 0.05)} 100%)`
            }}>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Départements
                </Typography>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: "bold", color: ORTM_COLORS.primary }}
                >
                  {departements.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              borderRadius: 3, 
              boxShadow: `0 4px 20px ${alpha(ORTM_COLORS.secondary, 0.1)}`,
              background: `linear-gradient(135deg, ${ORTM_COLORS.surface} 0%, ${alpha(ORTM_COLORS.secondary, 0.05)} 100%)`
            }}>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>Total Employés</Typography>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: "bold", color: ORTM_COLORS.secondary }}
                >
                  {departements.reduce((sum, d) => sum + (d.nbr_employe || 0), 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* ✅ BARRE DE RECHERCHE - STYLE IDENTIQUE */}
        <Paper sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 3,
          background: `linear-gradient(135deg, ${ORTM_COLORS.surface} 0%, ${alpha(ORTM_COLORS.primary, 0.02)} 100%)`,
          boxShadow: `0 4px 20px ${alpha(ORTM_COLORS.primary, 0.08)}`
        }}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: ORTM_COLORS.primary }}>
            <FilterListIcon />
            Recherche Avancée
          </Typography>
          
          <TextField
            fullWidth
            placeholder="Rechercher par ID, nom, responsable ou créateur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="primary" />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton 
                    onClick={() => setSearchTerm("")} 
                    size="small"
                  >
                    <CloseIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Paper>

        {/* ✅ TABLEAU - STYLE IDENTIQUE */}
        <Paper sx={{ 
          width: "100%", 
          overflow: "hidden", 
          borderRadius: 3,
          background: `linear-gradient(135deg, ${ORTM_COLORS.surface} 0%, ${alpha(ORTM_COLORS.primary, 0.02)} 100%)`,
          boxShadow: `0 4px 20px ${alpha(ORTM_COLORS.primary, 0.08)}`
        }}>
          <DepartementTableau
            data={filteredData}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            onEdit={handleOpenDialog}
            onDelete={handleDelete}
            onViewDetails={showDetails}
            currentUser={currentUser}
            isSuperuser={isSuperuserState}
            getCreatorName={getCreatorName}
            processing={processing}
            deletingId={deletingId}
          />
        </Paper>

        {/* ✅ DIALOG DES DÉTAILS - STYLE IDENTIQUE */}
        <Dialog
          open={!!detailView}
          onClose={closeDetails}
          maxWidth="md"
          fullWidth
          PaperProps={{ 
            sx: { 
              borderRadius: 3,
              background: ORTM_COLORS.surface,
              boxShadow: `0 20px 60px ${alpha(ORTM_COLORS.primary, 0.2)}`,
              overflow: 'hidden'
            }
          }}
        >
          <DialogTitle sx={{ 
            background: `linear-gradient(135deg, ${ORTM_COLORS.primary} 0%, ${ORTM_COLORS.primaryDark} 100%)`,
            color: 'white',
            py: 3,
            position: 'relative'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)',
                width: 56,
                height: 56
              }}>
                <BusinessIcon fontSize="large" />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  Détails du Département
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  ID: {detailView?.id_departement || "Inconnu"}
                </Typography>
              </Box>
            </Box>
          </DialogTitle>
          
          <DialogContent sx={{ pt: 4, pb: 2 }}>
            {detailView && (
              <Grid container spacing={3}>
                {/* En-tête avec nombre d'employés */}
                <Grid item xs={12}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    mb: 3,
                    p: 2,
                    borderRadius: 2,
                    background: alpha(ORTM_COLORS.primary, 0.05)
                  }}>
                    <Chip
                      icon={<PeopleIcon />}
                      label={`${detailView.nbr_employe || 0} employé(s)`}
                      color="primary"
                      variant="filled"
                      sx={{ 
                        fontWeight: 'bold', 
                        fontSize: '0.9rem',
                        px: 2,
                        py: 1
                      }}
                    />
                  </Box>
                </Grid>

                {/* Informations principales */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ 
                    borderRadius: 2, 
                    boxShadow: `0 4px 12px ${alpha(ORTM_COLORS.primary, 0.1)}`,
                    height: '100%',
                    border: `1px solid ${alpha(ORTM_COLORS.primary, 0.1)}`
                  }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1,
                        color: ORTM_COLORS.primary,
                        mb: 3
                      }}>
                        <BusinessIcon />
                        Informations Principales
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <DetailItem 
                          icon={<BusinessIcon />}
                          label="ID Département"
                          value={detailView.id_departement || "-"}
                          color={ORTM_COLORS.primary}
                        />
                        <Divider sx={{ my: 1 }} />
                        <DetailItem 
                          icon={<DescriptionIcon />}
                          label="Nom"
                          value={detailView.nom || "-"}
                          color={ORTM_COLORS.success}
                        />
                        <Divider sx={{ my: 1 }} />
                        <DetailItem 
                          icon={<PersonIcon />}
                          label="Responsable"
                          value={detailView.responsable || "-"}
                          color={ORTM_COLORS.info}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Informations supplémentaires */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ 
                    borderRadius: 2, 
                    boxShadow: `0 4px 12px ${alpha(ORTM_COLORS.primary, 0.1)}`,
                    height: '100%',
                    border: `1px solid ${alpha(ORTM_COLORS.primary, 0.1)}`
                  }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1,
                        color: ORTM_COLORS.primary,
                        mb: 3
                      }}>
                        <LocationOnIcon />
                        Informations Supplémentaires
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <DetailItem 
                          icon={<LocationOnIcon />}
                          label="Localisation"
                          value={detailView.localisation || "Non spécifiée"}
                          color={ORTM_COLORS.warning}
                        />
                        <Divider sx={{ my: 1 }} />
                        <DetailItem 
                          icon={<PeopleIcon />}
                          label="Nombre d'Employés"
                          value={detailView.nbr_employe || 0}
                          color={ORTM_COLORS.secondary}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Description */}
                {detailView.description && (
                  <Grid item xs={12}>
                    <Card sx={{ 
                      borderRadius: 2, 
                      boxShadow: `0 4px 12px ${alpha(ORTM_COLORS.primary, 0.1)}`,
                      border: `1px solid ${alpha(ORTM_COLORS.primary, 0.1)}`
                    }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 1,
                          color: ORTM_COLORS.primary
                        }}>
                          <DescriptionIcon />
                          Description
                        </Typography>
                        <Paper 
                          variant="outlined" 
                          sx={{ 
                            p: 2, 
                            mt: 2,
                            bgcolor: alpha(ORTM_COLORS.primary, 0.03),
                            borderColor: alpha(ORTM_COLORS.primary, 0.2),
                            borderRadius: 2
                          }}
                        >
                          <Typography variant="body1" color="text.primary" sx={{ lineHeight: 1.6 }}>
                            {detailView.description}
                          </Typography>
                        </Paper>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            )}
          </DialogContent>
          
          <DialogActions sx={{ 
            px: 3, 
            py: 2, 
            background: alpha(ORTM_COLORS.primary, 0.02),
            borderTop: `1px solid ${alpha(ORTM_COLORS.primary, 0.1)}`
          }}>
            <Button 
              onClick={closeDetails}
              variant="outlined"
              startIcon={<CloseIcon />}
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 'bold',
                px: 3
              }}
            >
              Fermer
            </Button>
            {detailView && (
              <Button 
                onClick={() => {
                  handleOpenDialog(detailView);
                  closeDetails();
                }}
                variant="contained"
                startIcon={<BusinessIcon />}
                sx={{ 
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 'bold',
                  px: 3,
                  background: `linear-gradient(135deg, ${ORTM_COLORS.primary} 0%, ${ORTM_COLORS.primaryLight} 100%)`,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${ORTM_COLORS.primaryDark} 0%, ${ORTM_COLORS.primary} 100%)`,
                  }
                }}
              >
                Modifier le Département
              </Button>
            )}
          </DialogActions>
        </Dialog>

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

        {/* ✅ SNACKBAR - STYLE IDENTIQUE */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            variant="filled"
            sx={{ 
              borderRadius: 2,
              fontWeight: 'medium',
              alignItems: 'center'
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>

        {/* ✅ LOADING OVERLAY - STYLE IDENTIQUE */}
        {(processing || deletingId) && (
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 9999
            }}
          >
            <Box
              sx={{
                background: ORTM_COLORS.surface,
                borderRadius: 3,
                p: 4,
                boxShadow: `0 8px 32px ${alpha(ORTM_COLORS.primary, 0.2)}`,
                textAlign: 'center'
              }}
            >
              <CircularProgress 
                size={60} 
                thickness={4}
                sx={{ 
                  color: ORTM_COLORS.primary,
                  mb: 2
                }} 
              />
              <Typography variant="h6" color={ORTM_COLORS.text} fontWeight="bold">
                {deletingId ? "Suppression en cours..." : "Traitement en cours..."}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Veuillez patienter...
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Departements;