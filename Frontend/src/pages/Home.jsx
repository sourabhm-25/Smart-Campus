import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="bg-sc-bg text-sc-on-bg font-body selection:bg-sc-ter selection:text-sc-on-ter">
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 bg-sc-surface/60 backdrop-blur-2xl shadow-xl flex justify-between items-center px-8 py-4 max-w-full mx-auto">
        <div className="flex items-center gap-12">
          <span className="text-2xl font-bold tracking-tighter text-sc-pri font-headline">Smart Campus</span>
          <div className="hidden md:flex gap-8 items-center">
            <a className="font-headline font-semibold text-sm tracking-tight text-sc-pri border-b-2 border-sc-pri transition-all duration-300" href="#">Homework</a>
            <a className="font-headline font-semibold text-sm tracking-tight text-slate-400 hover:text-sc-ter transition-all duration-300" href="#">Teachers</a>
            <a className="font-headline font-semibold text-sm tracking-tight text-slate-400 hover:text-sc-ter transition-all duration-300" href="#">Parents</a>
            <a className="font-headline font-semibold text-sm tracking-tight text-slate-400 hover:text-sc-ter transition-all duration-300" href="#">Pricing</a>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/login")}
            className="px-6 py-2.5 bg-gradient-to-br from-sc-pri to-sc-pri-ctr text-sc-on-pri font-headline font-bold text-sm rounded-full transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-sc-pri/20"
          >
            Join Now
          </button>
        </div>
      </nav>

      <main className="pt-24 overflow-x-hidden">
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 py-24 text-center">
          {/* Hero Background Layer */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            {/* CSS radial dot grid pattern (always renders) */}
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: `
                  radial-gradient(circle at 20% 30%, rgba(192, 193, 255, 0.4) 0px, transparent 1px),
                  radial-gradient(circle at 80% 20%, rgba(221, 183, 255, 0.35) 0px, transparent 1px),
                  radial-gradient(circle at 50% 60%, rgba(137, 206, 255, 0.3) 0px, transparent 1px),
                  radial-gradient(circle at 30% 80%, rgba(192, 193, 255, 0.25) 0px, transparent 1px),
                  radial-gradient(circle at 70% 70%, rgba(221, 183, 255, 0.3) 0px, transparent 1px),
                  radial-gradient(circle at 10% 50%, rgba(137, 206, 255, 0.2) 0px, transparent 1px),
                  radial-gradient(circle at 90% 40%, rgba(192, 193, 255, 0.25) 0px, transparent 1px),
                  radial-gradient(2px 2px at 15% 25%, rgba(192, 193, 255, 0.6), transparent),
                  radial-gradient(2px 2px at 85% 15%, rgba(221, 183, 255, 0.5), transparent),
                  radial-gradient(2px 2px at 45% 55%, rgba(137, 206, 255, 0.5), transparent),
                  radial-gradient(2px 2px at 75% 65%, rgba(192, 193, 255, 0.4), transparent),
                  radial-gradient(2px 2px at 25% 75%, rgba(221, 183, 255, 0.4), transparent),
                  radial-gradient(2px 2px at 55% 35%, rgba(137, 206, 255, 0.3), transparent),
                  radial-gradient(1.5px 1.5px at 35% 45%, rgba(192, 193, 255, 0.5), transparent),
                  radial-gradient(1.5px 1.5px at 65% 85%, rgba(221, 183, 255, 0.4), transparent),
                  radial-gradient(1px 1px at 5% 10%, rgba(192, 193, 255, 0.4), transparent),
                  radial-gradient(1px 1px at 95% 90%, rgba(221, 183, 255, 0.3), transparent)
                `,
                backgroundSize: '100% 100%',
              }}
            />
            {/* Connecting lines SVG pattern */}
            <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
              <line x1="15%" y1="25%" x2="45%" y2="55%" stroke="rgba(192,193,255,0.3)" strokeWidth="0.5" />
              <line x1="45%" y1="55%" x2="85%" y2="15%" stroke="rgba(221,183,255,0.25)" strokeWidth="0.5" />
              <line x1="85%" y1="15%" x2="75%" y2="65%" stroke="rgba(137,206,255,0.2)" strokeWidth="0.5" />
              <line x1="75%" y1="65%" x2="25%" y2="75%" stroke="rgba(192,193,255,0.3)" strokeWidth="0.5" />
              <line x1="25%" y1="75%" x2="55%" y2="35%" stroke="rgba(221,183,255,0.2)" strokeWidth="0.5" />
              <line x1="55%" y1="35%" x2="15%" y2="25%" stroke="rgba(137,206,255,0.25)" strokeWidth="0.5" />
              <line x1="35%" y1="45%" x2="65%" y2="85%" stroke="rgba(192,193,255,0.15)" strokeWidth="0.5" />
              <line x1="15%" y1="25%" x2="75%" y2="65%" stroke="rgba(221,183,255,0.15)" strokeWidth="0.5" />
              <line x1="5%" y1="10%" x2="35%" y2="45%" stroke="rgba(192,193,255,0.2)" strokeWidth="0.5" />
              <line x1="95%" y1="90%" x2="65%" y2="85%" stroke="rgba(221,183,255,0.15)" strokeWidth="0.5" />
            </svg>
            {/* Glow effects */}
            <div className="absolute top-[-15%] left-[-15%] w-[60%] h-[60%] bg-sc-pri/30 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[-15%] right-[-15%] w-[60%] h-[60%] bg-sc-ter/30 blur-[120px] rounded-full"></div>
            <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-sc-sec/15 blur-[100px] rounded-full"></div>
            {/* External image overlay */}
            <img
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-40"
              style={{ mixBlendMode: 'lighten' }}
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC-gau6toBsAXxmAmh-BVOgZa3sdA7iTo_ADAuqMoBJQLfWpjrnR4ecFrQGmJGJIRZRhlGNR_2e_DjZZY9SWpkj5WH35KbbD38VVnMIaxy7Z-QJ8JCR1mNXqLFP-3TtTcNMBoYSbdOWksqM7qGrVGze4iGqfx6trmjK_yv48dYZFUlrGTMAQqHrUseIqe7X5e-ZclMVuwQo-cgXFfRr6EfconHLUT7fuJHSzFCxwdIEp7eg-gxTedZRxmhxT9S0_gV8Pv8aVIw-L3E"
            />
          </div>
          <div className="max-w-5xl mx-auto z-10 relative">
            <span className="inline-block px-4 py-1.5 mb-8 rounded-full bg-sc-surface-ctr-highest text-sc-ter font-label text-xs tracking-widest uppercase border border-sc-outline-var/30">
              Revolutionizing Academic Assessment
            </span>
            <h1 className="font-headline text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1] text-sc-on-bg">
              Automating the <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sc-pri via-sc-ter to-sc-sec">Global Homework Cycle.</span>
            </h1>
            <p className="font-body text-xl md:text-2xl text-sc-on-surface-var max-w-3xl mx-auto mb-12 leading-relaxed">
              The intelligent layer for homework. Teachers generate tests in seconds; AI grades them instantly. Preserve handwriting while embracing automation.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button
                onClick={() => navigate("/login")}
                className="px-10 py-5 bg-gradient-to-br from-sc-pri to-sc-pri-ctr text-sc-on-pri font-headline text-lg font-bold rounded-xl transition-all hover:scale-105 hover:shadow-2xl hover:shadow-sc-pri/40"
              >
                Reduce Your Grading Load
              </button>
              <button className="px-10 py-5 glass-panel ghost-border text-sc-on-surface font-headline text-lg font-bold rounded-xl flex items-center gap-3 justify-center transition-all hover:bg-white/10">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
                See How It Works
              </button>
            </div>
          </div>
        </section>

        {/* Value Prop Bar */}
        <section className="py-16 bg-sc-surface-ctr-low/40">
          <div className="max-w-screen-xl mx-auto px-6">
            <p className="text-center font-label text-xs uppercase tracking-[0.3em] text-slate-500 mb-10">Powered by Advanced RAG &amp; Large Language Models</p>
            <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
              <span className="font-headline text-2xl font-black text-sc-on-surface/70 tracking-tighter">OpenAI</span>
              <span className="font-headline text-2xl font-black text-sc-on-surface/70 tracking-tighter italic">Microsoft</span>
              <span className="font-headline text-2xl font-black text-sc-on-surface/70 tracking-tighter">Google Cloud</span>
              <span className="font-headline text-2xl font-black text-sc-on-surface/70 tracking-tighter">aws</span>
              <span className="font-headline text-2xl font-black text-sc-on-surface/70 tracking-tighter italic">NVIDIA</span>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-32 px-6">
          <div className="max-w-screen-xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
              <div className="max-w-2xl">
                <h2 className="font-headline text-4xl md:text-5xl font-bold mb-6 text-sc-on-bg">Reclaiming Teacher Time</h2>
                <p className="text-sc-on-surface-var text-lg leading-relaxed">No more manual checking of every student's work. Reduced stress in deciding what homework to give, with powerful AI assisting every step.</p>
              </div>
              <div className="hidden md:block">
                <span className="material-symbols-outlined text-sc-ter text-6xl opacity-30">auto_awesome</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Card 1 */}
              <div className="glass-panel ghost-border p-10 rounded-xl transition-all hover:-translate-y-2 group">
                <div className="w-16 h-16 rounded-lg bg-sc-pri-ctr/20 flex items-center justify-center mb-8 group-hover:bg-sc-pri-ctr transition-colors">
                  <span className="material-symbols-outlined text-sc-pri text-3xl">edit_note</span>
                </div>
                <h3 className="font-headline text-2xl font-bold mb-4 text-sc-on-bg">Instant Assignments</h3>
                <p className="text-sc-on-surface-var leading-relaxed">Topic to Test in seconds. Teachers enter a topic, and AI generates comprehensive questions and answers for tests.</p>
                <ul className="mt-6 space-y-3 text-sm text-sc-on-surface-var">
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sc-ter text-lg">check_circle</span>
                    RAG-Powered Accuracy
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sc-ter text-lg">check_circle</span>
                    Custom Difficulty Levels
                  </li>
                </ul>
              </div>
              {/* Card 2 */}
              <div className="glass-panel ghost-border p-10 rounded-xl transition-all hover:-translate-y-2 group">
                <div className="w-16 h-16 rounded-lg bg-sc-ter-ctr/20 flex items-center justify-center mb-8 group-hover:bg-sc-ter-ctr transition-colors">
                  <span className="material-symbols-outlined text-sc-ter text-3xl">photo_camera</span>
                </div>
                <h3 className="font-headline text-2xl font-bold mb-4 text-sc-on-bg">Hybrid Submission</h3>
                <p className="text-sc-on-surface-var leading-relaxed">Solve digitally or in notebooks. Students can write manually and upload photos—preserving the value of handwriting.</p>
                <ul className="mt-6 space-y-3 text-sm text-sc-on-surface-var">
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sc-pri text-lg">check_circle</span>
                    Vision-AI Handwriting Recognition
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sc-pri text-lg">check_circle</span>
                    Preserves Cognitive Writing Value
                  </li>
                </ul>
              </div>
              {/* Card 3 */}
              <div className="glass-panel ghost-border p-10 rounded-xl transition-all hover:-translate-y-2 group">
                <div className="w-16 h-16 rounded-lg bg-sc-sec-ctr/20 flex items-center justify-center mb-8 group-hover:bg-sc-sec-ctr transition-colors">
                  <span className="material-symbols-outlined text-sc-sec text-3xl">fact_check</span>
                </div>
                <h3 className="font-headline text-2xl font-bold mb-4 text-sc-on-bg">AI-Powered Grading</h3>
                <p className="text-sc-on-surface-var leading-relaxed">Instant feedback for students and zero manual checking for teachers. Automated assessment of subjective work.</p>
                <ul className="mt-6 space-y-3 text-sm text-sc-on-surface-var">
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sc-pri text-lg">check_circle</span>
                    Instant Qualitative Feedback
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sc-pri text-lg">check_circle</span>
                    Zero-Effort Verification
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Orchestrating Institutional Efficiency */}
        <section className="py-32 bg-sc-surface-ctr-low">
          <div className="max-w-screen-xl mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="font-headline text-4xl md:text-5xl font-bold mb-6 text-sc-on-bg">Effortless Academic Management</h2>
              <p className="text-sc-on-surface-var text-lg max-w-2xl mx-auto">We provide the structure for success, ensuring everyone from the principal to the parent is in the loop.</p>
            </div>
            <div className="grid grid-cols-12 gap-6 h-auto md:h-[600px]">
              <div className="col-span-12 md:col-span-7 bg-sc-surface-ctr rounded-xl overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-t from-sc-bg to-transparent z-10"></div>
                <img
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBy9I1QzI-K9yCBfTWclahwi3Smw44CeWwKYffG_JH3Pxnn35yMWFkpjWKAyVAaa0tPMSIaBdnFrbL1XwmQ1qmmsMsjRN1HBJ5_8_6wE7QD067GPTe0nZwVPF_tZ1PXyA2bpnwvjD14MFRMo3dpUTs2EY9PU7On3ZNhAyPfAgIo5SnQR1cMK07WLMIzxnXYAJfCTuoTzSrsbb9aIUmbO-hqklTVsruCv4VQNmnhNvqt2UIQ9uNOYckkLmqWKi4R5JuUWYhrRi9WFnQ"
                />
                <div className="absolute bottom-10 left-10 right-10 z-20">
                  <h4 className="font-headline text-3xl font-bold mb-3 text-white">Full Progress Visibility</h4>
                  <p className="text-slate-300">Detailed analytics on student performance. Teachers get easy-to-understand scoring while students get clear, actionable task lists.</p>
                </div>
              </div>
              <div className="col-span-12 md:col-span-5 flex flex-col gap-6">
                <div className="flex-1 bg-gradient-to-br from-sc-ter-ctr/30 to-sc-bg rounded-xl p-8 border border-sc-ter/10 flex flex-col justify-end">
                  <span className="material-symbols-outlined text-sc-ter text-4xl mb-4">family_restroom</span>
                  <h4 className="font-headline text-2xl font-bold mb-2 text-sc-on-bg">Parent Portal</h4>
                  <p className="text-sc-on-surface-var text-sm">Dedicated views for parents to track student performance, homework completion, and areas needing improvement.</p>
                </div>
                <div className="flex-1 bg-sc-surface-ctr-highest rounded-xl p-8 border border-sc-outline-var/10 flex flex-col justify-end">
                  <span className="material-symbols-outlined text-sc-sec text-4xl mb-4">checklist</span>
                  <h4 className="font-headline text-2xl font-bold mb-2 text-sc-on-bg">Automated Task Lists</h4>
                  <p className="text-sc-on-surface-var text-sm">Students never miss a deadline with AI-prioritized task lists that sync across all their devices.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* One Unified View Section */}
        <section className="py-32 px-6 overflow-hidden">
          <div className="max-w-screen-xl mx-auto flex flex-col items-center">
            <div className="text-center mb-16">
              <h2 className="font-headline text-4xl md:text-5xl font-bold mb-4 text-sc-on-bg">One Unified View</h2>
              <p className="text-sc-on-surface-var">The next-generation dashboard for Teachers, Students, and Parents.</p>
            </div>
            {/* Mockup Container */}
            <div className="w-full max-w-5xl aspect-video rounded-xl bg-sc-surface-ctr-highest p-4 md:p-8 ghost-border relative shadow-2xl">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-sc-pri/20 blur-3xl rounded-full"></div>
              <div className="w-full h-full bg-sc-surface-ctr-lowest rounded-lg border border-sc-outline-var/20 flex overflow-hidden">
                {/* Mock Sidebar */}
                <div className="w-20 md:w-64 border-r border-sc-outline-var/10 flex flex-col py-6 items-center md:items-stretch">
                  <div className="px-6 mb-10 hidden md:block">
                    <div className="w-24 h-4 bg-sc-surface-ctr-highest rounded"></div>
                  </div>
                  <div className="space-y-6 px-4">
                    <div className="flex items-center gap-4 bg-sc-pri/10 p-2 rounded-lg">
                      <div className="w-6 h-6 bg-sc-pri rounded"></div>
                      <div className="w-24 h-3 bg-sc-pri/40 rounded hidden md:block"></div>
                    </div>
                    <div className="flex items-center gap-4 p-2">
                      <div className="w-6 h-6 bg-sc-surface-ctr-highest rounded"></div>
                      <div className="w-32 h-3 bg-sc-surface-ctr-highest rounded hidden md:block"></div>
                    </div>
                    <div className="flex items-center gap-4 p-2">
                      <div className="w-6 h-6 bg-sc-surface-ctr-highest rounded"></div>
                      <div className="w-20 h-3 bg-sc-surface-ctr-highest rounded hidden md:block"></div>
                    </div>
                  </div>
                </div>
                {/* Mock Content */}
                <div className="flex-1 p-6 md:p-10 space-y-8">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="w-48 h-6 bg-sc-surface-ctr-highest rounded mb-2"></div>
                      <div className="w-32 h-3 bg-sc-surface-ctr-highest/50 rounded"></div>
                    </div>
                    <div className="w-12 h-12 bg-sc-surface-ctr-highest rounded-full"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="h-32 rounded-xl bg-sc-surface-ctr-low border border-sc-outline-var/10 p-4">
                      <div className="w-full h-2 bg-sc-pri/20 rounded-full overflow-hidden mb-4">
                        <div className="w-2/3 h-full bg-sc-pri"></div>
                      </div>
                      <div className="w-24 h-4 bg-sc-surface-ctr-highest rounded"></div>
                    </div>
                    <div className="h-32 rounded-xl bg-sc-surface-ctr-low border border-sc-outline-var/10 p-4">
                      <div className="w-full h-12 flex items-end gap-1 mb-4">
                        <div className="flex-1 bg-sc-ter h-4 rounded-t"></div>
                        <div className="flex-1 bg-sc-ter h-8 rounded-t"></div>
                        <div className="flex-1 bg-sc-ter h-12 rounded-t"></div>
                        <div className="flex-1 bg-sc-ter h-6 rounded-t"></div>
                      </div>
                      <div className="w-24 h-4 bg-sc-surface-ctr-highest rounded"></div>
                    </div>
                    <div className="h-32 rounded-xl bg-sc-surface-ctr-low border border-sc-outline-var/10 p-4 flex items-center justify-center">
                      <span className="material-symbols-outlined text-4xl text-sc-sec">verified</span>
                    </div>
                  </div>
                  <div className="h-40 rounded-xl bg-sc-surface-ctr border border-sc-outline-var/10 p-6">
                    <div className="flex gap-4 items-center mb-6">
                      <div className="w-10 h-10 rounded-full bg-sc-surface-ctr-highest"></div>
                      <div className="w-full h-10 bg-sc-surface-ctr-highest rounded-lg"></div>
                    </div>
                    <div className="space-y-3">
                      <div className="w-full h-2 bg-sc-surface-ctr-highest rounded"></div>
                      <div className="w-4/5 h-2 bg-sc-surface-ctr-highest rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonial Section */}
        <section className="py-32 bg-sc-surface-ctr-lowest">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <span className="material-symbols-outlined text-sc-pri text-6xl mb-12 opacity-50">format_quote</span>
            <h2 className="font-headline text-3xl md:text-5xl font-medium italic leading-tight mb-16 text-sc-on-bg">
              &ldquo;Smart Campus has completely eliminated the Sunday night grading anxiety. I can now generate targeted assessments in seconds, and seeing my students&rsquo; handwritten work instantly graded is truly magic.&rdquo;
            </h2>
            <div className="flex flex-col items-center gap-6">
              <img
                alt="Director Portrait"
                className="w-20 h-20 rounded-full object-cover border-4 border-sc-surface-ctr-high"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBwfzOE23ms32dxWQzqJNwfPT1Gv3iDQHuaOMZIjkcwy77m7epSYW_oKnUlz5RLQQIS2dtmge3GiNxNmWpQyQ1o0S1ZpqYzxyuN-sMOVTwSvKp8cBVc6ppNJH088FBT4ZCbJ81BbCswROM2rlquZ6U2M3KLez4mSNg3AXEpgYximDwiWE2egzxEjqOrcriUb1lQSTY89XpUI1nwb61_iQqffV9oDwIUV-bkv90p7sePbQBNJvtCQVCFD4mWplMFND4VhwBOa_MuTzM"
              />
              <div>
                <p className="font-headline text-xl font-bold text-sc-on-bg">Dr. Elena Rodriguez</p>
                <p className="text-sc-on-surface-var font-label text-sm uppercase tracking-widest">Head of Science, Horizon Academy</p>
              </div>
              <div className="mt-4 flex items-center gap-2 opacity-60">
                <span className="material-symbols-outlined text-sc-sec">school</span>
                <span className="font-headline font-black text-lg">HORIZON ACADEMY</span>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Banner */}
        <section className="py-32 px-6">
          <div className="max-w-screen-xl mx-auto bg-gradient-to-br from-sc-pri-ctr to-sc-ter-ctr rounded-xl p-12 md:p-24 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 blur-[100px] rounded-full -mr-48 -mt-48"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/20 blur-[100px] rounded-full -ml-48 -mb-48"></div>
            <div className="relative z-10">
              <h2 className="font-headline text-4xl md:text-6xl font-extrabold text-white mb-8 tracking-tighter">Start Smart Homework for Free.</h2>
              <p className="text-white/80 text-xl max-w-2xl mx-auto mb-12">Join over 500 institutions worldwide already reducing their manual grading load and empowering students.</p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <button
                  onClick={() => navigate("/login")}
                  className="px-12 py-5 bg-white text-sc-pri-ctr font-headline text-lg font-bold rounded-xl transition-all hover:scale-105 hover:bg-sc-on-pri-ctr"
                >
                  Reduce Your Grading Load
                </button>
                <button className="px-12 py-5 bg-black/20 backdrop-blur-md border border-white/20 text-white font-headline text-lg font-bold rounded-xl transition-all hover:bg-black/30">
                  Book a Live Demo
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full rounded-t-[3rem] mt-24 bg-sc-surface-ctr-low">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 px-12 py-20 w-full">
          <div>
            <span className="text-lg font-black text-white block mb-6 font-headline">Smart Campus</span>
            <p className="text-slate-500 font-body text-sm leading-relaxed mb-6">The intelligent layer for the global homework and assessment cycle.</p>
            <div className="flex gap-4">
              <span className="material-symbols-outlined text-slate-500 hover:text-white cursor-pointer">public</span>
              <span className="material-symbols-outlined text-slate-500 hover:text-white cursor-pointer">share</span>
            </div>
          </div>
          <div>
            <span className="text-white font-bold block mb-6 font-headline">Features</span>
            <ul className="space-y-4">
              <li><a className="text-slate-500 hover:text-sc-ter underline-offset-4 hover:underline transition-opacity font-body text-sm" href="#">Assignment Creation</a></li>
              <li><a className="text-slate-500 hover:text-sc-ter underline-offset-4 hover:underline transition-opacity font-body text-sm" href="#">AI Grading</a></li>
              <li><a className="text-slate-500 hover:text-sc-ter underline-offset-4 hover:underline transition-opacity font-body text-sm" href="#">Handwriting Sync</a></li>
              <li><a className="text-slate-500 hover:text-sc-ter underline-offset-4 hover:underline transition-opacity font-body text-sm" href="#">Performance Tracking</a></li>
            </ul>
          </div>
          <div>
            <span className="text-white font-bold block mb-6 font-headline">Users</span>
            <ul className="space-y-4">
              <li><a className="text-slate-500 hover:text-sc-ter underline-offset-4 hover:underline transition-opacity font-body text-sm" href="#">For Teachers</a></li>
              <li><a className="text-slate-500 hover:text-sc-ter underline-offset-4 hover:underline transition-opacity font-body text-sm" href="#">For Students</a></li>
              <li><a className="text-slate-500 hover:text-sc-ter underline-offset-4 hover:underline transition-opacity font-body text-sm" href="#">For Parents</a></li>
              <li><a className="text-slate-500 hover:text-sc-ter underline-offset-4 hover:underline transition-opacity font-body text-sm" href="#">Pricing Plans</a></li>
            </ul>
          </div>
          <div>
            <span className="text-white font-bold block mb-6 font-headline">Support</span>
            <ul className="space-y-4">
              <li><a className="text-slate-500 hover:text-sc-ter underline-offset-4 hover:underline transition-opacity font-body text-sm" href="#">Documentation</a></li>
              <li><a className="text-slate-500 hover:text-sc-ter underline-offset-4 hover:underline transition-opacity font-body text-sm" href="#">Help Center</a></li>
              <li><a className="text-slate-500 hover:text-sc-ter underline-offset-4 hover:underline transition-opacity font-body text-sm" href="#">Privacy Policy</a></li>
              <li><a className="text-slate-500 hover:text-sc-ter underline-offset-4 hover:underline transition-opacity font-body text-sm" href="#">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="px-12 py-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 font-body text-sm">© 2024 Smart Campus AI. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="text-slate-500 font-body text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              System Status: Operational
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
