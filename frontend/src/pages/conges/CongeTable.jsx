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
  Person as PersonIcon
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
  theme
}) => {
  const getStatutColor = (statut) => {
    switch (statut) {
      case "valide": return "success";
      case "en_attente": return "warning";
      case "refuse": return "error";
      default: return "default";
    }
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
          {conges.map((conge) => (
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
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Tooltip title="Modifier">
                    <IconButton color="primary" onClick={() => onEdit(conge)} disabled={actionLoading}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Supprimer">
                    <IconButton color="error" onClick={() => onDelete(conge.id_conge)} disabled={actionLoading}>
                      {actionLoading && deletingId === conge.id_conge ? <CircularProgress size={24} /> : <DeleteIcon />}
                    </IconButton>
                  </Tooltip>
                  {conge.statut === "en_attente" && (
                    <>
                      <Tooltip title="Valider">
                        <IconButton color="success" onClick={() => onValider(conge.id_conge)} disabled={actionLoading}>
                          <CheckIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Refuser">
                        <IconButton color="error" onClick={() => onRefuer(conge.id_conge)} disabled={actionLoading}>
                          <CloseIcon />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default CongeTable;