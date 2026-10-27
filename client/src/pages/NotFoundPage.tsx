import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#f4f7fb] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
        <Compass className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-extrabold text-slate-800">404</h1>
      <p className="text-base font-semibold text-slate-700 mt-2">Page Not Found</p>
      <p className="text-xs text-slate-400 mt-1 max-w-sm">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        to="/"
        className="mt-6 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition inline-flex items-center gap-2"
      >
        <Home className="w-4 h-4" />
        <span>Return to CampusConnect</span>
      </Link>
    </div>
  );
}
