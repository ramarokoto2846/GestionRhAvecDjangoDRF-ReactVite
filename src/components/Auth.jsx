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
  Divider
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

  const handleClickShowPassword = () => setShowPassword(!showPassword);
  const handleClickShowConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);

  // Inscription
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, nom })
      });

      if (response.ok) {
        Swal.fire("Succès", "Compte créé avec succès !", "success");
        setTab(1);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || errorData.email?.[0] || errorData.password?.[0] || "Erreur lors de la création du compte");
      }
    } catch (err) {
      setError("Impossible de se connecter au serveur");
    } finally {
      setLoading(false);
    }
  };

  // Connexion
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch('http://localhost:8000/api/token/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        localStorage.setItem('user_email', email);

        // Récupération du nom
        try {
          const userRes = await fetch('http://localhost:8000/api/users/me/', {
            headers: { Authorization: `Bearer ${data.access}` }
          });
          if (userRes.ok) {
            const userData = await userRes.json();
            localStorage.setItem('user_name', userData.nom || userData.email);
          }
        } catch (err) {
          console.error(err);
        }

        Swal.fire("Succès", "Connexion réussie !", "success");
        setIsAuthenticated(true);
        navigate("/statistiques/overview");
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Email ou mot de passe incorrect");
      }
    } catch (err) {
      setError("Impossible de se connecter au serveur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Fade in timeout={800}>
        <Box sx={{ width: { xs: '100%', sm: 400 }, p: 3 }}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <img src={ortmLogo} alt="ORTM Logo" style={{ maxWidth: 200, marginBottom: 16 }} />
              <Typography variant="h5" gutterBottom>
                Bienvenue
              </Typography>
              <Typography variant="body1">
                {tab === 0 ? "Créez votre compte" : "Connectez-vous à votre espace"}
              </Typography>
            </Box>

            <Tabs value={tab} onChange={handleTabChange} centered sx={{ mb: 3 }}>
              <Tab icon={<AppRegistration />} label="Inscription" />
              <Tab icon={<Login />} label="Connexion" />
            </Tabs>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* Formulaire Inscription */}
            {tab === 0 && (
              <Box component="form" onSubmit={handleRegister}>
                <TextField label="Nom" fullWidth margin="normal" value={nom} onChange={e => setNom(e.target.value)} required disabled={loading}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Person /></InputAdornment> }} />
                <TextField label="Email" type="email" fullWidth margin="normal" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Email /></InputAdornment> }} />
                <TextField label="Mot de passe" type={showPassword ? "text" : "password"} fullWidth margin="normal" value={password} onChange={e => setPassword(e.target.value)} required disabled={loading}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Lock /></InputAdornment>,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={handleClickShowPassword}>{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton>
                      </InputAdornment>
                    )
                  }} />
                <TextField label="Confirmer le mot de passe" type={showConfirmPassword ? "text" : "password"} fullWidth margin="normal" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required disabled={loading}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Lock /></InputAdornment>,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={handleClickShowConfirmPassword}>{showConfirmPassword ? <VisibilityOff /> : <Visibility />}</IconButton>
                      </InputAdornment>
                    )
                  }} />
                <Button type="submit" variant="contained" fullWidth sx={{ mt: 3 }} disabled={loading}>
                  {loading ? "Création..." : "Créer un compte"}
                </Button>
                <Divider sx={{ my: 2 }}>ou</Divider>
                <Button fullWidth onClick={() => setTab(1)}>Se connecter</Button>
              </Box>
            )}

            {/* Formulaire Connexion */}
            {tab === 1 && (
              <Box component="form" onSubmit={handleLogin}>
                <TextField label="Email" type="email" fullWidth margin="normal" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Email /></InputAdornment> }} />
                <TextField label="Mot de passe" type={showPassword ? "text" : "password"} fullWidth margin="normal" value={password} onChange={e => setPassword(e.target.value)} required disabled={loading}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Lock /></InputAdornment>,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={handleClickShowPassword}>{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton>
                      </InputAdornment>
                    )
                  }} />
                <Button type="submit" variant="contained" fullWidth sx={{ mt: 3 }} disabled={loading}>
                  {loading ? "Connexion..." : "Se connecter"}
                </Button>
                <Divider sx={{ my: 2 }}>ou</Divider>
                <Button fullWidth onClick={() => setTab(0)}>S'inscrire</Button>
              </Box>
            )}
          </Paper>
        </Box>
      </Fade>
    </Box>
  );
};

export default Auth;