import { useNavigate, Link } from 'react-router-dom';
import { Camera, RefreshCw, Layers, ArrowRight, ShieldCheck, MapPin } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-900 text-white relative flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-[92vh] flex items-center justify-center px-6 lg:px-12 pt-24 pb-16 overflow-hidden">
        {/* Background Image with Navy Gradient Overlays */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/campus-hero.jpg"
            alt="Campus"
            className="w-full h-full object-cover brightness-[0.4] contrast-110"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#081a33]/95 via-[#0b2545]/85 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold backdrop-blur-xs">
              <MapPin className="w-3.5 h-3.5" />
              <span>Campus Problem Reporting & Heat Map</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-white">
              A Smarter Campus <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300">
                for a Better Tomorrow
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-xl font-normal leading-relaxed">
              Report campus issues, track progress, and help us build a safer, cleaner and better
              campus — together.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                onClick={() => navigate(user ? '/report' : '/login')}
                className="w-full sm:w-auto px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 group"
              >
                <span>Report an Issue</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => navigate('/map')}
                className="w-full sm:w-auto px-6 py-3.5 border border-white/30 hover:border-white hover:bg-white/10 text-white rounded-xl font-semibold text-sm backdrop-blur-xs transition text-center"
              >
                View Campus Map
              </button>
            </div>
          </div>

          {/* Right Column: Floating Feature Card matching PDF page 1 */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="bg-white rounded-2xl p-5 sm:p-7 text-slate-800 shadow-2xl border border-white/20 max-w-md w-full space-y-4 sm:space-y-6 backdrop-blur-md">
              {/* Feature 1 */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Report Problems</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Quickly report issues with photos and precise campus map location.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Track Progress</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Get real-time updates and status timeline history on your complaints.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">See Heat Map</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Find problem areas across campus with density insights and visual analytics.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About / How It Works Section */}
      <section id="about" className="bg-white text-slate-800 py-20 px-6 lg:px-12 border-t border-slate-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Simple & Transparent
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-2">
              How CampusConnect Works
            </h2>
            <p className="text-sm text-slate-500 mt-3">
              Empowering students and campus maintenance teams to resolve facilities issues
              quickly and efficiently.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center mx-auto mb-4">
                1
              </div>
              <h3 className="font-bold text-slate-800 text-base mb-2">Spot & Snap</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Notice a broken pipe, flickering light, or damaged desk? Take a photo and pinpoint the building.
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 font-bold flex items-center justify-center mx-auto mb-4">
                2
              </div>
              <h3 className="font-bold text-slate-800 text-base mb-2">Track Resolution</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Receive notifications when staff reviews, assigns, and resolves your complaint.
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 font-bold flex items-center justify-center mx-auto mb-4">
                3
              </div>
              <h3 className="font-bold text-slate-800 text-base mb-2">Heat Map Insights</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Campus administration identifies recurring maintenance zones to prioritize repairs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-8 px-6 border-t border-slate-800 text-center text-xs">
        <p>© 2026 CampusConnect. Built for better campus infrastructure and student well-being.</p>
      </footer>
    </div>
  );
}
