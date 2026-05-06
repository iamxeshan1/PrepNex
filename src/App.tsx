import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { collection, getDocs, query, where, addDoc, setDoc, doc, limit } from 'firebase/firestore';
import { db } from './lib/firebase';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ExamDetail from './pages/ExamDetail';
import Test from './pages/Test';
import Result from './pages/Result';
import AdminMockTestBank from './pages/Admin/MockTestBank';
import AdminDashboard from './pages/Admin/Dashboard';
import AdminAgencies from './pages/Admin/Agencies';
import AdminExams from './pages/Admin/Exams';
import AdminTests from './pages/Admin/Tests';
import AdminQuestions from './pages/Admin/Questions';
import AdminSettings from './pages/Admin/Settings';
import AdminNotices from './pages/Admin/Notices';
import AdminThoughts from './pages/Admin/Thoughts';
import AdminSubjects from './pages/Admin/Subjects';
import AdminRevenue from './pages/Admin/Revenue';
import AdminPremiumPlan from './pages/Admin/PremiumPlan';
import AdminUsers from './pages/Admin/Users';
import AdminCoupons from './pages/Admin/Coupons';
import AdminSubscriptions from './pages/Admin/Subscriptions';
import AdminLiveTests from './pages/Admin/LiveTests';
import AdminHelpdesk from './pages/Admin/Helpdesk';
import AdminActivityLog from './pages/Admin/ActivityLog';
import AdminExamManagement from './pages/Admin/ExamManagement';
import AdminTestManagement from './pages/Admin/TestManagement';
import AdminManageLiveTest from './pages/Admin/ManageLiveTest';
import AdminEditLiveTest from './pages/Admin/EditLiveTest';
import AdminReviews from './pages/Admin/Reviews';
import AdminStudyMaterial from './pages/Admin/StudyMaterial';
import AdminPushNotifications from './pages/Admin/PushNotifications';
import Premium from './pages/Premium';
import Subjects from './pages/Subjects';
import Contact from './pages/Contact';
import StudyMaterial from './pages/StudyMaterial';
import PrivacyPolicy from './pages/PrivacyPolicy';
import LiveTestDetail from './pages/LiveTestDetail';
import Helpdesk from './pages/Helpdesk';
import Exams from './pages/Exams';

import About from './pages/About';
import ResetPassword from './pages/ResetPassword';
import RequestReset from './pages/RequestReset';
import ScrollToTop from './components/ScrollToTop';
import ProfileCompletionDialog from './components/ProfileCompletionDialog';
import { SessionTimeoutManager } from './components/SessionTimeoutManager';
import { NotificationManager } from './components/NotificationManager';
import { InstallPrompt } from './components/InstallPrompt';
import { SplashScreen } from './components/SplashScreen';
import { AnimatePresence } from 'motion/react';

const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) => {
  const { user, profile, loading, isAdmin } = useAuth();
  
  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" />;
  
  return <>{children}</>;
};

export function AppContent() {
  const [showSplash, setShowSplash] = React.useState(window.location.pathname === '/');

  React.useEffect(() => {
    if (!showSplash) return;
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1000); 
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        {showSplash && <SplashScreen key="splash" />}
      </AnimatePresence>
      <SessionTimeoutManager />
      <NotificationManager />
      <InstallPrompt />
      <ProfileCompletionDialog />
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/request-reset" element={<RequestReset />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/exams" element={<Exams />} />
          <Route path="/subjects" element={<Subjects />} />
          <Route path="/premium" element={<Premium />} />
          <Route path="/about" element={<About />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/exam/:examId" element={<ExamDetail />} />
          <Route path="/subject-tests/:subjectId" element={<Subjects />} />
          
          <Route path="/test/:testId" element={
            <ProtectedRoute>
              <Test />
            </ProtectedRoute>
          } />
          
          <Route path="/result/:resultId" element={
            <ProtectedRoute>
              <Result />
            </ProtectedRoute>
          } />
          <Route path="/live-test/:id" element={
            <LiveTestDetail />
          } />
          
          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/premium" element={
            <ProtectedRoute adminOnly>
              <AdminPremiumPlan />
            </ProtectedRoute>
          } />
          <Route path="/admin/settings" element={
            <ProtectedRoute adminOnly>
              <AdminSettings />
            </ProtectedRoute>
          } />
          <Route path="/admin/notices" element={
            <ProtectedRoute adminOnly>
              <AdminNotices />
            </ProtectedRoute>
          } />
          <Route path="/admin/thoughts" element={
            <ProtectedRoute adminOnly>
              <AdminThoughts />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute adminOnly>
              <AdminUsers />
            </ProtectedRoute>
          } />
          <Route path="/admin/coupons" element={
            <ProtectedRoute adminOnly>
              <AdminCoupons />
            </ProtectedRoute>
          } />
          <Route path="/admin/subscriptions" element={
            <ProtectedRoute adminOnly>
              <AdminSubscriptions />
            </ProtectedRoute>
          } />
          <Route path="/admin/revenue" element={
            <ProtectedRoute adminOnly>
              <AdminRevenue />
            </ProtectedRoute>
          } />
          <Route path="/admin/live-tests" element={
            <ProtectedRoute adminOnly>
              <AdminLiveTests />
            </ProtectedRoute>
          } />
          <Route path="/admin/subjects" element={
            <ProtectedRoute adminOnly>
              <AdminSubjects />
            </ProtectedRoute>
          } />
          <Route path="/admin/agencies" element={
            <ProtectedRoute adminOnly>
              <AdminAgencies />
            </ProtectedRoute>
          } />
          <Route path="/admin/exams" element={
            <ProtectedRoute adminOnly>
              <AdminExams />
            </ProtectedRoute>
          } />
          <Route path="/admin/exam/management/:examId" element={
            <ProtectedRoute adminOnly>
              <AdminExamManagement />
            </ProtectedRoute>
          } />
          <Route path="/admin/test/management/:testId" element={
            <ProtectedRoute adminOnly>
              <AdminTestManagement />
            </ProtectedRoute>
          } />
          <Route path="/admin/live-test/manage/:testId" element={
            <ProtectedRoute adminOnly>
              <AdminManageLiveTest />
            </ProtectedRoute>
          } />
          <Route path="/admin/live-test/edit/:testId" element={
            <ProtectedRoute adminOnly>
              <AdminEditLiveTest />
            </ProtectedRoute>
          } />
          <Route path="/admin/mock-tests" element={
            <ProtectedRoute adminOnly>
              <AdminMockTestBank />
            </ProtectedRoute>
          } />
          <Route path="/admin/tests/:examId" element={
            <ProtectedRoute adminOnly>
              <AdminTests />
            </ProtectedRoute>
          } />
          <Route path="/admin/subject-tests/:subjectId" element={
            <ProtectedRoute adminOnly>
              <AdminTests />
            </ProtectedRoute>
          } />
          <Route path="/admin/questions/:testId" element={
            <ProtectedRoute adminOnly>
              <AdminQuestions />
            </ProtectedRoute>
          } />
          
          <Route path="/helpdesk" element={
            <ProtectedRoute>
              <Helpdesk />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/helpdesk" element={
            <ProtectedRoute adminOnly>
              <AdminHelpdesk />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/notifications" element={
            <ProtectedRoute adminOnly>
              <AdminPushNotifications />
            </ProtectedRoute>
          } />

          <Route path="/admin/activity" element={
            <ProtectedRoute adminOnly>
              <AdminActivityLog />
            </ProtectedRoute>
          } />

          <Route path="/admin/reviews" element={
            <ProtectedRoute adminOnly>
              <AdminReviews />
            </ProtectedRoute>
          } />

          <Route path="/admin/study-material" element={
            <ProtectedRoute adminOnly>
              <AdminStudyMaterial />
            </ProtectedRoute>
          } />

          <Route path="/study-material" element={<StudyMaterial />} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
