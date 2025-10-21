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
  MenuItem,
  Avatar,
  Box,
  Chip,
  Card,
  CardContent
} from "@mui/material";
import {
  EventBusy as EventBusyIcon,
  Person as PersonIcon,
  Today as TodayIcon,
  Event as EventIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon
} from "@mui/icons-material";

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
  // Calcul de la durée de l'absence
  const calculateDuree = () => {
    if (formData.date_debut_absence && formData.date_fin_absence) {
      const start = new Date(formData.date_debut_absence);
      const end = new Date(formData.date_fin_absence);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    }
    return 0;
  };

  const dureeAbsence = calculateDuree();

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
          background: 'linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%)',
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
            <EventBusyIcon />
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight="600">
              {editingAbsence ? "Modifier l'absence" : "Nouvelle absence"}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
              {editingAbsence ? "Mettez à jour les informations de l'absence" : "Enregistrez une nouvelle absence"}
            </Typography>
          </Box>
        </Box>
        
        {/* Badge statut justification */}
        {editingAbsence && (
          <Chip 
            icon={formData.justifiee ? <CheckCircleIcon /> : <CancelIcon />}
            label={formData.justifiee ? "Justifiée" : "Non justifiée"}
            color={formData.justifiee ? "success" : "error"}
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

            {/* ID Absence */}
            <Grid item xs={12} sm={6} width={'380px'}>
              <TextField
                fullWidth
                margin="dense"
                label="ID Absence"
                name="id_absence"
                value={formData.id_absence}
                onChange={onInputChange}
                required
                inputProps={{ 
                  maxLength: 10,
                  autoComplete: "off"
                }}
                helperText="Identifiant unique (max 10 caractères)"
                disabled={!!editingAbsence}
                InputProps={{
                  startAdornment: <WarningIcon color="action" sx={{ mr: 1 }} />
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    backgroundColor: 'white',
                    '&:hover fieldset': {
                      borderColor: '#ff6b6b',
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
                      borderColor: '#ff6b6b',
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

            {/* Date Début */}
            <Grid item xs={12} sm={6} width={'180px'}>
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
                InputProps={{
                  startAdornment: <TodayIcon color="action" sx={{ mr: 1 }} />
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    backgroundColor: 'white',
                    '&:hover fieldset': {
                      borderColor: '#ff6b6b',
                    },
                  }
                }}
              />
            </Grid>

            {/* Date Fin */}
            <Grid item xs={12} sm={6} width={'180px'}>
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
                InputProps={{
                  startAdornment: <EventIcon color="action" sx={{ mr: 1 }} />
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    backgroundColor: 'white',
                    '&:hover fieldset': {
                      borderColor: '#ff6b6b',
                    },
                  }
                }}
              />
            </Grid>

            

            {/* Motif */}
            <Grid item xs={12} width={'380px'}>
              <TextField
                fullWidth
                margin="dense"
                label="Motif de l'absence"
                name="motif"
                value={formData.motif}
                onChange={onInputChange}
                multiline
                rows={3}
                placeholder="Décrivez la raison de cette absence (maladie, congé personnel, formation...)"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    backgroundColor: 'white',
                    '&:hover fieldset': {
                      borderColor: '#ff6b6b',
                    },
                  }
                }}
              />
            </Grid>

            {/* Switch Justifiée avec style amélioré */}
            <Grid item xs={12} width={'380px'}>
              <Card sx={{ backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 3 }}>
                <CardContent>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.justifiee}
                        onChange={onInputChange}
                        name="justifiee"
                        color={formData.justifiee ? "success" : "default"}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#10b981',
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: '#10b981',
                          },
                        }}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {formData.justifiee ? (
                          <>
                            <CheckCircleIcon color="success" />
                            <Typography fontWeight="600" color="success.main">
                              Absence justifiée
                            </Typography>
                          </>
                        ) : (
                          <>
                            <CancelIcon color="error" />
                            <Typography fontWeight="600" color="error.main">
                              Absence non justifiée
                            </Typography>
                          </>
                        )}
                      </Box>
                    }
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {formData.justifiee 
                      ? "Cette absence est considérée comme justifiée (certificat médical, document officiel...)" 
                      : "Cette absence n'est pas accompagnée de justificatif"
                    }
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Carte d'information durée */}
            {(formData.date_debut_absence && formData.date_fin_absence) && (
              <Grid item xs={12}>
                <Card 
                  sx={{ 
                    backgroundColor: dureeAbsence > 7 ? '#fff5f5' : '#f0fff4',
                    border: `2px solid ${dureeAbsence > 7 ? '#fed7d7' : '#c6f6d5'}`,
                    borderRadius: 3
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <EventBusyIcon color={dureeAbsence > 7 ? "error" : "success"} />
                      <Box>
                        <Typography variant="h6" fontWeight="600">
                          Durée de l'absence
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                          {dureeAbsence} jour(s) - du {new Date(formData.date_debut_absence).toLocaleDateString('fr-FR')} au {new Date(formData.date_fin_absence).toLocaleDateString('fr-FR')}
                        </Typography>
                        {dureeAbsence > 7 && (
                          <Typography variant="caption" color="error.main" sx={{ mt: 1, display: 'block' }}>
                            ⚠️ Absence longue durée détectée
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
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
            disabled={actionLoading || !formData.employe || !formData.date_debut_absence || !formData.date_fin_absence || !formData.id_absence || employes.length === 0}
            startIcon={actionLoading ? <CircularProgress size={16} /> : (editingAbsence ? <EditIcon /> : <AddIcon />)}
            sx={{ 
              borderRadius: 3, 
              px: 4, 
              py: 1,
              background: 'linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%)',
              boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)',
              '&:hover': {
                boxShadow: '0 6px 20px rgba(255, 107, 107, 0.4)',
                transform: 'translateY(-1px)'
              },
              '&:disabled': {
                background: 'grey.300'
              },
              transition: 'all 0.3s ease'
            }}
          >
            {actionLoading ? "Traitement..." : (editingAbsence ? "Modifier" : "Créer")}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AbsenceModal;