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
  CircularProgress,
  Alert,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  useTheme,
  Tabs,
  Tab
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  TrendingUp as TrendingUpIcon,
  BeachAccess as BeachAccessIcon,
  AccessTime as AccessTimeIcon,
  Block as BlockIcon,
  BarChart as BarChartIcon
} from '@mui/icons-material';
import { getDetailedStatistics, getEmployes, getDepartements, getCurrentUser, isSuperuser } from '../../services/api';
import Header, { triggerNotificationsRefresh } from '../../components/Header';
import Sidebar from '../../components/Sidebar';

const StatisticsAnalysis = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isSuperuserState, setIsSuperuserState] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [analysisType, setAnalysisType] = useState('conges');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const analysisTypes = [
    { value: 'conges', label: 'Congés', icon: <BeachAccessIcon /> },
    { value: 'pointages', label: 'Pointages', icon: <AccessTimeIcon /> },
    { value: 'absences', label: 'Absences', icon: <BlockIcon /> }
  ];

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
        const superuser = await isSuperuser();
        setIsSuperuserState(superuser);
        await loadInitialData();
      } catch (err) {
        console.error("Erreur:", err);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        setCurrentUser(null);
        navigate("/");
      }
    };

    fetchUserAndData();
  }, [navigate]);

  const loadInitialData = async () => {
    try {
      const [empsData, deptsData] = await Promise.all([
        getEmployes(),
        getDepartements()
      ]);
      setEmployees(empsData);
      setDepartments(deptsData);
    } catch (err) {
      setError(err.message);
    }
  };

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      setError('');
      
      const formattedDate = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
      const params = {
        type: analysisType,
        mois: formattedDate
      };

      if (selectedEmployee) params.employe = selectedEmployee;
      if (selectedDepartment) params.departement = selectedDepartment;

      const data = await getDetailedStatistics(params);
      setStats(data);
    } catch (err) {
      setError(err.message);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (emp.nom || "").toLowerCase().includes(searchLower) ||
      (emp.prenom || "").toLowerCase().includes(searchLower) ||
      (emp.matricule || "").includes(searchTerm)
    );
  });

  const renderCongesAnalysis = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="warning">
              📊 Répartition des Congés
            </Typography>
            <Grid container spacing={2} textAlign="center">
              <Grid item xs={4}>
                <Box>
                  <Typography variant="h4" color="success.main">
                    {stats?.valides || 0}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Validés
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box>
                  <Typography variant="h4" color="error.main">
                    {stats?.refuses || 0}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Refusés
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box>
                  <Typography variant="h4" color="info.main">
                    {stats?.en_attente || 0}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    En attente
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              📈 Statistiques Avancées
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell>Moyenne jours/congé</TableCell>
                    <TableCell>
                      <Chip label={`${stats?.moyenne_jours || 0} jours`} color="info" />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Total jours validés</TableCell>
                    <TableCell>
                      <Chip label={stats?.total_jours_valides || 0} color="success" />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Taux d'approbation</TableCell>
                    <TableCell>
                      <Chip 
                        label={`${((stats?.valides || 0) / (stats?.total || 1) * 100).toFixed(1)}%`} 
                        color="primary" 
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderPointagesAnalysis = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="info">
              ⏰ Analyse des Pointages
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell>Total pointages</TableCell>
                    <TableCell>
                      <Chip label={stats?.total || 0} color="primary" />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Heures totales</TableCell>
                    <TableCell>
                      <Chip label={stats?.heures_total || '0h 00min'} color="info" />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Moyenne quotidienne</TableCell>
                    <TableCell>
                      <Chip label={stats?.moyenne_quotidienne || '0h 00min'} color="secondary" />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="success">
              ✅ Régularité
            </Typography>
            <Grid container spacing={2} textAlign="center">
              <Grid item xs={6}>
                <Box>
                  <Typography variant="h4" color="success.main">
                    {stats?.pointages_reguliers || 0}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Réguliers
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box>
                  <Typography variant="h4" color="warning.main">
                    {stats?.pointages_irreguliers || 0}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Irréguliers
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Taux de régularité: {((stats?.pointages_reguliers || 0) / (stats?.total || 1) * 100).toFixed(1)}%
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderAbsencesAnalysis = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="error">
              ⚠️ Analyse des Absences
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell>Total absences</TableCell>
                    <TableCell>
                      <Chip label={stats?.total || 0} color="error" />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Jours d'absence</TableCell>
                    <TableCell>
                      <Chip label={stats?.jours_total || 0} color="warning" />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Moyenne jours/absence</TableCell>
                    <TableCell>
                      <Chip label={`${stats?.moyenne_jours || 0} jours`} color="info" />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              📋 Répartition
            </Typography>
            <Grid container spacing={2} textAlign="center">
              <Grid item xs={6}>
                <Box>
                  <Typography variant="h4" color="info.main">
                    {stats?.justifiees || 0}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Justifiées
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box>
                  <Typography variant="h4" color="warning.main">
                    {stats?.non_justifiees || 0}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Non justifiées
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Taux de justification: {stats?.taux_justification || 0}%
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <Header user={currentUser} onMenuToggle={() => setOpen(!open)} />
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
        {/* En-tête */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: "bold" }}>
              Analyses Détaillées
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Analyses avancées des congés, pointages et absences
            </Typography>
          </Box>
        </Box>

        {/* Filtres */}
        <Card sx={{ mb: 3, borderRadius: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Type d'analyse</InputLabel>
                  <Select
                    value={analysisType}
                    label="Type d'analyse"
                    onChange={(e) => setAnalysisType(e.target.value)}
                  >
                    {analysisTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        <Box display="flex" alignItems="center">
                          {type.icon}
                          <Typography sx={{ ml: 1 }}>{type.label}</Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

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

              <Grid item xs={12} md={3}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<BarChartIcon />}
                  onClick={loadAnalysis}
                  disabled={loading}
                  sx={{ height: '56px' }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Analyser'}
                </Button>
              </Grid>
            </Grid>

            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
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
              
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Employé</InputLabel>
                  <Select
                    value={selectedEmployee}
                    label="Employé"
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                  >
                    <MenuItem value="">Tous les employés</MenuItem>
                    {filteredEmployees.map((emp) => (
                      <MenuItem key={emp.matricule} value={emp.matricule}>
                        {emp.nom} {emp.prenom} ({emp.matricule})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Département</InputLabel>
                  <Select
                    value={selectedDepartment}
                    label="Département"
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                  >
                    <MenuItem value="">Tous les départements</MenuItem>
                    {departments.map((dept) => (
                      <MenuItem key={dept.id_departement} value={dept.id_departement}>
                        {dept.nom}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading && (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        )}

        {stats && (
          <Box>
            <Typography variant="h6" gutterBottom color="primary">
              Résultats de l'analyse - {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
            </Typography>
            
            {analysisType === 'conges' && renderCongesAnalysis()}
            {analysisType === 'pointages' && renderPointagesAnalysis()}
            {analysisType === 'absences' && renderAbsencesAnalysis()}
          </Box>
        )}

        {!stats && !loading && (
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box textAlign="center" py={4}>
                <TrendingUpIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="textSecondary">
                  Sélectionnez des critères et cliquez sur "Analyser" pour voir les résultats
                </Typography>
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
};

export default StatisticsAnalysis;