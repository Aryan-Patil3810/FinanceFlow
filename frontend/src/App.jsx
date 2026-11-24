import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { PreferencesProvider } from "./context/PreferencesContext";

import AppLayout from "./components/layout/AppLayout";

import Dashboard from "./pages/Dashboard";
import Accounts from "./pages/Accounts";
import Transactions from "./pages/Transactions";
import Categories from "./pages/Categories";
import RecurringPayments from "./pages/RecurringPayments";
import Transfers from "./pages/Transfers";
import Register from "./pages/Register";
import PaymentMethods from "./pages/PaymentMethods";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";

import Login from "./pages/Login";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PreferencesProvider>
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected application routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/accounts"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Accounts />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/transactions"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Transactions />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/payment-methods"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <PaymentMethods />
                </AppLayout>

              </ProtectedRoute>
            }
          />

          <Route
            path="/categories"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Categories />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/recurring"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <RecurringPayments />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/transfers"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Transfers />
                </AppLayout>
              </ProtectedRoute>
            }


          />

          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Notifications />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Settings />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </PreferencesProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;