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
  useTheme,
  Avatar,
  Box,
  Typography,
  CircularProgress,
  Chip
} from "@mui/material";
import {
  Person as PersonIcon,
  Badge as BadgeIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Work as WorkIcon,
  Business as BusinessIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from "@mui/icons-material";

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
    <Dialog 
      open={openDialog} 
      onClose={handleCloseDialog} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          background: 'linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          overflow: 'hidden'
        }
      }}
    >
      {/* En-tête avec dégradé */}
      <DialogTitle sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        py: 3,
        position: 'relative'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar 
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.2)',
              width: 48,
              height: 48
            }}
          >
            {editingEmploye ? <EditIcon /> : <AddIcon />}
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight="600">
              {editingEmploye ? "Modifier l'employé" : "Nouvel employé"}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
              {editingEmploye ? "Mettez à jour les informations de l'employé" : "Ajoutez un nouveau membre à votre équipe"}
            </Typography>
          </Box>
        </Box>

        {/* Badge statut si édition */}
        {editingEmploye && (
          <Chip 
            icon={formData.statut === 'actif' ? <CheckCircleIcon /> : <CancelIcon />}
            label={formData.statut === 'actif' ? 'Actif' : 'Inactif'}
            color={formData.statut === 'actif' ? 'success' : 'error'}
            sx={{ 
              position: 'absolute',
              right: 100,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'white',
              fontWeight: '600',
              '& .MuiChip-icon': { color: 'white' }
            }}
          />
        )}
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 4, pb: 2 }}>
          <Grid container spacing={3}>
            {/* Matricule */}
            <Grid item xs={12} sm={6} width={'380px'}>
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
                InputProps={{
                  startAdornment: <BadgeIcon color="action" sx={{ mr: 1 }} />
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    backgroundColor: 'white',
                    '&:hover fieldset': {
                      borderColor: '#667eea',
                    },
                  }
                }}
              />
            </Grid>

            {/* Titre */}
            <Grid item xs={12} sm={6} width={'380px'}>
              <TextField
                fullWidth
                label="Titre"
                name="titre"
                value={formData.titre}
                onChange={handleChange}
                select
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    backgroundColor: 'white',
                    '&:hover fieldset': {
                      borderColor: '#667eea',
                    },
                  }
                }}
              >
                <MenuItem value="stagiaire">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon fontSize="small" />
                    <Typography>Stagiaire</Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="employe">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WorkIcon fontSize="small" />
                    <Typography>Employé Fixe</Typography>
                  </Box>
                </MenuItem>
              </TextField>
            </Grid>

            {/* Nom */}
            <Grid item xs={12} sm={6} width={'380px'}>
              <TextField
                fullWidth
                label="Nom"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                error={!!errors.nom}
                helperText={errors.nom}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    backgroundColor: 'white',
                    '&:hover fieldset': {
                      borderColor: '#667eea',
                    },
                  }
                }}
              />
            </Grid>

            {/* Prénom */}
            <Grid item xs={12} sm={6} width={'380px'}>
              <TextField
                fullWidth
                label="Prénom"
                name="prenom"
                value={formData.prenom}
                onChange={handleChange}
                error={!!errors.prenom}
                helperText={errors.prenom}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    backgroundColor: 'white',
                    '&:hover fieldset': {
                      borderColor: '#667eea',
                    },
                  }
                }}
              />
            </Grid>

            {/* Email */}
            <Grid item xs={12} sm={6} width={'380px'}>
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
                InputProps={{
                  startAdornment: <EmailIcon color="action" sx={{ mr: 1 }} />
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    backgroundColor: 'white',
                    '&:hover fieldset': {
                      borderColor: '#667eea',
                    },
                  }
                }}
              />
            </Grid>

            {/* Téléphone */}
            <Grid item xs={12} sm={6} width={'380px'}>
              <TextField
                fullWidth
                label="Téléphone"
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
                error={!!errors.telephone}
                helperText={errors.telephone}
                InputProps={{
                  startAdornment: <PhoneIcon color="action" sx={{ mr: 1 }} />
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    backgroundColor: 'white',
                    '&:hover fieldset': {
                      borderColor: '#667eea',
                    },
                  }
                }}
              />
            </Grid>

            {/* Poste */}
            <Grid item xs={12} sm={6} width={'380px'}>
              <TextField
                fullWidth
                label="Poste"
                name="poste"
                value={formData.poste}
                onChange={handleChange}
                error={!!errors.poste}
                helperText={errors.poste}
                required
                InputProps={{
                  startAdornment: <WorkIcon color="action" sx={{ mr: 1 }} />
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    backgroundColor: 'white',
                    '&:hover fieldset': {
                      borderColor: '#667eea',
                    },
                  }
                }}
              />
            </Grid>

            {/* Département */}
            <Grid item xs={12} sm={6} width={'180px'}>
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
                InputProps={{
                  startAdornment: <BusinessIcon color="action" sx={{ mr: 1 }} />
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    backgroundColor: 'white',
                    '&:hover fieldset': {
                      borderColor: '#667eea',
                    },
                  }
                }}
              >
                {departements.map((dept) => (
                  <MenuItem key={dept.id_departement} value={dept.id_departement}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BusinessIcon fontSize="small" />
                      <Typography>{dept.nom}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Statut */}
            <Grid item xs={12} sm={6} width={'180px'}>
              <TextField
                fullWidth
                label="Statut"
                name="statut"
                value={formData.statut}
                onChange={handleChange}
                select
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    backgroundColor: formData.statut === 'actif' ? '#f0f9ff' : '#fff5f5',
                    '&:hover fieldset': {
                      borderColor: formData.statut === 'actif' ? '#10b981' : '#ef4444',
                    },
                  }
                }}
              >
                <MenuItem value="actif">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'success.main'}}>
                    <CheckCircleIcon fontSize="small" />
                    <Typography>Actif</Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="inactif">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
                    <CancelIcon fontSize="small" />
                    <Typography>Inactif</Typography>
                  </Box>
                </MenuItem>
              </TextField>
            </Grid>

            {/* Avatar preview si nom et prénom sont remplis */}
            {(formData.nom || formData.prenom) && (
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 3 }}>
                  <Avatar 
                    sx={{ 
                      width: 64, 
                      height: 64,
                      bgcolor: 'primary.main',
                      fontSize: '1.5rem',
                      fontWeight: 'bold'
                    }}
                  >
                    {formData.prenom?.[0]}{formData.nom?.[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight="600">
                      {`${formData.prenom || ''} ${formData.nom || ''}`.trim()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formData.poste || 'Poste non défini'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formData.matricule || 'Matricule non défini'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            )}
          </Grid>
        </DialogContent>

        {/* Actions */}
        <DialogActions sx={{ p: 3, gap: 2, background: 'rgba(255,255,255,0.6)' }}>
          <Button 
            onClick={handleCloseDialog} 
            color="inherit"
            startIcon={<CloseIcon />}
            disabled={loading}
            sx={{ 
              borderRadius: 3, 
              px: 3,
              py: 1,
              border: '1px solid #ddd',
              '&:hover': {
                backgroundColor: 'rgba(0,0,0,0.04)'
              }
            }}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : (editingEmploye ? <EditIcon /> : <AddIcon />)}
            sx={{ 
              borderRadius: 3, 
              px: 4, 
              py: 1,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
              '&:hover': {
                boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
                transform: 'translateY(-1px)'
              },
              '&:disabled': {
                background: 'grey.300'
              },
              transition: 'all 0.3s ease'
            }}
          >
            {loading ? 'Traitement...' : (editingEmploye ? 'Modifier' : 'Créer')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EmployModal;