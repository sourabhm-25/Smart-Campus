import PillNav from "./components/PillNav";
import {  Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import Task from "./pages/Task";
import TestImageSol from "./TestImageSol";
import logo from "../public/logo.png";
import Kanban  from "./pages/Kanban";
import "./App.css";

export default function App() {
  const navItems = [
    { label: "Home", href: "/" },
    { label: "Task", href: "/task" },
    { label: "Test", href: "/test" },
     { label: "Kanban", href: "/kanban" },
  ];

  return (
    <div className="h-screen overflow-y-auto custom-scrollbar-hide py-12 px-4">
    
      <div className="flex justify-center">
        <PillNav
          logo={logo}
          logoAlt="Company Logo"
          items={navItems}
          className="custom-nav"
        />
</div>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/task" element={<Task />} />
          <Route path="/test" element={<TestImageSol />} />
          <Route path="/kanban" element={<Kanban />} />
        </Routes>
      </div>

  );
}
