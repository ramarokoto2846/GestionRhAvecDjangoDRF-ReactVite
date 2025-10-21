import React from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, CircularProgress, Grid, MenuItem,
  Avatar, Box, Typography, Chip
} from "@mui/material";
import {
  AccessTime as AccessTimeIcon,
  Person as PersonIcon,
  Today as TodayIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Close as CloseIcon,
  Badge as BadgeIcon
} from "@mui/icons-material";

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
          position: 'relative'
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
            <AccessTimeIcon />
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight="600">
              {editingPointage ? "Modifier le pointage" : "Nouveau pointage"}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
              {editingPointage ? "Mettez à jour les horaires de pointage" : "Enregistrez une nouvelle entrée/sortie"}
            </Typography>
          </Box>
        </Box>
        
        {/* Badge statut si édition */}
        {editingPointage && (
          <Chip 
            icon={<AccessTimeIcon />}
            label="Pointage"
            color="primary"
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

      <form onSubmit={onSubmit}>
        <DialogContent sx={{ pt: 4, pb: 2 }}>
          <Grid container spacing={3}>

            {/* ID Pointage */}
            <Grid item xs={12} sm={6} width={'380px'}>
              <TextField
                fullWidth
                margin="dense"
                label="ID Pointage"
                name="id_pointage"
                value={formData.id_pointage}
                onChange={onInputChange}
                required
                disabled={editingPointage !== null}
                inputProps={{ 
                  maxLength: 10,
                  autoComplete: "off" // Désactivation de l'auto-complétion
                }}
                helperText="Identifiant unique (max 10 caractères)"
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

            {/* Sélection Employé */}
            <Grid item xs={12} sm={6} width={'380px'}>
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
              >
                {employes.length === 0 ? (
                  <MenuItem disabled>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon color="disabled" />
                      <Typography>Aucun employé disponible</Typography>
                    </Box>
                  </MenuItem>
                ) : (
                  employes.map((employe) => (
                    <MenuItem key={employe.matricule} value={employe.matricule}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar 
                          sx={{ 
                            width: 32, 
                            height: 32,
                            bgcolor: 'primary.main',
                            fontSize: '0.875rem'
                          }}
                        >
                          {employe.prenom?.[0]}{employe.nom?.[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body1" fontWeight="500">
                            {`${employe.prenom || ""} ${employe.nom || ""}`}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {employe.matricule}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))
                )}
              </TextField>
            </Grid>

            {/* Date */}
            <Grid item xs={12} sm={6} width={'380px'}>
              <TextField
                fullWidth
                margin="dense"
                label="Date de pointage"
                name="date_pointage"
                type="date"
                value={formData.date_pointage}
                onChange={onInputChange}
                required
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: <TodayIcon color="action" sx={{ mr: 1 }} />
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

            {/* Heure d'Entrée */}
            <Grid item xs={12} sm={6} width={'180px'}>
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
                InputProps={{
                  startAdornment: <LoginIcon color="action" sx={{ mr: 1 }} />
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

            {/* Heure de Sortie */}
            <Grid item xs={12} sm={6} width={'180px'}>
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
                InputProps={{
                  startAdornment: <LogoutIcon color="action" sx={{ mr: 1 }} />
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    backgroundColor: formData.heure_sortie ? '#f0fff4' : 'white',
                    '&:hover fieldset': {
                      borderColor: formData.heure_sortie ? '#10b981' : '#667eea',
                    },
                  }
                }}
              />
            </Grid>

            {/* Remarque */}
            <Grid item xs={12} width={'380px'}>
              <TextField
                fullWidth
                margin="dense"
                label="Remarques"
                name="remarque"
                value={formData.remarque}
                onChange={onInputChange}
                multiline
                rows={3}
                placeholder="Ajoutez des observations sur ce pointage..."
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

            {/* Résumé visuel */}
            {(formData.date_pointage && formData.heure_entree) && (
              <Grid item xs={12} width={'380px'}>
                <Box 
                  sx={{ 
                    p: 3, 
                    backgroundColor: 'rgba(255,255,255,0.8)', 
                    borderRadius: 3,
                    border: '2px dashed',
                    borderColor: 'primary.light'
                  }}
                >
                  <Typography variant="h6" gutterBottom color="primary" fontWeight="600">
                    📋 Résumé du pointage
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Date
                      </Typography>
                      <Typography variant="body1" fontWeight="500">
                        {new Date(formData.date_pointage).toLocaleDateString('fr-FR')}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Heure d'entrée
                      </Typography>
                      <Typography variant="body1" fontWeight="500" color="success.main">
                        {formData.heure_entree}
                      </Typography>
                    </Grid>
                    {formData.heure_sortie && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Heure de sortie
                        </Typography>
                        <Typography variant="body1" fontWeight="500" color="info.main">
                          {formData.heure_sortie}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              </Grid>
            )}
          </Grid>
        </DialogContent>

        {/* Actions */}
        <DialogActions sx={{ p: 3, gap: 2, background: 'rgba(255,255,255,0.6)' }}>
          <Button 
            onClick={onClose} 
            disabled={actionLoading} 
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
            disabled={actionLoading || !formData.id_pointage || !formData.employe || !formData.date_pointage || !formData.heure_entree || employes.length === 0}
            startIcon={actionLoading ? <CircularProgress size={16} /> : (editingPointage ? <EditIcon /> : <AddIcon />)}
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
            {actionLoading ? "Traitement..." : (editingPointage ? "Modifier" : "Créer")}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default PointageModal;