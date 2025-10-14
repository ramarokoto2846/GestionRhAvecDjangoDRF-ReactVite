import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  IconButton,
  Paper,
  TextField,
  Grid,
  InputAdornment,
  Snackbar,
  Alert,
  Fab,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  Add as AddIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  FilterList as FilterIcon,
} from "@mui/icons-material";
import { getEmployes, createEmploye, updateEmploye, deleteEmploye, getDepartements, getCurrentUser, isSuperuser } from "../../services/api";
import Header, { triggerNotificationsRefresh } from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import Swal from "sweetalert2";
import EmployeTableau from "./EmployeTableau";
import EmployModal from "./EmployModal";

const Employes = ({ isSuperuser: isSuperuserProp }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingEmploye, setEditingEmploye] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [departementFilter, setDepartementFilter] = useState("");
  const [formData, setFormData] = useState({
    matricule: "",
    titre: "stagiaire",
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    poste: "",
    departement_pk: "",
    statut: "actif",
  });
  const [employes, setEmployes] = useState([]);
  const [departements, setDepartements] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isSuperuserState, setIsSuperuserState] = useState(isSuperuserProp);
  const [errors, setErrors] = useState({});

  // --- Récupération utilisateur et données ---
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
        console.log("Utilisateur connecté:", user); // Débogage

        // Vérifier le statut de superutilisateur si non passé en prop
        if (!isSuperuserProp) {
          const superuser = await isSuperuser();
          setIsSuperuserState(superuser);
          console.log("Statut superutilisateur:", superuser); // Débogage
        }

        // Récupérer les données
        await fetchData();
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

  // --- CRUD Employés ---
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [employesData, departementsData] = await Promise.all([
        getEmployes(),
        getDepartements(),
      ]);
      setEmployes(Array.isArray(employesData) ? employesData : []);
      setDepartements(Array.isArray(departementsData) ? departementsData : []);
      console.log("Employés mis à jour:", employesData); // Débogage
      setLoading(false);
    } catch (err) {
      console.error("Erreur lors du chargement des données:", err);
      setError("Erreur lors du chargement des données");
      showSnackbar("Impossible de charger les données", "error");
      setLoading(false);
    }
  };

  const handleOpenDialog = (employe = null) => {
    if (employe) {
      setEditingEmploye(employe);
      setFormData({
        matricule: employe.matricule,
        titre: employe.titre,
        nom: employe.nom,
        prenom: employe.prenom,
        email: employe.email,
        telephone: employe.telephone || "",
        poste: employe.poste,
        departement_pk: employe.departement?.id_departement || "",
        statut: employe.statut,
      });
    } else {
      setEditingEmploye(null);
      setFormData({
        matricule: "",
        titre: "stagiaire",
        nom: "",
        prenom: "",
        email: "",
        telephone: "",
        poste: "",
        departement_pk: "",
        statut: "actif",
      });
    }
    setErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingEmploye(null);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingEmploye) {
        await updateEmploye(editingEmploye.matricule, formData);
        showSnackbar("Employé modifié avec succès");
      } else {
        await createEmploye(formData);
        showSnackbar("Employé créé avec succès");
      }
      handleCloseDialog();
      await fetchData();
      triggerNotificationsRefresh();
    } catch (err) {
      console.error("Erreur lors de l'opération:", err);
      const errorMessage =
        err.message === "Vous n'êtes pas autorisé à effectuer cette action."
          ? "Vous n'êtes pas autorisé à modifier cet employé."
          : err.message || "Erreur lors de l'opération";
      if (err.response?.data) {
        setErrors(err.response.data);
      } else {
        showSnackbar(errorMessage, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (matricule) => {
    const result = await Swal.fire({
      title: 'Êtes-vous sûr ?',
      text: "Vous ne pourrez pas annuler cette action !",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, supprimer !',
      cancelButtonText: 'Annuler',
      background: theme.palette.background.paper,
      color: theme.palette.text.primary,
    });

    if (result.isConfirmed) {
      try {
        await deleteEmploye(matricule);
        showSnackbar("Employé supprimé avec succès");
        await fetchData();
        triggerNotificationsRefresh();
      } catch (err) {
        console.error("Erreur lors de la suppression:", err);
        const errorMessage =
          err.message === "Vous n'êtes pas autorisé à effectuer cette action."
            ? "Vous n'êtes pas autorisé à supprimer cet employé."
            : err.message || "Erreur lors de la suppression";
        showSnackbar(errorMessage, "error");
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleDepartementFilterChange = (event) => {
    setDepartementFilter(event.target.value);
    setPage(0);
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  const handleChangePage = (event, newPage) => setPage(newPage);

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredData = employes.filter((employe) => {
    const matchesSearch =
      (employe.nom || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (employe.prenom || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (employe.matricule || "").includes(searchTerm) ||
      (employe.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (employe.poste || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartement =
      !departementFilter ||
      (employe.departement && String(employe.departement.id_departement) === departementFilter);

    return matchesSearch && matchesDepartement;
  });

  const paginatedData = filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const getStatusColor = (statut) => {
    return statut === 'actif' ? 'success' : 'error';
  };

  const getTitreColor = (titre) => {
    return titre === 'employe' ? 'primary' : 'secondary';
  };

  if (loading && employes.length === 0) {
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
      <Header
        user={currentUser}
        onMenuToggle={() => setOpen(!open)}
      />
      <Sidebar open={open} setOpen={setOpen} />
      <Box component="main" sx={{ flexGrow: 1, bgcolor: "#f8fafc", minHeight: "100vh", p: 3, mt: 8, ml: { md: `240px` } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: "bold" }}>Gestion des Employés</Typography>
            <Typography variant="body1" color="text.secondary">Gérez les employés de votre entreprise</Typography>
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
              fontSize: '1rem',
            }}
          >
            <AddIcon sx={{ mr: 1 }} />
            Nouvel Employé
          </Fab>
        </Box>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography color="text.secondary">Total Employés</Typography>
                <Typography variant="h4" sx={{ fontWeight: "bold", color: "primary.main" }}>{employes.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography color="text.secondary">Employés Actifs</Typography>
                <Typography variant="h4" sx={{ fontWeight: "bold", color: "secondary.main" }}>{employes.filter(e => e.statut === 'actif').length}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography color="text.secondary">Départements</Typography>
                <Typography variant="h4" sx={{ fontWeight: "bold", color: "info.main" }}>{departements.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
                  endAdornment: searchTerm && <InputAdornment position="end"><IconButton onClick={() => setSearchTerm("")}><CloseIcon /></IconButton></InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="departement-filter-label">Filtrer par département</InputLabel>
                <Select
                  labelId="departement-filter-label"
                  value={departementFilter}
                  label="Filtrer par département"
                  onChange={handleDepartementFilterChange}
                  startAdornment={
                    <InputAdornment position="start">
                      <FilterIcon color="action" />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="">
                    <em>Tous les départements</em>
                  </MenuItem>
                  {departements.map((departement) => (
                    <MenuItem key={departement.id_departement} value={String(departement.id_departement)}>
                      {departement.nom}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>
        <EmployeTableau
          employes={employes}
          filteredData={filteredData}
          paginatedData={paginatedData}
          page={page}
          rowsPerPage={rowsPerPage}
          handleChangePage={handleChangePage}
          handleChangeRowsPerPage={handleChangeRowsPerPage}
          handleOpenDialog={handleOpenDialog}
          handleDelete={handleDelete}
          getStatusColor={getStatusColor}
          getTitreColor={getTitreColor}
          theme={theme}
          currentUser={currentUser}
          isSuperuser={isSuperuserState}
        />
        <EmployModal
          openDialog={openDialog}
          handleCloseDialog={handleCloseDialog}
          editingEmploye={editingEmploye}
          formData={formData}
          errors={errors}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
          loading={loading}
          departements={departements}
          theme={theme}
        />
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

export default Employes;