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
  if (error.response?.data) {
    const data = error.response.data;
    if (typeof data === "string") {
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
  } else {
    console.warn("Structure de données inattendue, retourne array vide");
    return [];
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
        return response.data;
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
    console.error("Erreur lors de la récupération des statistiques mensuelles :", error.response || error.message);
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
// EXPORT PAR DÉFAUT
// ========================
export default {
  login,
  refreshToken,
  getCurrentUser,
  register,

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
};