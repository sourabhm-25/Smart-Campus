import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";

import TeacherLayout from "./layouts/TeacherLayout";

// Teacher pages
import HomePage from "./pages/teacher/HomePage";
import Task from "./pages/teacher/Task";
import Kanban from "./pages/teacher/Kanban";
import TestImageSol from "./TestImageSol";
import Submissions from "./pages/teacher/Submissions";
import Students from "./pages/teacher/Students";

// Student & Parent
import StudentLayout from "./layouts/StudentLayout";
import StudentDashboard from "./pages/student/studentDashboard";
import TasksAssigned from "./pages/student/TasksAssigned";
import TasksSubmitted from "./pages/student/TasksSubmitted";
import KanbanBoard from "./pages/student/KanbanBoard";
import Notifications from "./pages/student/Notifications";
import Profile from "./pages/student/Profile";
import SubjectTasks from "./pages/student/SubjectTasks";

// Parent pages
import ParentLayout from "./layouts/ParentLayout";
import ParentDashboard from "./pages/parent/parentDashboard";
import ChildrenManagement from "./pages/parent/ChildrenManagement";
import ReportCards from "./pages/parent/ReportCards";
import ProgressTracking from "./pages/parent/ProgressTracking";
import ParentNotifications from "./pages/parent/ParentNotifications";
import ParentProfile from "./pages/parent/ParentProfile";

export default function App() {
  return (
    <Routes>

      {/* Landing Page */}
      <Route path="/" element={<Home />} />

      {/* Login Page */}
      <Route path="/login" element={<Login />} />

      {/* Teacher Routes */}
      <Route path="/teacher" element={<TeacherLayout />}>
        <Route index element={<HomePage />} />
        <Route path="task" element={<Task />} />
        <Route path="kanban" element={<Kanban />} />
        <Route path="test" element={<TestImageSol />} />
        <Route path="submissions" element={<Submissions />} />
        <Route path="students" element={<Students />} />
      </Route>

      {/* Student Route */}
      <Route path="/student" element={<StudentLayout />}>
        <Route index element={<StudentDashboard />} />

        <Route path="tasks" element={<TasksAssigned />} />
        <Route path="tasks/:subjectId" element={<SubjectTasks />} />

        <Route path="submitted" element={<TasksSubmitted />} />
        <Route path="kanban" element={<KanbanBoard />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Parent Routes */}
      <Route path="/parent" element={<ParentLayout />}>
        <Route index element={<ParentDashboard />} />
        <Route path="children" element={<ChildrenManagement />} />
        <Route path="report-cards" element={<ReportCards />} />
        <Route path="progress" element={<ProgressTracking />} />
        <Route path="notifications" element={<ParentNotifications />} />
        <Route path="profile" element={<ParentProfile />} />
      </Route>

    </Routes>
  );
}
