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
  Paper,
  Container,
  LinearProgress,
  CardHeader,
  Tooltip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Download as DownloadIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  Timeline as TimelineIcon,
  CompareArrows as CompareArrowsIcon,
  Refresh as RefreshIcon,
  BarChart as BarChartIcon
} from '@mui/icons-material';
import {
  getEmployeeStatistics,
  getEmployes,
  exportStatisticsPDF,
  StatisticsUtils,
  getCurrentUser,
  isSuperuser,
  getPonctualiteAnalysis,
  getHeuresComparison,
  getMonthlyTrends
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
  const [currentUser, setCurrentUser] = useState(null);
  const [isSuperuserState, setIsSuperuserState] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingPDF, setLoadingPDF] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [ponctualiteAnalysis, setPonctualiteAnalysis] = useState(null);
  const [heuresComparison, setHeuresComparison] = useState(null);
  const [monthlyTrends, setMonthlyTrends] = useState(null);
  const [apiErrors, setApiErrors] = useState({
    ponctualite: false,
    comparaison: false,
    tendances: false
  });

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
    
    // Si c'est une string, essayer de la convertir en nombre
    if (typeof value === 'string') {
      const numValue = parseFloat(value);
      return isNaN(numValue) ? defaultValue : numValue;
    }
    
    return value;
  };

  // Fonction pour calculer le taux de présence (éviter NaN)
  const calculateTauxPresence = (statsData) => {
    if (!statsData || !statsData.jours_travailles || !statsData.jours_passes_mois || statsData.jours_passes_mois === 0) {
      return 0;
    }
    return Math.round((statsData.jours_travailles / statsData.jours_passes_mois) * 100);
  };

  // Fonction pour calculer le score global
  const calculateScoreGlobal = (statsData) => {
    if (!statsData) return 0;
    
    const regularite = getSafeValue(statsData.taux_regularite, 0);
    const ponctualite = getSafeValue(statsData.taux_ponctualite, 0);
    
    // Score basé sur le statut des heures
    let scoreStatut = 70; // défaut
    switch (statsData?.statut_heures) {
      case 'NORMAL':
        scoreStatut = 100;
        break;
      case 'SURPLUS':
        scoreStatut = 90;
        break;
      case 'INSUFFISANT':
        scoreStatut = 60;
        break;
      default:
        scoreStatut = 70;
    }
    
    return Math.round((regularite + ponctualite + scoreStatut) / 3);
  };

  // Fonction pour générer les recommandations
  const getRecommandations = (statsData) => {
    const recommandations = [];
    
    if (!statsData) {
      return (
        <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
          Aucune donnée disponible pour les recommandations.
        </Typography>
      );
    }

    const statutHeures = statsData.statut_heures;
    const tauxPonctualite = getSafeValue(statsData.taux_ponctualite, 0);
    const tauxRegularite = getSafeValue(statsData.taux_regularite, 0);
    const tauxPresence = calculateTauxPresence(statsData);

    // Recommandations basées sur le statut des heures
    if (statutHeures === 'INSUFFISANT') {
      recommandations.push(
        <Typography key="heures" variant="body2" sx={{ color: 'warning.main', fontStyle: 'italic', mb: 1 }}>
          ⚠️ Augmenter le temps de travail pour atteindre les objectifs mensuels.
        </Typography>
      );
    }

    // Recommandations basées sur la ponctualité
    if (tauxPonctualite < 80) {
      recommandations.push(
        <Typography key="ponctualite" variant="body2" sx={{ color: 'warning.main', fontStyle: 'italic', mb: 1 }}>
          ⚠️ Améliorer la ponctualité pour respecter les horaires établis.
        </Typography>
      );
    }

    // Recommandations basées sur la régularité
    if (tauxRegularite < 80) {
      recommandations.push(
        <Typography key="regularite" variant="body2" sx={{ color: 'warning.main', fontStyle: 'italic', mb: 1 }}>
          ⚠️ Travailler sur la régularité des heures d'arrivée.
        </Typography>
      );
    }

    // Recommandations basées sur la présence
    if (tauxPresence < 80) {
      recommandations.push(
        <Typography key="presence" variant="body2" sx={{ color: 'warning.main', fontStyle: 'italic', mb: 1 }}>
          ⚠️ Améliorer le taux de présence.
        </Typography>
      );
    }

    // Message positif si tout va bien
    if (recommandations.length === 0) {
      recommandations.push(
        <Typography key="excellent" variant="body2" sx={{ color: 'success.main', fontStyle: 'italic' }}>
          ✅ Excellentes performances ! Maintenir ce niveau d'engagement.
        </Typography>
      );
    }

    return <>{recommandations}</>;
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

  useEffect(() => {
    if (selectedEmployee) {
      loadAllStats();
    } else {
      setStats(null);
      setPonctualiteAnalysis(null);
      setHeuresComparison(null);
      setMonthlyTrends(null);
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

  const loadAllStats = async (isRefresh = false) => {
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
      setApiErrors({ ponctualite: false, comparaison: false, tendances: false });

      const formattedDate = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
      const params = { periode: 'mois', date: formattedDate };

      // Charger les statistiques principales
      const statsData = await getEmployeeStatistics(selectedEmployee, params);
      setStats(statsData);

      // Charger les analyses avancées avec gestion d'erreur
      try {
        const ponctualiteData = await getPonctualiteAnalysis(selectedEmployee, params);
        setPonctualiteAnalysis(ponctualiteData);
      } catch (err) {
        console.log('Endpoint ponctualité non disponible');
        setApiErrors(prev => ({ ...prev, ponctualite: true }));
      }

      try {
        const comparisonData = await getHeuresComparison(selectedEmployee, params);
        setHeuresComparison(comparisonData);
      } catch (err) {
        console.log('Endpoint comparaison non disponible');
        setApiErrors(prev => ({ ...prev, comparaison: true }));
      }

      try {
        const trendsData = await getMonthlyTrends(selectedEmployee, params);
        setMonthlyTrends(trendsData);
      } catch (err) {
        console.log('Endpoint tendances non disponible');
        setApiErrors(prev => ({ ...prev, tendances: true }));
      }

    } catch (err) {
      console.error('Erreur chargement stats:', err);
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
    loadAllStats(true);
  };

  // Fonction pour obtenir l'icône et la couleur selon le statut
  const getStatusConfig = (statut) => {
    const defaultConfig = {
      icon: <ScheduleIcon />,
      color: 'primary',
      bgColor: `${theme.palette.primary.main}15`,
      textColor: theme.palette.primary.main
    };

    if (!statut) return defaultConfig;

    switch (statut) {
      case 'INSUFFISANT':
        return {
          icon: <WarningIcon />,
          color: 'warning',
          bgColor: `${theme.palette.warning.main}15`,
          textColor: theme.palette.warning.main
        };
      case 'NORMAL':
        return {
          icon: <CheckCircleIcon />,
          color: 'success',
          bgColor: `${theme.palette.success.main}15`,
          textColor: theme.palette.success.main
        };
      case 'SURPLUS':
        return {
          icon: <TrendingUpIcon />,
          color: 'info',
          bgColor: `${theme.palette.info.main}15`,
          textColor: theme.palette.info.main
        };
      default:
        return defaultConfig;
    }
  };

  // Fonction pour obtenir la couleur du taux de ponctualité
  const getPonctualiteColor = (taux) => {
    const safeTaux = getSafeValue(taux, 0);
    if (safeTaux >= 90) return 'success';
    if (safeTaux >= 70) return 'warning';
    return 'error';
  };

  // Générer des données de démonstration pour les sections non implémentées
  const getDemoPonctualiteData = () => {
    const tauxPonctualite = getSafeValue(stats?.taux_ponctualite, 0);
    return {
      taux_matin: Math.max(0, tauxPonctualite * 0.95),
      taux_soir: Math.max(0, tauxPonctualite * 1.05)
    };
  };

  const getDemoComparisonData = () => ({
    mois_precedents: [
      { mois: 'Oct 2025', taux_remplissage: 85 },
      { mois: 'Sep 2025', taux_remplissage: 92 },
      { mois: 'Aoû 2025', taux_remplissage: 78 }
    ]
  });

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

  // Composant MetricCard uniforme
  const MetricCard = ({ title, icon, children, color = 'primary', action }) => (
    <Card
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${theme.palette.background.paper}, ${alpha(theme.palette[color].light, 0.05)})`,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
          {action}
        </Box>
        {children}
      </CardContent>
    </Card>
  );

  // Composant de ligne de métrique uniforme
  const MetricRow = ({ label, value, color = 'primary', icon, progress }) => (
    <TableRow>
      <TableCell sx={{ border: 'none', py: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {icon && (
            <Box sx={{ color: theme.palette[color].main }}>
              {icon}
            </Box>
          )}
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {label}
          </Typography>
        </Box>
      </TableCell>
      <TableCell sx={{ border: 'none', py: 1.5 }} align="right">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
          {progress && (
            <Box sx={{ width: '60px', mr: 1 }}>
              <LinearProgress 
                variant="determinate" 
                value={progress} 
                color={color}
                sx={{ height: 6, borderRadius: 3 }}
              />
            </Box>
          )}
          <Chip
            label={value}
            size="small"
            sx={{
              backgroundColor: `${theme.palette[color].main}15`,
              color: theme.palette[color].main,
              fontWeight: 600,
              minWidth: '80px'
            }}
          />
        </Box>
      </TableCell>
    </TableRow>
  );

  // Composant pour afficher une barre de progression
  const ProgressBar = ({ value, color = 'primary', label }) => (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {label}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette[color].main }}>
          {getSafeValue(value, 0)}%
        </Typography>
      </Box>
      <LinearProgress 
        variant="determinate" 
        value={getSafeValue(value, 0)} 
        color={color}
        sx={{ height: 8, borderRadius: 4 }}
      />
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: theme.palette.background.default }}>
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

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8
        }}
      >
        <Container maxWidth="xl">
          {/* Header Section */}
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
                  Statistiques par Employé
                </Typography>
                <Typography variant="h6" sx={{ color: 'text.secondary', mb: 3 }}>
                  Analyse détaillée des performances, ponctualité et tendances d'un employé.
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

          {/* Avertissement API manquants */}
          {(apiErrors.ponctualite || apiErrors.comparaison || apiErrors.tendances) && (
            <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
              <Typography variant="body2">
                Certaines fonctionnalités avancées utilisent des données de démonstration.
              </Typography>
            </Alert>
          )}

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
                {/* Barre de recherche */}
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    placeholder="Rechercher un employé..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: searchTerm && (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setSearchTerm('')}>
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{ borderRadius: 2 }}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={2}>
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

                <Grid item xs={12} sm={6} md={2}>
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

                <Grid item xs={12} sm={6} md={2}>
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

          {/* Observation des heures */}
          {stats && stats.observation_heures && (
            <Alert
              severity={stats.statut_heures === 'INSUFFISANT' ? 'warning' : 
                       stats.statut_heures === 'SURPLUS' ? 'info' : 'success'}
              icon={getStatusConfig(stats.statut_heures).icon}
              sx={{
                mb: 3,
                borderRadius: 2,
                background: getStatusConfig(stats.statut_heures).bgColor,
                border: `1px solid ${getStatusConfig(stats.statut_heures).textColor}30`,
                color: 'text.primary'
              }}
            >
              <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                Analyse des heures travaillées - {stats.statut_heures || 'NON_DEFINI'}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {stats.observation_heures}
              </Typography>
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

          {/* Statistics Grid */}
          {stats && selectedEmployeeData && (
            <>
              {/* Première ligne : Informations de base */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                {/* Informations Employé */}
                <Grid item xs={12} lg={4}>
                  <MetricCard title="Informations Employé" icon={<PersonIcon />} color="primary">
                    <TableContainer>
                      <Table size="small">
                        <TableBody>
                          <MetricRow
                            label="Nom complet"
                            value={`${selectedEmployeeData.nom} ${selectedEmployeeData.prenom}`}
                            color="primary"
                          />
                          <MetricRow
                            label="Matricule"
                            value={selectedEmployeeData.matricule}
                            color="primary"
                          />
                          <MetricRow
                            label="Département"
                            value={selectedEmployeeData.departement?.nom || 'Non assigné'}
                            color="primary"
                          />
                          <MetricRow
                            label="Poste"
                            value={selectedEmployeeData.poste}
                            color="primary"
                          />
                          <MetricRow
                            label="Email"
                            value={selectedEmployeeData.email || 'Non renseigné'}
                            color="primary"
                          />
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </MetricCard>
                </Grid>

                {/* Pointages */}
                <Grid item xs={12} lg={4}>
                  <MetricCard title="Pointages" icon={<ScheduleIcon />} color="info">
                    <TableContainer>
                      <Table size="small">
                        <TableBody>
                          <MetricRow
                            label="Heures totales"
                            value={StatisticsUtils.formatDuration(stats.heures_travail_total)}
                            color="primary"
                          />
                          <MetricRow
                            label="Jours travaillés"
                            value={getSafeValue(stats.jours_travailles)}
                            color="success"
                          />
                          <MetricRow
                            label="Moyenne quotidienne"
                            value={StatisticsUtils.formatDuration(stats.moyenne_heures_quotidiennes)}
                            color="info"
                          />
                          <MetricRow
                            label="Pointages réguliers"
                            value={getSafeValue(stats.pointages_reguliers)}
                            color="success"
                          />
                          <MetricRow
                            label="Pointages irréguliers"
                            value={getSafeValue(stats.pointages_irreguliers)}
                            color="warning"
                          />
                          {stats.jours_passes_mois && (
                            <MetricRow
                              label="Jours passés dans le mois"
                              value={getSafeValue(stats.jours_passes_mois)}
                              color="info"
                            />
                          )}
                          {stats.heures_attendues_jours_passes && (
                            <MetricRow
                              label="Heures attendues"
                              value={StatisticsUtils.formatDuration(stats.heures_attendues_jours_passes)}
                              color="primary"
                            />
                          )}
                          {stats.ecart_heures && (
                            <MetricRow
                              label="Écart"
                              value={StatisticsUtils.formatDuration(stats.ecart_heures)}
                              color={stats.statut_heures === 'INSUFFISANT' ? 'warning' : 
                                     stats.statut_heures === 'SURPLUS' ? 'info' : 'success'}
                            />
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </MetricCard>
                </Grid>

                {/* Analyse Performance */}
                <Grid item xs={12} lg={4}>
                  <MetricCard 
                    title="Analyse Performance" 
                    icon={<TrendingUpIcon />} 
                    color={stats.statut_heures === 'INSUFFISANT' ? 'warning' : 
                           stats.statut_heures === 'SURPLUS' ? 'info' : 'success'}
                  >
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      {/* Statut des heures */}
                      <Box sx={{ mb: 3 }}>
                        <Chip
                          icon={getStatusConfig(stats.statut_heures).icon}
                          label={stats.statut_heures || 'NON_DEFINI'}
                          color={getStatusConfig(stats.statut_heures).color}
                          sx={{
                            fontSize: '1rem',
                            py: 2,
                            px: 2,
                            mb: 2
                          }}
                        />
                        {stats.pourcentage_ecart && (
                          <Typography variant="h6" sx={{ 
                            color: getStatusConfig(stats.statut_heures).textColor,
                            fontWeight: 600
                          }}>
                            {stats.pourcentage_ecart > 0 ? '+' : ''}{getSafeValue(stats.pourcentage_ecart)}%
                          </Typography>
                        )}
                      </Box>

                      {/* Taux de régularité */}
                      {stats.taux_regularite && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="h4" sx={{
                            fontWeight: 700,
                            color: theme.palette.success.main,
                            mb: 1
                          }}>
                            {getSafeValue(stats.taux_regularite)}%
                          </Typography>
                          <Typography variant="body2" sx={{
                            color: 'text.secondary',
                            opacity: 0.7
                          }}>
                            Taux de régularité
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </MetricCard>
                </Grid>
              </Grid>

              {/* Deuxième ligne : Ponctualité et Analyses Avancées */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                {/* Ponctualité */}
                <Grid item xs={12} lg={6}>
                  <MetricCard 
                    title="Analyse de Ponctualité" 
                    icon={<AccessTimeIcon />} 
                    color="info"
                    action={apiErrors.ponctualite && (
                      <Chip label="Démo" size="small" color="info" variant="outlined" />
                    )}
                  >
                    <Box sx={{ p: 2 }}>
                      <Box sx={{ textAlign: 'center', mb: 3 }}>
                        <AccessTimeIcon 
                          sx={{ 
                            fontSize: 48, 
                            color: theme.palette.info.main,
                            mb: 1 
                          }} 
                        />
                        <Typography variant="h3" sx={{
                          fontWeight: 700,
                          color: theme.palette.info.main,
                          mb: 1
                        }}>
                          {getSafeValue(stats?.taux_ponctualite, 0)}%
                        </Typography>
                        <Typography variant="body1" sx={{
                          color: 'text.secondary',
                          mb: 1
                        }}>
                          Taux de ponctualité
                        </Typography>
                        <Typography variant="caption" sx={{
                          color: 'text.secondary',
                          opacity: 0.6,
                          fontStyle: 'italic'
                        }}>
                          Entrée 8h / Sortie 16h
                        </Typography>
                      </Box>

                      <Grid container spacing={2} sx={{ mt: 2 }}>
                        <Grid item xs={6}>
                          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 2 }}>
                            <Typography variant="h4" sx={{ color: 'success.dark', fontWeight: 700 }}>
                              {getSafeValue(stats?.pointages_ponctuels, 0)}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'success.dark' }}>
                              Jours ponctuels
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.light', borderRadius: 2 }}>
                            <Typography variant="h4" sx={{ color: 'warning.dark', fontWeight: 700 }}>
                              {getSafeValue(stats?.pointages_non_ponctuels, 0)}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'warning.dark' }}>
                              Jours non ponctuels
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>

                      {/* Détails de ponctualité */}
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 2 }}>
                          Détails de ponctualité :
                        </Typography>
                        {apiErrors.ponctualite && (
                          <Alert severity="info" sx={{ mb: 2 }}>
                            Données de démonstration
                          </Alert>
                        )}
                        <ProgressBar 
                          value={ponctualiteAnalysis?.taux_matin || getDemoPonctualiteData().taux_matin} 
                          color={getPonctualiteColor(ponctualiteAnalysis?.taux_matin || getDemoPonctualiteData().taux_matin)} 
                          label="Ponctualité matin"
                        />
                        <ProgressBar 
                          value={ponctualiteAnalysis?.taux_soir || getDemoPonctualiteData().taux_soir} 
                          color={getPonctualiteColor(ponctualiteAnalysis?.taux_soir || getDemoPonctualiteData().taux_soir)} 
                          label="Ponctualité soir"
                        />
                      </Box>
                    </Box>
                  </MetricCard>
                </Grid>

                {/* Comparaison des Heures */}
                <Grid item xs={12} lg={6}>
                  <MetricCard 
                    title="Comparaison des Heures" 
                    icon={<CompareArrowsIcon />} 
                    color="primary"
                    action={apiErrors.comparaison && (
                      <Chip label="Démo" size="small" color="info" variant="outlined" />
                    )}
                  >
                    <Box sx={{ p: 2 }}>
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" sx={{ mb: 2, color: 'text.primary' }}>
                          Heures travaillées vs attendues
                        </Typography>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            Heures réelles :
                          </Typography>
                          <Chip 
                            label={StatisticsUtils.formatDuration(stats.heures_travail_total)}
                            color="primary"
                            variant="outlined"
                          />
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            Heures attendues :
                          </Typography>
                          <Chip 
                            label={StatisticsUtils.formatDuration(stats.heures_attendues_jours_passes)}
                            color="info"
                            variant="outlined"
                          />
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            Écart :
                          </Typography>
                          <Chip 
                            label={StatisticsUtils.formatDuration(stats.ecart_heures)}
                            color={stats.statut_heures === 'INSUFFISANT' ? 'error' : 'success'}
                          />
                        </Box>
                      </Box>

                      {/* Évolution mensuelle */}
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 2 }}>
                          Évolution mensuelle :
                        </Typography>
                        {apiErrors.comparaison && (
                          <Alert severity="info" sx={{ mb: 2 }}>
                            Données de démonstration
                          </Alert>
                        )}
                        {(heuresComparison?.mois_precedents || getDemoComparisonData().mois_precedents).map((mois, index) => (
                          <ProgressBar 
                            key={index}
                            value={mois.taux_remplissage || 0}
                            color={mois.taux_remplissage >= 100 ? 'success' : mois.taux_remplissage >= 80 ? 'warning' : 'error'}
                            label={`${mois.mois} - ${mois.taux_remplissage}%`}
                          />
                        ))}
                      </Box>
                    </Box>
                  </MetricCard>
                </Grid>
              </Grid>

              {/* Troisième ligne : Tendances et Résumé */}
              <Grid container spacing={3}>
                {/* Tendances Mensuelles */}
                <Grid item xs={12} lg={8}>
                  <MetricCard 
                    title="Tendances et Performances" 
                    icon={<TimelineIcon />} 
                    color="secondary"
                    action={apiErrors.tendances && (
                      <Chip label="Démo" size="small" color="info" variant="outlined" />
                    )}
                  >
                    <Box sx={{ p: 2 }}>
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="h6" sx={{ mb: 2, color: 'text.primary' }}>
                            Résumé des Performances
                          </Typography>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="body2">Régularité globale :</Typography>
                            <Chip 
                              label={`${getSafeValue(stats.taux_regularite, 0)}%`}
                              color={StatisticsUtils.getRateColor(getSafeValue(stats.taux_regularite, 0))}
                              size="small"
                            />
                          </Box>

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="body2">Ponctualité :</Typography>
                            <Chip 
                              label={`${getSafeValue(stats.taux_ponctualite, 0)}%`}
                              color={getPonctualiteColor(getSafeValue(stats.taux_ponctualite, 0))}
                              size="small"
                            />
                          </Box>

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="body2">Statut heures :</Typography>
                            <Chip 
                              label={stats.statut_heures || 'NON_DEFINI'}
                              color={StatisticsUtils.getHeuresStatusColor(stats.statut_heures || 'NON_DEFINI')}
                              size="small"
                            />
                          </Box>

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2">Taux présence :</Typography>
                            <Chip 
                              label={`${calculateTauxPresence(stats)}%`}
                              color={StatisticsUtils.getRateColor(calculateTauxPresence(stats))}
                              size="small"
                            />
                          </Box>
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <Typography variant="h6" sx={{ mb: 2, color: 'text.primary' }}>
                            Recommandations
                          </Typography>
                          
                          <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                            {getRecommandations(stats)}
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>
                  </MetricCard>
                </Grid>

                {/* Score Global */}
                <Grid item xs={12} lg={4}>
                  <MetricCard title="Score Global" icon={<BarChartIcon />} color="success">
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="h1" sx={{
                        fontWeight: 700,
                        background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.info.main})`,
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        color: 'transparent',
                        mb: 2
                      }}>
                        {calculateScoreGlobal(stats)}%
                      </Typography>
                      <Typography variant="h6" sx={{
                        color: 'text.secondary',
                        mb: 1
                      }}>
                        Performance Globale
                      </Typography>
                      <Typography variant="body2" sx={{
                        color: 'text.secondary',
                        opacity: 0.7
                      }}>
                        Basé sur régularité, ponctualité et heures
                      </Typography>
                    </Box>
                  </MetricCard>
                </Grid>
              </Grid>
            </>
          )}

          {/* Empty States */}
          {!selectedEmployee && !loading && (
            <Paper
              sx={{
                textAlign: 'center',
                py: 8,
                borderRadius: 3,
                background: `linear-gradient(135deg, ${theme.palette.background.paper}, ${alpha(theme.palette.primary.light, 0.05)})`
              }}
            >
              <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
                Aucun employé sélectionné
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', opacity: 0.7 }}>
                Veuillez sélectionner un employé pour afficher ses statistiques détaillées
              </Typography>
            </Paper>
          )}

          {selectedEmployee && !stats && !loading && (
            <Paper
              sx={{
                textAlign: 'center',
                py: 8,
                borderRadius: 3,
                background: `linear-gradient(135deg, ${theme.palette.background.paper}, ${alpha(theme.palette.warning.light, 0.05)})`
              }}
            >
              <TrendingUpIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
                Aucune donnée disponible
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', opacity: 0.7 }}>
                Aucune statistique n'est disponible pour cet employé sur la période sélectionnée
              </Typography>
            </Paper>
          )}
        </Container>
      </Box>
    </Box>
  );
};

export default EmployeeStatistics;