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
  useTheme,
  alpha,
  Container,
  CardHeader,
  Tooltip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Download as DownloadIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Schedule as ScheduleIcon,
  AccessTime as AccessTimeIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import {
  getEmployeeStatistics,
  getEmployes,
  exportStatisticsPDF,
  StatisticsUtils
} from '../../services/api';
import Header from '../../components/Header';

const EmployeeStatistics = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingPDF, setLoadingPDF] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const months = [
    { value: 1, label: 'Janvier' }, { value: 2, label: 'Février' }, { value: 3, label: 'Mars' },
    { value: 4, label: 'Avril' }, { value: 5, label: 'Mai' }, { value: 6, label: 'Juin' },
    { value: 7, label: 'Juillet' }, { value: 8, label: 'Août' }, { value: 9, label: 'Septembre' },
    { value: 10, label: 'Octobre' }, { value: 11, label: 'Novembre' }, { value: 12, label: 'Décembre' }
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

  // Fonction utilitaire pour les valeurs sécurisées
  const getSafeValue = (value, defaultValue = 0) => {
    if (value === null || value === undefined || value === 'undefined' || value === '') {
      return defaultValue;
    }
    
    if (typeof value === 'string') {
      const numValue = parseFloat(value);
      return isNaN(numValue) ? defaultValue : numValue;
    }
    
    return value;
  };

  // Fonction pour calculer le taux de présence
  const calculateTauxPresence = (statsData) => {
    if (!statsData || !statsData.jours_travailles || !statsData.jours_ouvrables || statsData.jours_ouvrables === 0) {
      return 0;
    }
    return Math.round((statsData.jours_travailles / statsData.jours_ouvrables) * 100);
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/");
      return;
    }
    loadEmployees();
  }, [navigate]);

  useEffect(() => {
    if (selectedEmployee) {
      loadStatistics();
    } else {
      setStats(null);
    }
  }, [selectedEmployee, selectedMonth, selectedYear]);

  const loadEmployees = async () => {
    try {
      const data = await getEmployes();
      setEmployees(data);
    } catch (err) {
      console.error('Erreur chargement employés:', err);
      setError(err.message);
    }
  };

  const loadStatistics = async (isRefresh = false) => {
    if (!selectedEmployee) {
      setStats(null);
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');

      const formattedDate = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
      const params = { periode: 'mois', date: formattedDate };

      console.log('🔄 Chargement des statistiques pour:', selectedEmployee, params);

      // ✅ CORRECTION: Utiliser directement la fonction API
      const statsData = await getEmployeeStatistics(selectedEmployee, params);
      
      if (statsData) {
        console.log('📊 Données API reçues:', statsData);
        setStats(statsData);
      } else {
        console.log('❌ Aucune donnée API');
        setStats(null);
      }

    } catch (err) {
      console.error('❌ Erreur chargement stats:', err);
      setError(err.message || 'Erreur lors du chargement des statistiques');
      setStats(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleExportPDF = async () => {
    if (!selectedEmployee) {
      setError('Veuillez sélectionner un employé');
      return;
    }

    try {
      setLoadingPDF(true);
      const formattedDate = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
      const employeeData = employees.find(emp => emp.matricule === selectedEmployee);
      if (!employeeData) {
        setError('Données de l\'employé non trouvées');
        return;
      }

      await exportStatisticsPDF('employe', {
        matricule: selectedEmployee,
        periode: 'mois',
        date: formattedDate,
        nom_employe: `${employeeData.nom}_${employeeData.prenom}`
      });
    } catch (err) {
      console.error('Erreur export PDF:', err);
      setError(`Erreur lors de l'export PDF: ${err.message}`);
    } finally {
      setLoadingPDF(false);
    }
  };

  const handleRefresh = () => {
    loadStatistics(true);
  };

  // ✅ CORRECTION: Fonction pour obtenir la configuration du statut
  const getStatusConfig = (statut) => {
    switch (statut) {
      case 'INSUFFISANT':
        return {
          icon: '⚠️',
          color: 'warning',
          bgColor: `${theme.palette.warning.main}15`,
          textColor: theme.palette.warning.main
        };
      case 'NORMAL':
        return {
          icon: '✅',
          color: 'success',
          bgColor: `${theme.palette.success.main}15`,
          textColor: theme.palette.success.main
        };
      case 'SURPLUS':
        return {
          icon: '📈',
          color: 'info',
          bgColor: `${theme.palette.info.main}15`,
          textColor: theme.palette.info.main
        };
      default:
        return {
          icon: '📊',
          color: 'primary',
          bgColor: `${theme.palette.primary.main}15`,
          textColor: theme.palette.primary.main
        };
    }
  };

  // ✅ CORRECTION: Fonction pour obtenir la couleur du taux
  const getRateColor = (taux) => {
    const safeTaux = getSafeValue(taux, 0);
    if (safeTaux >= 90) return 'success';
    if (safeTaux >= 70) return 'warning';
    return 'error';
  };

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
    <Box sx={{ display: 'flex', flexDirection: 'column', backgroundColor: theme.palette.background.default }}>
      <Header />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8,
        }}
      >
        <Container maxWidth="xl">
          {/* Header Section */}
          <Box sx={{ mb: 4 }} >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 700,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                    mb: 1
                  }}
                >
                  Statistiques Employé
                </Typography>
                <Typography variant="h6" sx={{ color: 'text.secondary', mb: 3 }}>
                  Analyse des performances d'un Employé
                </Typography>
              </Box>
              <Tooltip title="Actualiser les données">
                <IconButton 
                  onClick={handleRefresh}
                  disabled={refreshing}
                  sx={{
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    color: 'white',
                    '&:hover': {
                      transform: 'rotate(180deg)',
                      transition: 'transform 0.6s ease'
                    }
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Filters Section */}
          <Card
            sx={{
              mb: 3,
              background: `linear-gradient(135deg, ${theme.palette.background.paper}, ${alpha(theme.palette.primary.light, 0.03)})`,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} sm={6} md={2} width={350}>
                  <FormControl fullWidth>
                    <InputLabel>Employé</InputLabel>
                    <Select
                      value={selectedEmployee}
                      label="Employé"
                      onChange={(e) => setSelectedEmployee(e.target.value)}
                      sx={{ borderRadius: 2 }}
                    >
                      {filteredEmployees.map((emp) => (
                        <MenuItem key={emp.matricule} value={emp.matricule}>
                          {emp.nom} {emp.prenom} ({emp.matricule})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={2} width={350}>
                  <FormControl fullWidth>
                    <InputLabel>Mois</InputLabel>
                    <Select
                      value={selectedMonth}
                      label="Mois"
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      sx={{ borderRadius: 2 }}
                    >
                      {months.map((month) => (
                        <MenuItem key={month.value} value={month.value}>
                          {month.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={2} width={350}>
                  <FormControl fullWidth>
                    <InputLabel>Année</InputLabel>
                    <Select
                      value={selectedYear}
                      label="Année"
                      onChange={(e) => setSelectedYear(e.target.value)}
                      sx={{ borderRadius: 2 }}
                    >
                      {years.map((year) => (
                        <MenuItem key={year} value={year}>
                          {year}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={3} width={315}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={loadingPDF ? <CircularProgress size={20} /> : <DownloadIcon />}
                    onClick={handleExportPDF}
                    disabled={!selectedEmployee || !stats || loadingPDF}
                    sx={{
                      borderRadius: 2,
                      py: 1.5,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      '&:hover': {
                        background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                      }
                    }}
                  >
                    {loadingPDF ? 'Génération...' : 'Exporter PDF'}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Status Alert */}
          {selectedEmployee && stats && (
            <Alert
              severity="info"
              sx={{
                mb: 3,
                borderRadius: 2,
                background: `${theme.palette.info.light}10`,
                border: `1px solid ${theme.palette.info.light}30`
              }}
            >
              Période analysée : <strong>{months.find(m => m.value === selectedMonth)?.label} {selectedYear}</strong>
              {selectedEmployeeData && (
                <> • Employé : <strong>{selectedEmployeeData.nom} {selectedEmployeeData.prenom}</strong></>
              )}
            </Alert>
          )}

          {error && (
            <Alert
              severity="error"
              onClose={() => setError('')}
              sx={{ mb: 3, borderRadius: 2 }}
            >
              {error}
            </Alert>
          )}

          {/* Loading State */}
          {loading && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <CircularProgress size={60} sx={{ mb: 2, color: theme.palette.primary.main }} />
              <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                Chargement des statistiques...
              </Typography>
            </Box>
          )}

          {/* ✅ CORRECTION: AFFICHAGE SIMPLIFIÉ DES STATISTIQUES */}
          {stats && selectedEmployeeData && (
            <Grid container spacing={3}>
              
              {/* SECTION 1: STATISTIQUES DE POINTAGE */}
              <Grid item xs={12} md={4} width={480}>
                <Card
                  sx={{
                    height: '100%',
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}15, ${theme.palette.background.paper})`,
                    border: `2px solid ${theme.palette.primary.main}30`,
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                  }}
                >
                  <CardHeader
                    title={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ScheduleIcon sx={{ mr: 2, color: 'primary.main' }} />
                        <Typography variant="h5" sx={{ fontWeight: 600 }}>
                          STATISTIQUES DE POINTAGE
                        </Typography>
                      </Box>
                    }
                    sx={{ pb: 1 }}
                  />
                  <CardContent>
                    <TableContainer>
                      <Table size="small">
                        <TableBody>
                          <TableRow>
                            <TableCell sx={{ border: 'none', py: 1.5 }}>
                              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                Heures totales travaillées
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ border: 'none', py: 1.5 }} align="right">
                              <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                {stats.heures_travail_total_str || StatisticsUtils.formatDuration(stats.heures_travail_total)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ border: 'none', py: 1.5 }}>
                              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                Jours travaillés
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ border: 'none', py: 1.5 }} align="right">
                              <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                                {getSafeValue(stats.jours_travailles)} jours
                              </Typography>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ border: 'none', py: 1.5 }}>
                              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                Moyenne quotidienne
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ border: 'none', py: 1.5 }} align="right">
                              <Typography variant="body2" sx={{ fontWeight: 600, color: 'info.main' }}>
                                {stats.moyenne_heures_quotidiennes_str || StatisticsUtils.formatDuration(stats.moyenne_heures_quotidiennes)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ border: 'none', py: 1.5 }}>
                              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                Pointages réguliers
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ border: 'none', py: 1.5 }} align="right">
                              <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                                {getSafeValue(stats.pointages_reguliers)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ border: 'none', py: 1.5 }}>
                              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                Pointages irréguliers
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ border: 'none', py: 1.5 }} align="right">
                              <Typography variant="body2" sx={{ fontWeight: 600, color: 'warning.main' }}>
                                {getSafeValue(stats.pointages_irreguliers)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ border: 'none', py: 1.5 }}>
                              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                Taux de régularité
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ border: 'none', py: 1.5 }} align="right">
                              <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                                {getSafeValue(stats.taux_regularite)}%
                              </Typography>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* SECTION 3: ANALYSE DE PONCTUALITÉ */}
              <Grid item xs={12} md={4} width={480}>
                <Card
                  sx={{
                    height: '100%',
                    background: `linear-gradient(135deg, ${theme.palette.info.main}15, ${theme.palette.background.paper})`,
                    border: `2px solid ${theme.palette.info.main}30`,
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                  }}
                >
                  <CardHeader
                    title={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AccessTimeIcon sx={{ mr: 2, color: 'info.main' }} />
                        <Typography variant="h5" sx={{ fontWeight: 600 }}>
                          ANALYSE DE PONCTUALITÉ
                        </Typography>
                      </Box>
                    }
                    sx={{ pb: 1 }}
                  />
                  <CardContent>
                    {/* Taux de ponctualité global */}
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                      <Typography variant="h3" sx={{
                        fontWeight: 700,
                        color: theme.palette.info.main,
                        mb: 1
                      }}>
                        {getSafeValue(stats.taux_ponctualite)}%
                      </Typography>
                      <Typography variant="body1" sx={{
                        color: 'text.secondary',
                        mb: 1
                      }}>
                        Taux de ponctualité global
                      </Typography>
                    </Box>

                    {/* Détails de ponctualité */}
                    <TableContainer>
                      <Table size="small">
                        <TableBody>
                          <TableRow>
                            <TableCell sx={{ border: 'none', py: 1.5 }}>
                              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                Jours ponctuels
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ border: 'none', py: 1.5 }} align="right">
                              <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                                {getSafeValue(stats.pointages_ponctuels)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ border: 'none', py: 1.5 }}>
                              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                Jours non ponctuels
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ border: 'none', py: 1.5 }} align="right">
                              <Typography variant="body2" sx={{ fontWeight: 600, color: 'warning.main' }}>
                                {getSafeValue(stats.pointages_non_ponctuels)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ border: 'none', py: 1.5 }}>
                              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                Total jours analysés
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ border: 'none', py: 1.5 }} align="right">
                              <Typography variant="body2" sx={{ fontWeight: 600, color: 'info.main' }}>
                                {getSafeValue(stats.jours_travailles)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {/* Recommandation ponctualité */}
                    <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                      <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                        {getSafeValue(stats.taux_ponctualite) >= 90 
                          ? "✅ Excellente ponctualité, respect systématique des horaires."
                          : getSafeValue(stats.taux_ponctualite) >= 80
                          ? "🟡 Bonne ponctualité, horaires généralement respectés."
                          : "⚠️ Ponctualité à améliorer, retards fréquents."}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* SECTION 2: OBSERVATION ET RECOMMANDATIONS */}
              <Grid item xs={12} md={4} width={480}>
                <Card
                  sx={{
                    height: '100%',
                    background: `linear-gradient(135deg, ${getStatusConfig(stats.statut_heures).bgColor}, ${theme.palette.background.paper})`,
                    border: `2px solid ${getStatusConfig(stats.statut_heures).textColor}30`,
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                  }}
                >
                  <CardHeader
                    title={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TrendingUpIcon sx={{ mr: 2, color: getStatusConfig(stats.statut_heures).textColor }} />
                        <Typography variant="h5" sx={{ fontWeight: 600 }}>
                          OBSERVATION ET RECOMMANDATIONS
                        </Typography>
                      </Box>
                    }
                    sx={{ pb: 1 }}
                  />
                  <CardContent>
                    {/* Statut des heures */}
                    <Box sx={{ mb: 3, textAlign: 'center' }}>
                      <Chip
                        icon={<span>{getStatusConfig(stats.statut_heures).icon}</span>}
                        label={`STATUT: ${stats.statut_heures || 'NON_DEFINI'}`}
                        color={getStatusConfig(stats.statut_heures).color}
                        sx={{
                          fontSize: '1rem',
                          py: 2,
                          px: 3,
                          mb: 2,
                          fontWeight: 700
                        }}
                      />
                    </Box>

                    Observation
                    <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                      <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary', lineHeight: 1.6 }}>
                        {stats.observation_heures || 'Aucune observation disponible pour cette période.'}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

            </Grid>
          )}

          {/* Empty State */}
          {!loading && !stats && selectedEmployee && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <ScheduleIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
                Aucune donnée disponible
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                Aucune statistique trouvée pour cet employé sur la période sélectionnée.
              </Typography>
              <Button 
                variant="outlined" 
                onClick={handleRefresh}
                startIcon={<RefreshIcon />}
              >
                Réessayer
              </Button>
            </Box>
          )}

          {/* No Employee Selected */}
          {!loading && !selectedEmployee && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <AccessTimeIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
                Aucun employé sélectionné
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Veuillez sélectionner un employé pour afficher ses statistiques.
              </Typography>
            </Box>
          )}
        </Container>
      </Box>
    </Box>
  );
};

export default EmployeeStatistics;