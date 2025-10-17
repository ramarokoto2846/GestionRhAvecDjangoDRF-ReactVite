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
  Container,
  AppBar,
  Toolbar,
  Paper
} from "@mui/material";
import {
  People as PeopleIcon,
  Event as EventIcon,
  AccessTime as TimeIcon,
  ChevronRight as ChevronRightIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  Business as BusinessIcon
} from "@mui/icons-material";
import {
  getCurrentUser
} from "../services/api";

const Home = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [user, setUser] = useState(null);

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

  // Actions rapides transformées en navigation
  const navItems = [
    { icon: <PeopleIcon />, label: "Départements", path: "/departements", color: "#FF6B6B" },
    { icon: <PeopleIcon />, label: "Employés", path: "/employes", color: "#4ECDC4" },
    { icon: <TimeIcon />, label: "Pointages", path: "/pointages", color: "#45B7D1" },
    { icon: <EventIcon />, label: "Congés", path: "/conges", color: "#F9A826" },
    { icon: <EventIcon />, label: "Absences", path: "/absences", color: "#7467EF" },
    { icon: <EventIcon />, label: "Événements", path: "/evenements", color: "#FF9E43" }
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '931px', bgcolor: '#f8fafc' }}>
      {/* Navigation Bar */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'white', borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                color: 'primary.main', 
                fontWeight: 'bold',
                display: { xs: 'none', md: 'block' }
              }}
            >
              HR Management System
            </Typography>
            
            {/* Navigation Items */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center', flex: 1 }}>
              {navItems.map((item, index) => (
                <Button
                  key={index}
                  color="inherit"
                  onClick={() => navigate(item.path)}
                  startIcon={item.icon}
                  sx={{ 
                    color: 'text.primary',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      color: 'primary.main'
                    },
                    fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.9rem' },
                    px: { xs: 1, sm: 2 },
                    py: 1,
                    minWidth: 'auto',
                    borderBottom: '1px solid gray',
                    borderRadius: 0,
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
            
            {/* Bouton de déconnexion */}
            <Button 
              color="error" 
              onClick={handleLogout}
              startIcon={<LogoutIcon />}
              sx={{ 
                whiteSpace: 'nowrap',
                ml: 2,
                display: { xs: 'none', sm: 'flex' }
              }}
            >
              Déconnexion
            </Button>

            {/* Menu mobile */}
            <Button 
              color="inherit"
              sx={{ 
                display: { xs: 'flex', sm: 'none' },
                minWidth: 'auto'
              }}
            >
              <MenuIcon />
            </Button>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ py: isMobile ? 2 : 4, px: isMobile ? 2 : 3, flex: 1 }}>
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
                  },
                  display: { sm: 'none' }
                }}
                onClick={handleLogout}
              >
                Déconnexion
              </Button>
            </Box>
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

        {/* About Application Section */}
        <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'bold', color: 'text.primary' }}>
          À propos de l'application
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 5 }}>
          <Grid item xs={12}>
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
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box 
                    sx={{ 
                      width: 50, 
                      height: 50, 
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 2,
                      bgcolor: alpha('#4ECDC4', 0.2),
                      color: '#4ECDC4'
                    }}
                  >
                    <BusinessIcon sx={{ fontSize: 24 }} />
                  </Box>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    Gestion des Ressources Humaines - TVM
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
                  Bienvenue dans le <strong>Système de Gestion des Ressources Humaines</strong> conçu spécifiquement pour <strong>Televiziona Malagasy (TVM)</strong>, la première chaîne de télévision nationale de Madagascar, gérée par l'<strong>Office de la Radio et de la Télévision Publiques de Madagascar (ORTM)</strong>.
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                  Cette application moderne et intuitive permet une gestion efficace et centralisée des ressources humaines de la TVM. Elle offre des outils avancés pour suivre les employés, gérer les départements, enregistrer les pointages, administrer les congés et absences, et planifier les événements internes. Notre objectif est d'optimiser les processus administratifs, d'améliorer la productivité et de soutenir le dynamisme de la TVM dans son rôle de média national de référence.
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                  Dotée d'une interface conviviale et d'une conception responsive, cette application s'adapte à tous les appareils pour faciliter l'accès aux administrateurs, où qu'ils soient. Avec des fonctionnalités comme des tableaux de bord personnalisés et des rapports en temps réel, elle répond aux besoins spécifiques de la TVM tout en intégrant les dernières technologies pour une gestion fluide et sécurisée.
                </Typography>
                <Chip 
                  label="Optimisation RH pour TVM" 
                  size="small" 
                  sx={{ 
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: 'primary.dark',
                    fontWeight: 'medium',
                    fontSize: '0.7rem'
                  }} 
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Footer */}
      <Paper 
        component="footer" 
        square 
        variant="outlined"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          backgroundColor: alpha(theme.palette.primary.main, 0.02),
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }}
      >
        <Container maxWidth="xl">
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} HR Management System. Tous droits réservés.
          </Typography>
        </Container>
      </Paper>
    </Box>
  );
};

export default Home;