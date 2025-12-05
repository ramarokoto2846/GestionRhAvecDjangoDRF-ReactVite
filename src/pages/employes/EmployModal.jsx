import React, { useMemo, useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  MenuItem,
  Button,
  Avatar,
  Box,
  Typography,
  CircularProgress,
  Chip,
  InputAdornment,
} from "@mui/material";
import {
  Badge as BadgeIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Work as WorkIcon,
  Business as BusinessIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  CreditCard as CinIcon,
} from "@mui/icons-material";

const ORTM_COLORS = {
  primary: "#1B5E20",
  secondary: "#F9A825",
  white: "#FFFFFF",
};

// === Composant CIN formaté par 3 ===
const FormattedCINInput = ({ value = "", onChange, error, disabled }) => {
  const [display, setDisplay] = useState("");

  const format = (val) => {
    const digits = val.replace(/\D/g, "").slice(0, 12);
    return digits.match(/.{1,3}/g)?.join(" ") || "";
  };

  useEffect(() => setDisplay(format(value)), [value]);

  const handleChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 12);
    setDisplay(format(raw));
    onChange({ target: { name: "cin", value: raw } });
  };

  return (
    <TextField
      fullWidth
      label="CIN *"
      value={display}
      onChange={handleChange}
      disabled={disabled}
      error={error || (value && value.length < 12)}
      helperText={error || (value && value.length < 12 ? "12 chiffres requis" : "Ex: 123 456 789 012")}
      placeholder="___ ___ ___ ___"
      inputProps={{
        maxLength: 15,
        style: { letterSpacing: "0.8em", fontFamily: "monospace", fontSize: "1.2rem", textAlign: "center" },
      }}
      InputProps={{
        startAdornment: <InputAdornment position="start"><CinIcon sx={{ color: ORTM_COLORS.primary }} /></InputAdornment>,
      }}
    />
  );
};

// === Composant Matricule formaté par 3 ===
const FormattedMatriculeInput = ({ value = "", onChange, error }) => {
  const [display, setDisplay] = useState("");

  const format = (val) => {
    const digits = val.replace(/\D/g, "").slice(0, 6);
    return digits.match(/.{1,3}/g)?.join(" ") || "";
  };

  useEffect(() => setDisplay(format(value)), [value]);

  const handleChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 6);
    setDisplay(format(raw));
    onChange({ target: { name: "matricule", value: raw } });
  };

  return (
    <TextField
      fullWidth
      label="Matricule *"
      value={display}
      onChange={handleChange}
      error={error || (value && value.length < 6)}
      helperText={error || (value && value.length < 6 ? "6 chiffres requis" : "Ex: 123 456")}
      placeholder="___ ___"
      inputProps={{
        maxLength: 7,
        style: { letterSpacing: "0.8em", fontFamily: "monospace", fontSize: "1.2rem", textAlign: "center" },
      }}
      InputProps={{
        startAdornment: <InputAdornment position="start"><BadgeIcon sx={{ color: ORTM_COLORS.primary }} /></InputAdornment>,
      }}
    />
  );
};

const EmployModal = ({
  openDialog,
  handleCloseDialog,
  editingEmploye,
  formData,
  errors = {},
  handleChange,
  handleSubmit,
  loading,
  departements = [],
}) => {
  const isStagiaire = formData.titre === "stagiaire";

  // Validation complète du formulaire
  const isFormValid = useMemo(() => {
    const base = 
      formData.titre &&
      formData.cin && formData.cin.length === 12 &&
      formData.nom?.trim() &&
      formData.prenom?.trim() &&
      formData.email?.trim() &&
      formData.poste?.trim() &&
      formData.departement;

    if (isStagiaire) return base;
    return base && formData.matricule && formData.matricule.length === 6;
  }, [formData, isStagiaire]);

  return (
    <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
      <DialogTitle sx={{ background: `linear-gradient(135deg, ${ORTM_COLORS.primary}, #2E7D32)`, color: "white", py: 3 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 56, height: 56 }}>
            {editingEmploye ? <EditIcon /> : <AddIcon />}
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight="bold">
              {editingEmploye ? "Modifier l'employé" : "Ajouter un nouvel employé"}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Champs avec * obligatoires
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent dividers sx={{ bgcolor: "#fafafa" }}>
          <Grid container spacing={3}>

            {/* Type de contrat */}
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth label="Type de contrat *" name="titre"
                value={formData.titre || "stagiaire"} onChange={handleChange} required>
                <MenuItem value="stagiaire">Stagiaire</MenuItem>
                <MenuItem value="employe">Employé Fixe</MenuItem>
              </TextField>
            </Grid>

            {/* CIN */}
            <Grid item xs={12} sm={6}>
              <FormattedCINInput
                value={formData.cin || ""}
                onChange={handleChange}
                error={!!errors.cin}
                disabled={!!editingEmploye}
              />
            </Grid>

            {/* Matricule – visible seulement pour employé fixe */}
            {!isStagiaire && (
              <Grid item xs={12} sm={6}>
                <FormattedMatriculeInput
                  value={formData.matricule || ""}
                  onChange={handleChange}
                  error={!!errors.matricule}
                />
              </Grid>
            )}

            {/* Nom & Prénom */}
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Nom *" name="nom" value={formData.nom || ""} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Prénom *" name="prenom" value={formData.prenom || ""} onChange={handleChange} required />
            </Grid>

            {/* Email */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label="Email *" name="email" type="email"
                value={formData.email || ""} onChange={handleChange} required
                InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon sx={{ color: ORTM_COLORS.primary }} /></InputAdornment> }}
              />
            </Grid>

            {/* Téléphone */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label="Téléphone" name="telephone"
                value={formData.telephone || ""} onChange={handleChange}
                InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon sx={{ color: ORTM_COLORS.primary }} /></InputAdornment> }}
              />
            </Grid>

            {/* Poste & Département */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label="Poste occupé *" name="poste"
                value={formData.poste || ""} onChange={handleChange} required
                InputProps={{ startAdornment: <InputAdornment position="start"><WorkIcon sx={{ color: ORTM_COLORS.primary }} /></InputAdornment> }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth label="Département *" name="departement"
                value={formData.departement || ""} onChange={handleChange} required
                InputProps={{ startAdornment: <InputAdornment position="start"><BusinessIcon sx={{ color: ORTM_COLORS.primary }} /></InputAdornment> }}>
                {departements.map(d => <MenuItem key={d.id_departement} value={d.id_departement}>{d.nom}</MenuItem>)}
              </TextField>
            </Grid>

            {/* Statut */}
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth label="Statut *" name="statut"
                value={formData.statut || "actif"} onChange={handleChange} required>
                <MenuItem value="actif"><CheckCircleIcon fontSize="small" sx={{ mr: 1, color: "success.main" }} /> Actif</MenuItem>
                <MenuItem value="inactif"><CancelIcon fontSize="small" sx={{ mr: 1, color: "error.main" }} /> Inactif</MenuItem>
              </TextField>
            </Grid>

          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 2, bgcolor: "background.paper" }}>
          <Button onClick={handleCloseDialog} disabled={loading} startIcon={<CloseIcon />}>
            Annuler
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !isFormValid}
            startIcon={loading ? <CircularProgress size={20} /> : editingEmploye ? <EditIcon /> : <AddIcon />}
            sx={{ bgcolor: ORTM_COLORS.primary, "&:hover": { bgcolor: "#1565c0" }, px: 4, fontWeight: "bold" }}
          >
            {loading ? "En cours..." : editingEmploye ? "Enregistrer" : "Créer l'employé"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EmployModal;