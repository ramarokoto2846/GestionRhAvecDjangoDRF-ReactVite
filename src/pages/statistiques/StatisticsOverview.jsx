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
  CardHeader,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  People as PeopleIcon,
  AccessTime as AccessTimeIcon,
  TrendingUp as TrendingUpIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  BarChart as BarChartIcon,
  Dashboard as DashboardIcon
} from '@mui/icons-material';
import { getGlobalStatistics, exportStatisticsPDF, StatisticsUtils, getCurrentUser } from '../../services/api';
import Header from '../../components/Header';

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
      console.log('🔄 Chargement stats globales:', formattedDate);
      
      const data = await getGlobalStatistics({ mois: formattedDate });
      console.log('📊 Stats globales reçues:', data);
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
        nom_fichier: `statistiques_globales_${formattedDate}`
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

  // Métriques regroupées pour les 3 cartes principales
  const mainMetrics = [
    {
      title: "RESSOURCES HUMAINES",
      icon: <PeopleIcon />,
      color: "primary",
      items: [
        { label: "Effectif Total", value: getSafeValue(stats?.total_employes), color: "primary" },
        { label: "Employés Actifs", value: getSafeValue(stats?.employes_actifs), color: "success" },
        { label: "Départements", value: getSafeValue(stats?.total_departements), color: "secondary" },
        { label: "Unités Opérationnelles", value: getSafeValue(stats?.departements_actifs), color: "info" }
      ]
    },
    {
      title: "PERFORMANCE GLOBALE",
      icon: <TrendingUpIcon />,
      color: "success",
      items: [
        { label: "Taux d'Activité", value: StatisticsUtils.formatPercentage(getSafeValue(stats?.taux_activite_global)), color: "success" },
        { label: "Taux de Régularité", value: StatisticsUtils.formatPercentage(getSafeValue(stats?.taux_regularite_global)), color: "primary" },
        { label: "Heures Travaillées", value: stats?.heures_travail_total_str || StatisticsUtils.formatDuration(stats?.heures_travail_total), color: "info" },
        { label: "Moyenne Quotidienne", value: stats?.moyenne_heures_quotidiennes_str || StatisticsUtils.formatDuration(stats?.moyenne_heures_quotidiennes), color: "secondary" }
      ]
    },
    {
      title: "ACTIVITÉS & POINTAGES",
      icon: <AccessTimeIcon />,
      color: "info",
      items: [
        { label: "Pointages Totaux", value: getSafeValue(stats?.total_pointages), color: "info" },
        { label: "Pointages Réguliers", value: getSafeValue(stats?.pointages_reguliers), color: "success" },
        { label: "Événements", value: getSafeValue(stats?.total_evenements || 0), color: "warning" },
        { label: "Taux Ponctualité", value: StatisticsUtils.formatPercentage(getSafeValue(stats?.taux_ponctualite_global)), color: "primary" }
      ]
    }
  ];

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

  return (
    <Box sx={{ background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.background.paper} 100%)` }}>
      <Header user={currentUser} onMenuToggle={() => {}} />
      
      <Box component="main" sx={{ flexGrow: 1, mt: 8, p: 3 }}>
        <Container maxWidth="xl">
          {/* Header */}
          <Box sx={{ mb: 4 }}>
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
                  Tableau de Bord Global
                </Typography>
                <Typography variant="h6" sx={{ color: 'text.secondary', mb: 3 }}>
                  Vue d'ensemble des performances de la société 
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

          {/* Filtres */}
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
                {/* CORRECTION : Supprimer width={405} */}
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

                {/* CORRECTION : Supprimer width={405} */}
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
                      icon={<BarChartIcon />}
                      label={`${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`}
                      color="primary"
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                </Grid>

                {/* CORRECTION : Supprimer width={405} */}
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={loadingPDF ? <CircularProgress size={20} /> : <DownloadIcon />}
                    onClick={handleExportPDF}
                    disabled={loadingPDF || !stats}
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

          {error && (
            <Alert
              severity="error"
              onClose={() => setError('')}
              sx={{ mb: 3, borderRadius: 2 }}
            >
              {error}
            </Alert>
          )}

          {!stats && !loading && (
            <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
              Aucune donnée disponible pour {months.find(m => m.value === selectedMonth)?.label} {selectedYear}.
            </Alert>
          )}

          {/* ✅ 3 CARTES PRINCIPALES CORRIGÉES */}
          {stats && (
            <Grid container spacing={3}>
              {mainMetrics.map((category, index) => (
                // CORRECTION : Supprimer width, height, textAlign, display, justifyContent
                <Grid item xs={12} md={4} key={index}>
                  <Card
                    sx={{
                      height: '100%',
                      minHeight: 300,
                      background: `linear-gradient(135deg, ${theme.palette[category.color].main}15, ${theme.palette.background.paper})`,
                      border: `2px solid ${theme.palette[category.color].main}30`,
                      borderRadius: 3,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: `0 8px 30px ${alpha(theme.palette[category.color].main, 0.15)}`
                      }
                    }}
                  >
                    <CardHeader
                      title={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box
                            sx={{
                              p: 1,
                              borderRadius: 2,
                              background: `linear-gradient(135deg, ${theme.palette[category.color].main}, ${theme.palette[category.color].dark})`,
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              mr: 2
                            }}
                          >
                            {category.icon}
                          </Box>
                          <Typography variant="h5" sx={{ fontWeight: 600 }}>
                            {category.title}
                          </Typography>
                        </Box>
                      }
                      sx={{ pb: 1 }}
                    />
                    <CardContent>
                      <TableContainer>
                        <Table size="small">
                          <TableBody>
                            {category.items.map((item, itemIndex) => (
                              <TableRow key={itemIndex}>
                                <TableCell sx={{ border: 'none', py: 1.5 }}>
                                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    {item.label}
                                  </Typography>
                                </TableCell>
                                <TableCell sx={{ border: 'none', py: 1.5 }} align="right">
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      fontWeight: 600, 
                                      color: theme.palette[item.color].main 
                                    }}
                                  >
                                    {item.value || 0}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {/* Indicateurs de Performance Additionnels */}
          {stats && (
            <Grid container spacing={3} sx={{ mt: 2 }}>
              {/* CORRECTION : Supprimer width={1500} */}
              <Grid item xs={12}>
                <Card
                  sx={{
                    background: `linear-gradient(135deg, ${theme.palette.success.main}15, ${theme.palette.background.paper})`,
                    border: `2px solid ${theme.palette.success.main}30`,
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                  }}
                >
                  <CardHeader
                    title={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <DashboardIcon sx={{ mr: 2, color: 'success.main' }} />
                        <Typography variant="h5" sx={{ fontWeight: 600 }}>
                          SYNTHÈSE MENSILELLE
                        </Typography>
                      </Box>
                    }
                    sx={{ pb: 1 }}
                  />
                  <CardContent>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', lineHeight: 1.6 }}>
                      {getSafeValue(stats.total_employes)} employés ont généré {stats?.heures_travail_total_str || '0h'} 
                      de travail sur {getSafeValue(stats.total_pointages)} jours cette période, 
                      avec un taux d'activité global de {StatisticsUtils.formatPercentage(getSafeValue(stats.taux_activite_global))}.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </Container>
      </Box>
    </Box>
  );
};

export default StatisticsOverview;