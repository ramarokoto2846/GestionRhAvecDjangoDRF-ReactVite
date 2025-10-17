import React from "react";
import {
  DialogContent,
  DialogActions,
  Grid,
  IconButton,
  styled,
  CircularProgress,
  Box,
  Typography // ← AJOUT CRITIQUE ICI
} from "@mui/material";
import {
  Close as CloseIcon,
  Save as SaveIcon
} from "@mui/icons-material";
import {
  Dialog,
  DialogTitle,
  TextField,
  Button
} from "@mui/material";

// --- Styled Components ---
const ModernDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialog-paper": {
    borderRadius: 16,
    background: "linear-gradient(145deg, #ffffff, #f0f4f8)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    overflow: "hidden",
    minWidth: 500,
  },
  "& .MuiBackdrop-root": {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
}));

const ModernDialogTitle = styled(DialogTitle)(({ theme }) => ({
  background: theme.palette.primary.main,
  color: "white",
  padding: theme.spacing(2, 3),
  fontWeight: "bold",
  fontSize: "1.5rem",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  "& .MuiIconButton-root": {
    color: "white",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
  },
}));

const ModernTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: 12,
    transition: "all 0.3s ease",
    background: "rgba(255, 255, 255, 0.9)",
    "&:hover": {
      background: "rgba(255, 255, 255, 1)",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    },
    "&.Mui-focused": {
      boxShadow: `0 0 0 3px ${theme.palette.primary.main}20`,
    },
    "&.Mui-disabled": {
      background: "rgba(0, 0, 0, 0.04)",
      color: "rgba(0, 0, 0, 0.38)",
    },
  },
  "& .MuiInputLabel-root": {
    fontWeight: 500,
    color: theme.palette.text.secondary,
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: theme.palette.primary.main,
  },
  "& .MuiFormHelperText-root": {
    marginLeft: 0,
  },
}));

const ModernButton = styled(Button)(({ theme }) => ({
  borderRadius: 12,
  padding: theme.spacing(1, 3),
  fontWeight: "bold",
  textTransform: "none",
  fontSize: "1rem",
  minWidth: 120,
  transition: "all 0.3s ease",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
  },
  "&:disabled": {
    transform: "none",
    boxShadow: "none",
    opacity: 0.6,
  },
}));

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
    console.log("📝 Formulaire soumis:", formData);
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
    <ModernDialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown={processing}
    >
      <ModernDialogTitle>
        {editingDepartement ? "Modifier le Département" : "Nouveau Département"}
        <IconButton 
          onClick={handleClose} 
          disabled={processing}
          size="large"
        >
          <CloseIcon />
        </IconButton>
      </ModernDialogTitle>
      
      <form onSubmit={handleFormSubmit}>
        <DialogContent sx={{ p: 3 }}>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <ModernTextField
                fullWidth
                label="ID Département *"
                name="id_departement"
                value={formData.id_departement || ""}
                onChange={(e) => handleInputChange("id_departement", e.target.value)}
                error={!!formErrors.id_departement}
                helperText={formErrors.id_departement || "Identifiant unique du département"}
                required
                disabled={editingDepartement != null || processing}
                placeholder="Ex: DEPT-001"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <ModernTextField
                fullWidth
                label="Nom du Département *"
                name="nom"
                value={formData.nom || ""}
                onChange={(e) => handleInputChange("nom", e.target.value)}
                error={!!formErrors.nom}
                helperText={formErrors.nom || "Nom complet du département"}
                required
                disabled={processing}
                placeholder="Ex: Ressources Humaines"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <ModernTextField
                fullWidth
                label="Responsable *"
                name="responsable"
                value={formData.responsable || ""}
                onChange={(e) => handleInputChange("responsable", e.target.value)}
                error={!!formErrors.responsable}
                helperText={formErrors.responsable || "Nom du responsable"}
                required
                disabled={processing}
                placeholder="Ex: Jean Dupont"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <ModernTextField
                fullWidth
                label="Nombre d'employés"
                value={formData.nbr_employe || 0}
                InputProps={{
                  readOnly: true,
                }}
                disabled
                helperText="Calculé automatiquement"
              />
            </Grid>
            
            <Grid item xs={12}>
              <ModernTextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description || ""}
                onChange={(e) => handleInputChange("description", e.target.value)}
                multiline
                rows={3}
                disabled={processing}
                placeholder="Description des missions du département..."
                helperText="Optionnel"
              />
            </Grid>
            
            <Grid item xs={12}>
              <ModernTextField
                fullWidth
                label="Localisation"
                name="localisation"
                value={formData.localisation || ""}
                onChange={(e) => handleInputChange("localisation", e.target.value)}
                disabled={processing}
                placeholder="Ex: Bâtiment A, Étage 2"
                helperText="Optionnel"
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <ModernButton
            onClick={handleClose}
            color="inherit"
            variant="outlined"
            disabled={processing}
            sx={{ flex: 1 }}
            type="button"
          >
            Annuler
          </ModernButton>
          
          <ModernButton
            type="submit"
            variant="contained"
            color="primary"
            disabled={processing}
            startIcon={
              processing ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <SaveIcon />
              )
            }
            sx={{ flex: 1 }}
          >
            {processing ? (
              "Traitement..."
            ) : editingDepartement ? (
              "Mettre à jour"
            ) : (
              "Enregistrer"
            )}
          </ModernButton>
        </DialogActions>
      </form>
      
      {/* Overlay de chargement */}
      {processing && (
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
              Traitement en cours...
            </Typography>
          </Box>
        </Box>
      )}
    </ModernDialog>
  );
};

export default DepartementModal;