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
// STATISTIQUES (CORRIGÉ POUR LE NOUVEAU FORMAT)
// ========================

// Statistiques employé - VERSION OPTIMISÉE
export const getEmployeeStatistics = async (matricule = null, params = {}) => {
  try {
    let url = `${BASE_URL}/statistiques/employe/`;
    
    // Si un matricule est fourni, l'ajouter aux paramètres
    if (matricule) {
      params.matricule = matricule;
    }
    
    console.log('🔄 Appel API statistiques employé:', { url, params });
    
    const response = await axios.get(url, {
      headers: getAuthHeader(),
      params,
    });
    
    console.log('✅ Réponse API statistiques:', response.data);
    
    // ✅ CORRECTION : Normaliser les données pour correspondre au format attendu
    const normalizedData = normalizeStatisticsData(response.data);
    return normalizedData;
    
  } catch (error) {
    console.error('❌ Erreur API getEmployeeStatistics:', error.response?.data || error.message);
    
    // Retourner des données de démonstration si l'API échoue
    if (error.response?.status === 404 || error.response?.status === 500) {
      console.warn('⚠️ API non disponible, utilisation des données de démonstration');
      return getDemoEmployeeStats(matricule, params);
    }
    
    handleError(error, "Erreur lors de la récupération des statistiques employé.");
  }
};

// Fonction pour normaliser les données statistiques
const normalizeStatisticsData = (data) => {
  if (!data) return getDemoEmployeeStats();
  
  // ✅ S'assurer que les timedelta sont des strings (format Django)
  const ensureStringDuration = (duration) => {
    if (typeof duration === 'string') return duration;
    if (duration?.total_seconds) {
      // Convertir timedelta en string "HH:MM:SS"
      const total_seconds = duration.total_seconds();
      const hours = Math.floor(total_seconds / 3600);
      const minutes = Math.floor((total_seconds % 3600) / 60);
      const seconds = Math.floor(total_seconds % 60);
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return '0:00:00';
  };

  return {
    ...data,
    heures_travail_total: ensureStringDuration(data.heures_travail_total),
    moyenne_heures_quotidiennes: ensureStringDuration(data.moyenne_heures_quotidiennes),
    heures_attendues_jours_passes: ensureStringDuration(data.heures_attendues_jours_passes),
    ecart_heures: ensureStringDuration(data.ecart_heures),
  };
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

// Export PDF des statistiques
export const exportStatisticsPDF = async (exportType, params = {}) => {
  try {
    const response = await axios.get(`${BASE_URL}/statistiques/export-pdf/`, {
      headers: getAuthHeader(),
      params: {
        type: exportType,
        ...params
      },
      responseType: 'blob'
    });
    
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    let filename = 'statistiques.pdf';
    if (params.nom_employe) {
      filename = `statistiques_${params.nom_employe}.pdf`;
    } else if (exportType === 'global') {
      filename = `statistiques_globales.pdf`;
    }
    
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return { success: true, message: "PDF exporté avec succès", filename };
    
  } catch (error) {
    handleError(error, "Erreur lors de l'export PDF des statistiques.");
  }
};

// ========================
// DONNÉES DE DÉMONSTRATION (Fallback amélioré)
// ========================

// Données de démonstration pour les statistiques employé
const getDemoEmployeeStats = (matricule, params) => {
  const baseStats = {
    employe: { 
      matricule: matricule || 'DEMO001',
      nom: 'Démo',
      prenom: 'Employé'
    },
    periode_debut: '2024-11-01',
    periode_fin: '2024-11-30',
    type_periode: 'mensuel',
    
    // Métriques principales
    heures_travail_total: '160:00:00',
    jours_travailles: 20,
    moyenne_heures_quotidiennes: '08:00:00',
    
    // Régularité
    pointages_reguliers: 18,
    pointages_irreguliers: 2,
    taux_regularite: 85.0,
    
    // Ponctualité
    pointages_ponctuels: 16,
    pointages_non_ponctuels: 4,
    taux_ponctualite: 78.0,
    
    // Analyse heures
    jours_passes_mois: 22,
    heures_attendues_jours_passes: '176:00:00',
    statut_heures: 'NORMAL',
    ecart_heures: '16:00:00',
    pourcentage_ecart: -9.1,
    observation_heures: '✅ Performances conformes avec une légère avance sur les heures travaillées. Ponctualité à améliorer.',
    
    // Présence
    taux_presence: 90.9,
    jours_ouvrables: 22
  };
  
  console.log('📊 Données de démonstration utilisées:', baseStats);
  return baseStats;
};

// ========================
// ANALYSES AVANCÉES (simplifiées pour les 3 sections principales)
// ========================

// Ces fonctions ne sont plus nécessaires pour les 3 sections principales
// mais sont conservées pour la compatibilité
export const getPonctualiteAnalysis = async (matricule, params = {}) => {
  try {
    const response = await axios.get(`${BASE_URL}/statistiques/ponctualite/${matricule}/`, {
      headers: getAuthHeader(),
      params,
    });
    return response.data;
  } catch (error) {
    console.log('Endpoint ponctualité non disponible');
    return null;
  }
};

export const getHeuresComparison = async (matricule, params = {}) => {
  try {
    const response = await axios.get(`${BASE_URL}/statistiques/comparaison-heures/${matricule}/`, {
      headers: getAuthHeader(),
      params,
    });
    return response.data;
  } catch (error) {
    console.log('Endpoint comparaison non disponible');
    return null;
  }
};

export const getMonthlyTrends = async (matricule, params = {}) => {
  try {
    const response = await axios.get(`${BASE_URL}/statistiques/tendances/${matricule}/`, {
      headers: getAuthHeader(),
      params,
    });
    return response.data;
  } catch (error) {
    console.log('Endpoint tendances non disponible');
    return null;
  }
};

// ========================
// UTILITAIRES STATISTIQUES AMÉLIORÉS
// ========================

export const StatisticsUtils = {
  // Formater une durée en chaîne lisible
  formatDuration: (duration) => {
    if (!duration) return "0h 00min";
    
    // Si c'est une chaîne (format "HH:MM:SS" ou "X days, HH:MM:SS")
    if (typeof duration === 'string') {
      // Gérer le format "1 day, 08:14:00" de Django
      if (duration.includes('day')) {
        const parts = duration.split(', ');
        if (parts.length === 2) {
          const days = parseInt(parts[0]) || 0;
          const timeParts = parts[1].split(':');
          if (timeParts.length >= 2) {
            const hours = parseInt(timeParts[0]) || 0;
            const minutes = parseInt(timeParts[1]) || 0;
            const totalHours = (days * 24) + hours;
            return `${totalHours}h ${minutes.toString().padStart(2, '0')}min`;
          }
        }
      }
      
      // Format simple "HH:MM:SS"
      const parts = duration.split(':');
      if (parts.length >= 2) {
        const hours = parseInt(parts[0]) || 0;
        const minutes = parseInt(parts[1]) || 0;
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
  formatPercentage: (value, decimals = 1) => {
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
    const safeRate = typeof rate === 'string' ? parseFloat(rate) : rate;
    if (safeRate >= thresholds.good) return 'success';
    if (safeRate >= thresholds.warning) return 'warning';
    return 'error';
  },

  // Obtenir la couleur basée sur le statut des heures
  getHeuresStatusColor: (statut) => {
    switch (statut) {
      case 'INSUFFISANT':
        return 'warning';
      case 'NORMAL':
        return 'success';
      case 'SURPLUS':
        return 'info';
      default:
        return 'default';
    }
  },

  // Générer une observation basée sur les statistiques
  generateObservation: (stats) => {
    if (!stats) return "Aucune donnée disponible";
    
    const statut = stats.statut_heures;
    const heuresReelles = StatisticsUtils.formatDuration(stats.heures_travail_total);
    const heuresAttendues = StatisticsUtils.formatDuration(stats.heures_attendues_jours_passes);
    const ecart = StatisticsUtils.formatDuration(stats.ecart_heures);
    const tauxPonctualite = stats.taux_ponctualite || 0;

    switch (statut) {
      case 'INSUFFISANT':
        return `⚠️ Heures INSUFFISANTES. Heures travaillées: ${heuresReelles} sur ${heuresAttendues} attendues. Déficit: ${ecart}. Ponctualité: ${tauxPonctualite}%`;
      case 'NORMAL':
        return `✅ Heures CONFORMES. ${heuresReelles} travaillées comme prévu. Ponctualité: ${tauxPonctualite}%`;
      case 'SURPLUS':
        return `📈 Heures en SURPLUS. ${heuresReelles} travaillées (excédent: ${ecart}). Ponctualité: ${tauxPonctualite}%`;
      default:
        return `📊 Analyse en cours. Ponctualité: ${tauxPonctualite}%`;
    }
  },

  // Calculer le taux de présence
  calculatePresenceRate: (stats) => {
    if (!stats || !stats.jours_travailles || !stats.jours_passes_mois || stats.jours_passes_mois === 0) {
      return 0;
    }
    return Math.round((stats.jours_travailles / stats.jours_passes_mois) * 100);
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

  // Événements
  getEvenements,
  getEvenement,
  createEvenement,
  updateEvenement,
  deleteEvenement,
  getEvenementsAVenir,

  // Statistiques principales
  getEmployeeStatistics,
  getGlobalStatistics,
  exportStatisticsPDF,

  // Utilitaires
  StatisticsUtils,
};