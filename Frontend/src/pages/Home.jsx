
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import herosection from "../assets/herosection.jpg";


export default function Home() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap');

          :root {
            --slate-900: #0f172a;
            --slate-800: #1e293b;
            --slate-700: #334155;
            --slate-400: #94a3b8;
            --slate-300: #cbd5e1;
            --slate-100: #f1f5f9;
            --blue-accent: #3b82f6;
            --glass-bg: rgba(30, 41, 59, 0.65);
            --glass-border: rgba(255, 255, 255, 0.08);
            --font-main: 'Inter', system-ui, -apple-system, sans-serif;
            --font-chalk: 'Caveat', cursive;
            --chalk-white: rgba(240, 235, 220, 0.92);
            --chalk-dim: rgba(200, 195, 180, 0.55);
          }

          * { box-sizing: border-box; margin: 0; padding: 0; }

          body {
            background-color: var(--slate-900);
            color: var(--slate-100);
            font-family: var(--font-main);
            overflow-x: hidden;
            -webkit-font-smoothing: antialiased;
          }

          .bg-layer {
            position: fixed;
            inset: 0;
            z-index: -1;
            background:
              radial-gradient(circle at 15% 50%, rgba(51,65,85,0.4), transparent 50%),
              radial-gradient(circle at 85% 30%, rgba(30,41,59,0.5), transparent 50%),
              linear-gradient(to bottom right, var(--slate-900), #090e17);
          }

          /* ─── Navbar ─── */
          .navbar {
            position: fixed;
            top: 0;
            width: 100%;
            z-index: 50;
            transition: all 0.3s ease;
            padding: 14px 0;
            background: rgba(0, 0, 0, 0.92);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border-bottom: 1px solid rgba(126, 172, 235, 0.28);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.34);
          }
          .navbar.scrolled {
            padding: 12px 0;
            background: rgba(0, 0, 0, 0.96);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border-bottom: 1px solid rgba(126, 172, 235, 0.26);
            box-shadow: 0 14px 34px rgba(0, 0, 0, 0.4);
          }
          .nav-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 clamp(16px, 3vw, 24px);
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 20px;
          }
          .logo {
            display: flex;
            align-items: center;
            gap: 12px;
            text-decoration: none;
            color: #9db9d6;
            font-weight: 700;
            font-size: 1.25rem;
            letter-spacing: -0.03em;
          }
          .logo img { height: 64px; width: auto; }
          @media (max-width: 767px) {
            .navbar { padding: 10px 0; }
            .navbar.scrolled { padding: 8px 0; }
            .logo { gap: 8px; font-size: 1rem; }
            .logo img { height: 48px; }
          }
          @media (min-width: 768px) and (max-width: 1080px) {
            .logo { font-size: 1.05rem; }
            .logo img { height: 54px; }
          }
          .nav-links { display: none; align-items: center; gap: 32px; }
          @media (min-width: 768px) { .nav-links { display: flex; } }
          @media (min-width: 768px) and (max-width: 1080px) { .nav-links { gap: 18px; } }
          .nav-item {
            color: #9fc6ff;
            text-decoration: none;
            font-size: 0.9rem;
            font-weight: 700;
            transition: color 0.2s ease, transform 0.2s ease;
            position: relative;
          }
          .nav-item::after {
            content: "";
            position: absolute;
            left: 0;
            right: 0;
            bottom: -6px;
            height: 2px;
            border-radius: 999px;
            background: linear-gradient(90deg, #9db9d6, #d8a0c4, #f4d98e);
            opacity: 0;
            transform: scaleX(0.65);
            transition: opacity 0.2s ease, transform 0.2s ease;
          }
          .nav-item:hover {
            color: #c94fab;
            transform: translateY(-1px);
          }
          .nav-item:hover::after {
            opacity: 1;
            transform: scaleX(1);
          }
          .dropdown-group {
            position: relative;
            cursor: pointer;
            padding: 10px 0;
          }
          .dropdown-group:hover .dropdown-menu {
            opacity: 1;
            visibility: visible;
            transform: translateX(-50%) translateY(0);
          }
          .dropdown-menu {
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%) translateY(10px);
            background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(126, 172, 235, 0.24);
            border-radius: 12px;
            padding: 8px;
            min-width: 160px;
            display: flex;
            flex-direction: column;
            gap: 4px;
            opacity: 0;
            visibility: hidden;
            transition: all 0.2s cubic-bezier(0.16,1,0.3,1);
            box-shadow: 0 18px 45px rgba(62, 91, 143, 0.18);
          }
          .dropdown-menu::before {
            content: '';
            position: absolute;
            top: -15px; left: 0; right: 0; height: 15px;
          }
          .dropdown-link {
            padding: 10px 16px;
            color: #37669f;
            text-decoration: none;
            font-size: 0.85rem;
            font-weight: 600;
            border-radius: 8px;
            transition: all 0.2s;
            white-space: nowrap;
          }
          .dropdown-link:hover {
            background: linear-gradient(135deg, rgba(127,179,255,0.14), rgba(217,115,200,0.14));
            color: #c94fab;
          }
          .nav-btn {
            background: linear-gradient(135deg, #9db9d6, #d8a0c4 62%, #f4d98e);
            border: 1px solid rgba(126, 172, 235, 0.28);
            color: white;
            padding: 10px 24px;
            border-radius: 99px;
            font-size: 0.9rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 10px 24px rgba(126, 172, 235, 0.26);
          }
          @media (min-width: 768px) and (max-width: 1080px) {
            .nav-btn {
              padding: 9px 16px;
              font-size: 0.82rem;
            }
          }
          .nav-btn:hover {
            background: linear-gradient(135deg, #8eb0cf, #c78eb4 62%, #ead08a);
            border-color: rgba(216,160,196,0.32);
            transform: translateY(-1px);
            box-shadow: 0 14px 30px rgba(216,160,196,0.2);
          }
          @media (max-width: 767px) { .nav-btn { display: none; } }
          .mobile-menu-btn {
            display: flex;
            background: transparent;
            border: none;
            color: #9fc6ff;
            cursor: pointer;
          }
          @media (min-width: 768px) { .mobile-menu-btn { display: none; } }
          .mobile-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.58);
            backdrop-filter: blur(20px);
            z-index: 40;
            padding: 96px 18px 18px;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 32px;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s;
          }
          .mobile-overlay.open { opacity: 1; visibility: visible; }
          .mobile-group-title {
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: #f4d89d;
            margin: 14px 4px 10px;
            font-weight: 800;
          }
          .mobile-links {
            width: min(86vw, 360px);
            min-height: calc(100vh - 114px);
            display: flex;
            flex-direction: column;
            gap: 10px;
            padding: 22px;
            border: 1px solid rgba(127, 179, 255, 0.28);
            border-radius: 22px;
            background:
              linear-gradient(145deg, rgba(10, 15, 28, 0.98), rgba(18, 13, 26, 0.96)),
              linear-gradient(135deg, rgba(127,179,255,0.18), rgba(217,115,200,0.14));
            box-shadow: 0 28px 70px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08);
            transform: translateX(24px);
            transition: transform 0.3s cubic-bezier(0.16,1,0.3,1);
          }
          .mobile-overlay.open .mobile-links { transform: translateX(0); }
          .mobile-links a {
            color: #dceaff;
            text-decoration: none;
            font-size: 1rem;
            font-weight: 800;
            padding: 14px 16px;
            border: 1px solid rgba(127, 179, 255, 0.16);
            border-radius: 14px;
            background: rgba(255,255,255,0.05);
            transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
          }
          .mobile-links a:hover {
            color: #ffffff;
            background: linear-gradient(135deg, rgba(127,179,255,0.22), rgba(217,115,200,0.2));
            transform: translateX(-3px);
          }

          /* ═══════════════════════════════
             HERO SECTION — Real Chalkboard
          ═══════════════════════════════ */
          .hero-wrapper {
            position: relative;
            overflow: hidden;
            display: block;
            isolation: isolate;
          }

          

          /* Deep darkening vignette — keeps edges dark like a real board in dim light */
          .hero-vignette {
            display: none;
          }

          /* Colour grade — subtle cool teal tint for academic chalk feel */
          .hero-color-grade {
            display: none;
          }

          /* Chalk dust scattering — tiny bright particles */
          .hero-chalk-dust {
            position: absolute;
            inset: 0;
            z-index: 3;
            pointer-events: none;
            overflow: hidden;
          }
          .chalk-particle {
            position: absolute;
            border-radius: 50%;
            background: rgba(157,185,214,0.58);
            animation: floatDust linear infinite;
          }
          .chalk-particle:nth-child(3n + 2) {
            background: rgba(216,160,196,0.58);
          }
          .chalk-particle:nth-child(3n) {
            background: rgba(255,255,255,0.82);
          }
          @keyframes floatDust {
            0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 0.4; }
            100% { transform: translateY(-120px) translateX(30px) rotate(180deg); opacity: 0; }
          }

          /* Ambient glow behind content */
          .hero-glow {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 700px;
            height: 400px;
            z-index: 4;
            pointer-events: none;
            background: radial-gradient(ellipse, rgba(157,185,214,0.1) 0%, rgba(216,160,196,0.07) 38%, transparent 70%);
          }

          /* Decorative chalk art — drawn on the board edges */
          .hero-chalk-art {
            position: absolute;
            inset: 0;
            z-index: 4;
            pointer-events: none;
          }
          .hero-chalk-art [stroke] {
            stroke: rgba(157,185,214,0.82);
          }
          .hero-chalk-art [fill]:not([fill="none"]) {
            fill: rgba(216,160,196,0.78);
          }
          .hero-chalk-art text {
            fill: rgba(255,255,255,0.9);
          }
          .hero-chalk-art g:nth-of-type(2n) [stroke] {
            stroke: rgba(216,160,196,0.72);
          }
          .hero-chalk-art g:nth-of-type(3n) [stroke] {
            stroke: rgba(255,255,255,0.86);
          }

          /* Content sits above everything */
          .hero {
            position: relative;
            z-index: 5;
            padding: 180px 24px 100px;
            max-width: 1200px;
            margin: 0 auto;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          .hero-pill {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 18px;
            background: linear-gradient(135deg, rgba(157,185,214,0.14), rgba(216,160,196,0.12));
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(216,160,196,0.5);
            border-radius: 99px;
            font-size: 0.78rem;
            font-weight: 600;
            color: #ffffff;
            margin-bottom: 32px;
            animation: fadeInDown 0.8s ease-out;
            letter-spacing: 0.07em;
            text-transform: uppercase;
          }
          .hero-pill span.dot {
            width: 6px; height: 6px; border-radius: 50%;
            background: #d8a0c4;
            box-shadow: 0 0 10px rgba(216,160,196,0.55), 0 0 20px rgba(157,185,214,0.25);
            animation: pulse-dot 2.5s infinite;
          }
          @keyframes pulse-dot {
            0%,100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(0.8); }
          }

          /* Chalk-written headline — uses Caveat font for handwritten feel */
          .hero h1 {
            font-family: var(--font-chalk);
            font-size: clamp(3rem, 6.5vw, 6rem);
            line-height: 1.1;
            letter-spacing: -0.01em;
            font-weight: 700;
            margin-bottom: 24px;
            max-width: 960px;
            /* Chalky worn-white gradient */
            background: linear-gradient(
              175deg,
              rgba(248,244,235,1) 0%,
              rgba(235,230,215,0.97) 35%,
              rgba(210,205,190,0.88) 65%,
              rgba(185,180,165,0.75) 100%
            );
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            /* Chalky edge blur for realism */
            filter: drop-shadow(0 0 12px rgba(240,235,220,0.18)) drop-shadow(0 2px 4px rgba(0,0,0,0.6));
            animation: fadeInUp 0.8s ease-out 0.1s both;
          }

          .hero-sub {
            font-size: clamp(1rem, 2vw, 1.15rem);
            color: #ffffff;
            max-width: 560px;
            line-height: 1.75;
            margin-bottom: 48px;
            animation: fadeInUp 0.8s ease-out 0.2s both;
            font-weight: 400;
            text-shadow: 0 1px 3px rgba(0,0,0,0.6);
          }

          .hero-actions {
            display: flex;
            gap: 16px;
            flex-wrap: wrap;
            justify-content: center;
            animation: fadeInUp 0.8s ease-out 0.3s both;
          }

          /* Chalk-style primary button */
          .btn-primary {
            background: #ffffff;
            color: #1a1208;
            padding: 15px 40px;
            border-radius: 10px;
            font-weight: 700;
            font-size: 0.95rem;
            text-decoration: none;
            border: none;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1);
            box-shadow: 0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.5);
            letter-spacing: 0.01em;
            font-family: var(--font-main);
          }
          .btn-primary:hover {
            transform: translateY(-3px) scale(1.02);
            box-shadow: 0 12px 40px rgba(240,235,215,0.25), 0 4px 12px rgba(0,0,0,0.4);
            background: rgba(255,250,235,0.98);
          }

          /* Outlined chalk-style secondary button */
          .btn-secondary {
            background: transparent;
            border: 1.5px solid rgba(216,160,196,0.7);
            color: #ffffff;
            padding: 15px 36px;
            border-radius: 10px;
            font-weight: 600;
            font-size: 0.95rem;
            text-decoration: none;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1);
            font-family: var(--font-main);
            backdrop-filter: blur(8px);
          }
          .btn-secondary:hover {
            background: linear-gradient(135deg, rgba(157,185,214,0.12), rgba(216,160,196,0.12));
            border-color: rgba(216,160,196,0.78);
            transform: translateY(-3px) scale(1.02);
            box-shadow: 0 8px 25px rgba(0,0,0,0.3);
          }

          .hero-container {
            position: relative;
            width: 100%;
            display: grid;
            place-items: center;
            overflow: hidden;
            background: #050505;
          }

          .hero-image {
            position: relative;
            grid-area: 1 / 1;
            width: 100%;
            height: auto;
            display: block;
            object-fit: contain;
            object-position: center;
            filter: saturate(0.72) contrast(0.96) brightness(0.94);
            z-index: 0;
          }

          .hero-container::after {
            content: none;
          }

          .hero-content {
            position: relative;
            grid-area: 1 / 1;
            width: min(92%, 760px);
            padding: clamp(96px, 11vw, 140px) 24px clamp(72px, 8vw, 110px);
            color: white;
            text-align: center;
            z-index: 3;
          }

          .hero-content h1 {
            font-size: clamp(2.25rem, 5.2vw, 4rem);
            line-height: 1.1;
            font-weight: 700;
            margin: 20px auto;
            color: #ffffff;
          }

          .hero-sub {
            max-width: 680px;
            margin: 0 auto 30px;
            font-size: 1.1rem;
            line-height: 1.7;
            color: #ffffff;
          }
          @media (max-width: 767px) {
            .hero-wrapper {
              min-height: 72svh;
              display: grid;
            }
            .hero-container {
              min-height: 72svh;
            }
            .hero-image {
              height: 100%;
              object-fit: contain;
            }
            .hero-content {
              width: min(94%, 560px);
              padding: 92px 18px 56px;
            }
            .hero-pill {
              font-size: 0.68rem;
              padding: 7px 12px;
              margin-bottom: 18px;
            }
            .hero-sub {
              font-size: 0.95rem;
              line-height: 1.55;
            }
            .hero-chalk-art,
            .hero-chalk-dust,
            .hero-glow {
              display: none;
            }
          }

          /* Chalk-rule divider for stats */
          .hero-stats {
            display: flex;
            gap: 48px;
            margin-top: 72px;
            padding-top: 40px;
            border-top: 1px solid transparent;
            border-image: linear-gradient(90deg, rgba(216,160,196,0), rgba(216,160,196,0.58), rgba(255,255,255,0.5), rgba(216,160,196,0)) 1;
            animation: fadeInUp 0.8s ease-out 0.45s both;
            flex-wrap: wrap;
            justify-content: center;
          }
          .hero-stat { text-align: center; }
          .hero-stat-num {
            display: block;
            font-family: var(--font-chalk);
            font-size: 2.5rem;
            font-weight: 700;
            letter-spacing: -0.01em;
            color: #ffffff;
            filter: drop-shadow(0 0 8px rgba(255,255,255,0.24));
          }
          .hero-stat-label {
            display: block;
            font-size: 0.78rem;
            color: #ffffff;
            margin-top: 4px;
            letter-spacing: 0.07em;
            text-transform: uppercase;
            font-weight: 500;
          }

          /* ─── Rest of sections ─── */
          .features-section {
            width: 100%;
            margin: 0;
            padding: 92px 24px 112px;
            background: #ffffff;
            color: #13233a;
            overflow: hidden;
          }
          .chunky-shell {
            max-width: 1180px;
            margin: 0 auto;
          }
          .section-header {
            display: grid;
            grid-template-columns: minmax(0, 1.05fr) minmax(280px, 0.95fr);
            gap: 36px;
            align-items: center;
            margin-bottom: 56px;
          }
          .section-kicker {
            display: inline-flex;
            width: max-content;
            align-items: center;
            gap: 10px;
            padding: 10px 14px;
            border: 3px solid #273c75;
            border-radius: 8px;
            background: #f4d98e;
            color: #273c75;
            font-size: 0.78rem;
            font-weight: 900;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            box-shadow: 6px 6px 0 #273c75;
          }
          .section-header h2 {
            max-width: 760px;
            margin: 22px 0 18px;
            color: #273c75;
            font-size: clamp(2.4rem, 6vw, 5.25rem);
            font-weight: 900;
            line-height: 0.96;
            letter-spacing: 0;
          }
          .section-header p {
            max-width: 650px;
            color: #334155;
            font-size: clamp(1rem, 1.8vw, 1.2rem);
            line-height: 1.65;
            font-weight: 700;
          }
          .fluid-spot {
            position: relative;
            min-height: 300px;
            display: grid;
            place-items: center;
            padding: 20px;
            border: 4px solid #273c75;
            border-radius: 8px;
            background: #b7c7cc;
            box-shadow: 12px 12px 0 #d8a0c4;
            transform: rotate(1.2deg);
          }
          .fluid-spot img {
            width: min(100%, 520px);
            display: block;
            border-radius: 8px;
          }
          .feature-bubbles {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 20px;
            margin-bottom: 86px;
          }
          .feature-bubble {
            min-height: 250px;
            padding: 26px;
            border: 4px solid #273c75;
            border-radius: 8px;
            background: var(--bubble-bg);
            color: #273c75;
            box-shadow: 10px 10px 0 var(--bubble-shadow);
            transform: rotate(var(--tilt));
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }
          .feature-bubble:hover {
            transform: rotate(0deg) translateY(-6px);
            box-shadow: 14px 14px 0 var(--bubble-shadow);
          }
          .feature-icon {
            width: 58px;
            height: 58px;
            display: grid;
            place-items: center;
            margin-bottom: 22px;
            border: 3px solid #273c75;
            border-radius: 8px;
            background: #ffffff;
            color: #273c75;
            font-size: 32px;
            box-shadow: 5px 5px 0 rgba(20,20,138,0.22);
          }
          .feature-bubble h3 {
            margin: 0 0 12px;
            font-size: clamp(1.35rem, 2vw, 1.8rem);
            line-height: 1.05;
            font-weight: 900;
            letter-spacing: 0;
          }
          .feature-bubble p {
            margin: 0;
            color: #1f2f46;
            font-size: 1rem;
            line-height: 1.55;
            font-weight: 700;
          }
          .about-project {
            display: grid;
            grid-template-columns: minmax(280px, 0.88fr) minmax(0, 1.12fr);
            gap: 42px;
            align-items: center;
            padding: 34px;
            border: 4px solid #273c75;
            border-radius: 8px;
            background:
              linear-gradient(135deg, rgba(255,221,53,0.42), rgba(255,138,200,0.24)),
              #ffffff;
            box-shadow: 14px 14px 0 #8bb7d8;
          }
          .about-visual {
            display: grid;
            place-items: center;
            min-height: 330px;
            border: 4px solid #273c75;
            border-radius: 8px;
            background: #f0f6fb;
            box-shadow: inset 0 -14px 0 rgba(57,168,255,0.2);
          }
          .about-visual img {
            width: min(88%, 420px);
            display: block;
            filter: drop-shadow(10px 14px 0 rgba(20,20,138,0.12));
          }
          .about-copy h3 {
            margin: 0 0 18px;
            color: #273c75;
            font-size: clamp(2rem, 4vw, 3.7rem);
            line-height: 0.98;
            font-weight: 900;
            letter-spacing: 0;
          }
          .about-copy p {
            color: #334155;
            font-size: 1.08rem;
            line-height: 1.7;
            font-weight: 700;
            margin-bottom: 22px;
          }
          .project-pills {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
          }
          .project-pills span {
            padding: 10px 14px;
            border: 3px solid #273c75;
            border-radius: 8px;
            background: #f4d98e;
            color: #273c75;
            font-size: 0.88rem;
            font-weight: 900;
            box-shadow: 4px 4px 0 #d8a0c4;
          }

          @media (max-width: 900px) {
            .section-header,
            .about-project {
              grid-template-columns: 1fr;
            }
            .feature-bubbles {
              grid-template-columns: 1fr;
              gap: 24px;
            }
            .fluid-spot,
            .feature-bubble,
            .about-project {
              transform: none;
              box-shadow: 8px 8px 0 var(--bubble-shadow, #8bb7d8);
            }
            .about-project {
              padding: 24px;
            }
          }

          @media (max-width: 767px) {
            .features-section {
              padding: 70px 16px 88px;
            }
            .section-header {
              margin-bottom: 38px;
            }
            .fluid-spot {
              min-height: 220px;
              padding: 12px;
            }
            .feature-bubble {
              min-height: auto;
              padding: 22px;
            }
            .about-visual {
              min-height: 250px;
            }
          }

          .footer { background: #ffffff; border-top: 1px solid #e2e8f0; padding: 60px 24px 40px; text-align: center; }
          .footer p { color: #475569; font-size: 0.9rem; }

          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes fadeInDown {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>



      <div className="bg-layer" />

      {/* Navigation */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <Link to="/" className="logo">
            <img src="/logo.png" alt="Smart Campus Logo" />
            <span>Smart Campus</span>
          </Link>
          <div className="nav-links">
            <div className="dropdown-group">
              <span className="nav-item">Student Portal ▾</span>
              <div className="dropdown-menu">
                <Link to="/login?role=student&mode=login" className="dropdown-link">Student Login</Link>
                <Link to="/login?role=student&mode=register" className="dropdown-link">Create Account</Link>
              </div>
            </div>
            <div className="dropdown-group">
              <span className="nav-item">Teacher Portal ▾</span>
              <div className="dropdown-menu">
                <Link to="/login?role=teacher&mode=login" className="dropdown-link">Educator Login</Link>
                <Link to="/login?role=teacher&mode=register" className="dropdown-link">Join Faculty</Link>
              </div>
            </div>
            <div className="dropdown-group">
              <span className="nav-item">Parent Portal ▾</span>
              <div className="dropdown-menu">
                <Link to="/login?role=parent&mode=login" className="dropdown-link">Parent Login</Link>
                <Link to="/login?role=parent&mode=register" className="dropdown-link">Register</Link>
              </div>
            </div>
          </div>
          <button onClick={() => navigate('/login')} className="nav-btn">Get Started</button>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="mobile-menu-btn">
            <span className="material-symbols-outlined">{mobileMenuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <div className={`mobile-overlay ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-links">
          <div className="mobile-group-title">Student</div>
          <Link to="/login?role=student&mode=login" onClick={() => setMobileMenuOpen(false)}>Student Login</Link>
          <Link to="/login?role=student&mode=register" onClick={() => setMobileMenuOpen(false)}>Student Register</Link>
          <div className="mobile-group-title" style={{ marginTop: '16px' }}>Teacher</div>
          <Link to="/login?role=teacher&mode=login" onClick={() => setMobileMenuOpen(false)}>Teacher Login</Link>
          <div className="mobile-group-title" style={{ marginTop: '16px' }}>Parent</div>
          <Link to="/login?role=parent&mode=login" onClick={() => setMobileMenuOpen(false)}>Parent Login</Link>
        </div>
      </div>

      {/* ═══ HERO SECTION — Real Chalkboard ═══ */}
      <div className="hero-wrapper">

        {/* Layer 0 — Real chalkboard photo */}
        <div className="hero-chalkboard-bg" />

        {/* Layer 1 — Edge vignette darkening */}
        <div className="hero-vignette" />

        {/* Layer 2 — Color grade */}
        <div className="hero-color-grade" />

        {/* Layer 3 — Floating chalk dust particles */}
        <div className="hero-chalk-dust">
          {[...Array(18)].map((_, i) => (
            <div
              key={i}
              className="chalk-particle"
              style={{
                left: `${5 + (i * 37 + i * i * 3) % 90}%`,
                bottom: `${(i * 17) % 40}%`,
                width: `${1.5 + (i % 3) * 1.5}px`,
                height: `${1.5 + (i % 3) * 1.5}px`,
                animationDuration: `${6 + (i % 5) * 2.5}s`,
                animationDelay: `${(i * 0.7) % 8}s`,
                opacity: 0.4 + (i % 4) * 0.15,
              }}
            />
          ))}
        </div>

        {/* Layer 4 — Ambient glow */}
        <div className="hero-glow" />

        {/* Layer 5 — Decorative chalk drawings */}
        <svg
          className="hero-chalk-art"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
          style={{ position: 'absolute', inset: 0, zIndex: 4, pointerEvents: 'none' }}
        >
          {/* Chalk frame border — inner rectangle like a real chalkboard border */}
          <rect
            x="40" y="40" width="1360" height="820"
            fill="none"
            stroke="rgba(220,215,200,0.12)"
            strokeWidth="2"
            strokeDasharray="0"
            rx="4"
          />
          <rect
            x="52" y="52" width="1336" height="796"
            fill="none"
            stroke="rgba(220,215,200,0.06)"
            strokeWidth="1"
            rx="2"
          />

          {/* Top-left — scientific formula cluster */}
          <g opacity="0.22" fontFamily="'Georgia', serif" fontStyle="italic" fill="rgba(255, 253, 253, 1)">
            <text x="72" y="115" fontSize="16">f(x) = ∫₀ˣ g(t) dt</text>
            <text x="72" y="140" fontSize="13">∑ᵢ nᵢ = N</text>
            <text x="72" y="162" fontSize="12">Δs = v₀t + ½at²</text>
          </g>
          {/* Underline rule */}
          <line x1="72" y1="168" x2="210" y2="168" stroke="rgba(220,215,200,0.18)" strokeWidth="1" strokeDasharray="4 3" />

          {/* Top-left corner bracket */}
          <path d="M58 95 L58 175 L66 175" stroke="rgba(200,215,210,0.3)" strokeWidth="1.5" fill="none" />

          {/* Top-right — molecular / hexagonal sketch */}
          <g opacity="0.2" stroke="rgba(220,215,200,1)" strokeWidth="1.2" fill="none">
            <polygon points="1340,58 1368,43 1396,58 1396,88 1368,103 1340,88" strokeDasharray="5 3" />
            <polygon points="1355,68 1368,60 1381,68 1381,84 1368,92 1355,84" />
            <line x1="1368" y1="43" x2="1368" y2="28" />
            <line x1="1396" y1="58" x2="1410" y2="50" />
            <line x1="1340" y1="58" x2="1326" y2="50" />
          </g>
          <g opacity="0.18" fill="rgba(220,215,200,1)" fontFamily="'Georgia', serif" fontStyle="italic">
            <text x="1290" y="125" fontSize="15">E = mc²</text>
            <text x="1295" y="148" fontSize="13">λ = h/p</text>
            <text x="1293" y="168" fontSize="12">PV = nRT</text>
          </g>

          {/* Bottom-left — planet orbit sketch */}
          <g opacity="0.18" stroke="rgba(220,215,200,1)" fill="none">
            <ellipse cx="90" cy="820" rx="65" ry="28" strokeWidth="1" strokeDasharray="6 4" />
            <ellipse cx="90" cy="820" rx="42" ry="18" strokeWidth="0.8" strokeDasharray="4 3" />
            <circle cx="90" cy="820" r="8" strokeWidth="1" />
            <circle cx="90" cy="792" r="4" fill="rgba(220,215,200,0.5)" stroke="none" />
          </g>
          <text x="120" y="830" fontFamily="'Georgia', serif" fontStyle="italic" fontSize="12" fill="rgba(220,215,200,0.2)">orbit</text>

          {/* Bottom-right — coordinate graph */}
          <g opacity="0.22" stroke="rgba(220,215,200,1)" fill="none" strokeWidth="1">
            <line x1="1275" y1="855" x2="1430" y2="855" />
            <line x1="1285" y1="780" x2="1285" y2="860" />
            <polygon points="1430,851 1438,855 1430,859" fill="rgba(220,215,200,0.4)" stroke="none" />
            <polygon points="1281,780 1285,772 1289,780" fill="rgba(220,215,200,0.4)" stroke="none" />
            {/* Curve */}
            <path d="M1290 850 C1305 825, 1325 805, 1345 800 S1395 812 1425 798" strokeWidth="1.5" strokeDasharray="3 2" />
            {/* Axis ticks */}
            <line x1="1280" y1="800" x2="1290" y2="800" />
            <line x1="1280" y1="820" x2="1290" y2="820" />
            <line x1="1280" y1="840" x2="1290" y2="840" />
            <line x1="1320" y1="855" x2="1320" y2="860" />
            <line x1="1355" y1="855" x2="1355" y2="860" />
            <line x1="1390" y1="855" x2="1390" y2="860" />
          </g>
          <text x="1438" y="858" fontFamily="'Georgia', serif" fontSize="12" fill="rgba(220,215,200,0.22)" fontStyle="italic">t</text>
          <text x="1280" y="775" fontFamily="'Georgia', serif" fontSize="12" fill="rgba(220,215,200,0.22)" fontStyle="italic">y</text>

          {/* Mid-left ruled notebook lines */}
          <g opacity="0.07" stroke="rgba(220,215,200,1)" strokeWidth="1">
            <line x1="0" y1="400" x2="140" y2="400" />
            <line x1="0" y1="414" x2="110" y2="414" />
            <line x1="0" y1="428" x2="125" y2="428" />
            <line x1="0" y1="442" x2="95" y2="442" />
          </g>

          {/* Mid-right ruled lines */}
          <g opacity="0.07" stroke="rgba(220,215,200,1)" strokeWidth="1">
            <line x1="1300" y1="460" x2="1440" y2="460" />
            <line x1="1330" y1="474" x2="1440" y2="474" />
            <line x1="1315" y1="488" x2="1440" y2="488" />
          </g>

          {/* DNA helix suggestion — top-center subtle */}
          <g opacity="0.1" stroke="rgba(220,215,200,1)" fill="none" strokeWidth="1">
            <path d="M680 55 C690 65, 710 65, 720 75 S730 90, 720 100 S690 110, 680 120 S670 135, 680 145" strokeDasharray="4 3" />
            <path d="M720 55 C710 65, 690 65, 680 75 S670 90, 680 100 S710 110, 720 120 S730 135, 720 145" strokeDasharray="4 3" />
          </g>

          {/* Atom sketch — bottom center */}
          <g opacity="0.12" stroke="rgba(220,215,200,1)" fill="none" strokeWidth="1">
            <circle cx="720" cy="858" r="6" fill="rgba(220,215,200,0.3)" stroke="none" />
            <ellipse cx="720" cy="858" rx="30" ry="12" strokeWidth="1" />
            <ellipse cx="720" cy="858" rx="30" ry="12" strokeWidth="1" transform="rotate(60 720 858)" />
            <ellipse cx="720" cy="858" rx="30" ry="12" strokeWidth="1" transform="rotate(120 720 858)" />
          </g>
        </svg>

        {/* Hero Content */}
        <div className="hero-container">
          {/* Hero Image */}
          <img src={herosection} alt="Hero" className="hero-image" />

          {/* Hero Content Overlay */}
          <section className="hero-content">
            <div className="hero-pill">
              <span className="dot" />
              <span>Redefining Digital Education</span>
            </div>

            <h1>Smart learning for the modern student.</h1>

            <p className="hero-sub">
              Experience a beautiful, distraction-free environment designed to help
              you track assignments, view progress, and collaborate seamlessly with
              your teachers.
            </p>

            

           
          </section>
        </div>




      </div>
    
      <section className="features-section">
        <div className="chunky-shell">
          <div className="section-header">
            <div>
              <span className="section-kicker">Welcome to Smart Campus</span>
              <h2>School work that feels bright, bold, and alive.</h2>
              <p>
                Smart Campus brings students, teachers, and parents into one cheerful space
                where tasks, feedback, progress, and reminders feel easy to scan and fun to use.
              </p>
            </div>
            <div className="fluid-spot">
              <img src="/khanmigo-fluid-spot.jpg" alt="Playful student collaboration illustration" />
            </div>
          </div>

          <div className="feature-bubbles">
            <article className="feature-bubble" style={{ '--bubble-bg': '#f4d98e', '--bubble-shadow': '#d8a0c4', '--tilt': '-1.5deg' }}>
              <span className="material-symbols-outlined feature-icon">assignment</span>
              <h3>Tasks that pop.</h3>
              <p>Assignments, deadlines, and submissions become chunky, readable blocks that students can understand at a glance.</p>
            </article>
            <article className="feature-bubble" style={{ '--bubble-bg': '#d8e8f4', '--bubble-shadow': '#273c75', '--tilt': '1.2deg' }}>
              <span className="material-symbols-outlined feature-icon">insights</span>
              <h3>Progress with personality.</h3>
              <p>Grades, feedback, and learning growth are shown with clear signals that make improvement feel visible and motivating.</p>
            </article>
            <article className="feature-bubble" style={{ '--bubble-bg': '#f1d8e6', '--bubble-shadow': '#8bb7d8', '--tilt': '-0.8deg' }}>
              <span className="material-symbols-outlined feature-icon">forum</span>
              <h3>Everyone stays in sync.</h3>
              <p>Teacher updates, parent context, and student action items live together so nobody has to hunt for what matters.</p>
            </article>
          </div>

          <div className="about-project">
            <div className="about-visual">
              <img src="/open-book-bulb.png" alt="Open book with a bright idea bulb" />
            </div>
            <div className="about-copy">
              <span className="section-kicker">About the Smart Campus</span>
              <h3>A smarter campus for curious school students.</h3>
              <p>
                This project is built as an AI-powered school companion: teachers can assign and review work,
                students can track learning with less stress, and parents can stay connected to progress without
                turning the experience into a maze.
              </p>
              <div className="project-pills">
                <span>AI feedback</span>
                <span>Clear deadlines</span>
                <span>Teacher connect</span>
                <span>Parent visibility</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      <footer className="footer">
        <p>© 2026 Smart Campus. Elevating educational experiences.</p>
      </footer>
    </>
  );
}
