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
import Agencies from './pages/Agencies';
import AgencyExams from './pages/AgencyExams';
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
import AdminPremiumPlan from './pages/Admin/PremiumPlan';
import AdminUsers from './pages/Admin/Users';
import AdminCoupons from './pages/Admin/Coupons';
import AdminSubscriptions from './pages/Admin/Subscriptions';
import AdminLiveTests from './pages/Admin/LiveTests';
import AdminHelpdesk from './pages/Admin/Helpdesk';
import AdminActivityLog from './pages/Admin/ActivityLog';
import AdminMarketing from './pages/Admin/Marketing';
import AdminReviews from './pages/Admin/Reviews';
import AdminStudyMaterial from './pages/Admin/StudyMaterial';
import Premium from './pages/Premium';
import Subjects from './pages/Subjects';
import Contact from './pages/Contact';
import StudyMaterial from './pages/StudyMaterial';
import PrivacyPolicy from './pages/PrivacyPolicy';
import LiveTestDetail from './pages/LiveTestDetail';
import Helpdesk from './pages/Helpdesk';

import About from './pages/About';
import ResetPassword from './pages/ResetPassword';
import RequestReset from './pages/RequestReset';
import ScrollToTop from './components/ScrollToTop';
import ProfileCompletionDialog from './components/ProfileCompletionDialog';

const DataSeeder = () => {
  const { user, loading } = useAuth();

  useEffect(() => {
    const seedIfMissing = async () => {
      if (loading || !user) return;
      
      try {
        const examCheck = await getDocs(query(collection(db, 'exams'), where('name', '==', 'JKSSB JKP SI'), limit(1)));
        if (examCheck.empty) {
          console.log("Seeding demo data...");
          // 1. Add Exam
          const examRef = await addDoc(collection(db, 'exams'), {
            name: 'JKSSB JKP SI',
            description: 'Jammu & Kashmir Services Selection Board - Sub Inspector (Police)',
            organization: 'JKSSB',
            isPopular: true,
            createdAt: new Date().toISOString()
          });
          await setDoc(doc(db, 'exams', examRef.id), { id: examRef.id }, { merge: true });

          // 2. Add Test for Exam
          await addDoc(collection(db, 'tests'), {
            examId: examRef.id,
            title: 'JKP SI Full Mock Test 01',
            duration: 120,
            totalMarks: 150,
            isFree: true,
            createdAt: new Date().toISOString()
          });

          // 3. Add Subject
          const subjectRef = await addDoc(collection(db, 'subjects'), {
            name: 'Computer Science',
            icon: 'Cpu',
            description: 'Fundamental concepts, hardware, software, and networking basics for competitive exams.',
            createdAt: new Date().toISOString()
          });
          await setDoc(doc(db, 'subjects', subjectRef.id), { id: subjectRef.id }, { merge: true });

          // 4. Add Test for Subject
          await addDoc(collection(db, 'tests'), {
            subjectId: subjectRef.id,
            title: 'Basic Computing & Hardware Mock',
            duration: 30,
            totalMarks: 50,
            isFree: true,
            createdAt: new Date().toISOString()
          });
          console.log("Seeding complete.");
        }
      } catch (err) {
        console.error("Auto-seed error:", err);
      }
    };
    seedIfMissing();
  }, [user, loading]);

  return null;
};

const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) => {
  const { user, profile, loading, isAdmin } = useAuth();
  
  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" />;
  
  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <DataSeeder />
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
          
          <Route path="/agencies" element={<Agencies />} />
          <Route path="/agency/:agencyId" element={<AgencyExams />} />
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
          
          <Route path="/admin/marketing" element={
            <ProtectedRoute adminOnly>
              <AdminMarketing />
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
    </AuthProvider>
  );
}
