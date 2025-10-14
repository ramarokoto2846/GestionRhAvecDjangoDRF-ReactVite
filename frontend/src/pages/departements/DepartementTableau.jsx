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
}) => {
  const paginatedData = data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

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
                    <Box sx={{ display: "flex", gap: 1 }}>
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
                        <IconButton color="default" disabled title="Non autorisé">
                          <LockIcon />
                        </IconButton>
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