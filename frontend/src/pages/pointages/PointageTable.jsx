import React, { useState } from "react";
import {
  TableContainer, Table, TableHead, TableRow, TableCell,
  TableBody, IconButton, Chip, Box, Avatar, Typography,
  Tooltip, CircularProgress, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Paper,
  Badge, alpha, useTheme, LinearProgress, Card, CardContent
} from "@mui/material";
import { format, parseISO, isValid } from "date-fns";
import { fr } from "date-fns/locale";

import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import InfoIcon from '@mui/icons-material/Info';
import ListAltIcon from '@mui/icons-material/ListAlt';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ScheduleIcon from '@mui/icons-material/Schedule';
import TodayIcon from '@mui/icons-material/Today';
import WorkHistoryIcon from '@mui/icons-material/WorkHistory';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';

// Palette de couleurs ORTM
const ORTM_COLORS = {
  primary: "#1B5E20",
  primaryLight: "#4CAF50",
  primaryDark: "#0D3D12",
  secondary: "#FFC107",
  secondaryLight: "#FFD54F",
  secondaryDark: "#FF8F00",
  background: "#F8FDF9",
  surface: "#FFFFFF",
  text: "#1A331C",
  error: "#D32F2F",
  success: "#2E7D32",
  warning: "#FF9800",
  info: "#1976D2"
};

const PointageTable = ({
  pointages,
  loading,
  actionLoading,
  deletingId,
  onEdit,
  onDelete,
  onViewDetails,
  onUpdatePointage,
  theme,
  currentUser
}) => {
  const currentTheme = useTheme();
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const [selectedPointage, setSelectedPointage] = useState(null);
  const [exitRemarque, setExitRemarque] = useState("");
  const [exitLoading, setExitLoading] = useState(false);

  const hasPermission = (pointage) => {
    if (!currentUser || !pointage || !pointage.employe) {
      console.warn("Permission refusée: utilisateur ou pointage invalide", { currentUser, pointage });
      return false;
    }
    const isSuperuser = currentUser.is_superuser;
    const isCreator = pointage.created_by === currentUser.id;
    return isSuperuser || isCreator;
  };

  const handleOpenExitDialog = (pointage) => {
    setSelectedPointage(pointage);
    setExitRemarque(pointage.remarque || "");
    setExitDialogOpen(true);
  };

  const handleCloseExitDialog = () => {
    setExitDialogOpen(false);
    setSelectedPointage(null);
    setExitRemarque("");
  };

  const handleExitSubmit = async () => {
    if (!selectedPointage) return;

    setExitLoading(true);
    try {
      const currentTime = new Date();
      const heureSortie = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`;
      
      const updateData = {
        id_pointage: selectedPointage.id_pointage,
        employe: selectedPointage.employe,
        date_pointage: selectedPointage.date_pointage,
        heure_entree: selectedPointage.heure_entree,
        heure_sortie: `${heureSortie}:00`,
        remarque: exitRemarque || null
      };

      if (onUpdatePointage) {
        await onUpdatePointage(selectedPointage.id_pointage, updateData);
      } else {
        const updatedPointage = {
          ...selectedPointage,
          heure_sortie: heureSortie,
          remarque: exitRemarque || null
        };
        onEdit(updatedPointage);
      }

      handleCloseExitDialog();
    } catch (error) {
      console.error("Erreur lors de la mise à jour du pointage:", error);
    } finally {
      setExitLoading(false);
    }
  };

  const isWorking = (pointage) => {
    return !pointage.heure_sortie;
  };

  const calculateWorkingTime = (pointage) => {
    if (!pointage.heure_entree || pointage.heure_sortie) return null;
    
    try {
      const [hours, minutes] = pointage.heure_entree.split(':').map(Number);
      const startTime = new Date();
      startTime.setHours(hours, minutes, 0, 0);
      const now = new Date();
      const diffMs = now - startTime;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      return `${diffHours}h ${diffMinutes.toString().padStart(2, '0')}min`;
    } catch (error) {
      return null;
    }
  };

  const getStatusConfig = (pointage) => {
    if (pointage.heure_sortie) {
      return {
        color: ORTM_COLORS.success,
        bgColor: alpha(ORTM_COLORS.success, 0.1),
        icon: <StopIcon />,
        label: "Terminé"
      };
    } else {
      return {
        color: ORTM_COLORS.warning,
        bgColor: alpha(ORTM_COLORS.warning, 0.1),
        icon: <PlayArrowIcon />,
        label: "En Cours"
      };
    }
  };

  if (loading) {
    return (
      <Card sx={{ 
        borderRadius: 4,
        background: `linear-gradient(135deg, ${ORTM_COLORS.background} 0%, ${ORTM_COLORS.surface} 100%)`,
        boxShadow: `0 12px 35px ${alpha(ORTM_COLORS.primary, 0.08)}`,
        border: `1px solid ${alpha(ORTM_COLORS.primary, 0.1)}`,
        textAlign: "center", 
        py: 8 
      }}>
        <CardContent>
          <CircularProgress size={60} thickness={4} sx={{ color: ORTM_COLORS.primary, mb: 3 }} />
          <Typography variant="h6" fontWeight="600" color={ORTM_COLORS.text}>
            Chargement des pointages...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (!pointages || pointages.length === 0) {
    return (
      <Card sx={{ 
        borderRadius: 4,
        background: `linear-gradient(135deg, ${ORTM_COLORS.background} 0%, ${ORTM_COLORS.surface} 100%)`,
        boxShadow: `0 12px 35px ${alpha(ORTM_COLORS.primary, 0.08)}`,
        border: `1px solid ${alpha(ORTM_COLORS.primary, 0.1)}`,
        textAlign: "center", 
        py: 6 
      }}>
        <CardContent>
          <Box sx={{ 
            display: 'inline-flex',
            p: 3,
            mb: 3,
            borderRadius: 4,
            background: `linear-gradient(135deg, ${alpha(ORTM_COLORS.primary, 0.1)} 0%, ${alpha(ORTM_COLORS.primary, 0.05)} 100%)`,
            color: ORTM_COLORS.primary
          }}>
            <AccessTimeIcon sx={{ fontSize: 64 }} />
          </Box>
          <Typography variant="h5" fontWeight="700" color={ORTM_COLORS.text} sx={{ mb: 2 }}>
            Aucun pointage trouvé
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Aucun pointage n'a été enregistré pour le moment
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Paper sx={{ 
        width: "100%", 
        overflow: "hidden", 
        borderRadius: 4,
        background: `linear-gradient(135deg, ${currentTheme.palette.background.paper} 0%, ${alpha(ORTM_COLORS.primary, 0.02)} 100%)`,
        boxShadow: `0 12px 35px ${alpha(ORTM_COLORS.primary, 0.08)}`,
        border: `1px solid ${alpha(ORTM_COLORS.primary, 0.1)}`,
      }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ 
                background: `linear-gradient(135deg, ${alpha(ORTM_COLORS.primary, 0.05)} 0%, ${alpha(ORTM_COLORS.primary, 0.1)} 100%)`,
              }}>
                <TableCell sx={{ 
                  fontWeight: '800', 
                  fontSize: '0.95rem',
                  color: ORTM_COLORS.primary,
                  borderBottom: `2px solid ${alpha(ORTM_COLORS.primary, 0.2)}`,
                  py: 3,
                  width: '140px'
                }}>
                  ID Pointage
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: '800', 
                  fontSize: '0.95rem',
                  color: ORTM_COLORS.primary,
                  borderBottom: `2px solid ${alpha(ORTM_COLORS.primary, 0.2)}`,
                  py: 3
                }}>
                  Employé
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: '800', 
                  fontSize: '0.95rem',
                  color: ORTM_COLORS.primary,
                  borderBottom: `2px solid ${alpha(ORTM_COLORS.primary, 0.2)}`,
                  py: 3,
                  width: '150px'
                }}>
                  Date
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: '800', 
                  fontSize: '0.95rem',
                  color: ORTM_COLORS.primary,
                  borderBottom: `2px solid ${alpha(ORTM_COLORS.primary, 0.2)}`,
                  py: 3,
                  width: '130px'
                }}>
                  Heure Entrée
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: '800', 
                  fontSize: '0.95rem',
                  color: ORTM_COLORS.primary,
                  borderBottom: `2px solid ${alpha(ORTM_COLORS.primary, 0.2)}`,
                  py: 3,
                  width: '160px'
                }}>
                  Heure Sortie
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: '800', 
                  fontSize: '0.95rem',
                  color: ORTM_COLORS.primary,
                  borderBottom: `2px solid ${alpha(ORTM_COLORS.primary, 0.2)}`,
                  py: 3,
                  width: '140px'
                }}>
                  Statut & Durée
                </TableCell>
                <TableCell sx={{ 
                  fontWeight: '800', 
                  fontSize: '0.95rem',
                  color: ORTM_COLORS.primary,
                  borderBottom: `2px solid ${alpha(ORTM_COLORS.primary, 0.2)}`,
                  py: 3,
                  width: '180px'
                }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pointages.map((pointage, index) => {
                if (!pointage || !pointage.id_pointage || !pointage.employe) {
                  console.warn(`Pointage invalide à l'index ${index}:`, pointage);
                  return null;
                }
                
                const canEdit = hasPermission(pointage);
                const working = isWorking(pointage);
                const statusConfig = getStatusConfig(pointage);
                const workingTime = calculateWorkingTime(pointage);
                
                return (
                  <TableRow 
                    key={pointage.id_pointage} 
                    hover
                    sx={{ 
                      transition: 'all 0.3s ease',
                      background: index % 2 === 0 
                        ? alpha(currentTheme.palette.background.default, 0.5)
                        : 'transparent',
                      '&:hover': {
                        background: `linear-gradient(135deg, ${alpha(ORTM_COLORS.primary, 0.05)} 0%, ${alpha(ORTM_COLORS.primary, 0.02)} 100%)`,
                        transform: 'translateY(-2px)',
                        boxShadow: `0 4px 15px ${alpha(ORTM_COLORS.primary, 0.1)}`,
                      },
                      '&:last-child td': {
                        borderBottom: 'none',
                      }
                    }}
                  >
                    {/* ID Pointage */}
                    <TableCell sx={{ py: 2.5 }}>
                      <Badge
                        color="primary"
                        variant="dot"
                        invisible={!working}
                        sx={{ 
                          '& .MuiBadge-dot': {
                            backgroundColor: ORTM_COLORS.warning,
                            boxShadow: `0 0 0 2px ${currentTheme.palette.background.paper}`,
                          }
                        }}
                      >
                        <Chip
                          label={`PTG-${pointage.id_pointage}`}
                          color="primary"
                          variant="outlined"
                          sx={{
                            fontWeight: '700',
                            borderRadius: 2,
                            border: `2px solid ${alpha(ORTM_COLORS.primary, 0.2)}`,
                            background: `linear-gradient(135deg, ${alpha(ORTM_COLORS.primary, 0.1)} 0%, ${alpha(ORTM_COLORS.primary, 0.05)} 100%)`,
                          }}
                        />
                      </Badge>
                    </TableCell>

                    {/* Employé */}
                    <TableCell sx={{ py: 2.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                          sx={{
                            bgcolor: alpha(ORTM_COLORS.primary, 0.2),
                            color: ORTM_COLORS.primary,
                            width: 48,
                            height: 48,
                            border: `2px solid ${alpha(ORTM_COLORS.primary, 0.2)}`,
                            boxShadow: `0 4px 12px ${alpha(ORTM_COLORS.primary, 0.2)}`,
                          }}
                        >
                          <PersonIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="700" sx={{ mb: 0.5 }}>
                            {String(pointage.employe_nom || "Inconnu")}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Matricule: {String(pointage.employe_matricule || pointage.employe || "Inconnu")}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Date */}
                    <TableCell sx={{ py: 2.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ 
                          p: 0.75, 
                          borderRadius: 2, 
                          background: `linear-gradient(135deg, ${alpha(ORTM_COLORS.info, 0.1)} 0%, ${alpha(ORTM_COLORS.info, 0.2)} 100%)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <TodayIcon fontSize="small" sx={{ color: ORTM_COLORS.info }} />
                        </Box>
                        <Typography variant="body2" fontWeight="600">
                          {pointage.date_pointage && isValid(parseISO(pointage.date_pointage))
                            ? format(parseISO(pointage.date_pointage), "dd MMMM yyyy", { locale: fr })
                            : "-"}
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* Heure Entrée */}
                    <TableCell sx={{ py: 2.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ 
                          p: 0.75, 
                          borderRadius: 2, 
                          background: `linear-gradient(135deg, ${alpha(ORTM_COLORS.success, 0.1)} 0%, ${alpha(ORTM_COLORS.success, 0.2)} 100%)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <PlayArrowIcon fontSize="small" sx={{ color: ORTM_COLORS.success }} />
                        </Box>
                        <Typography variant="body2" fontWeight="600">
                          {pointage.heure_entree || "-"}
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* Heure Sortie */}
                    <TableCell sx={{ py: 2.5 }}>
                      {pointage.heure_sortie ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{ 
                            p: 0.75, 
                            borderRadius: 2, 
                            background: `linear-gradient(135deg, ${alpha(ORTM_COLORS.error, 0.1)} 0%, ${alpha(ORTM_COLORS.error, 0.2)} 100%)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <StopIcon fontSize="small" sx={{ color: ORTM_COLORS.error }} />
                          </Box>
                          <Typography variant="body2" fontWeight="600">
                            {pointage.heure_sortie}
                          </Typography>
                        </Box>
                      ) : (
                        <Button
                          variant="outlined"
                          color="warning"
                          size="small"
                          startIcon={<ExitToAppIcon />}
                          onClick={() => handleOpenExitDialog(pointage)}
                          disabled={!canEdit || actionLoading}
                          sx={{
                            borderRadius: 3,
                            fontWeight: '600',
                            border: `2px solid ${alpha(ORTM_COLORS.warning, 0.3)}`,
                            background: alpha(ORTM_COLORS.warning, 0.05),
                            '&:hover': {
                              background: alpha(ORTM_COLORS.warning, 0.1),
                              borderColor: ORTM_COLORS.warning,
                              transform: 'translateY(-1px)',
                            },
                            transition: 'all 0.3s ease'
                          }}
                        >
                          Enregistrer Sortie
                        </Button>
                      )}
                    </TableCell>

                    {/* Statut & Durée */}
                    <TableCell sx={{ py: 2.5 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Chip
                          icon={statusConfig.icon}
                          label={statusConfig.label}
                          sx={{
                            fontWeight: '700',
                            borderRadius: 2,
                            background: statusConfig.bgColor,
                            color: statusConfig.color,
                            border: `2px solid ${alpha(statusConfig.color, 0.3)}`,
                            '& .MuiChip-icon': {
                              color: statusConfig.color,
                            }
                          }}
                        />
                        {working && workingTime && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <WorkHistoryIcon fontSize="small" sx={{ color: ORTM_COLORS.warning }} />
                            <Typography variant="caption" fontWeight="600" color={ORTM_COLORS.warning}>
                              {workingTime}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </TableCell>

                    {/* Actions */}
                    <TableCell sx={{ py: 2.5 }}>
                      {canEdit ? (
                        <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                          <Tooltip title="Modifier le pointage" arrow>
                            <IconButton
                              color="primary"
                              onClick={() => onEdit(pointage)} 
                              disabled={actionLoading}
                              size="medium"
                              sx={{
                                background: `linear-gradient(135deg, ${alpha(ORTM_COLORS.primary, 0.1)} 0%, ${alpha(ORTM_COLORS.primary, 0.2)} 100%)`,
                                border: `1px solid ${alpha(ORTM_COLORS.primary, 0.2)}`,
                                borderRadius: 2,
                                '&:hover': {
                                  background: `linear-gradient(135deg, ${alpha(ORTM_COLORS.primary, 0.2)} 0%, ${alpha(ORTM_COLORS.primary, 0.3)} 100%)`,
                                  transform: 'scale(1.1)',
                                  boxShadow: `0 6px 20px ${alpha(ORTM_COLORS.primary, 0.3)}`,
                                },
                                transition: 'all 0.3s ease',
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Supprimer le pointage" arrow>
                            <IconButton
                              color="error"
                              onClick={() => onDelete(pointage.id_pointage)} 
                              disabled={actionLoading}
                              size="medium"
                              sx={{
                                background: `linear-gradient(135deg, ${alpha(ORTM_COLORS.error, 0.1)} 0%, ${alpha(ORTM_COLORS.error, 0.2)} 100%)`,
                                border: `1px solid ${alpha(ORTM_COLORS.error, 0.2)}`,
                                borderRadius: 2,
                                '&:hover': {
                                  background: `linear-gradient(135deg, ${alpha(ORTM_COLORS.error, 0.2)} 0%, ${alpha(ORTM_COLORS.error, 0.3)} 100%)`,
                                  transform: 'scale(1.1)',
                                  boxShadow: `0 6px 20px ${alpha(ORTM_COLORS.error, 0.3)}`,
                                },
                                transition: 'all 0.3s ease',
                              }}
                            >
                              {actionLoading && deletingId === pointage.id_pointage ? 
                                <CircularProgress size={20} /> : <DeleteIcon fontSize="small" />
                              }
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Détails du pointage" arrow>
                            <IconButton 
                              color="info" 
                              onClick={() => onViewDetails(pointage)} 
                              disabled={actionLoading}
                              size="medium"
                              sx={{
                                background: `linear-gradient(135deg, ${alpha(ORTM_COLORS.info, 0.1)} 0%, ${alpha(ORTM_COLORS.info, 0.2)} 100%)`,
                                border: `1px solid ${alpha(ORTM_COLORS.info, 0.2)}`,
                                borderRadius: 2,
                                '&:hover': {
                                  background: `linear-gradient(135deg, ${alpha(ORTM_COLORS.info, 0.2)} 0%, ${alpha(ORTM_COLORS.info, 0.3)} 100%)`,
                                  transform: 'scale(1.1)',
                                  boxShadow: `0 6px 20px ${alpha(ORTM_COLORS.info, 0.3)}`,
                                },
                                transition: 'all 0.3s ease',
                              }}
                            >
                              <ListAltIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          {working && (
                            <Tooltip title="Enregistrer la sortie" arrow>
                              <IconButton 
                                color="success" 
                                onClick={() => handleOpenExitDialog(pointage)}
                                disabled={actionLoading}
                                size="medium"
                                sx={{
                                  background: `linear-gradient(135deg, ${alpha(ORTM_COLORS.success, 0.1)} 0%, ${alpha(ORTM_COLORS.success, 0.2)} 100%)`,
                                  border: `1px solid ${alpha(ORTM_COLORS.success, 0.2)}`,
                                  borderRadius: 2,
                                  '&:hover': {
                                    background: `linear-gradient(135deg, ${alpha(ORTM_COLORS.success, 0.2)} 0%, ${alpha(ORTM_COLORS.success, 0.3)} 100%)`,
                                    transform: 'scale(1.1)',
                                    boxShadow: `0 6px 20px ${alpha(ORTM_COLORS.success, 0.3)}`,
                                  },
                                  transition: 'all 0.3s ease',
                                }}
                              >
                                <ExitToAppIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      ) : (
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                          <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                            <Tooltip title="Action non autorisée - Créateur uniquement" arrow>
                              <IconButton 
                                color="default" 
                                disabled 
                                size="medium"
                                sx={{
                                  background: `linear-gradient(135deg, ${alpha(ORTM_COLORS.text, 0.1)} 0%, ${alpha(ORTM_COLORS.text, 0.2)} 100%)`,
                                  border: `1px solid ${alpha(ORTM_COLORS.text, 0.2)}`,
                                  borderRadius: 2,
                                }}
                              >
                                <LockIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            
                            <Tooltip title="Voir les détails" arrow>
                              <IconButton 
                                color="info" 
                                onClick={() => onViewDetails(pointage)} 
                                disabled={actionLoading}
                                size="medium"
                                sx={{
                                  background: `linear-gradient(135deg, ${alpha(ORTM_COLORS.info, 0.1)} 0%, ${alpha(ORTM_COLORS.info, 0.2)} 100%)`,
                                  border: `1px solid ${alpha(ORTM_COLORS.info, 0.2)}`,
                                  borderRadius: 2,
                                  '&:hover': {
                                    background: `linear-gradient(135deg, ${alpha(ORTM_COLORS.info, 0.2)} 0%, ${alpha(ORTM_COLORS.info, 0.3)} 100%)`,
                                    transform: 'scale(1.1)',
                                    boxShadow: `0 6px 20px ${alpha(ORTM_COLORS.info, 0.3)}`,
                                  },
                                  transition: 'all 0.3s ease',
                                }}
                              >
                                <InfoIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                          
                          <Typography 
                            variant="caption" 
                            color="text.secondary" 
                            sx={{ 
                              fontWeight: '500',
                              background: alpha(ORTM_COLORS.text, 0.1),
                              px: 1,
                              py: 0.25,
                              borderRadius: 1,
                              textAlign: 'center',
                              maxWidth: 140,
                              lineHeight: 1.2
                            }}
                          >
                            Créé par {pointage.created_by_nom || pointage.created_by_username || "Utilisateur inconnu"}
                          </Typography>
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                );
              }).filter(row => row !== null)}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Dialog pour l'enregistrement de la sortie */}
      <Dialog
        open={exitDialogOpen}
        onClose={handleCloseExitDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{ 
          sx: { 
            borderRadius: 4,
            background: `linear-gradient(135deg, ${ORTM_COLORS.background} 0%, ${ORTM_COLORS.surface} 100%)`,
            boxShadow: `0 20px 60px ${alpha(ORTM_COLORS.primary, 0.2)}`,
          } 
        }}
      >
        <DialogTitle sx={{ 
          background: `linear-gradient(135deg, ${ORTM_COLORS.primary} 0%, ${ORTM_COLORS.primaryDark} 100%)`,
          color: ORTM_COLORS.surface,
          py: 3
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ExitToAppIcon />
            <Typography variant="h6" fontWeight="bold">
              Enregistrer la Sortie
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3 }}>
          {selectedPointage && (
            <Box>
              <Typography variant="body1" gutterBottom fontWeight="600">
                Vous êtes sur le point d'enregistrer la sortie de :
              </Typography>
              
              <Card sx={{ mb: 3, p: 2, borderRadius: 3, background: alpha(ORTM_COLORS.primary, 0.05) }}>
                <CardContent sx={{ p: '0 !important' }}>
                  <Typography variant="subtitle1" fontWeight="bold" color={ORTM_COLORS.primary}>
                    {selectedPointage.employe_nom || "Inconnu"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Matricule: {selectedPointage.employe_matricule || selectedPointage.employe}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Entrée: {selectedPointage.heure_entree} - {selectedPointage.date_pointage && isValid(parseISO(selectedPointage.date_pointage))
                      ? format(parseISO(selectedPointage.date_pointage), "dd MMMM yyyy", { locale: fr })
                      : "-"}
                  </Typography>
                </CardContent>
              </Card>
              
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Remarque (optionnelle)"
                placeholder="Ajoutez une remarque sur cette sortie..."
                value={exitRemarque}
                onChange={(e) => setExitRemarque(e.target.value)}
                variant="outlined"
                sx={{ mb: 2 }}
              />
              
              <Typography variant="body2" color="text.secondary" fontWeight="500">
                Heure de sortie actuelle: {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button 
            onClick={handleCloseExitDialog}
            variant="outlined"
            disabled={exitLoading}
            sx={{
              borderRadius: 3,
              px: 3,
              fontWeight: '600',
              border: `2px solid ${alpha(ORTM_COLORS.primary, 0.3)}`,
            }}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleExitSubmit}
            variant="contained"
            color="success"
            disabled={exitLoading}
            startIcon={exitLoading ? <CircularProgress size={16} /> : <ExitToAppIcon />}
            sx={{
              borderRadius: 3,
              px: 4,
              fontWeight: '600',
              background: `linear-gradient(135deg, ${ORTM_COLORS.success} 0%, ${ORTM_COLORS.primary} 100%)`,
              boxShadow: `0 4px 15px ${alpha(ORTM_COLORS.success, 0.3)}`,
              '&:hover': {
                boxShadow: `0 6px 20px ${alpha(ORTM_COLORS.success, 0.4)}`,
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.3s ease'
            }}
          >
            {exitLoading ? "Enregistrement..." : "Valider la Sortie"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PointageTable;