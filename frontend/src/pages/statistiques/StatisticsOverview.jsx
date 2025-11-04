import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Container,
  alpha,
  useTheme,
  Chip,
  LinearProgress,
  CardHeader,
  IconButton,
  Tooltip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  People as PeopleIcon,
  Apartment as ApartmentIcon,
  AccessTime as AccessTimeIcon,
  TrendingUp as TrendingUpIcon,
  Download as DownloadIcon,
  Event as EventIcon,
  Schedule as ScheduleIcon,
  Refresh as RefreshIcon,
  BarChart as BarChartIcon,
  Timeline as TimelineIcon,
  PieChart as PieChartIcon
} from '@mui/icons-material';
import { getGlobalStatistics, exportStatisticsPDF, StatisticsUtils, getCurrentUser, isSuperuser } from '../../services/api';
import Header from '../../components/Header';

const StatisticsOverview = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [isSuperuserState, setIsSuperuserState] = useState(false);
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

  // Fonction utilitaire pour les valeurs sécurisées
  const getSafeValue = (value, defaultValue = 0) => {
    return value !== null && value !== undefined ? value : defaultValue;
  };

  // Calcul du pourcentage d'heures travaillées
  const calculateHoursPercentage = (hours) => {
    if (!hours) return 0;
    const totalSeconds = typeof hours === 'string' ? 
      StatisticsUtils.parseDurationToSeconds(hours) : hours.total_seconds();
    const expectedMonthlyHours = 22 * 8 * 3600; // 22 jours × 8h × 3600 secondes
    return Math.min((totalSeconds / expectedMonthlyHours) * 100, 100);
  };

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
        const superuser = await isSuperuser();
        setIsSuperuserState(superuser);
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
      const result = await exportStatisticsPDF('global', { mois: formattedDate });
      
      if (result && !result.success) {
        setError(result.message || "Erreur lors de l'export PDF");
      }
    } catch (err) {
      setError(err.message || "Erreur lors de l'export PDF");
    } finally {
      setLoadingPDF(false);
    }
  };

  const handleRefresh = () => {
    loadStats(true);
  };

  // Métriques de performance calculées dynamiquement
  const performanceMetrics = [
    { 
      label: "Heures travaillées", 
      value: StatisticsUtils.formatDuration(stats?.heures_travail_total),
      percentage: calculateHoursPercentage(stats?.heures_travail_total),
      color: "success"
    },
    { 
      label: "Taux de présence", 
      value: StatisticsUtils.formatPercentage(getSafeValue(stats?.taux_presence)),
      percentage: getSafeValue(stats?.taux_presence),
      color: "primary"
    },
    { 
      label: "Pointages réguliers", 
      value: getSafeValue(stats?.pointages_reguliers),
      percentage: ((getSafeValue(stats?.pointages_reguliers) / Math.max(getSafeValue(stats?.total_pointages), 1)) * 100),
      color: "secondary"
    },
  ];

  // Composant StatCard avec interaction
  const StatCard = ({ title, value, subtitle, icon, trend, color = 'primary', onClick }) => (
    <Card 
      sx={{ 
        height: '100%',
        background: `linear-gradient(135deg, ${alpha(theme.palette[color].main, 0.1)} 0%, ${alpha(theme.palette[color].light, 0.05)} 100%)`,
        border: `1px solid ${alpha(theme.palette[color].main, 0.1)}`,
        transition: 'all 0.3s ease',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': {
          transform: onClick ? 'translateY(-4px)' : 'none',
          boxShadow: onClick ? `0 8px 25px ${alpha(theme.palette[color].main, 0.15)}` : 'none',
          border: `1px solid ${alpha(theme.palette[color].main, 0.2)}`
        }
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography 
              variant="h6" 
              color="text.secondary" 
              sx={{ 
                fontWeight: 600,
                fontSize: '0.9rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              {title}
            </Typography>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 700,
                background: `linear-gradient(45deg, ${theme.palette[color].main}, ${theme.palette[color].dark})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                my: 1
              }}
            >
              {value}
            </Typography>
            {subtitle && (
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'text.secondary',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 3,
              background: `linear-gradient(135deg, ${theme.palette[color].main} 0%, ${theme.palette[color].dark} 100%)`,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {icon}
          </Box>
        </Box>
        {trend && (
          <Chip 
            label={trend} 
            size="small"
            sx={{ 
              backgroundColor: alpha(theme.palette[color].main, 0.1),
              color: theme.palette[color].dark,
              fontWeight: 600
            }}
          />
        )}
      </CardContent>
    </Card>
  );

  // Composant MetricCard
  const MetricCard = ({ title, icon, children, color = 'primary' }) => (
    <Card 
      sx={{ 
        height: '100%',
        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.default, 0.4)} 100%)`,
        backdropFilter: 'blur(10px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 6px 20px ${alpha(theme.palette[color].main, 0.1)}`
        }
      }}
    >
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${theme.palette[color].main} 0%, ${theme.palette[color].dark} 100%)`,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {icon}
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
          </Box>
        }
        sx={{ pb: 1 }}
      />
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );

  // Composant ProgressMetric
  const ProgressMetric = ({ label, value, percentage, color = 'primary' }) => (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
          {label}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette[color].main }}>
          {value}
        </Typography>
      </Box>
      <LinearProgress 
        variant="determinate" 
        value={percentage} 
        sx={{
          height: 6,
          borderRadius: 3,
          backgroundColor: alpha(theme.palette[color].main, 0.1),
          '& .MuiLinearProgress-bar': {
            backgroundColor: theme.palette[color].main,
            borderRadius: 3
          }
        }}
      />
    </Box>
  );

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.background.paper} 100%)` }}>
        <Header user={currentUser} onMenuToggle={() => {}} />
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Container maxWidth="xl">
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 3 }}>
              <CircularProgress 
                size={60}
                sx={{
                  color: theme.palette.primary.main,
                  '& .MuiCircularProgress-circle': {
                    strokeLinecap: 'round',
                  }
                }}
              />
              <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                Chargement des statistiques globales...
              </Typography>
            </Box>
          </Container>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ minHeight: '100vh', background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.background.paper} 100%)` }}>
        <Header user={currentUser} onMenuToggle={() => {}} />
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Container maxWidth="xl">
            <Alert 
              severity="error" 
              sx={{ 
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                '& .MuiAlert-message': {
                  fontWeight: 500
                }
              }}
            >
              {error}
            </Alert>
          </Container>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.background.paper} 100%)` }}>
      <Header user={currentUser} onMenuToggle={() => {}} />
      
      {/* Barre de progression pendant le rafraîchissement */}
      {refreshing && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>
          <LinearProgress 
            color="primary"
            sx={{ height: 3 }}
          />
        </Box>
      )}

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Container maxWidth="xl">
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box>
                <Typography 
                  variant="h3" 
                  sx={{ 
                    fontWeight: 800,
                    background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                    mb: 1
                  }}
                >
                  Tableau de Bord Global
                </Typography>
                <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 400 }}>
                  Vue d'ensemble des indicateurs clés de performance de l'entreprise
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

            <Chip 
              icon={<BarChartIcon />} 
              label={`Données pour ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`}
              variant="outlined"
              sx={{ 
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
                borderColor: alpha(theme.palette.primary.main, 0.2),
                color: theme.palette.primary.main,
                fontWeight: 600
              }}
            />
          </Box>

          {/* Filtres */}
          <Card 
            sx={{ 
              mb: 4,
              background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.default, 0.4)} 100%)`,
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
            }}
          >
            <CardContent>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} sm={6} md={3}>
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

                <Grid item xs={12} sm={6} md={3}>
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

                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Chip 
                      icon={<TimelineIcon />}
                      label={`${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`}
                      color="primary"
                      variant="filled"
                      sx={{ fontWeight: 600, fontSize: '0.9rem' }}
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={loadingPDF ? <CircularProgress size={20} /> : <DownloadIcon />}
                    onClick={handleExportPDF}
                    disabled={loadingPDF}
                    sx={{
                      py: 1.5,
                      borderRadius: 2,
                      fontWeight: 600,
                      textTransform: 'none',
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                      boxShadow: `0 4px 15px ${alpha(theme.palette.primary.main, 0.3)}`,
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.4)}`
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {loadingPDF ? 'Génération...' : 'Exporter PDF'}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Cartes principales */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Tooltip title="Nombre total d'employés dans l'entreprise" arrow>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Effectif Total"
                  value={getSafeValue(stats?.total_employes)}
                  subtitle={`${getSafeValue(stats?.employes_actifs)} employés actifs`}
                  icon={<PeopleIcon />}
                  color="primary"
                  onClick={() => navigate('/employes')}
                />
              </Grid>
            </Tooltip>

            <Tooltip title="Nombre de départements opérationnels" arrow>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Départements"
                  value={getSafeValue(stats?.total_departements)}
                  subtitle="Unités opérationnelles"
                  icon={<ApartmentIcon />}
                  color="secondary"
                />
              </Grid>
            </Tooltip>

            <Tooltip title="Taux d'activité moyen des employés" arrow>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Taux d'Activité"
                  value={StatisticsUtils.formatPercentage(stats?.taux_activite_global)}
                  subtitle="Performance globale"
                  icon={<TrendingUpIcon />}
                  color="success"
                />
              </Grid>
            </Tooltip>

            <Tooltip title="Nombre total de pointages enregistrés ce mois" arrow>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Pointages"
                  value={getSafeValue(stats?.total_pointages)}
                  subtitle="Enregistrements ce mois"
                  icon={<AccessTimeIcon />}
                  color="info"
                />
              </Grid>
            </Tooltip>
          </Grid>

          {/* Cartes détaillées */}
          <Grid container spacing={3}>
            {/* Événements & Activités */}
            <Grid item xs={12} md={6} lg={4}>
              <MetricCard title="Événements & Activités" icon={<EventIcon />} color="warning">
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Typography 
                    variant="h2" 
                    sx={{ 
                      fontWeight: 800,
                      background: `linear-gradient(45deg, ${theme.palette.warning.main} 30%, ${theme.palette.warning.dark} 90%)`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      color: 'transparent',
                      mb: 1
                    }}
                  >
                    {getSafeValue(stats?.total_evenements)}
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                    Événements planifiés ce mois
                  </Typography>
                </Box>
              </MetricCard>
            </Grid>

            {/* Indicateurs de Performance */}
            <Grid item xs={12} md={6} lg={4}>
              <MetricCard title="Indicateurs de Performance" icon={<TrendingUpIcon />} color="success">
                <Box sx={{ py: 1 }}>
                  {performanceMetrics.map((metric, index) => (
                    <ProgressMetric 
                      key={index}
                      label={metric.label} 
                      value={metric.value}
                      percentage={metric.percentage}
                      color={metric.color}
                    />
                  ))}
                </Box>
              </MetricCard>
            </Grid>

            {/* Résumé de la Période */}
            <Grid item xs={12} lg={4}>
              <MetricCard title="Résumé de la Période" icon={<ScheduleIcon />} color="info">
                <Grid container spacing={2}>
                  {[
                    { label: 'Employés au total', value: getSafeValue(stats?.total_employes), color: 'primary' },
                    { label: 'Jours travaillés', value: getSafeValue(stats?.total_pointages), color: 'secondary' },
                    { label: 'Événements organisés', value: getSafeValue(stats?.total_evenements), color: 'warning' },
                    { label: 'Heures productives', value: StatisticsUtils.formatDuration(stats?.heures_travail_total), color: 'success' },
                  ].map((item, index) => (
                    <Grid item xs={6} key={index}>
                      <Box sx={{ textAlign: 'center', p: 1 }}>
                        <Typography 
                          variant="h4" 
                          sx={{ 
                            fontWeight: 700,
                            color: theme.palette[item.color].main,
                            mb: 0.5
                          }}
                        >
                          {item.value}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: 'text.secondary',
                            fontWeight: 500,
                            fontSize: '0.75rem'
                          }}
                        >
                          {item.label}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </MetricCard>
            </Grid>

            {/* Statistiques Avancées */}
            <Grid item xs={12} lg={6}>
              <MetricCard title="Statistiques Avancées" icon={<PieChartIcon />} color="secondary">
                <Grid container spacing={3}>
                  {[
                    { label: 'Taux de régularité', value: StatisticsUtils.formatPercentage(stats?.taux_regularite_global), color: 'primary' },
                    { label: 'Moyenne heures/jour', value: StatisticsUtils.formatDuration(stats?.moyenne_heures_quotidiennes), color: 'success' },
                    { label: 'Départements actifs', value: getSafeValue(stats?.departements_actifs), color: 'warning' },
                  ].map((item, index) => (
                    <Grid item xs={4} key={index}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography 
                          variant="h4" 
                          sx={{ 
                            fontWeight: 700,
                            color: theme.palette[item.color].main,
                            mb: 1
                          }}
                        >
                          {item.value}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: 'text.secondary',
                            fontWeight: 500,
                            lineHeight: 1.2
                          }}
                        >
                          {item.label}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </MetricCard>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default StatisticsOverview;