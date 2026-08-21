import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { ProtectedRoute, PublicOnlyRoute } from './components/auth/ProtectedRoute';
import { AptitudeQuestionDetail } from './pages/AptitudeQuestionDetail';
import { DsaQuestionDetail } from './pages/DsaQuestionDetail';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { SqlQuestionDetail } from './pages/SqlQuestionDetail';
import { appRoutes } from './routes/appRoutes';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <Register />
          </PublicOnlyRoute>
        }
      />
      {appRoutes.map((route) => (
        <Route
          key={route.path}
          path={route.path}
          element={
            <ProtectedRoute>
              <AppLayout>
                <route.element />
              </AppLayout>
            </ProtectedRoute>
          }
        />
      ))}
      <Route path="/analytics" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/dsa-practice/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <DsaQuestionDetail />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/sql-practice/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <SqlQuestionDetail />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/aptitude/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <AptitudeQuestionDetail />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
