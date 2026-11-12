import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Role } from '../../types/user';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { getDefaultRouteForRole } from '../../utils/permissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { currentUser, isAuthenticated, checkInactivityTimeout, updateActivity } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isTimedOut, setIsTimedOut] = useState(false);

  // Inactivity tracking
  useEffect(() => {
    const handleUserActivity = () => {
      updateActivity();
    };

    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('click', handleUserActivity);

    const interval = setInterval(() => {
      if (checkInactivityTimeout()) {
        setIsTimedOut(true);
      }
    }, 30000); // check every 30s

    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
      clearInterval(interval);
    };
  }, [checkInactivityTimeout, updateActivity]);

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role authorization
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-red-200 shadow-xl text-center">
          <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Not Authorised</h2>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Your current role (<strong className="capitalize">{currentUser.role.replace('_', ' ')}</strong>) does not have clinical or administrative clearance to access this screen.
          </p>

          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={() => navigate(getDefaultRouteForRole(currentUser.role))}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-600 text-white font-semibold rounded-xl text-xs hover:bg-brand-700 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Your Role Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
