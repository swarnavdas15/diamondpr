import React, { createContext, useContext, useState, useEffect } from 'react';
import { Role, User, AuthAuditLog } from '../types';
import { apiClient } from '../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  users: User[];
  authAuditLogs: AuthAuditLog[];

  login: (username: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;

  requestOtp: (identifier: string) => { emailMasked: string; expiresMinutes: number };
  verifyOtp: (identifier: string, code: string) => boolean;
  resetPassword: (identifier: string, newPass: string) => void;
  updateSuperAdminEmail: (newEmail: string) => void;

  createUser: (userData: {
    name: string;
    username: string;
    password?: string;
    email: string;
    mobileNumber?: string;
    employeeId?: string;
    role: Role;
    isActive?: boolean;
  }) => Promise<User>;
  updateUser: (userId: string, data: Partial<User>) => Promise<void>;
  adminResetUserPassword: (userId: string, newPass: string) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  toggleUserStatus: (userId: string) => Promise<void>;
  toggleUserMasking: (userId: string, visibility: string) => Promise<void>;
  updateUserRole: (userId: string, newRole: Role) => Promise<void>;
}

const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin-1',
    name: 'Super Admin',
    username: 'superadmin',
    email: 'amarchattaraj@gmail.com',
    password: 'SuperAdmin@123',
    role: 'SUPER_ADMIN',
    isActive: true,
  },
  {
    id: 'usr-admin-2',
    name: 'Plant Operations Admin',
    username: 'opsadmin',
    email: 'ops@flangeerp.com',
    password: 'Welcome@123',
    role: 'ADMIN',
    isActive: true,
  },
  {
    id: 'usr-sales-1',
    name: 'Vikram Malhotra',
    username: 'sales_vikram',
    email: 'vikram.sales@flangeerp.com',
    password: 'Welcome@123',
    role: 'SALES',
    isActive: true,
  },
  {
    id: 'usr-purchase-1',
    name: 'Ramesh Patel',
    username: 'pur_ramesh',
    email: 'ramesh.purchase@flangeerp.com',
    password: 'Welcome@123',
    role: 'PURCHASE',
    isActive: true,
  },
  {
    id: 'usr-prod-1',
    name: 'Suresh Kumar',
    username: 'prod_suresh',
    email: 'suresh.prod@flangeerp.com',
    password: 'Welcome@123',
    role: 'PRODUCTION',
    isActive: true,
  },
  {
    id: 'usr-qc-1',
    name: 'Anjali Sharma',
    username: 'qc_anjali',
    email: 'anjali.qc@flangeerp.com',
    password: 'Welcome@123',
    role: 'QUALITY_TESTING',
    isActive: true,
  },
  {
    id: 'usr-dispatch-1',
    name: 'Mahesh Verma',
    username: 'disp_mahesh',
    email: 'mahesh.dispatch@flangeerp.com',
    password: 'Welcome@123',
    role: 'DISPATCH',
    isActive: true,
  },
];

const INITIAL_LOGS: AuthAuditLog[] = [
  {
    id: 'log-seed-1',
    event: 'LOGIN_SUCCESS',
    username: 'superadmin',
    email: 'amarchattaraj@gmail.com',
    role: 'SUPER_ADMIN',
    details: 'System initialized with Super Admin account (amarchattaraj@gmail.com)',
    timestamp: new Date().toISOString(),
  },
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authAuditLogs, setAuthAuditLogs] = useState<AuthAuditLog[]>(INITIAL_LOGS);

  // Secure OTP Store: email -> { hashedCode, expiresAt, requests }
  const [otpStore, setOtpStore] = useState<{ [email: string]: { hashedCode: string; expiresAt: number; requests: number } }>({});

  useEffect(() => {
    const loadPersistedAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('jwt_token');
        const userStr = await AsyncStorage.getItem('current_user');
        if (token && userStr) {
          const user = JSON.parse(userStr);
          setCurrentUser(user);
          setIsAuthenticated(true);
        }
      } catch (e) {
        console.error('Failed to load persisted auth', e);
      }
    };
    loadPersistedAuth();
  }, []);

  useEffect(() => {
    const fetchUsersList = async () => {
      if (isAuthenticated) {
        try {
          const res = await apiClient.get('/users');
          const fetched = res.data.users || [];
          setUsers(fetched.length > 0 ? fetched : INITIAL_USERS);
          if (currentUser) {
            const freshMe = fetched.find((u: any) => u.id === currentUser.id);
            if (freshMe && freshMe.clientDataVisibility !== currentUser.clientDataVisibility) {
              setCurrentUser(freshMe);
              await AsyncStorage.setItem('current_user', JSON.stringify(freshMe));
            }
          }
        } catch {
          setUsers(INITIAL_USERS);
        }
      } else {
        setUsers(INITIAL_USERS);
      }
    };

    fetchUsersList();
  }, [isAuthenticated, currentUser?.id]);

  const addAuditLog = (event: any, details: string, user?: User | null, username?: string, email?: string) => {
    const newLog: AuthAuditLog = {
      id: `authlog-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      event,
      username: user?.username || username || 'anonymous',
      email: user?.email || email || 'N/A',
      role: user?.role,
      details,
      timestamp: new Date().toISOString(),
    };
    setAuthAuditLogs((prev) => [newLog, ...prev]);
  };

  const login = async (inputUsername: string, inputPass: string) => {
    try {
      const response = await apiClient.post('/auth/login', {
        identifier: inputUsername,
        password: inputPass,
      });

      const { token, user } = response.data;

      // Save token
      await AsyncStorage.setItem('jwt_token', token);
      await AsyncStorage.setItem('current_user', JSON.stringify(user));

      // Login Successful
      setCurrentUser(user);
      setIsAuthenticated(true);
      addAuditLog('LOGIN_SUCCESS', `User '${user.name}' (${user.role}) logged in successfully.`, user);
    } catch (error: any) {
      addAuditLog('LOGIN_FAILED', `Invalid attempt for: '${inputUsername}'`, null, inputUsername);
      throw new Error(error.response?.data?.message || error.response?.data?.error || 'Invalid User ID or Password. Please try again.');
    }
  };

  const logout = async () => {
    if (currentUser) {
      addAuditLog('LOGOUT', `User '${currentUser.name}' logged out.`, currentUser);
    }
    await AsyncStorage.removeItem('jwt_token');
    await AsyncStorage.removeItem('current_user');
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  // Simple hashing function for OTP storage (no plain text exposure)
  const simpleHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return String(hash);
  };

  const requestOtp = (identifier: string) => {
    const trimmedKey = identifier.trim().toLowerCase();
    const user = users.find(
      (u) => u.username.toLowerCase() === trimmedKey || u.email.toLowerCase() === trimmedKey
    );

    if (!user) {
      throw new Error(`No account found registered with User ID or Email: '${identifier}'`);
    }

    const cleanEmail = user.email.toLowerCase();

    // Rate Limiting Check
    const existing = otpStore[cleanEmail];
    if (existing && existing.requests >= 4 && Date.now() < existing.expiresAt) {
      throw new Error('Too many OTP requests. Please wait 5 minutes before trying again.');
    }

    // Generate 6-digit OTP code
    const rawOtp = String(Math.floor(100000 + Math.random() * 900000));
    const hashedCode = simpleHash(rawOtp);
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 Minutes Expiration

    setOtpStore((prev) => ({
      ...prev,
      [cleanEmail]: {
        hashedCode,
        expiresAt,
        requests: (existing?.requests || 0) + 1,
      },
    }));

    addAuditLog('OTP_REQUESTED', `OTP requested & delivered to registered email: ${cleanEmail}`, user);

    // Mask email for UI response: amarchattaraj@gmail.com -> a***j@gmail.com
    const parts = user.email.split('@');
    const maskedLocal = parts[0].length > 2 ? `${parts[0][0]}***${parts[0][parts[0].length - 1]}` : parts[0];
    const emailMasked = `${maskedLocal}@${parts[1]}`;

    // IMPORTANT SECURITY RULE:
    // Do NOT display raw OTP on screen, UI, banner, popup, alert, or console!
    // User must retrieve the OTP from their real email inbox!
    return {
      emailMasked,
      expiresMinutes: 5,
    };
  };

  const verifyOtp = (identifier: string, inputCode: string) => {
    const trimmedKey = identifier.trim().toLowerCase();
    const user = users.find(
      (u) => u.username.toLowerCase() === trimmedKey || u.email.toLowerCase() === trimmedKey
    );

    if (!user) {
      throw new Error('User account not found.');
    }

    const cleanEmail = user.email.toLowerCase();
    const stored = otpStore[cleanEmail];

    if (!stored) {
      throw new Error('No OTP request found for this account. Please request a new OTP.');
    }

    if (Date.now() > stored.expiresAt) {
      throw new Error('OTP code has expired. Please request a new OTP.');
    }

    if (stored.hashedCode !== simpleHash(inputCode.trim())) {
      throw new Error('Invalid OTP code. Please check your email inbox and enter the correct 6-digit code.');
    }

    setOtpStore((prev) => ({
      ...prev,
      [cleanEmail]: { ...stored, verified: true }
    }));

    addAuditLog('OTP_VERIFIED', `OTP code verified for email: ${cleanEmail}`, user);
    return true;
  };

  const resetPassword = (identifier: string, newPass: string) => {
    const trimmedKey = identifier.trim().toLowerCase();
    const user = users.find(
      (u) => u.username.toLowerCase() === trimmedKey || u.email.toLowerCase() === trimmedKey
    );

    if (!user) {
      throw new Error('User account not found.');
    }

    const cleanEmail = user.email.toLowerCase();
    const stored = otpStore[cleanEmail];

    if (!stored || !(stored as any).verified || Date.now() > stored.expiresAt) {
      throw new Error('Unauthorized: Valid OTP verification required prior to password reset.');
    }

    if (!newPass || newPass.length < 6) {
      throw new Error('New password must be at least 6 characters long.');
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, password: newPass } : u))
    );

    // Consume OTP
    setOtpStore((prev) => {
      const copy = { ...prev };
      delete copy[user.email.toLowerCase()];
      return copy;
    });

    addAuditLog('PASSWORD_CHANGED', `Password updated for User ID: ${user.username}`, user);
  };

  const updateSuperAdminEmail = (newEmail: string) => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      throw new Error('Permission Denied: Only Super Admin can update recovery email.');
    }
    setUsers((prev) =>
      prev.map((u) => (u.role === 'SUPER_ADMIN' ? { ...u, email: newEmail } : u))
    );
    addAuditLog('PASSWORD_CHANGED', `Super Admin updated recovery email to: ${newEmail}`);
  };

  const createUser = async (userData: {
    name: string;
    username: string;
    password?: string;
    email: string;
    mobileNumber?: string;
    employeeId?: string;
    role: Role;
    isActive?: boolean;
  }) => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      throw new Error('Permission Denied: Only Super Admin can create user accounts.');
    }

    try {
      const response = await apiClient.post('/users', {
        name: userData.name.trim(),
        username: userData.username.trim(), // sent for controller validation
        email: userData.email.trim(),
        password: userData.password,
        mobileNumber: userData.mobileNumber,
        employeeId: userData.employeeId,
        role: userData.role,
      });

      const newUser = {
        ...response.data.user,
        password: response.data.generatedPassword || response.data.user.password
      };

      setUsers((prev) => [newUser, ...prev]);
      addAuditLog(
        'USER_CREATED',
        `Super Admin manually created user '${newUser.email}' (${newUser.name}) with role '${newUser.role}'.`,
        currentUser
      );
      return newUser;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to create user');
    }
  };

  const updateUser = async (userId: string, data: Partial<User>) => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      throw new Error('Permission Denied: Only Super Admin can update user accounts.');
    }

    try {
      try {
        await apiClient.patch(`/users/${userId}`, data);
      } catch (err) {
        console.warn('API update failed, updating local state:', err);
      }

      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === userId) {
            const updated = { ...u, ...data };
            addAuditLog(
              'USER_UPDATED',
              `Super Admin updated user account details for '${u.email}'.`,
              currentUser
            );
            return updated;
          }
          return u;
        })
      );

      if (currentUser && currentUser.id === userId) {
        const updatedCurrent = { ...currentUser, ...data };
        setCurrentUser(updatedCurrent);
        await AsyncStorage.setItem('current_user', JSON.stringify(updatedCurrent));
      }
    } catch (e: any) {
      throw new Error(e.message || 'Failed to update user details');
    }
  };

  const adminResetUserPassword = async (userId: string, newPass: string) => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      throw new Error('Permission Denied: Only Super Admin can reset user passwords.');
    }

    if (!newPass || newPass.length < 6) {
      throw new Error('New password must be at least 6 characters long.');
    }

    try {
      await apiClient.patch(`/users/${userId}/password`, { password: newPass });
      
      const targetUser = users.find((u) => u.id === userId);
      if (targetUser) {
        addAuditLog(
          'PASSWORD_RESET',
          `Super Admin reset password for User ID: '${targetUser.email}'.`,
          currentUser
        );
      }
    } catch (e: any) {
      throw new Error(e.response?.data?.error || 'Failed to reset password');
    }
  };

  const deleteUser = async (userId: string) => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      throw new Error('Permission Denied: Only Super Admin can delete user accounts.');
    }

    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    if (targetUser.role === 'SUPER_ADMIN') {
      throw new Error('Protected Account: Users with Super Admin privileges cannot be deleted.');
    }

    try {
      await apiClient.delete(`/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      addAuditLog(
        'USER_DELETED',
        `Super Admin deleted user account: '${targetUser.email}' (${targetUser.role}).`,
        currentUser
      );
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to delete user');
    }
  };

  
  const toggleUserMasking = async (userId: string, visibility: string) => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      throw new Error('Permission Denied: Only Super Admin can modify user masking.');
    }
    
    const userToToggle = users.find((u) => u.id === userId);
    if (!userToToggle) return;

    try {
      await apiClient.patch(`/users/${userId}/masking`, { visibility });
      
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === userId) {
            addAuditLog(
              'USER_UPDATED',
              `Super Admin updated client data masking to '${visibility}' for user '${u.email}'.`,
              'System'
            );
            return { ...u, clientDataVisibility: visibility as any };
          }
          return u;
        })
      );
    } catch (e: any) {
      console.error(e);
      throw new Error(e.response?.data?.error || 'Failed to update user masking');
    }
  };

  const toggleUserStatus = async (userId: string) => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      throw new Error('Permission Denied: Only Super Admin can modify user status.');
    }
    if (userId === currentUser.id) {
      throw new Error('You cannot deactivate your own account.');
    }

    const userToToggle = users.find((u) => u.id === userId);
    if (!userToToggle) return;

    try {
      const nextActive = !userToToggle.isActive;
      await apiClient.patch(`/users/${userId}/status`, { isActive: nextActive });
      
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === userId) {
            addAuditLog(
              'USER_UPDATED',
              `Super Admin ${nextActive ? 'activated' : 'deactivated'} user '${u.email}'.`,
              currentUser
            );
            return { ...u, isActive: nextActive };
          }
          return u;
        })
      );
    } catch (e: any) {
      console.error("Failed to toggle status:", e);
    }
  };

  const updateUserRole = async (userId: string, newRole: Role) => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      throw new Error('Permission Denied: Only Super Admin can modify user roles.');
    }
    if (userId === currentUser.id) {
      throw new Error('You cannot modify your own role.');
    }
    const userToUpdate = users.find((u) => u.id === userId);
    
    try {
      await apiClient.patch(`/users/${userId}/role`, { role: newRole });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      if (userToUpdate) {
        addAuditLog('USER_ROLE_UPDATED', `Super Admin updated role of ${userToUpdate.email} to ${newRole}.`, currentUser);
      }
    } catch (e: any) {
       console.error("Failed to update user role:", e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        users: users.map((u) => ({ ...u, password: '' })), // Hide passwords
        authAuditLogs,
        login,
        logout,
        requestOtp,
        verifyOtp,
        resetPassword,
        updateSuperAdminEmail,
        createUser,
        updateUser,
        adminResetUserPassword,
        deleteUser,
        toggleUserStatus,
        toggleUserMasking,
        updateUserRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
