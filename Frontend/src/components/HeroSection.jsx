import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import '../App.css';
import bookAnimation from '../assets/book.json'; // or from 'public/book.json'


function HeroSection() {
  const navigate = useNavigate();
  const targetPath = '/get-started';

  const [animateText, setAnimateText] = useState(false);
  const [animateLottie, setAnimateLottie] = useState(false);

  useEffect(() => {
    // Trigger smooth staggered animation
    setTimeout(() => setAnimateText(true), 400);
    setTimeout(() => setAnimateLottie(true), 400);
  }, []);

  return (
    <section className="flex flex-col md:flex-row items-center justify-between w-full h-[100vh] bg-gradient-to-r from-[#f5f6ff] to-[#ffffff] px-6 md:px-24 overflow-hidden transition-all duration-700 ease-in-out">

      {/* ==== LEFT SIDE (Text) ==== */}
      <div
        className={`flex flex-1 flex-col justify-center transform transition-all duration-[1000ms] ease-[cubic-bezier(0.65,0,0.35,1)]
        ${animateText ? 'translate-x-0 opacity-100' : '-translate-x-12 opacity-0'}`}
      >
        <div className="max-w-2xl">
          <h1 className="text-6xl md:text-7xl font-extrabold text-gray-900 leading-tight mb-6">
            Smart Campus
           <span className="block text-5xl lg:text-6xl mt-4" style={{ color: "#9287fcff" }}>

              From Topic to Task Instantly
            </span>
          </h1>

          <p className="text-xl text-gray-700 leading-relaxed mb-10 max-w-xl">
            Instantly turn any textbook concept into an interactive, curriculum-aligned learning adventure for your students — all in seconds.
          </p>

          <div className="flex flex-wrap gap-5">
            {/* <button
              className="rounded-lg bg-purple-600 px-8 py-4 font-semibold text-white text-lg transition-all duration-300 hover:bg-purple-700 active:scale-95 shadow-lg"
              onClick={() => navigate(targetPath)}
            >
              Get Started
            </button> */}

            <button
              className="rounded-lg border-2 border-black bg-white px-8 py-4 font-semibold text-lg text-black transition-all duration-300 hover:-translate-y-1 hover:shadow-[6px_6px_0px_black]"
              onClick={() => navigate(targetPath)}
            >
              See How It Works →
            </button>
          </div>
        </div>
      </div>

      {/* ==== RIGHT SIDE (Lottie Animation) ==== */}
      <div
        className={`flex flex-1 justify-center items-center transition-all duration-[1200ms] ease-[cubic-bezier(0.65,0,0.35,1)]
        ${animateLottie ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0'}`}
      >
        <div className="w-[250%] md:w-[200%] lg:w-[185%] max-w-5xl bg-gradient-to-r [#fef7ff] rounded-3xl">
          <Lottie animationData={bookAnimation} loop={true} />
        </div>
      </div>

    </section>
  );
}

export default HeroSection;
