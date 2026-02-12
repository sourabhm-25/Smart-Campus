import { Outlet } from "react-router-dom";
import PillNav from "../components/PillNav";

// ✅ Vite-safe way (no JS import from public)
const logo = "/logo.png";

const TeacherLayout = () => {
  const navItems = [
    { label: "Home", href: "/teacher" },
    { label: "Task", href: "/teacher/task" },
    { label: "Test", href: "/teacher/test" },
    { label: "Kanban", href: "/teacher/kanban" },
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

      {/* Child routes render here */}
      <Outlet />
    </div>
  );
};

export default TeacherLayout;
