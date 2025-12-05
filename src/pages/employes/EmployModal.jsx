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
  Avatar,
  Box,
  Typography,
  CircularProgress,
  Chip,
  InputAdornment
} from "@mui/material";
import {
  Badge as BadgeIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Work as WorkIcon,
  Business as BusinessIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  CreditCard as CinIcon
} from "@mui/icons-material";

const ORTM_COLORS = {
  primary: "#1B5E20",
  secondary: "#F9A825",
  white: "#FFFFFF",
  background: "#F5F5F5"
};

const EmployModal = ({
  openDialog,
  handleCloseDialog,
  editingEmploye,
  formData,
  errors = {},
  handleChange,
  handleSubmit,
  loading,
  departements = []
}) => {

  return (
    <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
      <DialogTitle sx={{
        background: `linear-gradient(135deg, ${ORTM_COLORS.primary}, #2E7D32)`,
        color: "white",
        py: 3
      }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
            {editingEmploye ? <EditIcon /> : <AddIcon />}
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight="bold">
              {editingEmploye ? "Modifier l'employé" : "Ajouter un nouvel employé"}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Tous les champs marqués d'une étoile (*) sont obligatoires
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent dividers sx={{ backgroundColor: "#fafafa" }}>
          <Grid container spacing={3}>

            {/* CIN - Clé primaire */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="CIN *"
                name="cin"
                value={formData.cin || ''}
                onChange={handleChange}
                error={!!errors.cin}
                helperText={errors.cin || "12 chiffres exactement"}
                required
                disabled={!!editingEmploye}
                inputProps={{ maxLength: 12 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CinIcon sx={{ color: ORTM_COLORS.primary }} />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            {/* Type de contrat (titre) */}
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Type de contrat *"
                name="titre"
                value={formData.titre || 'stagiaire'}
                onChange={handleChange}
                required
              >
                <MenuItem value="stagiaire">Stagiaire</MenuItem>
                <MenuItem value="employe">Employé Fixe</MenuItem>
              </TextField>
            </Grid>

            {/* Matricule - conditionnel */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Matricule"
                name="matricule"
                value={formData.matricule || ''}
                onChange={handleChange}
                error={!!errors.matricule}
                helperText={
                  errors.matricule ||
                  (formData.titre === 'employe'
                    ? "Obligatoire pour les employés fixes (6 chiffres)"
                    : "Non autorisé pour les stagiaires")
                }
                disabled={formData.titre === 'stagiaire'}
                inputProps={{ maxLength: 6 }}
                required={formData.titre === 'employe'}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BadgeIcon sx={{ color: ORTM_COLORS.primary }} />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            {/* Nom & Prénom */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nom *"
                name="nom"
                value={formData.nom || ''}
                onChange={handleChange}
                error={!!errors.nom}
                helperText={errors.nom}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Prénom *"
                name="prenom"
                value={formData.prenom || ''}
                onChange={handleChange}
                error={!!errors.prenom}
                helperText={errors.prenom}
                required
              />
            </Grid>

            {/* Email & Téléphone */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email *"
                name="email"
                type="email"
                value={formData.email || ''}
                onChange={handleChange}
                error={!!errors.email}
                helperText={errors.email || "Doit être unique"}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: ORTM_COLORS.primary }} />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Téléphone"
                name="telephone"
                value={formData.telephone || ''}
                onChange={handleChange}
                error={!!errors.telephone}
                helperText={errors.telephone}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon sx={{ color: ORTM_COLORS.primary }} />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            {/* Poste & Département */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Poste occupé *"
                name="poste"
                value={formData.poste || ''}
                onChange={handleChange}
                error={!!errors.poste}
                helperText={errors.poste}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <WorkIcon sx={{ color: ORTM_COLORS.primary }} />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Département *"
                name="departement" // CORRIGÉ: departement_pk → departement
                value={formData.departement || ''} // CORRIGÉ: departement_pk → departement
                onChange={handleChange}
                error={!!errors.departement} // CORRIGÉ: departement_pk → departement
                helperText={errors.departement} // CORRIGÉ: departement_pk → departement
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BusinessIcon sx={{ color: ORTM_COLORS.primary }} />
                    </InputAdornment>
                  )
                }}
              >
                {departements.map((dept) => (
                  <MenuItem key={dept.id_departement} value={dept.id_departement}>
                    {dept.nom}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Statut */}
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Statut *"
                name="statut"
                value={formData.statut || 'actif'}
                onChange={handleChange}
                required
              >
                <MenuItem value="actif">
                  <CheckCircleIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }} />
                  Actif
                </MenuItem>
                <MenuItem value="inactif">
                  <CancelIcon fontSize="small" sx={{ mr: 1, color: 'error.main' }} />
                  Inactif
                </MenuItem>
              </TextField>
            </Grid>

            {/* Aperçu visuel */}
            {(formData.nom || formData.prenom) && (
              <Grid item xs={12}>
                <Box
                  sx={{
                    p: 3,
                    backgroundColor: `${ORTM_COLORS.primary}08`,
                    borderRadius: 3,
                    border: `1px dashed ${ORTM_COLORS.primary}44`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3
                  }}
                >
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      bgcolor: ORTM_COLORS.primary,
                      fontSize: '2rem',
                      fontWeight: 'bold'
                    }}
                  >
                    {formData.prenom?.[0]?.toUpperCase()}{formData.nom?.[0]?.toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {formData.prenom} {formData.nom}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formData.poste || 'Poste non défini'} • {formData.titre === 'employe' ? 'Employé Fixe' : 'Stagiaire'}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Chip
                        label={formData.statut === 'actif' ? 'ACTIF' : 'INACTIF'}
                        color={formData.statut === 'actif' ? 'success' : 'error'}
                        size="small"
                      />
                      {formData.matricule && (
                        <Chip label={`Mat: ${formData.matricule}`} sx={{ ml: 1 }} size="small" />
                      )}
                      <Chip label={`CIN: ${formData.cin}`} sx={{ ml: 1 }} size="small" variant="outlined" />
                    </Box>
                  </Box>
                </Box>
              </Grid>
            )}

          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3, backgroundColor: 'background.paper', gap: 2 }}>
          <Button
            onClick={handleCloseDialog}
            disabled={loading}
            startIcon={<CloseIcon />}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : editingEmploye ? <EditIcon /> : <AddIcon />}
            sx={{
              bgcolor: ORTM_COLORS.primary,
              '&:hover': { bgcolor: '#1565c0' },
              px: 4,
              py: 1.2,
              fontWeight: 'bold'
            }}
          >
            {loading ? 'En cours...' : editingEmploye ? 'Enregistrer' : 'Créer l\'employé'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EmployModal;