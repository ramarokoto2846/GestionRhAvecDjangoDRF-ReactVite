import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  MenuItem,
  Button,
  useTheme
} from "@mui/material";

const EmployModal = ({
  openDialog,
  handleCloseDialog,
  editingEmploye,
  formData,
  errors,
  handleChange,
  handleSubmit,
  loading,
  departements,
  theme
}) => {
  return (
    <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3
        }
      }}
    >
      <DialogTitle sx={{
        backgroundColor: theme.palette.primary.main,
        color: 'white',
        fontWeight: 'bold'
      }}>
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
                error={!!errors.matricule}
                helperText={errors.matricule}
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
                error={!!errors.nom}
                helperText={errors.nom}
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
                error={!!errors.prenom}
                helperText={errors.prenom}
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
                error={!!errors.email}
                helperText={errors.email}
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
                error={!!errors.telephone}
                helperText={errors.telephone}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Poste"
                name="poste"
                value={formData.poste}
                onChange={handleChange}
                error={!!errors.poste}
                helperText={errors.poste}
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
                error={!!errors.departement_pk}
                helperText={errors.departement_pk}
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
            disabled={loading}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1
            }}
          >
            {loading ? 'En cours...' : (editingEmploye ? 'Modifier' : 'Créer')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EmployModal;