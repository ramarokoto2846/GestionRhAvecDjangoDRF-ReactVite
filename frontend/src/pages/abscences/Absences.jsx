import React, { useState, useEffect, useRef } from "react";
import { fr } from "date-fns/locale";
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
  MenuItem,
  Button,
  Stack
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { format, parseISO, isValid, differenceInDays, getMonth } from "date-fns";
import Swal from "sweetalert2";

import {
  Add as AddIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Print as PrintIcon
} from "@mui/icons-material";

import { 
  getAbsences, 
  createAbsence, 
  updateAbsence, 
  deleteAbsence, 
  getEmployes, 
  getCurrentUser, 
  isSuperuser,
  exportAbsencesPDF
} from "../../services/api";
import Header, { triggerNotificationsRefresh } from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import AbsenceTable from "./AbsenceTable";
import AbsenceModal from "./AbsenceModal";

const Absences = () => {
  const theme = useTheme();
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
  const [isSuperuserState, setIsSuperuserState] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [justificationFilter, setJustificationFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [stats, setStats] = useState({ total: 0, justifiees: 0, nonJustifiees: 0 });
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const initialFormData = {
    id_absence: `A${Date.now()}`,
    employe: "",
    date_debut_absence: format(new Date(), "yyyy-MM-dd"),
    date_fin_absence: format(new Date(), "yyyy-MM-dd"),
    motif: "",
    justifiee: false
  };

  const [formData, setFormData] = useState(initialFormData);

  // List of months for the filter
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
        console.log("Données de l'utilisateur actuel:", userData);
        setUser(userData);
        
        // Vérifier le statut superutilisateur
        const superuserStatus = await isSuperuser();
        setIsSuperuserState(superuserStatus);
        
        await fetchData();
      } catch (error) {
        console.error("Erreur lors de l'initialisation:", error);
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
      setLoading(true);
      const [absencesData, employesData] = await Promise.all([
        getAbsences(),
        getEmployes()
      ]);

      console.log("Données des absences brutes:", absencesData);
      console.log("Données des employés:", employesData);

      const formattedAbsences = absencesData
        .filter(absence => {
          if (!absence || !absence.id_absence || !absence.employe) {
            console.warn("Absence invalide filtrée:", absence);
            return false;
          }
          return true;
        })
        .map(absence => {
          const employe = employesData.find(emp => emp.matricule === absence.employe) || {};
          const employeNom = absence.employe_nom ||
            employe.nom_complet ||
            `${employe.prenom || ''} ${employe.nom || ''}`.trim() ||
            absence.employe ||
            'Inconnu';
          const dateDebut = parseISO(absence.date_debut_absence);
          const dateFin = parseISO(absence.date_fin_absence);
          const nbrJours = isValid(dateDebut) && isValid(dateFin)
            ? Math.max(differenceInDays(dateFin, dateDebut) + 1, 1)
            : null;
          return {
            ...absence,
            employe_nom: String(employeNom),
            employe_matricule: String(absence.employe_matricule || absence.employe || 'Inconnu'),
            employe_details: employe,
            nbr_jours: nbrJours
          };
        });

      console.log("Absences formatées:", formattedAbsences);
      setAbsences(formattedAbsences);
      setEmployes(employesData);

      setStats({
        total: formattedAbsences.length,
        justifiees: formattedAbsences.filter(a => a.justifiee).length,
        nonJustifiees: formattedAbsences.filter(a => !a.justifiee).length
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

  const handleOpenDialog = (absence = null) => {
    if (absence) {
      setEditingAbsence(absence);
      setFormData({
        id_absence: absence.id_absence || "",
        employe: absence.employe || "",
        date_debut_absence: absence.date_debut_absence || "",
        date_fin_absence: absence.date_fin_absence || "",
        motif: absence.motif || "",
        justifiee: absence.justifiee || false
      });
    } else {
      setEditingAbsence(null);
      setFormData({ ...initialFormData, id_absence: `A${Date.now()}` });
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

  // Fonction pour générer le PDF
  const handleGeneratePDF = async () => {
    setGeneratingPDF(true);
    try {
      // ✅ UTILISEZ LA NOUVELLE FONCTION D'EXPORT
      const result = await exportAbsencesPDF({
        search_term: searchTerm,
        justification_filter: justificationFilter,
        month_filter: monthFilter
      });
      
      if (result && result.success) {
        showSnackbar("PDF généré avec succès !", "success");
      } else {
        showSnackbar("Erreur lors de la génération du PDF", "error");
      }
    } catch (error) {
      console.error("Erreur lors de la génération du PDF:", error);
      showSnackbar(error.message || "Erreur lors de la génération du PDF", "error");
    } finally {
      setGeneratingPDF(false);
    }
  };

  const filteredData = absences.filter(absence => {
    if (!absence || !absence.id_absence || !absence.employe) {
      console.warn("Absence invalide dans filteredData:", absence);
      return false;
    }
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

        {/* Titre + boutons */}
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
              Gestion des Absences
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Gérez les absences de vos employés
            </Typography>
          </Box>
          
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button
              variant="outlined"
              onClick={handleGeneratePDF}
              disabled={generatingPDF || filteredData.length === 0}
              startIcon={generatingPDF ? <CircularProgress size={20} /> : <PrintIcon />}
              sx={{
                borderRadius: 2,
                minWidth: 200,
                px: 3,
                textTransform: "none",
                fontWeight: "bold",
                fontSize: '1rem'
              }}
            >
              {generatingPDF ? "Génération..." : "Imprimer PDF"}
            </Button>
            
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
              Nouvelle Absence
            </Fab>
          </Stack>
        </Box>

        {/* Cartes de statistiques */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography color="text.secondary">Total Absences</Typography>
                <Typography variant="h4" sx={{ fontWeight: "bold", color: "primary.main" }}>
                  {stats.total}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography color="text.secondary">Absences Justifiées</Typography>
                <Typography variant="h4" sx={{ fontWeight: "bold", color: "success.main" }}>
                  {stats.justifiees}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography color="text.secondary">Absences Non Justifiées</Typography>
                <Typography variant="h4" sx={{ fontWeight: "bold", color: "error.main" }}>
                  {stats.nonJustifiees}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Barre de recherche et filtres */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4} width={'450px'}>
              <TextField
                fullWidth
                placeholder="Rechercher une absence..."
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
            <Grid item xs={12} sm={4} width={'450px'}>
              <TextField
                select
                fullWidth
                label="Filtrer par justification"
                value={justificationFilter}
                onChange={(e) => setJustificationFilter(e.target.value)}
              >
                <MenuItem value="all">Toutes les absences</MenuItem>
                <MenuItem value="justified">Justifiées</MenuItem>
                <MenuItem value="unjustified">Non Justifiées</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4} width={'450px'}>
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

        {/* Tableau des absences */}
        <Paper sx={{ width: "100%", overflow: "hidden", borderRadius: 3 }}>
          <AbsenceTable
            absences={filteredData}
            loading={loading}
            actionLoading={actionLoading}
            deletingId={deletingId}
            onEdit={handleOpenDialog}
            onDelete={handleDelete}
            theme={theme}
            currentUser={user}
            isSuperuser={isSuperuserState}
          />
        </Paper>

        {/* Modal d'ajout/modification */}
        <AbsenceModal
          open={openDialog}
          onClose={handleCloseDialog}
          editingAbsence={editingAbsence}
          formData={formData}
          employes={employes}
          actionLoading={actionLoading}
          onSubmit={handleSubmit}
          onInputChange={handleInputChange}
        />

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

export default Absences;