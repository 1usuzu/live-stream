import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import WelcomePage from './pages/WelcomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StreamerDashboard from './pages/StreamerDashboard';
import ViewerPage from './pages/ViewerPage';
import './assets/style.css';

// --- Matomo Imports ---
import { MatomoProvider, createInstance } from '@datapunt/matomo-tracker-react';
import MatomoTracker from './components/MatomoTracker';

// --- Cấu hình Matomo ---
const instance = createInstance({
  urlBase: process.env.REACT_APP_MATOMO_URL || 'https://streair.matomo.cloud', // Fallback nếu quên set env
  siteId: process.env.REACT_APP_MATOMO_SITE_ID || 1,
  disabled: process.env.NODE_ENV === 'development', // Tắt khi dev để đỡ rác data
  heartBeat: { 
    active: true, 
    seconds: 10 // Đếm thời gian thực (ping mỗi 10s)
  },
  linkTracking: false, // Tắt link tracking tự động để handle thủ công cho SPA chuẩn hơn
});

function App() {
  return (
    <MatomoProvider value={instance}>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <MatomoTracker />
            <div className="App">
              <Navbar />
              <main>
                <Routes>
                  <Route path="/" element={<WelcomePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/stream" element={<ProtectedRoute><StreamerDashboard /></ProtectedRoute>} />
                  <Route path="/watch" element={<ViewerPage />} />
                </Routes>
              </main>
            </div>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </MatomoProvider>
  );
}

export default App;