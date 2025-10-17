import React, { useState, useEffect } from "react";
import {
  Box, Typography, Fab, Grid, Card, CardContent,
  Paper, CircularProgress, Alert, Snackbar, FormControl,
  InputLabel, Select, MenuItem, TextField, IconButton,
  InputAdornment, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, Divider, Chip, Avatar,
  useTheme
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

import { getPointages, createPointage, updatePointage, deletePointage, getEmployes, getCurrentUser } from "../../services/api";
import Header, { triggerNotificationsRefresh } from "../../components/Header";
import PointageTable from "./PointageTable";
import PointageModal from "./PointageModal";
import Sidebar from "../../components/Sidebar";

// Composant pour afficher les éléments de détail
const DetailItem = ({ icon, label, value, color = "text.primary" }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
    <Box sx={{ color: 'primary.main', minWidth: 24 }}>
      {icon}
    </Box>
    <Box sx={{ flex: 1 }}>
      <Typography variant="subtitle2" color="text.secondary" fontSize="0.8rem">
        {label}
      </Typography>
      <Typography variant="body1" color={color} fontWeight="500">
        {value}
      </Typography>
    </Box>
  </Box>
);

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
          const employe = employesData.find(emp => emp.matricule === pointage.employe) || {};
          const employeNom = pointage.employe_nom ||
            employe.nom_complet ||
            `${employe.prenom || ''} ${employe.nom || ''}`.trim() ||
            pointage.employe ||
            'Inconnu';
          
          return {
            ...pointage,
            employe_nom: String(employeNom),
            employe_matricule: String(pointage.employe_matricule || pointage.employe || 'Inconnu'),
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

  // FONCTION AJOUTÉE POUR LA MISE À JOUR DES SORTIES
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

  const closeDetails = () => {
    setDetailView(null);
  };

  // Fonction pour calculer la durée de travail
  const calculateWorkingHours = (heureEntree, heureSortie) => {
    if (!heureEntree || !heureSortie) return "-";
    
    const [entreeHours, entreeMinutes] = heureEntree.split(':').map(Number);
    const [sortieHours, sortieMinutes] = heureSortie.split(':').map(Number);
    
    const entreeTotalMinutes = entreeHours * 60 + entreeMinutes;
    const sortieTotalMinutes = sortieHours * 60 + sortieMinutes;
    
    const diffMinutes = sortieTotalMinutes - entreeTotalMinutes;
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    
    return `${hours}h ${minutes}min`;
  };

  // Fonction pour obtenir la couleur du statut
  const getStatusColor = (heureSortie) => {
    return heureSortie ? "success" : "warning";
  };

  // Fonction pour obtenir le texte du statut
  const getStatusText = (heureSortie) => {
    return heureSortie ? "Terminé" : "En cours";
  };

  const filteredPointages = pointages.filter(pointage => {
    if (!pointage || !pointage.id_pointage || !pointage.employe) {
      console.warn("Pointage invalide dans filteredPointages:", pointage);
      return false;
    }
    const employeNom = String(pointage.employe_nom || "");
    const idPointage = String(pointage.id_pointage || "");
    return (
      (
        employeNom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        idPointage.includes(searchTerm)
      ) &&
      (exitFilter === "all" ||
       (exitFilter === "working" && !pointage.heure_sortie) ||
       (exitFilter === "exited" && pointage.heure_sortie))
    );
  });

  return (
    <Box sx={{ display: "flex" }}>
      <Header
        user={user}
        onMenuToggle={() => setOpen(!open)}
      />
      <Sidebar open={open} setOpen={setOpen} />
      
      {/* CONTENU PRINCIPAL AVEC BON STYLE */}
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
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Titre + bouton */}
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
            <Typography variant="h4" sx={{ fontWeight: "bold", mb: 1 }}>
              Gestion des Pointages
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Gérez les pointages de vos employés
            </Typography>
          </Box>
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
              fontSize: '1rem'
            }}
            disabled={actionLoading}
          >
            <AddIcon sx={{ mr: 1 }} />
            Nouveau Pointage
          </Fab>
        </Box>

        {/* Cartes de statistiques */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography color="text.secondary">Total Pointages</Typography>
                <Typography variant="h4" sx={{ fontWeight: "bold", color: "primary.main" }}>
                  {stats.total}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography color="text.secondary">Avec Heure de Sortie</Typography>
                <Typography variant="h4" sx={{ fontWeight: "bold", color: "success.main" }}>
                  {stats.withExit}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography color="text.secondary">Sans Heure de Sortie</Typography>
                <Typography variant="h4" sx={{ fontWeight: "bold", color: "warning.main" }}>
                  {stats.withoutExit}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Barre de recherche et filtres */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                placeholder="Rechercher un pointage..."
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
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="exit-filter-label">
                  Filtrer par statut
                </InputLabel>
                <Select
                  labelId="exit-filter-label"
                  value={exitFilter}
                  label="Filtrer par statut"
                  onChange={handleExitFilterChange}
                >
                  <MenuItem value="all">Tous les statuts</MenuItem>
                  <MenuItem value="working">En cours de travail</MenuItem>
                  <MenuItem value="exited">Déjà sortis</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* Tableau des pointages */}
        <Paper sx={{ width: "100%", overflow: "hidden", borderRadius: 3 }}>
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
        
        {/* Dialog des détails stylisé */}
        <Dialog
          open={!!detailView}
          onClose={closeDetails}
          maxWidth="md"
          fullWidth
          PaperProps={{ 
            sx: { 
              borderRadius: 3,
              background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
            }
          }}
        >
          <DialogTitle sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            py: 3
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                <AccessTimeIcon />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  Détails du Pointage
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  #{detailView?.id_pointage || "Inconnu"}
                </Typography>
              </Box>
            </Box>
          </DialogTitle>
          
          <DialogContent sx={{ pt: 4, pb: 2 }}>
            {detailView && (
              <Grid container spacing={3}>
                {/* En-tête avec statut */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Chip
                      icon={<AccessTimeIcon />}
                      label={getStatusText(detailView.heure_sortie)}
                      color={getStatusColor(detailView.heure_sortie)}
                      variant="filled"
                      sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}
                    />
                    {detailView.heure_sortie && (
                      <Typography variant="h6" color="primary" fontWeight="bold">
                        Durée: {calculateWorkingHours(detailView.heure_entree, detailView.heure_sortie)}
                      </Typography>
                    )}
                  </Box>
                </Grid>

                {/* Informations principales */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ borderRadius: 2, boxShadow: 2, height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarTodayIcon color="primary" />
                        Informations du Pointage
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <DetailItem 
                          icon={<AccessTimeIcon />}
                          label="Heure d'Entrée"
                          value={detailView.heure_entree || "-"}
                          color="success"
                        />
                        <DetailItem 
                          icon={<ExitToAppIcon />}
                          label="Heure de Sortie"
                          value={detailView.heure_sortie || "-"}
                          color="info"
                        />
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
                <Grid item xs={12} md={6}>
                  <Card sx={{ borderRadius: 2, boxShadow: 2, height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon color="primary" />
                        Informations de l'Employé
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <DetailItem 
                          icon={<PersonIcon />}
                          label="Nom Complet"
                          value={detailView.employe_nom || "Inconnu"}
                        />
                        <DetailItem 
                          icon={<BusinessIcon />}
                          label="Matricule"
                          value={detailView.employe_matricule || detailView.employe || "Inconnu"}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Remarques */}
                {detailView.remarque && (
                  <Grid item xs={12}>
                    <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <NotesIcon color="primary" />
                          Remarques
                        </Typography>
                        <Paper 
                          variant="outlined" 
                          sx={{ 
                            p: 2, 
                            mt: 1, 
                            bgcolor: 'grey.50',
                            borderColor: 'grey.300',
                            borderRadius: 2
                          }}
                        >
                          <Typography variant="body1" fontStyle="italic">
                            "{detailView.remarque}"
                          </Typography>
                        </Paper>
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                {/* Informations détaillées de l'employé */}
                {detailView.employe_details && Object.keys(detailView.employe_details).length > 0 && (
                  <Grid item xs={12}>
                    <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <WorkIcon color="primary" />
                          Détails de l'Employé
                        </Typography>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                          <Grid item xs={12} md={6}>
                            <DetailItem 
                              icon={<BusinessIcon />}
                              label="Département"
                              value={detailView.employe_details.departement?.nom || "Non spécifié"}
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <DetailItem 
                              icon={<WorkIcon />}
                              label="Poste"
                              value={detailView.employe_details.poste || "Non spécifié"}
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <DetailItem 
                              icon={<EmailIcon />}
                              label="Email"
                              value={detailView.employe_details.email || "Non spécifié"}
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <DetailItem 
                              icon={<PhoneIcon />}
                              label="Téléphone"
                              value={detailView.employe_details.telephone || "Non spécifié"}
                            />
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            )}
          </DialogContent>
          
          <DialogActions sx={{ p: 3, gap: 1 }}>
            <Button 
              onClick={closeDetails} 
              variant="outlined"
              sx={{ borderRadius: 2, px: 3 }}
            >
              Fermer
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar pour les notifications */}
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