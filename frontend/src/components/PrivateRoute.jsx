import React from "react";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ isAuthenticated, isSuperuser, children }) => {
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  // Cloner l'élément enfant en passant isSuperuser comme prop
  return React.cloneElement(children, { isSuperuser });
};

export default PrivateRoute;