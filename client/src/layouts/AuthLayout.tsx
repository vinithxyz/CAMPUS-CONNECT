import { Outlet } from 'react-router-dom';
import { MapPin } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-[#f4f7fb] flex items-center justify-center p-3 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-[0_10px_35px_-5px_rgba(11,37,69,0.08)] border border-slate-100 overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Left Navy Panel */}
        <div className="relative bg-[#0b2545] p-6 sm:p-8 lg:p-12 flex flex-col justify-between overflow-hidden">
          {/* Top Brand & Slogan */}
          <div className="relative z-10 text-center md:text-left">
            <div className="inline-flex w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-500 items-center justify-center text-white shadow-lg mb-2 sm:mb-4">
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6 fill-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">CampusConnect</h1>
            <p className="text-xs sm:text-sm text-blue-200/80 font-medium tracking-wide mt-1 sm:mt-2">
              Report &nbsp;•&nbsp; Track &nbsp;•&nbsp; Improve
            </p>
          </div>

          {/* Campus photo aesthetic: Hidden on small phones to keep inputs visible, shown on md and larger */}
          <div className="relative z-0 mt-6 rounded-xl overflow-hidden border border-white/10 shadow-2xl aspect-video md:aspect-[4/3] hidden md:block">
            <img
              src="/images/campus-hero.jpg"
              alt="Campus"
              className="w-full h-full object-cover brightness-90 contrast-105"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            {/* Fade overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b2545] via-transparent to-transparent opacity-60" />
          </div>

          {/* Subtle background glow */}
          <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Right Form Container */}
        <div className="p-6 sm:p-8 lg:p-12 flex flex-col justify-center">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
