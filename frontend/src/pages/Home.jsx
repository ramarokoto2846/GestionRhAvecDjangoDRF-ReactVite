import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Typography,
  Grid,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  alpha,
  Chip,
  Container
} from "@mui/material";
import {
  People as PeopleIcon,
  Event as EventIcon,
  AccessTime as TimeIcon,
  ChevronRight as ChevronRightIcon,
  Logout as LogoutIcon
} from "@mui/icons-material";
import {
  getCurrentUser,
  getDepartements,
  getEmployesStats,
  getPointagesStatsMensuelles,
  getConges,
  getAbsences,
  getEvenementsAVenir
} from "../services/api"; // Import des fonctions spécifiques depuis api.js

const Home = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [user, setUser] = useState(null);
  const [notificationsCount, setNotificationsCount] = useState(3);
  const [stats, setStats] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [errorStats, setErrorStats] = useState(null);

  // Fonction de déconnexion
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    navigate("/");
  };

  // Récupération des infos utilisateur
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (err) {
        console.error(err);
        navigate("/");
      }
    };
    fetchUser();
  }, [navigate]);

  // Récupération des statistiques dynamiques pour les 6 pages
  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true);
      setErrorStats(null);

      try {
        // 1. Départements
        const departements = await getDepartements();
        const departementsCount = departements.length || 0;

        // 2. Employés
        const employesStats = await getEmployesStats();
        const employesCount = employesStats.total_employes || 0;
        const employesChange = employesStats.variation_mensuelle || "+0% ce mois";

        // 3. Pointages (stats mensuelles pour le mois en cours)
        const today = new Date();
        const pointagesStats = await getPointagesStatsMensuelles(today.getMonth() + 1, today.getFullYear());
        const pointagesCount = pointagesStats.total_pointages || 0;
        const presenceRate = pointagesStats.taux_presence || "0";

        // 4. Congés (en attente)
        const conges = await getConges();
        const congesEnAttente = conges.filter(conge => conge.statut === "en_attente").length || 0;

        // 5. Absences
        const absences = await getAbsences();
        const absencesCount = absences.length || 0;

        // 6. Événements à venir
        const evenements = await getEvenementsAVenir();
        const evenementsCount = evenements.length || 0;

        // Mise à jour des stats avec icônes et couleurs correspondantes
        setStats([
          { 
            label: "Départements", 
            value: departementsCount.toString(), 
            change: "Total actifs", 
            icon: <PeopleIcon />, 
            color: "#FF6B6B" 
          },
          { 
            label: "Employés actifs", 
            value: employesCount.toString(), 
            change: employesChange, 
            icon: <PeopleIcon />, 
            color: "#4ECDC4" 
          },
          { 
            label: "Pointages ce mois", 
            value: pointagesCount.toString(), 
            change: `${presenceRate}% de présence`, 
            icon: <TimeIcon />, 
            color: "#45B7D1" 
          },
          { 
            label: "Congés en attente", 
            value: congesEnAttente.toString(), 
            change: "À valider", 
            icon: <EventIcon />, 
            color: "#F9A826" 
          },
          { 
            label: "Absences", 
            value: absencesCount.toString(), 
            change: "Ce mois", 
            icon: <EventIcon />, 
            color: "#7467EF" 
          },
          { 
            label: "Événements à venir", 
            value: evenementsCount.toString(), 
            change: "Planifiés", 
            icon: <EventIcon />, 
            color: "#FF9E43" 
          }
        ]);
      } catch (err) {
        console.error("Erreur lors de la récupération des stats:", err);
        setErrorStats("Impossible de charger les statistiques. Veuillez réessayer.");
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, []);

  // Actions rapides (inchangées)
  const quickActions = [
    { icon: <PeopleIcon />, label: "Départements", path: "/departements", color: "#FF6B6B" },
    { icon: <PeopleIcon />, label: "Employés", path: "/employes", color: "#4ECDC4" },
    { icon: <TimeIcon />, label: "Pointages", path: "/pointages", color: "#45B7D1" },
    { icon: <EventIcon />, label: "Congés", path: "/conges", color: "#F9A826" },
    { icon: <EventIcon />, label: "Absences", path: "/absences", color: "#7467EF" },
    { icon: <EventIcon />, label: "Événements", path: "/evenements", color: "#FF9E43" }
  ];

  if (loadingStats) {
    return (
      <Box sx={{ flexGrow: 1, height: '931px', bgcolor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6">Chargement des statistiques...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, height: '931px', bgcolor: '#f8fafc' }}>
      {/* Main Content */}
      <Container maxWidth="xl" sx={{ py: isMobile ? 2 : 4, px: isMobile ? 2 : 3 }}>
        {/* Welcome Section */}
        <Box 
          sx={{ 
            bgcolor: 'white',
            borderRadius: 4,
            mb: 4,
            p: 4,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 10px 40px rgba(0,0,0,0.05)',
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.light, 0.2)} 100%)`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 2 }}>
            <Chip 
              label="Espace administrateur" 
              size="small" 
              sx={{ 
                mb: 2, 
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: 'primary.dark',
                fontWeight: 'medium'
              }} 
            />
            
            <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'text.primary' }}>
              Bienvenue, {user ? user.nom || user.email : 'Administrateur'}
            </Typography>
            
            <Typography variant="h6" sx={{ color: 'text.secondary', mb: 4, maxWidth: 600 }}>
              Gérez efficacement vos ressources humaines et optimisez la productivité de votre entreprise
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <Button 
                variant="contained" 
                size="large"
                sx={{ 
                  borderRadius: 3,
                  px: 4,
                  py: 1,
                  textTransform: 'none',
                  fontWeight: 'bold',
                  boxShadow: '0 8px 20px rgba(25, 118, 210, 0.3)'
                }}
                onClick={() => navigate("/stats")}
              >
                Tableau de bord
              </Button>
              
              <Button 
                variant="outlined" 
                size="large"
                sx={{ 
                  borderRadius: 3,
                  px: 4,
                  py: 1,
                  textTransform: 'none',
                  fontWeight: 'medium'
                }}
                onClick={() => navigate("/employes")}
              >
                Voir les employés
              </Button>

              <Button 
                variant="outlined" 
                size="large"
                startIcon={<LogoutIcon />}
                sx={{ 
                  borderRadius: 3,
                  px: 4,
                  py: 1,
                  textTransform: 'none',
                  fontWeight: 'medium',
                  color: 'error.main',
                  borderColor: 'error.main',
                  '&:hover': {
                    borderColor: 'error.dark',
                    bgcolor: alpha(theme.palette.error.main, 0.04)
                  }
                }}
                onClick={handleLogout}
              >
                Déconnexion
              </Button>
            </Box>

            {errorStats && (
              <Typography variant="body2" color="error" sx={{ mt: 2 }}>
                {errorStats}
              </Typography>
            )}
          </Box>
          
          {/* Éléments décoratifs */}
          <Box 
            sx={{ 
              position: 'absolute', 
              top: -20, 
              right: -20, 
              width: 200, 
              height: 200, 
              borderRadius: '50%', 
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              zIndex: 1
            }} 
          />
          <Box 
            sx={{ 
              position: 'absolute', 
              bottom: -30, 
              right: 100, 
              width: 150, 
              height: 150, 
              borderRadius: '50%', 
              bgcolor: alpha(theme.palette.secondary.main, 0.1),
              zIndex: 1
            }} 
          />
        </Box>

        {/* Stats Overview avec icônes */}
        <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'bold', color: 'text.primary' }}>
          Statistiques
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 5 }}>
          {stats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card 
                sx={{ 
                  borderRadius: 3,
                  boxShadow: '0 5px 20px rgba(0,0,0,0.05)',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                  }
                }}
              >
                <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center' }}>
                  <Box 
                    sx={{ 
                      width: 50, 
                      height: 50, 
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 2,
                      bgcolor: alpha(stat.color, 0.2),
                      color: stat.color
                    }}
                  >
                    {React.cloneElement(stat.icon, { sx: { fontSize: 24 } })}
                  </Box>
                  <Box>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {stat.label}
                    </Typography>
                    <Chip 
                      label={stat.change} 
                      size="small" 
                      sx={{ 
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: 'primary.dark',
                        fontWeight: 'medium',
                        fontSize: '0.7rem'
                      }} 
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Quick Actions (inchangées) */}
        <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'bold', color: 'text.primary' }}>
          Accès rapide
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 6 }}>
          {quickActions.map((action, index) => (
            <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
              <Card 
                sx={{ 
                  height: '100%', 
                  cursor: 'pointer', 
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  borderRadius: 3,
                  boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.1)'
                  }
                }}
                onClick={() => navigate(action.path)}
              >
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Box 
                    sx={{ 
                      width: 60, 
                      height: 60, 
                      borderRadius: 3,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2,
                      bgcolor: alpha(action.color, 0.2),
                      color: action.color
                    }}
                  >
                    {React.cloneElement(action.icon, { sx: { fontSize: 30 } })}
                  </Box>
                  
                  <Typography variant="h6" sx={{ fontWeight: 'medium', mb: 1 }}>
                    {action.label}
                  </Typography>
                  
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      color: 'primary.main',
                      mt: 1
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      Accéder
                    </Typography>
                    <ChevronRightIcon sx={{ fontSize: 18 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default Home;