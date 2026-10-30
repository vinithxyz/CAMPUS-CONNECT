import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { loginSchema, type LoginForm } from '../schemas/authSchemas';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';

export default function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotModal, setForgotModal] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: '',
      password: '',
      remember: true,
    },
  });

  const onSubmit = async (values: LoginForm) => {
    try {
      setLoading(true);
      const u = await login(values);
      toast.success('Logged in successfully');
      navigate(
        (location.state as { from?: { pathname: string } })?.from?.pathname ??
          (u.role === 'student' ? '/dashboard' : '/admin'),
        { replace: true }
      );
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto space-y-6">
      {/* Heading */}
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome Back!</h2>
        <p className="text-xs text-slate-500 font-medium">Login to your account</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Identifier Field */}
        <div className="space-y-1.5">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              {...register('identifier')}
              type="text"
              placeholder="Email or Roll Number"
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>
          {errors.identifier && (
            <p className="text-[11px] text-rose-500 font-medium pl-1">
              {errors.identifier.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-[11px] text-rose-500 font-medium pl-1">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Remember me & Forgot password */}
        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
            <input
              {...register('remember')}
              type="checkbox"
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <span>Remember me</span>
          </label>

          <button
            type="button"
            onClick={() => setForgotModal(true)}
            className="text-blue-600 hover:text-blue-700 font-medium hover:underline text-xs"
          >
            Forgot password?
          </button>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-xs font-semibold shadow-sm shadow-blue-500/20 transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Logging in...</span>
            </>
          ) : (
            <span>Login</span>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-[11px] uppercase">
          <span className="bg-white px-3 text-slate-400 font-medium">OR</span>
        </div>
      </div>

      {/* Google Login Button */}
      <button
        type="button"
        onClick={() => {
          toast.info('Google OAuth requires configuring VITE_GOOGLE_CLIENT_ID in .env. Use demo credentials to login.');
        }}
        className="w-full py-2.5 px-4 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2.5 shadow-2xs"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path
            fill="#EA4335"
            d="M12 5c1.57 0 2.98.57 4.09 1.51l3.07-3.07C17.29 1.7 14.82 1 12 1 7.42 1 3.51 3.6 1.63 7.37l3.68 2.85C6.19 7.33 8.87 5 12 5z"
          />
          <path
            fill="#4285F4"
            d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.71 2.88c2.16-2 3.71-4.94 3.71-8.7z"
          />
          <path
            fill="#FBBC05"
            d="M5.31 14.78c-.24-.71-.38-1.47-.38-2.26s.14-1.55.38-2.26L1.63 7.41C.59 9.47 0 11.66 0 14.21s.59 4.74 1.63 6.8l3.68-2.85c-.01-.01 0-.01 0-.01z"
          />
          <path
            fill="#34A853"
            d="M12 23.42c3.24 0 5.95-1.07 7.94-2.91l-3.71-2.88c-1.08.73-2.46 1.16-4.23 1.16-3.13 0-5.81-2.33-6.69-5.22L1.63 16.42C3.51 20.2 7.42 22.8 12 22.8z"
          />
        </svg>
        <span>Login with Google</span>
      </button>

      {/* Demo helper */}
      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] text-slate-500 text-center space-y-1">
        <div>Student: <span className="font-semibold text-slate-700">user123@example.edu</span> / <span className="font-semibold text-slate-700">Password@123</span></div>
        <div>Admin: <span className="font-semibold text-slate-700">admin@example.edu</span> / <span className="font-semibold text-slate-700">Admin@12345</span></div>
        <div>Staff: <span className="font-semibold text-slate-700">staff@example.edu</span> / <span className="font-semibold text-slate-700">Staff@12345</span></div>
      </div>

      {/* Sign Up Link */}
      <p className="text-center text-xs text-slate-500">
        Don't have an account?{' '}
        <Link to="/register" className="font-semibold text-blue-600 hover:underline">
          Sign Up
        </Link>
      </p>

      {/* Forgot Password Modal */}
      {forgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-800">Password Reset</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              To reset your password, please contact your campus IT administrator or administration
              office with your registered roll number.
            </p>
            <button
              onClick={() => setForgotModal(false)}
              className="w-full py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
