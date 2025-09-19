import React from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, CircularProgress, Grid, MenuItem
} from "@mui/material";

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
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle>
        {editingPointage ? "Modifier le pointage" : "Nouveau pointage"}
      </DialogTitle>
      <form onSubmit={onSubmit}>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                margin="dense"
                label="ID Pointage"
                name="id_pointage"
                value={formData.id_pointage}
                onChange={onInputChange}
                required
                disabled={editingPointage !== null}
                inputProps={{ maxLength: 10 }}
                helperText="Entrez un ID unique (max 10 caractères)"
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
                label="Date"
                name="date_pointage"
                type="date"
                value={formData.date_pointage}
                onChange={onInputChange}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                margin="dense"
                label="Heure d'Entrée"
                name="heure_entree"
                type="time"
                value={formData.heure_entree}
                onChange={onInputChange}
                required
                InputLabelProps={{ shrink: true }}
                inputProps={{ step: 60 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                margin="dense"
                label="Heure de Sortie"
                name="heure_sortie"
                type="time"
                value={formData.heure_sortie}
                onChange={onInputChange}
                InputLabelProps={{ shrink: true }}
                inputProps={{ step: 60 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                margin="dense"
                label="Remarque"
                name="remarque"
                value={formData.remarque}
                onChange={onInputChange}
                multiline
                rows={3}
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
            disabled={actionLoading || !formData.id_pointage || !formData.employe || !formData.date_pointage || !formData.heure_entree || employes.length === 0}
            sx={{ borderRadius: 2, px: 3, py: 1 }}
          >
            {actionLoading ? <CircularProgress size={24} /> : (editingPointage ? "Modifier" : "Créer")}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default PointageModal;