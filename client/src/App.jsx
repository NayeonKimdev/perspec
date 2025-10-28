import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProfileForm from './pages/ProfileForm';
import ProfileView from './pages/ProfileView';
import StartAnalysis from './pages/StartAnalysis';
import AnalysisResult from './pages/AnalysisResult';
import AnalysisHistory from './pages/AnalysisHistory';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  // 로그인한 사용자가 로그인/회원가입 페이지에 접근하면 대시보드로 리다이렉트
  const isAuthenticated = () => {
    return localStorage.getItem('token') !== null;
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route 
            path="/login" 
            element={
              isAuthenticated() ? <Navigate to="/dashboard" replace /> : <Login />
            } 
          />
          <Route 
            path="/register" 
            element={
              isAuthenticated() ? <Navigate to="/dashboard" replace /> : <Register />
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <ProfileForm />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile-view" 
            element={
              <ProtectedRoute>
                <ProfileView />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/start-analysis" 
            element={
              <ProtectedRoute>
                <StartAnalysis />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/analysis/:id" 
            element={
              <ProtectedRoute>
                <AnalysisResult />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/analysis-history" 
            element={
              <ProtectedRoute>
                <AnalysisHistory />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;