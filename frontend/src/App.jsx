import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { SocketProvider } from './context/SocketContext';

// Layouts
import { PublicLayout } from './layouts/PublicLayout';
import { MainLayout } from './layouts/MainLayout';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

// Authenticated Pages
import { DashboardPage } from './pages/DashboardPage';
import { CommunityPage } from './pages/CommunityPage';
import { ExploreProjectsPage } from './pages/ExploreProjectsPage';
import { CreateProjectPage } from './pages/CreateProjectPage';
import { ProjectDetailsPage } from './pages/ProjectDetailsPage';
import { ProjectMatchesPage } from './pages/ProjectMatchesPage';
import { ProjectTeamPage } from './pages/ProjectTeamPage';
import { ProjectTasksPage } from './pages/ProjectTasksPage';
import { ProjectMentorPage } from './pages/ProjectMentorPage';
import { InvitationsPage } from './pages/InvitationsPage';
import { MyProjectsPage } from './pages/MyProjectsPage';
import { ProfilePage } from './pages/ProfilePage';
import { EditProfilePage } from './pages/EditProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { SkillNetworkPage } from './pages/SkillNetworkPage';
import { GroupsChatPage } from './pages/GroupsChatPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ExploreHackathonsPage } from './pages/ExploreHackathonsPage';
import { HackathonDetailsPage } from './pages/HackathonDetailsPage';
import { MeetingPage } from './pages/MeetingPage';
import { PwaProvider } from './context/PwaContext';
import { PwaInstallPrompt } from './components/pwa/PwaInstallPrompt';
import { OfflineBanner } from './components/pwa/OfflineBanner';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090B]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <PwaProvider>
      <ToastProvider>
        <AuthProvider>
          <SocketProvider>
            <BrowserRouter>
              <OfflineBanner />
              <Routes>
                {/* Public Layout */}
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                </Route>

                {/* Authenticated Dashboard Layout */}
                <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/hackathons" element={<ExploreHackathonsPage />} />
                  <Route path="/hackathons/:id" element={<HackathonDetailsPage />} />
                  <Route path="/meetings/:roomId" element={<MeetingPage />} />
                  <Route path="/groups" element={<GroupsChatPage />} />
                  <Route path="/groups/:groupId" element={<GroupsChatPage />} />
                  <Route path="/chat" element={<GroupsChatPage />} />
                  <Route path="/community" element={<CommunityPage />} />
                  <Route path="/projects" element={<ExploreProjectsPage />} />
                  <Route path="/network" element={<SkillNetworkPage />} />
                  <Route path="/projects/create" element={<CreateProjectPage />} />
                  <Route path="/projects/:id" element={<ProjectDetailsPage />} />
                  <Route path="/projects/:id/mentor" element={<ProjectMentorPage />} />
                  <Route path="/projects/:id/matches" element={<ProjectMatchesPage />} />
                  <Route path="/projects/:id/team" element={<ProjectTeamPage />} />
                  <Route path="/projects/:id/tasks" element={<ProjectTasksPage />} />
                  <Route path="/invitations" element={<InvitationsPage />} />
                  <Route path="/my-projects" element={<MyProjectsPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/profile/edit" element={<EditProfilePage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              <PwaInstallPrompt />
            </BrowserRouter>
          </SocketProvider>
        </AuthProvider>
      </ToastProvider>
    </PwaProvider>
  );
}
