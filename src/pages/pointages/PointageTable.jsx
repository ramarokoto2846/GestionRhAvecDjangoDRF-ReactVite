import React, { useState } from "react";
import {
  TableContainer, Table, TableHead, TableRow, TableCell,
  TableBody, IconButton, Chip, Box, Avatar, Typography,
  Tooltip, CircularProgress, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Paper,
  Badge, alpha, useTheme, Card, CardContent,
  Collapse, TablePagination
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
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

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
  currentUser
}) => {
  const currentTheme = useTheme();
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const [selectedPointage, setSelectedPointage] = useState(null);
  const [exitRemarque, setExitRemarque] = useState("");
  const [exitLoading, setExitLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [expandedEmployees, setExpandedEmployees] = useState({});

  // Regrouper les pointages par employé
  const groupedPointages = pointages.reduce((acc, pointage) => {
    if (!pointage || !pointage.employe) return acc;
    
    const employeId = pointage.employe;
    if (!acc[employeId]) {
      acc[employeId] = {
        employe: pointage.employe,
        employe_nom: pointage.employe_nom,
        employe_matricule: pointage.employe_matricule,
        employe_details: pointage.employe_details,
        pointages: []
      };
    }
    acc[employeId].pointages.push(pointage);
    return acc;
  }, {});

  // Convertir en tableau pour l'affichage
  const employeeGroups = Object.values(groupedPointages);

  // Pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Toggle expand/collapse pour un employé
  const handleToggleExpand = (employeId) => {
    setExpandedEmployees(prev => ({
      ...prev,
      [employeId]: !prev[employeId]
    }));
  };

  // Paginer les groupes d'employés
  const paginatedEmployees = employeeGroups.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

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

  // Fonction corrigée : calcule la durée même si le pointage est terminé
  const calculateDuration = (pointage) => {
    if (!pointage.heure_entree) return "-";

    const [hIn, mIn] = pointage.heure_entree.split(':').map(Number);
    if (isNaN(hIn) || isNaN(mIn)) return "-";

    const baseDate = pointage.date_pointage && isValid(parseISO(pointage.date_pointage))
      ? parseISO(pointage.date_pointage)
      : new Date();

    const start = new Date(baseDate);
    start.setHours(hIn, mIn, 0, 0);

    let end = new Date();
    if (pointage.heure_sortie) {
      const [hOut, mOut] = pointage.heure_sortie.split(':').map(Number);
      if (!isNaN(hOut) && !isNaN(mOut)) {
        end = new Date(baseDate);
        end.setHours(hOut, mOut, 0, 0);
      }
    }

    const diffMs = end - start;
    if (diffMs < 0) return "-";

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes.toString().padStart(2, "0")}min`;
  };

  const isWorking = (pointage) => !pointage.heure_sortie;

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

  // Composant pour une ligne d'employé (groupe)
  const EmployeeRow = ({ employeeGroup }) => {
    const isExpanded = expandedEmployees[employeeGroup.employe];
    const totalPointages = employeeGroup.pointages.length;
    const pointagesEnCours = employeeGroup.pointages.filter(p => isWorking(p)).length;

    return (
      <>
        <TableRow
          hover
          sx={{
            transition: 'all 0.3s ease',
            background: `linear-gradient(135deg, ${alpha(ORTM_COLORS.primary, 0.05)} 0%, ${alpha(ORTM_COLORS.primary, 0.02)} 100%)`,
            '&:hover': {
              background: `linear-gradient(135deg, ${alpha(ORTM_COLORS.primary, 0.1)} 0%, ${alpha(ORTM_COLORS.primary, 0.05)} 100%)`,
            },
          }}
        >
          {/* Bouton expand/collapse */}
          <TableCell sx={{ py: 2.5, width: '60px' }}>
            <IconButton
              size="small"
              onClick={() => handleToggleExpand(employeeGroup.employe)}
              sx={{
                color: ORTM_COLORS.primary,
                background: alpha(ORTM_COLORS.primary, 0.1),
                '&:hover': {
                  background: alpha(ORTM_COLORS.primary, 0.2),
                }
              }}
            >
              {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
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
                }}
              >
                <PersonIcon />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight="700" sx={{ mb: 0.5 }}>
                  {String(employeeGroup.employe_nom || "Inconnu")}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {employeeGroup.employe_details?.titre === 'employe' 
                    ? `Matricule: ${employeeGroup.employe_details?.matricule || employeeGroup.employe}` 
                    : `Stagiaire (CIN: ${employeeGroup.employe})`}
                </Typography>
              </Box>
            </Box>
          </TableCell>

          {/* Résumé des pointages */}
          <TableCell sx={{ py: 2.5 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Chip
                label={`${totalPointages} pointage${totalPointages > 1 ? 's' : ''}`}
                color="primary"
                variant="outlined"
                size="small"
              />
              {pointagesEnCours > 0 && (
                <Chip
                  label={`${pointagesEnCours} en cours`}
                  color="warning"
                  variant="filled"
                  size="small"
                />
              )}
            </Box>
          </TableCell>

          {/* Dernier pointage */}
          <TableCell sx={{ py: 2.5 }}>
            {employeeGroup.pointages.length > 0 && (
              <Typography variant="body2" fontWeight="600">
                {employeeGroup.pointages[0].date_pointage && isValid(parseISO(employeeGroup.pointages[0].date_pointage))
                  ? format(parseISO(employeeGroup.pointages[0].date_pointage), "dd/MM/yyyy", { locale: fr })
                  : "-"}
              </Typography>
            )}
          </TableCell>

          {/* Statut global */}
          <TableCell sx={{ py: 2.5 }}>
            <Chip
              label={pointagesEnCours > 0 ? "En activité" : "Terminé"}
              color={pointagesEnCours > 0 ? "warning" : "success"}
              variant="filled"
              size="small"
            />
          </TableCell>

          {/* Actions */}
          <TableCell sx={{ py: 2.5 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => handleToggleExpand(employeeGroup.employe)}
              startIcon={isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
              sx={{
                borderRadius: 2,
                fontWeight: '600',
                border: `2px solid ${alpha(ORTM_COLORS.primary, 0.3)}`,
              }}
            >
              {isExpanded ? 'Réduire' : 'Détails'}
            </Button>
          </TableCell>
        </TableRow>

        {/* Ligne détaillée avec les pointages */}
        <TableRow>
          <TableCell colSpan={6} sx={{ py: 0, border: 'none' }}>
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <Box sx={{ margin: 1, py: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ color: ORTM_COLORS.primary, mb: 2 }}>
                  Pointages de {employeeGroup.employe_nom}
                </Typography>
                
                <Table size="small" sx={{ background: alpha(ORTM_COLORS.background, 0.5) }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: '700', color: ORTM_COLORS.primary }}>ID</TableCell>
                      <TableCell sx={{ fontWeight: '700', color: ORTM_COLORS.primary }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: '700', color: ORTM_COLORS.primary }}>Heure Entrée</TableCell>
                      <TableCell sx={{ fontWeight: '700', color: ORTM_COLORS.primary }}>Heure Sortie</TableCell>
                      <TableCell sx={{ fontWeight: '700', color: ORTM_COLORS.primary }}>Durée</TableCell>
                      <TableCell sx={{ fontWeight: '700', color: ORTM_COLORS.primary }}>Statut</TableCell>
                      <TableCell sx={{ fontWeight: '700', color: ORTM_COLORS.primary }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {employeeGroup.pointages.map((pointage) => {
                      const canEdit = hasPermission(pointage);
                      const working = isWorking(pointage);
                      const statusConfig = getStatusConfig(pointage);
                      const duration = calculateDuration(pointage);

                      return (
                        <TableRow key={pointage.id_pointage} hover>
                          <TableCell>
                            <Chip
                              label={pointage.id_pointage}
                              color="primary"
                              variant="outlined"
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="600">
                              {pointage.date_pointage && isValid(parseISO(pointage.date_pointage))
                                ? format(parseISO(pointage.date_pointage), "dd/MM/yyyy", { locale: fr })
                                : "-"}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="600">
                              {pointage.heure_entree || "-"}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {pointage.heure_sortie ? (
                              <Typography variant="body2" fontWeight="600">
                                {pointage.heure_sortie}
                              </Typography>
                            ) : (
                              <Button
                                variant="outlined"
                                color="warning"
                                size="small"
                                startIcon={<ExitToAppIcon />}
                                onClick={() => handleOpenExitDialog(pointage)}
                                disabled={!canEdit || actionLoading}
                              >
                                Sortie
                              </Button>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color={ORTM_COLORS.warning} fontWeight="600">
                              {duration}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={statusConfig.icon}
                              label={statusConfig.label}
                              size="small"
                              sx={{
                                background: statusConfig.bgColor,
                                color: statusConfig.color,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: "flex", gap: 0.5 }}>
                              <Tooltip title="Modifier">
                                <IconButton
                                  color="primary"
                                  size="small"
                                  onClick={() => onEdit(pointage)}
                                  disabled={!canEdit || actionLoading}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>

                              <Tooltip title="Supprimer">
                                <IconButton
                                  color="error"
                                  size="small"
                                  onClick={() => onDelete(pointage.id_pointage)}
                                  disabled={!canEdit || actionLoading}
                                >
                                  {actionLoading && deletingId === pointage.id_pointage ?
                                    <CircularProgress size={16} /> : <DeleteIcon fontSize="small" />
                                  }
                                </IconButton>
                              </Tooltip>

                              <Tooltip title="Détails">
                                <IconButton
                                  color="info"
                                  size="small"
                                  onClick={() => onViewDetails(pointage)}
                                >
                                  <InfoIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      </>
    );
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
                <TableCell sx={{ width: '60px' }}></TableCell>
                <TableCell sx={{ fontWeight: '800', fontSize: '0.95rem', color: ORTM_COLORS.primary, py: 3 }}>
                  Employé
                </TableCell>
                <TableCell sx={{ fontWeight: '800', fontSize: '0.95rem', color: ORTM_COLORS.primary, py: 3 }}>
                  Pointages
                </TableCell>
                <TableCell sx={{ fontWeight: '800', fontSize: '0.95rem', color: ORTM_COLORS.primary, py: 3 }}>
                  Dernier Pointage
                </TableCell>
                <TableCell sx={{ fontWeight: '800', fontSize: '0.95rem', color: ORTM_COLORS.primary, py: 3 }}>
                  Statut Global
                </TableCell>
                <TableCell sx={{ fontWeight: '800', fontSize: '0.95rem', color: ORTM_COLORS.primary, py: 3 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedEmployees.map((employeeGroup) => (
                <EmployeeRow key={employeeGroup.employe} employeeGroup={employeeGroup} />
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={employeeGroups.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Employés par page:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} sur ${count} employé${count > 1 ? 's' : ''}`
          }
          sx={{
            borderTop: `1px solid ${alpha(ORTM_COLORS.primary, 0.1)}`,
            background: alpha(ORTM_COLORS.background, 0.5),
          }}
        />
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
                    {selectedPointage.employe_details?.titre === 'employe'
                      ? `Matricule: ${selectedPointage.employe_details?.matricule}`
                      : `Stagiaire (CIN: ${selectedPointage.employe})`}
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