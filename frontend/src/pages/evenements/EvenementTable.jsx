import React from "react";
import {
  Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, IconButton, Box, Typography, Avatar, Chip, Card, CardContent, Fab,
  Tooltip
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AddIcon from '@mui/icons-material/Add';
import LockIcon from '@mui/icons-material/Lock';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

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
    const date = parseISO(dateString);
    return format(date, "dd MMMM yyyy HH:mm", { locale: fr });
  };

  // Vérifier si l'utilisateur peut modifier/supprimer (créateur ou superutilisateur)
  const canEditOrDelete = (evenement) => {
    return isSuperuser || (user && evenement.created_by === user.id);
  };

  if (evenements.length === 0) {
    return (
      <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
        <CardContent sx={{ textAlign: "center", py: 4 }}>
          <CalendarTodayIcon sx={{ fontSize: 60, color: "text.secondary", mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Aucun événement trouvé
          </Typography>
          <Fab
            color="primary"
            onClick={() => onEdit()}
            sx={{
              mt: 2,
              borderRadius: 2,
              px: 3,
              textTransform: "none",
              fontWeight: "bold"
            }}
          >
            <AddIcon sx={{ mr: 1 }} />
            Créer le premier événement
          </Fab>
        </CardContent>
      </Card>
    );
  }

  return (
    <Paper sx={{ width: "100%", overflow: "hidden", borderRadius: 3 }}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Statut</TableCell>
              <TableCell>Titre</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Début</TableCell>
              <TableCell>Fin</TableCell>
              <TableCell>Durée</TableCell>
              <TableCell>Lieu</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {evenements.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((evenement) => {
              const status = getEventStatus(evenement);
              const duration = getEventDuration(evenement);
              const canEditDelete = canEditOrDelete(evenement);
              
              return (
                <TableRow key={evenement.id_evenement} hover>
                  <TableCell>
                    <Chip
                      label={
                        status === "a-venir" ? "À venir" : 
                        status === "en-cours" ? "En cours" : "Passé"
                      }
                      color={
                        status === "a-venir" ? "info" : 
                        status === "en-cours" ? "success" : "default"
                      }
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.2), color: theme.palette.primary.main }}>
                        <CalendarTodayIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {evenement.titre || "N/A"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {evenement.id_evenement || "N/A"}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{evenement.description || "Aucune description"}</TableCell>
                  <TableCell>{formatDateForDisplay(evenement.date_debut)}</TableCell>
                  <TableCell>{formatDateForDisplay(evenement.date_fin)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccessTimeIcon fontSize="small" color="primary" />
                      <Typography variant="body2">
                        {duration}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{evenement.lieu || "Non spécifié"}</TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center", justifyContent: "center" }}>
                      {canEditDelete ? (
                        <>
                          <Tooltip title="Modifier">
                            <span>
                              <IconButton
                                color="primary"
                                onClick={() => onEdit(evenement)}
                              >
                                <EditIcon />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Supprimer">
                            <span>
                              <IconButton
                                color="error"
                                onClick={() => onDelete(evenement.id_evenement)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </>
                      ) : (
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                          <Tooltip title="Non autorisé - Créé par un autre utilisateur">
                            <span>
                              <IconButton disabled>
                                <LockIcon />
                              </IconButton>
                            </span>
                          </Tooltip>
                          {/* Nom du créateur */}
                          <Typography variant="caption" color="text.secondary" sx={{ mt: -0.5 }}>
                            {evenement.created_by_nom || evenement.created_by_username || "Utilisateur inconnu"}
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
      />
    </Paper>
  );
};

export default EvenementTable;