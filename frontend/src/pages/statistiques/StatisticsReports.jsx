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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Download as DownloadIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  PictureAsPdf as PdfIcon,
  Email as EmailIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { getReportHistory, generateReport, getEmployes, getDepartements, getCurrentUser, isSuperuser } from '../../services/api';
import Header, { triggerNotificationsRefresh } from '../../components/Header';
import Sidebar from '../../components/Sidebar';

const StatisticsReports = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isSuperuserState, setIsSuperuserState] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [reports, setReports] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [reportType, setReportType] = useState('employe');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState('');
  const [generateDialog, setGenerateDialog] = useState(false);

  const reportTypes = [
    { value: 'employe', label: 'Rapport Employé' },
    { value: 'departement', label: 'Rapport Département' },
    { value: 'global', label: 'Rapport Global' }
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
      setLoading(true);
      const [empsData, deptsData, reportsData] = await Promise.all([
        getEmployes(),
        getDepartements(),
        getReportHistory()
      ]);
      setEmployees(empsData);
      setDepartments(deptsData);
      setReports(Array.isArray(reportsData) ? reportsData : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setGenerating(true);
      setError('');
      
      const formattedDate = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
      const params = {
        type: reportType,
        periode: 'mois',
        date: formattedDate
      };

      if (reportType === 'employe' && selectedEmployee) {
        params.matricule = selectedEmployee;
      } else if (reportType === 'departement' && selectedDepartment) {
        params.departement = selectedDepartment;
      }

      await generateReport(params);
      setGenerateDialog(false);
      await loadInitialData(); // Recharger l'historique
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon color="success" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      case 'generating':
        return <ScheduleIcon color="warning" />;
      default:
        return <ScheduleIcon color="action" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'generating':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredReports = reports.filter((report) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (report.filename?.toLowerCase() || '').includes(searchLower) ||
      (report.type?.toLowerCase() || '').includes(searchLower) ||
      (report.status?.toLowerCase() || '').includes(searchLower)
    );
  });

  const recentReports = reports.slice(0, 5);

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
              Rapports PDF
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Génération et gestion des rapports PDF
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setGenerateDialog(true)}
            size="large"
          >
            Nouveau Rapport
          </Button>
        </Box>

        {/* Cartes de résumé */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography color="text.secondary">Total Rapports</Typography>
                <Typography variant="h4" sx={{ fontWeight: "bold", color: "primary.main" }}>
                  {reports.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography color="text.secondary">Terminés</Typography>
                <Typography variant="h4" sx={{ fontWeight: "bold", color: "success.main" }}>
                  {reports.filter(r => r.status === 'completed').length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography color="text.secondary">En cours</Typography>
                <Typography variant="h4" sx={{ fontWeight: "bold", color: "warning.main" }}>
                  {reports.filter(r => r.status === 'generating').length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Génération de rapport */}
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  📄 Génération Rapide
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  Créez un nouveau rapport en quelques clics
                </Typography>
                
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<PdfIcon />}
                  onClick={() => setGenerateDialog(true)}
                  sx={{ mb: 2 }}
                >
                  Nouveau Rapport
                </Button>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" gutterBottom>
                  Rapports Récents
                </Typography>
                <List dense>
                  {recentReports.map((report) => (
                    <ListItem key={report.id}>
                      <ListItemIcon>
                        {getStatusIcon(report.status)}
                      </ListItemIcon>
                      <ListItemText
                        primary={report.filename}
                        secondary={formatDate(report.created_at)}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Historique des rapports */}
          <Grid item xs={12} md={8}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Historique des Rapports
                  </Typography>
                  <TextField
                    size="small"
                    placeholder="Rechercher..."
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
                    sx={{ width: 250 }}
                  />
                </Box>

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Fichier</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Statut</TableCell>
                        <TableCell>Taille</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredReports.map((report) => (
                        <TableRow key={report.id} hover>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <PdfIcon color="error" sx={{ mr: 1 }} />
                              <Typography variant="body2">
                                {report.filename}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={report.type} 
                              size="small"
                              color={report.type === 'global' ? 'secondary' : 
                                    report.type === 'departement' ? 'info' : 'primary'} 
                            />
                          </TableCell>
                          <TableCell>
                            {formatDate(report.created_at)}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              icon={getStatusIcon(report.status)}
                              label={report.status}
                              color={getStatusColor(report.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {report.file_size || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              startIcon={<DownloadIcon />}
                              disabled={report.status !== 'completed'}
                            >
                              Télécharger
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {filteredReports.length === 0 && (
                  <Box textAlign="center" py={4}>
                    <PdfIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography color="textSecondary">
                      Aucun rapport trouvé
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Dialog Génération */}
        <Dialog 
          open={generateDialog} 
          onClose={() => setGenerateDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Générer un nouveau rapport
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Type de rapport</InputLabel>
                  <Select
                    value={reportType}
                    label="Type de rapport"
                    onChange={(e) => setReportType(e.target.value)}
                  >
                    {reportTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

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

              {reportType === 'employe' && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Employé</InputLabel>
                    <Select
                      value={selectedEmployee}
                      label="Employé"
                      onChange={(e) => setSelectedEmployee(e.target.value)}
                    >
                      {employees.map((emp) => (
                        <MenuItem key={emp.matricule} value={emp.matricule}>
                          {emp.nom} {emp.prenom} ({emp.matricule})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}

              {reportType === 'departement' && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Département</InputLabel>
                    <Select
                      value={selectedDepartment}
                      label="Département"
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                    >
                      {departments.map((dept) => (
                        <MenuItem key={dept.id_departement} value={dept.id_departement}>
                          {dept.nom}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setGenerateDialog(false)}>Annuler</Button>
            <Button 
              onClick={handleGenerateReport} 
              variant="contained"
              disabled={generating}
              startIcon={generating ? <CircularProgress size={20} /> : <PdfIcon />}
            >
              {generating ? 'Génération...' : 'Générer le rapport'}
            </Button>
          </DialogActions>
        </Dialog>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Box>
    </Box>
  );
};

export default StatisticsReports;