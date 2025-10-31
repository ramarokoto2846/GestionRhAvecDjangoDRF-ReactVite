import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  CircularProgress,
  Box,
  Avatar,
  Chip
} from "@mui/material";
import {
  Event as EventIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Close as CloseIcon
} from "@mui/icons-material";

// Définition des couleurs ORTM
const ORTM_COLORS = {
  primary: "#1B5E20",      // Vert ORTM
  secondary: "#F9A825",    // Jaune doré
  background: "#F5F5F5",   // Gris clair
  text: "#212121",         // Noir anthracite
  white: "#FFFFFF"         // Blanc
};

const CongeModal = ({
  open,
  onClose,
  editingConge,
  formData,
  employes,
  actionLoading,
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
            {editingConge ? <EditIcon /> : <AddIcon />}
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight="600">
              {editingConge ? "Modifier le congé" : "Nouveau congé"}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <form onSubmit={onSubmit}>
        <DialogContent sx={{ pt: 4, pb: 2 }}>
          <Grid container spacing={3}>

            {/* ID Congé */}
            <Grid item xs={12} sm={6}  width={380}>
              <TextField
                fullWidth
                label="ID Congé"
                name="id_conge"
                value={formData.id_conge}
                onChange={onInputChange}
                required
                disabled={editingConge !== null}
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
            <Grid item xs={12} sm={6}  width={380}>
              <FormControl 
                fullWidth 
                required
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
                <InputLabel id="employe-label">Employé</InputLabel>
                <Select
                  labelId="employe-label"
                  name="employe"
                  value={formData.employe || ''}
                  onChange={onInputChange}
                  disabled={employes.length === 0}
                  label="Employé"
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
                      <MenuItem key={employe.matricule} value={employe.matricule}>
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
                              {employe.matricule}
                            </Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Grid>

            {/* Dates */}
            <Grid item xs={12} sm={6}  width={380}>
              <TextField
                fullWidth
                label="Date Début"
                name="date_debut"
                type="date"
                value={formData.date_debut}
                onChange={onInputChange}
                required
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: <EventIcon sx={{ mr: 1, color: ORTM_COLORS.primary }} />
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

            <Grid item xs={12} sm={6}  width={380}>
              <TextField
                fullWidth
                label="Date Fin"
                name="date_fin"
                type="date"
                value={formData.date_fin}
                onChange={onInputChange}
                required
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: <EventIcon sx={{ mr: 1, color: ORTM_COLORS.primary }} />
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

            {/* Motif */}
            <Grid item xs={12}  width={380}>
              <TextField
                fullWidth
                label="Motif du congé"
                name="motif"
                value={formData.motif}
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

            {/* Raison du refus (conditionnel) */}
            {editingConge && (
              <Grid item xs={12}  width={380}>
                <TextField
                  fullWidth
                  label="Raison du Refus"
                  name="motif_refus"
                  value={formData.motif_refus}
                  onChange={onInputChange}
                  multiline
                  rows={3}
                  disabled={editingConge?.statut !== "refuse"}
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
            )}
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
            disabled={actionLoading || !formData.id_conge || !formData.employe || !formData.date_debut || !formData.date_fin || employes.length === 0}
            startIcon={actionLoading ? <CircularProgress size={16} sx={{ color: ORTM_COLORS.white }} /> : (editingConge ? <EditIcon /> : <AddIcon />)}
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
            {actionLoading ? "Traitement..." : (editingConge ? "Modifier" : "Créer")}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CongeModal;