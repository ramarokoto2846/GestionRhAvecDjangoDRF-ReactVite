import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  useTheme
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Download as DownloadIcon,
  Search as SearchIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { getDepartmentStatistics, getDepartements, exportStatisticsPDF, StatisticsUtils, getCurrentUser, isSuperuser } from '../../services/api';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';

const DepartmentStatistics = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [isSuperuserState, setIsSuperuserState] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingPDF, setLoadingPDF] = useState(false);

  // Générer la liste des mois
  const months = [
    { value: 1, label: 'Janvier' },
    { value: 2, label: 'Février' },
    { value: 3, label: 'Mars' },
    { value: 4, label: 'Avril' },
    { value: 5, label: 'Mai' },
    { value: 6, label: 'Juin' },
    { value: 7, label: 'Juillet' },
    { value: 8, label: 'Août' },
    { value: 9, label: 'Septembre' },
    { value: 10, label: 'Octobre' },
    { value: 11, label: 'Novembre' },
    { value: 12, label: 'Décembre' }
  ];

  // Générer la liste des années (5 dernières années + année courante)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

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

        // Vérifier le statut de superutilisateur
        const superuser = await isSuperuser();
        setIsSuperuserState(superuser);

        // Charger les départements
        await loadDepartments();
      } catch (err) {
        console.error("Erreur lors de la récupération de l'utilisateur:", err);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        setCurrentUser(null);
        navigate("/");
      }
    };

    fetchUserAndData();
  }, [navigate]);

  // 🔥 CORRECTION : S'assurer que useEffect dépend de tous les filtres
  useEffect(() => {
    console.log('🔄 Déclenchement loadStats - Filtres:', {
      selectedDepartment,
      selectedMonth,
      selectedYear
    });
    
    if (selectedDepartment) {
      loadStats();
    } else {
      // Réinitialiser les stats si aucun département sélectionné
      setStats(null);
    }
  }, [selectedDepartment, selectedMonth, selectedYear]);

  const loadDepartments = async () => {
    try {
      console.log('📥 Chargement des départements...');
      const data = await getDepartements();
      setDepartments(data);
      console.log(`✅ ${data.length} départements chargés`);
    } catch (err) {
      console.error('❌ Erreur chargement départements:', err);
      setError(err.message);
    }
  };

  const loadStats = async () => {
    if (!selectedDepartment) {
      setStats(null);
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setStats(null); // Réinitialiser avant nouveau chargement
      
      // Formater la date au format YYYY-MM (ex: "2025-10")
      const formattedDate = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
      
      console.log('🔍 Chargement stats département:', {
        departement: selectedDepartment,
        mois: formattedDate
      });
      
      // 🔥 CORRECTION : Utiliser le bon format de paramètres
      const data = await getDepartmentStatistics(selectedDepartment, { 
        mois: formattedDate 
      });
      
      console.log('✅ Stats département reçues:', data);
      setStats(data);
      
    } catch (err) {
      console.error('❌ Erreur chargement stats département:', {
        message: err.message,
        department: selectedDepartment,
        month: selectedMonth,
        year: selectedYear
      });
      setError(err.message || 'Erreur lors du chargement des statistiques');
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!selectedDepartment) {
      setError('Veuillez sélectionner un département');
      return;
    }
    
    try {
      setLoadingPDF(true);
      const formattedDate = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
      
      console.log('📄 Export PDF département avec params:', {
        departement: selectedDepartment,
        mois: formattedDate
      });
      
      await exportStatisticsPDF('departement', {
        departement: selectedDepartment,
        mois: formattedDate
      });
    } catch (err) {
      console.error('❌ Erreur export PDF:', err);
      setError(`Erreur lors de l'export PDF: ${err.message}`);
    } finally {
      setLoadingPDF(false);
    }
  };

  const handleRefresh = () => {
    if (selectedDepartment) {
      console.log('🔄 Rafraîchissement manuel des statistiques');
      loadStats();
    }
  };

  // Filtrer les départements basé sur la recherche
  const filteredDepartments = departments.filter((dept) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (dept.nom || "").toLowerCase().includes(searchLower) ||
      (dept.responsable || "").toLowerCase().includes(searchLower) ||
      (dept.localisation || "").toLowerCase().includes(searchLower)
    );
  });

  const selectedDepartmentData = departments.find(dept => dept.id_departement === selectedDepartment);

  return (
    <Box sx={{ display: "flex" }}>
      <Header
        user={currentUser}
        onMenuToggle={() => setOpen(!open)}
      />
      <Sidebar open={open} setOpen={setOpen} />
      
      <Box component="main" sx={{ 
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
      }}>
        {/* En-tête de la page */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: "bold" }}>
              Statistiques par Département
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Consultez les statistiques détaillées des départements par mois
            </Typography>
          </Box>
        </Box>

        {/* Cartes de statistiques globales */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography color="text.secondary">Total Départements</Typography>
                <Typography variant="h4" sx={{ fontWeight: "bold", color: "primary.main" }}>
                  {departments.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography color="text.secondary">Total Employés</Typography>
                <Typography variant="h4" sx={{ fontWeight: "bold", color: "secondary.main" }}>
                  {departments.reduce((total, dept) => total + (dept.nbr_employe || 0), 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filtres et contrôles */}
        <Card sx={{ mb: 3, borderRadius: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              {/* Recherche de département */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="Rechercher un département..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
                    endAdornment: searchTerm && (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setSearchTerm("")} size="small">
                          <CloseIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              {/* Sélection de département */}
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Département</InputLabel>
                  <Select
                    value={selectedDepartment}
                    label="Département"
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                  >
                    {filteredDepartments.map((dept) => (
                      <MenuItem key={dept.id_departement} value={dept.id_departement}>
                        {dept.nom} - {dept.responsable}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Sélection du mois */}
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Mois</InputLabel>
                  <Select
                    value={selectedMonth}
                    label="Mois"
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  >
                    {months.map((month) => (
                      <MenuItem key={month.value} value={month.value}>
                        {month.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Sélection de l'année */}
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Année</InputLabel>
                  <Select
                    value={selectedYear}
                    label="Année"
                    onChange={(e) => setSelectedYear(e.target.value)}
                  >
                    {years.map((year) => (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Boutons d'action */}
              <Grid item xs={12} md={1}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={loadingPDF ? <CircularProgress size={20} /> : <DownloadIcon />}
                  onClick={handleExportPDF}
                  disabled={!selectedDepartment || !stats || loadingPDF}
                  sx={{ height: '56px' }}
                >
                  {loadingPDF ? '' : 'PDF'}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Indicateur de période */}
        {selectedDepartment && stats && (
          <Alert severity="info" sx={{ mb: 2 }}>
            📅 Période affichée : <strong>{months.find(m => m.value === selectedMonth)?.label} {selectedYear}</strong>
            {selectedDepartmentData && (
              <> - Département : <strong>{selectedDepartmentData.nom}</strong></>
            )}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Chargement des statistiques département...</Typography>
          </Box>
        )}

        {stats && selectedDepartmentData && (
          <Grid container spacing={3}>
            {/* Informations département */}
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    Informations du Département
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" color="textSecondary">
                        Nom du département
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                        {selectedDepartmentData.nom}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" color="textSecondary">
                        Responsable
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                        {selectedDepartmentData.responsable}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" color="textSecondary">
                        Localisation
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                        {selectedDepartmentData.localisation}
                      </Typography>
                    </Grid>
                  </Grid>
                  <Box mt={2}>
                    <Typography variant="body2" color="textSecondary">
                      Période analysée: {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Métriques principales */}
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    📊 Effectif et Performance
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell>Total employés</TableCell>
                          <TableCell>
                            <Chip label={stats.total_employes} color="primary" />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Employés actifs</TableCell>
                          <TableCell>
                            <Chip label={stats.employes_actifs} color="success" />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Taux d'absence moyen</TableCell>
                          <TableCell>
                            <Chip 
                              label={StatisticsUtils.formatPercentage(stats.taux_absence_moyen)} 
                              color="warning" 
                            />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Heures moyennes travaillées</TableCell>
                          <TableCell>
                            <Chip 
                              label={StatisticsUtils.formatDuration(stats.heures_travail_moyennes)} 
                              color="info" 
                            />
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    📈 Activités du Mois
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell>Total pointages</TableCell>
                          <TableCell>
                            <Chip label={stats.pointages_total} color="info" variant="outlined" />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Heures totales travaillées</TableCell>
                          <TableCell>
                            <Chip 
                              label={StatisticsUtils.formatDuration(stats.total_heures_travail)} 
                              color="primary" 
                              variant="outlined"
                            />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Événements</TableCell>
                          <TableCell>
                            <Chip label={stats.evenements_count} color="secondary" variant="outlined" />
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Congés et Absences */}
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="warning">
                    🏖️ Gestion des Congés
                  </Typography>
                  <Grid container spacing={2} textAlign="center">
                    <Grid item xs={4}>
                      <Box>
                        <Typography variant="h5" color="success.main">
                          {stats.total_conges_valides}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Validés
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box>
                        <Typography variant="h5" color="error.main">
                          {stats.total_conges_refuses}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Refusés
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box>
                        <Typography variant="h5" color="info.main">
                          {stats.total_conges_en_attente}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          En attente
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Box mt={2}>
                        <Typography variant="body1" fontWeight="bold">
                          Taux d'approbation: {StatisticsUtils.formatPercentage(stats.taux_approbation_conges)}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="error">
                    ⚠️ Suivi des Absences
                  </Typography>
                  <Grid container spacing={2} textAlign="center">
                    <Grid item xs={6}>
                      <Box>
                        <Typography variant="h5">
                          {stats.total_absences}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Total
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box>
                        <Typography variant="h5" color="info.main">
                          {stats.absences_justifiees}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Justifiées
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box>
                        <Typography variant="h5" color="warning.main">
                          {stats.absences_non_justifiees}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Non justifiées
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box>
                        <Typography variant="h5" color="success.main">
                          {StatisticsUtils.calculateRegularityRate(
                            stats.total_employes - stats.total_absences,
                            stats.total_employes
                          ).toFixed(1)}%
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Taux régularité
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {!selectedDepartment && !loading && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Veuillez sélectionner un département pour afficher les statistiques.
          </Alert>
        )}

        {selectedDepartment && !stats && !loading && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Aucune statistique disponible pour ce département sur la période sélectionnée.
          </Alert>
        )}
      </Box>
    </Box>
  );
};

export default DepartmentStatistics;