import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./paginas/Login";
import Lateral from "./layouts/Lateral";
import Principal from "./paginas/Principal";
import Productos from "./paginas/Productos";
import Clientes from "./paginas/Clientes";
import Almacen from "./paginas/Almacen";
import Venta from "./paginas/Venta";
import Cotizaciones from "./paginas/Cotizaciones";
import Reportes from "./paginas/Reportes";
import RegistroUsuarios from "./paginas/RegistroUsuarios";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Login />} />
          <Route path="/layouts" element={
            <ProtectedRoute>
              <Lateral />
            </ProtectedRoute>
          }>
            <Route path="principal" element={
              <ProtectedRoute requireRole="admin">
                <Principal />
              </ProtectedRoute>
            } />
            <Route path="venta" element={
              <ProtectedRoute requireRole={["admin", "vendedor"]}>
                <Venta />
              </ProtectedRoute>
            } />
            <Route path="producto" element={
              <ProtectedRoute requireRole={["admin", "vendedor"]}>
                <Productos />
              </ProtectedRoute>
            } />
            <Route path="cliente" element={
              <ProtectedRoute requireRole="admin">
                <Clientes />
              </ProtectedRoute>
            } />
            <Route path="almacen" element={
              <ProtectedRoute requireRole={["admin", "vendedor"]}>
                <Almacen />
              </ProtectedRoute>
            } />
            <Route path="cotizaciones" element={
              <ProtectedRoute requireRole={["admin", "vendedor"]}>
                <Cotizaciones />
              </ProtectedRoute>
            } />
            <Route path="reportes" element={
              <ProtectedRoute requireRole={["admin"]}>
                <Reportes />
              </ProtectedRoute>
            } />
            <Route path="usuarios" element={
              <ProtectedRoute requireRole="admin">
                <RegistroUsuarios />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
