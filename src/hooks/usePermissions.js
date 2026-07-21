import { useSelector } from 'react-redux';

export const usePermissions = () => {
  const { user } = useSelector((state) => state.auth);

  const hasPermission = (permission) => {
    if (!user) return false;
    
    // SuperAdmin bypasses all permission checks
    if (user.role === 'SuperAdmin') return true;

    // Check if the user has the specific permission
    return user.permissions?.includes(permission) || false;
  };

  const hasAnyPermission = (permissionsArray) => {
    if (!user) return false;
    if (user.role === 'SuperAdmin') return true;
    
    return permissionsArray.some((perm) => user.permissions?.includes(perm));
  };

  return { hasPermission, hasAnyPermission };
};
