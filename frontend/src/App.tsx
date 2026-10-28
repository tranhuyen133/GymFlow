/**
 * CHỦ FILE: Tùng (Lê Thanh Tùng)
 * TASK: SCRUM-139 · HẠN: 28/10/2026
 * CẦN LÀM: Khai báo đủ route như quy tắc 8. Bọc RequireRole theo vai trò (mục 10.1).
 * Chỉ chủ file được sửa. Cần thay đổi thì nhắn chủ file.
 */

import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import RequireRole from './auth/RequireRole';
import { useAuth } from './auth/AuthContext';

// Public pages
import Landing from './pages/public/Landing';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import ForgotPassword from './pages/public/ForgotPassword';
import ResetPassword from './pages/public/ResetPassword';
import Knowledge from './pages/public/Knowledge';
import ArticleDetail from './pages/public/ArticleDetail';

// Shared pages
import Policy from './pages/shared/Policy';
import Forbidden from './pages/shared/Forbidden';
import NotFound from './pages/shared/NotFound';
import Profile from './pages/shared/Profile';

// Layout
import AppLayout from './components/layout/AppLayout';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import Trainers from './pages/admin/Trainers';
import Plans from './pages/admin/Plans';
import Subscriptions from './pages/admin/Subscriptions';
import Reports from './pages/admin/Reports';
import Accounts from './pages/admin/Accounts';
import AuditLog from './pages/admin/AuditLog';

// Trainer pages
import TrainerDashboard from './pages/trainer/TrainerDashboard';
import ScheduleGrid from './pages/trainer/ScheduleGrid';
import Members from './pages/trainer/Members';
import MemberDetail from './pages/trainer/MemberDetail';
import WorkoutPlanEditor from './pages/trainer/WorkoutPlanEditor';
import ExerciseLibrary from './pages/trainer/ExerciseLibrary';
import ArticleEditor from './pages/trainer/ArticleEditor';

// Member pages
import MemberDashboard from './pages/member/MemberDashboard';
import MySchedule from './pages/member/MySchedule';
import WorkoutToday from './pages/member/WorkoutToday';
import Progress from './pages/member/Progress';
import MySubscription from './pages/member/MySubscription';

function RoleHome() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const home =
    user.role === 'ADMIN'
      ? '/app/admin'
      : user.role === 'TRAINER'
        ? '/app/trainer'
        : '/app/member';
  return <Navigate to={home} replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/knowledge" element={<Knowledge />} />
      <Route path="/knowledge/:slug" element={<ArticleDetail />} />
      <Route path="/policy" element={<Policy />} />
      <Route path="/403" element={<Forbidden />} />

      {/* App routes: bắt buộc đăng nhập, mỗi nhóm chặn theo vai trò */}
      <Route
        path="/app"
        element={
          <RequireRole>
            <AppLayout />
          </RequireRole>
        }
      >
        <Route index element={<RoleHome />} />
        <Route path="profile" element={<Profile />} />

        <Route
          path="admin"
          element={
            <RequireRole role="ADMIN">
              <Outlet />
            </RequireRole>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="trainers" element={<Trainers />} />
          <Route path="plans" element={<Plans />} />
          <Route path="subscriptions" element={<Subscriptions />} />
          <Route path="reports" element={<Reports />} />
          <Route path="accounts" element={<Accounts />} />
          <Route path="audit-logs" element={<AuditLog />} />
        </Route>

        <Route
          path="trainer"
          element={
            <RequireRole role="TRAINER">
              <Outlet />
            </RequireRole>
          }
        >
          <Route index element={<TrainerDashboard />} />
          <Route path="schedule" element={<ScheduleGrid />} />
          <Route path="members" element={<Members />} />
          <Route path="members/:id" element={<MemberDetail />} />
          <Route path="plans/:id" element={<WorkoutPlanEditor />} />
          <Route path="exercises" element={<ExerciseLibrary />} />
          <Route path="articles" element={<ArticleEditor />} />
        </Route>

        <Route
          path="member"
          element={
            <RequireRole role="MEMBER">
              <Outlet />
            </RequireRole>
          }
        >
          <Route index element={<MemberDashboard />} />
          <Route path="schedule" element={<MySchedule />} />
          <Route path="today" element={<WorkoutToday />} />
          <Route path="progress" element={<Progress />} />
          <Route path="subscription" element={<MySubscription />} />
        </Route>
      </Route>

      {/* Catch-all route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
