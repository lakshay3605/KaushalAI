import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';
import Footer from './components/common/Footer';
import Toast from './components/Toast';
import SmartKioskModal from './components/SmartKioskModal';
import SihEvaluationTourModal from './components/SihEvaluationTourModal';

// Pages
import LandingPage from './pages/LandingPage';
import TraineeDashboard from './pages/TraineeDashboard';
import LmsMyLearning from './pages/LmsMyLearning';
import AssessmentsPage from './pages/AssessmentsPage';
import CertificatesPage from './pages/CertificatesPage';
import AiCareerGuidancePage from './pages/AiCareerGuidancePage';
import JobOpportunitiesPage from './pages/JobOpportunitiesPage';
import ProfilePage from './pages/ProfilePage';
import RecruiterPortalPage from './pages/RecruiterPortalPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import KioskOperatorPortalPage from './pages/KioskOperatorPortalPage';
import AboutPage from './pages/AboutPage';
import ProgrammesPage from './pages/ProgrammesPage';
import OpportunitiesPage from './pages/OpportunitiesPage';
import ResourcesPage from './pages/ResourcesPage';
import PublicCertificateVerifier from './pages/PublicCertificateVerifier';

function PortalLayout() {
  const location = useLocation();
  const { isOffline, setIsOffline, pendingSyncCount, handleSyncOffline, setIsKioskOpen, setIsTourOpen } = useApp();
  const isLanding = location.pathname === '/';
  const isVerify = location.pathname.startsWith('/verify');

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] font-sans text-slate-900">
      <Header />

      {isLanding ? (
        <main className="flex-1">
          <Outlet />
        </main>
      ) : isVerify ? (
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      ) : (
        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 xl:px-10 py-6 max-w-[1536px] w-full mx-auto">
          <Outlet />
        </main>
      )}

      <Footer />
    </div>
  );
}

// Evaluation Tour Handler component inside App
function TourHandler() {
  const { isTourOpen, setIsTourOpen, switchRole, setIsKioskOpen, setIsOffline, showToast } = useApp();
  const navigate = useNavigate();

  const handleTourStepSelect = (step) => {
    if (step.verifyCert) {
      navigate(`/verify/${step.verifyCert}`);
      return;
    }

    if (step.toggleOffline) {
      setIsOffline(true);
      showToast("Edge offline resilience enabled. Network severed.", "info");
      navigate('/kiosk');
      return;
    }

    if (step.role) {
      if (step.role.includes('ramesh')) {
        switchRole('TRAINEE');
        if (step.tab === 'courses') navigate('/learning');
        else if (step.tab === 'certificates') navigate('/certificates');
        else if (step.tab === 'ai') navigate('/career');
        else navigate('/dashboard');
      } else if (step.role.includes('recruiter')) {
        switchRole('RECRUITER');
        navigate('/recruiter');
      } else if (step.role.includes('admin')) {
        switchRole('ADMIN');
        navigate('/admin');
      }
    }

    if (step.openKiosk) {
      setIsKioskOpen(true);
    }
  };

  return (
    <SihEvaluationTourModal
      isOpen={isTourOpen}
      onClose={() => setIsTourOpen(false)}
      onSelectStep={handleTourStepSelect}
    />
  );
}

// Kiosk Handler Component
function KioskHandler() {
  const { isKioskOpen, setIsKioskOpen, currentUser, isOffline, refreshSyncCount, showToast } = useApp();

  return (
    <SmartKioskModal
      isOpen={isKioskOpen}
      onClose={() => setIsKioskOpen(false)}
      currentTrainee={currentUser?.role === 'TRAINEE' ? currentUser : null}
      isOffline={isOffline}
      onAttendanceEventRecorded={() => {
        refreshSyncCount();
        if (isOffline) {
          showToast('Biometric attendance buffered in Edge NVRAM', 'info');
        } else {
          showToast('✓ Attendance confirmed on National Cooperative Server', 'success');
        }
      }}
    />
  );
}

// Master Toast Handler
function ToastHandler() {
  const { toast, setToast } = useApp();
  return <Toast toast={toast} onClose={() => setToast(null)} />;
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        
        <Routes>
          <Route path="/" element={<PortalLayout />}>
            {/* Page 1: Public Landing Page & Info Pages */}
            <Route index element={<LandingPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="programmes" element={<ProgrammesPage />} />
            <Route path="opportunities" element={<OpportunitiesPage />} />
            <Route path="resources" element={<ResourcesPage />} />

            {/* Page 2: Trainee Dashboard */}
            <Route path="dashboard" element={<TraineeDashboard />} />

            {/* Page 3: LMS / My Learning */}
            <Route path="learning" element={<LmsMyLearning />} />
            <Route path="learning/:courseId" element={<LmsMyLearning />} />

            {/* Page 4: Assessments & Exams */}
            <Route path="assessments" element={<AssessmentsPage />} />
            <Route path="assessments/:assessmentId" element={<AssessmentsPage />} />
            <Route path="assessments/:assessmentId/result" element={<AssessmentsPage />} />

            {/* Page 5: Certificates & Skill Profile */}
            <Route path="certificates" element={<CertificatesPage />} />
            <Route path="certificates/:certificateId" element={<CertificatesPage />} />

            {/* Page 6: AI Career Guidance */}
            <Route path="career" element={<AiCareerGuidancePage />} />

            {/* Trainee Profile */}
            <Route path="profile" element={<ProfilePage />} />

            {/* Page 7: Recruiter / Employment Portal */}
            <Route path="jobs" element={<RecruiterPortalPage />} />
            <Route path="jobs/candidates/:candidateId" element={<RecruiterPortalPage />} />
            <Route path="recruiter" element={<RecruiterPortalPage />} />
            <Route path="recruiter/*" element={<RecruiterPortalPage />} />

            {/* Page 8: Admin / NCCT Dashboard */}
            <Route path="admin" element={<AdminDashboardPage />} />
            <Route path="admin/*" element={<AdminDashboardPage />} />

            {/* Page 9: Kiosk / Centre Operator Portal */}
            <Route path="kiosk" element={<KioskOperatorPortalPage />} />
            <Route path="kiosk/*" element={<KioskOperatorPortalPage />} />

            {/* Public Zero-Login Verification */}
            <Route path="verify" element={<PublicCertificateVerifier />} />
            <Route path="verify/:certificateId" element={<PublicCertificateVerifier />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>

        {/* Global Modals & Notifications */}
        <TourHandler />
        <KioskHandler />
        <ToastHandler />

      </BrowserRouter>
    </AppProvider>
  );
}
