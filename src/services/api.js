// src/services/api.js
import axios from "axios";

const BASE_URL = "http://localhost:8000/api";

// ========================
// CRÉATION DE L'INSTANCE API
// ========================
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercepteur pour ajouter le token automatiquement
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour rafraîchir automatiquement le token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshTokenValue = localStorage.getItem('refresh_token');
      if (refreshTokenValue) {
        try {
          const response = await axios.post(`${BASE_URL}/token/refresh/`, { 
            refresh: refreshTokenValue 
          });
          
          const { access } = response.data;
          localStorage.setItem('access_token', access);
          
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.href = '/';
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

// ========================
// UTILITAIRES
// ========================

const getAuthHeader = () => {
  const token = localStorage.getItem("access_token");
  if (!token) {
    throw new Error("Aucun token d'authentification trouvé. Veuillez vous connecter.");
  }
  return { 
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

const handleError = (error, defaultMessage) => {
  let errorMessage = defaultMessage;
  if (error.response) {
    const { status, data } = error.response;
    
    if (status === 401) {
      errorMessage = "Session expirée. Veuillez vous reconnecter.";
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      window.location.href = "/";
    } else if (status === 403) {
      errorMessage = "Vous n'avez pas les permissions nécessaires.";
    } else if (status === 404) {
      errorMessage = "Ressource non trouvée.";
    } else if (typeof data === "string") {
      errorMessage = data;
    } else if (data.detail) {
      errorMessage = data.detail;
    } else if (data.error) {
      errorMessage = data.error;
    } else if (data.non_field_errors) {
      errorMessage = data.non_field_errors[0];
    } else {
      const fieldErrors = Object.values(data).flat().join(", ");
      if (fieldErrors) errorMessage = fieldErrors;
    }
  } else if (error.request) {
    errorMessage = "Impossible de contacter le serveur. Vérifiez votre connexion.";
  } else if (error.message) {
    errorMessage = error.message;
  }
  
  console.error("❌ Erreur API:", error.response?.data || error.message);
  throw new Error(errorMessage);
};

// ========================
// AUTHENTIFICATION
// ========================

export const login = async (email, password) => {
  try {
    const response = await axios.post(`${BASE_URL}/token/`, { 
      email, 
      password 
    });
    
    const { access, refresh } = response.data;
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
    
    return response.data;
  } catch (error) {
    handleError(error, "Email ou mot de passe incorrect.");
  }
};

export const refreshToken = async () => {
  try {
    const refresh = localStorage.getItem("refresh_token");
    if (!refresh) {
      throw new Error("Aucun token de rafraîchissement disponible");
    }
    
    const response = await axios.post(`${BASE_URL}/token/refresh/`, { 
      refresh 
    });
    
    const { access } = response.data;
    localStorage.setItem("access_token", access);
    
    return response.data;
  } catch (error) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await api.get(`${BASE_URL}/users/me/`);
    return response.data;
  } catch (error) {
    handleError(error, "Erreur lors de la récupération de l'utilisateur.");
  }
};

export const register = async (userData) => {
  try {
    const response = await axios.post(`${BASE_URL}/register/`, userData);
    return response.data;
  } catch (error) {
    handleError(error, "Erreur lors de l'inscription.");
  }
};

export const logout = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  window.location.href = "/";
};

export const isAuthenticated = () => {
  return !!localStorage.getItem("access_token");
};

export const isSuperuser = async () => {
  try {
    const user = await getCurrentUser();
    return user.is_superuser || false;
  } catch (error) {
    console.error("Erreur lors de la vérification du statut superutilisateur:", error);
    return false;
  }
};

// ========================
// CRUD GÉNÉRIQUE POUR DRF
// ========================

const createCrudFunctions = (endpoint, idField = 'id') => {
  return {
    getAll: async (params = {}) => {
      try {
        const response = await api.get(`${BASE_URL}/${endpoint}/`, { params });
        
        // Toujours retourner un tableau
        if (Array.isArray(response.data)) {
          return response.data;
        }
        
        if (response.data.results !== undefined) {
          return response.data.results;
        }
        
        if (response.data.data !== undefined) {
          if (Array.isArray(response.data.data)) {
            return response.data.data;
          } else if (response.data.data.results !== undefined) {
            return response.data.data.results;
          }
        }
        
        // Essayer de convertir en tableau si possible
        try {
          const asArray = Object.values(response.data);
          return asArray;
        } catch (e) {
          return [];
        }
        
      } catch (error) {
        handleError(error, `Erreur lors de la récupération des ${endpoint}.`);
      }
    },
    
    getOne: async (id) => {
      try {
        const response = await api.get(`${BASE_URL}/${endpoint}/${id}/`);
        return response.data;
      } catch (error) {
        handleError(error, `Erreur lors de la récupération de ${endpoint.slice(0, -1)}.`);
      }
    },
    
    create: async (data) => {
      try {
        const response = await api.post(`${BASE_URL}/${endpoint}/`, data);
        return response.data;
      } catch (error) {
        handleError(error, `Erreur lors de la création de ${endpoint.slice(0, -1)}.`);
      }
    },
    
    update: async (id, data) => {
      try {
        try {
          const response = await api.patch(`${BASE_URL}/${endpoint}/${id}/`, data);
          return response.data;
        } catch (patchError) {
          const response = await api.put(`${BASE_URL}/${endpoint}/${id}/`, data);
          return response.data;
        }
      } catch (error) {
        handleError(error, `Erreur lors de la mise à jour de ${endpoint.slice(0, -1)}.`);
      }
    },
    
    deleteOne: async (id) => {
      try {
        await api.delete(`${BASE_URL}/${endpoint}/${id}/`);
        return { success: true, message: "Supprimé avec succès" };
      } catch (error) {
        handleError(error, `Erreur lors de la suppression de ${endpoint.slice(0, -1)}.`);
      }
    },
    
    search: async (searchTerm, searchFields = []) => {
      try {
        const params = { search: searchTerm };
        const response = await api.get(`${BASE_URL}/${endpoint}/`, { params });
        
        if (Array.isArray(response.data)) {
          return response.data;
        }
        if (response.data.results !== undefined) {
          return response.data.results;
        }
        
        return response.data;
      } catch (error) {
        handleError(error, `Erreur lors de la recherche de ${endpoint}.`);
      }
    }
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
export const searchDepartements = departementsCrud.search;

// ========================
// EMPLOYÉS
// ========================
const employesCrud = createCrudFunctions("employes", "cin");
export const getEmployes = employesCrud.getAll;
export const getEmploye = employesCrud.getOne;
export const createEmploye = employesCrud.create;
export const updateEmploye = employesCrud.update;
export const deleteEmploye = employesCrud.deleteOne;
export const searchEmployes = employesCrud.search;

export const getEmployesStats = async () => {
  try {
    const response = await api.get(`${BASE_URL}/employes/stats/`);
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
export const searchPointages = pointagesCrud.search;

export const getPointagesStatsMensuelles = async (mois, annee) => {
  try {
    const response = await api.get(`${BASE_URL}/pointages/stats_mensuelles/`, {
      params: { mois, annee },
    });
    return response.data;
  } catch (error) {
    handleError(error, "Erreur lors de la récupération des statistiques mensuelles des pointages.");
  }
};

// ========================
// STATISTIQUES EMPLOYÉS
// ========================
const statistiquesEmployeCrud = createCrudFunctions("statistiques-employe", "id");
export const getStatistiquesEmploye = statistiquesEmployeCrud.getAll;
export const getStatistiqueEmploye = statistiquesEmployeCrud.getOne;

// ========================
// STATISTIQUES GLOBALES
// ========================
const statistiquesGlobalesCrud = createCrudFunctions("statistiques-globales", "id");
export const getStatistiquesGlobales = statistiquesGlobalesCrud.getAll;
export const getStatistiqueGlobale = statistiquesGlobalesCrud.getOne;

// ========================
// FONCTIONS DE STATISTIQUES AVANCÉES
// ========================

export const getPonctualiteAnalysis = async (cin, params = {}) => {
  try {
    const url = cin ? `${BASE_URL}/statistiques/ponctualite/${cin}/` : `${BASE_URL}/statistiques/ponctualite/`;
    const response = await api.get(url, { params });
    return response.data;
  } catch (error) {
    console.warn("Erreur analyse ponctualité:", error);
    return null;
  }
};

export const getHeuresComparison = async (cin, params = {}) => {
  try {
    const url = cin ? `${BASE_URL}/statistiques/comparaison-heures/${cin}/` : `${BASE_URL}/statistiques/comparaison-heures/`;
    const response = await api.get(url, { params });
    return response.data;
  } catch (error) {
    console.warn("Erreur comparaison heures:", error);
    return null;
  }
};

export const getMonthlyTrends = async (cin, params = {}) => {
  try {
    const url = cin ? `${BASE_URL}/statistiques/tendances-mensuelles/${cin}/` : `${BASE_URL}/statistiques/tendances-mensuelles/`;
    const response = await api.get(url, { params });
    return response.data;
  } catch (error) {
    console.warn("Erreur tendances mensuelles:", error);
    return null;
  }
};

// ========================
// AUTRES FONCTIONS
// ========================

export const getEmployeeStatistics = async (cin, params = {}) => {
  try {
    // ✅ CORRECTION : URL avec CIN
    const url = `${BASE_URL}/statistiques/employe/${cin}/`;
    
    // ✅ CORRECTION : Nettoyer les params - supprimer 'cin' et 'matricule'
    const filteredParams = { ...params };
    delete filteredParams.cin;
    delete filteredParams.matricule;
    
    console.log('📡 Appel API EmployeeStatistics:', { url, filteredParams });
    
    const response = await api.get(url, { 
      params: filteredParams 
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 500) {
      console.log("Erreur serveur statistiques employé:", error.message);
      // Données par défaut
      return {
        heures_travail_total: "0h 00min",
        jours_travailles: 0,
        jours_absents: 0,
        taux_ponctualite: 0,
        taux_regularite: 0,
        pointages_reguliers: 0,
        pointages_irreguliers: 0,
        taux_presence: 0,
        taux_absence: 0,
        statut_heures: 'NORMAL',
        observation_heures: 'Données temporairement indisponibles',
        // ✅ Ajouter les champs manquants
        pointages_ponctuels: 0,
        pointages_non_ponctuels: 0,
        moyenne_heures_quotidiennes: "0h 00min"
      };
    }
    handleError(error, "Erreur lors de la récupération des statistiques employé.");
    throw error;
  }
};

export const getGlobalStatistics = async (params = {}) => {
  try {
    const response = await api.get(`${BASE_URL}/statistiques/global/`, { params });
    return response.data;
  } catch (error) {
    if (error.response?.status === 500) {
      console.log("Erreur serveur statistiques globales:", error.message);
      return {
        total_employes: 0,
        employes_actifs: 0,
        total_pointages: 0,
        heures_travail_total: "0h 00min",
        taux_presence: 0,
        taux_regularite_global: 0,
        total_absences: 0,  // NOUVEAU
        taux_absence_global: 0,  // NOUVEAU
      };
    }
    handleError(error, "Erreur lors de la récupération des statistiques globales.");
    throw error;
  }
};

export const exportStatisticsPDF = async (exportType, params = {}) => {
  try {
    const queryParams = new URLSearchParams({ type: exportType });
    
    if (params.cin) queryParams.append('cin', params.cin);
    if (params.mois) queryParams.append('mois', params.mois);
    if (params.annee) queryParams.append('annee', params.annee);
    if (params.periode) queryParams.append('periode', params.periode);
    if (params.date) queryParams.append('date', params.date);
    
    const url = `${BASE_URL}/statistiques/export-pdf/?${queryParams.toString()}`;
    
    const response = await api.get(url, {
      responseType: 'blob'
    });
    
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    
    let filename = 'statistiques.pdf';
    if (exportType === 'employe' && params.cin) {
      filename = `statistiques_employe_${params.cin}.pdf`;
    } else if (exportType === 'global') {
      const date = new Date().toISOString().slice(0, 10);
      filename = `statistiques_globales_${date}.pdf`;
    }
    
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
    
    return { success: true, filename };
    
  } catch (error) {
    handleError(error, "Erreur lors de l'export PDF.");
  }
};

// ========================
// UTILITAIRES STATISTIQUES
// ========================

export const StatisticsUtils = {
  // Formater une durée Django (timedelta) en chaîne lisible
  formatDuration: (duration) => {
    if (!duration) return "0h 00min";
    
    if (typeof duration === 'string') {
      if (duration.includes('day')) {
        try {
          const parts = duration.split(', ');
          if (parts.length === 2) {
            const daysMatch = parts[0].match(/(\d+)/);
            const days = daysMatch ? parseInt(daysMatch[1]) : 0;
            const timeParts = parts[1].split(':');
            if (timeParts.length >= 2) {
              const hours = parseInt(timeParts[0]) || 0;
              const minutes = parseInt(timeParts[1]) || 0;
              const totalHours = (days * 24) + hours;
              return `${totalHours}h ${minutes.toString().padStart(2, '0')}min`;
            }
          }
        } catch (e) {
          console.warn('Erreur format durée jour:', e);
        }
      }
      
      try {
        const parts = duration.split(':');
        if (parts.length >= 2) {
          const hours = parseInt(parts[0]) || 0;
          const minutes = parseInt(parts[1]) || 0;
          return `${hours}h ${minutes.toString().padStart(2, '0')}min`;
        }
      } catch (e) {
        console.warn('Erreur format durée simple:', e);
      }
      
      return duration;
    }
    
    if (typeof duration === 'number') {
      try {
        const hours = Math.floor(duration / 3600);
        const minutes = Math.floor((duration % 3600) / 60);
        return `${hours}h ${minutes.toString().padStart(2, '0')}min`;
      } catch (e) {
        console.warn('Erreur format nombre:', e);
      }
    }
    
    return "0h 00min";
  },

  // Formater un pourcentage
  formatPercentage: (value, decimals = 1) => {
    if (value === null || value === undefined || isNaN(value)) return "0%";
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return `${numValue.toFixed(decimals)}%`;
  },

  // Obtenir la couleur basée sur un taux
  getRateColor: (rate, thresholds = { good: 80, warning: 60 }) => {
    if (rate === null || rate === undefined || isNaN(rate)) return 'default';
    
    const safeRate = typeof rate === 'string' ? parseFloat(rate) : rate;
    if (safeRate >= thresholds.good) return 'success';
    if (safeRate >= thresholds.warning) return 'warning';
    return 'error';
  },

  // Obtenir la couleur basée sur le statut des heures
  getHeuresStatusColor: (statut) => {
    if (!statut) return 'default';
    
    switch (statut.toLowerCase()) {
      case 'insuffisant':
      case 'en_retard':
        return 'warning';
      case 'normal':
        return 'success';
      case 'surplus':
      case 'en_avance':
        return 'info';
      default:
        return 'default';
    }
  },

  // Obtenir la couleur pour le taux d'absence
  getAbsenceColor: (taux) => {
    if (taux === null || taux === undefined || isNaN(taux)) return 'default';
    
    const safeTaux = typeof taux === 'string' ? parseFloat(taux) : taux;
    if (safeTaux === 0) return 'success';
    if (safeTaux <= 10) return 'warning';
    if (safeTaux <= 20) return 'error';
    return 'error';
  },

  // Obtenir la couleur pour le statut de ponctualité
  getPonctualiteStatusColor: (taux) => {
    if (taux === null || taux === undefined || isNaN(taux)) return 'default';
    
    const safeTaux = typeof taux === 'string' ? parseFloat(taux) : taux;
    if (safeTaux >= 90) return 'success';
    if (safeTaux >= 70) return 'warning';
    return 'error';
  },

  // Générer une observation basée sur les statistiques
  generateObservation: (stats) => {
    if (!stats) return "Aucune donnée disponible";
    
    const statut = stats.statut_performance || stats.statut_heures;
    const heuresReelles = StatisticsUtils.formatDuration(stats.heures_travail_total);
    const heuresAttendues = StatisticsUtils.formatDuration(stats.heures_attendues_jours_passes || stats.heures_attendues_mois);
    const ecart = StatisticsUtils.formatDuration(stats.ecart_heures);
    const tauxPonctualite = stats.taux_ponctualite || 0;
    const tauxAbsence = stats.taux_absence || 0;  // NOUVEAU
    const joursAbsents = stats.jours_absents || 0;  // NOUVEAU
    const joursTravailles = stats.jours_travailles || 0;
    
    const absencesText = joursAbsents > 0 ? `${joursAbsents} jour(s) d'absence (${StatisticsUtils.formatPercentage(tauxAbsence)}). ` : '';
    const travailText = joursTravailles > 0 ? `${joursTravailles} jour(s) travaillé(s). ` : '';
    const ponctualiteText = tauxPonctualite > 0 ? `Ponctualité: ${StatisticsUtils.formatPercentage(tauxPonctualite)}. ` : '';

    if (!statut) {
      return `${absencesText}${travailText}${ponctualiteText}`;
    }

    switch (statut.toLowerCase()) {
      case 'insuffisant':
      case 'en_retard':
        return `⚠️ Heures INSUFFISANTES. ${absencesText}${heuresReelles} sur ${heuresAttendues}. Déficit: ${ecart}. ${ponctualiteText}`;
      case 'normal':
        return `✅ Performances CONFORMES. ${absencesText}${heuresReelles} travaillées. ${ponctualiteText}`;
      case 'surplus':
      case 'en_avance':
        return `📈 Heures en SURPLUS. ${absencesText}${heuresReelles} (excédent: ${ecart}). ${ponctualiteText}`;
      default:
        return `📊 ${absencesText}${travailText}${ponctualiteText}`;
    }
  },

  // Calculer le taux de présence
  calculatePresenceRate: (stats) => {
    if (!stats) return 0;
    
    const joursTravailles = stats.jours_travailles || 0;
    const joursTotal = stats.jours_ouvrables_passes || stats.jours_ouvrables || 0;
    
    if (!joursTravailles || !joursTotal || joursTotal === 0) return 0;
    
    return Math.round((joursTravailles / joursTotal) * 100);
  },

  // Calculer le taux d'absence
  calculateAbsenceRate: (stats) => {
    if (!stats) return 0;
    
    const joursAbsents = stats.jours_absents || 0;
    const joursTotal = stats.jours_ouvrables_passes || stats.jours_ouvrables || 0;
    
    if (!joursAbsents || !joursTotal || joursTotal === 0) return 0;
    
    return Math.round((joursAbsents / joursTotal) * 100);
  },

  // Formater les détails de ponctualité
  formatPonctualiteDetails: (stats) => {
    if (!stats) return "Aucun pointage analysé";
    
    const parfaits = stats.pointages_parfaits || 0;
    const valides = stats.pointages_valides || 0;
    const retardsEntree = stats.pointages_entree_retard || 0;
    const sortiesAvance = stats.pointages_sortie_avance || 0;
    const retardsSorties = stats.pointages_entree_retard_sortie_avance || 0;
    
    const total = parfaits + valides + retardsEntree + sortiesAvance + retardsSorties;
    
    if (total === 0) return "Aucun pointage analysé";
    
    const details = [];
    if (parfaits > 0) details.push(`${parfaits} parfaits`);
    if (valides > 0) details.push(`${valides} valides`);
    if (retardsEntree > 0) details.push(`${retardsEntree} retards d'entrée`);
    if (sortiesAvance > 0) details.push(`${sortiesAvance} sorties anticipées`);
    if (retardsSorties > 0) details.push(`${retardsSorties} retards et sorties anticipées`);
    
    return details.join(', ');
  },

  // Analyser les tendances de ponctualité
  analyzePonctualiteTrend: (currentStats, previousStats) => {
    if (!currentStats || !previousStats) return 'stable';
    
    const currentTaux = currentStats.taux_ponctualite || 0;
    const previousTaux = previousStats.taux_ponctualite || 0;
    
    if (currentTaux > previousTaux + 5) return 'en_amelioration';
    if (currentTaux < previousTaux - 5) return 'en_baisse';
    return 'stable';
  },

  // Calculer le taux de réalisation
  calculateRealisationRate: (stats) => {
    if (!stats) return 0;
    
    const heuresReelles = StatisticsUtils.parseDurationToHours(stats.heures_travail_total);
    const heuresAttendues = StatisticsUtils.parseDurationToHours(stats.heures_attendues_jours_passes || stats.heures_attendues_mois);
    
    if (!heuresReelles || !heuresAttendues || heuresAttendues === 0) return 0;
    
    return Math.round((heuresReelles / heuresAttendues) * 100);
  },

  // Convertir une durée en heures décimales
  parseDurationToHours: (duration) => {
    if (!duration) return 0;
    
    if (typeof duration === 'string') {
      let totalSeconds = 0;
      
      if (duration.includes('day')) {
        try {
          const parts = duration.split(', ');
          if (parts.length === 2) {
            const daysMatch = parts[0].match(/(\d+)/);
            const days = daysMatch ? parseInt(daysMatch[1]) : 0;
            totalSeconds += days * 24 * 3600;
            
            const timeParts = parts[1].split(':');
            if (timeParts.length >= 3) {
              totalSeconds += (parseInt(timeParts[0]) || 0) * 3600;
              totalSeconds += (parseInt(timeParts[1]) || 0) * 60;
              totalSeconds += parseInt(timeParts[2]) || 0;
            }
          }
        } catch (e) {
          console.warn('Erreur parse durée jour:', e);
        }
      } else {
        const parts = duration.split(':');
        if (parts.length >= 2) {
          totalSeconds += (parseInt(parts[0]) || 0) * 3600;
          totalSeconds += (parseInt(parts[1]) || 0) * 60;
          if (parts.length >= 3) {
            totalSeconds += parseInt(parts[2]) || 0;
          }
        }
      }
      
      return totalSeconds / 3600;
    }
    
    if (typeof duration === 'number') {
      return duration;
    }
    
    return 0;
  },

  // Formater une date
  formatDate: (dateString, format = 'fr-FR') => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(format, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      console.warn('Erreur format date:', e);
      return dateString;
    }
  },

  // Obtenir le nom du mois
  getMonthName: (monthNumber) => {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return months[monthNumber - 1] || '';
  }
};

// ========================
// EXPORT PAR DÉFAUT
// ========================
export default {
  // Authentification
  login,
  refreshToken,
  getCurrentUser,
  register,
  logout,
  isAuthenticated,
  isSuperuser,

  // Départements
  getDepartements,
  getDepartement,
  createDepartement,
  updateDepartement,
  deleteDepartement,
  searchDepartements,

  // Employés
  getEmployes,
  getEmploye,
  createEmploye,
  updateEmploye,
  deleteEmploye,
  searchEmployes,
  getEmployesStats,

  // Pointages
  getPointages,
  getPointage,
  createPointage,
  updatePointage,
  deletePointage,
  searchPointages,
  getPointagesStatsMensuelles,

  // Statistiques sauvegardées
  getStatistiquesEmploye,
  getStatistiqueEmploye,
  getStatistiquesGlobales,
  getStatistiqueGlobale,

  // Statistiques principales
  getEmployeeStatistics,
  getGlobalStatistics,
  exportStatisticsPDF,

  // Analyses avancées
  getPonctualiteAnalysis,
  getHeuresComparison,
  getMonthlyTrends,

  // Utilitaires
  StatisticsUtils,
  
  // Utilitaires de base
  handleError,
  getAuthHeader,
  
  // Instance axios pour usage avancé
  api
};