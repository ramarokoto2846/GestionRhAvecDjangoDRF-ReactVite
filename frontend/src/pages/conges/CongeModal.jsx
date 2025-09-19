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
  CircularProgress
} from "@mui/material";

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
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle>
        {editingConge ? "Modifier le congé" : "Nouveau congé"}
      </DialogTitle>
      <form onSubmit={onSubmit}>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                margin="dense"
                label="ID Congé"
                name="id_conge"
                value={formData.id_conge}
                onChange={onInputChange}
                required
                disabled={editingConge !== null}
                inputProps={{ maxLength: 10 }}
                helperText="Entrez un ID unique (max 10 caractères)"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="dense" required>
                <InputLabel id="employe-label">Employé</InputLabel>
                <Select
                  labelId="employe-label"
                  name="employe"
                  value={formData.employe}
                  onChange={onInputChange}
                  disabled={employes.length === 0}
                  label="Employé"
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
                </Select>
                {employes.length === 0 && (
                  <Typography variant="caption" color="error">Aucun employé disponible</Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                margin="dense"
                label="Date Début"
                name="date_debut"
                type="date"
                value={formData.date_debut}
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
                name="date_fin"
                type="date"
                value={formData.date_fin}
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
            {editingConge && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  margin="dense"
                  label="Raison du Refus"
                  name="motif_refus"
                  value={formData.motif_refus}
                  onChange={onInputChange}
                  multiline
                  rows={3}
                  disabled={editingConge?.statut !== "refuse"}
                  helperText={editingConge?.statut !== "refuse" ? "Raison du refus modifiable uniquement pour les congés refusés" : "Entrez la raison du refus"}
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={onClose} disabled={actionLoading} color="inherit">
            Annuler
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={actionLoading || !formData.employe || !formData.date_debut || !formData.date_fin || employes.length === 0}
            sx={{ borderRadius: 2, px: 3, py: 1 }}
          >
            {actionLoading ? <CircularProgress size={24} /> : (editingConge ? "Modifier" : "Créer")}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CongeModal;