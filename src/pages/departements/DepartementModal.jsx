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
} from "@mui/material";
import {
  Business as BusinessIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Description as DescriptionIcon,
  Close as CloseIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import Swal from "sweetalert2";

const ORTM_COLORS = {
  primary: "#1B5E20",
  secondary: "#F9A825",
  white: "#FFFFFF",
};

const DepartementModal = ({
  open,
  onClose,
  editingDepartement,
  formData,
  setFormData,
  formErrors,
  onSubmit,
  processing = false,
}) => {
  // Vérifie si tous les champs obligatoires sont remplis
  const isFormValid =
    formData.id_departement?.trim() &&
    formData.nom?.trim() &&
    formData.responsable?.trim();

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!isFormValid || processing) return;

    try {
      await onSubmit(e);
      // Succès → on ferme tout seul (tu gères déjà ça dans le parent)
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);

      let errorMessage = "Une erreur inconnue est survenue";

      if (error.response?.status === 400) {
        const data = error.response.data;

        if (data.nom) {
          errorMessage = `Ce nom de département existe déjà !`;
        } else if (data.id_departement) {
          errorMessage = `Cet ID département existe déjà !`;
        } else if (typeof data === "string") {
          errorMessage = data;
        } else {
          errorMessage = Object.values(data).flat().join("<br>");
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      // SweetAlert2 belle et claire
      Swal.fire({
        icon: "error",
        title: editingDepartement ? "Échec de la modification" : "Échec de la création",
        html: errorMessage,
        confirmButtonColor: ORTM_COLORS.primary,
        background: "#fff",
        backdrop: "rgba(0,0,0,0.7)",
      });
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleClose = () => {
    if (!processing) onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          background: `linear-gradient(135deg, ${ORTM_COLORS.primary} 0%, ${ORTM_COLORS.primary}DD 100%)`,
          color: "white",
          py: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 48, height: 48 }}>
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
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="ID Département *"
                value={formData.id_departement || ""}
                onChange={(e) => handleInputChange("id_departement", e.target.value)}
                error={!!formErrors.id_departement}
                helperText={formErrors.id_departement || "Ex: DEPT-001"}
                required
                disabled={!!editingDepartement || processing}
                placeholder="DEPT-001"
                InputProps={{
                  startAdornment: <BusinessIcon sx={{ mr: 1, color: ORTM_COLORS.primary }} />,
                }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />
            </Grid>

            {/* Nom du Département */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nom du Département *"
                value={formData.nom || ""}
                onChange={(e) => handleInputChange("nom", e.target.value)}
                error={!!formErrors.nom}
                helperText={formErrors.nom || "Ex: Ressources Humaines"}
                required
                disabled={processing}
                placeholder="Ressources Humaines"
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />
            </Grid>

            {/* Responsable */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Responsable *"
                value={formData.responsable || ""}
                onChange={(e) => handleInputChange("responsable", e.target.value)}
                error={!!formErrors.responsable}
                helperText={formErrors.responsable || "Ex: Jean Dupont"}
                required
                disabled={processing}
                placeholder="Jean Dupont"
                InputProps={{
                  startAdornment: <PersonIcon sx={{ mr: 1, color: ORTM_COLORS.primary }} />,
                }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />
            </Grid>

            {/* Localisation */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Localisation"
                value={formData.localisation || ""}
                onChange={(e) => handleInputChange("localisation", e.target.value)}
                disabled={processing}
                placeholder="Bâtiment A, Étage 2"
                InputProps={{
                  startAdornment: <LocationIcon sx={{ mr: 1, color: ORTM_COLORS.primary }} />,
                }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />
            </Grid>

            {/* Description */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description || ""}
                onChange={(e) => handleInputChange("description", e.target.value)}
                multiline
                rows={3}
                disabled={processing}
                placeholder="Description du département..."
                InputProps={{
                  startAdornment: (
                    <DescriptionIcon
                      sx={{ mr: 1, mt: 1.5, alignSelf: "flex-start", color: ORTM_COLORS.primary }}
                    />
                  ),
                }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />
            </Grid>

          </Grid>
        </DialogContent>

        {/* Boutons */}
        <DialogActions sx={{ p: 3, gap: 2, borderTop: `1px solid ${ORTM_COLORS.primary}33` }}>
          <Button
            onClick={handleClose}
            disabled={processing}
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
            disabled={processing || !isFormValid} // Le bouton reste désactivé tant que tout n’est pas rempli
            startIcon={processing ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            sx={{
              borderRadius: 2,
              px: 4,
              textTransform: "none",
              fontWeight: 600,
              background: `linear-gradient(135deg, ${ORTM_COLORS.primary}, ${ORTM_COLORS.secondary})`,
              color: "white",
              "&:hover": {
                background: `linear-gradient(135deg, ${ORTM_COLORS.primary}DD, ${ORTM_COLORS.secondary}DD)`,
              },
            }}
          >
            {processing ? "Traitement..." : editingDepartement ? "Enregistrer" : "Créer"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default DepartementModal;