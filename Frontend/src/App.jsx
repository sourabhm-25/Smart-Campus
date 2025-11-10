// import PillNav from "./components/PillNav";
// // import React, { useState } from "react";
// // import axios from "axios";
// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import { Link } from "react-router-dom";
// import TestImageSol from "./TestImageSol";
// import HomePage from "./pages/HomePage";
// import  "./App.css"

// import logo from "../public/logo.png"
// import Task from "./pages/Task";
// export default function App() {
//   const navItems = [
//     { label: 'Home', href: '/' },
//     { label: 'Task', href: '/task' },
//     { label: 'Test', href: '/services' },
   
//   ];

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-12 px-4">
//       <div className="max-w-4xl mx-auto">
//         <div className="flex justify-center">
//           <Router>
//          <PillNav
//   logo={logo}
//   logoAlt="Company Logo"
  
//   items={navItems.map(item => ({
//             ...item,
//             // 🔗 replace href with a <Link> for real navigation
//             href: undefined,
//             element: <Link to={item.href}>{item.label}</Link>
//           }))}
//   activeHref="#"
//   className="custom-nav"
//   ease="power2.easeOut"
//   baseColor="#ffffff"
//   pillColor = '#D78FEE'
//   hoveredPillTextColor="#000000"
//   pillTextColor="#000000"

// />
// <Routes>
//           <Route path="/" element={<HomePage />} />
//           <Route path="/task" element={<Task />} />
//           <Route path="/test" element={<TestImageSol />} />
        
//         </Routes>
// </Router>
// </div>
// {/* 
//         <h1 className="text-4xl font-bold text-gray-800 text-center mb-6">
//           Teacher Homework Generator
//         </h1> */}
       

   
       
//       </div>
//     </div>
//   );
// }

import PillNav from "./components/PillNav";
import {  Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import Task from "./pages/Task";
import TestImageSol from "./TestImageSol";
import logo from "../public/logo.png";
import "./App.css";

export default function App() {
  const navItems = [
    { label: "Home", href: "/" },
    { label: "Task", href: "/task" },
    { label: "Test", href: "/test" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-12 px-4">
      {/* <div className="max-w-4xl mx-auto"> */}
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
        </Routes>
      </div>

  );
}
