import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";

import TeacherLayout from "./layouts/TeacherLayout";

// Teacher pages
import HomePage from "./pages/teacher/HomePage";
import Task from "./pages/teacher/Task";
import Kanban from "./pages/teacher/Kanban";
import TestImageSol from "./TestImageSol";

// Student & Parent
import StudentLayout from "./layouts/StudentLayout";
import StudentDashboard from "./pages/student/studentDashboard";
import ParentDashboard from "./pages/parent/parentDashboard";
import TasksAssigned from "./pages/student/TasksAssigned";
import TasksSubmitted from "./pages/student/TasksSubmitted";
import KanbanBoard from "./pages/student/KanbanBoard";
import Notifications from "./pages/student/Notifications";
import Profile from "./pages/student/Profile";

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
      </Route>

      {/* Student Route */}
      <Route path="/student" element={<StudentLayout />}>
        <Route index element={<StudentDashboard />} />
        <Route path="tasks" element={<TasksAssigned />} />
        <Route path="submitted" element={<TasksSubmitted />} />
        <Route path="kanban" element={<KanbanBoard />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Parent Route */}
      <Route path="/parent" element={<ParentDashboard />} />

    </Routes>
  );
}
