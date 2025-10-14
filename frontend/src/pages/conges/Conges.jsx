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
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { toast } from 'react-toastify';
import Swal from "sweetalert2";

import {
  Add as AddIcon,
  Search as SearchIcon,
  Close as CloseIcon
} from "@mui/icons-material";

import { getConges, getEmployes, createConge, updateConge, deleteConge, validerConge, refuserConge, getCurrentUser } from "../../services/api";
import Header, { triggerNotificationsRefresh } from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import CongeTable from "./CongeTable";
import CongeModal from "./CongeModal";

const Conges = () => {
  const theme = useTheme();
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
    motif_refus: ""
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
        date_debut: conge.date_debut || "",
        date_fin: conge.date_fin || "",
        motif: conge.motif || "",
        motif_refus: conge.motif_refus || ""
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
        motif_refus: formData.motif_refus || null
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
        setDeletingId(null);
      } finally {
        setActionLoading(false);
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
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
        user={user}
        onMenuToggle={() => setOpen(!open)}
      />
      
      {/* Sidebar */}
      <Sidebar open={open} setOpen={setOpen} />

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, bgcolor: "#f8fafc", minHeight: "100vh", p: 3, mt: 8, ml: { md: `240px` } }}>
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
          <CongeTable
            conges={filteredData}
            loading={loading}
            actionLoading={actionLoading}
            deletingId={deletingId}
            onEdit={handleOpenDialog}
            onDelete={handleDelete}
            onValider={handleValider}
            onRefuser={handleRefuser}
            theme={theme}
            user={user} // Pass user to CongeTable
          />
        </Paper>

        {/* Dialog for Add/Edit Conge */}
        <CongeModal
          open={openDialog}
          onClose={handleCloseDialog}
          editingConge={editingConge}
          formData={formData}
          employes={employes}
          actionLoading={actionLoading}
          onSubmit={handleSubmit}
          onInputChange={handleInputChange}
        />

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