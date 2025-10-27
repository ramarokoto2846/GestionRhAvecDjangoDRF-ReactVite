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
  MenuItem,
  Avatar,
  Box,
  Chip,
  Card,
  CardContent,
  IconButton
} from "@mui/material";
import {
  Business as BusinessIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Description as DescriptionIcon,
  Groups as GroupsIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from "@mui/icons-material";

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
    <Dialog
      open={open}
      onClose={handleClose}
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
      <DialogTitle 
        sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: 3,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar 
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.2)',
              width: 48,
              height: 48
            }}
          >
            <BusinessIcon />
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight="600">
              {editingDepartement ? "Modifier le département" : "Nouveau département"}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
              {editingDepartement ? "Mettez à jour les informations du département" : "Créez un nouveau département dans l'organisation"}
            </Typography>
          </Box>
        </Box>

        <IconButton 
          onClick={handleClose} 
          disabled={processing}
          sx={{ 
            color: 'white',
            bgcolor: 'rgba(255,255,255,0.2)',
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.3)',
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleFormSubmit}>
        <DialogContent sx={{ pt: 4, pb: 2 }}>
          <Grid container spacing={3}>

            {/* Carte statistique */}
            {editingDepartement && (
              <Grid item xs={12}>
                <Card 
                  sx={{ 
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    border: '2px solid rgba(102, 126, 234, 0.2)',
                    borderRadius: 3
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <GroupsIcon color="primary" />
                      <Box>
                        <Typography variant="h6" fontWeight="600" color="primary.main">
                          Effectif du département
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                          {formData.nbr_employe || 0} employé(s) dans ce département
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* ID Département */}
            <Grid item xs={12} sm={6} width={'380px'}>
              <TextField
                fullWidth
                margin="dense"
                label="ID Département"
                name="id_departement"
                value={formData.id_departement || ""}
                onChange={(e) => handleInputChange("id_departement", e.target.value)}
                error={!!formErrors.id_departement}
                helperText={formErrors.id_departement || "Identifiant unique du département"}
                required
                disabled={editingDepartement != null || processing}
                placeholder="Ex: DEPT-001"
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
              />
            </Grid>

            {/* Nom du Département */}
            <Grid item xs={12} sm={6} width={'380px'}>
              <TextField
                fullWidth
                margin="dense"
                label="Nom du Département"
                name="nom"
                value={formData.nom || ""}
                onChange={(e) => handleInputChange("nom", e.target.value)}
                error={!!formErrors.nom}
                helperText={formErrors.nom || "Nom complet du département"}
                required
                disabled={processing}
                placeholder="Ex: Ressources Humaines"
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

            {/* Responsable */}
            <Grid item xs={12} sm={6} width={'380px'}>
              <TextField
                fullWidth
                margin="dense"
                label="Responsable"
                name="responsable"
                value={formData.responsable || ""}
                onChange={(e) => handleInputChange("responsable", e.target.value)}
                error={!!formErrors.responsable}
                helperText={formErrors.responsable || "Nom du responsable du département"}
                required
                disabled={processing}
                placeholder="Ex: Jean Dupont"
                InputProps={{
                  startAdornment: <PersonIcon color="action" sx={{ mr: 1 }} />
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

            {/* Nombre d'employés */}
            <Grid item xs={12} sm={6} width={'380px'}>
              <TextField
                fullWidth
                margin="dense"
                label="Nombre d'employés"
                value={formData.nbr_employe || 0}
                InputProps={{
                  readOnly: true,
                  startAdornment: <GroupsIcon color="action" sx={{ mr: 1 }} />
                }}
                disabled
                helperText="Calculé automatiquement"
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

            {/* Description */}
            <Grid item xs={12} width={'380px'}>
              <TextField
                fullWidth
                margin="dense"
                label="Description du département"
                name="description"
                value={formData.description || ""}
                onChange={(e) => handleInputChange("description", e.target.value)}
                multiline
                rows={3}
                disabled={processing}
                placeholder="Décrivez les missions, objectifs et responsabilités de ce département..."
                helperText="Définissez le rôle et les objectifs de ce département"
                InputProps={{
                  startAdornment: <DescriptionIcon color="action" sx={{ mr: 1, mt: 1.5, alignSelf: 'flex-start' }} />
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

            {/* Localisation */}
            <Grid item xs={12} width={'380px'}>
              <TextField
                fullWidth
                margin="dense"
                label="Localisation"
                name="localisation"
                value={formData.localisation || ""}
                onChange={(e) => handleInputChange("localisation", e.target.value)}
                disabled={processing}
                placeholder="Ex: Bâtiment A, Étage 2, Bureau 205"
                helperText="Localisation physique du département dans l'entreprise"
                InputProps={{
                  startAdornment: <LocationIcon color="action" sx={{ mr: 1 }} />
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

            {/* Badge d'état */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip 
                  icon={<BusinessIcon />}
                  label={editingDepartement ? "Département existant" : "Nouveau département"}
                  color={editingDepartement ? "primary" : "success"}
                  variant="outlined"
                />
                {formData.nbr_employe > 0 && (
                  <Chip 
                    icon={<GroupsIcon />}
                    label={`${formData.nbr_employe} employé(s)`}
                    color="info"
                    variant="outlined"
                  />
                )}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>

        {/* Actions */}
        <DialogActions sx={{ p: 3, gap: 2, background: 'rgba(255,255,255,0.6)' }}>
          <Button 
            onClick={handleClose} 
            disabled={processing} 
            color="inherit"
            startIcon={<CloseIcon />}
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
            disabled={processing || !formData.id_departement || !formData.nom || !formData.responsable}
            startIcon={processing ? <CircularProgress size={16} /> : <SaveIcon />}
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
            {processing ? "Traitement..." : (editingDepartement ? "Modifier" : "Créer")}
          </Button>
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
            background: 'rgba(255, 255, 255, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
            borderRadius: '16px',
            backdropFilter: 'blur(4px)',
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress 
              size={60}
              sx={{ 
                color: '#667eea',
                mb: 2
              }} 
            />
            <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 600 }}>
              Traitement en cours...
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
              {editingDepartement ? "Mise à jour du département" : "Création du nouveau département"}
            </Typography>
          </Box>
        </Box>
      )}
    </Dialog>
  );
};

export default DepartementModal;