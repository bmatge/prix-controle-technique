import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { CartePage } from './pages/CartePage';
import { ListePage } from './pages/ListePage';
import { ObservatoirePage } from './pages/ObservatoirePage';

export function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/carte" replace />} />
        <Route path="/carte" element={<CartePage />} />
        <Route path="/liste" element={<ListePage />} />
        <Route path="/observatoire" element={<ObservatoirePage />} />
        <Route path="*" element={<Navigate to="/carte" replace />} />
      </Routes>
    </Layout>
  );
}
