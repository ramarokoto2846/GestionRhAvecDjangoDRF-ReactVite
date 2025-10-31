import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  CircularProgress,
  Avatar,
  Box,
  IconButton
} from "@mui/material";
import {
  Business as BusinessIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Description as DescriptionIcon,
  Close as CloseIcon,
  Save as SaveIcon
} from "@mui/icons-material";

// Définition des couleurs ORTM
const ORTM_COLORS = {
  primary: "#1B5E20",      // Vert ORTM
  secondary: "#F9A825",    // Jaune doré
  background: "#F5F5F5",   // Gris clair
  text: "#212121",         // Noir anthracite
  white: "#FFFFFF"         // Blanc
};

const DepartementModal = ({
  open,
  onClose,
  editingDepartement,
  formData,
  setFormData,
  formErrors,
  onSubmit,
  processing = false
}) => {
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!processing) {
      onSubmit(e);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleClose = () => {
    if (!processing) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
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
            <BusinessIcon />
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight="600">
              {editingDepartement ? "Modifier le département" : "Nouveau département"}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <form onSubmit={handleFormSubmit}>
        <DialogContent sx={{ pt: 4, pb: 2 }}>
          <Grid container spacing={3}>

            {/* ID Département */}
            <Grid item xs={12} sm={6}  width={380}>
              <TextField
                fullWidth
                label="ID Département"
                name="id_departement"
                value={formData.id_departement || ""}
                onChange={(e) => handleInputChange("id_departement", e.target.value)}
                error={!!formErrors.id_departement}
                helperText={formErrors.id_departement}
                required
                disabled={editingDepartement != null || processing}
                placeholder="Ex: DEPT-001"
                InputProps={{
                  startAdornment: <BusinessIcon sx={{ mr: 1, color: ORTM_COLORS.primary }} />
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

            {/* Nom du Département */}
            <Grid item xs={12} sm={6}  width={380}>
              <TextField
                fullWidth
                label="Nom du Département"
                name="nom"
                value={formData.nom || ""}
                onChange={(e) => handleInputChange("nom", e.target.value)}
                error={!!formErrors.nom}
                helperText={formErrors.nom}
                required
                disabled={processing}
                placeholder="Ex: Ressources Humaines"
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

            {/* Responsable */}
            <Grid item xs={12} sm={6}  width={380}>
              <TextField
                fullWidth
                label="Responsable"
                name="responsable"
                value={formData.responsable || ""}
                onChange={(e) => handleInputChange("responsable", e.target.value)}
                error={!!formErrors.responsable}
                helperText={formErrors.responsable}
                required
                disabled={processing}
                placeholder="Ex: Jean Dupont"
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
              />
            </Grid>

            {/* Localisation */}
            <Grid item xs={12} sm={6}  width={380}>
              <TextField
                fullWidth
                label="Localisation"
                name="localisation"
                value={formData.localisation || ""}
                onChange={(e) => handleInputChange("localisation", e.target.value)}
                disabled={processing}
                placeholder="Ex: Bâtiment A, Étage 2"
                InputProps={{
                  startAdornment: <LocationIcon sx={{ mr: 1, color: ORTM_COLORS.primary }} />
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

            {/* Description */}
            <Grid item xs={12}  width={790}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description || ""}
                onChange={(e) => handleInputChange("description", e.target.value)}
                multiline
                rows={3}
                disabled={processing}
                placeholder="Description du département..."
                InputProps={{
                  startAdornment: <DescriptionIcon sx={{ mr: 1, mt: 1.5, alignSelf: 'flex-start', color: ORTM_COLORS.primary }} />
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

          </Grid>
        </DialogContent>

        {/* Actions */}
        <DialogActions sx={{ p: 3, gap: 2, borderTop: `1px solid ${ORTM_COLORS.primary}33` }}>
          <Button 
            onClick={handleClose} 
            disabled={processing} 
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
            disabled={processing || !formData.id_departement || !formData.nom || !formData.responsable}
            startIcon={processing ? <CircularProgress size={16} sx={{ color: ORTM_COLORS.white }} /> : <SaveIcon />}
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
            {processing ? "Traitement..." : (editingDepartement ? "Modifier" : "Créer")}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default DepartementModal;