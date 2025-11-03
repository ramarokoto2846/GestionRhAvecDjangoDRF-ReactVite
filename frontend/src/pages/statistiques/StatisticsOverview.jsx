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
  useTheme
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  People as PeopleIcon,
  Apartment as ApartmentIcon,
  AccessTime as AccessTimeIcon,
  TrendingUp as TrendingUpIcon,
  Download as DownloadIcon,
  Event as EventIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { getGlobalStatistics, exportStatisticsPDF, StatisticsUtils, getCurrentUser, isSuperuser } from '../../services/api';
import Header from '../../components/Header';

const StatisticsOverview = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [isSuperuserState, setIsSuperuserState] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loadingPDF, setLoadingPDF] = useState(false);

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

  const loadStats = async () => {
    try {
      setLoading(true);
      setError('');
      const formattedDate = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
      const data = await getGlobalStatistics({ mois: formattedDate });
      setStats(data);
    } catch (err) {
      console.error('Erreur chargement stats globales:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setLoadingPDF(true);
      const formattedDate = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
      await exportStatisticsPDF('global', { mois: formattedDate });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingPDF(false);
    }
  };

  const StatCard = ({ title, value, subtitle, icon, color = 'primary', gradient = false }) => (
    <Card 
      sx={{ 
        height: '100%',
        background: gradient 
          ? `linear-gradient(135deg, ${theme.palette[color].main}, ${theme.palette[color].dark})`
          : `linear-gradient(135deg, ${theme.palette.background.paper}, ${alpha(theme.palette[color].light, 0.05)})`,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 3,
        boxShadow: gradient ? '0 8px 32px rgba(0,0,0,0.12)' : '0 4px 20px rgba(0,0,0,0.08)',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: gradient ? '0 12px 40px rgba(0,0,0,0.15)' : '0 8px 30px rgba(0,0,0,0.12)'
        }
      }}
    >
      <CardContent sx={{ p: 3, color: gradient ? 'white' : 'inherit' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 600,
              opacity: gradient ? 0.9 : 0.8
            }}
          >
            {title}
          </Typography>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              backgroundColor: gradient ? 'rgba(255,255,255,0.2)' : `${theme.palette[color].main}15`,
              color: gradient ? 'white' : theme.palette[color].main
            }}
          >
            {icon}
          </Box>
        </Box>
        <Typography 
          variant="h3" 
          sx={{ 
            fontWeight: 700,
            mb: 1,
            background: gradient ? 'none' : `linear-gradient(135deg, ${theme.palette[color].main}, ${theme.palette[color].dark})`,
            backgroundClip: gradient ? 'none' : 'text',
            WebkitBackgroundClip: gradient ? 'none' : 'text',
            color: gradient ? 'white' : 'transparent'
          }}
        >
          {value}
        </Typography>
        {subtitle && (
          <Typography 
            variant="body2" 
            sx={{ 
              opacity: gradient ? 0.8 : 0.7,
              fontWeight: 500
            }}
          >
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  const MetricCard = ({ title, icon, children, color = 'primary' }) => (
    <Card 
      sx={{ 
        height: '100%',
        background: `linear-gradient(135deg, ${theme.palette.background.paper}, ${alpha(theme.palette[color].light, 0.03)})`,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              backgroundColor: `${theme.palette[color].main}15`,
              color: theme.palette[color].main,
              mr: 2
            }}
          >
            {icon}
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {title}
          </Typography>
        </Box>
        {children}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: theme.palette.background.default }}>
        <Header user={currentUser} onMenuToggle={() => {}} />
        <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
          <Container maxWidth="xl">
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <CircularProgress size={60} sx={{ mb: 2, color: theme.palette.primary.main }} />
              <Typography variant="h6" sx={{ color: 'text.secondary' }}>
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
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: theme.palette.background.default }}>
        <Header user={currentUser} onMenuToggle={() => {}} />
        <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
          <Container maxWidth="xl">
            <Alert severity="error" sx={{ borderRadius: 2, mb: 3 }}>
              {error}
            </Alert>
          </Container>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: theme.palette.background.default }}>
      <Header user={currentUser} onMenuToggle={() => {}} />
      
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        <Container maxWidth="xl">
          {/* Header Section */}
          <Box sx={{ mb: 4 }}>
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
              Tableau de Bord Global
            </Typography>
            <Typography variant="h6" sx={{ color: 'text.secondary', mb: 3 }}>
              Vue d'ensemble des indicateurs clés de performance de l'entreprise
            </Typography>
          </Box>

          {/* Filters Section */}
          <Card 
            sx={{ 
              mb: 4,
              background: `linear-gradient(135deg, ${theme.palette.background.paper}, ${alpha(theme.palette.primary.light, 0.03)})`,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
            }}
          >
            <CardContent sx={{ p: 3 }}>
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
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      textAlign: 'center',
                      color: 'text.primary',
                      fontWeight: 600
                    }}
                  >
                    {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={loadingPDF ? <CircularProgress size={20} /> : <DownloadIcon />}
                    onClick={handleExportPDF}
                    disabled={loadingPDF}
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

          {/* Main Statistics Grid */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Effectif Total"
                value={stats?.total_employes || 0}
                subtitle={`${stats?.employes_actifs || 0} employés actifs`}
                icon={<PeopleIcon />}
                color="primary"
                gradient={true}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Départements"
                value={stats?.total_departements || 0}
                subtitle="Unités opérationnelles"
                icon={<ApartmentIcon />}
                color="info"
                gradient={true}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Taux d'Activité"
                value={StatisticsUtils.formatPercentage(stats?.taux_activite_global)}
                subtitle="Performance globale"
                icon={<TrendingUpIcon />}
                color="success"
                gradient={true}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Pointages"
                value={stats?.total_pointages || 0}
                subtitle="Enregistrements ce mois"
                icon={<AccessTimeIcon />}
                color="warning"
                gradient={true}
              />
            </Grid>
          </Grid>

          {/* Detailed Metrics Grid */}
          <Grid container spacing={3}>
            {/* Événements */}
            <Grid item xs={12} md={6} lg={4}>
              <MetricCard title="Événements & Activités" icon={<EventIcon />} color="info">
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h2" sx={{ fontWeight: 700, color: 'info.main', mb: 2 }}>
                    {stats?.total_evenements || 0}
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    Événements planifiés ce mois
                  </Typography>
                </Box>
              </MetricCard>
            </Grid>

            {/* Performance Indicators */}
            <Grid item xs={12} lg={4}>
              <MetricCard title="Indicateurs de Performance" icon={<TrendingUpIcon />} color="primary">
                <Grid container spacing={3}>
                  {[
                    { label: 'Heures travaillées', value: StatisticsUtils.formatDuration(stats?.heures_travail_total), color: 'primary' },
                    { label: 'Taux de présence', value: StatisticsUtils.formatPercentage(stats?.taux_presence), color: 'success' },
                    { label: 'Pointages réguliers', value: stats?.pointages_reguliers || 0, color: 'warning' },
                  ].map((item, index) => (
                    <Grid item xs={4} key={index}>
                      <Box sx={{ textAlign: 'center', p: 2 }}>
                        <Typography variant="h4" sx={{ 
                          fontWeight: 700,
                          color: theme.palette[item.color].main,
                          mb: 1
                        }}>
                          {item.value}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                          {item.label}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </MetricCard>
            </Grid>

            {/* Résumé de Période */}
            <Grid item xs={12} lg={6}>
              <MetricCard title="Résumé de la Période" icon={<ScheduleIcon />} color="secondary">
                <Grid container spacing={3}>
                  {[
                    { label: 'Employés au total', value: stats?.total_employes || 0, icon: 'Personnes' },
                    { label: 'Jours travaillés', value: stats?.total_pointages || 0, icon: 'Calendrier' },
                    { label: 'Événements organisés', value: stats?.total_evenements || 0, icon: 'Cible' },
                    { label: 'Heures productives', value: StatisticsUtils.formatDuration(stats?.heures_travail_total), icon: 'Horloge' },
                  ].map((item, index) => (
                    <Grid item xs={6} key={index}>
                      <Box sx={{ textAlign: 'center', p: 2 }}>
                        <Typography variant="h3" sx={{ 
                          fontWeight: 700,
                          color: 'primary.main',
                          mb: 1
                        }}>
                          {item.value}
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          color: 'text.secondary',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 0.5,
                          fontWeight: 500
                        }}>
                          <span>{item.icon}</span>
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
              <MetricCard title="Statistiques Avancées" icon={<TrendingUpIcon />} color="info">
                <Grid container spacing={3}>
                  {[
                    { label: 'Taux de régularité', value: StatisticsUtils.formatPercentage(stats?.taux_regularite_global), icon: 'Graphique' },
                    { label: 'Moyenne heures/jour', value: StatisticsUtils.formatDuration(stats?.moyenne_heures_quotidiennes), icon: 'Horloge' },
                    { label: 'Départements actifs', value: stats?.departements_actifs || 0, icon: 'Bâtiment' },
                  ].map((item, index) => (
                    <Grid item xs={4} key={index}>
                      <Box sx={{ textAlign: 'center', p: 2 }}>
                        <Typography variant="h4" sx={{ 
                          fontWeight: 700,
                          color: 'info.main',
                          mb: 1
                        }}>
                          {item.value}
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          color: 'text.secondary',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 0.5,
                          fontWeight: 500
                        }}>
                          <span>{item.icon}</span>
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