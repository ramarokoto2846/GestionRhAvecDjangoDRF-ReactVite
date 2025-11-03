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

// Définition des couleurs ORTM
const ORTM_COLORS = {
  primary: "#1B5E20",      // Vert ORTM
  secondary: "#F9A825",    // Jaune doré
  background: "#F5F5F5",   // Gris clair
  text: "#212121",         // Noir anthracite
  white: "#FFFFFF"         // Blanc
};

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
          background: `linear-gradient(135deg, ${ORTM_COLORS.background} 0%, ${ORTM_COLORS.white} 100%)`,
          boxShadow: '0 20px 60px rgba(27, 94, 32, 0.15)',
          overflow: 'hidden',
          border: `1px solid ${ORTM_COLORS.primary}33`
        }
      }}
    >
      {/* En-tête avec dégradé ORTM */}
      <DialogTitle sx={{
        background: `linear-gradient(135deg, ${ORTM_COLORS.primary} 0%, ${ORTM_COLORS.primary}DD 100%)`,
        color: ORTM_COLORS.white,
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
              color: ORTM_COLORS.white,
              fontWeight: '600',
              backgroundColor: formData.statut === 'actif' ? ORTM_COLORS.primary : ORTM_COLORS.secondary,
              '& .MuiChip-icon': { color: ORTM_COLORS.white }
            }}
          />
        )}
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 4, pb: 2 }}>
          <Grid container spacing={3}>
            {/* Matricule */}
            <Grid item xs={12} sm={6}  width={380}>
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
                  startAdornment: <BadgeIcon sx={{ mr: 1, color: ORTM_COLORS.primary }} />
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    backgroundColor: ORTM_COLORS.white,
                    '&:hover fieldset': {
                      borderColor: ORTM_COLORS.primary,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: ORTM_COLORS.primary,
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: ORTM_COLORS.primary,
                  }
                }}
              />
            </Grid>

            {/* Titre */}
            <Grid item xs={12} sm={6}  width={380}>
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
                    backgroundColor: ORTM_COLORS.white,
                    '&:hover fieldset': {
                      borderColor: ORTM_COLORS.primary,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: ORTM_COLORS.primary,
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: ORTM_COLORS.primary,
                  }
                }}
              >
                <MenuItem value="stagiaire">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon fontSize="small" sx={{ color: ORTM_COLORS.primary }} />
                    <Typography>Stagiaire</Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="employe">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WorkIcon fontSize="small" sx={{ color: ORTM_COLORS.primary }} />
                    <Typography>Employé Fixe</Typography>
                  </Box>
                </MenuItem>
              </TextField>
            </Grid>

            {/* Nom */}
            <Grid item xs={12} sm={6} width={380}>
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
                    backgroundColor: ORTM_COLORS.white,
                    '&:hover fieldset': {
                      borderColor: ORTM_COLORS.primary,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: ORTM_COLORS.primary,
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: ORTM_COLORS.primary,
                  }
                }}
              />
            </Grid>

            {/* Prénom */}
            <Grid item xs={12} sm={6} width={380}>
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
                    backgroundColor: ORTM_COLORS.white,
                    '&:hover fieldset': {
                      borderColor: ORTM_COLORS.primary,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: ORTM_COLORS.primary,
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: ORTM_COLORS.primary,
                  }
                }}
              />
            </Grid>

            {/* Email */}
            <Grid item xs={12} sm={6}  width={380}>
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
                  startAdornment: <EmailIcon sx={{ mr: 1, color: ORTM_COLORS.primary }} />
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    backgroundColor: ORTM_COLORS.white,
                    '&:hover fieldset': {
                      borderColor: ORTM_COLORS.primary,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: ORTM_COLORS.primary,
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: ORTM_COLORS.primary,
                  }
                }}
              />
            </Grid>

            {/* Téléphone */}
            <Grid item xs={12} sm={6}  width={380}>
              <TextField
                fullWidth
                label="Téléphone"
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
                error={!!errors.telephone}
                helperText={errors.telephone}
                InputProps={{
                  startAdornment: <PhoneIcon sx={{ mr: 1, color: ORTM_COLORS.primary }} />
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    backgroundColor: ORTM_COLORS.white,
                    '&:hover fieldset': {
                      borderColor: ORTM_COLORS.primary,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: ORTM_COLORS.primary,
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: ORTM_COLORS.primary,
                  }
                }}
              />
            </Grid>

            {/* Poste */}
            <Grid item xs={12} sm={6}  width={380}>
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
                  startAdornment: <WorkIcon sx={{ mr: 1, color: ORTM_COLORS.primary }} />
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    backgroundColor: ORTM_COLORS.white,
                    '&:hover fieldset': {
                      borderColor: ORTM_COLORS.primary,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: ORTM_COLORS.primary,
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: ORTM_COLORS.primary,
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
                  startAdornment: <BusinessIcon sx={{ mr: 1, color: ORTM_COLORS.primary }} />
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    backgroundColor: ORTM_COLORS.white,
                    '&:hover fieldset': {
                      borderColor: ORTM_COLORS.primary,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: ORTM_COLORS.primary,
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: ORTM_COLORS.primary,
                  }
                }}
              >
                {departements.map((dept) => (
                  <MenuItem key={dept.id_departement} value={dept.id_departement}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BusinessIcon fontSize="small" sx={{ color: ORTM_COLORS.primary }} />
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
                    backgroundColor: formData.statut === 'actif' ? `${ORTM_COLORS.primary}11` : `${ORTM_COLORS.secondary}11`,
                    '&:hover fieldset': {
                      borderColor: formData.statut === 'actif' ? ORTM_COLORS.primary : ORTM_COLORS.secondary,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: formData.statut === 'actif' ? ORTM_COLORS.primary : ORTM_COLORS.secondary,
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: ORTM_COLORS.primary,
                  }
                }}
              >
                <MenuItem value="actif">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: ORTM_COLORS.primary }}>
                    <CheckCircleIcon fontSize="small" />
                    <Typography>Actif</Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="inactif">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: ORTM_COLORS.secondary }}>
                    <CancelIcon fontSize="small" />
                    <Typography>Inactif</Typography>
                  </Box>
                </MenuItem>
              </TextField>
            </Grid>

            {/* Avatar preview si nom et prénom sont remplis */}
            {(formData.nom || formData.prenom) && (
              <Grid item xs={12}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 2, 
                  p: 2, 
                  backgroundColor: `${ORTM_COLORS.primary}08`, 
                  borderRadius: 3,
                  border: `1px solid ${ORTM_COLORS.primary}33`
                }}>
                  <Avatar 
                    sx={{ 
                      width: 64, 
                      height: 64,
                      bgcolor: ORTM_COLORS.primary,
                      fontSize: '1.5rem',
                      fontWeight: 'bold'
                    }}
                  >
                    {formData.prenom?.[0]}{formData.nom?.[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight="600" sx={{ color: ORTM_COLORS.text }}>
                      {`${formData.prenom || ''} ${formData.nom || ''}`.trim()}
                    </Typography>
                    <Typography variant="body2" sx={{ color: ORTM_COLORS.text }}>
                      {formData.poste || 'Poste non défini'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: ORTM_COLORS.text }}>
                      {formData.matricule || 'Matricule non défini'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            )}
          </Grid>
        </DialogContent>

        {/* Actions */}
        <DialogActions sx={{ p: 3, gap: 2, background: `${ORTM_COLORS.primary}08` }}>
          <Button 
            onClick={handleCloseDialog} 
            color="inherit"
            startIcon={<CloseIcon />}
            disabled={loading}
            sx={{ 
              borderRadius: 3, 
              px: 3,
              py: 1,
              border: `1px solid ${ORTM_COLORS.primary}33`,
              color: ORTM_COLORS.text,
              '&:hover': {
                backgroundColor: `${ORTM_COLORS.primary}11`
              }
            }}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} sx={{ color: ORTM_COLORS.white }} /> : (editingEmploye ? <EditIcon /> : <AddIcon />)}
            sx={{ 
              borderRadius: 3, 
              px: 4, 
              py: 1,
              background: `linear-gradient(135deg, ${ORTM_COLORS.primary}, ${ORTM_COLORS.secondary})`,
              boxShadow: `0 4px 15px ${ORTM_COLORS.primary}66`,
              color: ORTM_COLORS.white,
              fontWeight: '600',
              '&:hover': {
                boxShadow: `0 6px 20px ${ORTM_COLORS.primary}99`,
                transform: 'translateY(-1px)',
                background: `linear-gradient(135deg, ${ORTM_COLORS.primary}DD, ${ORTM_COLORS.secondary}DD)`,
              },
              '&:disabled': {
                background: `${ORTM_COLORS.primary}66`,
                color: ORTM_COLORS.white
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


// import React from 'react';
// import {
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   TextField,
//   Grid,
//   MenuItem,
//   Button,
//   useTheme,
//   Avatar,
//   Box,
//   Typography,
//   CircularProgress,
//   Chip,
//   alpha,
//   Stepper,
//   Step,
//   StepLabel,
//   StepContent,
//   Card,
//   CardContent,
//   InputAdornment
// } from "@mui/material";
// import {
//   Person as PersonIcon,
//   Badge as BadgeIcon,
//   Email as EmailIcon,
//   Phone as PhoneIcon,
//   Work as WorkIcon,
//   Business as BusinessIcon,
//   Edit as EditIcon,
//   Add as AddIcon,
//   Close as CloseIcon,
//   CheckCircle as CheckCircleIcon,
//   Cancel as CancelIcon,
//   Visibility as VisibilityIcon,
//   CorporateFare as CorporateFareIcon,
//   ContactMail as ContactMailIcon,
//   Settings as SettingsIcon
// } from "@mui/icons-material";

// // Palette de couleurs ORTM modernisée
// const ORTM_COLORS = {
//   primary: "#1B5E20",           // Vert ORTM principal
//   primaryLight: "#4CAF50",      // Vert clair
//   primaryDark: "#0D3D12",       // Vert foncé
//   secondary: "#FFC107",         // Jaune ORTM
//   secondaryLight: "#FFD54F",    // Jaune clair
//   secondaryDark: "#FF8F00",     // Jaune foncé
//   background: "#F8FDF9",        // Vert très clair
//   surface: "#FFFFFF",           // Blanc
//   text: "#1A331C",              // Vert anthracite
//   error: "#D32F2F",             // Rouge pour erreurs
//   success: "#2E7D32",           // Vert succès
//   warning: "#FF9800"            // Orange avertissement
// };

// const EmployModal = ({
//   openDialog,
//   handleCloseDialog,
//   editingEmploye,
//   formData,
//   errors,
//   handleChange,
//   handleSubmit,
//   loading,
//   departements,
//   theme
// }) => {
//   const [activeStep, setActiveStep] = React.useState(0);

//   const steps = [
//     { label: 'Informations Personnelles', icon: <PersonIcon /> },
//     { label: 'Poste & Département', icon: <WorkIcon /> },
//     { label: 'Contact & Statut', icon: <ContactMailIcon /> }
//   ];

//   const handleNext = () => {
//     setActiveStep((prev) => prev + 1);
//   };

//   const handleBack = () => {
//     setActiveStep((prev) => prev - 1);
//   };

//   const handleStepClick = (step) => {
//     setActiveStep(step);
//   };

//   const getStepContent = (step) => {
//     switch (step) {
//       case 0:
//         return (
//           <Grid container spacing={3}>
//             <Grid item xs={12} sm={6}>
//               <TextField
//                 fullWidth
//                 label="Matricule"
//                 name="matricule"
//                 value={formData.matricule}
//                 onChange={handleChange}
//                 error={!!errors.matricule}
//                 helperText={errors.matricule}
//                 disabled={!!editingEmploye}
//                 required
//                 InputProps={{
//                   startAdornment: (
//                     <InputAdornment position="start">
//                       <BadgeIcon sx={{ color: ORTM_COLORS.primary }} />
//                     </InputAdornment>
//                   ),
//                 }}
//                 sx={{
//                   '& .MuiOutlinedInput-root': {
//                     borderRadius: 3,
//                     backgroundColor: ORTM_COLORS.surface,
//                     transition: 'all 0.3s ease',
//                     '&:hover fieldset': {
//                       borderColor: ORTM_COLORS.primaryLight,
//                       boxShadow: `0 0 0 2px ${alpha(ORTM_COLORS.primary, 0.1)}`,
//                     },
//                     '&.Mui-focused fieldset': {
//                       borderColor: ORTM_COLORS.primary,
//                       boxShadow: `0 0 0 3px ${alpha(ORTM_COLORS.primary, 0.1)}`,
//                     },
//                   },
//                   '& .MuiInputLabel-root.Mui-focused': {
//                     color: ORTM_COLORS.primary,
//                     fontWeight: '600',
//                   }
//                 }}
//               />
//             </Grid>

//             <Grid item xs={12} sm={6}>
//               <TextField
//                 fullWidth
//                 label="Titre"
//                 name="titre"
//                 value={formData.titre}
//                 onChange={handleChange}
//                 select
//                 required
//                 sx={{
//                   '& .MuiOutlinedInput-root': {
//                     borderRadius: 3,
//                     backgroundColor: ORTM_COLORS.surface,
//                     transition: 'all 0.3s ease',
//                     '&:hover fieldset': {
//                       borderColor: ORTM_COLORS.primaryLight,
//                     },
//                     '&.Mui-focused fieldset': {
//                       borderColor: ORTM_COLORS.primary,
//                     },
//                   },
//                   '& .MuiInputLabel-root.Mui-focused': {
//                     color: ORTM_COLORS.primary,
//                     fontWeight: '600',
//                   }
//                 }}
//               >
//                 <MenuItem value="stagiaire">
//                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
//                     <PersonIcon fontSize="small" sx={{ color: ORTM_COLORS.secondary }} />
//                     <Box>
//                       <Typography variant="body1" fontWeight="600">Stagiaire</Typography>
//                       <Typography variant="caption" color="text.secondary">
//                         Stage temporaire
//                       </Typography>
//                     </Box>
//                   </Box>
//                 </MenuItem>
//                 <MenuItem value="employe">
//                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
//                     <WorkIcon fontSize="small" sx={{ color: ORTM_COLORS.primary }} />
//                     <Box>
//                       <Typography variant="body1" fontWeight="600">Employé Fixe</Typography>
//                       <Typography variant="caption" color="text.secondary">
//                         Contrat permanent
//                       </Typography>
//                     </Box>
//                   </Box>
//                 </MenuItem>
//               </TextField>
//             </Grid>

//             <Grid item xs={12} sm={6}>
//               <TextField
//                 fullWidth
//                 label="Nom"
//                 name="nom"
//                 value={formData.nom}
//                 onChange={handleChange}
//                 error={!!errors.nom}
//                 helperText={errors.nom}
//                 required
//                 sx={{
//                   '& .MuiOutlinedInput-root': {
//                     borderRadius: 3,
//                     backgroundColor: ORTM_COLORS.surface,
//                     transition: 'all 0.3s ease',
//                     '&:hover fieldset': {
//                       borderColor: ORTM_COLORS.primaryLight,
//                     },
//                     '&.Mui-focused fieldset': {
//                       borderColor: ORTM_COLORS.primary,
//                     },
//                   },
//                   '& .MuiInputLabel-root.Mui-focused': {
//                     color: ORTM_COLORS.primary,
//                     fontWeight: '600',
//                   }
//                 }}
//               />
//             </Grid>

//             <Grid item xs={12} sm={6}>
//               <TextField
//                 fullWidth
//                 label="Prénom"
//                 name="prenom"
//                 value={formData.prenom}
//                 onChange={handleChange}
//                 error={!!errors.prenom}
//                 helperText={errors.prenom}
//                 required
//                 sx={{
//                   '& .MuiOutlinedInput-root': {
//                     borderRadius: 3,
//                     backgroundColor: ORTM_COLORS.surface,
//                     transition: 'all 0.3s ease',
//                     '&:hover fieldset': {
//                       borderColor: ORTM_COLORS.primaryLight,
//                     },
//                     '&.Mui-focused fieldset': {
//                       borderColor: ORTM_COLORS.primary,
//                     },
//                   },
//                   '& .MuiInputLabel-root.Mui-focused': {
//                     color: ORTM_COLORS.primary,
//                     fontWeight: '600',
//                   }
//                 }}
//               />
//             </Grid>
//           </Grid>
//         );
//       case 1:
//         return (
//           <Grid container spacing={3}>
//             <Grid item xs={12} sm={6}>
//               <TextField
//                 fullWidth
//                 label="Poste"
//                 name="poste"
//                 value={formData.poste}
//                 onChange={handleChange}
//                 error={!!errors.poste}
//                 helperText={errors.poste}
//                 required
//                 InputProps={{
//                   startAdornment: (
//                     <InputAdornment position="start">
//                       <WorkIcon sx={{ color: ORTM_COLORS.primary }} />
//                     </InputAdornment>
//                   ),
//                 }}
//                 sx={{
//                   '& .MuiOutlinedInput-root': {
//                     borderRadius: 3,
//                     backgroundColor: ORTM_COLORS.surface,
//                     transition: 'all 0.3s ease',
//                     '&:hover fieldset': {
//                       borderColor: ORTM_COLORS.primaryLight,
//                     },
//                     '&.Mui-focused fieldset': {
//                       borderColor: ORTM_COLORS.primary,
//                     },
//                   },
//                   '& .MuiInputLabel-root.Mui-focused': {
//                     color: ORTM_COLORS.primary,
//                     fontWeight: '600',
//                   }
//                 }}
//               />
//             </Grid>

//             <Grid item xs={12} sm={6}>
//               <TextField
//                 fullWidth
//                 label="Département"
//                 name="departement_pk"
//                 value={formData.departement_pk}
//                 onChange={handleChange}
//                 select
//                 required
//                 error={!!errors.departement_pk}
//                 helperText={errors.departement_pk}
//                 InputProps={{
//                   startAdornment: (
//                     <InputAdornment position="start">
//                       <BusinessIcon sx={{ color: ORTM_COLORS.primary }} />
//                     </InputAdornment>
//                   ),
//                 }}
//                 sx={{
//                   '& .MuiOutlinedInput-root': {
//                     borderRadius: 3,
//                     backgroundColor: ORTM_COLORS.surface,
//                     transition: 'all 0.3s ease',
//                     '&:hover fieldset': {
//                       borderColor: ORTM_COLORS.primaryLight,
//                     },
//                     '&.Mui-focused fieldset': {
//                       borderColor: ORTM_COLORS.primary,
//                     },
//                   },
//                   '& .MuiInputLabel-root.Mui-focused': {
//                     color: ORTM_COLORS.primary,
//                     fontWeight: '600',
//                   }
//                 }}
//               >
//                 {departements.map((dept) => (
//                   <MenuItem key={dept.id_departement} value={dept.id_departement}>
//                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
//                       <CorporateFareIcon fontSize="small" sx={{ color: ORTM_COLORS.primary }} />
//                       <Box>
//                         <Typography variant="body1" fontWeight="600">{dept.nom}</Typography>
//                         <Typography variant="caption" color="text.secondary">
//                           Département
//                         </Typography>
//                       </Box>
//                     </Box>
//                   </MenuItem>
//                 ))}
//               </TextField>
//             </Grid>
//           </Grid>
//         );
//       case 2:
//         return (
//           <Grid container spacing={3}>
//             <Grid item xs={12} sm={6}>
//               <TextField
//                 fullWidth
//                 label="Email"
//                 name="email"
//                 type="email"
//                 value={formData.email}
//                 onChange={handleChange}
//                 error={!!errors.email}
//                 helperText={errors.email}
//                 required
//                 InputProps={{
//                   startAdornment: (
//                     <InputAdornment position="start">
//                       <EmailIcon sx={{ color: ORTM_COLORS.primary }} />
//                     </InputAdornment>
//                   ),
//                 }}
//                 sx={{
//                   '& .MuiOutlinedInput-root': {
//                     borderRadius: 3,
//                     backgroundColor: ORTM_COLORS.surface,
//                     transition: 'all 0.3s ease',
//                     '&:hover fieldset': {
//                       borderColor: ORTM_COLORS.primaryLight,
//                     },
//                     '&.Mui-focused fieldset': {
//                       borderColor: ORTM_COLORS.primary,
//                     },
//                   },
//                   '& .MuiInputLabel-root.Mui-focused': {
//                     color: ORTM_COLORS.primary,
//                     fontWeight: '600',
//                   }
//                 }}
//               />
//             </Grid>

//             <Grid item xs={12} sm={6}>
//               <TextField
//                 fullWidth
//                 label="Téléphone"
//                 name="telephone"
//                 value={formData.telephone}
//                 onChange={handleChange}
//                 error={!!errors.telephone}
//                 helperText={errors.telephone}
//                 InputProps={{
//                   startAdornment: (
//                     <InputAdornment position="start">
//                       <PhoneIcon sx={{ color: ORTM_COLORS.primary }} />
//                     </InputAdornment>
//                   ),
//                 }}
//                 sx={{
//                   '& .MuiOutlinedInput-root': {
//                     borderRadius: 3,
//                     backgroundColor: ORTM_COLORS.surface,
//                     transition: 'all 0.3s ease',
//                     '&:hover fieldset': {
//                       borderColor: ORTM_COLORS.primaryLight,
//                     },
//                     '&.Mui-focused fieldset': {
//                       borderColor: ORTM_COLORS.primary,
//                     },
//                   },
//                   '& .MuiInputLabel-root.Mui-focused': {
//                     color: ORTM_COLORS.primary,
//                     fontWeight: '600',
//                   }
//                 }}
//               />
//             </Grid>

//             <Grid item xs={12}>
//               <TextField
//                 fullWidth
//                 label="Statut"
//                 name="statut"
//                 value={formData.statut}
//                 onChange={handleChange}
//                 select
//                 required
//                 sx={{
//                   '& .MuiOutlinedInput-root': {
//                     borderRadius: 3,
//                     backgroundColor: formData.statut === 'actif' 
//                       ? alpha(ORTM_COLORS.success, 0.05)
//                       : alpha(ORTM_COLORS.warning, 0.05),
//                     transition: 'all 0.3s ease',
//                     '&:hover fieldset': {
//                       borderColor: formData.statut === 'actif' ? ORTM_COLORS.success : ORTM_COLORS.warning,
//                     },
//                     '&.Mui-focused fieldset': {
//                       borderColor: formData.statut === 'actif' ? ORTM_COLORS.success : ORTM_COLORS.warning,
//                     },
//                   },
//                   '& .MuiInputLabel-root.Mui-focused': {
//                     color: ORTM_COLORS.primary,
//                     fontWeight: '600',
//                   }
//                 }}
//               >
//                 <MenuItem value="actif">
//                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
//                     <CheckCircleIcon sx={{ color: ORTM_COLORS.success }} />
//                     <Box>
//                       <Typography variant="body1" fontWeight="600" color={ORTM_COLORS.success}>
//                         Actif
//                       </Typography>
//                       <Typography variant="caption" color="text.secondary">
//                         Employé en activité
//                       </Typography>
//                     </Box>
//                   </Box>
//                 </MenuItem>
//                 <MenuItem value="inactif">
//                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
//                     <CancelIcon sx={{ color: ORTM_COLORS.warning }} />
//                     <Box>
//                       <Typography variant="body1" fontWeight="600" color={ORTM_COLORS.warning}>
//                         Inactif
//                       </Typography>
//                       <Typography variant="caption" color="text.secondary">
//                         Employé inactif
//                       </Typography>
//                     </Box>
//                   </Box>
//                 </MenuItem>
//               </TextField>
//             </Grid>
//           </Grid>
//         );
//       default:
//         return 'Step inconnu';
//     }
//   };

//   return (
//     <Dialog 
//       open={openDialog} 
//       onClose={handleCloseDialog} 
//       maxWidth="lg" 
//       fullWidth
//       PaperProps={{
//         sx: {
//           borderRadius: 4,
//           background: `linear-gradient(135deg, ${ORTM_COLORS.background} 0%, ${ORTM_COLORS.surface} 100%)`,
//           boxShadow: `0 25px 70px ${alpha(ORTM_COLORS.primary, 0.2)}`,
//           overflow: 'hidden',
//           border: `1px solid ${alpha(ORTM_COLORS.primary, 0.1)}`,
//           minHeight: '600px'
//         }
//       }}
//     >
//       {/* En-tête avec dégradé ORTM */}
//       <DialogTitle sx={{
//         background: `linear-gradient(135deg, ${ORTM_COLORS.primary} 0%, ${ORTM_COLORS.primaryDark} 100%)`,
//         color: ORTM_COLORS.surface,
//         py: 4,
//         position: 'relative',
//         overflow: 'hidden'
//       }}>
//         {/* Éléments décoratifs */}
//         <Box sx={{
//           position: 'absolute',
//           top: -50,
//           right: -50,
//           width: 200,
//           height: 200,
//           borderRadius: '50%',
//           background: `radial-gradient(circle, ${alpha(ORTM_COLORS.secondary, 0.2)} 0%, transparent 70%)`,
//         }} />
        
//         <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, position: 'relative', zIndex: 1 }}>
//           <Avatar 
//             sx={{ 
//               bgcolor: alpha(ORTM_COLORS.surface, 0.2),
//               width: 60,
//               height: 60,
//               backdropFilter: 'blur(10px)',
//               border: `2px solid ${alpha(ORTM_COLORS.surface, 0.3)}`
//             }}
//           >
//             {editingEmploye ? <EditIcon /> : <AddIcon />}
//           </Avatar>
//           <Box sx={{ flex: 1 }}>
//             <Typography variant="h4" fontWeight="700" sx={{ mb: 1 }}>
//               {editingEmploye ? "Modifier l'employé" : "Nouvel employé"}
//             </Typography>
//             <Typography variant="body1" sx={{ opacity: 0.9 }}>
//               {editingEmploye ? "Mettez à jour les informations de l'employé" : "Ajoutez un nouveau membre à votre équipe ORTM"}
//             </Typography>
//           </Box>

//           {/* Badge statut si édition */}
//           {editingEmploye && (
//             <Chip 
//               icon={formData.statut === 'actif' ? <CheckCircleIcon /> : <CancelIcon />}
//               label={formData.statut === 'actif' ? 'Actif' : 'Inactif'}
//               sx={{ 
//                 color: ORTM_COLORS.surface,
//                 fontWeight: '700',
//                 fontSize: '0.9rem',
//                 backgroundColor: formData.statut === 'actif' ? ORTM_COLORS.success : ORTM_COLORS.warning,
//                 '& .MuiChip-icon': { color: ORTM_COLORS.surface },
//                 boxShadow: `0 4px 15px ${alpha(ORTM_COLORS.text, 0.3)}`,
//               }}
//             />
//           )}
//         </Box>
//       </DialogTitle>

//       <form onSubmit={handleSubmit}>
//         <DialogContent sx={{ p: 0 }}>
//           <Grid container>
//             {/* Stepper latéral */}
//             <Grid item xs={12} md={4}>
//               <Box sx={{ 
//                 p: 4, 
//                 height: '100%',
//                 background: `linear-gradient(135deg, ${alpha(ORTM_COLORS.primary, 0.02)} 0%, ${alpha(ORTM_COLORS.primary, 0.05)} 100%)`,
//                 borderRight: `1px solid ${alpha(ORTM_COLORS.primary, 0.1)}`
//               }}>
//                 <Typography variant="h6" fontWeight="600" sx={{ mb: 3, color: ORTM_COLORS.primary }}>
//                   Configuration
//                 </Typography>
                
//                 <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
//                   {steps.map((step, index) => (
//                     <Card 
//                       key={step.label}
//                       onClick={() => handleStepClick(index)}
//                       sx={{
//                         cursor: 'pointer',
//                         borderRadius: 3,
//                         border: `2px solid ${activeStep === index ? ORTM_COLORS.primary : alpha(ORTM_COLORS.primary, 0.1)}`,
//                         background: activeStep === index 
//                           ? `linear-gradient(135deg, ${alpha(ORTM_COLORS.primary, 0.1)} 0%, ${alpha(ORTM_COLORS.primary, 0.05)} 100%)`
//                           : ORTM_COLORS.surface,
//                         transition: 'all 0.3s ease',
//                         '&:hover': {
//                           borderColor: ORTM_COLORS.primaryLight,
//                           transform: 'translateY(-2px)',
//                           boxShadow: `0 8px 25px ${alpha(ORTM_COLORS.primary, 0.15)}`,
//                         }
//                       }}
//                     >
//                       <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
//                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
//                           <Box sx={{
//                             p: 1,
//                             borderRadius: 2,
//                             background: activeStep === index 
//                               ? `linear-gradient(135deg, ${ORTM_COLORS.primary} 0%, ${ORTM_COLORS.primaryLight} 100%)`
//                               : alpha(ORTM_COLORS.primary, 0.1),
//                             color: activeStep === index ? ORTM_COLORS.surface : ORTM_COLORS.primary,
//                             display: 'flex',
//                             alignItems: 'center',
//                             justifyContent: 'center'
//                           }}>
//                             {step.icon}
//                           </Box>
//                           <Box>
//                             <Typography variant="body1" fontWeight="600">
//                               {step.label}
//                             </Typography>
//                             <Typography variant="caption" color="text.secondary">
//                               Étape {index + 1}
//                             </Typography>
//                           </Box>
//                         </Box>
//                       </CardContent>
//                     </Card>
//                   ))}
//                 </Box>

//                 {/* Aperçu de l'employé */}
//                 {(formData.nom || formData.prenom) && (
//                   <Card sx={{ 
//                     mt: 4, 
//                     borderRadius: 3,
//                     background: `linear-gradient(135deg, ${alpha(ORTM_COLORS.primary, 0.05)} 0%, ${alpha(ORTM_COLORS.primary, 0.02)} 100%)`,
//                     border: `1px solid ${alpha(ORTM_COLORS.primary, 0.1)}`
//                   }}>
//                     <CardContent sx={{ p: 3 }}>
//                       <Typography variant="h6" fontWeight="600" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
//                         <VisibilityIcon fontSize="small" />
//                         Aperçu
//                       </Typography>
//                       <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
//                         <Avatar 
//                           sx={{ 
//                             width: 60, 
//                             height: 60,
//                             bgcolor: ORTM_COLORS.primary,
//                             fontSize: '1.25rem',
//                             fontWeight: 'bold',
//                             boxShadow: `0 4px 15px ${alpha(ORTM_COLORS.primary, 0.3)}`
//                           }}
//                         >
//                           {formData.prenom?.[0]}{formData.nom?.[0]}
//                         </Avatar>
//                         <Box>
//                           <Typography variant="h6" fontWeight="700" sx={{ color: ORTM_COLORS.text }}>
//                             {`${formData.prenom || ''} ${formData.nom || ''}`.trim()}
//                           </Typography>
//                           <Typography variant="body2" sx={{ color: ORTM_COLORS.text, mb: 0.5 }}>
//                             {formData.poste || 'Poste non défini'}
//                           </Typography>
//                           <Chip 
//                             label={formData.matricule || 'Matricule non défini'} 
//                             size="small" 
//                             variant="outlined"
//                             sx={{ 
//                               fontWeight: '600',
//                               borderColor: ORTM_COLORS.primary,
//                               color: ORTM_COLORS.primary
//                             }}
//                           />
//                         </Box>
//                       </Box>
//                     </CardContent>
//                   </Card>
//                 )}
//               </Box>
//             </Grid>

//             {/* Contenu du formulaire */}
//             <Grid item xs={12} md={8}>
//               <Box sx={{ p: 4 }}>
//                 <Typography variant="h5" fontWeight="600" sx={{ mb: 4, color: ORTM_COLORS.primary }}>
//                   {steps[activeStep].label}
//                 </Typography>
                
//                 {getStepContent(activeStep)}

//                 {/* Navigation des étapes */}
//                 {!editingEmploye && (
//                   <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 3, borderTop: `1px solid ${alpha(ORTM_COLORS.primary, 0.1)}` }}>
//                     <Button
//                       onClick={handleBack}
//                       disabled={activeStep === 0}
//                       startIcon={<CloseIcon />}
//                       sx={{
//                         borderRadius: 3,
//                         px: 4,
//                         py: 1.5,
//                         border: `1px solid ${alpha(ORTM_COLORS.primary, 0.3)}`,
//                         color: ORTM_COLORS.text,
//                         fontWeight: '600',
//                         '&:hover': {
//                           backgroundColor: alpha(ORTM_COLORS.primary, 0.05),
//                           borderColor: ORTM_COLORS.primary,
//                         }
//                       }}
//                     >
//                       Retour
//                     </Button>
                    
//                     {activeStep < steps.length - 1 ? (
//                       <Button
//                         onClick={handleNext}
//                         endIcon={<SettingsIcon />}
//                         sx={{
//                           borderRadius: 3,
//                           px: 4,
//                           py: 1.5,
//                           background: `linear-gradient(135deg, ${ORTM_COLORS.primary} 0%, ${ORTM_COLORS.primaryLight} 100%)`,
//                           color: ORTM_COLORS.surface,
//                           fontWeight: '600',
//                           boxShadow: `0 4px 15px ${alpha(ORTM_COLORS.primary, 0.3)}`,
//                           '&:hover': {
//                             boxShadow: `0 6px 20px ${alpha(ORTM_COLORS.primary, 0.4)}`,
//                             transform: 'translateY(-1px)',
//                           }
//                         }}
//                       >
//                         Suivant
//                       </Button>
//                     ) : null}
//                   </Box>
//                 )}
//               </Box>
//             </Grid>
//           </Grid>
//         </DialogContent>

//         {/* Actions */}
//         <DialogActions sx={{ 
//           p: 4, 
//           gap: 2, 
//           background: alpha(ORTM_COLORS.primary, 0.02),
//           borderTop: `1px solid ${alpha(ORTM_COLORS.primary, 0.1)}`
//         }}>
//           <Button 
//             onClick={handleCloseDialog} 
//             color="inherit"
//             startIcon={<CloseIcon />}
//             disabled={loading}
//             sx={{ 
//               borderRadius: 3, 
//               px: 4,
//               py: 1.5,
//               border: `1px solid ${alpha(ORTM_COLORS.primary, 0.3)}`,
//               color: ORTM_COLORS.text,
//               fontWeight: '600',
//               '&:hover': {
//                 backgroundColor: alpha(ORTM_COLORS.primary, 0.05),
//                 borderColor: ORTM_COLORS.primary,
//               }
//             }}
//           >
//             Annuler
//           </Button>
          
//           <Button
//             type="submit"
//             variant="contained"
//             disabled={loading}
//             startIcon={loading ? 
//               <CircularProgress size={20} sx={{ color: ORTM_COLORS.surface }} /> : 
//               (editingEmploye ? <EditIcon /> : <AddIcon />)
//             }
//             sx={{ 
//               borderRadius: 3, 
//               px: 5, 
//               py: 1.5,
//               background: `linear-gradient(135deg, ${ORTM_COLORS.primary} 0%, ${ORTM_COLORS.secondary} 100%)`,
//               boxShadow: `0 6px 20px ${alpha(ORTM_COLORS.primary, 0.4)}`,
//               color: ORTM_COLORS.surface,
//               fontWeight: '700',
//               fontSize: '1rem',
//               '&:hover': {
//                 boxShadow: `0 8px 25px ${alpha(ORTM_COLORS.primary, 0.5)}`,
//                 transform: 'translateY(-2px)',
//                 background: `linear-gradient(135deg, ${ORTM_COLORS.primaryDark} 0%, ${ORTM_COLORS.secondaryDark} 100%)`,
//               },
//               '&:disabled': {
//                 background: alpha(ORTM_COLORS.primary, 0.5),
//                 color: ORTM_COLORS.surface
//               },
//               transition: 'all 0.3s ease'
//             }}
//           >
//             {loading ? 'Traitement...' : (editingEmploye ? 'Mettre à jour' : 'Créer l\'employé')}
//           </Button>
//         </DialogActions>
//       </form>
//     </Dialog>
//   );
// };

// export default EmployModal;