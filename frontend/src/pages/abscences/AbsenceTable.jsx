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
  Person as PersonIcon,
  Lock as LockIcon
} from "@mui/icons-material";

const AbsenceTable = ({
  absences,
  loading,
  actionLoading,
  deletingId,
  onEdit,
  onDelete,
  theme,
  currentUser
}) => {
  const hasPermission = (absence) => {
    if (!currentUser || !absence || !absence.id_absence || !absence.employe) {
      console.warn("Permission refusée: utilisateur ou absence invalide", { currentUser, absence });
      return false;
    }
    const isSuperuser = currentUser.is_superuser;
    const isCreator = absence.created_by === currentUser.id;
    // Note: employe.departement n'est pas disponible car employe est une chaîne
    // Ajouter employe = EmployeSerializer dans serializers.py pour activer ceci
    // const isDepartementResponsable = absence.employe?.departement?.responsable === currentUser.email;
    console.log(`Permissions pour absence ${absence.id_absence}:`, {
      isSuperuser,
      isCreator,
      created_by: absence.created_by,
      currentUserId: currentUser.id
    });
    return isSuperuser || isCreator;
  };

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
          {loading ? (
            <TableRow>
              <TableCell colSpan={8} align="center">
                <CircularProgress />
              </TableCell>
            </TableRow>
          ) : !absences || absences.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} align="center">
                <Typography>Aucune absence trouvée</Typography>
              </TableCell>
            </TableRow>
          ) : (
            absences.map((absence, index) => {
              if (!absence || !absence.id_absence || !absence.employe) {
                console.warn(`Absence invalide à l'index ${index}:`, absence);
                return null;
              }
              return (
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
                          {String(absence.employe_nom || "Inconnu")}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {String(absence.employe_matricule || absence.employe || "Inconnu")}
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
                    {hasPermission(absence) ? (
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
                    ) : (
                      <Tooltip title="Accès restreint : créé par un autre utilisateur">
                        <IconButton color="warning" disabled>
                          <LockIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              );
            }).filter(row => row !== null)
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default AbsenceTable;