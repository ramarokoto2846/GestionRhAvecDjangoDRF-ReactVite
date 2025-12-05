import React from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, CircularProgress, Grid, MenuItem,
  Avatar, Box, Typography, Chip
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
  Badge as BadgeIcon
} from "@mui/icons-material";

// Définition des couleurs ORTM
const ORTM_COLORS = {
  primary: "#1B5E20",      // Vert ORTM
  secondary: "#F9A825",    // Jaune doré
  background: "#F5F5F5",   // Gris clair
  text: "#212121",         // Noir anthracite
  white: "#FFFFFF"         // Blanc
};

const PointageModal = ({
  open,
  editingPointage,
  formData,
  employes,
  actionLoading,
  onClose,
  onSubmit,
  onInputChange
}) => {
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
          boxShadow: '0 20px 60px rgba(27, 94, 32, 0.15)',
          overflow: 'hidden',
          border: `1px solid ${ORTM_COLORS.primary}33`
        } 
      }}
    >
      {/* En-tête avec dégradé ORTM */}
      <DialogTitle 
        sx={{ 
          background: `linear-gradient(135deg, ${ORTM_COLORS.primary} 0%, ${ORTM_COLORS.primary}DD 100%)`,
          color: ORTM_COLORS.white,
          py: 3,
          position: 'relative'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar 
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.2)',
              width: 48,
              height: 48
            }}
          >
            <AccessTimeIcon />
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight="600">
              {editingPointage ? "Modifier le pointage" : "Nouveau pointage"}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <form onSubmit={onSubmit}>
        <DialogContent sx={{ pt: 4, pb: 2 }}>
          <Grid container spacing={3}>
            {/* ID Pointage */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="ID Pointage"
                name="id_pointage"
                value={formData.id_pointage}
                onChange={onInputChange}
                required
                disabled={editingPointage !== null}
                InputProps={{
                  startAdornment: <BadgeIcon sx={{ mr: 1, color: ORTM_COLORS.primary }} />
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: ORTM_COLORS.white,
                    '&:hover fieldset': {
                      borderColor: ORTM_COLORS.primary,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: ORTM_COLORS.primary,
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: ORTM_COLORS.primary,
                  }
                }}
              />
            </Grid>

            {/* Sélection Employé */}
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Employé"
                name="employe"
                value={formData.employe}
                onChange={onInputChange}
                required
                disabled={employes.length === 0}
                InputProps={{
                  startAdornment: <PersonIcon sx={{ mr: 1, color: ORTM_COLORS.primary }} />
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: ORTM_COLORS.white,
                    '&:hover fieldset': {
                      borderColor: ORTM_COLORS.primary,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: ORTM_COLORS.primary,
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: ORTM_COLORS.primary,
                  }
                }}
              >
                {employes.length === 0 ? (
                  <MenuItem disabled>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon sx={{ color: ORTM_COLORS.primary }} />
                      <Typography>Aucun employé disponible</Typography>
                    </Box>
                  </MenuItem>
                ) : (
                  employes.map((employe) => (
                    <MenuItem key={employe.cin} value={employe.cin}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar 
                          sx={{ 
                            width: 32, 
                            height: 32,
                            bgcolor: ORTM_COLORS.primary,
                            fontSize: '0.875rem'
                          }}
                        >
                          {employe.prenom?.[0]}{employe.nom?.[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body1" fontWeight="500">
                            {`${employe.prenom || ""} ${employe.nom || ""}`}
                          </Typography>
                          <Typography variant="caption" sx={{ color: ORTM_COLORS.text }}>
                            {employe.titre === 'employe' ? employe.matricule : `Stagiaire (${employe.cin})`}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))
                )}
              </TextField>
            </Grid>

            {/* Date */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date de pointage"
                name="date_pointage"
                type="date"
                value={formData.date_pointage}
                onChange={onInputChange}
                required
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: <TodayIcon sx={{ mr: 1, color: ORTM_COLORS.primary }} />
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: ORTM_COLORS.white,
                    '&:hover fieldset': {
                      borderColor: ORTM_COLORS.primary,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: ORTM_COLORS.primary,
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: ORTM_COLORS.primary,
                  }
                }}
              />
            </Grid>

            {/* Heure d'Entrée */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Heure d'Entrée"
                name="heure_entree"
                type="time"
                value={formData.heure_entree}
                onChange={onInputChange}
                required
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: <LoginIcon sx={{ mr: 1, color: ORTM_COLORS.primary }} />
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: ORTM_COLORS.white,
                    '&:hover fieldset': {
                      borderColor: ORTM_COLORS.primary,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: ORTM_COLORS.primary,
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: ORTM_COLORS.primary,
                  }
                }}
              />
            </Grid>

            {/* Heure de Sortie */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Heure de Sortie"
                name="heure_sortie"
                type="time"
                value={formData.heure_sortie}
                onChange={onInputChange}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: <LogoutIcon sx={{ mr: 1, color: ORTM_COLORS.primary }} />
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: ORTM_COLORS.white,
                    '&:hover fieldset': {
                      borderColor: ORTM_COLORS.primary,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: ORTM_COLORS.primary,
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: ORTM_COLORS.primary,
                  }
                }}
              />
            </Grid>

            {/* Remarque */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Remarques"
                name="remarque"
                value={formData.remarque}
                onChange={onInputChange}
                multiline
                rows={3}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: ORTM_COLORS.white,
                    '&:hover fieldset': {
                      borderColor: ORTM_COLORS.primary,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: ORTM_COLORS.primary,
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: ORTM_COLORS.primary,
                  }
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>

        {/* Actions */}
        <DialogActions sx={{ p: 3, gap: 2, borderTop: `1px solid ${ORTM_COLORS.primary}33` }}>
          <Button 
            onClick={onClose} 
            disabled={actionLoading} 
            color="inherit"
            startIcon={<CloseIcon />}
            sx={{ 
              borderRadius: 2,
              px: 3,
              textTransform: 'none',
              fontWeight: 600,
              color: ORTM_COLORS.text,
              border: `1px solid ${ORTM_COLORS.primary}33`,
              '&:hover': {
                backgroundColor: `${ORTM_COLORS.primary}11`
              }
            }}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={actionLoading || !formData.id_pointage || !formData.employe || !formData.date_pointage || !formData.heure_entree || employes.length === 0}
            startIcon={actionLoading ? <CircularProgress size={16} sx={{ color: ORTM_COLORS.white }} /> : (editingPointage ? <EditIcon /> : <AddIcon />)}
            sx={{ 
              borderRadius: 2,
              px: 4,
              textTransform: 'none',
              fontWeight: 600,
              background: `linear-gradient(135deg, ${ORTM_COLORS.primary}, ${ORTM_COLORS.secondary})`,
              color: ORTM_COLORS.white,
              '&:hover': {
                background: `linear-gradient(135deg, ${ORTM_COLORS.primary}DD, ${ORTM_COLORS.secondary}DD)`,
              },
              '&:disabled': {
                background: `${ORTM_COLORS.primary}66`,
                color: ORTM_COLORS.white
              }
            }}
          >
            {actionLoading ? "Traitement..." : (editingPointage ? "Modifier" : "Créer")}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default PointageModal;