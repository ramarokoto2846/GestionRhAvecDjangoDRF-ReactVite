import React, { useState } from "react";
import { 
  Tabs, 
  Tab, 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  Alert,
  Fade,
  InputAdornment,
  IconButton,
  Divider,
  alpha
} from "@mui/material";
import { 
  Visibility, 
  VisibilityOff, 
  Person, 
  Email, 
  Lock,
  AppRegistration,
  Login
} from "@mui/icons-material";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

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

const Auth = ({ setIsAuthenticated }) => {
  const [tab, setTab] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nom, setNom] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setNom("");
    setError("");
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleClickShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Inscription avec l'API Django
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
          nom: nom
        })
      });

      if (response.ok) {
        const data = await response.json();
        Swal.fire({
          title: "Succès",
          text: "Compte créé avec succès !",
          icon: "success",
          background: `linear-gradient(135deg, ${ORTM_COLORS.primary} 0%, ${ORTM_COLORS.accent} 100%)`,
          color: "#fff",
          confirmButtonColor: ORTM_COLORS.secondary,
          confirmButtonText: "Continuer",
          customClass: {
            popup: 'swal-popup-custom'
          }
        });
        setTab(1); // Passer à l'onglet de connexion
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.detail || 
                            errorData.email?.[0] || 
                            errorData.password?.[0] || 
                            "Erreur lors de la création du compte";
        setError(errorMessage);
      }
    } catch (error) {
      setError("Impossible de se connecter au serveur");
    } finally {
      setLoading(false);
    }
  };

  // Connexion avec l'API Django
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch('http://localhost:8000/api/token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password
        })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        localStorage.setItem('user_email', email);
        
        // Récupérer les informations utilisateur
        try {
          const userResponse = await fetch('http://localhost:8000/api/users/me/', {
            headers: {
              'Authorization': `Bearer ${data.access}`
            }
          });
          
          if (userResponse.ok) {
            const userData = await userResponse.json();
            localStorage.setItem('user_name', userData.nom || userData.email);
          }
        } catch (userError) {
          console.error("Erreur lors de la récupération des infos utilisateur:", userError);
        }
        
        Swal.fire({
          title: "Succès",
          text: "Connexion réussie !",
          icon: "success",
          background: `linear-gradient(135deg, ${ORTM_COLORS.primary} 0%, ${ORTM_COLORS.accent} 100%)`,
          color: "#fff",
          confirmButtonColor: ORTM_COLORS.secondary,
          confirmButtonText: "Accéder au tableau de bord",
          customClass: {
            popup: 'swal-popup-custom'
          }
        });
        setIsAuthenticated(true);
        navigate("/home");
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.detail || "Email ou mot de passe incorrect";
        setError(errorMessage);
      }
    } catch (error) {
      setError("Impossible de se connecter au serveur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        border: '0.2px solid gray',
        margin: 0,
        background: `linear-gradient(135deg, ${ORTM_COLORS.background} 0%, ${alpha(ORTM_COLORS.primary, 0.1)} 100%)`,
        position: 'relative',
        overflow: 'hidden',
        height: '935px',
      }}
    >
      {/* Formes décoratives avec les couleurs ORTM */}
      <Box
        sx={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${alpha(ORTM_COLORS.primary, 0.1)} 0%, ${alpha(ORTM_COLORS.accent, 0.1)} 100%)`,
          filter: 'blur(40px)',
          animation: 'float 8s ease-in-out infinite'
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '-10%',
          left: '-5%',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${alpha(ORTM_COLORS.secondary, 0.1)} 0%, ${alpha(ORTM_COLORS.primary, 0.1)} 100%)`,
          filter: 'blur(40px)',
          animation: 'float 10s ease-in-out infinite'
        }}
      />
      
      <Fade in timeout={800}>
        <Box 
          sx={{ 
            display: 'flex',
            width: { xs: '100%', md: 1000 },
            height: '800px',
            boxShadow: '0 25px 50px rgba(27, 94, 32, 0.15)',
            overflow: 'hidden',
            flexDirection: { xs: 'column', md: 'row' }
          }}
        >
          {/* Section de description (à gauche) - COULEURS ORTM */}
          <Box
            sx={{
              background: `linear-gradient(135deg, ${ORTM_COLORS.primary} 0%, ${ORTM_COLORS.accent} 100%)`,
              display: 'flex',
              width: { xs: '100%', md: '500px' },
              minHeight: { xs: '300px', md: 'auto' },
              flexDirection: 'column',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.1\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                opacity: 0.3
              }
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1, p: 4}}>
              <Box sx={{ textAlign: 'center'}}>
                {/* Logo ORTM */}
                <Box sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: { xs: 250, md: 300 },
                  height: { xs: 80, md: 100 },
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)',
                  mb: 3,
                  backdropFilter: 'blur(5px)',
                  p: 2
                }}>
                  <img 
                    src={ortmLogo} 
                    alt="ORTM Logo" 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'contain'
                    }} 
                  />
                </Box>
                
                <Typography 
                  variant="h4" 
                  component="h1" 
                  gutterBottom 
                  sx={{ 
                    fontWeight: '700',
                    color: 'white',
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    mb: 1,
                    fontSize: { xs: '1.5rem', md: '2rem' }
                  }}
                >
                  Office de la Radio et de la Télévision de Madagascar
                </Typography>
                
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.9)',
                    mb: 4,
                    fontWeight: 400,
                    fontSize: { xs: '0.9rem', md: '1rem' }
                  }}
                >
                  Plateforme de gestion des ressources humaines
                </Typography>
              </Box>

              <Box sx={{ mt: 4, p: 3, background: 'rgba(255, 255, 255, 0.15)', borderRadius: 2, backdropFilter: 'blur(5px)' }}>
                <Typography variant="body2" sx={{ color: 'white', fontStyle: 'italic', textAlign: 'center' }}>
                  "Une solution moderne pour la gestion efficace des ressources humaines."
                </Typography>
              </Box>

              {/* Points forts */}
              <Box sx={{ mt: 4, display: { xs: 'none', md: 'block' } }}>
                {[
                  "Gestion centralisée des employés ORTM",
                  "Suivi des pointages en temps réel", 
                  "Gestion des congés et absences",
                  "Administration des départements",
                  "Tableaux de bord personnalisés",
                  "Sécurité et confidentialité des données"
                ].map((feature, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      backgroundColor: ORTM_COLORS.secondary, 
                      mr: 2,
                      flexShrink: 0
                    }} />
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.85rem' }}>
                      {feature}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
          
          {/* Formulaire de connexion/inscription (à droite) */}
          <Box 
            sx={{ 
              width: { xs: '100%', md: 500 },
              minHeight: { xs: '500px', md: 'auto' }
            }}
          >
            <Paper 
              sx={{ 
                height: '100%', 
                p: { xs: 3, md: 4 }, 
                borderRadius: 0,
                background: ORTM_COLORS.surface,
                border: `1px solid ${alpha(ORTM_COLORS.primary, 0.1)}`,
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 6,
                  background: `linear-gradient(90deg, ${ORTM_COLORS.primary}, ${ORTM_COLORS.accent})`
                }
              }}
            >
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="h4" component="h2" sx={{ fontWeight: 600, color: ORTM_COLORS.text.primary, mb: 1 }}>
                  Bienvenue
                </Typography>
                <Typography variant="body1" sx={{ color: ORTM_COLORS.text.secondary }}>
                  {tab === 0 ? "Créez votre compte" : "Connectez-vous à votre espace"}
                </Typography>
              </Box>
              
              <Tabs 
                value={tab} 
                onChange={handleTabChange} 
                centered 
                sx={{ 
                  mb: 3,
                  '& .MuiTab-root': {
                    fontWeight: 600,
                    fontSize: '1rem',
                    textTransform: 'none',
                    minWidth: 120,
                    color: ORTM_COLORS.text.secondary,
                    borderRadius: 2,
                    mx: 0.5,
                    '&.Mui-selected': {
                      color: ORTM_COLORS.primary,
                    }
                  },
                  '& .MuiTabs-indicator': {
                    height: 3,
                    borderRadius: 2,
                    background: `linear-gradient(90deg, ${ORTM_COLORS.primary}, ${ORTM_COLORS.accent})`
                  }
                }}
              >
                <Tab icon={<AppRegistration sx={{ fontSize: 20, mb: 0.5 }} />} iconPosition="start" label="Inscription" />
                <Tab icon={<Login sx={{ fontSize: 20, mb: 0.5 }} />} iconPosition="start" label="Connexion" />
              </Tabs>

              {error && (
                <Alert 
                  severity="error" 
                  sx={{ 
                    mb: 3, 
                    borderRadius: 2,
                    alignItems: 'center',
                    background: `${ORTM_COLORS.primary}11`,
                    color: ORTM_COLORS.primary,
                    border: `1px solid ${ORTM_COLORS.primary}33`,
                    '& .MuiAlert-message': {
                      padding: '4px 0'
                    }
                  }}
                >
                  {error}
                </Alert>
              )}

              {tab === 0 && (
                <Fade in timeout={500}>
                  <Box>
                    <form onSubmit={handleRegister}>
                      <TextField 
                        label="Nom complet" 
                        fullWidth 
                        margin="normal" 
                        value={nom} 
                        onChange={e => setNom(e.target.value)}
                        required
                        disabled={loading}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Person sx={{ color: ORTM_COLORS.primary }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            transition: 'all 0.3s ease',
                            '&:hover fieldset': {
                              borderColor: ORTM_COLORS.primary,
                            },
                            '&.Mui-focused fieldset': {
                              borderWidth: 2,
                              borderColor: ORTM_COLORS.primary,
                              boxShadow: `0 0 0 4px ${ORTM_COLORS.primary}11`
                            }
                          }
                        }}
                      />
                      <TextField 
                        label="Email" 
                        type="email"
                        fullWidth 
                        margin="normal" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)}
                        required
                        disabled={loading}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Email sx={{ color: ORTM_COLORS.primary }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            transition: 'all 0.3s ease',
                            '&:hover fieldset': {
                              borderColor: ORTM_COLORS.primary,
                            },
                            '&.Mui-focused fieldset': {
                              borderWidth: 2,
                              borderColor: ORTM_COLORS.primary,
                              boxShadow: `0 0 0 4px ${ORTM_COLORS.primary}11`
                            }
                          }
                        }}
                      />
                      <TextField 
                        label="Mot de passe" 
                        type={showPassword ? "text" : "password"}
                        fullWidth 
                        margin="normal" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)}
                        required
                        disabled={loading}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Lock sx={{ color: ORTM_COLORS.primary }} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label="toggle password visibility"
                                onClick={handleClickShowPassword}
                                edge="end"
                                size="small"
                              >
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            transition: 'all 0.3s ease',
                            '&:hover fieldset': {
                              borderColor: ORTM_COLORS.primary,
                            },
                            '&.Mui-focused fieldset': {
                              borderWidth: 2,
                              borderColor: ORTM_COLORS.primary,
                              boxShadow: `0 0 0 4px ${ORTM_COLORS.primary}11`
                            }
                          },
                        }}
                      />
                      <TextField 
                        label="Confirmer le mot de passe" 
                        type={showConfirmPassword ? "text" : "password"}
                        fullWidth 
                        margin="normal" 
                        value={confirmPassword} 
                        onChange={e => setConfirmPassword(e.target.value)}
                        required
                        disabled={loading}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Lock sx={{ color: ORTM_COLORS.primary }} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label="toggle confirm password visibility"
                                onClick={handleClickShowConfirmPassword}
                                edge="end"
                                size="small"
                              >
                                {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            transition: 'all 0.3s ease',
                            '&:hover fieldset': {
                              borderColor: ORTM_COLORS.primary,
                            },
                            '&.Mui-focused fieldset': {
                              borderWidth: 2,
                              borderColor: ORTM_COLORS.primary,
                              boxShadow: `0 0 0 4px ${ORTM_COLORS.primary}11`
                            }
                          }
                          
                        }}
                      />
                      <Button 
                        type="submit" 
                        variant="contained" 
                        fullWidth 
                        sx={{ 
                          mt: 3, 
                          py: 1.5,
                          borderRadius: 2,
                          fontSize: '1rem',
                          fontWeight: 600,
                          textTransform: 'none',
                          background: `linear-gradient(135deg, ${ORTM_COLORS.primary}, ${ORTM_COLORS.accent})`,
                          boxShadow: `0 6px 15px ${alpha(ORTM_COLORS.primary, 0.4)}`,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: `0 10px 20px ${alpha(ORTM_COLORS.primary, 0.6)}`,
                            background: `linear-gradient(135deg, ${alpha(ORTM_COLORS.primary, 0.9)}, ${alpha(ORTM_COLORS.accent, 0.9)})`,
                          },
                          '&:active': {
                            transform: 'translateY(0)',
                          }
                        }} 
                        disabled={loading}
                      >
                        {loading ? "Création..." : "Créer un compte"}
                      </Button>
                    </form>
                    <Divider sx={{ my: 3 }}>
                      <Typography variant="body2" sx={{ px: 2, background: ORTM_COLORS.surface, color: ORTM_COLORS.text.secondary }}>
                        Vous avez déjà un compte ?
                      </Typography>
                    </Divider>
                    <Button 
                      variant="outlined" 
                      fullWidth 
                      sx={{ 
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        py: 1.5,
                        color: ORTM_COLORS.primary,
                        borderColor: ORTM_COLORS.primary,
                        '&:hover': {
                          borderColor: ORTM_COLORS.accent,
                          backgroundColor: `${ORTM_COLORS.primary}11`,
                          transform: 'translateY(-1px)'
                        },
                        transition: 'all 0.3s ease'
                      }}
                      onClick={() => setTab(1)}
                    >
                      Se connecter
                    </Button>
                  </Box>
                </Fade>
              )}

              {tab === 1 && (
                <Fade in timeout={500}>
                  <Box>
                    <form onSubmit={handleLogin}>
                      <TextField 
                        label="Email" 
                        type="email"
                        fullWidth 
                        margin="normal" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)}
                        required
                        disabled={loading}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Email sx={{ color: ORTM_COLORS.primary }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            transition: 'all 0.3s ease',
                            '&:hover fieldset': {
                              borderColor: ORTM_COLORS.primary,
                            },
                            '&.Mui-focused fieldset': {
                              borderWidth: 2,
                              borderColor: ORTM_COLORS.primary,
                              boxShadow: `0 0 0 4px ${ORTM_COLORS.primary}11`
                            }
                          }
                        }}
                      />
                      <TextField 
                        label="Mot de passe" 
                        type={showPassword ? "text" : "password"}
                        fullWidth 
                        margin="normal" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)}
                        required
                        disabled={loading}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Lock sx={{ color: ORTM_COLORS.primary }} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label="toggle password visibility"
                                onClick={handleClickShowPassword}
                                edge="end"
                                size="small"
                              >
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            transition: 'all 0.3s ease',
                            '&:hover fieldset': {
                              borderColor: ORTM_COLORS.primary,
                            },
                            '&.Mui-focused fieldset': {
                              borderWidth: 2,
                              borderColor: ORTM_COLORS.primary,
                              boxShadow: `0 0 0 4px ${ORTM_COLORS.primary}11`
                            }
                          }
                        }}
                      />
          
                      <Button 
                        type="submit" 
                        variant="contained" 
                        fullWidth 
                        sx={{ 
                          mt: 3, 
                          py: 1.5,
                          borderRadius: 2,
                          fontSize: '1rem',
                          fontWeight: 600,
                          textTransform: 'none',
                          background: `linear-gradient(135deg, ${ORTM_COLORS.primary}, ${ORTM_COLORS.accent})`,
                          boxShadow: `0 6px 15px ${alpha(ORTM_COLORS.primary, 0.4)}`,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: `0 10px 20px ${alpha(ORTM_COLORS.primary, 0.6)}`,
                            background: `linear-gradient(135deg, ${alpha(ORTM_COLORS.primary, 0.9)}, ${alpha(ORTM_COLORS.accent, 0.9)})`,
                          },
                          '&:active': {
                            transform: 'translateY(0)',
                          }
                        }} 
                        disabled={loading}
                      >
                        {loading ? "Connexion..." : "Se connecter"}
                      </Button>
                    </form>
                    <Divider sx={{ my: 3 }}>
                      <Typography variant="body2" sx={{ px: 2, background: ORTM_COLORS.surface, color: ORTM_COLORS.text.secondary }}>
                        Pas encore de compte ?
                      </Typography>
                    </Divider>
                    <Button 
                      variant="outlined" 
                      fullWidth 
                      sx={{ 
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        py: 1.5,
                        color: ORTM_COLORS.primary,
                        borderColor: ORTM_COLORS.primary,
                        '&:hover': {
                          borderColor: ORTM_COLORS.accent,
                          backgroundColor: `${ORTM_COLORS.primary}11`,
                          transform: 'translateY(-1px)'
                        },
                        transition: 'all 0.3s ease'
                      }}
                      onClick={() => setTab(0)}
                    >
                      S'inscrire
                    </Button>
                  </Box>
                </Fade>
              )}
            </Paper>
          </Box>
        </Box>
      </Fade>

      {/* Ajout de styles d'animation */}
      <style>
        {`
          @keyframes float {
            0% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(5deg); }
            100% { transform: translateY(0px) rotate(0deg); }
          }
          .swal-popup-custom {
            border-radius: 16px;
            overflow: hidden;
          }
        `}
      </style>
    </Box>
  );
};

export default Auth;