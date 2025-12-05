import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import Auth from "./components/Auth";
import PrivateRoute from "./components/PrivateRoute";
import Employes from "./pages/employes/Employes";
import Departements from "./pages/departements/Departements";
import Pointages from "./pages/pointages/Pointages";
import { getCurrentUser, isSuperuser } from "./services/api";

// Import des pages de statistiques
import StatisticsOverview from "./pages/statistiques/StatisticsOverview";
import EmployeeStatistics from "./pages/statistiques/EmployeeStatistics";

const privateRoutes = [
  { path: "/employes", element: <Employes /> },
  { path: "/departements", element: <Departements /> },
  { path: "/pointages", element: <Pointages /> },
  // Routes des statistiques
  { path: "/statistiques/overview", element: <StatisticsOverview /> },
  { path: "/statistiques/employes", element: <EmployeeStatistics /> },
  // Redirection pour la route racine des statistiques
  { path: "/statistiques", element: <Navigate to="/statistiques/overview" replace /> },
];

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("access_token")
  );
  const [isSuperuserState, setIsSuperuserState] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Vérifier l'authentification et le statut de superutilisateur au chargement
  useEffect(() => {
    const checkAuth = async () => {
      if (localStorage.getItem("access_token")) {
        try {
          const userData = await getCurrentUser();
          setUser(userData);
          const superuser = await isSuperuser();
          setIsSuperuserState(superuser);
          setIsAuthenticated(true);
        } catch (error) {
          console.error("Erreur d'authentification:", error.message);
          handleLogout();
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, [navigate]);

  const handleLogin = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    isSuperuser().then(superuser => {
      setIsSuperuserState(superuser);
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setIsAuthenticated(false);
    setUser(null);
    setIsSuperuserState(false);
    navigate("/");
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Chargement...</div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Route pour /login qui redirige vers la page d'auth */}
      <Route 
        path="/login" 
        element={<Navigate to="/" replace />} 
      />
      
      <Route
        path="/"
        element={<Auth setIsAuthenticated={setIsAuthenticated} onLogin={handleLogin} />}
      />
      
      {privateRoutes.map(({ path, element }) => (
        <Route
          key={path}
          path={path}
          element={
            <PrivateRoute 
              isAuthenticated={isAuthenticated} 
              isSuperuser={isSuperuserState}
              user={user}
              onLogout={handleLogout}
            >
              {React.cloneElement(element, { 
                user,
                isSuperuser: isSuperuserState,
                onLogout: handleLogout 
              })}
            </PrivateRoute>
          }
        />
      ))}
      
      {/* Route fallback pour les URLs inconnues */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;