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
  Paper,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar
} from "@mui/material";
import {
  People as PeopleIcon,
  Event as EventIcon,
  AccessTime as TimeIcon,
  ChevronRight as ChevronRightIcon,
  Business as BusinessIcon,
  TrendingUp as TrendingUpIcon
} from "@mui/icons-material";
import { getCurrentUser } from "../services/api";
import Header from "../components/Header"; // Import du composant Header

const Home = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [user, setUser] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

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

  const navItems = [
    { icon: <PeopleIcon />, label: "Départements", path: "/departements", color: "#10B981" },
    { icon: <PeopleIcon />, label: "Employés", path: "/employes", color: "#F59E0B" },
    { icon: <TimeIcon />, label: "Pointages", path: "/pointages", color: "#EF4444" },
    { icon: <EventIcon />, label: "Congés", path: "/conges", color: "#8B5CF6" },
    { icon: <EventIcon />, label: "Absences", path: "/absences", color: "#EC4899" },
    { icon: <EventIcon />, label: "Événements", path: "/evenements", color: "#06B6D4" }
  ];

  const stats = [
    { label: "Employés actifs", value: "247", change: "+12%", trend: "up" },
    { label: "Départements", value: "15", change: "+2", trend: "up" },
    { label: "Congés ce mois", value: "34", change: "-5%", trend: "down" },
    { label: "Pointages aujourd'hui", value: "189", change: "+8%", trend: "up" }
  ];

  const drawer = (
    <Box sx={{ 
      width: 280, 
      background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
      height: '100%',
      color: 'white'
    }}>
      <Box sx={{ p: 3, textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'white' }}>
          HR System
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 1 }}>
          {user ? user.nom || user.email : 'Administrateur'}
        </Typography>
      </Box>
      
      <List sx={{ p: 2 }}>
        <ListItem 
          button 
          onClick={() => {
            navigate("/statistiques/overview");
            setMobileOpen(false);
          }}
          sx={{ 
            borderRadius: 2,
            mb: 1,
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.1)'
            }
          }}
        >
          <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
            <TrendingUpIcon />
          </ListItemIcon>
          <ListItemText primary="Statistiques" />
        </ListItem>

        {navItems.map((item, index) => (
          <ListItem 
            key={index}
            button 
            onClick={() => {
              navigate(item.path);
              setMobileOpen(false);
            }}
            sx={{ 
              borderRadius: 2,
              mb: 1,
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f8fafc' }}>
      {/* Utilisation du composant Header pour les notifications */}
      <Header user={user} onMenuToggle={handleDrawerToggle} />

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 280 },
        }}
      >
        {drawer}
      </Drawer>

      {/* Espace pour compenser la Header fixe */}
      <Toolbar />

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ py: isMobile ? 2 : 4, px: isMobile ? 2 : 3, flex: 1 }}>
        {/* Welcome Section */}
        <Box 
          sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: 4,
            mb: 4,
            p: 4,
            position: 'relative',
            overflow: 'hidden',
            color: 'white',
            boxShadow: '0 20px 40px rgba(102, 126, 234, 0.3)'
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 2 }}>
            <Chip 
              label="Espace administrateur" 
              size="small" 
              sx={{ 
                mb: 2, 
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
                fontWeight: 'medium',
                backdropFilter: 'blur(10px)'
              }} 
            />
            
            <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Bienvenue, {user ? user.nom || user.email : 'Administrateur'} 👋
            </Typography>
            
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)', mb: 4, maxWidth: 600 }}>
              Gérez efficacement vos ressources humaines avec notre plateforme moderne et intuitive
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <Button 
                variant="contained" 
                size="large"
                sx={{ 
                  borderRadius: 3,
                  px: 4,
                  py: 1.5,
                  textTransform: 'none',
                  fontWeight: 'bold',
                  bgcolor: 'white',
                  color: '#667eea',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.9)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                  },
                  transition: 'all 0.3s ease'
                }}
                onClick={() => navigate("/statistiques/overview")}
              >
                Voir les statistiques
              </Button>
              
              <Button 
                variant="outlined" 
                size="large"
                sx={{ 
                  borderRadius: 3,
                  px: 4,
                  py: 1.5,
                  textTransform: 'none',
                  fontWeight: 'medium',
                  borderColor: 'rgba(255,255,255,0.5)',
                  color: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: 'rgba(255,255,255,0.1)'
                  }
                }}
                onClick={() => navigate("/employes")}
              >
                Voir les employés
              </Button>
            </Box>
          </Box>
          
          <Box 
            sx={{ 
              position: 'absolute', 
              top: -100, 
              right: -50, 
              width: 300, 
              height: 300, 
              borderRadius: '50%', 
              bgcolor: 'rgba(255,255,255,0.1)',
              zIndex: 1
            }} 
          />
          <Box 
            sx={{ 
              position: 'absolute', 
              bottom: -80, 
              right: 100, 
              width: 200, 
              height: 200, 
              borderRadius: '50%', 
              bgcolor: 'rgba(255,255,255,0.05)',
              zIndex: 1
            }} 
          />
        </Box>

        {/* Quick Actions */}
        <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'bold', color: 'text.primary', ml: -15 }}>
          Accès rapide
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 4, width: '1730px', ml: -15 }}>
          {navItems.map((item, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card 
                sx={{ 
                  borderRadius: 3,
                  boxShadow: '0 5px 20px rgba(0,0,0,0.08)',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: `0 15px 30px ${alpha(item.color, 0.3)}`,
                    borderColor: alpha(item.color, 0.3)
                  }
                }}
                onClick={() => navigate(item.path)}
              >
                <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box 
                      sx={{ 
                        width: 48, 
                        height: 48, 
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2,
                        bgcolor: alpha(item.color, 0.1),
                        color: item.color
                      }}
                    >
                      {item.icon}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                        {item.label}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Gérer les {item.label.toLowerCase()}
                      </Typography>
                    </Box>
                    <ChevronRightIcon sx={{ color: 'text.secondary' }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* About Application Section - Deux cartes côte à côte */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card 
              sx={{ 
                borderRadius: 3,
                boxShadow: '0 5px 20px rgba(0,0,0,0.08)',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                height: '100%'
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Box 
                    sx={{ 
                      width: 56, 
                      height: 56, 
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 3,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white'
                    }}
                  >
                    <BusinessIcon sx={{ fontSize: 28 }} />
                  </Box>
                  <Box>
                    <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Gestion RH - TVM
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                      Système moderne de gestion
                    </Typography>
                  </Box>
                </Box>
                
                <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
                  Bienvenue dans le <strong>Système de Gestion des Ressources Humaines</strong> conçu spécifiquement pour <strong>Televiziona Malagasy (TVM)</strong>, la première chaîne de télévision nationale de Madagascar.
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Cette plateforme intuitive permet une gestion centralisée des ressources humaines avec des outils avancés pour suivre les employés, gérer les départements, et optimiser les processus administratifs.
                </Typography>
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
          mt: 4,
          backgroundColor: 'white',
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="body2" color="text.secondary">
              © {new Date().getFullYear()} HR Management System. Tous droits réservés.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Développé pour TVM - ORTM Madagascar
            </Typography>
          </Box>
        </Container>
      </Paper>
    </Box>
  );
};

export default Home;