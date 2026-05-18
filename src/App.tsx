import React, { useEffect } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { collection, getDocs, query, where, addDoc, setDoc, doc, limit } from 'firebase/firestore';
import { db } from './lib/firebase';

// Pages
const Home = React.lazy(() => import('./pages/Home'));
const Login = React.lazy(() => import('./pages/Login'));
const Signup = React.lazy(() => import('./pages/Signup'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const ExamDetail = React.lazy(() => import('./pages/ExamDetail'));
const Test = React.lazy(() => import('./pages/Test'));
const Result = React.lazy(() => import('./pages/Result'));
const JobAlerts = React.lazy(() => import('./pages/JobAlerts'));
const PYQs = React.lazy(() => import('./pages/PYQs'));
const Forum = React.lazy(() => import('./pages/Forum'));
const ForumThread = React.lazy(() => import('./pages/ForumThread'));
const AdminMockTestBank = React.lazy(() => import('./pages/Admin/MockTestBank'));
const AdminDashboard = React.lazy(() => import('./pages/Admin/Dashboard'));
const AdminAgencies = React.lazy(() => import('./pages/Admin/Agencies'));
const AdminExams = React.lazy(() => import('./pages/Admin/Exams'));
const AdminTests = React.lazy(() => import('./pages/Admin/Tests'));
const AdminQuestions = React.lazy(() => import('./pages/Admin/Questions'));
const AdminSettings = React.lazy(() => import('./pages/Admin/Settings'));
const AdminNotices = React.lazy(() => import('./pages/Admin/Notices'));
const AdminThoughts = React.lazy(() => import('./pages/Admin/Thoughts'));
const AdminSubjects = React.lazy(() => import('./pages/Admin/Subjects'));
const AdminRevenue = React.lazy(() => import('./pages/Admin/Revenue'));
const AdminPremiumPlan = React.lazy(() => import('./pages/Admin/PremiumPlan'));
const AdminUsers = React.lazy(() => import('./pages/Admin/Users'));
const AdminCoupons = React.lazy(() => import('./pages/Admin/Coupons'));
const AdminJobAlerts = React.lazy(() => import('./pages/Admin/JobAlerts'));
const AdminForum = React.lazy(() => import('./pages/Admin/Forum'));
const AdminPYQs = React.lazy(() => import('./pages/Admin/PYQs'));
const AdminSubscriptions = React.lazy(() => import('./pages/Admin/Subscriptions'));
const AdminLiveTests = React.lazy(() => import('./pages/Admin/LiveTests'));
const AdminHelpdesk = React.lazy(() => import('./pages/Admin/Helpdesk'));
const AdminActivityLog = React.lazy(() => import('./pages/Admin/ActivityLog'));
const AdminUserPerformance = React.lazy(() => import('./pages/Admin/UserPerformance'));
const AdminExamManagement = React.lazy(() => import('./pages/Admin/ExamManagement'));
const AdminTestManagement = React.lazy(() => import('./pages/Admin/TestManagement'));
const AdminManageLiveTest = React.lazy(() => import('./pages/Admin/ManageLiveTest'));
const AdminEditLiveTest = React.lazy(() => import('./pages/Admin/EditLiveTest'));
const AdminReviews = React.lazy(() => import('./pages/Admin/Reviews'));
const AdminStudyMaterial = React.lazy(() => import('./pages/Admin/StudyMaterial'));
const AdminPushNotifications = React.lazy(() => import('./pages/Admin/PushNotifications'));
const Premium = React.lazy(() => import('./pages/Premium'));
const Subjects = React.lazy(() => import('./pages/Subjects'));
const Contact = React.lazy(() => import('./pages/Contact'));
const StudyMaterial = React.lazy(() => import('./pages/StudyMaterial'));
const PrivacyPolicy = React.lazy(() => import('./pages/PrivacyPolicy'));
const LiveTestDetail = React.lazy(() => import('./pages/LiveTestDetail'));
const Helpdesk = React.lazy(() => import('./pages/Helpdesk'));
const Exams = React.lazy(() => import('./pages/Exams'));
const Performance = React.lazy(() => import('./pages/Performance'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Transactions = React.lazy(() => import('./pages/Transactions'));
const About = React.lazy(() => import('./pages/About'));
const Announcements = React.lazy(() => import('./pages/Announcements'));
const MySubscriptions = React.lazy(() => import('./pages/MySubscriptions'));
const LiveTests = React.lazy(() => import('./pages/LiveTests'));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword'));
const RequestReset = React.lazy(() => import('./pages/RequestReset'));
import ScrollToTop from './components/ScrollToTop';
import { SessionTimeoutManager } from './components/SessionTimeoutManager';
import { NotificationManager } from './components/NotificationManager';
import { SplashScreen } from './components/SplashScreen';
import { AnimatePresence } from 'motion/react';
import { Toaster } from 'react-hot-toast';

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
      <Toaster />
      <AnimatePresence mode="wait">
        {showSplash && <SplashScreen key="splash" />}
      </AnimatePresence>
      <SessionTimeoutManager />
      <NotificationManager />
      <Router>
        <ScrollToTop />
        <React.Suspense fallback={<div className="flex h-screen items-center justify-center min-h-[50vh]"><div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div></div>}>
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
          <Route path="/performance" element={<ProtectedRoute><Performance /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
          <Route path="/my-subscriptions" element={<ProtectedRoute><MySubscriptions /></ProtectedRoute>} />
          <Route path="/subjects" element={<Subjects />} />
          <Route path="/premium" element={<Premium />} />
          <Route path="/about" element={<About />} />
          <Route path="/announcements" element={<Announcements />} />
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
          <Route path="/live-tests" element={<LiveTests />} />
          
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
          <Route path="/admin/job-alerts" element={
            <ProtectedRoute adminOnly>
              <AdminJobAlerts />
            </ProtectedRoute>
          } />
          <Route path="/admin/pyqs" element={
            <ProtectedRoute adminOnly>
              <AdminPYQs />
            </ProtectedRoute>
          } />
          <Route path="/admin/forum" element={
            <ProtectedRoute adminOnly>
              <AdminForum />
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

          <Route path="/admin/users/:userId/performance" element={
            <ProtectedRoute adminOnly>
              <AdminUserPerformance />
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
          <Route path="/job-alerts" element={<JobAlerts />} />
          <Route path="/pyqs" element={<PYQs />} />
          <Route path="/forum" element={<Forum />} />
          <Route path="/forum/:id" element={<ForumThread />} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        </React.Suspense>
      </Router>
    </>
  );
}

export default function App() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "PrepNext",
    "alternateName": ["Prep Next", "Prepnext.in", "Prepnext"],
    "url": "https://www.prepnext.in/",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://www.prepnext.in/exams?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <HelmetProvider>
      <Helmet>
        <title>PrepNext - Mock Tests & Study Material</title>
        <meta property="og:site_name" content="PrepNext" />
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      </Helmet>
      <SettingsProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </SettingsProvider>
    </HelmetProvider>
  );
}
