import React from "react";
import {
  DialogContent,
  DialogActions,
  Grid,
  IconButton,
  styled
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
    transition: "all 0.3s ease-in-out",
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
  },
  "& .MuiInputLabel-root": {
    fontWeight: 500,
    color: theme.palette.text.secondary,
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: theme.palette.primary.main,
  },
}));

const ModernButton = styled(Button)(({ theme }) => ({
  borderRadius: 12,
  padding: theme.spacing(1.5, 3),
  fontWeight: "bold",
  textTransform: "none",
  transition: "all 0.3s ease",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
  },
}));

const DepartementModal = ({
  open,
  onClose,
  editingDepartement,
  formData,
  setFormData,
  formErrors,
  onSubmit
}) => {
  return (
    <ModernDialog open={open} onClose={onClose} fullWidth>
      <ModernDialogTitle>
        {editingDepartement
          ? "Modifier Département"
          : "Nouveau Département"}
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </ModernDialogTitle>
      <form onSubmit={onSubmit}>
        <DialogContent sx={{ p: 3 }}>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <ModernTextField
                fullWidth
                label="ID *"
                value={formData.id_departement}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    id_departement: e.target.value,
                  })
                }
                error={!!formErrors.id_departement}
                helperText={formErrors.id_departement}
                required
                disabled={editingDepartement != null}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <ModernTextField
                fullWidth
                label="Nom *"
                value={formData.nom}
                onChange={(e) =>
                  setFormData({ ...formData, nom: e.target.value })
                }
                error={!!formErrors.nom}
                helperText={formErrors.nom}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <ModernTextField
                fullWidth
                label="Responsable *"
                value={formData.responsable}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    responsable: e.target.value,
                  })
                }
                error={!!formErrors.responsable}
                helperText={formErrors.responsable}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <ModernTextField
                fullWidth
                label="Nombre d'employés"
                type="number"
                value={0} // Toujours afficher 0 (lecture seule)
                InputProps={{
                  readOnly: true,
                }}
                helperText="Calculé automatiquement"
              />
            </Grid>
            <Grid item xs={12}>
              <ModernTextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    description: e.target.value,
                  })
                }
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12}>
              <ModernTextField
                fullWidth
                label="Localisation"
                value={formData.localisation}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    localisation: e.target.value,
                  })
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, justifyContent: "space-between" }}>
          <ModernButton
            onClick={onClose}
            color="inherit"
            variant="outlined"
          >
            Annuler
          </ModernButton>
          <ModernButton
            type="submit"
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
          >
            {editingDepartement ? "Mettre à jour" : "Enregistrer"}
          </ModernButton>
        </DialogActions>
      </form>
    </ModernDialog>
  );
};

export default DepartementModal;