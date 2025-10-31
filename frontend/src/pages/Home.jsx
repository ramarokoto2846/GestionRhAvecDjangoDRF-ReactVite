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
  TrendingUp as TrendingUpIcon,
  BeachAccess as BeachAccessIcon,
  Apartment as ApartmentIcon
} from "@mui/icons-material";
import { getCurrentUser } from "../services/api";
import Header from "../components/Header";

// Palette de couleurs ORTM améliorée
const ORTM_COLORS = {
  primary: "#1B5E20",           // Vert ORTM principal
  secondary: "#F9A825",         // Jaune doré
  accent: "#1565C0",            // Bleu pour les actions
  background: "#F8F9FA",        // Gris très clair
  surface: "#FFFFFF",           // Blanc
  text: {
    primary: "#1A237E",         // Bleu foncé
    secondary: "#546E7A",       // Gris bleu
    light: "#78909C"           // Gris clair
  }
};

// Import du logo ORTM
import ortmLogo from "../components/ortm.webp";

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
    { icon: <ApartmentIcon />, label: "Départements", path: "/departements", color: ORTM_COLORS.accent },
    { icon: <PeopleIcon />, label: "Employés", path: "/employes", color: ORTM_COLORS.primary },
    { icon: <TimeIcon />, label: "Pointages", path: "/pointages", color: ORTM_COLORS.secondary },
    { icon: <BeachAccessIcon />, label: "Congés", path: "/conges", color: "#D32F2F" },
    { icon: <EventIcon />, label: "Événements", path: "/evenements", color: "#7B1FA2" }
  ];

  const drawer = (
    <Box sx={{ 
      width: 280, 
      background: `linear-gradient(180deg, ${ORTM_COLORS.primary} 0%, ${alpha(ORTM_COLORS.accent, 0.9)} 100%)`,
      height: '100%',
      color: 'white'
    }}>
      <Box sx={{ p: 3, textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'white', mb: 1 }}>
          ORTM - RHM System
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
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
          <ListItemIcon sx={{ color: ORTM_COLORS.secondary, minWidth: 40 }}>
            <TrendingUpIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Statistiques" 
            primaryTypographyProps={{ fontSize: '0.95rem', fontWeight: 500 }}
          />
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
            <ListItemIcon sx={{ color: ORTM_COLORS.secondary, minWidth: 40 }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.label} 
              primaryTypographyProps={{ fontSize: '0.95rem', fontWeight: 500 }}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: ORTM_COLORS.background }}>
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
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: 280,
            background: `linear-gradient(180deg, ${ORTM_COLORS.primary} 0%, ${alpha(ORTM_COLORS.accent, 0.9)} 100%)`
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Espace pour compenser la Header fixe */}
      <Toolbar />

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ py: isMobile ? 2 : 4, px: isMobile ? 2 : 3, flex: 1 }}>
        {/* Welcome Section avec logo ORTM à droite */}
        <Box 
          sx={{ 
            background: `linear-gradient(135deg, ${ORTM_COLORS.primary} 0%, ${alpha(ORTM_COLORS.accent, 0.9)} 100%)`,
            borderRadius: 4,
            mb: 4,
            p: isMobile ? 3 : 4,
            position: 'relative',
            overflow: 'hidden',
            color: 'white',
            boxShadow: '0 20px 40px rgba(27, 94, 32, 0.3)'
          }}
        >
          <Grid container spacing={3} alignItems="center">
            {/* Partie texte à gauche */}
            <Grid item xs={12} md={8}>
              <Box sx={{ position: 'relative', zIndex: 2 }}>
                <Chip 
                  label="Espace administrateur ORTM" 
                  size="small" 
                  sx={{ 
                    mb: 2, 
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontWeight: 'bold',
                    backdropFilter: 'blur(10px)',
                    fontSize: '0.75rem'
                  }} 
                />
                
                <Typography variant={isMobile ? "h4" : "h3"} component="h1" gutterBottom sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
                  Bienvenue, {user ? user.nom || user.email : 'Administrateur'} 👋
                </Typography>
                
                <Typography variant={isMobile ? "body1" : "h6"} sx={{ color: 'rgba(255,255,255,0.9)', mb: 4, maxWidth: 600 }}>
                  Gérez efficacement vos ressources humaines avec notre plateforme moderne et institutionnelle
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
                      bgcolor: ORTM_COLORS.secondary,
                      color: ORTM_COLORS.text.primary,
                      fontSize: '1rem',
                      '&:hover': {
                        bgcolor: alpha(ORTM_COLORS.secondary, 0.9),
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
                      fontSize: '1rem',
                      '&:hover': {
                        borderColor: ORTM_COLORS.secondary,
                        bgcolor: 'rgba(249, 168, 37, 0.1)',
                        transform: 'translateY(-2px)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                    onClick={() => navigate("/employes")}
                  >
                    Voir les employés
                  </Button>
                </Box>
              </Box>
            </Grid>

            {/* Partie logo à droite */}
            <Grid item xs={12} md={4}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  height: '100%',
                  position: 'relative',
                  
                  width: '700px',
                  zIndex: 2
                }}
              >
                <Box 
                  sx={{ 
                    width: '700px',
                    height: { xs: 150, md: 200 },
                    display: 'flex',
                    alignItems: 'center',
                    
                    justifyContent: 'center',
                    background: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    p: 3,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)'
                    }
                  }}
                >
                  <img 
                    src={ortmLogo} 
                    alt="ORTM Logo" 
                    style={{ 
                      width: '600px', 
                      height: '150px', 
                      margin: 0,
                      objectFit: 'contain',
                      filter: 'brightness(1.1) contrast(1.1)'
                    }} 
                  />
                </Box>
              </Box>
            </Grid>
          </Grid>
          
          {/* Éléments décoratifs */}
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

        {/* Quick Actions - Style original amélioré */}
        <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'bold', color: ORTM_COLORS.text.primary }}>
          Accès rapide
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {navItems.map((item, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card 
                sx={{ 
                  borderRadius: 3,
                  width: 275,
                  height: 120,
                  boxShadow: '0 5px 20px rgba(0,0,0,0.08)',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  bgcolor: ORTM_COLORS.surface,
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
                      <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', color: ORTM_COLORS.text.primary }}>
                        {item.label}
                      </Typography>
                      <Typography variant="body2" sx={{ color: ORTM_COLORS.text.secondary }}>
                        Gérer les {item.label.toLowerCase()}
                      </Typography>
                    </Box>
                    <ChevronRightIcon sx={{ color: ORTM_COLORS.text.secondary }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Section Fonctionnalités (remplace l'ancienne section À propos) */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card 
              sx={{ 
                borderRadius: 3,
                boxShadow: '0 5px 20px rgba(0,0,0,0.08)',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                height: '100%',
                bgcolor: ORTM_COLORS.surface,
                background: `linear-gradient(135deg, ${ORTM_COLORS.surface} 0%, ${alpha(ORTM_COLORS.background, 0.5)} 100%)`
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', mb: 3, color: ORTM_COLORS.text.primary }}>
                  À propos du système
                </Typography>
                
                <Typography variant="body1" sx={{ color: ORTM_COLORS.text.secondary, mb: 3, lineHeight: 1.6 }}>
                  Le <strong style={{ color: ORTM_COLORS.primary }}>Système de Gestion des Ressources Humaines</strong> est une plateforme institutionnelle conçue spécifiquement pour l'<strong>Office de Radiodiffusion et Télévision de Madagascar (ORTM)</strong>.
                </Typography>
                
                <Typography variant="body1" sx={{ color: ORTM_COLORS.text.secondary, lineHeight: 1.6 }}>
                  Cette solution moderne permet une gestion centralisée et optimisée des ressources humaines, offrant des outils adaptés pour le suivi des employés, la gestion des départements, et l'optimisation des processus administratifs.
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
          backgroundColor: ORTM_COLORS.surface,
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          background: `linear-gradient(135deg, ${ORTM_COLORS.surface} 0%, ${alpha(ORTM_COLORS.background, 0.5)} 100%)`
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="body2" color={ORTM_COLORS.text.secondary} sx={{ fontWeight: 500 }}>
              © {new Date().getFullYear()} HR Management System. Tous droits réservés.
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <img 
                src={ortmLogo} 
                alt="ORTM Logo" 
                style={{ 
                  width: 20, 
                  height: 20, 
                  objectFit: 'contain'
                }} 
              />
              <Typography variant="body2" color={ORTM_COLORS.text.secondary} sx={{ fontWeight: 500 }}>
                Développé pour ORTM Madagascar
              </Typography>
            </Box>
          </Box>
        </Container>
      </Paper>
    </Box>
  );
};

export default Home;