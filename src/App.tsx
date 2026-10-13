import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { api } from './services/api';
import { SystemStatus } from './types/project';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Pages
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailsPage } from './pages/ProjectDetailsPage';
import { AnalysisPage } from './pages/AnalysisPage';
import { DataImportPage } from './pages/DataImportPage';
import { ReportsPage } from './pages/ReportsPage';
import { OfficialSourcesPage } from './pages/OfficialSourcesPage';
import { AboutPage } from './pages/AboutPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

interface NavigationState {
  route: string;
  params?: any;
}

const MainApp: React.FC = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [navState, setNavState] = useState<NavigationState>(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      const [route, queryStr] = hash.split('?');
      const params = queryStr ? Object.fromEntries(new URLSearchParams(queryStr)) : {};
      return { route: route || 'home', params };
    }
    return { route: 'home' };
  });

  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);

  // Sync route changes to window history and hash
  const navigate = (route: string, params?: any) => {
    setNavState({ route, params });
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    window.location.hash = `${route}${query}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle browser back/forward buttons
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        const [route, queryStr] = hash.split('?');
        const params = queryStr ? Object.fromEntries(new URLSearchParams(queryStr)) : {};
        setNavState({ route: route || 'home', params });
      } else {
        setNavState({ route: 'home' });
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Fetch system status (database, SMTP, Gemini)
  useEffect(() => {
    api
      .getSystemStatus()
      .then(setSystemStatus)
      .catch((err) => {
        console.warn('Could not retrieve system status:', err);
      });
  }, []);

  // Render current active page
  const renderPage = () => {
    const { route, params } = navState;

    // Protected Route Enforcement
    if (route === 'dashboard' && !isAuthenticated && !authLoading) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-16 px-4">
          <div className="max-w-md mx-auto p-6 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Authentication Required
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Please sign in or create an auditor account to access the audit dashboard and records repository.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => navigate('login')}
                className="py-2 text-xs font-semibold rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('register')}
                className="py-2 text-xs font-semibold rounded-md bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white cursor-pointer"
              >
                Register
              </button>
            </div>
          </div>
        </div>
      );
    }

    switch (route) {
      case 'home':
        return <LandingPage navigate={navigate} />;
      case 'dashboard':
        return <DashboardPage navigate={navigate} />;
      case 'projects':
        return <ProjectsPage navigate={navigate} />;
      case 'project-details':
        return (
          <ProjectDetailsPage
            projectId={params?.projectId || 'MPLAD-2023-UP-0418'}
            navigate={navigate}
          />
        );
      case 'analysis':
        return (
          <AnalysisPage
            projectId={params?.projectId || 'MPLAD-2023-UP-0418'}
            navigate={navigate}
          />
        );
      case 'data-import':
        return <DataImportPage navigate={navigate} />;
      case 'reports':
        return <ReportsPage navigate={navigate} />;
      case 'official-sources':
        return <OfficialSourcesPage navigate={navigate} />;
      case 'about':
        return <AboutPage navigate={navigate} />;
      case 'login':
        return <LoginPage navigate={navigate} />;
      case 'register':
        return <RegisterPage navigate={navigate} />;
      default:
        return <LandingPage navigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-sans antialiased text-slate-900 dark:text-slate-100 transition-colors">
      {/* Main Header / Navigation */}
      <Navbar currentRoute={navState.route} navigate={navigate} />

      {/* Page Content */}
      <main className="flex-1">{renderPage()}</main>

      {/* Shared Footer */}
      <Footer navigate={navigate} />
    </div>
  );
};

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
