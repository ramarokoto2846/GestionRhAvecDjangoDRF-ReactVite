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
  LinearProgress,
  useTheme,
  alpha,
  Container,
  CardHeader,
  Tooltip,
  IconButton,
  Paper,
  Divider
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Schedule as ScheduleIcon,
  AccessTime as AccessTimeIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  People as PeopleIcon,
  ArrowUpward,
  ArrowDownward
} from '@mui/icons-material';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Sector,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  Legend
} from 'recharts';
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
  const [loadingPDF, setLoadingPDF] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activePieIndex, setActivePieIndex] = useState(0);

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

  // Fonction pour convertir les durées en heures
  const formatDurationToHours = (duration) => {
    if (!duration) return 0;
    
    // Si c'est déjà un nombre (secondes)
    if (typeof duration === 'number') {
      return Math.round((duration / 3600) * 10) / 10; // Arrondir à 1 décimale
    }
    
    // Si c'est une chaîne formatée "Xh YYmin"
    if (typeof duration === 'string') {
      const match = duration.match(/(\d+)h\s*(\d*)min?/);
      if (match) {
        const hours = parseInt(match[1]) || 0;
        const minutes = parseInt(match[2]) || 0;
        return hours + (minutes / 60);
      }
    }
    
    return 0;
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
      const params = { 
        periode: 'mois', 
        date: formattedDate 
      };

      console.log('🔄 Chargement des statistiques pour CIN:', selectedEmployee, params);

      const statsData = await getEmployeeStatistics(selectedEmployee, params);
      
      if (statsData) {
        console.log('📊 Données API reçues (nouveau système):', statsData);
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
      const employeeData = employees.find(emp => emp.cin === selectedEmployee);
      if (!employeeData) {
        setError('Données de l\'employé non trouvées');
        return;
      }

      await exportStatisticsPDF('employe', {
        cin: selectedEmployee,
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

  // Fonction pour obtenir la configuration du statut de régularité
  const getRegulariteConfig = (statut) => {
    if (!statut) {
      return {
        icon: <ScheduleIcon />,
        color: 'primary',
        bgColor: `${theme.palette.primary.main}15`,
        textColor: theme.palette.primary.main,
        label: 'En cours'
      };
    }
    
    switch (statut.toLowerCase()) {
      case 'parfait':
        return {
          icon: <CheckCircleIcon />,
          color: 'success',
          bgColor: `${theme.palette.success.main}15`,
          textColor: theme.palette.success.main,
          label: 'Parfait'
        };
      case 'acceptable':
        return {
          icon: <WarningIcon />,
          color: 'warning',
          bgColor: `${theme.palette.warning.main}15`,
          textColor: theme.palette.warning.main,
          label: 'Acceptable'
        };
      case 'inacceptable':
        return {
          icon: <ErrorIcon />,
          color: 'error',
          bgColor: `${theme.palette.error.main}15`,
          textColor: theme.palette.error.main,
          label: 'Inacceptable'
        };
      default:
        return {
          icon: <ScheduleIcon />,
          color: 'primary',
          bgColor: `${theme.palette.primary.main}15`,
          textColor: theme.palette.primary.main,
          label: 'Non évalué'
        };
    }
  };

  // Fonction pour obtenir la configuration du statut des heures
  const getHeuresStatusConfig = (statut) => {
    if (!statut) {
      return {
        icon: '📊',
        color: 'primary',
        bgColor: `${theme.palette.primary.main}15`,
        textColor: theme.palette.primary.main,
        label: 'Non défini'
      };
    }
    
    switch (statut.toLowerCase()) {
      case 'insuffisant':
        return {
          icon: '⚠️',
          color: 'error',
          bgColor: `${theme.palette.error.main}15`,
          textColor: theme.palette.error.main,
          label: 'Insuffisant'
        };
      case 'normal':
        return {
          icon: '✅',
          color: 'success',
          bgColor: `${theme.palette.success.main}15`,
          textColor: theme.palette.success.main,
          label: 'Normal'
        };
      case 'surplus':
        return {
          icon: '📈',
          color: 'info',
          bgColor: `${theme.palette.info.main}15`,
          textColor: theme.palette.info.main,
          label: 'Surplus'
        };
      default:
        return {
          icon: '📊',
          color: 'primary',
          bgColor: `${theme.palette.primary.main}15`,
          textColor: theme.palette.primary.main,
          label: 'Non défini'
        };
    }
  };

  // Données pour le diagramme circulaire de régularité
  const getRegulariteChartData = () => {
    if (!stats) return [];
    
    const parfait = getSafeValue(stats.ponctualite_parfaite);
    const acceptable = getSafeValue(stats.ponctualite_acceptable);
    const inacceptable = getSafeValue(stats.ponctualite_inacceptable);
    
    // Calculer les pourcentages
    const total = parfait + acceptable + inacceptable;
    const pourcentageParfait = total > 0 ? (parfait / total) * 100 : 0;
    const pourcentageAcceptable = total > 0 ? (acceptable / total) * 100 : 0;
    const pourcentageInacceptable = total > 0 ? (inacceptable / total) * 100 : 0;
    
    return [
      { 
        name: 'Parfait', 
        value: parfait,
        pourcentage: Math.round(pourcentageParfait),
        color: theme.palette.success.main
      },
      { 
        name: 'Acceptable', 
        value: acceptable,
        pourcentage: Math.round(pourcentageAcceptable),
        color: theme.palette.warning.main
      },
      { 
        name: 'Inacceptable', 
        value: inacceptable,
        pourcentage: Math.round(pourcentageInacceptable),
        color: theme.palette.error.main
      }
    ];
  };

  // Données pour l'histogramme des heures (Statistiques de Travail)
  const getHeuresHistogramData = () => {
    if (!stats) return [];
    
    // Convertir les heures totales en heures décimales
    const heuresTravaillees = formatDurationToHours(stats.heures_travail_total);
    const heuresAttendues = formatDurationToHours(stats.heures_attendues_jours_passes);
    
    // Calculer la répartition sur les 4 semaines (basé sur les jours travaillés)
    const joursTravailles = getSafeValue(stats.jours_travailles, 0);
    const moyenneHeuresParJour = joursTravailles > 0 ? heuresTravaillees / joursTravailles : 0;
    
    // Estimation réaliste : 5 jours par semaine max
    const joursParSemaine = Math.min(joursTravailles / 4, 5);
    const heuresParSemaine = moyenneHeuresParJour * joursParSemaine;
    
    return [
      { 
        semaine: 'Semaine 1', 
        'Heures Travaillées': parseFloat(heuresParSemaine.toFixed(1)),
        'Heures Attendues': parseFloat((heuresAttendues / 4).toFixed(1))
      },
      { 
        semaine: 'Semaine 2', 
        'Heures Travaillées': parseFloat(heuresParSemaine.toFixed(1)),
        'Heures Attendues': parseFloat((heuresAttendues / 4).toFixed(1))
      },
      { 
        semaine: 'Semaine 3', 
        'Heures Travaillées': parseFloat(heuresParSemaine.toFixed(1)),
        'Heures Attendues': parseFloat((heuresAttendues / 4).toFixed(1))
      },
      { 
        semaine: 'Semaine 4', 
        'Heures Travaillées': parseFloat(heuresParSemaine.toFixed(1)),
        'Heures Attendues': parseFloat((heuresAttendues / 4).toFixed(1))
      }
    ];
  };

  // Données pour le diagramme circulaire de performance
  const getPerformancePieChartData = () => {
    if (!stats) return [];
    
    const tauxPresence = getSafeValue(stats.taux_presence, 0);
    const tauxRegularite = getSafeValue(stats.taux_regularite, 0);
    
    // Calculer le score des heures (basé sur le statut)
    let scoreHeures = 80; // Valeur par défaut
    const statutHeures = stats.statut_heures?.toLowerCase();
    
    if (statutHeures === 'normal') {
      scoreHeures = 95;
    } else if (statutHeures === 'insuffisant') {
      scoreHeures = 60;
    } else if (statutHeures === 'surplus') {
      scoreHeures = 85;
    }
    
    return [
      { 
        name: 'Présence', 
        value: Math.round(tauxPresence),
        color: theme.palette.success.main
      },
      { 
        name: 'Régularité', 
        value: Math.round(tauxRegularite),
        color: theme.palette.primary.main
      },
      { 
        name: 'Heures', 
        value: scoreHeures,
        color: theme.palette.info.main
      }
    ];
  };

  const calculateRegularitePercentages = () => {
    if (!stats) return { parfait: 0, acceptable: 0, inacceptable: 0 };
    
    const parfait = getSafeValue(stats.ponctualite_parfaite);
    const acceptable = getSafeValue(stats.ponctualite_acceptable);
    const inacceptable = getSafeValue(stats.ponctualite_inacceptable);
    const total = parfait + acceptable + inacceptable;
    
    if (total === 0) return { parfait: 0, acceptable: 0, inacceptable: 0 };
    
    return {
      parfait: Math.round((parfait / total) * 100),
      acceptable: Math.round((acceptable / total) * 100),
      inacceptable: Math.round((inacceptable / total) * 100)
    };
  };

  // Fonction pour formater les détails de retard
  const formatRetardDetails = () => {
    if (!stats) return 'Aucune donnée';
    
    const retardMoyen = getSafeValue(stats.retard_moyen_minutes);
    const departAvance = getSafeValue(stats.depart_avance_moyen_minutes);
    
    const parts = [];
    if (retardMoyen > 0) parts.push(`Retard moyen: ${retardMoyen.toFixed(1)} min`);
    if (departAvance > 0) parts.push(`Départ anticipé: ${departAvance.toFixed(1)} min`);
    
    return parts.length > 0 ? parts.join(' • ') : 'Aucun retard ou départ anticipé';
  };

  // Fonction pour obtenir la description de la régularité
  const getRegulariteDescription = () => {
    if (!stats) return 'Non évaluée';
    
    const regulariteStatut = stats.regularite_statut || 'acceptable';
    const tauxParfait = calculateRegularitePercentages().parfait;
    
    switch (regulariteStatut.toLowerCase()) {
      case 'parfait':
        return `Excellent! ${tauxParfait}% des pointages sont parfaits (arrivée ≤ 8h10 et départ ≥ 15h50).`;
      case 'acceptable':
        return `Satisfaisant. ${tauxParfait}% des pointages sont parfaits. La majorité des pointages sont dans les marges acceptables.`;
      case 'inacceptable':
        return `À améliorer. Seulement ${tauxParfait}% des pointages sont parfaits. Trop de retards ou départs anticipés.`;
      default:
        return 'Non évaluée';
    }
  };

  // Composant personnalisé pour le graphique circulaire actif
  const renderActiveShape = (props) => {
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
      <g>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} fontWeight="bold">
          {payload.name}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333" fontWeight="bold">
          {`${payload.name}`}
        </text>
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
          {`${value} ${payload.name === 'Parfait' || payload.name === 'Acceptable' || payload.name === 'Inacceptable' ? 'jours' : '%'} (${(percent * 100).toFixed(0)}%)`}
        </text>
      </g>
    );
  };

  const selectedEmployeeData = employees.find(emp => emp.cin === selectedEmployee);

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
                  Statistiques Employé
                </Typography>
                <Typography variant="h6" sx={{ color: 'text.secondary', mb: 3 }}>
                  Analyse des performances d'un Employé - Nouveau système de ponctualité
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
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Employé</InputLabel>
                    <Select
                      value={selectedEmployee}
                      label="Employé"
                      onChange={(e) => setSelectedEmployee(e.target.value)}
                      sx={{ borderRadius: 2 }}
                    >
                      {employees.map((emp) => (
                        <MenuItem key={emp.cin} value={emp.cin}>
                          {emp.nom} {emp.prenom} ({emp.titre === 'employe' ? `Mat: ${emp.matricule}` : `Stag - ${emp.cin}`})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

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

                <Grid item xs={12} sm={6} md={2}>
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
                    {loadingPDF ? 'Génération...' : 'PDF'}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Status Alert */}
          {selectedEmployee && stats && selectedEmployeeData && (
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
              <> • Employé : <strong>{selectedEmployeeData.nom} {selectedEmployeeData.prenom}</strong> ({selectedEmployeeData.titre === 'employe' ? `Mat: ${selectedEmployeeData.matricule}` : `Stag - CIN: ${selectedEmployeeData.cin}`})</>
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

          {/* AFFICHAGE DES STATISTIQUES - NOUVEAU SYSTÈME */}
          {stats && selectedEmployeeData && (
            <Grid container spacing={3}>
              
              {/* SECTION 1: RÉGULARITÉ GLOBALE AVEC GRAPHIQUE CIRCULAIRE */}
              <Grid item xs={12} md={6} lg={4}>
                <Card
                  sx={{
                    height: '100%',
                    background: `linear-gradient(145deg, ${theme.palette.background.paper}, ${alpha(theme.palette.primary.light, 0.05)})`,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    borderRadius: 4,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 48px rgba(0,0,0,0.12)'
                    }
                  }}
                >
                  <CardHeader
                    title={
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CheckCircleIcon sx={{ mr: 1.5, color: theme.palette.success.main }} />
                          <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                            Régularité Globale
                          </Typography>
                        </Box>
                        <Chip
                          label={getRegulariteConfig(stats.regularite_statut).label}
                          color={getRegulariteConfig(stats.regularite_statut).color}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>
                    }
                    sx={{ 
                      pb: 2,
                      borderBottom: `1px solid ${theme.palette.divider}`
                    }}
                  />
                  <CardContent>
                    <Grid container spacing={2}>
                      {/* Graphique circulaire principal */}
                      <Grid item xs={12}>
                        <Box sx={{ height: 200, position: 'relative' }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                activeIndex={activePieIndex}
                                activeShape={renderActiveShape}
                                data={getRegulariteChartData()}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={70}
                                paddingAngle={2}
                                dataKey="value"
                                onMouseEnter={(_, index) => setActivePieIndex(index)}
                              >
                                {getRegulariteChartData().map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                          
                          {/* Indicateur central */}
                          <Box
                            sx={{
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)',
                              textAlign: 'center'
                            }}
                          >
                            <Typography variant="h2" sx={{ 
                              fontWeight: 800,
                              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                              backgroundClip: 'text',
                              WebkitBackgroundClip: 'text',
                              color: 'transparent',
                              lineHeight: 1
                            }}>
                              {getSafeValue(stats.taux_regularite)}%
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              Taux de régularité
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>

                      {/* Légende du graphique */}
                      <Grid item xs={12}>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
                            RÉPARTITION DES POINTAGES
                          </Typography>
                          {getRegulariteChartData().map((item, index) => (
                            <Box 
                              key={index} 
                              sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mb: 1,
                                p: 1,
                                borderRadius: 1,
                                bgcolor: alpha(item.color, 0.05),
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  bgcolor: alpha(item.color, 0.1),
                                  transform: 'translateX(4px)'
                                }
                              }}
                              onMouseEnter={() => setActivePieIndex(index)}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Box sx={{ 
                                  width: 12, 
                                  height: 12, 
                                  borderRadius: '50%', 
                                  bgcolor: item.color,
                                  mr: 1.5 
                                }} />
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {item.name}
                                </Typography>
                              </Box>
                              <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                  {item.value} jours
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  {item.pourcentage}%
                                </Typography>
                              </Box>
                            </Box>
                          ))}
                        </Box>

                        {/* Statistiques de retard */}
                        <Paper 
                          variant="outlined" 
                          sx={{ 
                            p: 2, 
                            borderRadius: 2,
                            background: `linear-gradient(135deg, ${alpha(theme.palette.info.light, 0.05)}, transparent)`
                          }}
                        >
                          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
                            TEMPS MOYEN
                          </Typography>
                          <Grid container spacing={1}>
                            <Grid item xs={6}>
                              <Box sx={{ textAlign: 'center' }}>
                                <Box sx={{ 
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: 36,
                                  height: 36,
                                  borderRadius: '50%',
                                  bgcolor: getSafeValue(stats.retard_moyen_minutes) > 10 ? 
                                           alpha(theme.palette.error.main, 0.1) : 
                                           alpha(theme.palette.success.main, 0.1),
                                  mb: 1
                                }}>
                                  <AccessTimeIcon sx={{ 
                                    fontSize: 20,
                                    color: getSafeValue(stats.retard_moyen_minutes) > 10 ? 
                                           theme.palette.error.main : 
                                           theme.palette.success.main
                                  }} />
                                </Box>
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                  {getSafeValue(stats.retard_moyen_minutes, 0)} min
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  Retard moyen
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Box sx={{ textAlign: 'center' }}>
                                <Box sx={{ 
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: 36,
                                  height: 36,
                                  borderRadius: '50%',
                                  bgcolor: getSafeValue(stats.depart_avance_moyen_minutes) > 10 ? 
                                           alpha(theme.palette.error.main, 0.1) : 
                                           alpha(theme.palette.success.main, 0.1),
                                  mb: 1
                                }}>
                                  <ScheduleIcon sx={{ 
                                    fontSize: 20,
                                    color: getSafeValue(stats.depart_avance_moyen_minutes) > 10 ? 
                                           theme.palette.error.main : 
                                           theme.palette.success.main
                                  }} />
                                </Box>
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                  {getSafeValue(stats.depart_avance_moyen_minutes, 0)} min
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  Départ anticipé
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>
                        </Paper>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* SECTION 2: STATISTIQUES DE TRAVAIL AVEC HISTOGRAMME */}
              <Grid item xs={12} md={6} lg={4}>
                <Card
                  sx={{
                    height: '100%',
                    background: `linear-gradient(145deg, ${theme.palette.background.paper}, ${alpha(theme.palette.info.light, 0.05)})`,
                    border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                    borderRadius: 4,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 48px rgba(0,0,0,0.12)'
                    }
                  }}
                >
                  <CardHeader
                    title={
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <TrendingUpIcon sx={{ mr: 1.5, color: theme.palette.info.main }} />
                          <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                            Statistiques de Travail
                          </Typography>
                        </Box>
                        <Chip
                          icon={<span>{getHeuresStatusConfig(stats.statut_heures).icon}</span>}
                          label={getHeuresStatusConfig(stats.statut_heures).label}
                          color={getHeuresStatusConfig(stats.statut_heures).color}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>
                    }
                    sx={{ 
                      pb: 2,
                      borderBottom: `1px solid ${theme.palette.divider}`
                    }}
                  />
                  <CardContent>
                    <Grid container spacing={2}>
                      {/* Histogramme des heures travaillées */}
                      <Grid item xs={12}>
                        <Box sx={{ height: 180, mb: 2 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={getHeuresHistogramData()}>
                              <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                              <XAxis 
                                dataKey="semaine" 
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: theme.palette.text.secondary }}
                              />
                              <YAxis 
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: theme.palette.text.secondary }}
                                label={{ 
                                  value: 'Heures', 
                                  angle: -90, 
                                  position: 'insideLeft',
                                  style: { fill: theme.palette.text.secondary }
                                }}
                              />
                              <RechartsTooltip
                                contentStyle={{ 
                                  borderRadius: 8,
                                  border: `1px solid ${theme.palette.divider}`,
                                  background: theme.palette.background.paper
                                }}
                                formatter={(value, name) => [`${value}h`, name]}
                              />
                              <Legend />
                              <Bar 
                                dataKey="Heures Travaillées" 
                                fill={theme.palette.primary.main}
                                radius={[4, 4, 0, 0]}
                                animationDuration={1500}
                              />
                              <Bar 
                                dataKey="Heures Attendues" 
                                fill={theme.palette.info.main}
                                radius={[4, 4, 0, 0]}
                                animationDuration={1500}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </Box>
                      </Grid>

                      {/* Statistiques détaillées */}
                      <Grid item xs={12}>
                        <Grid container spacing={1}>
                          <Grid item xs={6}>
                            <Paper
                              sx={{
                                p: 2,
                                height: '100%',
                                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)}, transparent)`,
                                borderRadius: 2,
                                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                              }}
                            >
                              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                Heures totales
                              </Typography>
                              <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                {stats.heures_travail_total_str || StatisticsUtils.formatDuration(stats.heures_travail_total) || "0h"}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                {getSafeValue(stats.pourcentage_ecart) >= 0 ? (
                                  <>
                                    <ArrowUpward sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
                                    <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>
                                      +{getSafeValue(stats.pourcentage_ecart, 0)}%
                                    </Typography>
                                  </>
                                ) : (
                                  <>
                                    <ArrowDownward sx={{ fontSize: 16, color: 'error.main', mr: 0.5 }} />
                                    <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 600 }}>
                                      {getSafeValue(stats.pourcentage_ecart, 0)}%
                                    </Typography>
                                  </>
                                )}
                              </Box>
                            </Paper>
                          </Grid>
                          
                          <Grid item xs={6}>
                            <Paper
                              sx={{
                                p: 2,
                                height: '100%',
                                background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.05)}, transparent)`,
                                borderRadius: 2,
                                border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`
                              }}
                            >
                              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                                Jours travaillés
                              </Typography>
                              <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main' }}>
                                {getSafeValue(stats.jours_travailles)} jours
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                Moyenne/jour: {stats.moyenne_heures_quotidiennes_str || "0h"}
                              </Typography>
                            </Paper>
                          </Grid>

                          <Grid item xs={12}>
                            <Paper
                              sx={{
                                p: 2,
                                mt: 1,
                                background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.05)}, transparent)`,
                                borderRadius: 2,
                                border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`
                              }}
                            >
                              <Grid container spacing={2}>
                                <Grid item xs={6}>
                                  <Box sx={{ textAlign: 'center' }}>
                                    <Box sx={{ 
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      width: 40,
                                      height: 40,
                                      borderRadius: '50%',
                                      bgcolor: alpha(theme.palette.success.main, 0.1),
                                      mb: 1
                                    }}>
                                      <CheckCircleIcon sx={{ color: theme.palette.success.main }} />
                                    </Box>
                                    <Typography variant="h4" sx={{ fontWeight: 800, color: 'success.main' }}>
                                      {getSafeValue(stats.taux_presence)}%
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                      Présence
                                    </Typography>
                                  </Box>
                                </Grid>
                                <Grid item xs={6}>
                                  <Box sx={{ textAlign: 'center' }}>
                                    <Box sx={{ 
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      width: 40,
                                      height: 40,
                                      borderRadius: '50%',
                                      bgcolor: getSafeValue(stats.taux_absence) > 10 ? 
                                               alpha(theme.palette.error.main, 0.1) : 
                                               alpha(theme.palette.warning.main, 0.1),
                                      mb: 1
                                    }}>
                                      <WarningIcon sx={{ 
                                        color: getSafeValue(stats.taux_absence) > 10 ? 
                                               theme.palette.error.main : 
                                               theme.palette.warning.main
                                      }} />
                                    </Box>
                                    <Typography variant="h4" sx={{ 
                                      fontWeight: 800, 
                                      color: getSafeValue(stats.taux_absence) > 10 ? 
                                             'error.main' : 
                                             getSafeValue(stats.taux_absence) > 5 ? 
                                             'warning.main' : 'text.secondary'
                                    }}>
                                      {getSafeValue(stats.taux_absence)}%
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                      Absence
                                    </Typography>
                                  </Box>
                                </Grid>
                              </Grid>
                              {stats.jours_absents > 0 && (
                                <Alert 
                                  severity="warning" 
                                  icon={<WarningIcon />}
                                  sx={{ 
                                    mt: 2, 
                                    borderRadius: 1,
                                    bgcolor: alpha(theme.palette.warning.main, 0.05)
                                  }}
                                >
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    ⚠️ {stats.jours_absents} jour(s) d'absence cette période
                                  </Typography>
                                </Alert>
                              )}
                            </Paper>
                          </Grid>
                        </Grid>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* SECTION 3: ANALYSE DE PERFORMANCE AVEC DIAGRAMME CIRCULAIRE */}
              <Grid item xs={12} md={6} lg={4}>
                <Card
                  sx={{
                    height: '100%',
                    background: `linear-gradient(145deg, ${theme.palette.background.paper}, ${alpha(theme.palette.secondary.light, 0.05)})`,
                    border: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}`,
                    borderRadius: 4,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 48px rgba(0,0,0,0.12)'
                    }
                  }}
                >
                  <CardHeader
                    title={
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <AccessTimeIcon sx={{ mr: 1.5, color: theme.palette.secondary.main }} />
                          <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                            Analyse de Performance
                          </Typography>
                        </Box>
                        <Chip
                          label="PERFORMANCE"
                          color="secondary"
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>
                    }
                    sx={{ 
                      pb: 2,
                      borderBottom: `1px solid ${theme.palette.divider}`
                    }}
                  />
                  <CardContent>
                    {/* Diagramme circulaire des performances */}
                    <Box sx={{ height: 250, position: 'relative', mb: 2 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            activeIndex={activePieIndex}
                            activeShape={renderActiveShape}
                            data={getPerformancePieChartData()}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                            onMouseEnter={(_, index) => setActivePieIndex(index)}
                          >
                            {getPerformancePieChartData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip
                            formatter={(value) => [`${value}%`, 'Score']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      
                      {/* Indicateur central */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          textAlign: 'center'
                        }}
                      >
                        <Typography variant="h4" sx={{ 
                          fontWeight: 800,
                          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                          backgroundClip: 'text',
                          WebkitBackgroundClip: 'text',
                          color: 'transparent',
                          lineHeight: 1
                        }}>
                          {Math.round(
                            (getSafeValue(stats.taux_presence, 0) + 
                             getSafeValue(stats.taux_regularite, 0) + 
                             (stats.statut_heures?.toLowerCase() === 'normal' ? 95 : 
                              stats.statut_heures?.toLowerCase() === 'insuffisant' ? 60 : 
                              stats.statut_heures?.toLowerCase() === 'surplus' ? 85 : 80)) / 3
                          )}%
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          Score Global
                        </Typography>
                      </Box>
                    </Box>

                    {/* Légende du graphique de performance */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
                        INDICATEURS DE PERFORMANCE
                      </Typography>
                      {getPerformancePieChartData().map((item, index) => (
                        <Box 
                          key={index} 
                          sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 1,
                            p: 1,
                            borderRadius: 1,
                            bgcolor: alpha(item.color, 0.05),
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              bgcolor: alpha(item.color, 0.1),
                              transform: 'translateX(4px)'
                            }
                          }}
                          onMouseEnter={() => setActivePieIndex(index)}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ 
                              width: 12, 
                              height: 12, 
                              borderRadius: '50%', 
                              bgcolor: item.color,
                              mr: 1.5 
                            }} />
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {item.name}
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {item.value}%
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>

                    {/* Évaluation détaillée */}
                    <Paper
                      sx={{
                        p: 2,
                        mb: 2,
                        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.05)}, transparent)`,
                        borderRadius: 2,
                        border: `1px solid ${alpha(theme.palette.divider, 0.5)}`
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: 'text.primary' }}>
                        ÉVALUATION DE LA PERFORMANCE
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        color: 'text.secondary',
                        lineHeight: 1.6,
                        fontStyle: 'italic'
                      }}>
                        {getRegulariteDescription()}
                      </Typography>
                    </Paper>

                    {/* Observation détaillée */}
                    <Paper
                      sx={{
                        p: 2,
                        background: `linear-gradient(135deg, ${alpha(theme.palette.info.light, 0.05)}, transparent)`,
                        borderRadius: 2,
                        border: `1px solid ${alpha(theme.palette.divider, 0.5)}`
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: 'text.primary' }}>
                        OBSERVATION DÉTAILLÉE
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        color: 'text.secondary',
                        lineHeight: 1.6
                      }}>
                        {stats.observation_heures || 'Aucune observation disponible pour cette période.'}
                      </Typography>
                    </Paper>
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
              <PeopleIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
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