import React from "react";
import {
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Avatar,
  Tooltip,
  IconButton,
  CircularProgress,
  Box,
  Typography
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { format, parseISO, isValid } from "date-fns";
import { fr } from "date-fns/locale";

import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  Lock as LockIcon
} from "@mui/icons-material";

const CongeTable = ({
  conges,
  loading,
  actionLoading,
  deletingId,
  onEdit,
  onDelete,
  onValider,
  onRefuser,
  theme,
  user,
  isSuperuser
}) => {
  const getStatutColor = (statut) => {
    switch (statut) {
      case "valide": return "success";
      case "en_attente": return "warning";
      case "refuse": return "error";
      default: return "default";
    }
  };

  // Check if user can edit/delete (creator or superuser)
  const canEditOrDelete = (conge) => {
    return isSuperuser || (user && conge.created_by === user.id);
  };

  if (loading) {
    return (
      <TableRow>
        <TableCell colSpan={8} align="center">
          <CircularProgress />
        </TableCell>
      </TableRow>
    );
  }

  if (conges.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={8} align="center">
          <Typography>Aucun congé trouvé</Typography>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>UID Congé</TableCell>
            <TableCell>Employé</TableCell>
            <TableCell>Date Début</TableCell>
            <TableCell>Date Fin</TableCell>
            <TableCell>Motif</TableCell>
            <TableCell>Motif de Refus</TableCell>
            <TableCell>Statut</TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {conges.map((conge) => {
            const canEditDelete = canEditOrDelete(conge);
            
            return (
              <TableRow key={conge.id_conge} hover>
                <TableCell>
                  <Chip
                    label={conge.id_conge}
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
                        {conge.employe_nom || conge.employe || "Inconnu"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {conge.employe_matricule || conge.employe}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  {conge.date_debut && isValid(parseISO(conge.date_debut))
                    ? format(parseISO(conge.date_debut), "dd MMMM yyyy", { locale: fr })
                    : "-"}
                </TableCell>
                <TableCell>
                  {conge.date_fin && isValid(parseISO(conge.date_fin))
                    ? format(parseISO(conge.date_fin), "dd MMMM yyyy", { locale: fr })
                    : "-"}
                </TableCell>
                <TableCell>{conge.motif || "-"}</TableCell>
                <TableCell>
                  {conge.statut === "en_attente" ? "En attente d'approbation" : conge.motif_refus || "-"}
                </TableCell>
                <TableCell>
                  <Chip
                    label={conge.statut || "Inconnu"}
                    color={getStatutColor(conge.statut)}
                    variant="filled"
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  {canEditDelete ? (
                    <>
                    <Box sx={{ display: "flex", gap: 1, justifyContent: "center", alignItems: "center" }}>
                    {/* Actions de modification/suppression */}
                    
                      
                        <Tooltip title="Modifier">
                          <span>
                            <IconButton
                              color="primary"
                              onClick={() => onEdit(conge)}
                              disabled={actionLoading}
                              size="small"
                            >
                              <EditIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Supprimer">
                          <span>
                            <IconButton
                              color="error"
                              onClick={() => onDelete(conge.id_conge)}
                              disabled={actionLoading}
                              size="small"
                            >
                              {actionLoading && deletingId === conge.id_conge ? (
                                <CircularProgress size={24} />
                              ) : (
                                <DeleteIcon />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                      
                    
                      {/* Actions de validation/refus (toujours disponibles pour les superviseurs) */}
                      {conge.statut === "en_attente" && (
                        <>
                          <Tooltip title="Valider">
                            <IconButton
                              color="success"
                              onClick={() => onValider(conge.id_conge)}
                              disabled={actionLoading}
                              size="small"
                            >
                              <CheckIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Refuser">
                            <IconButton
                              color="error"
                              onClick={() => onRefuser(conge.id_conge)}
                              disabled={actionLoading}
                              size="small"
                            >
                              <CloseIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                    </>
                  ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <Tooltip title="Modifications non autorisées">
                        <span>
                          <IconButton disabled size="small">
                            <LockIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                      {/* Nom du créateur */}
                      <Typography variant="caption" color="text.secondary" sx={{ mt: -0.5 }}>
                        {conge.created_by_nom || conge.created_by_username || "Utilisateur inconnu"}
                      </Typography>
                    </Box>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default CongeTable;