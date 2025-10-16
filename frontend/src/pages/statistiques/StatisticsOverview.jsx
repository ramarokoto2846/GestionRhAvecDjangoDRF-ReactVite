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
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  People as PeopleIcon,
  Apartment as ApartmentIcon,
  AccessTime as AccessTimeIcon,
  BeachAccess as BeachAccessIcon,
  Block as BlockIcon,
  TrendingUp as TrendingUpIcon,
  Download as DownloadIcon,
  Event as EventIcon
} from '@mui/icons-material';
import { getGlobalStatistics, exportStatisticsPDF, StatisticsUtils, getCurrentUser, isSuperuser } from '../../services/api';
import Header, { triggerNotificationsRefresh } from '../../components/Header';
import Sidebar from '../../components/Sidebar';

const StatisticsOverview = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [isSuperuserState, setIsSuperuserState] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

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

        // Charger les statistiques
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
      
      // Formater la date au format YYYY-MM (ex: "2025-10")
      const formattedDate = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
      
      console.log('🔍 Chargement stats globales:', {
        mois: formattedDate
      });
      
      const data = await getGlobalStatistics({ mois: formattedDate });
      setStats(data);
    } catch (err) {
      console.error('❌ Erreur chargement stats globales:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      const formattedDate = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
      await exportStatisticsPDF('global', {
        mois: formattedDate
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const StatCard = ({ title, value, subtitle, icon, color = 'primary', trend }) => (
    <Card sx={{ 
      height: '100%', 
      transition: 'transform 0.2s', 
      borderRadius: 3,
      boxShadow: 2,
      '&:hover': { transform: 'translateY(-4px)' } 
    }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography color="textSecondary" variant="h6" sx={{ fontSize: '0.9rem', fontWeight: 600 }}>
            {title}
          </Typography>
          <Box color={`${color}.main`} sx={{ opacity: 0.8 }}>
            {icon}
          </Box>
        </Box>
        <Typography variant="h4" component="div" color={`${color}.main`} fontWeight="bold" gutterBottom>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.8rem' }}>
            {subtitle}
          </Typography>
        )}
        {trend && (
          <Box display="flex" alignItems="center" mt={1}>
            <TrendingUpIcon sx={{ fontSize: 16, color: trend > 0 ? 'success.main' : 'error.main', mr: 0.5 }} />
            <Typography variant="caption" color={trend > 0 ? 'success.main' : 'error.main'}>
              {trend > 0 ? '+' : ''}{trend}%
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ display: "flex" }}>
        <Header
          user={currentUser}
          onMenuToggle={() => setOpen(!open)}
        />
        <Sidebar open={open} setOpen={setOpen} />
        <Box component="main" sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '400px',
          mt: 8,
          ml: { md: open ? `240px` : 0 },
        }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: "flex" }}>
        <Header
          user={currentUser}
          onMenuToggle={() => setOpen(!open)}
        />
        <Sidebar open={open} setOpen={setOpen} />
        <Box component="main" sx={{ 
          flexGrow: 1, 
          mt: 8,
          ml: { md: open ? `240px` : 0 },
        }}>
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        </Box>
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
              Tableau de Bord Statistiques
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Vue d'ensemble des indicateurs clés de performance
            </Typography>
          </Box>
        </Box>

        {/* Filtres période */}
        <Card sx={{ mb: 4, borderRadius: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
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

              <Grid item xs={12} md={3}>
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

              <Grid item xs={12} md={4}>
                <Typography variant="body1" color="text.secondary">
                  Période: {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
                </Typography>
              </Grid>

              <Grid item xs={12} md={2}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={handleExportPDF}
                  size="large"
                >
                  Exporter PDF
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Grid container spacing={3}>
          {/* Indicateurs Principaux */}
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Effectif Total"
              value={stats?.total_employes || 0}
              subtitle={`${stats?.employes_actifs || 0} actifs`}
              icon={<PeopleIcon />}
              color="primary"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Départements"
              value={stats?.total_departements || 0}
              subtitle="Services actifs"
              icon={<ApartmentIcon />}
              color="secondary"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Taux d'Activité"
              value={`${stats?.taux_activite_global || 0}%`}
              subtitle="Employés actifs"
              icon={<TrendingUpIcon />}
              color="success"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Pointages"
              value={stats?.total_pointages || 0}
              subtitle="Ce mois"
              icon={<AccessTimeIcon />}
              color="info"
            />
          </Grid>

          {/* Section Congés */}
          <Grid item xs={12} md={4}>
            <Card sx={{ 
              height: '100%', 
              borderRadius: 3,
              boxShadow: 3,
              background: 'linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)'
            }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={3}>
                  <BeachAccessIcon color="warning" sx={{ mr: 2, fontSize: 32 }} />
                  <Box>
                    <Typography variant="h6" fontWeight="bold">Congés</Typography>
                    <Typography variant="body2" color="textSecondary">Gestion des demandes</Typography>
                  </Box>
                </Box>
                
                <Grid container spacing={2} textAlign="center">
                  <Grid item xs={4}>
                    <Box>
                      <Typography variant="h5" color="success.main" fontWeight="bold">
                        {stats?.conges_valides || 0}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Validés
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box>
                      <Typography variant="h5" color="error.main" fontWeight="bold">
                        {stats?.conges_refuses || 0}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Refusés
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box>
                      <Typography variant="h5" color="primary.main" fontWeight="bold">
                        {StatisticsUtils.formatPercentage(stats?.taux_validation_conges)}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Taux
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Section Absences */}
          <Grid item xs={12} md={4}>
            <Card sx={{ 
              height: '100%', 
              borderRadius: 3,
              boxShadow: 3,
              background: 'linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%)'
            }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={3}>
                  <BlockIcon color="error" sx={{ mr: 2, fontSize: 32 }} />
                  <Box>
                    <Typography variant="h6" fontWeight="bold">Absences</Typography>
                    <Typography variant="body2" color="textSecondary">Suivi des présences</Typography>
                  </Box>
                </Box>
                
                <Grid container spacing={2} textAlign="center">
                  <Grid item xs={6}>
                    <Box>
                      <Typography variant="h5" fontWeight="bold">
                        {stats?.total_absences || 0}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Total
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box>
                      <Typography variant="h5" color="warning.main" fontWeight="bold">
                        {StatisticsUtils.formatPercentage(stats?.taux_absence_global)}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Taux
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {stats?.absences_justifiees || 0} justifiées
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Section Événements */}
          <Grid item xs={12} md={4}>
            <Card sx={{ 
              height: '100%', 
              borderRadius: 3,
              boxShadow: 3,
              background: 'linear-gradient(135deg, #E8F5E8 0%, #C8E6C9 100%)'
            }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={3}>
                  <EventIcon color="success" sx={{ mr: 2, fontSize: 32 }} />
                  <Box>
                    <Typography variant="h6" fontWeight="bold">Événements</Typography>
                    <Typography variant="body2" color="textSecondary">Activités du mois</Typography>
                  </Box>
                </Box>
                
                <Box textAlign="center" py={2}>
                  <Typography variant="h2" color="success.main" fontWeight="bold">
                    {stats?.total_evenements || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    événements planifiés
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Métriques de Performance */}
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="bold" color="primary">
                  📈 Indicateurs de Performance - {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center" p={2}>
                      <Typography variant="h4" color="info.main" fontWeight="bold">
                        {StatisticsUtils.formatDuration(stats?.heures_travail_total)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Heures travaillées
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center" p={2}>
                      <Typography variant="h4" color="primary.main" fontWeight="bold">
                        {StatisticsUtils.formatPercentage(stats?.taux_presence)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Taux de présence
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center" p={2}>
                      <Typography variant="h4" color="success.main" fontWeight="bold">
                        {stats?.total_conges || 0}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Demandes de congé
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center" p={2}>
                      <Typography variant="h4" color="warning.main" fontWeight="bold">
                        {stats?.absences_justifiees || 0}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Absences justifiées
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Résumé de la période */}
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 3, boxShadow: 2, bgcolor: 'primary.light' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="bold" color="white">
                  Résumé de la Période
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Box textAlign="center" p={2}>
                      <Typography variant="h3" color="white" fontWeight="bold">
                        {stats?.total_employes || 0}
                      </Typography>
                      <Typography variant="body1" color="white">
                        Employés au total
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box textAlign="center" p={2}>
                      <Typography variant="h3" color="white" fontWeight="bold">
                        {stats?.total_pointages || 0}
                      </Typography>
                      <Typography variant="body1" color="white">
                        Jours travaillés
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box textAlign="center" p={2}>
                      <Typography variant="h3" color="white" fontWeight="bold">
                        {stats?.total_evenements || 0}
                      </Typography>
                      <Typography variant="body1" color="white">
                        Événements organisés
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default StatisticsOverview;