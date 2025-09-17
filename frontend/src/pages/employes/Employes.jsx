import React, { useState, useEffect } from "react";
import {
  Toolbar,
  Box,
  Typography,
  IconButton,
  Avatar,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  InputAdornment,
  Snackbar,
  Alert,
  Fab,
  Card,
  CardContent,
  CircularProgress,
  alpha,
  MenuItem,
  Tooltip,
  useTheme
} from "@mui/material";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Apartment as ApartmentIcon,
  People as PeopleIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Home as HomeIcon,
  AccessTime as AccessTimeIcon,
  BeachAccess as BeachAccessIcon,
  Block as BlockIcon,
  EventAvailable as EventAvailableIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Work as WorkIcon,
  Business as BusinessIcon
} from "@mui/icons-material";
import axios from "axios";
import { getEmployes, createEmploye, updateEmploye, deleteEmploye, getDepartements } from "../../services/api";
import Header, { triggerNotificationsRefresh } from "../../components/Header";
import Swal from "sweetalert2";

const drawerWidth = 240;

const Employes = () => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingEmploye, setEditingEmploye] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [formData, setFormData] = useState({
    matricule: "",
    titre: "stagiaire",
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    poste: "",
    departement_pk: "",
    statut: "actif"
  });

  const [employes, setEmployes] = useState([]);
  const [departements, setDepartements] = useState([]);
  const [user, setUser] = useState(null);
  const [errors, setErrors] = useState({});

  const menuItems = [
    { text: "Accueil", path: "/Home", icon: <HomeIcon /> },
    { text: "Départements", path: "/departements", icon: <ApartmentIcon /> },
    { text: "Employés", path: "/employes", icon: <PeopleIcon /> },
    { text: "Pointages", path: "/pointages", icon: <AccessTimeIcon /> },
    { text: "Congés", path: "/conges", icon: <BeachAccessIcon /> },
    { text: "Absences", path: "/absences", icon: <BlockIcon /> },
    { text: "Événements", path: "/evenements", icon: <EventAvailableIcon /> }
  ];

  // --- Récupération utilisateur via JWT ---
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) return navigate("/");

      try {
        const res = await axios.get("http://localhost:8000/api/users/me/", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(res.data);
      } catch (err) {
        console.error(err);
        localStorage.removeItem("access_token");
        navigate("/");
      }
    };
    fetchUser();
    fetchData();
  }, [navigate]);

  // --- CRUD Employés ---
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [employesData, departementsData] = await Promise.all([
        getEmployes(),
        getDepartements()
      ]);
      setEmployes(Array.isArray(employesData) ? employesData : []);
      setDepartements(Array.isArray(departementsData) ? departementsData : []);
      console.log("Employés mis à jour:", employesData); // Debug
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Erreur lors du chargement des données");
      showSnackbar("Impossible de charger les données", "error");
      setLoading(false);
    }
  };

  const handleOpenDialog = (employe = null) => {
    if (employe) {
      setEditingEmploye(employe);
      setFormData({
        matricule: employe.matricule,
        titre: employe.titre,
        nom: employe.nom,
        prenom: employe.prenom,
        email: employe.email,
        telephone: employe.telephone || "",
        poste: employe.poste,
        departement_pk: employe.departement?.id_departement || "",
        statut: employe.statut
      });
    } else {
      setEditingEmploye(null);
      setFormData({
        matricule: "",
        titre: "stagiaire",
        nom: "",
        prenom: "",
        email: "",
        telephone: "",
        poste: "",
        departement_pk: "",
        statut: "actif"
      });
    }
    setErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingEmploye(null);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      if (editingEmploye) {
        await updateEmploye(editingEmploye.matricule, formData);
        showSnackbar("Employé modifié avec succès");
      } else {
        await createEmploye(formData);
        showSnackbar("Employé créé avec succès");
      }
      
      handleCloseDialog();
      await fetchData();
      triggerNotificationsRefresh();
    } catch (err) {
      if (err.response?.data) {
        setErrors(err.response.data);
      } else {
        showSnackbar("Erreur lors de l'opération", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (matricule) => {
    const result = await Swal.fire({
      title: 'Êtes-vous sûr?',
      text: "Vous ne pourrez pas annuler cette action!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, supprimer!',
      cancelButtonText: 'Annuler',
      background: theme.palette.background.paper,
      color: theme.palette.text.primary
    });

    if (result.isConfirmed) {
      try {
        await deleteEmploye(matricule);
        showSnackbar("Employé supprimé avec succès");
        await fetchData();
        triggerNotificationsRefresh();
      } catch (err) {
        showSnackbar("Erreur lors de la suppression", "error");
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };
  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredData = employes.filter(employe =>
    (employe.nom || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (employe.prenom || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (employe.matricule || "").includes(searchTerm) ||
    (employe.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (employe.poste || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedData = filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const getStatusColor = (statut) => {
    return statut === 'actif' ? 'success' : 'error';
  };

  const getTitreColor = (titre) => {
    return titre === 'employe' ? 'primary' : 'secondary';
  };

  if (loading && employes.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) return <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}><Typography color="error">{error}</Typography></Box>;

  return (
    <Box sx={{ display: "flex" }}>
      {/* AppBar */}
      <Header
        user={user}
        onMenuToggle={() => setOpen(!open)}
      />
      
      {/* Sidebar */}
      <Drawer variant="permanent" sx={{ width: drawerWidth, flexShrink:0, [`& .MuiDrawer-paper`]:{ width:drawerWidth, boxSizing:"border-box"}, display:{ xs:"none", md:"block"} }} open>
        <Toolbar /><Divider />
        <List>
          {menuItems.map(item => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton component={Link} to={item.path} selected={location.pathname===item.path}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text}/>
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Mobile Drawer */}
      <Drawer anchor="left" open={open} onClose={()=>setOpen(false)} sx={{ display:{md:"none"} ,}}>
        <Box sx={{ width:drawerWidth }}>
          <List>
            {menuItems.map(item => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton component={Link} to={item.path} onClick={()=>setOpen(false)} selected={location.pathname===item.path}>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text}/>
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Contenu principal */}
      <Box component="main" sx={{ flexGrow:1, bgcolor:"#f8fafc", minHeight:"100vh", p:3, mt:8, ml:{md:`${drawerWidth}px`}, ml:5 }}>
        {/* Header */}
        <Box sx={{ display:"flex", justifyContent:"space-between", alignItems:"center", mb:3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight:"bold" }}>Gestion des Employés</Typography>
            <Typography variant="body1" color="text.secondary">Gérez les employés de votre entreprise</Typography>
          </Box>
          <Fab 
              color="primary" 
              onClick={() => handleOpenDialog()} 
              sx={{ 
                borderRadius: 2, 
                width: 200, 
                mr: 1.25,
                px: 4, 
                textTransform: "none", 
                fontWeight: "bold",
                fontSize: '1rem'
              }}
            >
              <AddIcon sx={{ mr: 1, fontSize: '1rem' }} /> 
              Nouvel Employé
            </Fab>
        </Box>

        {/* Statistiques */}
        <Grid container spacing={3} sx={{ mb:4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius:3, boxShadow:2 }}>
              <CardContent>
                <Typography color="text.secondary">Total Employés</Typography>
                <Typography variant="h4" sx={{ fontWeight:"bold", color:"primary.main" }}>{employes.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius:3, boxShadow:2 }}>
              <CardContent>
                <Typography color="text.secondary">Employés Actifs</Typography>
                <Typography variant="h4" sx={{ fontWeight:"bold", color:"secondary.main" }}>{employes.filter(e => e.statut === 'actif').length}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Recherche */}
        <Paper sx={{ p:2, mb:3, borderRadius:3 }}>
          <TextField fullWidth placeholder="Rechercher..." value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon/></InputAdornment>,
              endAdornment: searchTerm && <InputAdornment position="end"><IconButton onClick={()=>setSearchTerm("")}><CloseIcon/></IconButton></InputAdornment>
            }}
          />
        </Paper>

        {/* Tableau */}
        <Paper sx={{ width:"100%", overflow:"hidden", borderRadius:3 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employé</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Poste</TableCell>
                  <TableCell>Département</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.map(employe => (
                  <TableRow key={employe.matricule} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                          sx={{
                            bgcolor: alpha(theme.palette.primary.main, 0.2),
                            color: theme.palette.primary.main
                          }}
                        >
                          <PersonIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {employe.prenom} {employe.nom}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            matricule: {employe.matricule}
                          </Typography>
                          <Chip
                            label={employe.titre}
                            size="small"
                            color={getTitreColor(employe.titre)}
                            variant="outlined"
                          />
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <EmailIcon fontSize="small" color="primary" />
                          <Typography variant="body2">
                            {employe.email}
                          </Typography>
                        </Box>
                        {employe.telephone && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PhoneIcon fontSize="small" color="primary" />
                            <Typography variant="body2">
                              {employe.telephone}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WorkIcon fontSize="small" color="primary" />
                        <Typography variant="body2">
                          {employe.poste}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {employe.departement && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <BusinessIcon fontSize="small" color="primary" />
                          <Typography variant="body2">
                            {employe.departement.nom}
                          </Typography>
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={employe.statut}
                        color={getStatusColor(employe.statut)}
                        variant="filled"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display:"flex", gap:1 }}>
                        <Tooltip title="Modifier">
                          <IconButton color="primary" onClick={()=>handleOpenDialog(employe)} size="small">
                            <EditIcon/>
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Supprimer">
                          <IconButton color="error" onClick={()=>handleDelete(employe.matricule)} size="small">
                            <DeleteIcon/>
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {paginatedData.length===0 && <TableRow><TableCell colSpan={6} align="center">Aucun employé trouvé</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
          {filteredData.length>0 && <TablePagination rowsPerPageOptions={[5,10,25]} component="div" count={filteredData.length} rowsPerPage={rowsPerPage} page={page} onPageChange={handleChangePage} onRowsPerPageChange={handleChangeRowsPerPage} labelRowsPerPage="Lignes par page"/>}
        </Paper>

        {/* Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3
            }
          }}
        >
          <DialogTitle sx={{ 
            backgroundColor: theme.palette.primary.main,
            color: 'white',
            fontWeight: 'bold'
          }}>
            {editingEmploye ? "Modifier l'employé" : "Nouvel employé"}
          </DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent sx={{ pt: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Matricule"
                    name="matricule"
                    value={formData.matricule}
                    onChange={handleChange}
                    error={!!errors.matricule}
                    helperText={errors.matricule}
                    disabled={!!editingEmploye}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Titre"
                    name="titre"
                    value={formData.titre}
                    onChange={handleChange}
                    select
                    required
                  >
                    <MenuItem value="stagiaire">Stagiaire</MenuItem>
                    <MenuItem value="employe">Employé Fixe</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Nom"
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    error={!!errors.nom}
                    helperText={errors.nom}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Prénom"
                    name="prenom"
                    value={formData.prenom}
                    onChange={handleChange}
                    error={!!errors.prenom}
                    helperText={errors.prenom}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    error={!!errors.email}
                    helperText={errors.email}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Téléphone"
                    name="telephone"
                    value={formData.telephone}
                    onChange={handleChange}
                    error={!!errors.telephone}
                    helperText={errors.telephone}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Poste"
                    name="poste"
                    value={formData.poste}
                    onChange={handleChange}
                    error={!!errors.poste}
                    helperText={errors.poste}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Département"
                    name="departement_pk"
                    value={formData.departement_pk}
                    onChange={handleChange}
                    select
                    required
                    error={!!errors.departement_pk}
                    helperText={errors.departement_pk}
                  >
                    {departements.map((dept) => (
                      <MenuItem key={dept.id_departement} value={dept.id_departement}>
                        {dept.nom}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Statut"
                    name="statut"
                    value={formData.statut}
                    onChange={handleChange}
                    select
                    required
                  >
                    <MenuItem value="actif">Actif</MenuItem>
                    <MenuItem value="inactif">Inactif</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3, gap: 1 }}>
              <Button onClick={handleCloseDialog} color="inherit">
                Annuler
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  py: 1
                }}
              >
                {loading ? 'En cours...' : (editingEmploye ? 'Modifier' : 'Créer')}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Snackbar */}
        <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical:"bottom", horizontal:"right" }}>
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width:"100%" }}>{snackbar.message}</Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default Employes;