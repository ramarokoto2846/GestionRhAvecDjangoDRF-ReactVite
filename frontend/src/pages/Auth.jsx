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
  useTheme,
  useMediaQuery,
  Grid
} from "@mui/material";
import { 
  Visibility, 
  VisibilityOff, 
  Person, 
  Email, 
  Lock,
  Business,
  AppRegistration,
  Login
} from "@mui/icons-material";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "#fff",
          confirmButtonColor: "#667eea",
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
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "#fff",
          confirmButtonColor: "#667eea",
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
        height: '95vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)',
        p: isMobile ? 1 : 2,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          width: '100%',
          height: '100%',
          backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.8) 0%, transparent 40%)',
          pointerEvents: 'none'
        }
      }}
    >
      {/* Formes décoratives avec les couleurs violet/bleu */}
      <Box
        sx={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)',
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
          background: 'linear-gradient(135deg, rgba(118, 75, 162, 0.2) 0%, rgba(102, 126, 234, 0.2) 100%)',
          filter: 'blur(40px)',
          animation: 'float 10s ease-in-out infinite'
        }}
      />
      
      <Fade in timeout={800}>
        <Grid 
          container 
          sx={{ 
            width: 1010,
            
            borderRadius: 3,
            boxShadow: '0 25px 50px rgba(102, 126, 234, 0.15)',
          }}
        >
          {/* Section de description (à gauche) - COULEURS VIOLET/BLEU */}
          <Grid 
            item
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              width: '500px',
              height: '765px',
              marginTop: '-59px',
              borderLeft: '2px solid white',
              borderBottom: '2px solid white',
              borderTop: '2px solid white',
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
                <Box sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 80,
                  height: 80,
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)',
                  mb: 2,
                  backdropFilter: 'blur(5px)'
                }}>
                  <Business 
                    sx={{ 
                      fontSize: 40, 
                      color: 'white'
                    }} 
                  />
                </Box>
                <Typography 
                  variant="h3" 
                  component="h1" 
                  gutterBottom 
                  sx={{ 
                    fontWeight: '700',
                    color: 'white',
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                  }}
                >
                  HR System
                </Typography>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.9)',
                    mb: 4,
                    fontWeight: 400
                  }}
                >
                  Système de Gestion des Ressources Humaines
                </Typography>
              </Box>

              <Box sx={{ mt: 4, p: 3, background: 'rgba(255, 255, 255, 0.15)', borderRadius: 2, backdropFilter: 'blur(5px)' }}>
                <Typography variant="body2" sx={{ color: 'white', fontStyle: 'italic', textAlign: 'center' }}>
                  "Une solution moderne pour gérer efficacement vos ressources humaines"
                </Typography>
              </Box>

              {/* Points forts */}
              <Box sx={{ mt: 4 }}>
                {[
                  "Gestion centralisée des employés",
                  "Suivi des pointages en temps réel",
                  "Gestion des congés et absences",
                  "Tableaux de bord personnalisés"
                ].map((feature, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'white', mr: 2 }} />
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                      {feature}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Grid>
          
          {/* Formulaire de connexion/inscription (à droite) */}
          <Grid 
            item 
            xs={12} 
            width={500}
            height={700}
            sx={{ 
              marginTop: '-60px',
            }}
          >
            <Paper 
              sx={{ 
                height: '100%', 
                p: isMobile ? 3 : 4, 
                borderRadius: 0,
                background: 'white',
                border: '1px solid rgba(226, 232, 240, 0.8)',
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
                  background: 'linear-gradient(90deg, #667eea, #764ba2)'
                }
              }}
            >
              {isMobile && (
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Box sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 70,
                    height: 70,
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    boxShadow: '0 8px 20px rgba(102, 126, 234, 0.4)',
                    mb: 2
                  }}>
                    <Business 
                      sx={{ 
                        fontSize: 35, 
                        color: 'white'
                      }} 
                    />
                  </Box>
                  <Typography 
                    variant="h4" 
                    component="h1" 
                    gutterBottom 
                    sx={{ 
                      fontWeight: '700',
                      background: 'linear-gradient(135deg, #667eea, #764ba2)',
                      backgroundClip: 'text',
                      textFillColor: 'transparent',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    HR System
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      mb: 2,
                      fontWeight: 500,
                    }}
                  >
                    Gestion des Ressources Humaines
                  </Typography>
                </Box>
              )}
              
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="h4" component="h2" sx={{ fontWeight: 600, color: '#1e293b', mb: 1 }}>
                  Bienvenue
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Connectez-vous pour accéder à votre espace
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
                    color: 'text.secondary',
                    borderRadius: 2,
                    mx: 0.5,
                    '&.Mui-selected': {
                      color: '#667eea',
                    }
                  },
                  '& .MuiTabs-indicator': {
                    height: 3,
                    borderRadius: 2,
                    background: 'linear-gradient(90deg, #667eea, #764ba2)'
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
                    background: 'rgba(102, 126, 234, 0.1)',
                    color: '#667eea',
                    border: '1px solid rgba(102, 126, 234, 0.2)',
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
                              <Person sx={{ color: '#667eea' }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            transition: 'all 0.3s ease',
                            '&:hover fieldset': {
                              borderColor: '#667eea',
                            },
                            '&.Mui-focused fieldset': {
                              borderWidth: 2,
                              borderColor: '#667eea',
                              boxShadow: '0 0 0 4px rgba(102, 126, 234, 0.1)'
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
                              <Email sx={{ color: '#667eea' }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            transition: 'all 0.3s ease',
                            '&:hover fieldset': {
                              borderColor: '#667eea',
                            },
                            '&.Mui-focused fieldset': {
                              borderWidth: 2,
                              borderColor: '#667eea',
                              boxShadow: '0 0 0 4px rgba(102, 126, 234, 0.1)'
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
                              <Lock sx={{ color: '#667eea' }} />
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
                              borderColor: '#667eea',
                            },
                            '&.Mui-focused fieldset': {
                              borderWidth: 2,
                              borderColor: '#667eea',
                              boxShadow: '0 0 0 4px rgba(102, 126, 234, 0.1)'
                            }
                          }
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
                              <Lock sx={{ color: '#667eea' }} />
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
                              borderColor: '#667eea',
                            },
                            '&.Mui-focused fieldset': {
                              borderWidth: 2,
                              borderColor: '#667eea',
                              boxShadow: '0 0 0 4px rgba(102, 126, 234, 0.1)'
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
                          background: 'linear-gradient(135deg, #667eea, #764ba2)',
                          boxShadow: '0 6px 15px rgba(102, 126, 234, 0.4)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 10px 20px rgba(102, 126, 234, 0.5)',
                            background: 'linear-gradient(135deg, #5a67d8, #6b46c1)',
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
                      <Typography variant="body2" color="text.secondary" sx={{ px: 2, background: 'white' }}>
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
                        color: '#667eea',
                        borderColor: '#667eea',
                        '&:hover': {
                          borderColor: '#5a67d8',
                          backgroundColor: 'rgba(102, 126, 234, 0.04)'
                        }
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
                              <Email sx={{ color: '#667eea' }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            transition: 'all 0.3s ease',
                            '&:hover fieldset': {
                              borderColor: '#667eea',
                            },
                            '&.Mui-focused fieldset': {
                              borderWidth: 2,
                              borderColor: '#667eea',
                              boxShadow: '0 0 0 4px rgba(102, 126, 234, 0.1)'
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
                              <Lock sx={{ color: '#667eea' }} />
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
                              borderColor: '#667eea',
                            },
                            '&.Mui-focused fieldset': {
                              borderWidth: 2,
                              borderColor: '#667eea',
                              boxShadow: '0 0 0 4px rgba(102, 126, 234, 0.1)'
                            }
                          }
                        }}
                      />
                      <Box sx={{ textAlign: 'right', mt: 1 }}>
                        <Button 
                          size="small" 
                          sx={{ 
                            color: '#667eea', 
                            textTransform: 'none',
                            fontWeight: 500,
                            '&:hover': {
                              backgroundColor: 'rgba(102, 126, 234, 0.04)'
                            }
                          }}
                        >
                          Mot de passe oublié ?
                        </Button>
                      </Box>
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
                          background: 'linear-gradient(135deg, #667eea, #764ba2)',
                          boxShadow: '0 6px 15px rgba(102, 126, 234, 0.4)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 10px 20px rgba(102, 126, 234, 0.5)',
                            background: 'linear-gradient(135deg, #5a67d8, #6b46c1)',
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
                      <Typography variant="body2" color="text.secondary" sx={{ px: 2, background: 'white' }}>
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
                        color: '#667eea',
                        borderColor: '#667eea',
                        '&:hover': {
                          borderColor: '#5a67d8',
                          backgroundColor: 'rgba(102, 126, 234, 0.04)'
                        }
                      }}
                      onClick={() => setTab(0)}
                    >
                      S'inscrire
                    </Button>
                  </Box>
                </Fade>
              )}
            </Paper>
          </Grid>
        </Grid>
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