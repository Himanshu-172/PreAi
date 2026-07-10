import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { appRoutes } from './routes/appRoutes';

export default function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        {appRoutes.map((route) => (
          <Route key={route.path} path={route.path} element={<route.element />} />
        ))}
      </Routes>
    </AppLayout>
  );
}
