import React from "react";
import {
  Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, IconButton, Box, Typography, Avatar, Chip, Card, CardContent, Fab,
  Tooltip, Badge, alpha, useTheme, LinearProgress
} from "@mui/material";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AddIcon from '@mui/icons-material/Add';
import LockIcon from '@mui/icons-material/Lock';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import ScheduleIcon from '@mui/icons-material/Schedule';
import DescriptionIcon from '@mui/icons-material/Description';

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

const EvenementTable = ({
  evenements,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onEdit,
  onDelete,
  getEventStatus,
  getEventDuration,
  user,
  isSuperuser
}) => {
  const theme = useTheme();

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "";
    try {
      const date = parseISO(dateString);
      return format(date, "dd MMMM yyyy 'à' HH'h'mm", { locale: fr });
    } catch (error) {
      return "Date invalide";
    }
  };

  const formatTimeOnly = (dateString) => {
    if (!dateString) return "";
    try {
      const date = parseISO(dateString);
      return format(date, "HH'h'mm", { locale: fr });
    } catch (error) {
      return "";
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case "a-venir":
        return {
          color: ORTM_COLORS.info,
          bgColor: alpha(ORTM_COLORS.info, 0.1),
          icon: <EventAvailableIcon />,
          label: "À Venir"
        };
      case "en-cours":
        return {
          color: ORTM_COLORS.success,
          bgColor: alpha(ORTM_COLORS.success, 0.1),
          icon: <ScheduleIcon />,
          label: "En Cours"
        };
      case "passe":
        return {
          color: ORTM_COLORS.text,
          bgColor: alpha(ORTM_COLORS.text, 0.1),
          icon: <EventBusyIcon />,
          label: "Terminé"
        };
      default:
        return {
          color: ORTM_COLORS.warning,
          bgColor: alpha(ORTM_COLORS.warning, 0.1),
          icon: <CalendarTodayIcon />,
          label: "Inconnu"
        };
    }
  };

  const canEditOrDelete = (evenement) => {
    return isSuperuser || (user && evenement.created_by === user.id);
  };

  // Calcul du pourcentage de progression pour les événements en cours
  const getEventProgress = (evenement) => {
    const status = getEventStatus(evenement);
    if (status !== "en-cours") return 0;

    try {
      const start = parseISO(evenement.date_debut).getTime();
      const end = parseISO(evenement.date_fin).getTime();
      const now = new Date().getTime();
      
      if (now >= end) return 100;
      if (now <= start) return 0;
      
      const totalDuration = end - start;
      const elapsed = now - start;
      return Math.round((elapsed / totalDuration) * 100);
    } catch (error) {
      return 0;
    }
  };

  if (evenements.length === 0) {
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
            <CalendarTodayIcon sx={{ fontSize: 64 }} />
          </Box>
          <Typography variant="h5" fontWeight="700" color={ORTM_COLORS.text} sx={{ mb: 2 }}>
            Aucun événement planifié
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400, mx: 'auto' }}>
            Commencez par créer votre premier événement pour organiser vos activités et réunions
          </Typography>
          <Fab
            color="primary"
            onClick={() => onEdit()}
            variant="extended"
            sx={{
              borderRadius: 3,
              px: 4,
              py: 1.5,
              background: `linear-gradient(135deg, ${ORTM_COLORS.primary} 0%, ${ORTM_COLORS.primaryLight} 100%)`,
              boxShadow: `0 6px 20px ${alpha(ORTM_COLORS.primary, 0.3)}`,
              color: ORTM_COLORS.surface,
              fontWeight: '700',
              fontSize: '1rem',
              '&:hover': {
                boxShadow: `0 8px 25px ${alpha(ORTM_COLORS.primary, 0.4)}`,
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.3s ease'
            }}
          >
            <AddIcon sx={{ mr: 1, fontSize: '1.5rem' }} />
            Créer le premier événement
          </Fab>
        </CardContent>
      </Card>
    );
  }

  const paginatedData = evenements.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Paper sx={{ 
      width: "100%", 
      overflow: "hidden", 
      borderRadius: 4,
      background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(ORTM_COLORS.primary, 0.02)} 100%)`,
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
                Statut
              </TableCell>
              <TableCell sx={{ 
                fontWeight: '800', 
                fontSize: '0.95rem',
                color: ORTM_COLORS.primary,
                borderBottom: `2px solid ${alpha(ORTM_COLORS.primary, 0.2)}`,
                py: 3
              }}>
                Événement
              </TableCell>
              <TableCell sx={{ 
                fontWeight: '800', 
                fontSize: '0.95rem',
                color: ORTM_COLORS.primary,
                borderBottom: `2px solid ${alpha(ORTM_COLORS.primary, 0.2)}`,
                py: 3
              }}>
                Description
              </TableCell>
              <TableCell sx={{ 
                fontWeight: '800', 
                fontSize: '0.95rem',
                color: ORTM_COLORS.primary,
                borderBottom: `2px solid ${alpha(ORTM_COLORS.primary, 0.2)}`,
                py: 3,
                width: '200px'
              }}>
                Horaires
              </TableCell>
              <TableCell sx={{ 
                fontWeight: '800', 
                fontSize: '0.95rem',
                color: ORTM_COLORS.primary,
                borderBottom: `2px solid ${alpha(ORTM_COLORS.primary, 0.2)}`,
                py: 3,
                width: '120px'
              }}>
                Durée
              </TableCell>
              <TableCell sx={{ 
                fontWeight: '800', 
                fontSize: '0.95rem',
                color: ORTM_COLORS.primary,
                borderBottom: `2px solid ${alpha(ORTM_COLORS.primary, 0.2)}`,
                py: 3
              }}>
                Lieu
              </TableCell>
              <TableCell sx={{ 
                fontWeight: '800', 
                fontSize: '0.95rem',
                color: ORTM_COLORS.primary,
                borderBottom: `2px solid ${alpha(ORTM_COLORS.primary, 0.2)}`,
                py: 3,
                width: '150px'
              }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((evenement, index) => {
              const status = getEventStatus(evenement);
              const duration = getEventDuration(evenement);
              const canEditDelete = canEditOrDelete(evenement);
              const statusConfig = getStatusConfig(status);
              const progress = getEventProgress(evenement);
              
              return (
                <TableRow 
                  key={evenement.id_evenement} 
                  hover
                  sx={{ 
                    transition: 'all 0.3s ease',
                    background: index % 2 === 0 
                      ? alpha(theme.palette.background.default, 0.5)
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
                  {/* Statut */}
                  <TableCell sx={{ py: 2.5 }}>
                    <Badge
                      color="primary"
                      variant="dot"
                      invisible={status !== "en-cours"}
                      sx={{ 
                        '& .MuiBadge-dot': {
                          backgroundColor: ORTM_COLORS.success,
                          boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
                        }
                      }}
                    >
                      <Chip
                        icon={statusConfig.icon}
                        label={statusConfig.label}
                        sx={{
                          fontWeight: '700',
                          borderRadius: 3,
                          background: statusConfig.bgColor,
                          color: statusConfig.color,
                          border: `2px solid ${alpha(statusConfig.color, 0.3)}`,
                          '& .MuiChip-icon': {
                            color: statusConfig.color,
                          }
                        }}
                      />
                    </Badge>
                  </TableCell>

                  {/* Informations de l'événement */}
                  <TableCell sx={{ py: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: alpha(ORTM_COLORS.primary, 0.2),
                          color: ORTM_COLORS.primary,
                          width: 52,
                          height: 52,
                          border: `2px solid ${alpha(ORTM_COLORS.primary, 0.2)}`,
                          boxShadow: `0 4px 12px ${alpha(ORTM_COLORS.primary, 0.2)}`,
                        }}
                      >
                        <CalendarTodayIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="700" sx={{ mb: 0.5 }}>
                          {evenement.titre || "N/A"}
                        </Typography>
                        <Chip
                          label={`EVT-${evenement.id_evenement}`}
                          size="small"
                          variant="outlined"
                          sx={{
                            fontWeight: '600',
                            borderRadius: 2,
                            borderColor: alpha(ORTM_COLORS.primary, 0.3),
                            color: ORTM_COLORS.primary,
                            background: alpha(ORTM_COLORS.primary, 0.05),
                          }}
                        />
                      </Box>
                    </Box>
                  </TableCell>

                  {/* Description */}
                  <TableCell sx={{ py: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                      <Box sx={{ 
                        p: 0.75, 
                        borderRadius: 2, 
                        background: `linear-gradient(135deg, ${alpha(ORTM_COLORS.info, 0.1)} 0%, ${alpha(ORTM_COLORS.info, 0.2)} 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mt: 0.5
                      }}>
                        <DescriptionIcon fontSize="small" sx={{ color: ORTM_COLORS.info }} />
                      </Box>
                      <Box>
                        <Typography variant="body2" fontWeight="500" sx={{ lineHeight: 1.4 }}>
                          {evenement.description || "Aucune description"}
                        </Typography>
                        {!evenement.description && (
                          <Typography variant="caption" color="text.secondary">
                            Aucune description fournie
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>

                  {/* Horaires */}
                  <TableCell sx={{ py: 2.5 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <Box>
                        <Typography variant="caption" fontWeight="600" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                          Début
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <EventAvailableIcon fontSize="small" sx={{ color: ORTM_COLORS.success }} />
                          <Typography variant="body2" fontWeight="500">
                            {formatDateForDisplay(evenement.date_debut)}
                          </Typography>
                        </Box>
                      </Box>
                      <Box>
                        <Typography variant="caption" fontWeight="600" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                          Fin
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <EventBusyIcon fontSize="small" sx={{ color: ORTM_COLORS.error }} />
                          <Typography variant="body2" fontWeight="500">
                            {formatDateForDisplay(evenement.date_fin)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </TableCell>

                  {/* Durée */}
                  <TableCell sx={{ py: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ 
                        p: 0.75, 
                        borderRadius: 2, 
                        background: `linear-gradient(135deg, ${alpha(ORTM_COLORS.warning, 0.1)} 0%, ${alpha(ORTM_COLORS.warning, 0.2)} 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <AccessTimeIcon fontSize="small" sx={{ color: ORTM_COLORS.warning }} />
                      </Box>
                      <Typography variant="body2" fontWeight="600">
                        {duration}
                      </Typography>
                    </Box>
                  </TableCell>

                  {/* Lieu */}
                  <TableCell sx={{ py: 2.5 }}>
                    {evenement.lieu ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ 
                          p: 0.75, 
                          borderRadius: 2, 
                          background: `linear-gradient(135deg, ${alpha(ORTM_COLORS.secondary, 0.1)} 0%, ${alpha(ORTM_COLORS.secondary, 0.2)} 100%)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <LocationOnIcon fontSize="small" sx={{ color: ORTM_COLORS.secondary }} />
                        </Box>
                        <Typography variant="body2" fontWeight="500">
                          {evenement.lieu}
                        </Typography>
                      </Box>
                    ) : (
                      <Chip
                        label="Non spécifié"
                        size="small"
                        variant="outlined"
                        sx={{ borderRadius: 2 }}
                      />
                    )}
                  </TableCell>

                  {/* Actions */}
                  <TableCell sx={{ py: 2.5 }}>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center", justifyContent: "center" }}>
                      {canEditDelete ? (
                        <>
                          <Tooltip title="Modifier l'événement" arrow>
                            <IconButton
                              color="primary"
                              onClick={() => onEdit(evenement)}
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
                          <Tooltip title="Supprimer l'événement" arrow>
                            <IconButton
                              color="error"
                              onClick={() => onDelete(evenement.id_evenement)}
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
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      ) : (
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
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
                          <Typography 
                            variant="caption" 
                            color="text.secondary" 
                            sx={{ 
                              mt: 0.5,
                              fontWeight: '500',
                              background: alpha(ORTM_COLORS.text, 0.1),
                              px: 1,
                              py: 0.25,
                              borderRadius: 1,
                              textAlign: 'center',
                              maxWidth: 120,
                              lineHeight: 1.2
                            }}
                          >
                            Créé par {evenement.created_by_nom || evenement.created_by_username || "Utilisateur inconnu"}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Pagination */}
      {evenements.length > 0 && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={evenements.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={onPageChange}
          onRowsPerPageChange={onRowsPerPageChange}
          labelRowsPerPage="Événements par page :"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} sur ${count}`}
          sx={{
            borderTop: `1px solid ${alpha(ORTM_COLORS.primary, 0.1)}`,
            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
              fontWeight: '600',
            },
            '& .MuiSelect-select': {
              borderRadius: 2,
            }
          }}
        />
      )}
    </Paper>
  );
};

export default EvenementTable;