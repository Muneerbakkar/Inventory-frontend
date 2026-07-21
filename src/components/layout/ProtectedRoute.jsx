import { Navigate, useLocation } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import toast from 'react-hot-toast';
import { useEffect } from 'react';

export const ProtectedRoute = ({ children, requiredPermission }) => {
  const { hasPermission } = usePermissions();
  const location = useLocation();

  const isAuthorized = hasPermission(requiredPermission);

  useEffect(() => {
    if (!isAuthorized) {
      toast.error("You don't have permission to access this page.", { id: 'permission-denied' });
    }
  }, [isAuthorized]);

  if (!isAuthorized) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return children;
};
