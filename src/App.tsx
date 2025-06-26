import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import LoginPage from './components/LoginPage';
import SectionSelector from './components/SectionSelector';
import Dashboard from './components/Dashboard';
import SectionLeaderboard from './components/SectionLeaderboard';
import AdminPanel from './components/AdminPanel';
import ProtectedRoute from './components/ProtectedRoute';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<LoginPage />} />
      </Routes>
    );
  }

  // If user is logged in but hasn't selected a section yet
  if (user.section === 'unassigned') {
    return (
      <Routes>
        <Route path="*" element={<SectionSelector />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="section" element={<SectionLeaderboard />} />
        <Route 
          path="admin" 
          element={
            <ProtectedRoute requireAdmin>
              <AdminPanel />
            </ProtectedRoute>
          } 
        />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

function App() {
  // Add error boundary
  const [hasError, setHasError] = React.useState(false);

  // Check if we're running in an iframe
  const isEmbedded = React.useMemo(() => {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true; // If we can't access window.top, we're likely in an iframe
    }
  }, []);

  // Add message listener for parent-child communication
  React.useEffect(() => {
    if (isEmbedded) {
      const handleMessage = (event: MessageEvent) => {
        // Only accept messages from trusted origins
        const trustedOrigins = [
          'https://graysonhuey.github.io/leaderboards', // Replace with your main site's domain
          'http://localhost:3000', // For local development
          'http://localhost:5173', // For Vite dev server
        ];

        if (!trustedOrigins.includes(event.origin)) {
          return;
        }

        // Handle different message types
        switch (event.data.type) {
          case 'RESIZE_REQUEST':
            // Send current height to parent
            const height = document.documentElement.scrollHeight;
            event.source?.postMessage({
              type: 'RESIZE_RESPONSE',
              height: height
            }, event.origin);
            break;
          
          case 'THEME_CHANGE':
            // Handle theme changes from parent if needed
            document.documentElement.setAttribute('data-theme', event.data.theme);
            break;
        }
      };

      window.addEventListener('message', handleMessage);
      
      // Send initial height to parent
      const sendInitialHeight = () => {
        const height = document.documentElement.scrollHeight;
        window.parent.postMessage({
          type: 'IFRAME_READY',
          height: height
        }, '*');
      };

      // Send height after a short delay to ensure content is loaded
      setTimeout(sendInitialHeight, 100);

      return () => window.removeEventListener('message', handleMessage);
    }
  }, [isEmbedded]);

  // Monitor height changes and notify parent
  React.useEffect(() => {
    if (!isEmbedded) return;

    const resizeObserver = new ResizeObserver(() => {
      const height = document.documentElement.scrollHeight;
      window.parent.postMessage({
        type: 'HEIGHT_CHANGE',
        height: height
      }, '*');
    });

    resizeObserver.observe(document.body);

    return () => resizeObserver.disconnect();
  }, [isEmbedded]);

  React.useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('Application error:', error);
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Something went wrong</h1>
          <p className="text-white/70 mb-4">Please check the browser console for more details.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  // Adjust container classes based on embedding context
  const containerClass = isEmbedded 
    ? "min-h-fit" // Don't force full height when embedded
    : "min-h-screen";

  return (
    <div className={containerClass}>
      <Router basename="/leaderboards">
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </div>
  );
}

export default App;