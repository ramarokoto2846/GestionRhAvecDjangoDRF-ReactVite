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
  DialogActions
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Download as DownloadIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Visibility as ViewIcon,
  Restore as RestoreIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { getSavedStatistics, getCurrentUser, isSuperuser, deleteSavedStatistics } from '../../services/api';
import Header, { triggerNotificationsRefresh } from '../../components/Header';
import Sidebar from '../../components/Sidebar';

const StatisticsHistory = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isSuperuserState, setIsSuperuserState] = useState(false);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statsType, setStatsType] = useState('employe');
  const [selectedStat, setSelectedStat] = useState(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);

  const statsTypes = [
    { value: 'employe', label: 'Employés' },
    { value: 'departement', label: 'Départements' },
    { value: 'global', label: 'Globales' }
  ];

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
        console.error("Erreur:", err);
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
  }, [statsType]);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getSavedStatistics({ type: statsType });
      setStats(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      setStats([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (stat) => {
    setSelectedStat(stat);
    setDetailDialog(true);
  };

  const handleDelete = (stat) => {
    setSelectedStat(stat);
    setDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedStat) return;
    
    try {
      await deleteSavedStatistics(selectedStat.id);
      await loadStats();
      setDeleteDialog(false);
      setSelectedStat(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredStats = stats.filter((stat) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (stat.employe?.nom?.toLowerCase() || '').includes(searchLower) ||
      (stat.employe?.prenom?.toLowerCase() || '').includes(searchLower) ||
      (stat.departement?.nom?.toLowerCase() || '').includes(searchLower) ||
      (stat.type_periode?.toLowerCase() || '').includes(searchLower)
    );
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getStatusColor = (statut) => {
    return statut === 'actif' ? 'success' : 'error';
  };

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
              Historique des Statistiques
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Consultation des données statistiques sauvegardées
            </Typography>
          </Box>
        </Box>

        {/* Cartes de résumé */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography color="text.secondary">Total Sauvegardes</Typography>
                <Typography variant="h4" sx={{ fontWeight: "bold", color: "primary.main" }}>
                  {stats.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography color="text.secondary">Statistiques Employés</Typography>
                <Typography variant="h4" sx={{ fontWeight: "bold", color: "secondary.main" }}>
                  {stats.filter(s => !s.departement && !s.type_periode === 'global').length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography color="text.secondary">Statistiques Départements</Typography>
                <Typography variant="h4" sx={{ fontWeight: "bold", color: "info.main" }}>
                  {stats.filter(s => s.departement).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filtres */}
        <Card sx={{ mb: 3, borderRadius: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
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
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Type de statistiques</InputLabel>
                  <Select
                    value={statsType}
                    label="Type de statistiques"
                    onChange={(e) => setStatsType(e.target.value)}
                  >
                    {statsTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<RestoreIcon />}
                  onClick={loadStats}
                >
                  Actualiser
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Statistiques Sauvegardées ({filteredStats.length})
              </Typography>
              
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Objet</TableCell>
                      <TableCell>Période</TableCell>
                      <TableCell>Date de création</TableCell>
                      <TableCell>Créé par</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredStats.map((stat) => (
                      <TableRow key={stat.id} hover>
                        <TableCell>
                          <Chip 
                            label={stat.type_periode === 'global' ? 'Global' : 
                                  stat.departement ? 'Département' : 'Employé'} 
                            color={stat.type_periode === 'global' ? 'secondary' : 
                                  stat.departement ? 'info' : 'primary'} 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell>
                          {stat.employe && (
                            <Typography variant="body2">
                              {stat.employe.nom} {stat.employe.prenom}
                              <br />
                              <Typography variant="caption" color="textSecondary">
                                {stat.employe.matricule}
                              </Typography>
                            </Typography>
                          )}
                          {stat.departement && (
                            <Typography variant="body2">
                              {stat.departement.nom}
                              <br />
                              <Typography variant="caption" color="textSecondary">
                                {stat.departement.responsable}
                              </Typography>
                            </Typography>
                          )}
                          {stat.type_periode === 'global' && (
                            <Typography variant="body2">
                              Statistiques globales
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(stat.periode_debut || stat.mois)}
                            {stat.periode_fin && ` au ${formatDate(stat.periode_fin)}`}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {stat.type_periode}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {stat.created_at && formatDate(stat.created_at)}
                        </TableCell>
                        <TableCell>
                          {stat.created_by?.email || 'Système'}
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={1}>
                            <Button
                              size="small"
                              startIcon={<ViewIcon />}
                              onClick={() => handleViewDetails(stat)}
                            >
                              Détails
                            </Button>
                            {isSuperuserState && (
                              <Button
                                size="small"
                                color="error"
                                startIcon={<DeleteIcon />}
                                onClick={() => handleDelete(stat)}
                              >
                                Supprimer
                              </Button>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {filteredStats.length === 0 && (
                <Box textAlign="center" py={4}>
                  <Typography color="textSecondary">
                    Aucune statistique sauvegardée trouvée
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        )}

        {/* Dialog Détails */}
        <Dialog 
          open={detailDialog} 
          onClose={() => setDetailDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Détails de la statistique
          </DialogTitle>
          <DialogContent>
            {selectedStat && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Informations générales
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Type:
                    </Typography>
                    <Typography variant="body1">
                      {selectedStat.type_periode === 'global' ? 'Global' : 
                       selectedStat.departement ? 'Département' : 'Employé'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Période:
                    </Typography>
                    <Typography variant="body1">
                      {selectedStat.type_periode}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Date de création:
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(selectedStat.created_at)}
                    </Typography>
                  </Grid>
                </Grid>

                {selectedStat.employe && (
                  <>
                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                      Informations employé
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Nom complet:
                        </Typography>
                        <Typography variant="body1">
                          {selectedStat.employe.nom} {selectedStat.employe.prenom}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Matricule:
                        </Typography>
                        <Typography variant="body1">
                          {selectedStat.employe.matricule}
                        </Typography>
                      </Grid>
                    </Grid>
                  </>
                )}

                {selectedStat.departement && (
                  <>
                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                      Informations département
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Nom:
                        </Typography>
                        <Typography variant="body1">
                          {selectedStat.departement.nom}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Responsable:
                        </Typography>
                        <Typography variant="body1">
                          {selectedStat.departement.responsable}
                        </Typography>
                      </Grid>
                    </Grid>
                  </>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailDialog(false)}>Fermer</Button>
          </DialogActions>
        </Dialog>

        {/* Dialog Suppression */}
        <Dialog 
          open={deleteDialog} 
          onClose={() => setDeleteDialog(false)}
        >
          <DialogTitle>
            Confirmer la suppression
          </DialogTitle>
          <DialogContent>
            <Typography>
              Êtes-vous sûr de vouloir supprimer cette statistique ? Cette action est irréversible.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialog(false)}>Annuler</Button>
            <Button onClick={confirmDelete} color="error">
              Supprimer
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default StatisticsHistory;