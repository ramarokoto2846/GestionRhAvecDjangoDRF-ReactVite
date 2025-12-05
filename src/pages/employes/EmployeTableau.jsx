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
  useTheme,
  Stack,
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
  Star as StarIcon,
  Badge as BadgeIcon,
  CreditCard as CinIcon,
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
  const currentTheme = useTheme();

  const getTitreIcon = (titre) => {
    switch (titre) {
      case 'cadre':
        return <StarIcon sx={{ fontSize: 16 }} />;
      case 'employe':
        return <WorkIcon sx={{ fontSize: 16 }} />;
      case 'stagiaire':
        return <PersonIcon sx={{ fontSize: 16 }} />;
      default:
        return <PersonIcon sx={{ fontSize: 16 }} />;
    }
  };

  const getTitreBackground = (titre) => {
    switch (titre) {
      case 'cadre':
        return `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.15)} 0%, ${alpha(theme.palette.warning.main, 0.3)} 100%)`;
      case 'employe':
        return `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.primary.main, 0.3)} 100%)`;
      case 'stagiaire':
        return `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.15)} 0%, ${alpha(theme.palette.secondary.main, 0.3)} 100%)`;
      default:
        return `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.15)} 0%, ${alpha(theme.palette.info.main, 0.3)} 100%)`;
    }
  };

  const getTitreBorderColor = (titre) => {
    switch (titre) {
      case 'cadre':
        return alpha(theme.palette.warning.main, 0.3);
      case 'employe':
        return alpha(theme.palette.primary.main, 0.3);
      case 'stagiaire':
        return alpha(theme.palette.secondary.main, 0.3);
      default:
        return alpha(theme.palette.info.main, 0.3);
    }
  };

  return (
    <Paper 
      sx={{ 
        width: "100%", 
        overflow: "hidden", 
        borderRadius: 4,
        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
        boxShadow: `0 12px 35px ${alpha(theme.palette.primary.main, 0.08)}`,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        backdropFilter: 'blur(10px)',
      }}
    >
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ 
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`,
            }}>
              {/* Colonne CIN/MATRICULE */}
              <TableCell sx={{ 
                fontWeight: '800', 
                fontSize: '0.95rem',
                color: theme.palette.primary.main,
                borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                py: 3
              }}>
                Identifiant
              </TableCell>
              <TableCell sx={{ 
                fontWeight: '800', 
                fontSize: '0.95rem',
                color: theme.palette.primary.main,
                borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                py: 3
              }}>
                Employé
              </TableCell>
              <TableCell sx={{ 
                fontWeight: '800', 
                fontSize: '0.95rem',
                color: theme.palette.primary.main,
                borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                py: 3
              }}>
                Contact
              </TableCell>
              <TableCell sx={{ 
                fontWeight: '800', 
                fontSize: '0.95rem',
                color: theme.palette.primary.main,
                borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                py: 3
              }}>
                Poste
              </TableCell>
              <TableCell sx={{ 
                fontWeight: '800', 
                fontSize: '0.95rem',
                color: theme.palette.primary.main,
                borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                py: 3
              }}>
                Département
              </TableCell>
              <TableCell sx={{ 
                fontWeight: '800', 
                fontSize: '0.95rem',
                color: theme.palette.primary.main,
                borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                py: 3
              }}>
                Statut
              </TableCell>
              <TableCell sx={{ 
                fontWeight: '800', 
                fontSize: '0.95rem',
                color: theme.palette.primary.main,
                borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                py: 3
              }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((employe, index) => {
              const canEditOrDelete = isSuperuser || (currentUser && employe.created_by === currentUser.id);
              const isEmployeFixe = employe.titre === 'employe';
              
              return (
                <TableRow 
                  key={employe.cin}
                  hover
                  sx={{ 
                    transition: 'all 0.3s ease',
                    background: index % 2 === 0 
                      ? alpha(theme.palette.background.default, 0.5)
                      : 'transparent',
                    '&:hover': {
                      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
                      transform: 'translateY(-2px)',
                      boxShadow: `0 4px 15px ${alpha(theme.palette.primary.main, 0.1)}`,
                    },
                    '&:last-child td': {
                      borderBottom: 'none',
                    }
                  }}
                >
                  {/* Colonne CIN avec matricule en dessous */}
                  <TableCell sx={{ py: 2.5, width: '180px' }}>
                    <Stack spacing={1}>
                      {/* CIN */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ 
                          p: 0.75, 
                          borderRadius: 2, 
                          background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.info.main, 0.2)} 100%)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <CinIcon fontSize="small" color="info" />
                        </Box>
                        <Box>
                          <Typography variant="caption" fontWeight="600" color="text.secondary">
                            CIN
                          </Typography>
                          <Typography variant="body2" fontWeight="700">
                            {employe.cin}
                          </Typography>
                        </Box>
                      </Box>
                      
                      {/* Matricule (uniquement pour employés fixes) */}
                      {isEmployeFixe && employe.matricule && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                          <Box sx={{ 
                            p: 0.75, 
                            borderRadius: 2, 
                            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.2)} 100%)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <BadgeIcon fontSize="small" color="primary" />
                          </Box>
                          <Box>
                            <Typography variant="caption" fontWeight="600" color="text.secondary">
                              Matricule
                            </Typography>
                            <Typography variant="body2" fontWeight="700" color="primary.main">
                              {employe.matricule}
                            </Typography>
                          </Box>
                        </Box>
                      )}                      
                    </Stack>
                  </TableCell>

                  {/* Nom et Titre */}
                  <TableCell sx={{ py: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: alpha(theme.palette.primary.main, 0.2),
                          color: theme.palette.primary.main,
                          width: 48,
                          height: 48,
                          border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                          boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
                        }}
                      >
                        {employe.prenom?.[0]?.toUpperCase()}{employe.nom?.[0]?.toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="700" sx={{ mb: 0.5 }}>
                          {employe.prenom} {employe.nom}
                        </Typography>
                        <Chip
                          icon={getTitreIcon(employe.titre)}
                          label={employe.titre?.charAt(0).toUpperCase() + employe.titre?.slice(1)}
                          size="small"
                          sx={{
                            fontWeight: '600',
                            borderRadius: 2,
                            background: getTitreBackground(employe.titre),
                            border: `1px solid ${getTitreBorderColor(employe.titre)}`,
                            color: theme.palette.getContrastText(theme.palette.background.paper),
                            textTransform: 'capitalize',
                          }}
                        />
                      </Box>
                    </Box>
                  </TableCell>

                  {/* Contact */}
                  <TableCell sx={{ py: 2.5 }}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <Box sx={{ 
                          p: 0.5, 
                          borderRadius: 1, 
                          background: alpha(theme.palette.primary.main, 0.1),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <EmailIcon fontSize="small" color="primary" />
                        </Box>
                        <Typography variant="body2" fontWeight="500">
                          {employe.email}
                        </Typography>
                      </Box>
                      {employe.telephone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ 
                            p: 0.5, 
                            borderRadius: 1, 
                            background: alpha(theme.palette.success.main, 0.1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <PhoneIcon fontSize="small" color="success" />
                          </Box>
                          <Typography variant="body2" fontWeight="500">
                            {employe.telephone}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </TableCell>

                  {/* Poste */}
                  <TableCell sx={{ py: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ 
                        p: 0.75, 
                        borderRadius: 2, 
                        background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.info.main, 0.2)} 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <WorkIcon fontSize="small" color="info" />
                      </Box>
                      <Typography variant="body2" fontWeight="600" sx={{ textTransform: 'capitalize' }}>
                        {employe.poste}
                      </Typography>
                    </Box>
                  </TableCell>

                  {/* Département */}
                  <TableCell sx={{ py: 2.5 }}>
                    {employe.departement && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ 
                          p: 0.75, 
                          borderRadius: 2, 
                          background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.warning.main, 0.2)} 100%)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <BusinessIcon fontSize="small" color="warning" />
                        </Box>
                        <Typography variant="body2" fontWeight="600">
                          {employe.departement.nom}
                        </Typography>
                      </Box>
                    )}
                  </TableCell>

                  {/* Statut */}
                  <TableCell sx={{ py: 2.5 }}>
                    <Chip
                      label={employe.statut?.charAt(0).toUpperCase() + employe.statut?.slice(1)}
                      color={getStatusColor(employe.statut)}
                      variant="filled"
                      size="medium"
                      sx={{
                        fontWeight: '700',
                        borderRadius: 2,
                        minWidth: 90,
                        boxShadow: `0 4px 12px ${alpha(theme.palette[getStatusColor(employe.statut)]?.main || theme.palette.primary.main, 0.3)}`,
                        textTransform: 'capitalize',
                      }}
                    />
                  </TableCell>

                  {/* Actions */}
                  <TableCell sx={{ py: 2.5 }}>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                      {canEditOrDelete ? (
                        <>
                          <Tooltip title="Modifier l'employé" arrow>
                            <IconButton
                              color="primary"
                              onClick={() => handleOpenDialog(employe)}
                              size="medium"
                              sx={{
                                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.2)} 100%)`,
                                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                                borderRadius: 2,
                                '&:hover': {
                                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)} 0%, ${alpha(theme.palette.primary.main, 0.3)} 100%)`,
                                  transform: 'scale(1.1)',
                                  boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
                                },
                                transition: 'all 0.3s ease',
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Supprimer l'employé" arrow>
                            <IconButton
                              color="error"
                              onClick={() => handleDelete(employe.cin)}
                              size="medium"
                              sx={{
                                background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.1)} 0%, ${alpha(theme.palette.error.main, 0.2)} 100%)`,
                                border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                                borderRadius: 2,
                                '&:hover': {
                                  background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.2)} 0%, ${alpha(theme.palette.error.main, 0.3)} 100%)`,
                                  transform: 'scale(1.1)',
                                  boxShadow: `0 6px 20px ${alpha(theme.palette.error.main, 0.3)}`,
                                },
                                transition: 'all 0.3s ease',
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      ) : (
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                          <Tooltip title="Action non autorisée - Créateur uniquement" arrow>
                            <IconButton 
                              color="default" 
                              disabled 
                              size="medium"
                              sx={{
                                background: `linear-gradient(135deg, ${alpha(theme.palette.grey[400], 0.1)} 0%, ${alpha(theme.palette.grey[400], 0.2)} 100%)`,
                                border: `1px solid ${alpha(theme.palette.grey[400], 0.2)}`,
                                borderRadius: 2,
                              }}
                            >
                              <LockIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Typography 
                            variant="caption" 
                            color="text.secondary" 
                            sx={{ 
                              mt: 0.5,
                              fontWeight: '500',
                              background: alpha(theme.palette.grey[400], 0.1),
                              px: 1,
                              py: 0.25,
                              borderRadius: 1,
                            }}
                          >
                            {employe.created_by_nom || employe.created_by_username || "Créateur"}
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
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <PersonIcon 
                      sx={{ 
                        fontSize: 64, 
                        color: alpha(theme.palette.text.secondary, 0.3),
                        mb: 2 
                      }} 
                    />
                    <Typography 
                      variant="h6" 
                      color="text.secondary"
                      sx={{ fontWeight: '600' }}
                    >
                      Aucun employé trouvé
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ mt: 1, opacity: 0.7 }}
                    >
                      Essayez de modifier vos critères de recherche
                    </Typography>
                  </Box>
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
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} sur ${count !== -1 ? count : `plus de ${to}`}`
          }
          sx={{
            borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
              fontWeight: '600',
            },
            '& .MuiSelect-select': {
              borderRadius: 2,
            }
          }}
        />
      )}
    </Paper>
  );
};

export default EmployeTableau;