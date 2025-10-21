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

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "";
    const date = parseISO(dateString);
    return format(date, "dd/MM/yyyy à HH:mm");
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
          background: 'linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          overflow: 'hidden'
        } 
      }}
    >
      {/* En-tête avec dégradé */}
      <DialogTitle 
        sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
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
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
              {evenement ? "Mettez à jour les détails de l'événement" : "Planifiez un nouvel événement"}
            </Typography>
          </Box>
        </Box>
        
        {/* Badge durée si dates renseignées */}
        {dureeEvenement > 0 && (
          <Chip 
            icon={<ScheduleIcon />}
            label={`${dureeEvenement}h`}
            color="primary"
            sx={{ 
              position: 'absolute',
              right: 100,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'white',
              fontWeight: '600',
              '& .MuiChip-icon': { color: 'white' }
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
                margin="dense"
                label="ID Événement"
                name="id_evenement"
                value={formData.id_evenement}
                onChange={handleInputChange}
                error={!!errors.id_evenement}
                helperText={errors.id_evenement || "Identifiant unique de l'événement"}
                disabled={!!evenement}
                inputProps={{ 
                  maxLength: 10,
                  autoComplete: "off"
                }}
                InputProps={{
                  startAdornment: <EventIcon color="action" sx={{ mr: 1 }} />
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    backgroundColor: 'white',
                    '&:hover fieldset': {
                      borderColor: '#667eea',
                    },
                  }
                }}
              />
            </Grid>

            {/* Titre */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                margin="dense"
                label="Titre de l'événement"
                name="titre"
                value={formData.titre}
                onChange={handleInputChange}
                error={!!errors.titre}
                helperText={errors.titre || "Titre descriptif de l'événement"}
                required
                InputProps={{
                  startAdornment: <TitleIcon color="action" sx={{ mr: 1 }} />
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    backgroundColor: 'white',
                    '&:hover fieldset': {
                      borderColor: '#667eea',
                    },
                  }
                }}
              />
            </Grid>

            {/* Description */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                margin="dense"
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                multiline
                rows={3}
                placeholder="Décrivez l'événement, son objectif, son programme..."
                InputProps={{
                  startAdornment: <DescriptionIcon color="action" sx={{ mr: 1, mt: 1.5, alignSelf: 'flex-start' }} />
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    backgroundColor: 'white',
                    '&:hover fieldset': {
                      borderColor: '#667eea',
                    },
                  }
                }}
              />
            </Grid>

            {/* Dates et heures */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                margin="dense"
                label="Date et heure de début"
                name="date_debut"
                type="datetime-local"
                value={formData.date_debut}
                onChange={handleInputChange}
                error={!!errors.date_debut}
                helperText={errors.date_debut || "Date et heure de commencement"}
                InputLabelProps={{ shrink: true }}
                required
                InputProps={{
                  startAdornment: <ScheduleIcon color="action" sx={{ mr: 1 }} />
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    backgroundColor: 'white',
                    '&:hover fieldset': {
                      borderColor: '#667eea',
                    },
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                margin="dense"
                label="Date et heure de fin"
                name="date_fin"
                type="datetime-local"
                value={formData.date_fin}
                onChange={handleInputChange}
                error={!!errors.date_fin}
                helperText={errors.date_fin || "Date et heure de clôture"}
                InputLabelProps={{ shrink: true }}
                required
                InputProps={{
                  startAdornment: <ScheduleIcon color="action" sx={{ mr: 1 }} />
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    backgroundColor: formData.date_fin ? '#f0fff4' : 'white',
                    '&:hover fieldset': {
                      borderColor: formData.date_fin ? '#10b981' : '#667eea',
                    },
                  }
                }}
              />
            </Grid>

            {/* Lieu */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                margin="dense"
                label="Lieu de l'événement"
                name="lieu"
                value={formData.lieu}
                onChange={handleInputChange}
                placeholder="Ex: Salle de conférence, Adresse précise..."
                InputProps={{
                  startAdornment: <LocationIcon color="action" sx={{ mr: 1 }} />
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    backgroundColor: 'white',
                    '&:hover fieldset': {
                      borderColor: '#667eea',
                    },
                  }
                }}
              />
            </Grid>

            {/* Carte de résumé */}
            {(formData.date_debut && formData.date_fin) && (
              <Grid item xs={12}>
                <Card 
                  sx={{ 
                    backgroundColor: 'rgba(255,255,255,0.8)', 
                    borderRadius: 3,
                    border: '2px dashed',
                    borderColor: 'primary.light'
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary" fontWeight="600">
                      📅 Résumé de l'événement
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Début
                        </Typography>
                        <Typography variant="body1" fontWeight="500">
                          {new Date(formData.date_debut).toLocaleString('fr-FR')}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Fin
                        </Typography>
                        <Typography variant="body1" fontWeight="500">
                          {new Date(formData.date_fin).toLocaleString('fr-FR')}
                        </Typography>
                      </Grid>
                      {dureeEvenement > 0 && (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">
                            Durée totale
                          </Typography>
                          <Typography variant="body1" fontWeight="500" color="success.main">
                            {dureeEvenement} heure(s)
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Badges d'information */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip 
                  icon={<EventIcon />}
                  label={evenement ? "Événement existant" : "Nouvel événement"}
                  color={evenement ? "primary" : "success"}
                  variant="outlined"
                />
                {formData.lieu && (
                  <Chip 
                    icon={<LocationIcon />}
                    label={`Lieu: ${formData.lieu}`}
                    color="info"
                    variant="outlined"
                    size="small"
                  />
                )}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>

        {/* Actions */}
        <DialogActions sx={{ p: 3, gap: 2, background: 'rgba(255,255,255,0.6)' }}>
          <Button 
            onClick={onClose} 
            color="inherit"
            disabled={loading}
            startIcon={<CloseIcon />}
            sx={{ 
              borderRadius: 3, 
              px: 3,
              py: 1,
              border: '1px solid #ddd',
              '&:hover': {
                backgroundColor: 'rgba(0,0,0,0.04)'
              }
            }}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!formData.id_evenement || !formData.titre || !formData.date_debut || !formData.date_fin || loading}
            startIcon={loading ? <CircularProgress size={16} /> : (evenement ? <EditIcon /> : <AddIcon />)}
            sx={{ 
              borderRadius: 3, 
              px: 4, 
              py: 1,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
              '&:hover': {
                boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
                transform: 'translateY(-1px)'
              },
              '&:disabled': {
                background: 'grey.300'
              },
              transition: 'all 0.3s ease'
            }}
          >
            {loading ? "Traitement..." : (evenement ? "Modifier" : "Créer l'événement")}
          </Button>
        </DialogActions>
      </form>

      {/* Overlay de chargement */}
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
            borderRadius: '16px',
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={60} thickness={4} />
            <Typography variant="h6" sx={{ mt: 2, color: 'text.primary' }}>
              {evenement ? "Mise à jour..." : "Création..."}
            </Typography>
          </Box>
        </Box>
      )}
    </Dialog>
  );
};

export default EvenementModal;