import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  Grid,
  Typography,
  CircularProgress,
  MenuItem
} from "@mui/material";

const AbsenceModal = ({
  open,
  onClose,
  editingAbsence,
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
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle>
        {editingAbsence ? "Modifier l'absence" : "Nouvelle absence"}
      </DialogTitle>
      <form onSubmit={onSubmit}>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                margin="dense"
                label="ID Absence"
                name="id_absence"
                value={formData.id_absence}
                onChange={onInputChange}
                required
                inputProps={{ maxLength: 10 }}
                helperText="Entrez un ID unique (max 10 caractères)"
                disabled={!!editingAbsence}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                margin="dense"
                label="Employé"
                name="employe"
                value={formData.employe}
                onChange={onInputChange}
                required
                disabled={employes.length === 0}
                helperText={employes.length === 0 ? "Aucun employé disponible" : ""}
              >
                {employes.length === 0 ? (
                  <MenuItem disabled>Aucun employé disponible</MenuItem>
                ) : (
                  employes.map((employe) => (
                    <MenuItem key={employe.matricule} value={employe.matricule}>
                      {`${employe.prenom || ""} ${employe.nom || ""} (${employe.matricule})`}
                    </MenuItem>
                  ))
                )}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                margin="dense"
                label="Date Début"
                name="date_debut_absence"
                type="date"
                value={formData.date_debut_absence}
                onChange={onInputChange}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                margin="dense"
                label="Date Fin"
                name="date_fin_absence"
                type="date"
                value={formData.date_fin_absence}
                onChange={onInputChange}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                margin="dense"
                label="Motif"
                name="motif"
                value={formData.motif}
                onChange={onInputChange}
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.justifiee}
                    onChange={onInputChange}
                    name="justifiee"
                  />
                }
                label="Justifiée"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={onClose} disabled={actionLoading} color="inherit">
            Annuler
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={actionLoading || !formData.employe || !formData.date_debut_absence || !formData.date_fin_absence || !formData.id_absence || employes.length === 0}
            sx={{ borderRadius: 2, px: 3, py: 1 }}
          >
            {actionLoading ? <CircularProgress size={24} /> : (editingAbsence ? "Modifier" : "Créer")}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AbsenceModal;