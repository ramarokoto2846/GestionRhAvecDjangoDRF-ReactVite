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
  Container
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Download as DownloadIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  BeachAccess as BeachAccessIcon,
  EventBusy as EventBusyIcon,
  TrendingUp as TrendingUpIcon
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
      loadStats();
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

  const loadStats = async () => {
    if (!selectedEmployee) {
      setStats(null);
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setStats(null);
      
      const formattedDate = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
      const params = { periode: 'mois', date: formattedDate };
      
      const data = await getEmployeeStatistics(selectedEmployee, params);
      setStats(data);
    } catch (err) {
      console.error('Erreur chargement stats:', err);
      setError(err.message || 'Erreur lors du chargement des statistiques');
      setStats(null);
    } finally {
      setLoading(false);
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

  // Composant MetricCard uniforme pour toutes les sections
  const MetricCard = ({ title, icon, children, color = 'primary' }) => (
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

  // Composant de ligne de métrique uniforme
  const MetricRow = ({ label, value, color = 'primary', icon }) => (
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
      </TableCell>
    </TableRow>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: theme.palette.background.default }}>
      <Header user={currentUser} onMenuToggle={() => {}} />
      
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 3,
          mt: 8 // Margin top to account for header height
        }}
      >
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
              Statistiques par Employé
            </Typography>
            <Typography variant="h6" sx={{ color: 'text.secondary', mb: 3 }}>
              Analyse détaillée des performances et activités d'un employé.
            </Typography>
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
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    placeholder="Rechercher un employé..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                      endAdornment: searchTerm && (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setSearchTerm("")} size="small">
                            <CloseIcon />
                          </IconButton>
                        </InputAdornment>
                      ),
                      sx: { borderRadius: 2 }
                    }}
                    sx={{ mb: { xs: 2, md: 0 } }}
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
              📊 Période analysée : <strong>{months.find(m => m.value === selectedMonth)?.label} {selectedYear}</strong>
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

          {/* Statistics Grid */}
          {stats && selectedEmployeeData && (
            <Grid container spacing={3}>
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
                          icon="⏱️"
                        />
                        <MetricRow 
                          label="Jours travaillés" 
                          value={stats.jours_travailles}
                          color="success"
                          icon="📅"
                        />
                        <MetricRow 
                          label="Moyenne quotidienne" 
                          value={StatisticsUtils.formatDuration(stats.moyenne_heures_quotidiennes)}
                          color="info"
                          icon="📊"
                        />
                        <MetricRow 
                          label="Pointages réguliers" 
                          value={stats.pointages_reguliers}
                          color="success"
                          icon="✅"
                        />
                        <MetricRow 
                          label="Pointages irréguliers" 
                          value={stats.pointages_irreguliers}
                          color="warning"
                          icon="⚠️"
                        />
                      </TableBody>
                    </Table>
                  </TableContainer>
                </MetricCard>
              </Grid>

              {/* Congés - Trois cartes distinctes */}
              <Grid item xs={12} lg={4}>
                <MetricCard title="Congés Validés" icon={<BeachAccessIcon />} color="success">
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="h1" sx={{ 
                      fontWeight: 700,
                      color: theme.palette.success.main,
                      mb: 2,
                      fontSize: '4rem'
                    }}>
                      {stats.conges_valides}
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      color: 'text.secondary',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1
                    }}>
                      <span>✅</span>
                      Demandes approuvées
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: 'text.secondary',
                      mt: 1,
                      opacity: 0.7
                    }}>
                      Congés validés pour cette période
                    </Typography>
                  </Box>
                </MetricCard>
              </Grid>

              <Grid item xs={12} lg={4}>
                <MetricCard title="Congés Refusés" icon={<EventBusyIcon />} color="error">
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="h1" sx={{ 
                      fontWeight: 700,
                      color: theme.palette.error.main,
                      mb: 2,
                      fontSize: '4rem'
                    }}>
                      {stats.conges_refuses}
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      color: 'text.secondary',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1
                    }}>
                      <span>❌</span>
                      Demandes refusées
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: 'text.secondary',
                      mt: 1,
                      opacity: 0.7
                    }}>
                      Congés non approuvés pour cette période
                    </Typography>
                  </Box>
                </MetricCard>
              </Grid>

              <Grid item xs={12} lg={4}>
                <MetricCard title="Congés en Attente" icon={<ScheduleIcon />} color="warning">
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="h1" sx={{ 
                      fontWeight: 700,
                      color: theme.palette.warning.main,
                      mb: 2,
                      fontSize: '4rem'
                    }}>
                      {stats.conges_en_attente}
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      color: 'text.secondary',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1
                    }}>
                      <span>⏳</span>
                      En attente de validation
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: 'text.secondary',
                      mt: 1,
                      opacity: 0.7
                    }}>
                      Demandes en cours de traitement
                    </Typography>
                  </Box>
                </MetricCard>
              </Grid>

              {/* Section supplémentaire pour d'autres métriques si disponibles */}
              {stats.taux_regularite && (
                <Grid item xs={12} lg={4}>
                  <MetricCard title="Régularité" icon={<ScheduleIcon />} color="info">
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="h1" sx={{ 
                        fontWeight: 700,
                        color: theme.palette.info.main,
                        mb: 2,
                        fontSize: '4rem'
                      }}>
                        {StatisticsUtils.formatPercentage(stats.taux_regularite)}
                      </Typography>
                      <Typography variant="h6" sx={{ 
                        color: 'text.secondary',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1
                      }}>
                        <span>📈</span>
                        Taux de régularité
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        color: 'text.secondary',
                        mt: 1,
                        opacity: 0.7
                      }}>
                        Ponctualité globale
                      </Typography>
                    </Box>
                  </MetricCard>
                </Grid>
              )}
            </Grid>
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