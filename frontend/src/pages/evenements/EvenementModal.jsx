import React, { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Grid, Avatar, Box, Typography,
  CircularProgress, Chip, Card, CardContent
} from "@mui/material";
import {
  Event as EventIcon,
  Title as TitleIcon,
  Description as DescriptionIcon,
  LocationOn as LocationIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Close as CloseIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon
} from "@mui/icons-material";
import { format, parseISO } from "date-fns";

import { createEvenement, updateEvenement } from "../../services/api";

// Définition des couleurs ORTM
const ORTM_COLORS = {
  primary: "#1B5E20",      // Vert ORTM
  secondary: "#F9A825",    // Jaune doré
  background: "#F5F5F5",   // Gris clair
  text: "#212121",         // Noir anthracite
  white: "#FFFFFF"         // Blanc
};

const EvenementModal = ({ open, onClose, evenement, onSave, showSnackbar }) => {
  const [formData, setFormData] = useState({
    id_evenement: "",
    titre: "",
    description: "",
    date_debut: "",
    date_fin: "",
    lieu: ""
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (evenement) {
      setFormData({
        id_evenement: evenement.id_evenement,
        titre: evenement.titre,
        description: evenement.description || "",
        date_debut: formatDateForInput(evenement.date_debut),
        date_fin: formatDateForInput(evenement.date_fin),
        lieu: evenement.lieu || ""
      });
    } else {
      setFormData({
        id_evenement: "",
        titre: "",
        description: "",
        date_debut: "",
        date_fin: "",
        lieu: ""
      });
    }
    setErrors({});
  }, [evenement, open]);

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = parseISO(dateString);
    return format(date, "yyyy-MM-dd'T'HH:mm");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.id_evenement) newErrors.id_evenement = "ID événement requis";
    if (!formData.titre) newErrors.titre = "Titre requis";
    if (!formData.date_debut) newErrors.date_debut = "Date de début requise";
    if (!formData.date_fin) newErrors.date_fin = "Date de fin requise";
    if (formData.date_debut && formData.date_fin && new Date(formData.date_debut) >= new Date(formData.date_fin)) {
      newErrors.date_fin = "La date de fin doit être postérieure à la date de début";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showSnackbar("Veuillez corriger les erreurs dans le formulaire.", "error");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
  
    setLoading(true);
    try {
      if (evenement) {
        await updateEvenement(evenement.id_evenement, formData);
        showSnackbar("Événement modifié avec succès", "success");
      } else {
        await createEvenement(formData);
        showSnackbar("Événement créé avec succès", "success");
      }
      
      onClose();
      onSave();
      
    } catch (error) {
      let errorMessage = error.message || "Erreur lors de l'opération.";
      if (error.response?.data) {
        const errors = error.response.data;
        errorMessage = Object.keys(errors)
          .map(key => `${key}: ${Array.isArray(errors[key]) ? errors[key].join(", ") : errors[key]}`)
          .join("; ");
      }
      showSnackbar(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  // Calcul de la durée de l'événement
  const calculateDuree = () => {
    if (formData.date_debut && formData.date_fin) {
      const start = new Date(formData.date_debut);
      const end = new Date(formData.date_fin);
      const diffTime = Math.abs(end - start);
      const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
      return diffHours;
    }
    return 0;
  };

  const dureeEvenement = calculateDuree();

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
            <EventIcon />
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight="600">
              {evenement ? "Modifier l'événement" : "Nouvel événement"}
            </Typography>
          </Box>
        </Box>
        
        {/* Badge durée si dates renseignées */}
        {dureeEvenement > 0 && (
          <Chip 
            icon={<ScheduleIcon />}
            label={`${dureeEvenement}h`}
            sx={{ 
              position: 'absolute',
              right: 100,
              top: '50%',
              transform: 'translateY(-50%)',
              color: ORTM_COLORS.white,
              fontWeight: '600',
              backgroundColor: ORTM_COLORS.secondary,
              '& .MuiChip-icon': { color: ORTM_COLORS.white }
            }}
          />
        )}
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 4, pb: 2 }}>
          <Grid container spacing={3}>
            {/* ID Événement */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="ID Événement"
                name="id_evenement"
                value={formData.id_evenement}
                onChange={handleInputChange}
                error={!!errors.id_evenement}
                helperText={errors.id_evenement}
                disabled={!!evenement}
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

            {/* Titre */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Titre de l'événement"
                name="titre"
                value={formData.titre}
                onChange={handleInputChange}
                error={!!errors.titre}
                helperText={errors.titre}
                required
                InputProps={{
                  startAdornment: <TitleIcon sx={{ mr: 1, color: ORTM_COLORS.primary }} />
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
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                multiline
                rows={3}
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

            {/* Dates et heures */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date et heure de début"
                name="date_debut"
                type="datetime-local"
                value={formData.date_debut}
                onChange={handleInputChange}
                error={!!errors.date_debut}
                helperText={errors.date_debut}
                InputLabelProps={{ shrink: true }}
                required
                InputProps={{
                  startAdornment: <ScheduleIcon sx={{ mr: 1, color: ORTM_COLORS.primary }} />
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

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date et heure de fin"
                name="date_fin"
                type="datetime-local"
                value={formData.date_fin}
                onChange={handleInputChange}
                error={!!errors.date_fin}
                helperText={errors.date_fin}
                InputLabelProps={{ shrink: true }}
                required
                InputProps={{
                  startAdornment: <ScheduleIcon sx={{ mr: 1, color: ORTM_COLORS.primary }} />
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

            {/* Lieu */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Lieu de l'événement"
                name="lieu"
                value={formData.lieu}
                onChange={handleInputChange}
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

            {/* Carte de résumé */}
            {(formData.date_debut && formData.date_fin) && (
              <Grid item xs={12}>
                <Card 
                  sx={{ 
                    backgroundColor: `${ORTM_COLORS.primary}11`,
                    borderRadius: 2,
                    border: `1px solid ${ORTM_COLORS.primary}33`
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ color: ORTM_COLORS.primary }} fontWeight="600">
                      Résumé de l'événement
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" sx={{ color: ORTM_COLORS.text }}>
                          Début
                        </Typography>
                        <Typography variant="body1" fontWeight="500">
                          {new Date(formData.date_debut).toLocaleString('fr-FR')}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" sx={{ color: ORTM_COLORS.text }}>
                          Fin
                        </Typography>
                        <Typography variant="body1" fontWeight="500">
                          {new Date(formData.date_fin).toLocaleString('fr-FR')}
                        </Typography>
                      </Grid>
                      {dureeEvenement > 0 && (
                        <Grid item xs={12}>
                          <Typography variant="body2" sx={{ color: ORTM_COLORS.text }}>
                            Durée totale
                          </Typography>
                          <Typography variant="body1" fontWeight="500" sx={{ color: ORTM_COLORS.primary }}>
                            {dureeEvenement} heure(s)
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </DialogContent>

        {/* Actions */}
        <DialogActions sx={{ p: 3, gap: 2, borderTop: `1px solid ${ORTM_COLORS.primary}33` }}>
          <Button 
            onClick={onClose} 
            color="inherit"
            disabled={loading}
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
            disabled={!formData.id_evenement || !formData.titre || !formData.date_debut || !formData.date_fin || loading}
            startIcon={loading ? <CircularProgress size={16} sx={{ color: ORTM_COLORS.white }} /> : (evenement ? <EditIcon /> : <AddIcon />)}
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
            {loading ? "Traitement..." : (evenement ? "Modifier" : "Créer")}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EvenementModal;