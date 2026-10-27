/**
 * CHỦ FILE: Tùng (Lê Thanh Tùng)
 * TASK: SCRUM-139 · HẠN: 28/10/2026
 * CẦN LÀM: Khai báo đủ route như quy tắc 8. TODO(Tùng): bọc RequireRole theo vai trò (mục 10.1).
 * Chỉ chủ file được sửa. Cần thay đổi thì nhắn chủ file.
 */

import { Routes, Route } from 'react-router-dom';

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

      {/* App routes wrapped in AppLayout */}
      {/* TODO(Tùng): bọc RequireRole theo vai trò (mục 10.1) */}
      <Route path="/app" element={<AppLayout />}>
        <Route path="profile" element={<Profile />} />

        {/* Admin routes */}
        {/* TODO(Tùng): bọc RequireRole role="ADMIN" */}
        <Route path="admin" element={<AdminDashboard />} />
        <Route path="admin/trainers" element={<Trainers />} />
        <Route path="admin/plans" element={<Plans />} />
        <Route path="admin/subscriptions" element={<Subscriptions />} />
        <Route path="admin/reports" element={<Reports />} />
        <Route path="admin/accounts" element={<Accounts />} />
        <Route path="admin/audit-logs" element={<AuditLog />} />

        {/* Trainer routes */}
        {/* TODO(Tùng): bọc RequireRole role="TRAINER" */}
        <Route path="trainer" element={<TrainerDashboard />} />
        <Route path="trainer/schedule" element={<ScheduleGrid />} />
        <Route path="trainer/members" element={<Members />} />
        <Route path="trainer/members/:id" element={<MemberDetail />} />
        <Route path="trainer/plans/:id" element={<WorkoutPlanEditor />} />
        <Route path="trainer/exercises" element={<ExerciseLibrary />} />
        <Route path="trainer/articles" element={<ArticleEditor />} />

        {/* Member routes */}
        {/* TODO(Tùng): bọc RequireRole role="MEMBER" */}
        <Route path="member" element={<MemberDashboard />} />
        <Route path="member/schedule" element={<MySchedule />} />
        <Route path="member/today" element={<WorkoutToday />} />
        <Route path="member/progress" element={<Progress />} />
        <Route path="member/subscription" element={<MySubscription />} />
      </Route>

      {/* Catch-all route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
