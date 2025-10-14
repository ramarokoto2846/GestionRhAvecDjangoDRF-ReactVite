import React from 'react';
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
  Typography,
  Avatar,
  IconButton,
  Tooltip,
  alpha,
} from "@mui/material";
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  Work as WorkIcon,
  Business as BusinessIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Lock as LockIcon,
} from "@mui/icons-material";

const EmployeTableau = ({
  employes,
  filteredData,
  paginatedData,
  page,
  rowsPerPage,
  handleChangePage,
  handleChangeRowsPerPage,
  handleOpenDialog,
  handleDelete,
  getStatusColor,
  getTitreColor,
  theme,
  currentUser,
  isSuperuser,
}) => {
  return (
    <Paper sx={{ width: "100%", overflow: "hidden", borderRadius: 3 }}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Matricule</TableCell>
              <TableCell>Nom et Titre</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Poste</TableCell>
              <TableCell>Département</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((employe) => {
              // Vérifier si l'utilisateur peut modifier/supprimer (créateur ou superutilisateur)
              const canEditOrDelete = isSuperuser || (currentUser && employe.created_by === currentUser.id);
              console.log(`Employé ${employe.matricule}: created_by=${employe.created_by}, currentUser.id=${currentUser?.id}, isSuperuser=${isSuperuser}`); // Débogage

              return (
                <TableRow key={employe.matricule} hover>
                  <TableCell>
                    <Chip
                      label={employe.matricule}
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: alpha(theme.palette.primary.main, 0.2),
                          color: theme.palette.primary.main,
                        }}
                      >
                        <PersonIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {employe.prenom} {employe.nom}
                        </Typography>
                        <Chip
                          label={employe.titre}
                          size="small"
                          color={getTitreColor(employe.titre)}
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <EmailIcon fontSize="small" color="primary" />
                        <Typography variant="body2">{employe.email}</Typography>
                      </Box>
                      {employe.telephone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PhoneIcon fontSize="small" color="primary" />
                          <Typography variant="body2">{employe.telephone}</Typography>
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <WorkIcon fontSize="small" color="primary" />
                      <Typography variant="body2">{employe.poste}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {employe.departement && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BusinessIcon fontSize="small" color="primary" />
                        <Typography variant="body2">{employe.departement.nom}</Typography>
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={employe.statut}
                      color={getStatusColor(employe.statut)}
                      variant="filled"
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      {canEditOrDelete ? (
                        <>
                          <Tooltip title="Modifier">
                            <IconButton
                              color="primary"
                              onClick={() => handleOpenDialog(employe)}
                              size="small"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Supprimer">
                            <IconButton
                              color="error"
                              onClick={() => handleDelete(employe.matricule)}
                              size="small"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      ) : (
                        <Tooltip title="Non autorisé">
                          <IconButton color="default" disabled size="small">
                            <LockIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
            {paginatedData.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="text.secondary">
                    Aucun employé trouvé
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {filteredData.length > 0 && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Lignes par page"
        />
      )}
    </Paper>
  );
};

export default EmployeTableau;