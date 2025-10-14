import React, { useState } from "react";
import {
  TableContainer, Table, TableHead, TableRow, TableCell,
  TableBody, IconButton, Chip, Box, Avatar, Typography,
  Tooltip, CircularProgress, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { format, parseISO, isValid } from "date-fns";
import { fr } from "date-fns/locale";

import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import InfoIcon from '@mui/icons-material/Info';
import DescriptionIcon from '@mui/icons-material/Description';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import ListAltIcon from '@mui/icons-material/ListAlt';

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
    console.log(`Permissions pour pointage ${pointage.id_pointage}:`, {
      isSuperuser,
      isCreator,
      created_by: pointage.created_by,
      currentUserId: currentUser.id
    });
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
      
      // Préparer les données de mise à jour
      const updateData = {
        id_pointage: selectedPointage.id_pointage,
        employe: selectedPointage.employe,
        date_pointage: selectedPointage.date_pointage,
        heure_entree: selectedPointage.heure_entree,
        heure_sortie: `${heureSortie}:00`,
        remarque: exitRemarque || null
      };

      console.log("Mise à jour du pointage:", updateData);

      // Appeler la fonction de mise à jour
      if (onUpdatePointage) {
        await onUpdatePointage(selectedPointage.id_pointage, updateData);
      } else {
        console.error("onUpdatePointage n'est pas défini");
        // Fallback: utiliser onEdit
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

  return (
    <>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Pointage UID</TableCell>
              <TableCell>Employé</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Heure d'Entrée</TableCell>
              <TableCell>Heure de Sortie</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : !pointages || pointages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">Aucun pointage trouvé</TableCell>
              </TableRow>
            ) : (
              pointages.map((pointage, index) => {
                if (!pointage || !pointage.id_pointage || !pointage.employe) {
                  console.warn(`Pointage invalide à l'index ${index}:`, pointage);
                  return null;
                }
                const canEdit = hasPermission(pointage);
                const working = isWorking(pointage);
                
                return (
                  <TableRow key={pointage.id_pointage} hover>
                    <TableCell>
                      <Chip
                        label={pointage.id_pointage}
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.2), color: theme.palette.primary.main }}>
                          <PersonIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {String(pointage.employe_nom || "Inconnu")}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {String(pointage.employe_matricule || pointage.employe || "Inconnu")}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {pointage.date_pointage && isValid(parseISO(pointage.date_pointage))
                        ? format(parseISO(pointage.date_pointage), "dd MMMM yyyy", { locale: fr })
                        : "-"}
                    </TableCell>
                    <TableCell>{pointage.heure_entree || "-"}</TableCell>
                    <TableCell>
                      {pointage.heure_sortie ? (
                        pointage.heure_sortie
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
                      <Chip
                        label={pointage.heure_sortie ? "Complet" : "En cours"}
                        color={pointage.heure_sortie ? "success" : "warning"}
                        variant="filled"
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      {canEdit ? (
                        <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                          <Tooltip title="Modifier">
                            <IconButton 
                              color="primary" 
                              onClick={() => onEdit(pointage)} 
                              disabled={actionLoading}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Supprimer">
                            <IconButton 
                              color="error" 
                              onClick={() => onDelete(pointage.id_pointage)} 
                              disabled={actionLoading}
                            >
                              {actionLoading && deletingId === pointage.id_pointage ? <CircularProgress size={24} /> : <DeleteIcon />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Détails du pointage">
                            <IconButton 
                              color="info" 
                              onClick={() => onViewDetails(pointage)} 
                              disabled={actionLoading}
                              sx={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                '&:hover': {
                                  background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                                  transform: 'scale(1.1)',
                                },
                                transition: 'all 0.3s ease'
                              }}
                            >
                              <ListAltIcon />
                            </IconButton>
                          </Tooltip>
                          {working && (
                            <Tooltip title="Enregistrer la sortie">
                              <IconButton 
                                color="success" 
                                onClick={() => handleOpenExitDialog(pointage)}
                                disabled={actionLoading}
                              >
                                <ExitToAppIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      ) : (
                        <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                          <Tooltip title="Accès restreint : créé par un autre utilisateur">
                            <IconButton color="warning" disabled>
                              <LockIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Voir les détails">
                            <IconButton 
                              color="info" 
                              onClick={() => onViewDetails(pointage)} 
                              disabled={actionLoading}
                              sx={{
                                background: 'linear-gradient(135deg, #00b4db 0%, #0083b0 100%)',
                                color: 'white',
                                '&:hover': {
                                  background: 'linear-gradient(135deg, #0083b0 0%, #00b4db 100%)',
                                  transform: 'scale(1.1)',
                                },
                                transition: 'all 0.3s ease'
                              }}
                            >
                              <InfoIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                );
              }).filter(row => row !== null)
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog pour l'enregistrement de la sortie */}
      <Dialog
        open={exitDialogOpen}
        onClose={handleCloseExitDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
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
              <Typography variant="body1" gutterBottom>
                Vous êtes sur le point d'enregistrer la sortie de :
              </Typography>
              <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold">
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
              </Box>
              
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
              
              <Typography variant="body2" color="text.secondary">
                Heure de sortie actuelle: {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={handleCloseExitDialog}
            variant="outlined"
            disabled={exitLoading}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleExitSubmit}
            variant="contained"
            color="success"
            disabled={exitLoading}
            startIcon={exitLoading ? <CircularProgress size={16} /> : <ExitToAppIcon />}
          >
            {exitLoading ? "Enregistrement..." : "Valider la Sortie"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PointageTable;