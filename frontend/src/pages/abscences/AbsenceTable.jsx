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
  Person as PersonIcon
} from "@mui/icons-material";

const AbsenceTable = ({
  absences,
  loading,
  actionLoading,
  deletingId,
  onEdit,
  onDelete,
  theme
}) => {
  if (loading) {
    return (
      <TableRow>
        <TableCell colSpan={8} align="center">
          <CircularProgress />
        </TableCell>
      </TableRow>
    );
  }

  if (absences.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={8} align="center">
          <Typography>Aucune absence trouvée</Typography>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Absence UID</TableCell>
            <TableCell>Employé</TableCell>
            <TableCell>Date Début</TableCell>
            <TableCell>Date Fin</TableCell>
            <TableCell>Nombre de Jours</TableCell>
            <TableCell>Motif</TableCell>
            <TableCell>Justifiée</TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {absences.map((absence) => (
            <TableRow key={absence.id_absence} hover>
              <TableCell>
                <Chip
                  label={absence.id_absence}
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
                      {absence.employe_nom || absence.employe || "Inconnu"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {absence.employe_matricule || absence.employe || "Inconnu"}
                    </Typography>
                  </Box>
                </Box>
              </TableCell>
              <TableCell>
                {absence.date_debut_absence && isValid(parseISO(absence.date_debut_absence))
                  ? format(parseISO(absence.date_debut_absence), "dd MMMM yyyy", { locale: fr })
                  : "Date invalide"}
              </TableCell>
              <TableCell>
                {absence.date_fin_absence && isValid(parseISO(absence.date_fin_absence))
                  ? format(parseISO(absence.date_fin_absence), "dd MMMM yyyy", { locale: fr })
                  : "Date invalide"}
              </TableCell>
              <TableCell>{absence.nbr_jours || "-"}</TableCell>
              <TableCell>{absence.motif || "-"}</TableCell>
              <TableCell>{absence.justifiee ? "Oui" : "Non"}</TableCell>
              <TableCell align="center">
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Tooltip title="Modifier">
                    <IconButton color="primary" onClick={() => onEdit(absence)} disabled={actionLoading}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Supprimer">
                    <IconButton color="error" onClick={() => onDelete(absence.id_absence)} disabled={actionLoading}>
                      {actionLoading && deletingId === absence.id_absence ? <CircularProgress size={24} /> : <DeleteIcon />}
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default AbsenceTable;