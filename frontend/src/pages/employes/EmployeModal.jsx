import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Button,
  MenuItem,
  useTheme
} from "@mui/material";
import { createEmploye, updateEmploye } from "../../services/api";

const EmployeModal = ({
  openDialog,
  handleCloseDialog,
  editingEmploye,
  formData,
  handleChange,
  errors,
  departements,
  loading,
  fetchData,
  showSnackbar
}) => {
  const theme = useTheme();
  const [localLoading, setLocalLoading] = useState(false);
  const [localErrors, setLocalErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLocalLoading(true);

      if (editingEmploye) {
        await updateEmploye(editingEmploye.matricule, formData);
        showSnackbar("Employé modifié avec succès");
      } else {
        await createEmploye(formData);
        showSnackbar("Employé créé avec succès");
      }

      handleCloseDialog();
      fetchData();
    } catch (err) {
      if (err.response?.data) {
        setLocalErrors(err.response.data);
      } else {
        showSnackbar("Erreur lors de l'opération", "error");
      }
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <Dialog
      open={openDialog}
      onClose={handleCloseDialog}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle
        sx={{
          backgroundColor: theme.palette.primary.main,
          color: "white",
          fontWeight: "bold"
        }}
      >
        {editingEmploye ? "Modifier l'employé" : "Nouvel employé"}
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Matricule"
                name="matricule"
                value={formData.matricule}
                onChange={handleChange}
                error={!!errors.matricule || !!localErrors.matricule}
                helperText={errors.matricule || localErrors.matricule}
                disabled={!!editingEmploye}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Titre"
                name="titre"
                value={formData.titre}
                onChange={handleChange}
                select
                required
              >
                <MenuItem value="stagiaire">Stagiaire</MenuItem>
                <MenuItem value="employe">Employé Fixe</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nom"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                error={!!errors.nom || !!localErrors.nom}
                helperText={errors.nom || localErrors.nom}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Prénom"
                name="prenom"
                value={formData.prenom}
                onChange={handleChange}
                error={!!errors.prenom || !!localErrors.prenom}
                helperText={errors.prenom || localErrors.prenom}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={!!errors.email || !!localErrors.email}
                helperText={errors.email || localErrors.email}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Téléphone"
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
                error={!!errors.telephone || !!localErrors.telephone}
                helperText={errors.telephone || localErrors.telephone}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Poste"
                name="poste"
                value={formData.poste}
                onChange={handleChange}
                error={!!errors.poste || !!localErrors.poste}
                helperText={errors.poste || localErrors.poste}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Département"
                name="departement_pk"
                value={formData.departement_pk}
                onChange={handleChange}
                select
                required
                error={!!errors.departement_pk || !!localErrors.departement_pk}
                helperText={errors.departement_pk || localErrors.departement_pk}
              >
                {departements.map((dept) => (
                  <MenuItem key={dept.id_departement} value={dept.id_departement}>
                    {dept.nom}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Statut"
                name="statut"
                value={formData.statut}
                onChange={handleChange}
                select
                required
              >
                <MenuItem value="actif">Actif</MenuItem>
                <MenuItem value="inactif">Inactif</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={handleCloseDialog} color="inherit">
            Annuler
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || localLoading}
            sx={{ borderRadius: 2, px: 3, py: 1 }}
          >
            {loading || localLoading
              ? "En cours..."
              : editingEmploye
              ? "Modifier"
              : "Créer"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EmployeModal;
