import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Lock, User, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { getDefaultRouteForRole } from '../utils/permissions';
import { useToast } from '../components/common/Toast';

export const Login: React.FC = () => {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();

  const [username, setUsername] = useState('nurse');
  const [password, setPassword] = useState('nurse123');
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const res = login(username, password);
    if (res.success) {
      const user = useAuthStore.getState().currentUser;
      if (user) {
        toast.success(`Welcome, ${user.name}`, `Signed in as ${user.title}`);
        navigate(getDefaultRouteForRole(user.role));
      }
    } else {
      setErrorMessage(res.message || 'Invalid username or password.');
    }
  };

  const handleQuickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    const res = login(u, p);
    if (res.success) {
      const user = useAuthStore.getState().currentUser;
      if (user) {
        toast.success(`Welcome, ${user.name}`, `Signed in as ${user.title}`);
        navigate(getDefaultRouteForRole(user.role));
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Icon */}
        <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-brand-500/30">
          <Activity className="w-8 h-8" />
        </div>
        <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          QuarantineCare
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-600 font-medium">
          Smarter Patient Care. Better Facility Management.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-200 sm:px-10">
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Username
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  placeholder="Enter username..."
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  placeholder="Enter password..."
                />
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition duration-150"
            >
              <span>Sign In to Facility System</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Assessment Demo Credentials Box */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-1.5 mb-3">
              <ShieldCheck className="w-4 h-4 text-brand-600" />
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Assessment Demo Credentials
              </h4>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              Click any role to auto-fill credentials and sign in immediately:
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('nurse', 'nurse123')}
                className="p-2.5 bg-slate-50 hover:bg-teal-50 hover:border-teal-300 border border-slate-200 rounded-xl text-left transition"
              >
                <div className="font-bold text-teal-800">Nurse</div>
                <div className="text-[11px] text-slate-500">nurse / nurse123</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('doctor', 'doctor123')}
                className="p-2.5 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 border border-slate-200 rounded-xl text-left transition"
              >
                <div className="font-bold text-blue-800">Doctor</div>
                <div className="text-[11px] text-slate-500">doctor / doctor123</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin123')}
                className="p-2.5 bg-slate-50 hover:bg-purple-50 hover:border-purple-300 border border-slate-200 rounded-xl text-left transition"
              >
                <div className="font-bold text-purple-800">Admin</div>
                <div className="text-[11px] text-slate-500">admin / admin123</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('head', 'head123')}
                className="p-2.5 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 border border-slate-200 rounded-xl text-left transition"
              >
                <div className="font-bold text-indigo-800">Head Doctor</div>
                <div className="text-[11px] text-slate-500">head / head123</div>
              </button>
            </div>
          </div>
        </div>

        {/* Enterprise Compliance Notice */}
        <p className="mt-4 text-center text-[11px] text-slate-400">
          QuarantineCare Hospital Information System (HIS) & Viral Containment Platform.
          <br />
          Enterprise Clinical Compliance • Real-Time Vitals Tracking • High-Availability Operations.
        </p>
      </div>
    </div>
  );
};
