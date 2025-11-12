import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import { SkeletonDashboard } from './components/Skeleton';

// 코드 스플리팅 - 지연 로딩
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ProfileForm = lazy(() => import('./pages/ProfileForm'));
const ProfileView = lazy(() => import('./pages/ProfileView'));
const StartAnalysis = lazy(() => import('./pages/StartAnalysis'));
const AnalysisResult = lazy(() => import('./pages/AnalysisResult'));
const AnalysisHistory = lazy(() => import('./pages/AnalysisHistory'));
const MediaUpload = lazy(() => import('./pages/MediaUpload'));
const MediaGallery = lazy(() => import('./pages/MediaGallery'));
const ImageAnalysisSummary = lazy(() => import('./pages/ImageAnalysisSummary'));
const DocumentUpload = lazy(() => import('./pages/DocumentUpload'));
const DocumentList = lazy(() => import('./pages/DocumentList'));
const DocumentDetail = lazy(() => import('./pages/DocumentDetail'));
const DocumentAnalysisResult = lazy(() => import('./pages/DocumentAnalysisResult'));
const MBTIEstimation = lazy(() => import('./pages/MBTIEstimation'));
const MBTIResult = lazy(() => import('./pages/MBTIResult'));
const EmotionAnalysis = lazy(() => import('./pages/EmotionAnalysis'));
const ReportGeneration = lazy(() => import('./pages/ReportGeneration'));
const ReportDetail = lazy(() => import('./pages/ReportDetail'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Settings = lazy(() => import('./pages/Settings'));

function App() {
  // 로그인한 사용자가 로그인/회원가입 페이지에 접근하면 대시보드로 리다이렉트
  const isAuthenticated = () => {
    return localStorage.getItem('token') !== null;
  };

  // 로딩 컴포넌트
  const LoadingFallback = () => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <SkeletonDashboard />
    </div>
  );

  return (
    <ThemeProvider>
      <ToastProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <Suspense fallback={<LoadingFallback />}>
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
            path="/verify-email" 
            element={<VerifyEmail />} 
          />
          <Route 
            path="/auth/callback" 
            element={<AuthCallback />} 
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
          <Route 
            path="/upload" 
            element={
              <ProtectedRoute>
                <MediaUpload />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/gallery" 
            element={
              <ProtectedRoute>
                <MediaGallery />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/image-analysis-summary" 
            element={
              <ProtectedRoute>
                <ImageAnalysisSummary />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/document-upload" 
            element={
              <ProtectedRoute>
                <DocumentUpload />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/documents" 
            element={
              <ProtectedRoute>
                <DocumentList />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/documents/:id" 
            element={
              <ProtectedRoute>
                <DocumentDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/documents/:id/analysis" 
            element={
              <ProtectedRoute>
                <DocumentAnalysisResult />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/mbti" 
            element={
              <ProtectedRoute>
                <MBTIEstimation />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/mbti/:id" 
            element={
              <ProtectedRoute>
                <MBTIResult />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/emotion" 
            element={
              <ProtectedRoute>
                <EmotionAnalysis />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reports" 
            element={
              <ProtectedRoute>
                <ReportGeneration />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reports/:id" 
            element={
              <ProtectedRoute>
                <ReportDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/analytics" 
            element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } 
          />
        </Routes>
        </Suspense>
        </div>
      </Router>
    </ToastProvider>
    </ThemeProvider>
  );
}

export default App;