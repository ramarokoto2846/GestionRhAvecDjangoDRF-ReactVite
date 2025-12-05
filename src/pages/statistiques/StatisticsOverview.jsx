import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Alert,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  IconButton,
  Tooltip,
  Paper,
  alpha,
  useTheme,
  Divider,
  Card,
  CardContent,
  Chip,
  Stack
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Assessment as AssessmentIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  AccessTime as AccessTimeIcon,
  CalendarToday as CalendarTodayIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon
} from '@mui/icons-material';
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend, BarElement, CategoryScale, LinearScale, LineElement, PointElement } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { getGlobalStatistics, exportStatisticsPDF, StatisticsUtils, getCurrentUser } from '../../services/api';
import Header from '../../components/Header';

// Enregistrer les composants de Chart.js
ChartJS.register(ArcElement, ChartTooltip, Legend, BarElement, CategoryScale, LinearScale, LineElement, PointElement);

const StatisticsOverview = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
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

  useEffect(() => {
    const fetchUserAndData = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        navigate("/");
        return;
      }

      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
        await loadStats();
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

  useEffect(() => {
    loadStats();
  }, [selectedMonth, selectedYear]);

  const loadStats = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');
      
      const formattedDate = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
      const data = await getGlobalStatistics({ mois: formattedDate });
      setStats(data);
    } catch (err) {
      console.error('Erreur chargement stats globales:', err);
      setError(err.message || "Une erreur est survenue lors du chargement des statistiques.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setLoadingPDF(true);
      const formattedDate = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
      
      await exportStatisticsPDF('global', { 
        mois: formattedDate,
        annee: selectedYear
      });
      
    } catch (err) {
      console.error('Erreur export PDF:', err);
      setError(err.message || "Erreur lors de l'export PDF");
    } finally {
      setLoadingPDF(false);
    }
  };

  const handleRefresh = () => {
    loadStats(true);
  };

  // 1. Données pour JOURS ANALYSÉS ET ABSENCES
  const getJoursAbsencesChartData = () => {
    if (!stats) return null;

    const joursPasses = stats.jours_passes_mois || 0;
    const totalPointages = stats.total_pointages || 0;
    const totalAbsences = stats.total_absences || 0;
    
    return {
      labels: ['Jours analysés', 'Pointages effectués', 'Absences'],
      datasets: [
        {
          data: [joursPasses, totalPointages, totalAbsences],
          backgroundColor: [
            alpha(theme.palette.info.main, 0.7),
            alpha(theme.palette.success.main, 0.7),
            alpha(theme.palette.warning.main, 0.7)
          ],
          borderColor: [
            theme.palette.info.main,
            theme.palette.success.main,
            theme.palette.warning.main
          ],
          borderWidth: 2,
          hoverOffset: 15
        }
      ]
    };
  };

  // 2. Données pour PONCTUALITÉ ET RÉGULARITÉ
  const getRegulariteChartData = () => {
    if (!stats) return null;

    const parfaits = stats.ponctualite_parfaite || 0;
    const acceptables = stats.ponctualite_acceptable || 0;
    const inacceptables = stats.ponctualite_inacceptable || 0;

    return {
      labels: ['Parfaits', 'Acceptables', 'Inacceptables'],
      datasets: [
        {
          data: [parfaits, acceptables, inacceptables],
          backgroundColor: [
            theme.palette.success.main,
            theme.palette.warning.main,
            theme.palette.error.main
          ],
          borderColor: [
            theme.palette.success.dark,
            theme.palette.warning.dark,
            theme.palette.error.dark
          ],
          borderWidth: 2,
          hoverOffset: 15
        }
      ]
    };
  };

  // 3. Données pour TAUX DE RÉGULARITÉ
  const getTauxRegulariteChartData = () => {
    if (!stats) return null;

    const tauxParfait = stats.taux_regularite_parfaite || 0;
    const tauxAcceptable = stats.taux_regularite_acceptable || 0;
    const tauxInacceptable = stats.taux_regularite_inacceptable || 0;

    return {
      labels: ['Parfait', 'Acceptable', 'Inacceptable'],
      datasets: [
        {
          label: 'Taux (%)',
          data: [tauxParfait, tauxAcceptable, tauxInacceptable],
          backgroundColor: [
            alpha(theme.palette.success.main, 0.6),
            alpha(theme.palette.warning.main, 0.6),
            alpha(theme.palette.error.main, 0.6)
          ],
          borderColor: [
            theme.palette.success.main,
            theme.palette.warning.main,
            theme.palette.error.main
          ],
          borderWidth: 2,
          borderRadius: 5
        }
      ]
    };
  };

  // 4. Données pour ANALYSE DES HEURES
  const getHeuresChartData = () => {
    if (!stats) return null;

    const heuresTravaillees = Math.round(StatisticsUtils.parseDurationToHours(stats.heures_travail_total) || 0);
    const heuresAttendues = Math.round(StatisticsUtils.parseDurationToHours(stats.heures_attendues_total) || 0);
    
    return {
      labels: ['Heures travaillées', 'Heures attendues'],
      datasets: [
        {
          label: 'Heures',
          data: [heuresTravaillees, heuresAttendues],
          backgroundColor: [
            alpha(theme.palette.success.main, 0.7),
            alpha(theme.palette.primary.main, 0.7)
          ],
          borderColor: [
            theme.palette.success.main,
            theme.palette.primary.main
          ],
          borderWidth: 2,
          borderRadius: 5
        }
      ]
    };
  };

  // Options pour les graphiques
  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 15,
          font: {
            size: 12,
            family: theme.typography.fontFamily
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: alpha(theme.palette.text.primary, 0.1)
        },
        title: {
          display: true,
          text: 'Valeur'
        }
      },
      x: {
        grid: {
          color: alpha(theme.palette.text.primary, 0.1)
        }
      }
    }
  };

  // Fonctions utilitaires
  const getStatutHeuresInfo = () => {
    if (!stats) return { label: 'N/A', color: 'default', icon: <TrendingFlatIcon /> };
    
    const statut = stats.statut_heures_global || 'NORMAL';
    const ecart = StatisticsUtils.formatDuration(stats.ecart_heures_global);
    const pourcentage = stats.pourcentage_ecart_global || 0;
    
    switch(statut.toUpperCase()) {
      case 'INSUFFISANT':
        return {
          label: `INSUFFISANT`,
          description: `Déficit: ${ecart} (${pourcentage.toFixed(1)}%)`,
          color: 'error',
          icon: <TrendingDownIcon />
        };
      case 'SURPLUS':
        return {
          label: `SURPLUS`,
          description: `Excédent: ${ecart} (${pourcentage.toFixed(1)}%)`,
          color: 'info',
          icon: <TrendingUpIcon />
        };
      case 'NORMAL':
        return {
          label: `NORMAL`,
          description: `Écart: ${ecart} (${pourcentage.toFixed(1)}%)`,
          color: 'success',
          icon: <CheckCircleIcon />
        };
      default:
        return {
          label: 'N/A',
          description: '',
          color: 'default',
          icon: <TrendingFlatIcon />
        };
    }
  };

  const getChipColor = (value, type = 'percentage') => {
    if (type === 'percentage') {
      if (value >= 90) return 'success';
      if (value >= 70) return 'warning';
      return 'error';
    }
    return 'default';
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh' }}>
        <Header user={currentUser} onMenuToggle={() => {}} />
        <Container maxWidth="xl" sx={{ mt: 8 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
            <CircularProgress size={60} sx={{ mb: 3 }} />
            <Typography variant="h6" sx={{ color: 'text.secondary' }}>
              Chargement des statistiques globales...
            </Typography>
          </Box>
        </Container>
      </Box>
    );
  }

  const statutHeuresInfo = getStatutHeuresInfo();

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: theme.palette.grey[50] }}>
      <Header user={currentUser} onMenuToggle={() => {}} />
      
      <Container maxWidth="xl" sx={{ mt: 8, pb: 6 }}>
        {/* En-tête avec filtres */}
        <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 3 }}>
          <Grid container alignItems="center" justifyContent="space-between" spacing={2}>
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: 'primary.main' }}>
                  Tableau de Bord Global
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                  Statistiques détaillées pour {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <FormControl size="small" sx={{ minWidth: 120 }}>
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
                
                <FormControl size="small" sx={{ minWidth: 120 }}>
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
                
                <Tooltip title="Actualiser">
                  <IconButton onClick={handleRefresh} disabled={refreshing}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
                
                <Button
                  variant="contained"
                  startIcon={loadingPDF ? <CircularProgress size={20} /> : <DownloadIcon />}
                  onClick={handleExportPDF}
                  disabled={loadingPDF || !stats}
                >
                  {loadingPDF ? 'Génération...' : 'PDF'}
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {error && (
          <Alert severity="error" onClose={() => setError('')} sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}

        {!stats && !loading && (
          <Alert severity="info" sx={{ mb: 4 }}>
            Aucune donnée disponible pour {months.find(m => m.value === selectedMonth)?.label} {selectedYear}.
          </Alert>
        )}

        {stats && (
          <>
            {/* SECTION 1: INFORMATIONS GÉNÉRALES */}
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: 'primary.main', display: 'flex', alignItems: 'center' }}>
              <CalendarTodayIcon sx={{ mr: 1 }} />
              Période d'analyse
            </Typography>
            
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={4}>
                <Card elevation={2} sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                      <CalendarTodayIcon sx={{ mr: 1, color: 'primary.main' }} />
                      Période
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stats.jours_passes_mois || 0} jours analysés
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card elevation={2} sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                      <PersonIcon sx={{ mr: 1, color: 'info.main' }} />
                      Employés
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                          {stats.total_employes || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total employés
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main' }}>
                          {stats.employes_actifs || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Actifs
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card elevation={2} sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                      <BusinessIcon sx={{ mr: 1, color: 'secondary.main' }} />
                      Départements
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                          {stats.total_departements || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total départements
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main' }}>
                          {stats.departements_actifs || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Actifs
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* SECTION 2: JOURS ANALYSÉS ET ABSENCES */}
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: 'primary.main', display: 'flex', alignItems: 'center' }}>
              <CalendarTodayIcon sx={{ mr: 1 }} />
              Jours analysés et absences
            </Typography>
            
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={6}>
                <Card elevation={2} sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                      Répartition
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <Pie data={getJoursAbsencesChartData()} options={pieChartOptions} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card elevation={2} sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                      Détails des jours
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Paper elevation={0} sx={{ p: 2, bgcolor: alpha(theme.palette.info.light, 0.1), borderRadius: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Jours passés dans le mois
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 700, color: 'info.main' }}>
                            {stats.jours_passes_mois || 0} jours
                          </Typography>
                        </Paper>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <Paper elevation={0} sx={{ p: 2, bgcolor: alpha(theme.palette.success.light, 0.1), borderRadius: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Pointages effectués
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                            {stats.total_pointages || 0} jours
                          </Typography>
                        </Paper>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <Paper elevation={0} sx={{ p: 2, bgcolor: alpha(theme.palette.warning.light, 0.1), borderRadius: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Total absences
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 700, color: 'warning.main' }}>
                            {stats.total_absences || 0} jours
                          </Typography>
                        </Paper>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <Paper elevation={0} sx={{ p: 2, bgcolor: alpha(theme.palette.success.light, 0.1), borderRadius: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Taux de présence global
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                              {StatisticsUtils.formatPercentage(stats.taux_presence || 0)}
                            </Typography>
                            <Chip 
                              label={stats.taux_presence >= 90 ? 'Excellent' : stats.taux_presence >= 70 ? 'Bon' : 'À améliorer'} 
                              size="small" 
                              color={getChipColor(stats.taux_presence)}
                            />
                          </Box>
                        </Paper>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <Paper elevation={0} sx={{ p: 2, bgcolor: alpha(theme.palette.warning.light, 0.1), borderRadius: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Taux d'absence global
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: 'warning.main' }}>
                              {StatisticsUtils.formatPercentage(stats.taux_absence_global || 0)}
                            </Typography>
                            <Chip 
                              label={stats.taux_absence_global <= 5 ? 'Faible' : stats.taux_absence_global <= 10 ? 'Modéré' : 'Élevé'} 
                              size="small" 
                              color={getChipColor(100 - stats.taux_absence_global)}
                            />
                          </Box>
                        </Paper>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* SECTION 3: PONCTUALITÉ ET RÉGULARITÉ GLOBALE */}
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: 'primary.main', display: 'flex', alignItems: 'center' }}>
              <AccessTimeIcon sx={{ mr: 1 }} />
              Ponctualité et régularité globale
            </Typography>
            
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={6}>
                <Card elevation={2} sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                      Répartition des pointages
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <Pie data={getRegulariteChartData()} options={pieChartOptions} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card elevation={2} sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                      Taux de régularité
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <Bar data={getTauxRegulariteChartData()} options={barChartOptions} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            {/* Détails de ponctualité */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {[
                {
                  title: 'Ponctualité parfaite',
                  value: stats.ponctualite_parfaite || 0,
                  description: 'Pointages parfaits',
                  color: 'success',
                  icon: <CheckCircleIcon />
                },
                {
                  title: 'Ponctualité acceptable',
                  value: stats.ponctualite_acceptable || 0,
                  description: 'Pointages acceptables',
                  color: 'warning',
                  icon: <WarningIcon />
                },
                {
                  title: 'Ponctualité inacceptable',
                  value: stats.ponctualite_inacceptable || 0,
                  description: 'Pointages inacceptables',
                  color: 'error',
                  icon: <ErrorIcon />
                },
                {
                  title: 'Taux régularité parfaite',
                  value: StatisticsUtils.formatPercentage(stats.taux_regularite_parfaite || 0),
                  description: 'Pourcentage de pointages parfaits',
                  color: getChipColor(stats.taux_regularite_parfaite || 0),
                  icon: <AssessmentIcon />
                },
                {
                  title: 'Taux régularité acceptable',
                  value: StatisticsUtils.formatPercentage(stats.taux_regularite_acceptable || 0),
                  description: 'Pourcentage de pointages acceptables',
                  color: getChipColor(stats.taux_regularite_acceptable || 0),
                  icon: <AssessmentIcon />
                },
                {
                  title: 'Taux régularité inacceptable',
                  value: StatisticsUtils.formatPercentage(stats.taux_regularite_inacceptable || 0),
                  description: 'Pourcentage de pointages inacceptables',
                  color: getChipColor(stats.taux_regularite_inacceptable || 0),
                  icon: <AssessmentIcon />
                }
              ].map((item, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Card elevation={1} sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ 
                          backgroundColor: alpha(theme.palette[item.color].main, 0.1),
                          borderRadius: '50%',
                          p: 1,
                          mr: 2
                        }}>
                          {React.cloneElement(item.icon, { color: item.color })}
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {item.title}
                        </Typography>
                      </Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: `${item.color}.main` }}>
                        {item.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* SECTION 4: ANALYSE DES HEURES GLOBALES */}
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: 'primary.main', display: 'flex', alignItems: 'center' }}>
              <AccessTimeIcon sx={{ mr: 1 }} />
              Analyse des heures globales
            </Typography>
            
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={8}>
                <Card elevation={2} sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                      Comparaison heures travaillées/attendues
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <Bar data={getHeuresChartData()} options={barChartOptions} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card elevation={2} sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                      Statut des heures
                    </Typography>
                    <Box sx={{ 
                      p: 3, 
                      borderRadius: 2,
                      backgroundColor: alpha(theme.palette[statutHeuresInfo.color].light, 0.1),
                      border: `1px solid ${alpha(theme.palette[statutHeuresInfo.color].main, 0.3)}`,
                      textAlign: 'center'
                    }}>
                      <Box sx={{ mb: 2 }}>
                        {React.cloneElement(statutHeuresInfo.icon, { 
                          sx: { fontSize: 48, color: `${statutHeuresInfo.color}.main` } 
                        })}
                      </Box>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: `${statutHeuresInfo.color}.main`, mb: 1 }}>
                        {statutHeuresInfo.label}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {statutHeuresInfo.description}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            {/* Détails des heures */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {[
                {
                  title: 'Heures attendues totales',
                  value: StatisticsUtils.formatDuration(stats.heures_attendues_total),
                  description: 'Heures théoriques attendues',
                  color: 'primary',
                  icon: <AccessTimeIcon />
                },
                {
                  title: 'Heures travaillées totales',
                  value: stats.heures_travail_total_str || StatisticsUtils.formatDuration(stats.heures_travail_total),
                  description: 'Heures réellement travaillées',
                  color: 'success',
                  icon: <AccessTimeIcon />
                },
                {
                  title: 'Écart global',
                  value: StatisticsUtils.formatDuration(stats.ecart_heures_global),
                  description: 'Différence heures travaillées/attendues',
                  color: statutHeuresInfo.color,
                  icon: statutHeuresInfo.icon
                },
                {
                  title: 'Pourcentage d\'écart',
                  value: `${stats.pourcentage_ecart_global?.toFixed(1) || 0}%`,
                  description: 'Pourcentage de différence',
                  color: statutHeuresInfo.color,
                  icon: <AssessmentIcon />
                },
                {
                  title: 'Moyenne quotidienne',
                  value: stats.moyenne_heures_quotidiennes_str || StatisticsUtils.formatDuration(stats.moyenne_heures_quotidiennes),
                  description: 'Moyenne par jour travaillé',
                  color: 'info',
                  icon: <AccessTimeIcon />
                },
                {
                  title: 'Taux d\'activité global',
                  value: StatisticsUtils.formatPercentage(stats.taux_activite_global || 0),
                  description: 'Pourcentage d\'employés actifs',
                  color: getChipColor(stats.taux_activite_global || 0),
                  icon: <AssessmentIcon />
                }
              ].map((item, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Card elevation={1} sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ 
                          backgroundColor: alpha(theme.palette[item.color].main, 0.1),
                          borderRadius: '50%',
                          p: 1,
                          mr: 2
                        }}>
                          {React.cloneElement(item.icon, { color: item.color })}
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {item.title}
                        </Typography>
                      </Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: `${item.color}.main` }}>
                        {item.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* SECTION 5: OBSERVATION GLOBALE */}
            {stats.observation_globale && (
              <>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: 'primary.main', display: 'flex', alignItems: 'center' }}>
                  <AssessmentIcon sx={{ mr: 1 }} />
                  Observation globale
                </Typography>
                
                <Card elevation={2} sx={{ mb: 4 }}>
                  <CardContent>
                    <Typography variant="body1" sx={{ lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                      {stats.observation_globale}
                    </Typography>
                  </CardContent>
                </Card>
              </>
            )}

            {/* SECTION 6: SYNTHÈSE */}
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: 'primary.main', display: 'flex', alignItems: 'center' }}>
              <AssessmentIcon sx={{ mr: 1 }} />
              Synthèse
            </Typography>
            
            <Card elevation={2}>
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Période analysée
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
                      </Typography>
                      <Chip 
                        label={`${stats.jours_passes_mois || 0} jours`}
                        size="small"
                        color="info"
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Présence
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                        {StatisticsUtils.formatPercentage(stats.taux_presence || 0)}
                      </Typography>
                      <Chip 
                        label={`${stats.total_pointages || 0} pointages`}
                        size="small"
                        color="success"
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Régularité
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: `${getChipColor(stats.taux_regularite_parfaite || 0)}.main` }}>
                        {StatisticsUtils.formatPercentage(stats.taux_regularite_parfaite || 0)}
                      </Typography>
                      <Chip 
                        label={`${stats.ponctualite_parfaite || 0} parfaits`}
                        size="small"
                        color={getChipColor(stats.taux_regularite_parfaite || 0)}
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Heures de travail
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: `${statutHeuresInfo.color}.main` }}>
                        {statutHeuresInfo.label.split(' ')[0]}
                      </Typography>
                      <Chip 
                        label={StatisticsUtils.formatDuration(stats.heures_travail_total)}
                        size="small"
                        color={statutHeuresInfo.color}
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  </Grid>
                </Grid>
                
                <Divider sx={{ my: 3 }} />
                
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center' }}>
                  Rapport généré le {new Date().toLocaleDateString('fr-FR')} - Système de Gestion RH
                </Typography>
              </CardContent>
            </Card>
          </>
        )}
      </Container>
    </Box>
  );
};

export default StatisticsOverview;