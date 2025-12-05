import React, { useState, useEffect } from "react";
import {
  Box, Typography, Fab, Grid, Card, CardContent,
  Paper, CircularProgress, Alert, Snackbar, FormControl,
  InputLabel, Select, MenuItem, TextField, IconButton,
  InputAdornment, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, Divider, Chip, Avatar,
  useTheme, Stack, alpha
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { format, parseISO, isValid } from "date-fns";
import { fr } from "date-fns/locale";
import Swal from "sweetalert2";

import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import NotesIcon from '@mui/icons-material/Notes';
import WorkIcon from '@mui/icons-material/Work';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import BusinessIcon from '@mui/icons-material/Business';
import FilterListIcon from '@mui/icons-material/FilterList';
import QrCodeIcon from '@mui/icons-material/QrCode';

import { 
  getPointages, 
  createPointage, 
  updatePointage, 
  deletePointage, 
  getEmployes, 
  getCurrentUser,
} from "../../services/api";
import Header, { triggerNotificationsRefresh } from "../../components/Header";
import PointageTable from "./PointageTable";
import PointageModal from "./PointageModal";

// Palette de couleurs ORTM
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

// Composant pour afficher les éléments de détail
const DetailItem = ({ icon, label, value, color = "text.primary", size = "medium" }) => {
  // Fonction pour formater la valeur
  const formatValue = (val) => {
    if (val === null || val === undefined || val === "") {
      return "Non spécifié";
    }
    
    // Si c'est un objet, essayez de l'afficher proprement
    if (typeof val === 'object') {
      // Si c'est un objet département avec des propriétés spécifiques
      if (val.nom) {
        return val.nom;
      }
      if (val.id_departement) {
        return val.nom || `Département ${val.id_departement}`;
      }
      // Pour d'autres objets, retourne un message d'erreur
      return "Donnée non disponible";
    }
    
    return String(val);
  };

  return (
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
          {formatValue(value)}
        </Typography>
      </Box>
    </Box>
  );
};

const Pointages = () => {
  const theme = useTheme();
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
  const [exitFilter, setExitFilter] = useState("all");
  const [searchType, setSearchType] = useState("all");
  const [generatingPDF, setGeneratingPDF] = useState(false);

  // ✅ FONCTION POUR GÉNÉRER L'ID AUTOMATIQUE AU FORMAT PTG0025
  const generatePointageId = () => {
    const randomNum = Math.floor(Math.random() * 9999) + 1;
    const formattedNum = randomNum.toString().padStart(4, '0');
    return `PTG${formattedNum}`;
  };

  // ✅ CORRIGÉ : id_pointage vide par défaut, sera généré automatiquement
  const initialFormData = {
    id_pointage: "",
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
        console.log("Données de l'utilisateur actuel:", userData);
        setUser(userData);
        await fetchData();
      } catch (error) {
        console.error("Erreur lors de l'initialisation:", error);
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

      console.log("Données des pointages brutes:", pointagesData);
      console.log("Données des employés:", employesData);

      // Valider et filtrer les pointages
      const formattedPointages = pointagesData
        .filter(pointage => {
          if (!pointage || !pointage.id_pointage || !pointage.employe) {
            console.warn("Pointage invalide filtré:", pointage);
            return false;
          }
          return true;
        })
        .map(pointage => {
          const employe = employesData.find(emp => emp.cin === pointage.employe) || {};
          const employeNom = pointage.employe_nom ||
            `${employe.prenom || ''} ${employe.nom || ''}`.trim() ||
            pointage.employe ||
            'Inconnu';
          
          return {
            ...pointage,
            employe_nom: String(employeNom),
            employe_matricule: String(employe.matricule || employe.cin || 'Inconnu'),
            employe_details: employe
          };
        });

      console.log("Pointages formatés:", formattedPointages);
      setPointages(formattedPointages);
      setEmployes(employesData);

      setStats({
        total: formattedPointages.length,
        withExit: formattedPointages.filter(p => p.heure_sortie).length,
        withoutExit: formattedPointages.filter(p => !p.heure_sortie).length
      });
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      const errorMessage = error.message || "Erreur lors du chargement des données.";
      setError(errorMessage);
      showSnackbar(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  // ✅ FONCTIONS MANQUANTES AJOUTÉES
  const calculateWorkingHours = (heureEntree, heureSortie) => {
    if (!heureEntree || !heureSortie) return "-";
    
    const [entreeHours, entreeMinutes] = heureEntree.split(':').map(Number);
    const [sortieHours, sortieMinutes] = heureSortie.split(':').map(Number);
    
    const entreeTotalMinutes = entreeHours * 60 + entreeMinutes;
    const sortieTotalMinutes = sortieHours * 60 + sortieMinutes;
    
    const diffMinutes = sortieTotalMinutes - entreeTotalMinutes;
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    
    return `${hours}h ${minutes.toString().padStart(2, '0')}min`;
  };

  const getStatusColor = (heureSortie) => {
    return heureSortie ? "success" : "warning";
  };

  const getStatusText = (heureSortie) => {
    return heureSortie ? "Terminé" : "En cours";
  };

  const closeDetails = () => {
    setDetailView(null);
  };

  const handleUpdatePointage = async (idPointage, updateData) => {
    setActionLoading(true);
    try {
      await updatePointage(idPointage, updateData);
      showSnackbar("Sortie enregistrée avec succès !", "success");
      await fetchData();
      triggerNotificationsRefresh();
    } catch (error) {
      let errorMessage = error.message || "Erreur lors de l'enregistrement de la sortie.";
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
      cancelButtonColor: '#d33'
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
        date_pointage: pointage.date_pointage || "",
        heure_entree: pointage.heure_entree ? pointage.heure_entree.slice(0, 5) : "",
        heure_sortie: pointage.heure_sortie ? pointage.heure_sortie.slice(0, 5) : "",
        remarque: pointage.remarque || ""
      });
    } else {
      setEditingPointage(null);
      setFormData({ 
        ...initialFormData, 
        id_pointage: generatePointageId()
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPointage(null);
    setFormData({ 
      ...initialFormData, 
      id_pointage: "" 
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleExitFilterChange = (e) => {
    setExitFilter(e.target.value);
  };

  const handleSearchTypeChange = (e) => {
    setSearchType(e.target.value);
    setSearchTerm(""); // Réinitialiser la recherche quand on change le type
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

  // ✅ RECHERCHE AVANCÉE PAR TYPE
  const filteredPointages = pointages.filter(pointage => {
    if (!pointage || !pointage.id_pointage || !pointage.employe) {
      return false;
    }

    const searchLower = searchTerm.toLowerCase();
    const employeNom = String(pointage.employe_nom || "").toLowerCase();
    const idPointage = String(pointage.id_pointage || "").toLowerCase();
    const matricule = String(pointage.employe_matricule || "").toLowerCase();
    
    // Recherche par date
    let dateMatch = false;
    if (pointage.date_pointage && isValid(parseISO(pointage.date_pointage))) {
      const formattedDate = format(parseISO(pointage.date_pointage), "dd/MM/yyyy");
      const frenchDate = format(parseISO(pointage.date_pointage), "dd MMMM yyyy", { locale: fr }).toLowerCase();
      dateMatch = formattedDate.includes(searchTerm) || frenchDate.includes(searchLower);
    }

    // Filtre par type de recherche
    let matchesSearch = false;
    switch (searchType) {
      case "matricule":
        matchesSearch = matricule.includes(searchLower);
        break;
      case "nom":
        matchesSearch = employeNom.includes(searchLower);
        break;
      case "id_pointage":
        matchesSearch = idPointage.includes(searchLower);
        break;
      case "date":
        matchesSearch = dateMatch;
        break;
      case "all":
      default:
        matchesSearch = 
          employeNom.includes(searchLower) ||
          idPointage.includes(searchLower) ||
          matricule.includes(searchLower) ||
          dateMatch;
        break;
    }

    // Filtre par statut
    const matchesStatus = 
      exitFilter === "all" ||
      (exitFilter === "working" && !pointage.heure_sortie) ||
      (exitFilter === "exited" && pointage.heure_sortie);

    return matchesSearch && matchesStatus;
  });

  return (
    <Box sx={{ display: "flex" }}>
      <Header
        user={user}
        onMenuToggle={() => setOpen(!open)}
      />
      
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
        <Box 
          sx={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 2,
            mb: 3 
          }}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: "bold", mb: 1, color: ORTM_COLORS.text }}>
              Gestion des Pointages
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Gérez les pointages de vos employés
            </Typography>
          </Box>
          
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>            
            <Fab
              color="primary"
              onClick={() => handleOpenDialog()}
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
              disabled={actionLoading}
            >
              <AddIcon sx={{ mr: 1 }} />
              Nouveau Pointage
            </Fab>
          </Stack>
        </Box>

        {/* Cartes de statistiques */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              borderRadius: 3, 
              boxShadow: `0 4px 20px ${alpha(ORTM_COLORS.primary, 0.1)}`,
              background: `linear-gradient(135deg, ${ORTM_COLORS.surface} 0%, ${alpha(ORTM_COLORS.primary, 0.05)} 100%)`
            }}>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>Total Pointages</Typography>
                <Typography variant="h4" sx={{ fontWeight: "bold", color: ORTM_COLORS.primary }}>
                  {stats.total}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              borderRadius: 3, 
              boxShadow: `0 4px 20px ${alpha(ORTM_COLORS.success, 0.1)}`,
              background: `linear-gradient(135deg, ${ORTM_COLORS.surface} 0%, ${alpha(ORTM_COLORS.success, 0.05)} 100%)`
            }}>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>Avec Heure de Sortie</Typography>
                <Typography variant="h4" sx={{ fontWeight: "bold", color: ORTM_COLORS.success }}>
                  {stats.withExit}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              borderRadius: 3, 
              boxShadow: `0 4px 20px ${alpha(ORTM_COLORS.warning, 0.1)}`,
              background: `linear-gradient(135deg, ${ORTM_COLORS.surface} 0%, ${alpha(ORTM_COLORS.warning, 0.05)} 100%)`
            }}>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>Sans Heure de Sortie</Typography>
                <Typography variant="h4" sx={{ fontWeight: "bold", color: ORTM_COLORS.warning }}>
                  {stats.withoutExit}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* ✅ BARRE DE RECHERCHE AVANCÉE */}
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
          
          <Grid container spacing={2} alignItems="center">
            {/* Type de recherche */}
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Type de recherche</InputLabel>
                <Select
                  value={searchType}
                  label="Type de recherche"
                  onChange={handleSearchTypeChange}
                >
                  <MenuItem value="all">Tous les critères</MenuItem>
                  <MenuItem value="matricule">Matricule/CIN</MenuItem>
                  <MenuItem value="nom">Nom employé</MenuItem>
                  <MenuItem value="id_pointage">ID Pointage</MenuItem>
                  <MenuItem value="date">Date (JJ/MM/AAAA)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Champ de recherche */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                placeholder={
                  searchType === "matricule" ? "Rechercher par matricule ou CIN..." :
                  searchType === "nom" ? "Rechercher par nom..." :
                  searchType === "id_pointage" ? "Rechercher par ID pointage..." :
                  searchType === "date" ? "Rechercher par date (JJ/MM/AAAA)..." :
                  "Rechercher un pointage..."
                }
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
                  )
                }}
              />
            </Grid>

            {/* Filtre par statut */}
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Statut</InputLabel>
                <Select
                  value={exitFilter}
                  label="Statut"
                  onChange={handleExitFilterChange}
                >
                  <MenuItem value="all">Tous les statuts</MenuItem>
                  <MenuItem value="working">En cours</MenuItem>
                  <MenuItem value="exited">Terminés</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* Tableau des pointages */}
        <Paper sx={{ 
          width: "100%", 
          overflow: "hidden", 
          borderRadius: 3,
          background: `linear-gradient(135deg, ${ORTM_COLORS.surface} 0%, ${alpha(ORTM_COLORS.primary, 0.02)} 100%)`,
          boxShadow: `0 4px 20px ${alpha(ORTM_COLORS.primary, 0.08)}`
        }}>
          <PointageTable
            pointages={filteredPointages}
            loading={loading}
            actionLoading={actionLoading}
            deletingId={deletingId}
            onEdit={handleOpenDialog}
            onDelete={handleDelete}
            onViewDetails={showDetails}
            onUpdatePointage={handleUpdatePointage}
            theme={theme}
            currentUser={user}
          />
        </Paper>

        {/* Modal d'ajout/modification */}
        <PointageModal
          open={openDialog}
          editingPointage={editingPointage}
          formData={formData}
          employes={employes}
          actionLoading={actionLoading}
          onClose={handleCloseDialog}
          onSubmit={handleSubmit}
          onInputChange={handleInputChange}
        />
        
        {/* ✅ DIALOG DES DÉTAILS STYLISÉ */}
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
                <QrCodeIcon fontSize="large" />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  Détails du Pointage
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  ID: {detailView?.id_pointage || "Inconnu"}
                </Typography>
              </Box>
            </Box>
          </DialogTitle>
          
          <DialogContent sx={{ pt: 4, pb: 2 }}>
            {detailView && (
              <Grid container spacing={3}>
                {/* En-tête avec statut et durée */}
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
                      icon={<AccessTimeIcon />}
                      label={getStatusText(detailView.heure_sortie)}
                      color={getStatusColor(detailView.heure_sortie)}
                      variant="filled"
                      sx={{ 
                        fontWeight: 'bold', 
                        fontSize: '0.9rem',
                        px: 2,
                        py: 1
                      }}
                    />
                    {detailView.heure_sortie && (
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Durée de travail
                        </Typography>
                        <Typography variant="h6" color={ORTM_COLORS.primary} fontWeight="bold">
                          {calculateWorkingHours(detailView.heure_entree, detailView.heure_sortie)}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Grid>

                {/* Informations détaillées de l'employé */}
                {detailView.employe_details && Object.keys(detailView.employe_details).length > 0 && (
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
                          <WorkIcon />
                          Détails de l'Employé
                        </Typography>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                          {detailView.employe_details.email && (
                            <Grid item xs={12} sm={6}>
                              <DetailItem 
                                icon={<EmailIcon />}
                                label="Email"
                                value={detailView.employe_details.email}
                                size="small"
                              />
                            </Grid>
                          )}
                          {detailView.employe_details.telephone && (
                            <Grid item xs={12} sm={6}>
                              <DetailItem 
                                icon={<PhoneIcon />}
                                label="Téléphone"
                                value={detailView.employe_details.telephone}
                                size="small"
                              />
                            </Grid>
                          )}
                          {detailView.employe_details.departement && (
                            <Grid item xs={12} sm={6}>
                              <DetailItem 
                                icon={<BusinessIcon />}
                                label="Département"
                                value={detailView.employe_details.departement.nom}
                                size="small"
                              />
                            </Grid>
                          )}
                          {detailView.employe_details.poste && (
                            <Grid item xs={12} sm={6}>
                              <DetailItem 
                                icon={<WorkIcon />}
                                label="Poste"
                                value={detailView.employe_details.poste}
                                size="small"
                              />
                            </Grid>
                          )}
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                {/* Informations du pointage */}
                <Grid item xs={12} sm={6}>
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
                        <CalendarTodayIcon />
                        Informations du Pointage
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <DetailItem 
                          icon={<AccessTimeIcon />}
                          label="Heure d'Entrée"
                          value={detailView.heure_entree || "-"}
                          color={ORTM_COLORS.success}
                        />
                        <Divider sx={{ my: 1 }} />
                        <DetailItem 
                          icon={<ExitToAppIcon />}
                          label="Heure de Sortie"
                          value={detailView.heure_sortie || "-"}
                          color={ORTM_COLORS.info}
                        />
                        <Divider sx={{ my: 1 }} />
                        <DetailItem 
                          icon={<CalendarTodayIcon />}
                          label="Date"
                          value={
                            detailView.date_pointage && isValid(parseISO(detailView.date_pointage))
                              ? format(parseISO(detailView.date_pointage), "EEEE dd MMMM yyyy", { locale: fr })
                              : "-"
                          }
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Informations de l'employé */}
                <Grid item xs={12} sm={6}>
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
                        <PersonIcon />
                        Informations de l'Employé
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <DetailItem 
                          icon={<PersonIcon />}
                          label="Nom Complet"
                          value={detailView.employe_nom || "Inconnu"}
                        />
                        <Divider sx={{ my: 1 }} />
                        <DetailItem 
                          icon={<BusinessIcon />}
                          label={detailView.employe_details?.titre === 'employe' ? "Matricule" : "CIN"}
                          value={detailView.employe_details?.titre === 'employe' 
                            ? detailView.employe_details?.matricule 
                            : detailView.employe_details?.cin || "Inconnu"}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Remarques */}
                {detailView.remarque && detailView.remarque !== "Sans remarque." && (
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
                          <NotesIcon />
                          Remarques
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
                          <Typography variant="body1" fontStyle="italic" color="text.primary">
                            "{detailView.remarque}"
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
                startIcon={<AccessTimeIcon />}
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
                Modifier le Pointage
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Snackbar pour les notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
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

        {/* Loading overlay pour les actions */}
        {actionLoading && (
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

export default Pointages;