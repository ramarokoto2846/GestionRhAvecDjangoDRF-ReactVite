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
  IconButton,
  Box,
  Typography,
  Avatar,
  Tooltip,
  alpha,
  useTheme
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon
} from "@mui/icons-material";
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  Work as WorkIcon,
  Business as BusinessIcon,
  Person as PersonIcon
} from "@mui/icons-material";
import Swal from "sweetalert2";
import { deleteEmploye } from "../../services/api";

const EmployeTable = ({
  employes,
  filteredData,
  page,
  rowsPerPage,
  handleChangePage,
  handleChangeRowsPerPage,
  handleOpenDialog,
  fetchData,
  showSnackbar,
  theme
}) => {

  const getStatusColor = (statut) => {
    return statut === 'actif' ? 'success' : 'error';
  };

  const getTitreColor = (titre) => {
    return titre === 'employe' ? 'primary' : 'secondary';
  };

  const handleDelete = async (matricule) => {
    const result = await Swal.fire({
      title: 'Êtes-vous sûr?',
      text: "Vous ne pourrez pas annuler cette action!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, supprimer!',
      cancelButtonText: 'Annuler',
      background: theme.palette.background.paper,
      color: theme.palette.text.primary
    });

    if (result.isConfirmed) {
      try {
        await deleteEmploye(matricule);
        showSnackbar("Employé supprimé avec succès");
        fetchData();
      } catch (err) {
        showSnackbar("Erreur lors de la suppression", "error");
      }
    }
  };

  return (
    <Paper sx={{ width:"100%", overflow:"hidden", borderRadius:3 }}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Employé</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Poste</TableCell>
              <TableCell>Département</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {employes.map(employe => (
              <TableRow key={employe.matricule} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: alpha(theme.palette.primary.main, 0.2),
                        color: theme.palette.primary.main
                      }}
                    >
                      <PersonIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {employe.prenom} {employe.nom}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        matricule: {employe.matricule}
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
                      <Typography variant="body2">
                        {employe.email}
                      </Typography>
                    </Box>
                    {employe.telephone && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneIcon fontSize="small" color="primary" />
                        <Typography variant="body2">
                          {employe.telephone}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WorkIcon fontSize="small" color="primary" />
                    <Typography variant="body2">
                      {employe.poste}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  {employe.departement && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BusinessIcon fontSize="small" color="primary" />
                      <Typography variant="body2">
                        {employe.departement.nom}
                      </Typography>
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
                  <Box sx={{ display:"flex", gap:1 }}>
                    <Tooltip title="Modifier">
                      <IconButton color="primary" onClick={()=>handleOpenDialog(employe)} size="small">
                        <EditIcon/>
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Supprimer">
                      <IconButton color="error" onClick={()=>handleDelete(employe.matricule)} size="small">
                        <DeleteIcon/>
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {employes.length===0 && <TableRow><TableCell colSpan={6} align="center">Aucun employé trouvé</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>
      {filteredData.length>0 && (
        <TablePagination 
          rowsPerPageOptions={[5,10,25]} 
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

export default EmployeTable;