import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <>
      <style>
        {`
          /* ─── CSS Variables ─────────────────────────────────────── */
          :root {
            --velorah-background: hsl(201, 100%, 13%);
            --velorah-foreground: hsl(0, 0%, 100%);
            --velorah-muted-foreground: hsl(240, 4%, 66%);
            --velorah-font-display: 'Instrument Serif', serif;
            --velorah-font-body: 'Inter', sans-serif;
          }

          .velorah-wrapper {
            background-color: var(--velorah-background);
            color: var(--velorah-foreground);
            font-family: var(--velorah-font-body);
            font-size: 16px;
            line-height: 1.5;
            -webkit-font-smoothing: antialiased;
            overflow-x: hidden;
            width: 100vw;
            min-height: 100vh;
          }

          .velorah-wrapper *, .velorah-wrapper *::before, .velorah-wrapper *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }

          /* ─── Liquid Glass ──────────────────────────────────────── */
          .liquid-glass {
            background: rgba(255, 255, 255, 0.01);
            background-blend-mode: luminosity;
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            border: none;
            box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.1);
            position: relative;
            overflow: hidden;
          }

          .liquid-glass::before {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: inherit;
            padding: 1.4px;
            background: linear-gradient(
              180deg,
              rgba(255,255,255,0.45) 0%,
              rgba(255,255,255,0.15) 20%,
              rgba(255,255,255,0) 40%,
              rgba(255,255,255,0) 60%,
              rgba(255,255,255,0.15) 80%,
              rgba(255,255,255,0.45) 100%
            );
            mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            pointer-events: none;
          }

          /* ─── Animations ────────────────────────────────────────── */
          @keyframes fade-rise {
            from { opacity: 0; transform: translateY(24px); }
            to   { opacity: 1; transform: translateY(0); }
          }

          .animate-fade-rise           { animation: fade-rise 0.8s ease-out both; }
          .animate-fade-rise-delay     { animation: fade-rise 0.8s ease-out 0.2s both; }
          .animate-fade-rise-delay-2   { animation: fade-rise 0.8s ease-out 0.4s both; }

          /* ─── Page Wrapper ──────────────────────────────────────── */
          .velorah-page {
            position: relative;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }

          /* ─── Video Background ──────────────────────────────────── */
          .video-bg {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            z-index: 0;
          }

          /* ─── Navigation ────────────────────────────────────────── */
          .nav-outer {
            position: relative;
            z-index: 10;
            width: 100%;
          }

          .nav-inner {
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            padding: 24px 32px;
            max-width: 80rem;
            margin: 0 auto;
            width: 100%;
          }

          .velorah-logo {
            font-family: var(--velorah-font-display);
            font-size: 1.875rem;
            letter-spacing: -0.025em;
            color: var(--velorah-foreground);
            text-decoration: none;
            line-height: 1;
          }

          .velorah-logo sup {
            font-size: 0.75rem;
            vertical-align: super;
          }

          .nav-links {
            display: none;
            align-items: center;
            gap: 2rem;
            list-style: none;
          }

          @media (min-width: 768px) {
            .nav-links { display: flex; }
          }

          .nav-links a {
            font-size: 0.875rem;
            color: var(--velorah-muted-foreground);
            text-decoration: none;
            transition: color 0.2s ease;
            font-family: var(--velorah-font-body);
            font-weight: 400;
          }

          .nav-links a:hover,
          .nav-links a.active {
            color: var(--velorah-foreground);
          }

          .nav-cta {
            font-family: var(--velorah-font-body);
            font-size: 0.875rem;
            font-weight: 500;
            color: var(--velorah-foreground);
            background: transparent;
            border-radius: 9999px;
            padding: 10px 24px;
            cursor: pointer;
            transition: transform 0.2s ease;
            outline: none;
          }

          .nav-cta:hover {
            transform: scale(1.03);
          }

          /* ─── Hero ──────────────────────────────────────────────── */
          .hero {
            position: relative;
            z-index: 10;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            padding: 90px 24px 160px;
            flex: 1;
          }

          .hero h1 {
            font-family: var(--velorah-font-display);
            font-size: clamp(3rem, 8vw, 6rem);
            line-height: 0.95;
            letter-spacing: -2.46px;
            max-width: 80rem;
            font-weight: 400;
            color: var(--velorah-foreground);
          }

          @media (min-width: 640px) {
            .hero h1 { font-size: clamp(3.5rem, 9vw, 7rem); }
          }

          @media (min-width: 768px) {
            .hero h1 { font-size: clamp(4rem, 10vw, 8rem); }
          }

          .hero h1 em {
            font-style: normal;
            color: var(--velorah-muted-foreground);
          }

          .hero-sub {
            color: var(--velorah-muted-foreground);
            font-size: 1rem;
            max-width: 42rem;
            margin-top: 2rem;
            line-height: 1.7;
            font-family: var(--velorah-font-body);
            font-weight: 400;
          }

          @media (min-width: 640px) {
            .hero-sub { font-size: 1.125rem; }
          }

          .hero-cta {
            font-family: var(--velorah-font-body);
            font-size: 1rem;
            font-weight: 500;
            color: var(--velorah-foreground);
            background: transparent;
            border-radius: 9999px;
            padding: 20px 56px;
            margin-top: 3rem;
            cursor: pointer;
            transition: transform 0.2s ease;
            outline: none;
          }

          .hero-cta:hover {
            transform: scale(1.03);
          }
        `}
      </style>

      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500&display=swap" rel="stylesheet" />

      <div className="velorah-wrapper">
        <div className="velorah-page">

          {/* Video Background */}
          <video
            className="video-bg"
            autoPlay
            loop
            muted
            playsInline
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4"
          ></video>

          {/* Navigation */}
          <nav className="nav-outer">
            <div className="nav-inner">
              {/* Logo */}
              <a href="#" className="velorah-logo">Smart Campus<sup>®</sup></a>

              {/* Nav Links */}
              <ul className="nav-links">
                <li><a href="#" className="active">Home</a></li>
                <li><a href="#">Studio</a></li>
                <li><a href="#">About</a></li>
                <li><a href="#">Journal</a></li>
                <li><a href="#">Reach Us</a></li>
              </ul>

              {/* CTA Button */}
              <button onClick={() => navigate('/login')} className="nav-cta liquid-glass">Begin Journey</button>
            </div>
          </nav>

          {/* Hero Section */}
          <section className="hero">
            <h1 className="animate-fade-rise">
              Where <em> futures  </em> rise<br /><em>through the learning.</em>
            </h1>

            <p className="hero-sub animate-fade-rise-delay">
              Smart Campus connects teachers, students, and parents in one seamless platform - from homework to progress, everything in one place
            </p>

            <button onClick={() => navigate('/login')} className="hero-cta liquid-glass animate-fade-rise-delay-2">
              Begin Journey
            </button>
          </section>

        </div>
      </div>
    </>
  );
}

