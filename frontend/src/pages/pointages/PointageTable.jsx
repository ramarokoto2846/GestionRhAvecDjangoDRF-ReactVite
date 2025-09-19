import React from "react";
import {
  TableContainer, Table, TableHead, TableRow, TableCell,
  TableBody, IconButton, Chip, Box, Avatar, Typography,
  Tooltip, CircularProgress
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { format, parseISO, isValid } from "date-fns";
import { fr } from "date-fns/locale";

import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';

const PointageTable = ({
  pointages,
  loading,
  actionLoading,
  deletingId,
  onEdit,
  onDelete,
  onViewDetails
}) => {
  const theme = useTheme();

  return (
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
          ) : pointages.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} align="center">Aucun pointage trouvé</TableCell>
            </TableRow>
          ) : (
            pointages.map((pointage) => (
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
                        {pointage.employe_nom || pointage.employe || "Inconnu"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {pointage.employe_matricule || pointage.employe || "Inconnu"}
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
                <TableCell>{pointage.heure_sortie || "-"}</TableCell>
                <TableCell>
                  <Chip
                    label={pointage.heure_sortie ? "Complet" : "En cours"}
                    color={pointage.heure_sortie ? "success" : "warning"}
                    variant="filled"
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Tooltip title="Modifier">
                      <IconButton color="primary" onClick={() => onEdit(pointage)} disabled={actionLoading}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Supprimer">
                      <IconButton color="error" onClick={() => onDelete(pointage.id_pointage)} disabled={actionLoading}>
                        {actionLoading && deletingId === pointage.id_pointage ? <CircularProgress size={24} /> : <DeleteIcon />}
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default PointageTable;