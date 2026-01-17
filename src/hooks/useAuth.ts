import { useState, useEffect } from 'react';
import { AsyncStorage } from 'react-native'; // ຫຼືໃຊ້ @react-native-async-storage/async-storage

// ປະເພດສິດທັງໝົດ
export type PermissionType = 'canEditProduct' | 'canDeleteProduct' | 'canViewReports' | 'canManageUsers' | 'canSell';

interface User {
  id: string;
  name: string;
  role: 'admin' | 'staff';
  permissions?: Record<PermissionType, boolean>;
}

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // ຟັງຊັນກວດສອບສິດ
  const hasPermission = (permission: PermissionType): boolean => {
    if (!currentUser) return false;
    // ຖ້າເປັນ admin ໃຫ້ຜ່ານຕະຫຼອດ
    if (currentUser.role === 'admin') return true;
    // ຖ້າເປັນ staff ໃຫ້ກວດຕາມ list permissions
    return currentUser.permissions?.[permission] ?? false;
  };

  return { currentUser, hasPermission, setCurrentUser };
}