import React, { useState, useEffect } from "react";
import {
  Box, Typography, Fab, Grid, Card, CardContent, Paper,
  TextField, InputAdornment, IconButton, FormControl, InputLabel,
  Select, MenuItem, CircularProgress,
  Alert, Snackbar, useTheme, Button, Stack
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { format, parseISO, isValid, isWithinInterval, isAfter, isBefore } from "date-fns";
import { fr } from "date-fns/locale";
import Swal from "sweetalert2";

// Icônes
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';
// SUPPRIMER EmailIcon

import { 
  getEvenements, 
  getCurrentUser, 
  deleteEvenement, 
  isSuperuser,
} from "../../services/api";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import EvenementTable from "./EvenementTable";
import EvenementModal from "./EvenementModal";

const Evenements = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [evenements, setEvenements] = useState([]);
  const [currentEvenement, setCurrentEvenement] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [user, setUser] = useState(null);
  const [isSuperuserState, setIsSuperuserState] = useState(false);
  const [statusFilter, setStatusFilter] = useState("tous");
  const [monthFilter, setMonthFilter] = useState("tous");
  
  // États pour les fonctionnalités
  const [generatingPDF, setGeneratingPDF] = useState(false);
  // SUPPRIMER sendingEmail et sendingSingleEmail
  
  const notificationsCount = 3;

  // Fonction showSnackbar
  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  // Effet de montage
  useEffect(() => {
    let isMounted = true;

    const fetchUserAndData = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          navigate("/");
          return;
        }
        
        setLoading(true);
        setError(null);
        
        const [userData, superuserStatus, eventsData] = await Promise.all([
          getCurrentUser(),
          isSuperuser(),
          getEvenements()
        ]);
        
        if (isMounted) {
          setUser(userData);
          setIsSuperuserState(superuserStatus);
          setEvenements(Array.isArray(eventsData) ? eventsData : (Array.isArray(eventsData?.data) ? eventsData.data : []));
        }
      } catch (error) {
        if (isMounted) {
          setError(error.message || "Erreur lors du chargement des données.");
          showSnackbar("Erreur lors du chargement des données", "error");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUserAndData();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  // Fonction pour recharger les événements
  const fetchEvenements = async () => {
    try {
      const data = await getEvenements();
      setEvenements(Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []));
    } catch (error) {
      showSnackbar("Erreur lors du rechargement des événements", "error");
    }
  };

  const handleOpenDialog = (evenement = null) => {
    setCurrentEvenement(evenement);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentEvenement(null);
  };

  const handleDelete = async (id) => {
    try {
      const result = await Swal.fire({
        title: 'Êtes-vous sûr?',
        text: "Vous ne pourrez pas annuler cette action!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Oui, supprimer!'
      });
      
      if (result.isConfirmed) {
        await deleteEvenement(id);
        showSnackbar("Événement supprimé avec succès", "success");
        fetchEvenements();
      }
    } catch (error) {
      showSnackbar("Erreur lors de la suppression", "error");
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleStatusFilterChange = (event, newFilter) => {
    if (newFilter !== null) {
      setStatusFilter(newFilter);
      setPage(0);
    }
  };

  const handleMonthFilterChange = (event) => {
    setMonthFilter(event.target.value);
    setPage(0);
  };

  // ✅ FONCTION POUR FORMATER LA DATE POUR L'AFFICHAGE
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "Date non spécifiée";
    try {
      const date = parseISO(dateString);
      return format(date, "dd MMMM yyyy 'à' HH:mm", { locale: fr });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Date invalide";
    }
  };

  const getEventStatus = (evenement) => {
    try {
      const now = new Date();
      const startDate = parseISO(evenement.date_debut);
      const endDate = parseISO(evenement.date_fin);

      if (!isValid(startDate) || !isValid(endDate)) {
        return "passe";
      }

      if (isWithinInterval(now, { start: startDate, end: endDate })) {
        return "en-cours";
      }
      else if (isAfter(now, endDate)) {
        return "passe";
      }
      else if (isBefore(now, startDate)) {
        return "a-venir";
      }

      return "passe";
    } catch (error) {
      console.error("Error determining event status:", error);
      return "passe";
    }
  };

  // Fonction pour calculer la durée en format lisible
  const getEventDuration = (evenement) => {
    try {
      const startDate = parseISO(evenement.date_debut);
      const endDate = parseISO(evenement.date_fin);

      if (!isValid(startDate) || !isValid(endDate)) {
        return "Durée inconnue";
      }

      const diffMs = endDate - startDate;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      if (diffDays > 0) {
        return `${diffDays}j ${diffHours}h`;
      } else if (diffHours > 0) {
        return `${diffHours}h ${diffMinutes}min`;
      } else {
        return `${diffMinutes}min`;
      }
    } catch (error) {
      console.error("Error calculating duration:", error);
      return "Durée inconnue";
    }
  };

  const getAvailableMonths = () => {
    const monthsSet = new Set();
    
    evenements.forEach(evenement => {
      try {
        if (evenement && evenement.date_debut) {
          const dateDebut = parseISO(evenement.date_debut);
          if (isValid(dateDebut)) {
            const month = dateDebut.getMonth() + 1;
            monthsSet.add(month);
          }
        }
      } catch (error) {
        console.error("Error parsing date:", error);
      }
    });
    
    // S'assurer qu'il y a au moins quelques mois
    if (monthsSet.size === 0) {
      return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    }
    
    const months = Array.from(monthsSet).sort((a, b) => a - b);
    return months;
  };

  const filteredEvenements = evenements.filter((evenement) => {
    const matchesSearch =
      (evenement.titre || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (evenement.lieu || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (evenement.description || "").toLowerCase().includes(searchQuery.toLowerCase());

    const eventStatus = getEventStatus(evenement);
    const matchesStatus = statusFilter === "tous" || eventStatus === statusFilter;

    let matchesMonth = true;
    if (monthFilter !== "tous") {
      try {
        const eventDate = parseISO(evenement.date_debut);
        const eventMonth = eventDate.getMonth() + 1;
        matchesMonth = eventMonth === parseInt(monthFilter);
      } catch (error) {
        console.error("Error in month filter:", error);
        matchesMonth = false;
      }
    }

    return matchesSearch && matchesStatus && matchesMonth;
  });

  const countEventsByStatus = () => {
    const counts = {
      "tous": evenements.length,
      "en-cours": 0,
      "passe": 0,
      "a-venir": 0
    };
    
    evenements.forEach(evenement => {
      const status = getEventStatus(evenement);
      if (status === "en-cours") counts["en-cours"]++;
      else if (status === "passe") counts["passe"]++;
      else if (status === "a-venir") counts["a-venir"]++;
    });
    
    return counts;
  };

  const eventCounts = countEventsByStatus();
  const availableMonths = getAvailableMonths();

  const formatMonthForDisplay = (monthValue) => {
    if (monthValue === "tous") return "Tous les mois";
    const date = new Date(2023, parseInt(monthValue) - 1, 1);
    return format(date, "MMMM", { locale: fr });
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex" }}>
      <Header
        user={user}
        notificationsCount={notificationsCount}
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

        {/* Titre + boutons - STYLE SIMILAIRE À EMPLOYÉS */}
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
              Gestion des Événements
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Gérez les événements de votre entreprise
            </Typography>
          </Box>
          
          {/* ✅ STACK AVEC BOUTONS PDF ET NOUVEL ÉVÉNEMENT SEULEMENT */}
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
                fontSize: '1rem'
              }}
            >
              <AddIcon sx={{ mr: 1 }} />
              Nouvel Événement
            </Fab>
          </Stack>
        </Box>

        {/* ✅ CARTES DE STATISTIQUES - STYLE SIMILAIRE À EMPLOYÉS */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography color="text.secondary">Total Événements</Typography>
                <Typography variant="h4" sx={{ fontWeight: "bold", color: "primary.main" }}>
                  {eventCounts.tous}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography color="text.secondary">À Venir</Typography>
                <Typography variant="h4" sx={{ fontWeight: "bold", color: "info.main" }}>
                  {eventCounts["a-venir"]}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography color="text.secondary">En Cours</Typography>
                <Typography variant="h4" sx={{ fontWeight: "bold", color: "success.main" }}>
                  {eventCounts["en-cours"]}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography color="text.secondary">Terminés</Typography>
                <Typography variant="h4" sx={{ fontWeight: "bold", color: "grey.600" }}>
                  {eventCounts["passe"]}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* ✅ BARRE DE FILTRES - STYLE SIMILAIRE À EMPLOYÉS */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Rechercher un événement..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton 
                        onClick={() => setSearchQuery("")} 
                        size="small"
                      >
                        <CloseIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel id="status-filter-label">Statut</InputLabel>
                <Select
                  labelId="status-filter-label"
                  value={statusFilter}
                  label="Statut"
                  onChange={(e) => handleStatusFilterChange(null, e.target.value)}
                >
                  <MenuItem value="tous">Tous les statuts</MenuItem>
                  <MenuItem value="a-venir">À venir</MenuItem>
                  <MenuItem value="en-cours">En cours</MenuItem>
                  <MenuItem value="passe">Terminés</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel id="month-filter-label">Mois</InputLabel>
                <Select
                  labelId="month-filter-label"
                  value={monthFilter}
                  label="Mois"
                  onChange={handleMonthFilterChange}
                >
                  <MenuItem value="tous">Tous les mois</MenuItem>
                  {availableMonths.map((month) => (
                    <MenuItem key={month} value={month.toString()}>
                      {formatMonthForDisplay(month.toString())}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* Tableau des événements */}
        <EvenementTable
          evenements={filteredEvenements}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          onEdit={handleOpenDialog}
          onDelete={handleDelete}
          // SUPPRIMER onSendEmail
          getEventStatus={getEventStatus}
          getEventDuration={getEventDuration}
          user={user}
          isSuperuser={isSuperuserState}
        />

        {/* Modal d'édition/création */}
        <EvenementModal
          open={openDialog}
          onClose={handleCloseDialog}
          evenement={currentEvenement}
          onSave={fetchEvenements}
          showSnackbar={showSnackbar}
        />

        {/* Snackbar pour les notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default Evenements;