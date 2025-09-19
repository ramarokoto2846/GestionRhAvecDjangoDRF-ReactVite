import React, { useState, useEffect } from "react";
import {
  Box, Typography, Fab, Grid, Card, CardContent, Paper,
  TextField, InputAdornment, IconButton, FormControl, InputLabel,
  Select, MenuItem, ToggleButtonGroup, ToggleButton, CircularProgress,
  Alert, Snackbar
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { format, parseISO, isValid, isWithinInterval, isAfter, isBefore } from "date-fns";
import { fr } from "date-fns/locale";
import Swal from "sweetalert2";

// Icônes
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import FilterListIcon from '@mui/icons-material/FilterList';
import UpcomingIcon from '@mui/icons-material/Upcoming';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import EventBusyIcon from '@mui/icons-material/EventBusy';

import { getEvenements, getCurrentUser, deleteEvenement } from "../../services/api";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar"; // Importez le Sidebar
import EvenementTable from "./EvenementTable";
import EvenementModal from "./EvenementModal";

const Evenements = () => {
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
  const [statusFilter, setStatusFilter] = useState("tous");
  const [monthFilter, setMonthFilter] = useState("tous");
  const notificationsCount = 3;

  useEffect(() => {
    const fetchUserAndData = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          setError("Vous devez être connecté pour accéder à cette page.");
          navigate("/");
          return;
        }
        setLoading(true);
        const userData = await getCurrentUser();
        setUser(userData);
        await fetchEvenements();
      } catch (error) {
        setError(error.message || "Erreur lors de l'initialisation des données.");
        navigate("/");
      }
    };
    fetchUserAndData();
  }, [navigate]);

  const fetchEvenements = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getEvenements();
      setEvenements(Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []));
    } catch (error) {
      setError("Erreur lors du chargement des événements");
      showSnackbar("Impossible de charger les événements", "error");
    } finally {
      setLoading(false);
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

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
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

  const getAvailableMonths = () => {
    const monthsSet = new Set();
    
    evenements.forEach(evenement => {
      try {
        const dateDebut = parseISO(evenement.date_debut);
        if (isValid(dateDebut)) {
          const month = dateDebut.getMonth() + 1;
          monthsSet.add(month);
        }
      } catch (error) {
        console.error("Error parsing date:", error);
      }
    });
    
    for (let month = 1; month <= 12; month++) {
      monthsSet.add(month);
    }
    
    const months = Array.from(monthsSet).sort((a, b) => a - b);
    return months;
  };

  const filteredEvenements = evenements.filter((evenement) => {
    const matchesSearch =
      (evenement.titre || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (evenement.lieu || "").toLowerCase().includes(searchQuery.toLowerCase());

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

  if (loading) return <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}><CircularProgress /></Box>;
  if (error) return <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}><Typography color="error">{error}</Typography></Box>;

  return (
    <Box sx={{ display: "flex" }}>
      <Header
        user={user}
        notificationsCount={notificationsCount}
        onMenuToggle={() => setOpen(!open)}
      />
      
      <Sidebar open={open} setOpen={setOpen} />

      <Box component="main" sx={{ flexGrow: 1, bgcolor: "#f8fafc", minHeight: "100vh", p: 3, mt: 8, ml: { md: `240px` } }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: "bold" }}>Gestion des Événements</Typography>
            <Typography variant="body1" color="text.secondary">Gérez les événements de votre entreprise</Typography>
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
          >
            <AddIcon sx={{ mr: 1 }} />
            Nouvel Événement
          </Fab>
        </Box>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography color="text.secondary">Total Événements</Typography>
                <Typography variant="h4" sx={{ fontWeight: "bold", color: "primary.main" }}>{evenements.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <UpcomingIcon color="info" sx={{ mr: 1 }} />
                  <Typography color="text.secondary">Événements à venir</Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: "bold", color: "info.main" }}>{eventCounts["a-venir"]}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <EventAvailableIcon color="success" sx={{ mr: 1 }} />
                  <Typography color="text.secondary">Événements en cours</Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: "bold", color: "success.main" }}>{eventCounts["en-cours"]}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <EventBusyIcon color="error" sx={{ mr: 1 }} />
                  <Typography color="text.secondary">Événements passés</Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: "bold", color: "error.main" }}>{eventCounts["passe"]}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
                  endAdornment: searchQuery && <InputAdornment position="end"><IconButton onClick={() => setSearchQuery("")}><CloseIcon /></IconButton></InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <ToggleButtonGroup
                value={statusFilter}
                exclusive
                onChange={handleStatusFilterChange}
                aria-label="filtre statut événement"
                fullWidth
              >
                <ToggleButton value="tous" aria-label="tous les événements">
                  <Typography variant="body2">Tous ({eventCounts.tous})</Typography>
                </ToggleButton>
                <ToggleButton value="a-venir" aria-label="événements à venir">
                  <UpcomingIcon sx={{ mr: 1 }} />
                  <Typography variant="body2">À venir ({eventCounts["a-venir"]})</Typography>
                </ToggleButton>
                <ToggleButton value="en-cours" aria-label="événements en cours">
                  <EventAvailableIcon sx={{ mr: 1 }} />
                  <Typography variant="body2">En cours ({eventCounts["en-cours"]})</Typography>
                </ToggleButton>
                <ToggleButton value="passe" aria-label="événements passés">
                  <EventBusyIcon sx={{ mr: 1 }} />
                  <Typography variant="body2">Passés ({eventCounts["passe"]})</Typography>
                </ToggleButton>
              </ToggleButtonGroup>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel id="month-filter-label">Mois</InputLabel>
                <Select
                  labelId="month-filter-label"
                  value={monthFilter}
                  label="Mois"
                  onChange={handleMonthFilterChange}
                  startAdornment={
                    <InputAdornment position="start">
                      <FilterListIcon />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="tous">Tous les mois</MenuItem>
                  {availableMonths.map(month => (
                    <MenuItem key={month} value={month.toString()}>
                      {formatMonthForDisplay(month.toString())}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        <EvenementTable
          evenements={filteredEvenements}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          onEdit={handleOpenDialog}
          onDelete={handleDelete}
          getEventStatus={getEventStatus}
        />

        <EvenementModal
          open={openDialog}
          onClose={handleCloseDialog}
          evenement={currentEvenement}
          onSave={() => {
            fetchEvenements();
            handleCloseDialog();
          }}
          showSnackbar={showSnackbar}
        />

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