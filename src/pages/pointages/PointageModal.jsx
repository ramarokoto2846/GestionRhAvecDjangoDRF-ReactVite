import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
  Grid,
  MenuItem,
  Avatar,
  Box,
  Typography,
  Chip,
  Alert,
  AlertTitle,
} from "@mui/material";
import {
  AccessTime as AccessTimeIcon,
  Person as PersonIcon,
  Today as TodayIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Close as CloseIcon,
  Badge as BadgeIcon,
  WarningAmber as WarningIcon,
} from "@mui/icons-material";

// Couleurs ORTM
const ORTM_COLORS = {
  primary: "#1B5E20",
  secondary: "#F9A825",
  background: "#F5F5F5",
  text: "#212121",
  white: "#FFFFFF",
};

const PointageModal = ({
  open,
  editingPointage,
  formData,
  employes,
  actionLoading,
  onClose,
  onSubmit,
  onInputChange,
}) => {
  // Détecte si la date sélectionnée est dans le futur
  const [isFutureDate, setIsFutureDate] = useState(false);

  useEffect(() => {
    if (formData.date_pointage) {
      const selected = new Date(formData.date_pointage);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // On compare uniquement la date du jour
      setIsFutureDate(selected > today);
    } else {
      setIsFutureDate(false);
    }
  }, [formData.date_pointage]);

  // Le bouton sera désactivé si date future
  const isSubmitDisabled =
    actionLoading ||
    !formData.id_pointage ||
    !formData.employe ||
    !formData.date_pointage ||
    !formData.heure_entree ||
    employes.length === 0 ||
    isFutureDate; // Bloque si date dans le futur

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          background: ORTM_COLORS.white,
          boxShadow: "0 20px 60px rgba(27, 94, 32, 0.15)",
          overflow: "hidden",
          border: `1px solid ${ORTM_COLORS.primary}33`,
        },
      }}
    >
      <DialogTitle
        sx={{
          background: `linear-gradient(135deg, ${ORTM_COLORS.primary} 0%, ${ORTM_COLORS.primary}DD 100%)`,
          color: ORTM_COLORS.white,
          py: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 48, height: 48 }}>
            <AccessTimeIcon />
          </Avatar>
          <Typography variant="h5" fontWeight="600">
            {editingPointage ? "Modifier le pointage" : "Nouveau pointage"}
          </Typography>
        </Box>
      </DialogTitle>

      <form onSubmit={onSubmit}>
        <DialogContent sx={{ pt: 4, pb: 2 }}>
          {/* Alerte globale si date future */}
          {isFutureDate && (
            <Alert severity="error" icon={<WarningIcon />} sx={{ mb: 3, borderRadius: 2 }}>
              <AlertTitle>Date invalide</AlertTitle>
              Vous ne pouvez pas créer ou modifier un pointage avec une date dans le futur.
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* ID Pointage */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="ID Pointage"
                name="id_pointage"
                value={formData.id_pointage || ""}
                onChange={onInputChange}
                required
                disabled={!!editingPointage}
                InputProps={{
                  startAdornment: <BadgeIcon sx={{ mr: 1, color: ORTM_COLORS.primary }} />,
                }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />
            </Grid>

            {/* Employé */}
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Employé"
                name="employe"
                value={formData.employe || ""}
                onChange={onInputChange}
                required
                disabled={employes.length === 0}
                InputProps={{
                  startAdornment: <PersonIcon sx={{ mr: 1, color: ORTM_COLORS.primary }} />,
                }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              >
                {employes.length === 0 ? (
                  <MenuItem disabled>Aucun employé</MenuItem>
                ) : (
                  employes.map((e) => (
                    <MenuItem key={e.cin} value={e.cin}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: ORTM_COLORS.primary, fontSize: "0.875rem" }}>
                          {e.prenom?.[0]}{e.nom?.[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body1" fontWeight="500">
                            {e.prenom} {e.nom}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {e.titre === "employe" ? e.matricule : `Stagiaire (${e.cin})`}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))
                )}
              </TextField>
            </Grid>

            {/* Date de pointage - avec mise en évidence rouge si futur */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date de pointage"
                name="date_pointage"
                type="date"
                value={formData.date_pointage || ""}
                onChange={onInputChange}
                required
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <TodayIcon sx={{ mr: 1, color: isFutureDate ? "#d32f2f" : ORTM_COLORS.primary }} />
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    "& fieldset": {
                      borderColor: isFutureDate ? "#d32f2f" : undefined,
                      borderWidth: isFutureDate ? 2 : 1,
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: isFutureDate ? "#d32f2f" : ORTM_COLORS.primary,
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: isFutureDate ? "#d32f2f" : undefined,
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: isFutureDate ? "#d32f2f" : ORTM_COLORS.primary,
                  },
                }}
              />

              {/* Message d'erreur sous le champ */}
              {isFutureDate && (
                <Box sx={{ mt: 1 }}>
                  <Chip
                    icon={<WarningIcon />}
                    label="Date future interdite"
                    color="error"
                    size="small"
                    sx={{ fontWeight: 600, height: 32 }}
                  />
                </Box>
              )}
            </Grid>

            {/* Heure entrée */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Heure d'Entrée"
                name="heure_entree"
                type="time"
                value={formData.heure_entree || ""}
                onChange={onInputChange}
                required
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: <LoginIcon sx={{ mr: 1, color: ORTM_COLORS.primary }} />,
                }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />
            </Grid>

            {/* Heure sortie */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Heure de Sortie"
                name="heure_sortie"
                type="time"
                value={formData.heure_sortie || ""}
                onChange={onInputChange}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: <LogoutIcon sx={{ mr: 1, color: ORTM_COLORS.primary }} />,
                }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />
            </Grid>

            {/* Remarque */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Remarques"
                name="remarque"
                value={formData.remarque || ""}
                onChange={onInputChange}
                multiline
                rows={3}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 2, borderTop: `1px solid ${ORTM_COLORS.primary}33` }}>
          <Button
            onClick={onClose}
            disabled={actionLoading}
            startIcon={<CloseIcon />}
            sx={{
              borderRadius: 2,
              px: 3,
              textTransform: "none",
              fontWeight: 600,
              border: `1px solid ${ORTM_COLORS.primary}33`,
            }}
          >
            Annuler
          </Button>

          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitDisabled} // Désactivé si date future
            startIcon={
              actionLoading ? (
                <CircularProgress size={16} sx={{ color: ORTM_COLORS.white }} />
              ) : editingPointage ? (
                <EditIcon />
              ) : (
                <AddIcon />
              )
            }
            sx={{
              borderRadius: 2,
              px: 4,
              textTransform: "none",
              fontWeight: 600,
              background: `linear-gradient(135deg, ${ORTM_COLORS.primary}, ${ORTM_COLORS.secondary})`,
              "&:hover": {
                background: `linear-gradient(135deg, ${ORTM_COLORS.primary}DD, ${ORTM_COLORS.secondary}DD)`,
              },
              "&:disabled": {
                background: "#9e9e9e",
                color: "#ccc",
              },
            }}
          >
            {actionLoading ? "Traitement..." : editingPointage ? "Modifier" : "Créer"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default PointageModal;