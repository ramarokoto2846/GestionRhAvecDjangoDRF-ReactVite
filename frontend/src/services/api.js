// api.js
import axios from "axios";

const BASE_URL = "http://localhost:8000/api";

// ========================
// UTILITAIRES
// ========================

// Obtenir l'en-tête d'authentification
const getAuthHeader = () => {
  const token = localStorage.getItem("access_token");
  if (!token) {
    throw new Error("Aucun token d'authentification trouvé. Veuillez vous connecter.");
  }
  return { Authorization: `Bearer ${token}` };
};

// Gestion générique des erreurs
const handleError = (error, defaultMessage) => {
  let errorMessage = defaultMessage;
  if (error.response) {
    const { status, data } = error.response;
    if (status === 403) {
      errorMessage = "Vous n'êtes pas autorisé à effectuer cette action.";
    } else if (typeof data === "string") {
      errorMessage = data;
    } else if (data.detail) {
      errorMessage = data.detail;
    } else if (data.non_field_errors) {
      errorMessage = data.non_field_errors[0];
    } else {
      const fieldErrors = Object.values(data).flat().join(", ");
      if (fieldErrors) errorMessage = fieldErrors;
    }
  } else if (error.message) {
    errorMessage = error.message;
  }
  console.error("Erreur API:", error.response?.data || error.message);
  throw new Error(errorMessage);
};

// Extraction des données (compatibilité DRF pagination)
const extractData = (responseData) => {
  if (Array.isArray(responseData)) {
    return responseData;
  } else if (responseData.results && Array.isArray(responseData.results)) {
    return responseData.results;
  } else if (typeof responseData === "object" && responseData !== null) {
    return [responseData]; // Retourner un tableau avec un seul objet si non paginé
  } else {
    console.warn("Structure de données inattendue, retourne array vide");
    return [];
  }
};

// Vérifier si l'utilisateur est superutilisateur
export const isSuperuser = async () => {
  try {
    const user = await getCurrentUser();
    return user.is_superuser;
  } catch (error) {
    console.error("Erreur lors de la vérification du statut superutilisateur:", error.message);
    return false;
  }
};

// ========================
// AUTHENTIFICATION
// ========================

// Connexion
export const login = async (email, password) => {
  try {
    const response = await axios.post(`${BASE_URL}/token/`, { email, password });
    return response.data;
  } catch (error) {
    handleError(error, "Erreur lors de la connexion.");
  }
};

// Rafraîchir le token
export const refreshToken = async (refreshToken) => {
  try {
    const response = await axios.post(`${BASE_URL}/token/refresh/`, { refresh: refreshToken });
    return response.data;
  } catch (error) {
    handleError(error, "Erreur lors du rafraîchissement du token.");
  }
};

// Récupérer l'utilisateur courant
export const getCurrentUser = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/users/me/`, { headers: getAuthHeader() });
    return response.data;
  } catch (error) {
    handleError(error, "Erreur lors de la récupération de l'utilisateur.");
  }
};

// Inscription
export const register = async (userData) => {
  try {
    const response = await axios.post(`${BASE_URL}/register/`, userData);
    return response.data;
  } catch (error) {
    handleError(error, "Erreur lors de l'inscription.");
  }
};

// ========================
// CRUD GÉNÉRIQUE
// ========================

const createCrudFunctions = (endpoint, idField) => {
  return {
    getAll: async (params = {}) => {
      try {
        const response = await axios.get(`${BASE_URL}/${endpoint}/`, {
          headers: getAuthHeader(),
          params,
        });
        return extractData(response.data);
      } catch (error) {
        handleError(error, `Erreur lors de la récupération des ${endpoint}.`);
      }
    },
    getOne: async (id) => {
      try {
        const response = await axios.get(`${BASE_URL}/${endpoint}/${id}/`, {
          headers: getAuthHeader(),
        });
        return response.data;
      } catch (error) {
        handleError(error, `Erreur lors de la récupération de ${endpoint.slice(0, -1)} avec ID ${id}.`);
      }
    },
    create: async (data) => {
      try {
        const response = await axios.post(`${BASE_URL}/${endpoint}/`, data, {
          headers: getAuthHeader(),
        });
        return response.data;
      } catch (error) {
        handleError(error, `Erreur lors de la création de ${endpoint.slice(0, -1)}.`);
      }
    },
    update: async (id, data) => {
      try {
        const response = await axios.put(`${BASE_URL}/${endpoint}/${id}/`, data, {
          headers: getAuthHeader(),
        });
        return response.data;
      } catch (error) {
        handleError(error, `Erreur lors de la mise à jour de ${endpoint.slice(0, -1)} avec ID ${id}.`);
      }
    },
    deleteOne: async (id) => {
      try {
        const response = await axios.delete(`${BASE_URL}/${endpoint}/${id}/`, {
          headers: getAuthHeader(),
        });
        return response.data || { success: true }; // Retourner un objet par défaut si pas de données
      } catch (error) {
        handleError(error, `Erreur lors de la suppression de ${endpoint.slice(0, -1)} avec ID ${id}.`);
      }
    },
  };
};

// ========================
// DÉPARTEMENTS
// ========================
const departementsCrud = createCrudFunctions("departements", "id_departement");
export const getDepartements = departementsCrud.getAll;
export const getDepartement = departementsCrud.getOne;
export const createDepartement = departementsCrud.create;
export const updateDepartement = departementsCrud.update;
export const deleteDepartement = departementsCrud.deleteOne;

// ========================
// EMPLOYÉS
// ========================
const employesCrud = createCrudFunctions("employes", "matricule");
export const getEmployes = employesCrud.getAll;
export const getEmploye = employesCrud.getOne;
export const createEmploye = employesCrud.create;
export const updateEmploye = employesCrud.update;
export const deleteEmploye = employesCrud.deleteOne;

// Statistiques des employés
export const getEmployesStats = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/employes/stats/`, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    handleError(error, "Erreur lors de la récupération des statistiques des employés.");
  }
};

// ========================
// POINTAGES
// ========================
const pointagesCrud = createCrudFunctions("pointages", "id_pointage");
export const getPointages = pointagesCrud.getAll;
export const getPointage = pointagesCrud.getOne;
export const createPointage = pointagesCrud.create;
export const updatePointage = pointagesCrud.update;
export const deletePointage = pointagesCrud.deleteOne;

// Statistiques mensuelles des pointages
export const getPointagesStatsMensuelles = async (mois, annee) => {
  try {
    const response = await axios.get(`${BASE_URL}/pointages/stats_mensuelles/`, {
      headers: getAuthHeader(),
      params: { mois, annee },
    });
    return response.data;
  } catch (error) {
    handleError(error, "Erreur lors de la récupération des statistiques mensuelles des pointages.");
  }
};

// ========================
// ABSENCES
// ========================
const absencesCrud = createCrudFunctions("absences", "id_absence");
export const getAbsences = absencesCrud.getAll;
export const getAbsence = absencesCrud.getOne;
export const createAbsence = absencesCrud.create;
export const updateAbsence = absencesCrud.update;
export const deleteAbsence = absencesCrud.deleteOne;

// ========================
// CONGÉS
// ========================
const congesCrud = createCrudFunctions("conges", "id_conge");
export const getConges = congesCrud.getAll;
export const getConge = congesCrud.getOne;
export const createConge = congesCrud.create;
export const updateConge = congesCrud.update;
export const deleteConge = congesCrud.deleteOne;

// Valider un congé
export const validerConge = async (id) => {
  try {
    const response = await axios.post(`${BASE_URL}/conges/${id}/valider/`, {}, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    handleError(error, "Erreur lors de la validation du congé.");
  }
};

// Refuser un congé
export const refuserConge = async (id, motifRefus) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/conges/${id}/refuser/`,
      { motif_refus: motifRefus },
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    handleError(error, "Erreur lors du refus du congé.");
  }
};

// ========================
// ÉVÉNEMENTS
// ========================
const evenementsCrud = createCrudFunctions("evenements", "id_evenement");
export const getEvenements = evenementsCrud.getAll;
export const getEvenement = evenementsCrud.getOne;
export const createEvenement = evenementsCrud.create;
export const updateEvenement = evenementsCrud.update;
export const deleteEvenement = evenementsCrud.deleteOne;

// Événements à venir
export const getEvenementsAVenir = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/evenements/a_venir/`, {
      headers: getAuthHeader(),
    });
    return extractData(response.data);
  } catch (error) {
    handleError(error, "Erreur lors de la récupération des événements à venir.");
  }
};

// ========================
// SUPPRIMER : FONCTIONS D'ENVOI D'EMAIL MANUEL
// ========================

// ❌ SUPPRIMER CES FONCTIONS - Les emails sont maintenant envoyés automatiquement
// export const sendEventEmail = async (eventId) => { ... }
// export const sendAllEventsEmail = async () => { ... }

// ========================
// EXPORT PDF POUR TOUTES LES TABLES
// ========================

// Fonction générique pour exporter une table en PDF
const exportTablePDF = async (tableName, params = {}) => {
  try {
    const response = await axios.get(`${BASE_URL}/export/pdf/`, {
      headers: getAuthHeader(),
      params: {
        table: tableName,
        ...params
      },
      responseType: 'blob'
    });

    // Télécharger le PDF
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Générer un nom de fichier personnalisé
    const date = new Date().toISOString().split('T')[0];
    const filename = `liste_${tableName}_${date}.pdf`;
    
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    console.log(`✅ PDF exporté: ${filename}`);
    return { success: true, message: `PDF ${tableName} exporté avec succès`, filename };
    
  } catch (error) {
    handleError(error, `Erreur lors de l'export PDF des ${tableName}.`);
  }
};

// Export PDF pour chaque table
export const exportDepartementsPDF = async (params = {}) => {
  return exportTablePDF('departements', params);
};

export const exportEmployesPDF = async (params = {}) => {
  return exportTablePDF('employes', params);
};

export const exportPointagesPDF = async (params = {}) => {
  return exportTablePDF('pointages', params);
};

export const exportAbsencesPDF = async (params = {}) => {
  return exportTablePDF('absences', params);
};

export const exportCongesPDF = async (params = {}) => {
  return exportTablePDF('conges', params);
};

export const exportEvenementsPDF = async (params = {}) => {
  return exportTablePDF('evenements', params);
};

// Export PDF via endpoints spécifiques
export const exportDepartementsPDFSpecific = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/departements/export-pdf/`, {
      headers: getAuthHeader(),
      responseType: 'blob'
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `liste_departements_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return { success: true, message: "PDF départements exporté avec succès" };
  } catch (error) {
    handleError(error, "Erreur lors de l'export PDF des départements.");
  }
};

export const exportEmployesPDFSpecific = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/employes/export-pdf/`, {
      headers: getAuthHeader(),
      responseType: 'blob'
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `liste_employes_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return { success: true, message: "PDF employés exporté avec succès" };
  } catch (error) {
    handleError(error, "Erreur lors de l'export PDF des employés.");
  }
};

export const exportPointagesPDFSpecific = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/pointages/export-pdf/`, {
      headers: getAuthHeader(),
      responseType: 'blob'
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `liste_pointages_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return { success: true, message: "PDF pointages exporté avec succès" };
  } catch (error) {
    handleError(error, "Erreur lors de l'export PDF des pointages.");
  }
};

export const exportAbsencesPDFSpecific = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/absences/export-pdf/`, {
      headers: getAuthHeader(),
      responseType: 'blob'
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `liste_absences_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return { success: true, message: "PDF absences exporté avec succès" };
  } catch (error) {
    handleError(error, "Erreur lors de l'export PDF des absences.");
  }
};

export const exportCongesPDFSpecific = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/conges/export-pdf/`, {
      headers: getAuthHeader(),
      responseType: 'blob'
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `liste_conges_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return { success: true, message: "PDF congés exporté avec succès" };
  } catch (error) {
    handleError(error, "Erreur lors de l'export PDF des congés.");
  }
};

export const exportEvenementsPDFSpecific = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/evenements/export-pdf/`, {
      headers: getAuthHeader(),
      responseType: 'blob'
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `liste_evenements_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return { success: true, message: "PDF événements exporté avec succès" };
  } catch (error) {
    handleError(error, "Erreur lors de l'export PDF des événements.");
  }
};

// ========================
// STATISTIQUES
// ========================

// Statistiques employé
export const getEmployeeStatistics = async (matricule = null, params = {}) => {
  try {
    let url = `${BASE_URL}/statistiques/employe/`;
    if (matricule) {
      url = `${BASE_URL}/statistiques/employe/${matricule}/`;
    }
    const response = await axios.get(url, {
      headers: getAuthHeader(),
      params,
    });
    return response.data;
  } catch (error) {
    handleError(error, "Erreur lors de la récupération des statistiques employé.");
  }
};

// Statistiques département
export const getDepartmentStatistics = async (departementId = null, params = {}) => {
  try {
    let url = `${BASE_URL}/statistiques/departement/`;
    if (departementId) {
      url = `${BASE_URL}/statistiques/departement/${departementId}/`;
    }
    const response = await axios.get(url, {
      headers: getAuthHeader(),
      params,
    });
    return response.data;
  } catch (error) {
    handleError(error, "Erreur lors de la récupération des statistiques département.");
  }
};

// Statistiques globales
export const getGlobalStatistics = async (params = {}) => {
  try {
    const response = await axios.get(`${BASE_URL}/statistiques/global/`, {
      headers: getAuthHeader(),
      params,
    });
    return response.data;
  } catch (error) {
    handleError(error, "Erreur lors de la récupération des statistiques globales.");
  }
};

// Statistiques détaillées par type
export const getDetailedStatistics = async (params = {}) => {
  try {
    const response = await axios.get(`${BASE_URL}/statistiques/detaillees/`, {
      headers: getAuthHeader(),
      params,
    });
    return response.data;
  } catch (error) {
    handleError(error, "Erreur lors de la récupération des statistiques détaillées.");
  }
};

// Statistiques sauvegardées
export const getSavedStatistics = async (params = {}) => {
  try {
    const response = await axios.get(`${BASE_URL}/statistiques/sauvegardees/`, {
      headers: getAuthHeader(),
      params,
    });
    return extractData(response.data);
  } catch (error) {
    handleError(error, "Erreur lors de la récupération des statistiques sauvegardées.");
  }
};

// Supprimer une statistique sauvegardée
export const deleteSavedStatistics = async (id) => {
  try {
    const response = await axios.delete(`${BASE_URL}/statistiques/sauvegardees/${id}/`, {
      headers: getAuthHeader(),
    });
    return response.data || { success: true };
  } catch (error) {
    handleError(error, "Erreur lors de la suppression de la statistique sauvegardée.");
  }
};

// Export PDF des statistiques avec nom de fichier personnalisé
export const exportStatisticsPDF = async (exportType, params = {}) => {
  try {
    const response = await axios.get(`${BASE_URL}/statistiques/export-pdf/`, {
      headers: getAuthHeader(),
      params: {
        type: exportType,
        ...params
      },
      responseType: 'blob' // Important pour les fichiers binaires
    });
    
    // Créer un blob URL pour télécharger le PDF
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Générer un nom de fichier personnalisé basé sur le type et les paramètres
    let filename = '';
    
    // Fonction pour normaliser les noms de fichiers
    const normalizeFileName = (name) => {
      if (!name) return '';
      return name
        .normalize('NFD') // Normaliser les caractères accentués
        .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
        .replace(/[^a-zA-Z0-9_]/g, '_') // Remplacer les caractères spéciaux par _
        .replace(/_+/g, '_') // Éviter les underscores multiples
        .toLowerCase();
    };
    
    // Générer le nom de fichier selon le type
    switch (exportType) {
      case 'employe':
        // Utiliser le nom de l'employé si fourni dans les paramètres
        if (params.nom_employe) {
          const nomNormalise = normalizeFileName(params.nom_employe);
          filename = `statistiques_${nomNormalise}_${params.matricule || 'employe'}.pdf`;
        } else if (params.matricule) {
          // Sinon utiliser seulement le matricule
          filename = `statistiques_employe_${params.matricule}.pdf`;
        } else {
          // Fallback avec date
          const date = new Date().toISOString().split('T')[0];
          filename = `statistiques_employe_${date}.pdf`;
        }
        break;
        
      case 'departement':
        // Utiliser le nom du département si fourni
        if (params.nom_departement) {
          const nomNormalise = normalizeFileName(params.nom_departement);
          filename = `statistiques_departement_${nomNormalise}.pdf`;
        } else if (params.departement) {
          // Sinon utiliser l'ID du département
          filename = `statistiques_departement_${params.departement}.pdf`;
        } else {
          // Fallback avec date
          const date = new Date().toISOString().split('T')[0];
          filename = `statistiques_departement_${date}.pdf`;
        }
        break;
        
      case 'global':
        // Pour les statistiques globales, utiliser la date
        const date = new Date().toISOString().split('T')[0];
        filename = `statistiques_globales_${date}.pdf`;
        break;
        
      default:
        // Fallback générique
        filename = `statistiques_${exportType}_${new Date().toISOString().split('T')[0]}.pdf`;
    }
    
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    console.log(`✅ PDF exporté: ${filename}`);
    return { success: true, message: "PDF exporté avec succès", filename };
    
  } catch (error) {
    handleError(error, "Erreur lors de l'export PDF des statistiques.");
  }
};

// ========================
// RAPPORTS ET ANALYSES
// ========================

// Historique des rapports PDF générés
export const getReportHistory = async (params = {}) => {
  try {
    const response = await axios.get(`${BASE_URL}/rapports/historique/`, {
      headers: getAuthHeader(),
      params,
    });
    return extractData(response.data);
  } catch (error) {
    handleError(error, "Erreur lors de la récupération de l'historique des rapports.");
  }
};

// Générer un nouveau rapport
export const generateReport = async (params = {}) => {
  try {
    const response = await axios.post(`${BASE_URL}/rapports/generer/`, params, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    handleError(error, "Erreur lors de la génération du rapport.");
  }
};

// Télécharger un rapport existant
export const downloadReport = async (reportId) => {
  try {
    const response = await axios.get(`${BASE_URL}/rapports/${reportId}/telecharger/`, {
      headers: getAuthHeader(),
      responseType: 'blob'
    });
    
    // Créer un blob URL pour télécharger le PDF
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Utiliser le nom de fichier de la réponse ou générer un nom par défaut
    const filename = response.headers['content-disposition'] 
      ? response.headers['content-disposition'].split('filename=')[1]?.replace(/"/g, '')
      : `rapport_${reportId}.pdf`;
    
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return { success: true, message: "Rapport téléchargé avec succès" };
  } catch (error) {
    handleError(error, "Erreur lors du téléchargement du rapport.");
  }
};

// Analyses comparatives
export const getComparativeAnalysis = async (params = {}) => {
  try {
    const response = await axios.get(`${BASE_URL}/analyses/comparatives/`, {
      headers: getAuthHeader(),
      params,
    });
    return response.data;
  } catch (error) {
    handleError(error, "Erreur lors de la récupération de l'analyse comparative.");
  }
};

// Tendances et évolutions
export const getTrendsAnalysis = async (params = {}) => {
  try {
    const response = await axios.get(`${BASE_URL}/analyses/tendances/`, {
      headers: getAuthHeader(),
      params,
    });
    return response.data;
  } catch (error) {
    handleError(error, "Erreur lors de la récupération de l'analyse des tendances.");
  }
};

// ========================
// NOTIFICATIONS
// ========================

// Récupérer les notifications
export const getNotifications = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/notifications/`, {
      headers: getAuthHeader(),
    });
    return extractData(response.data);
  } catch (error) {
    handleError(error, "Erreur lors de la récupération des notifications.");
  }
};

// Marquer une notification comme lue
export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await axios.patch(
      `${BASE_URL}/notifications/${notificationId}/`,
      { lue: true },
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    handleError(error, "Erreur lors du marquage de la notification comme lue.");
  }
};

// Supprimer une notification
export const deleteNotification = async (notificationId) => {
  try {
    const response = await axios.delete(`${BASE_URL}/notifications/${notificationId}/`, {
      headers: getAuthHeader(),
    });
    return response.data || { success: true };
  } catch (error) {
    handleError(error, "Erreur lors de la suppression de la notification.");
  }
};

// ========================
// UTILITAIRES STATISTIQUES
// ========================

export const StatisticsUtils = {
  // Formater une durée en chaîne lisible
  formatDuration: (duration) => {
    if (!duration) return "0h 00min";
    
    // Si c'est une chaîne, essayer de la parser
    if (typeof duration === 'string') {
      // Format "HH:MM:SS" ou "X days, HH:MM:SS"
      const parts = duration.split(/[:, ]/).filter(part => part !== '');
      
      if (parts.length >= 2) {
        const hours = parseInt(parts[parts.length - 3] || '0');
        const minutes = parseInt(parts[parts.length - 2] || '0');
        return `${hours}h ${minutes.toString().padStart(2, '0')}min`;
      }
      return duration;
    }
    
    // Si c'est un objet Duration (timedelta)
    try {
      const totalSeconds = typeof duration === 'number' ? duration : duration.total_seconds();
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      return `${hours}h ${minutes.toString().padStart(2, '0')}min`;
    } catch (e) {
      return "0h 00min";
    }
  },

  // Formater un pourcentage
  formatPercentage: (value, decimals = 2) => {
    if (value === null || value === undefined) return "0%";
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return `${numValue.toFixed(decimals)}%`;
  },

  // Calculer le taux de régularité
  calculateRegularityRate: (regular, total) => {
    if (!total || total === 0) return 0;
    return (regular / total) * 100;
  },

  // Obtenir la couleur basée sur un taux
  getRateColor: (rate, thresholds = { good: 80, warning: 60 }) => {
    if (rate >= thresholds.good) return 'success';
    if (rate >= thresholds.warning) return 'warning';
    return 'error';
  },

  // Générer les options de période
  getPeriodOptions: () => [
    { value: 'semaine', label: 'Semaine' },
    { value: 'mois', label: 'Mois' },
    { value: 'annuel', label: 'Annuel' }
  ],

  // Obtenir la date de début de période
  getPeriodStartDate: (periodType, referenceDate = new Date()) => {
    const date = new Date(referenceDate);
    
    switch (periodType) {
      case 'semaine':
        // Premier jour de la semaine (lundi)
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(date.setDate(diff));
      case 'mois':
        // Premier jour du mois
        return new Date(date.getFullYear(), date.getMonth(), 1);
      case 'annuel':
        // Premier jour de l'année
        return new Date(date.getFullYear(), 0, 1);
      default:
        return date;
    }
  },

  // Obtenir la date de fin de période
  getPeriodEndDate: (periodType, referenceDate = new Date()) => {
    const startDate = StatisticsUtils.getPeriodStartDate(periodType, referenceDate);
    
    switch (periodType) {
      case 'semaine':
        // Dernier jour de la semaine (dimanche)
        return new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000);
      case 'mois':
        // Dernier jour du mois
        return new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
      case 'annuel':
        // Dernier jour de l'année
        return new Date(startDate.getFullYear(), 11, 31);
      default:
        return startDate;
    }
  },

  // Formater une date en français
  formatDate: (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  // Formater une date avec l'heure
  formatDateTime: (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // Obtenir le nom du mois
  getMonthName: (monthNumber) => {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return months[monthNumber - 1] || 'Mois inconnu';
  },

  // Générer les options d'années (5 dernières années)
  getYearOptions: () => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, i) => currentYear - i);
  },

  // Générer les options de mois
  getMonthOptions: () => {
    return [
      { value: 1, label: 'Janvier' },
      { value: 2, label: 'Février' },
      { value: 3, label: 'Mars' },
      { value: 4, label: 'Avril' },
      { value: 5, label: 'Mai' },
      { value: 6, label: 'Juin' },
      { value: 7, label: 'Juillet' },
      { value: 8, label: 'Août' },
      { value: 9, label: 'Septembre' },
      { value: 10, label: 'Octobre' },
      { value: 11, label: 'Novembre' },
      { value: 12, label: 'Décembre' }
    ];
  },

  // Fonction pour normaliser les noms de fichiers
  normalizeFileName: (name) => {
    if (!name) return '';
    return name
      .normalize('NFD') // Normaliser les caractères accentués
      .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
      .replace(/[^a-zA-Z0-9_]/g, '_') // Remplacer les caractères spéciaux par _
      .replace(/_+/g, '_') // Éviter les underscores multiples
      .toLowerCase();
  },

  // Générer un nom de fichier pour l'export PDF
  generatePDFFileName: (type, params = {}) => {
    const normalize = StatisticsUtils.normalizeFileName;
    const date = new Date().toISOString().split('T')[0];
    
    switch (type) {
      case 'employe':
        if (params.nom_employe) {
          const nomNormalise = normalize(params.nom_employe);
          return `statistiques_${nomNormalise}_${params.matricule || 'employe'}.pdf`;
        } else if (params.matricule) {
          return `statistiques_employe_${params.matricule}.pdf`;
        } else {
          return `statistiques_employe_${date}.pdf`;
        }
        
      case 'departement':
        if (params.nom_departement) {
          const nomNormalise = normalize(params.nom_departement);
          return `statistiques_departement_${nomNormalise}.pdf`;
        } else if (params.departement) {
          return `statistiques_departement_${params.departement}.pdf`;
        } else {
          return `statistiques_departement_${date}.pdf`;
        }
        
      case 'global':
        return `statistiques_globales_${date}.pdf`;
        
      default:
        return `statistiques_${type}_${date}.pdf`;
    }
  }
};

// ========================
// INTERCEPTEUR POUR RAFRAÎCHISSEMENT DU TOKEN
// ========================

// Intercepteur pour rafraîchir automatiquement le token
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await refreshToken(refreshToken);
          localStorage.setItem('access_token', response.access);
          
          // Retenter la requête originale avec le nouveau token
          originalRequest.headers.Authorization = `Bearer ${response.access}`;
          return axios(originalRequest);
        } catch (refreshError) {
          // Si le rafraîchissement échoue, déconnecter l'utilisateur
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

// ========================
// EXPORT PAR DÉFAUT
// ========================
export default {
  login,
  refreshToken,
  getCurrentUser,
  register,
  isSuperuser,

  // Départements
  getDepartements,
  getDepartement,
  createDepartement,
  updateDepartement,
  deleteDepartement,

  // Employés
  getEmployes,
  getEmploye,
  createEmploye,
  updateEmploye,
  deleteEmploye,
  getEmployesStats,

  // Pointages
  getPointages,
  getPointage,
  createPointage,
  updatePointage,
  deletePointage,
  getPointagesStatsMensuelles,

  // Absences
  getAbsences,
  getAbsence,
  createAbsence,
  updateAbsence,
  deleteAbsence,

  // Congés
  getConges,
  getConge,
  createConge,
  updateConge,
  deleteConge,
  validerConge,
  refuserConge,

  // Événements
  getEvenements,
  getEvenement,
  createEvenement,
  updateEvenement,
  deleteEvenement,
  getEvenementsAVenir,

  // ❌ SUPPRIMÉ : Fonctions d'envoi d'email manuel
  // sendEventEmail,
  // sendAllEventsEmail,

  // Export PDF pour toutes les tables
  exportDepartementsPDF,
  exportEmployesPDF,
  exportPointagesPDF,
  exportAbsencesPDF,
  exportCongesPDF,
  exportEvenementsPDF,
  exportDepartementsPDFSpecific,
  exportEmployesPDFSpecific,
  exportPointagesPDFSpecific,
  exportAbsencesPDFSpecific,
  exportCongesPDFSpecific,
  exportEvenementsPDFSpecific,

  // Statistiques
  getEmployeeStatistics,
  getDepartmentStatistics,
  getGlobalStatistics,
  getDetailedStatistics,
  getSavedStatistics,
  deleteSavedStatistics,
  exportStatisticsPDF,

  // Rapports et Analyses
  getReportHistory,
  generateReport,
  downloadReport,
  getComparativeAnalysis,
  getTrendsAnalysis,

  // Notifications
  getNotifications,
  markNotificationAsRead,
  deleteNotification,

  // Utilitaires
  StatisticsUtils,
};