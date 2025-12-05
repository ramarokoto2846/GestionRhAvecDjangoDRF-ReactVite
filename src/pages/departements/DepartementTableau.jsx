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
  Avatar,
  Badge,
  alpha,
  useTheme,
  LinearProgress,
} from "@mui/material";
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Lock as LockIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Groups as GroupsIcon,
  CorporateFare as CorporateFareIcon
} from "@mui/icons-material";

// Palette de couleurs ORTM
const ORTM_COLORS = {
  primary: "#1B5E20",
  primaryLight: "#4CAF50",
  primaryDark: "#0D3D12",
  secondary: "#FFC107",
  secondaryLight: "#FFD54F",
  secondaryDark: "#FF8F00",
  background: "#F8FDF9",
  surface: "#FFFFFF",
  text: "#1A331C",
  error: "#D32F2F",
  success: "#2E7D32",
  warning: "#FF9800",
  info: "#1976D2"
};

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
  const theme = useTheme();
  const paginatedData = data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

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

  const getEmployeeCountColor = (count) => {
    if (count === 0) return "default";
    if (count <= 10) return "info";
    if (count <= 20) return "warning";
    return "success";
  };

  const getEmployeeCountVariant = (count) => {
    return count === 0 ? "outlined" : "filled";
  };

  const getProgressValue = (count) => {
    if (count === 0) return 0;
    if (count <= 10) return 30;
    if (count <= 20) return 60;
    return 100;
  };

  return (
    <Paper 
      sx={{ 
        width: "100%", 
        borderRadius: 4,
        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(ORTM_COLORS.primary, 0.02)} 100%)`,
        boxShadow: `0 12px 35px ${alpha(ORTM_COLORS.primary, 0.08)}`,
        border: `1px solid ${alpha(ORTM_COLORS.primary, 0.1)}`,
        overflow: 'hidden',
      }}
    >
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ 
              background: `linear-gradient(135deg, ${alpha(ORTM_COLORS.primary, 0.05)} 0%, ${alpha(ORTM_COLORS.primary, 0.1)} 100%)`,
            }}>
              <TableCell sx={{ 
                fontWeight: '800', 
                fontSize: '0.95rem',
                color: ORTM_COLORS.primary,
                borderBottom: `2px solid ${alpha(ORTM_COLORS.primary, 0.2)}`,
                py: 3,
                width: '120px'
              }}>
                ID Département
              </TableCell>
              <TableCell sx={{ 
                fontWeight: '800', 
                fontSize: '0.95rem',
                color: ORTM_COLORS.primary,
                borderBottom: `2px solid ${alpha(ORTM_COLORS.primary, 0.2)}`,
                py: 3
              }}>
                Informations
              </TableCell>
              <TableCell sx={{ 
                fontWeight: '800', 
                fontSize: '0.95rem',
                color: ORTM_COLORS.primary,
                borderBottom: `2px solid ${alpha(ORTM_COLORS.primary, 0.2)}`,
                py: 3
              }}>
                Responsable
              </TableCell>
              <TableCell sx={{ 
                fontWeight: '800', 
                fontSize: '0.95rem',
                color: ORTM_COLORS.primary,
                borderBottom: `2px solid ${alpha(ORTM_COLORS.primary, 0.2)}`,
                py: 3
              }}>
                Localisation
              </TableCell>
              <TableCell sx={{ 
                fontWeight: '800', 
                fontSize: '0.95rem',
                color: ORTM_COLORS.primary,
                borderBottom: `2px solid ${alpha(ORTM_COLORS.primary, 0.2)}`,
                py: 3,
                width: '200px'
              }}>
                Effectifs
              </TableCell>
              <TableCell sx={{ 
                fontWeight: '800', 
                fontSize: '0.95rem',
                color: ORTM_COLORS.primary,
                borderBottom: `2px solid ${alpha(ORTM_COLORS.primary, 0.2)}`,
                py: 3,
                width: '150px'
              }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((row, index) => {
              const canEditOrDelete = isSuperuser || (currentUser && row.created_by === currentUser.id);
              const employeeCount = row.nbr_employe || 0;

              return (
                <TableRow 
                  key={row.id_departement} 
                  hover
                  sx={{ 
                    transition: 'all 0.3s ease',
                    background: index % 2 === 0 
                      ? alpha(theme.palette.background.default, 0.5)
                      : 'transparent',
                    '&:hover': {
                      background: `linear-gradient(135deg, ${alpha(ORTM_COLORS.primary, 0.05)} 0%, ${alpha(ORTM_COLORS.primary, 0.02)} 100%)`,
                      transform: 'translateY(-2px)',
                      boxShadow: `0 4px 15px ${alpha(ORTM_COLORS.primary, 0.1)}`,
                    },
                    '&:last-child td': {
                      borderBottom: 'none',
                    }
                  }}
                >
                  {/* ID Département */}
                  <TableCell sx={{ py: 2.5 }}>
                    <Badge
                      color="primary"
                      variant="dot"
                      sx={{ 
                        '& .MuiBadge-dot': {
                          backgroundColor: ORTM_COLORS.primary,
                          boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
                        }
                      }}
                    >
                      <Chip
                        icon={<CorporateFareIcon />}
                        label={`DEPT-${row.id_departement}`}
                        color="primary"
                        variant="outlined"
                        sx={{
                          fontWeight: '700',
                          borderRadius: 2,
                          border: `2px solid ${alpha(ORTM_COLORS.primary, 0.2)}`,
                          background: `linear-gradient(135deg, ${alpha(ORTM_COLORS.primary, 0.1)} 0%, ${alpha(ORTM_COLORS.primary, 0.05)} 100%)`,
                          '&:hover': {
                            border: `2px solid ${alpha(ORTM_COLORS.primary, 0.4)}`,
                          }
                        }}
                      />
                    </Badge>
                  </TableCell>

                  {/* Informations du département */}
                  <TableCell sx={{ py: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: alpha(ORTM_COLORS.primary, 0.2),
                          color: ORTM_COLORS.primary,
                          width: 48,
                          height: 48,
                          border: `2px solid ${alpha(ORTM_COLORS.primary, 0.2)}`,
                          boxShadow: `0 4px 12px ${alpha(ORTM_COLORS.primary, 0.2)}`,
                        }}
                      >
                        <BusinessIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="700" sx={{ mb: 0.5 }}>
                          {row.nom || "N/A"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Département
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  {/* Responsable */}
                  <TableCell sx={{ py: 2.5 }}>
                    {row.responsable ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ 
                          p: 0.75, 
                          borderRadius: 2, 
                          background: `linear-gradient(135deg, ${alpha(ORTM_COLORS.secondary, 0.1)} 0%, ${alpha(ORTM_COLORS.secondary, 0.2)} 100%)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <PersonIcon fontSize="small" sx={{ color: ORTM_COLORS.secondary }} />
                        </Box>
                        <Box>
                          <Typography variant="body2" fontWeight="600">
                            {row.responsable}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Responsable
                          </Typography>
                        </Box>
                      </Box>
                    ) : (
                      <Chip
                        label="Non défini"
                        size="small"
                        variant="outlined"
                        color="default"
                        sx={{ borderRadius: 2 }}
                      />
                    )}
                  </TableCell>

                  {/* Localisation */}
                  <TableCell sx={{ py: 2.5 }}>
                    {row.localisation ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ 
                          p: 0.75, 
                          borderRadius: 2, 
                          background: `linear-gradient(135deg, ${alpha(ORTM_COLORS.info, 0.1)} 0%, ${alpha(ORTM_COLORS.info, 0.2)} 100%)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <LocationIcon fontSize="small" sx={{ color: ORTM_COLORS.info }} />
                        </Box>
                        <Box>
                          <Typography variant="body2" fontWeight="600">
                            {row.localisation}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Localisation
                          </Typography>
                        </Box>
                      </Box>
                    ) : (
                      <Chip
                        label="Non défini"
                        size="small"
                        variant="outlined"
                        color="default"
                        sx={{ borderRadius: 2 }}
                      />
                    )}
                  </TableCell>

                  {/* Effectifs */}
                  <TableCell sx={{ py: 2.5 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ 
                          p: 0.75, 
                          borderRadius: 2, 
                          background: `linear-gradient(135deg, ${alpha(ORTM_COLORS.success, 0.1)} 0%, ${alpha(ORTM_COLORS.success, 0.2)} 100%)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <GroupsIcon fontSize="small" sx={{ color: ORTM_COLORS.success }} />
                        </Box>
                        <Chip
                          label={`${employeeCount} employé${employeeCount !== 1 ? 's' : ''}`}
                          color={getEmployeeCountColor(employeeCount)}
                          variant={getEmployeeCountVariant(employeeCount)}
                          sx={{
                            fontWeight: '700',
                            borderRadius: 2,
                            minWidth: 100,
                          }}
                        />
                      </Box>
                    </Box>
                  </TableCell>

                  {/* Actions */}
                  <TableCell sx={{ py: 2.5 }}>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                      {canEditOrDelete ? (
                        <>
                          <Tooltip title="Modifier le département" arrow>
                            <IconButton
                              color="primary"
                              onClick={() => onEdit(row)}
                              size="medium"
                              sx={{
                                background: `linear-gradient(135deg, ${alpha(ORTM_COLORS.primary, 0.1)} 0%, ${alpha(ORTM_COLORS.primary, 0.2)} 100%)`,
                                border: `1px solid ${alpha(ORTM_COLORS.primary, 0.2)}`,
                                borderRadius: 2,
                                '&:hover': {
                                  background: `linear-gradient(135deg, ${alpha(ORTM_COLORS.primary, 0.2)} 0%, ${alpha(ORTM_COLORS.primary, 0.3)} 100%)`,
                                  transform: 'scale(1.1)',
                                  boxShadow: `0 6px 20px ${alpha(ORTM_COLORS.primary, 0.3)}`,
                                },
                                transition: 'all 0.3s ease',
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Supprimer le département" arrow>
                            <IconButton
                              color="error"
                              onClick={() => onDelete(row.id_departement)}
                              size="medium"
                              sx={{
                                background: `linear-gradient(135deg, ${alpha(ORTM_COLORS.error, 0.1)} 0%, ${alpha(ORTM_COLORS.error, 0.2)} 100%)`,
                                border: `1px solid ${alpha(ORTM_COLORS.error, 0.2)}`,
                                borderRadius: 2,
                                '&:hover': {
                                  background: `linear-gradient(135deg, ${alpha(ORTM_COLORS.error, 0.2)} 0%, ${alpha(ORTM_COLORS.error, 0.3)} 100%)`,
                                  transform: 'scale(1.1)',
                                  boxShadow: `0 6px 20px ${alpha(ORTM_COLORS.error, 0.3)}`,
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
                                background: `linear-gradient(135deg, ${alpha(ORTM_COLORS.text, 0.1)} 0%, ${alpha(ORTM_COLORS.text, 0.2)} 100%)`,
                                border: `1px solid ${alpha(ORTM_COLORS.text, 0.2)}`,
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
                              background: alpha(ORTM_COLORS.text, 0.1),
                              px: 1,
                              py: 0.25,
                              borderRadius: 1,
                              textAlign: 'center',
                              maxWidth: 120,
                              lineHeight: 1.2
                            }}
                          >
                            Créé par {getCreatorDisplayName(row)}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
            
            {/* État vide */}
            {paginatedData.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <BusinessIcon 
                      sx={{ 
                        fontSize: 64, 
                        color: alpha(ORTM_COLORS.text, 0.3),
                        mb: 2 
                      }} 
                    />
                    <Typography 
                      variant="h6" 
                      color="text.secondary"
                      sx={{ fontWeight: '600' }}
                    >
                      {data.length === 0
                        ? "Aucun département trouvé"
                        : "Aucun département ne correspond à votre recherche"}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ mt: 1, opacity: 0.7 }}
                    >
                      {data.length === 0
                        ? "Commencez par créer votre premier département"
                        : "Essayez de modifier vos critères de recherche"}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Pagination */}
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
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} sur ${count !== -1 ? count : `plus de ${to}`}`
          }
          sx={{
            borderTop: `1px solid ${alpha(ORTM_COLORS.primary, 0.1)}`,
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

export default DepartementTableau;