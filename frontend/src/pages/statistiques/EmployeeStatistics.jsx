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
  Button,
  CircularProgress,
  Alert,
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
  Close as CloseIcon,
} from '@mui/icons-material';
import { 
  getEmployeeStatistics, 
  getEmployes, 
  exportStatisticsPDF, 
  StatisticsUtils, 
  getCurrentUser, 
  isSuperuser 
} from '../../services/api';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';

const EmployeeStatistics = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
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

        // Charger les employés
        await loadEmployees();
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

  // 🔥 CORRECTION PRINCIPALE : Ajouter selectedMonth et selectedYear dans les dépendances
  useEffect(() => {
    console.log('🔄 Déclenchement loadStats - Filtres:', {
      selectedEmployee,
      selectedMonth,
      selectedYear
    });
    
    if (selectedEmployee) {
      loadStats();
    } else {
      // Réinitialiser les stats si aucun employé sélectionné
      setStats(null);
    }
  }, [selectedEmployee, selectedMonth, selectedYear]); // ← AJOUT CRITIQUE ICI

  const loadEmployees = async () => {
    try {
      console.log('📥 Chargement des employés...');
      const data = await getEmployes();
      setEmployees(data);
      console.log(`✅ ${data.length} employés chargés`);
    } catch (err) {
      console.error('❌ Erreur chargement employés:', err);
      setError(err.message);
    }
  };

  const loadStats = async () => {
    if (!selectedEmployee) {
      setStats(null);
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setStats(null); // Réinitialiser avant nouveau chargement
      
      // Formater la date au format YYYY-MM (ex: "2025-10")
      const formattedDate = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
      
      const params = {
        periode: 'mois',
        date: formattedDate
      };
      
      console.log('📡 Chargement des statistiques avec params:', params);
      
      const data = await getEmployeeStatistics(selectedEmployee, params);
      console.log('✅ Statistiques reçues:', data);
      setStats(data);
      
    } catch (err) {
      console.error('❌ Erreur chargement stats:', err);
      setError(err.message || 'Erreur lors du chargement des statistiques');
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  // ✅ CORRECTION : Fonction améliorée pour l'export PDF
  const handleExportPDF = async () => {
    if (!selectedEmployee) {
      setError('Veuillez sélectionner un employé');
      return;
    }
    
    try {
      setLoadingPDF(true);
      const formattedDate = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
      
      // Récupérer les données de l'employé sélectionné
      const employeeData = employees.find(emp => emp.matricule === selectedEmployee);
      if (!employeeData) {
        setError('Données de l\'employé non trouvées');
        return;
      }
      
      console.log('📄 Export PDF avec params:', {
        matricule: selectedEmployee,
        periode: 'mois',
        date: formattedDate,
        nom_employe: `${employeeData.nom}_${employeeData.prenom}`
      });
      
      // ✅ NOUVEAU : Appel avec gestion du nom de fichier
      await exportStatisticsPDF('employe', {
        matricule: selectedEmployee,
        periode: 'mois',
        date: formattedDate,
        nom_employe: `${employeeData.nom}_${employeeData.prenom}`
      });
      
    } catch (err) {
      console.error('❌ Erreur export PDF:', err);
      setError(`Erreur lors de l'export PDF: ${err.message}`);
    } finally {
      setLoadingPDF(false);
    }
  };

  // ✅ CORRECTION : Fonction utilitaire pour normaliser les noms de fichiers
  const normalizeFileName = (name) => {
    return name
      .normalize('NFD') // Normaliser les caractères accentués
      .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
      .replace(/[^a-zA-Z0-9_]/g, '_') // Remplacer les caractères spéciaux par _
      .replace(/_+/g, '_') // Éviter les underscores multiples
      .toLowerCase();
  };

  const handleRefresh = () => {
    if (selectedEmployee) {
      console.log('🔄 Rafraîchissement manuel des statistiques');
      loadStats();
    }
  };

  // Filtrer les employés basé sur la recherche
  const filteredEmployees = employees.filter((emp) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (emp.nom || "").toLowerCase().includes(searchLower) ||
      (emp.prenom || "").toLowerCase().includes(searchLower) ||
      (emp.matricule || "").includes(searchTerm) ||
      (emp.email || "").toLowerCase().includes(searchLower) ||
      (emp.poste || "").toLowerCase().includes(searchLower)
    );
  });

  const selectedEmployeeData = employees.find(emp => emp.matricule === selectedEmployee);

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
              Statistiques par Employé
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Consultez les statistiques détaillées des employés par mois
            </Typography>
          </Box>
        </Box>

        {/* Cartes de statistiques globales */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography color="text.secondary">Total Employés</Typography>
                <Typography variant="h4" sx={{ fontWeight: "bold", color: "primary.main" }}>
                  {employees.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography color="text.secondary">Employés Actifs</Typography>
                <Typography variant="h4" sx={{ fontWeight: "bold", color: "secondary.main" }}>
                  {employees.filter(e => e.statut === 'actif').length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filtres et contrôles */}
        <Card sx={{ mb: 3, borderRadius: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              {/* Recherche d'employé */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="Rechercher un employé..."
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
              
              {/* Sélection d'employé */}
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Employé</InputLabel>
                  <Select
                    value={selectedEmployee}
                    label="Employé"
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                  >
                    {filteredEmployees.map((emp) => (
                      <MenuItem key={emp.matricule} value={emp.matricule}>
                        {emp.nom} {emp.prenom} ({emp.matricule})
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
                  disabled={!selectedEmployee || !stats || loadingPDF}
                  sx={{ height: '56px' }}
                >
                  {loadingPDF ? '' : 'PDF'}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Indicateur de période */}
        {selectedEmployee && stats && (
          <Alert severity="info" sx={{ mb: 2 }}>
            📅 Période affichée : <strong>{months.find(m => m.value === selectedMonth)?.label} {selectedYear}</strong>
            {selectedEmployeeData && (
              <> - Employé : <strong>{selectedEmployeeData.nom} {selectedEmployeeData.prenom}</strong></>
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
            <Typography sx={{ ml: 2 }}>Chargement des statistiques...</Typography>
          </Box>
        )}

        {stats && selectedEmployeeData && (
          <Grid container spacing={3}>
            {/* Informations employé */}
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Informations de l'employé
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={3}>
                      <Typography variant="body2" color="textSecondary">
                        Nom complet
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {selectedEmployeeData.nom} {selectedEmployeeData.prenom}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Typography variant="body2" color="textSecondary">
                        Matricule
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {selectedEmployeeData.matricule}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Typography variant="body2" color="textSecondary">
                        Département
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {selectedEmployeeData.departement?.nom || 'Non assigné'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Typography variant="body2" color="textSecondary">
                        Poste
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {selectedEmployeeData.poste}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Pointages */}
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    📊 Pointages
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell>Heures totales</TableCell>
                          <TableCell>
                            <Chip 
                              label={StatisticsUtils.formatDuration(stats.heures_travail_total)} 
                              color="primary" 
                              variant="outlined"
                            />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Jours travaillés</TableCell>
                          <TableCell>
                            <Chip label={stats.jours_travailles} color="info" variant="outlined" />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Moyenne quotidienne</TableCell>
                          <TableCell>
                            <Chip 
                              label={StatisticsUtils.formatDuration(stats.moyenne_heures_quotidiennes)} 
                              color="secondary" 
                              variant="outlined"
                            />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Pointages réguliers</TableCell>
                          <TableCell>
                            <Chip label={stats.pointages_reguliers} color="success" variant="outlined" />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Pointages irréguliers</TableCell>
                          <TableCell>
                            <Chip label={stats.pointages_irreguliers} color="warning" variant="outlined" />
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Absences */}
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="error">
                    ⚠️ Absences
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell>Taux d'absence</TableCell>
                          <TableCell>
                            <Chip 
                              label={StatisticsUtils.formatPercentage(stats.taux_absence)} 
                              color="error" 
                            />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Jours d'absence</TableCell>
                          <TableCell>
                            <Chip label={stats.jours_absence} color="default" variant="outlined" />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Absences justifiées</TableCell>
                          <TableCell>
                            <Chip label={stats.absences_justifiees} color="info" variant="outlined" />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Absences non justifiées</TableCell>
                          <TableCell>
                            <Chip label={stats.absences_non_justifiees} color="warning" variant="outlined" />
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Congés */}
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="warning">
                    🏖️ Congés
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={3}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="success.main">
                          {stats.conges_valides}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Validés
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="error.main">
                          {stats.conges_refuses}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Refusés
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="info.main">
                          {stats.conges_en_attente}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          En attente
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="primary.main">
                          {StatisticsUtils.formatPercentage(stats.taux_approbation_conges)}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Taux d'approbation
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {!selectedEmployee && !loading && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Veuillez sélectionner un employé pour afficher les statistiques.
          </Alert>
        )}

        {selectedEmployee && !stats && !loading && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Aucune statistique disponible pour cet employé sur la période sélectionnée.
          </Alert>
        )}
      </Box>
    </Box>
  );
};

export default EmployeeStatistics;