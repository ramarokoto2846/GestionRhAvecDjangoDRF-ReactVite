// src/App.jsx
import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import PrivateRoute from "./components/PrivateRoute";

import Employes from "./pages/employes/Employes";
import Departements from "./pages/departements/Departements";
import Pointages from "./pages/pointages/Pointages";
import Absences from "./pages/abscences/Absences";
import Evenements from "./pages/evenements/Evenements";
import Conges from "./pages/conges/Conges";

const privateRoutes = [
  { path: "/home", element: <Home /> },
  { path: "/employes", element: <Employes /> },
  { path: "/departements", element: <Departements /> },
  { path: "/pointages", element: <Pointages /> },
  { path: "/conges", element: <Conges /> },
  { path: "/absences", element: <Absences /> },
  { path: "/evenements", element: <Evenements /> },
];

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("access_token")
  );

  return (
    <Routes>
      <Route
        path="/"
        element={<Auth setIsAuthenticated={setIsAuthenticated} />}
      />

      {privateRoutes.map(({ path, element }) => (
        <Route
          key={path}
          path={path}
          element={<PrivateRoute>{element}</PrivateRoute>}
        />
      ))}
    </Routes>
  );
}

export default App;
