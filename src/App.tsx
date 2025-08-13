import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import { useAuth } from './contexts/AuthContext';
import { isSupabaseConfigured } from './lib/supabase';
import { Layout } from './components/Layout';
import { LoginForm } from './components/LoginForm';
import { Home } from './pages/Home';
import { Vocabulary } from './pages/Vocabulary';
import { Collection } from './pages/Collection';
import { Settings } from './pages/Settings';

function AppContent() {
  const { user, loading } = useAuth();

  // If Supabase is not configured, skip authentication
  if (!isSupabaseConfigured) {
    return (
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/vocabulary" element={<Vocabulary />} />
          <Route path="/collection" element={<Collection />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/vocabulary" element={<Vocabulary />} />
        <Route path="/collection" element={<Collection />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Router>
          <AppContent />
        </Router>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
