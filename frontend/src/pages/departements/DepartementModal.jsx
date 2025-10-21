import React from "react";
import {
  DialogContent,
  DialogActions,
  Grid,
  IconButton,
  styled,
  CircularProgress,
  Box,
  Typography,
  Avatar,
  Chip,
  Card,
  CardContent
} from "@mui/material";
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Description as DescriptionIcon,
  Groups as GroupsIcon
} from "@mui/icons-material";
import {
  Dialog,
  DialogTitle,
  TextField,
  Button
} from "@mui/material";
import { red } from "@mui/material/colors";

// --- Styled Components ---
const ModernDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialog-paper": {
    borderRadius: 20,
    background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    overflow: "hidden",
    minWidth: 500,
  },
  "& .MuiBackdrop-root": {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    backdropFilter: "blur(4px)",
  },
}));

const ModernDialogTitle = styled(DialogTitle)(({ theme }) => ({
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  color: "white",
  padding: theme.spacing(3),
  fontWeight: "700",
  fontSize: "1.5rem",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  position: "relative",
  overflow: "hidden",
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 50%)",
  },
  "& .MuiIconButton-root": {
    color: "white",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(10px)",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      transform: "scale(1.1)",
    },
    transition: "all 0.3s ease",
  },
}));

const ModernTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: 14,
    transition: "all 0.3s ease",
    background: "rgba(255, 255, 255, 0.9)",
    border: "1px solid rgba(0, 0, 0, 0.08)",
    "&:hover": {
      background: "rgba(255, 255, 255, 1)",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
      borderColor: theme.palette.primary.light,
    },
    "&.Mui-focused": {
      background: "rgba(255, 255, 255, 1)",
      boxShadow: `0 0 0 3px ${theme.palette.primary.main}20`,
      borderColor: theme.palette.primary.main,
    },
    "&.Mui-disabled": {
      background: "rgba(0, 0, 0, 0.02)",
      color: "rgba(0, 0, 0, 0.38)",
    },
  },
  "& .MuiInputLabel-root": {
    fontWeight: 600,
    color: theme.palette.text.secondary,
    fontSize: "0.9rem",
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: theme.palette.primary.main,
  },
  "& .MuiFormHelperText-root": {
    marginLeft: 0,
    fontSize: "0.75rem",
  },
}));

const ModernButton = styled(Button)(({ theme }) => ({
  borderRadius: 14,
  padding: theme.spacing(1.2, 4),
  fontWeight: "700",
  textTransform: "none",
  fontSize: "1rem",
  minWidth: 140,
  transition: "all 0.3s ease",
  position: "relative",
  overflow: "hidden",
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: "-100%",
    width: "100%",
    height: "100%",
    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
    transition: "left 0.5s ease",
  },
  "&:hover::before": {
    left: "100%",
  },
  "&:hover": {
    transform: "translateY(-3px)",
    boxShadow: "0 8px 20px rgba(0, 0, 0, 0.2)",
  },
  "&:disabled": {
    transform: "none",
    boxShadow: "none",
    opacity: 0.6,
  },
}));

const StatCard = styled(Card)(({ theme }) => ({
  borderRadius: 14,
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  color: "white",
  padding: theme.spacing(2),
  textAlign: "center",
  boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
}));

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
    <ModernDialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown={processing}
    >
      <ModernDialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, position: "relative", zIndex: 1 }}>
          <Avatar 
            sx={{ 
              bgcolor: "rgba(255, 255, 255, 0.2)",
              width: 50,
              height: 50
            }}
          >
            <BusinessIcon />
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight="700">
              {editingDepartement ? "Modifier le Département" : "Nouveau Département"}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
              {editingDepartement ? "Mettez à jour les informations du département" : "Créez un nouveau département dans l'organisation"}
            </Typography>
          </Box>
        </Box>
        <IconButton 
          onClick={handleClose} 
          disabled={processing}
          size="large"
          sx={{ position: "relative", zIndex: 1 }}
        >
          <CloseIcon />
        </IconButton>
      </ModernDialogTitle>
      
      <form onSubmit={handleFormSubmit}>
        <DialogContent sx={{ padding: '10px', gap: '20px',  margin: '40px' }} >
          <Grid container spacing={3}>
            {/* Carte statistique */}
            {editingDepartement && (
              <Grid item xs={12}>
                <StatCard>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}>
                    <GroupsIcon sx={{ fontSize: 32 }} />
                    <Box>
                      <Typography variant="h4" fontWeight="700">
                        {formData.nbr_employe || 0}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Employé(s) dans ce département
                      </Typography>
                    </Box>
                  </Box>
                </StatCard>
              </Grid>
            )}

            <Grid item xs={12} sm={6} width={'380px'}>
              <ModernTextField
                fullWidth
                label="ID Département *"
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
              />
            </Grid>
            
            <Grid item xs={12} sm={6} width={'380px'}>
              <ModernTextField
                fullWidth
                label="Nom du Département *"
                name="nom"
                value={formData.nom || ""}
                onChange={(e) => handleInputChange("nom", e.target.value)}
                error={!!formErrors.nom}
                helperText={formErrors.nom || "Nom complet du département"}
                required
                disabled={processing}
                placeholder="Ex: Ressources Humaines"
              />
            </Grid>
            
            <Grid item xs={12} sm={6} width={'380px'}>
              <ModernTextField
                fullWidth
                label="Responsable *"
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
              />
            </Grid>
            
            <Grid item xs={12} sm={6} width={'380px'}>
              <ModernTextField
                fullWidth
                label="Nombre d'employés"
                value={formData.nbr_employe || 0}
                InputProps={{
                  readOnly: true,
                  startAdornment: <GroupsIcon color="action" sx={{ mr: 1 }} />
                }}
                disabled
                helperText="Calculé automatiquement"
              />
            </Grid>
            
            <Grid item xs={12} width={'380px'} >
              <ModernTextField
                fullWidth
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
              />
            </Grid>
            
            <Grid item xs={12} width={'380px'} height={'50px'}>
              <ModernTextField
                fullWidth
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
              />
            </Grid>

            {/* Badge d'état */}
            <Grid item xs={12}>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
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
        
        <DialogActions sx={{ p: 3, gap: 2, background: "rgba(0, 0, 0, 0.02)" }}>
          <ModernButton
            onClick={handleClose}
            color="inherit"
            variant="outlined"
            disabled={processing}
            sx={{ 
              width: '350px',
              flex: 1,
              color: 'red',
              border: "2px solid",
              borderColor: "grey.300",
              "&:hover": {
                borderColor: "grey.400",
                backgroundColor: "rgba(0, 0, 0, 0.04)"
              }
            }}
            type="button"
          >
            Annuler
          </ModernButton>
          
          <ModernButton
            type="submit"
            variant="contained"
            color="primary"
            disabled={processing}
            startIcon={
              processing ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <SaveIcon />
              )
            }
            sx={{ 
              flex: 1,
              width: '350px',
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)",
              }
            }}
          >
            {processing ? (
              "Traitement..."
            ) : editingDepartement ? (
              "Mettre à jour"
            ) : (
              "Créer le département"
            )}
          </ModernButton>
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
            background: "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)",
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
            borderRadius: '20px',
            backdropFilter: "blur(4px)",
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress 
              size={70} 
              thickness={4}
              sx={{ 
                color: "primary.main",
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
    </ModernDialog>
  );
};

export default DepartementModal;