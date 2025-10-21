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
  CircularProgress,
  Box,
  Avatar,
  Chip
} from "@mui/material";
import {
  Event as EventIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Close as CloseIcon
} from "@mui/icons-material";

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
            {editingConge ? <EditIcon /> : <AddIcon />}
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight="600">
              {editingConge ? "Modifier le congé" : "Nouveau congé"}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
              {editingConge ? "Mettez à jour les informations du congé" : "Ajoutez une nouvelle demande de congé"}
            </Typography>
          </Box>
        </Box>
        
        {/* Badge statut si édition */}
        {editingConge && (
          <Chip 
            label={editingConge.statut}
            color={
              editingConge.statut === 'approuve' ? 'success' : 
              editingConge.statut === 'refuse' ? 'error' : 'warning'
            }
            sx={{ 
              position: 'absolute',
              right: 100,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'white',
              fontWeight: '600'
            }}
          />
        )}
      </DialogTitle>

      <form onSubmit={onSubmit}>
        <DialogContent sx={{ pt: 4, pb: 2 }}>
          <Grid container spacing={3}>

            {/* ID Congé */}
            <Grid item xs={12} sm={6} width={'380px'}>
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
                helperText="Identifiant unique (max 10 caractères)"
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

            {/* Sélection Employé - CORRIGÉ */}
            <Grid item xs={12} sm={6} width={'380px'}>
              <FormControl 
                fullWidth 
                margin="dense" 
                required
                error={false}
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
                <InputLabel id="employe-label">Employé</InputLabel>
                <Select
                  labelId="employe-label"
                  name="employe"
                  value={formData.employe || ''}
                  onChange={onInputChange}
                  disabled={employes.length === 0}
                  label="Employé"
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
                </Select>
                {employes.length === 0 && (
                  <Typography variant="caption" color="error" sx={{ ml: 1, mt: 0.5, display: 'block' }}>
                    Aucun employé disponible
                  </Typography>
                )}
              </FormControl>
            </Grid>

            {/* Dates */}
            <Grid item xs={12} sm={6} width={'380px'}>
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
                InputProps={{
                  startAdornment: <EventIcon color="action" sx={{ mr: 1 }} />
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

            <Grid item xs={12} sm={6} width={'380px'}>
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
                InputProps={{
                  startAdornment: <EventIcon color="action" sx={{ mr: 1 }} />
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

            {/* Motif */}
            <Grid item xs={12} width={'780px'}>
              <TextField
                fullWidth
                margin="dense"
                label="Motif du congé"
                name="motif"
                value={formData.motif}
                onChange={onInputChange}
                multiline
                rows={3}
                placeholder="Décrivez la raison de votre demande de congé..."
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

            {/* Raison du refus (conditionnel) */}
            {editingConge && (
              <Grid item xs={12} width={'380px'}>
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
                  helperText={
                    editingConge?.statut !== "refuse" 
                      ? "Raison du refus modifiable uniquement pour les congés refusés" 
                      : "Entrez la raison du refus de ce congé"
                  }
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      backgroundColor: editingConge?.statut === "refuse" ? '#fff9f9' : 'white',
                      '&:hover fieldset': {
                        borderColor: '#ff6b6b',
                      },
                    }
                  }}
                />
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
            disabled={actionLoading || !formData.id_conge || !formData.employe || !formData.date_debut || !formData.date_fin || employes.length === 0}
            startIcon={actionLoading ? <CircularProgress size={16} /> : (editingConge ? <EditIcon /> : <AddIcon />)}
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
            {actionLoading ? "Traitement..." : (editingConge ? "Modifier" : "Créer")}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CongeModal;