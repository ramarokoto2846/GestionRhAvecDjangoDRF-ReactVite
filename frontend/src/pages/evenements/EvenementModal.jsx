import React, { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Grid
} from "@mui/material";
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle>
        {evenement ? "Modifier l'événement" : "Nouvel événement"}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                margin="dense"
                label="ID Événement"
                name="id_evenement"
                value={formData.id_evenement}
                onChange={handleInputChange}
                error={!!errors.id_evenement}
                helperText={errors.id_evenement || "Entrez un ID unique"}
                disabled={!!evenement}
                inputProps={{ 
                  maxLength: 10,
                  autoComplete: "off"
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                margin="dense"
                label="Titre"
                name="titre"
                value={formData.titre}
                onChange={handleInputChange}
                error={!!errors.titre}
                helperText={errors.titre}
                required
              />
            </Grid>
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
              />
            </Grid>
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
                helperText={errors.date_debut}
                InputLabelProps={{ shrink: true }}
                required
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
                helperText={errors.date_fin}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                margin="dense"
                label="Lieu"
                name="lieu"
                value={formData.lieu}
                onChange={handleInputChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={onClose} color="inherit" disabled={loading}>
            Annuler
          </Button>
          <Button
            type="submit"
            variant="contained"
            sx={{ borderRadius: 2, px: 3, py: 1 }}
            disabled={!formData.id_evenement || !formData.titre || !formData.date_debut || !formData.date_fin || loading}
          >
            {evenement ? "Modifier" : "Créer"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EvenementModal;