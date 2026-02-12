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
import StudentDashboard from "./pages/student/studentDashboard";
import ParentDashboard from "./pages/parent/parentDashboard";

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
      <Route path="/student" element={<StudentDashboard />} />

      {/* Parent Route */}
      <Route path="/parent" element={<ParentDashboard />} />

    </Routes>
  );
}
