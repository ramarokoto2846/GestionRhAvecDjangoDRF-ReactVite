import React from "react";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Box,
  IconButton,
  Typography,
  Tooltip,
} from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon, Lock as LockIcon } from "@mui/icons-material";

const DepartementTableau = ({
  data,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onEdit,
  onDelete,
  currentUser,
  isSuperuser,
  getCreatorName,
}) => {
  const paginatedData = data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Fonction sécurisée pour obtenir le nom du créateur
  const getCreatorDisplayName = (row) => {
    try {
      if (getCreatorName && typeof getCreatorName === 'function') {
        return getCreatorName(row);
      }
      return row.created_by_name || row.created_by_username || "Utilisateur inconnu";
    } catch (error) {
      console.error("Erreur lors de la récupération du nom du créateur:", error);
      return "Utilisateur inconnu";
    }
  };

  return (
    <Paper sx={{ width: "100%", borderRadius: 3 }}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nom</TableCell>
              <TableCell>Responsable</TableCell>
              <TableCell>Localisation</TableCell>
              <TableCell>Employés</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((row) => {
              // Vérifier si l'utilisateur peut modifier/supprimer (créateur ou superutilisateur)
              const canEditOrDelete = isSuperuser || (currentUser && row.created_by === currentUser.id);

              return (
                <TableRow key={row.id_departement} hover>
                  <TableCell>
                    <Chip label={row.id_departement || "N/A"} color="primary" variant="outlined" />
                  </TableCell>
                  <TableCell>{row.nom || "N/A"}</TableCell>
                  <TableCell>{row.responsable || "Non défini"}</TableCell>
                  <TableCell>{row.localisation || "Non défini"}</TableCell>
                  <TableCell>
                    <Chip
                      label={row.nbr_employe || 0}
                      color={row.nbr_employe > 20 ? "success" : "default"}
                      variant="filled"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                      {canEditOrDelete ? (
                        <>
                          <IconButton color="primary" onClick={() => onEdit(row)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => onDelete(row.id_departement)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </>
                      ) : (
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                          <Tooltip title="Non autorisé">
                            <IconButton color="default" disabled>
                              <LockIcon />
                            </IconButton>
                          </Tooltip>
                          <Typography variant="caption" color="text.secondary" sx={{ mt: -0.5 }}>
                            Creé par : {row.created_by_nom || row.created_by_username || "Utilisateur inconnu"}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
            {paginatedData.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    {data.length === 0
                      ? "Aucun département trouvé"
                      : "Aucun département ne correspond à votre recherche"}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {data.length > 0 && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={data.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={onPageChange}
          onRowsPerPageChange={onRowsPerPageChange}
          labelRowsPerPage="Lignes par page"
        />
      )}
    </Paper>
  );
};

export default DepartementTableau;