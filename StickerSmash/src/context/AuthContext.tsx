import React, { createContext, useContext, useState } from 'react';
import { Role, User, AuthAuditLog, VisibilityPreset } from '../types';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  users: User[];
  authAuditLogs: AuthAuditLog[];

  login: (username: string, pass: string) => void;
  logout: () => void;

  requestOtp: (identifier: string) => { emailMasked: string; expiresMinutes: number };
  verifyOtp: (identifier: string, code: string) => boolean;
  resetPassword: (identifier: string, newPass: string) => void;
  updateSuperAdminEmail: (newEmail: string) => void;

  createUser: (userData: {
    name: string;
    username: string;
    password: string;
    email: string;
    mobileNumber?: string;
    employeeId?: string;
    role: Role;
    isActive?: boolean;
    canViewClientDetails?: boolean;
    canViewQuotationAmount?: boolean;
  }) => User;
  updateUser: (userId: string, data: Partial<User>) => void;
  adminResetUserPassword: (userId: string, newPass: string) => void;
  deleteUser: (userId: string) => void;
  toggleUserStatus: (userId: string) => void;
  updateUserRole: (userId: string, newRole: Role) => void;

  // Super Admin Granular Visibility Controls (Client Name, Quotation Amount, 4-Way Presets)
  setUserClientAccess: (userId: string, allowed: boolean) => void;
  toggleUserClientAccess: (userId: string) => void;
  setUserAmountAccess: (userId: string, allowed: boolean) => void;
  toggleUserAmountAccess: (userId: string) => void;
  setUserVisibilityPreset: (userId: string, preset: VisibilityPreset) => void;
  setBulkUserClientAccess: (allowed: boolean, filterRoles?: Role[]) => void;
  setBulkUserAmountAccess: (allowed: boolean, filterRoles?: Role[]) => void;
  setBulkVisibilityPreset: (preset: VisibilityPreset, filterRoles?: Role[]) => void;
  resetClientAccessToDefaults: () => void;
  hasClientAccess: (user?: User | null) => boolean;
  hasAmountAccess: (user?: User | null) => boolean;
  getUserPreset: (user?: User | null) => VisibilityPreset;
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
    canViewClientDetails: true,
    canViewQuotationAmount: true,
  },
  {
    id: 'usr-admin-2',
    name: 'Plant Operations Admin',
    username: 'opsadmin',
    email: 'ops@flangeerp.com',
    password: 'Welcome@123',
    role: 'ADMIN',
    isActive: true,
    canViewClientDetails: true,
    canViewQuotationAmount: true,
  },
  {
    id: 'usr-sales-1',
    name: 'Vikram Malhotra',
    username: 'sales_vikram',
    email: 'vikram.sales@flangeerp.com',
    password: 'Welcome@123',
    role: 'SALES',
    isActive: true,
    canViewClientDetails: true,
    canViewQuotationAmount: true,
  },
  {
    id: 'usr-purchase-1',
    name: 'Ramesh Patel',
    username: 'pur_ramesh',
    email: 'ramesh.purchase@flangeerp.com',
    password: 'Welcome@123',
    role: 'PURCHASE',
    isActive: true,
    canViewClientDetails: false,
    canViewQuotationAmount: false,
  },
  {
    id: 'usr-prod-1',
    name: 'Suresh Kumar',
    username: 'prod_suresh',
    email: 'suresh.prod@flangeerp.com',
    password: 'Welcome@123',
    role: 'PRODUCTION',
    isActive: true,
    canViewClientDetails: false,
    canViewQuotationAmount: false,
  },
  {
    id: 'usr-qc-1',
    name: 'Anjali Sharma',
    username: 'qc_anjali',
    email: 'anjali.qc@flangeerp.com',
    password: 'Welcome@123',
    role: 'QUALITY_TESTING',
    isActive: true,
    canViewClientDetails: false,
    canViewQuotationAmount: false,
  },
  {
    id: 'usr-dispatch-1',
    name: 'Mahesh Verma',
    username: 'disp_mahesh',
    email: 'mahesh.dispatch@flangeerp.com',
    password: 'Welcome@123',
    role: 'DISPATCH',
    isActive: true,
    canViewClientDetails: false,
    canViewQuotationAmount: false,
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
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authAuditLogs, setAuthAuditLogs] = useState<AuthAuditLog[]>(INITIAL_LOGS);

  // Secure OTP Store: email -> { hashedCode, expiresAt, requests }
  const [otpStore, setOtpStore] = useState<{ [email: string]: { hashedCode: string; expiresAt: number; requests: number } }>({});

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

  const login = (inputUsername: string, inputPass: string) => {
    const trimmedUser = inputUsername.trim().toLowerCase();
    const user = users.find(
      (u) => u.username.toLowerCase() === trimmedUser || u.email.toLowerCase() === trimmedUser
    );

    if (!user) {
      addAuditLog('LOGIN_FAILED', `Invalid User ID or Password attempt for: '${inputUsername}'`, null, inputUsername);
      throw new Error('Invalid User ID or Password. Please try again.');
    }

    if (!user.isActive) {
      addAuditLog('LOGIN_FAILED', `Login attempt on deactivated account: '${user.username}'`, user);
      throw new Error('Your account has been deactivated. Please contact Super Admin.');
    }

    if (user.password !== inputPass) {
      addAuditLog('LOGIN_FAILED', `Incorrect password attempt for User ID: '${user.username}'`, user);
      throw new Error('Invalid User ID or Password. Please try again.');
    }

    // Login Successful
    setCurrentUser(user);
    setIsAuthenticated(true);
    addAuditLog('LOGIN_SUCCESS', `User '${user.name}' (${user.role}) logged in successfully.`, user);
  };

  const logout = () => {
    if (currentUser) {
      addAuditLog('LOGOUT', `User '${currentUser.name}' logged out.`, currentUser);
    }
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
    setUsers((prev) =>
      prev.map((u) => (u.role === 'SUPER_ADMIN' ? { ...u, email: newEmail } : u))
    );
    addAuditLog('PASSWORD_CHANGED', `Super Admin updated recovery email to: ${newEmail}`);
  };

  const createUser = (userData: {
    name: string;
    username: string;
    password: string;
    email: string;
    mobileNumber?: string;
    employeeId?: string;
    role: Role;
    isActive?: boolean;
  }) => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      throw new Error('Permission Denied: Only Super Admin can create user accounts.');
    }

    const cleanUsername = userData.username.trim();
    if (!cleanUsername) {
      throw new Error('Username is required.');
    }

    // Check Username Uniqueness (Case-Insensitive)
    const existingUser = users.find(
      (u) => u.username.toLowerCase() === cleanUsername.toLowerCase()
    );
    if (existingUser) {
      throw new Error(`Username '${cleanUsername}' is already taken. Please enter a unique Username.`);
    }

    if (!userData.password || userData.password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: userData.name.trim(),
      username: cleanUsername,
      email: userData.email.trim(),
      mobileNumber: userData.mobileNumber ? userData.mobileNumber.trim() : undefined,
      employeeId: userData.employeeId ? userData.employeeId.trim() : undefined,
      password: userData.password,
      role: userData.role,
      isActive: userData.isActive !== undefined ? userData.isActive : true,
      canViewClientDetails: userData.canViewClientDetails !== undefined ? userData.canViewClientDetails : ['SUPER_ADMIN', 'ADMIN', 'SALES'].includes(userData.role),
      canViewQuotationAmount: userData.canViewQuotationAmount !== undefined ? userData.canViewQuotationAmount : ['SUPER_ADMIN', 'ADMIN', 'SALES'].includes(userData.role),
      createdAt: new Date().toISOString(),
    };

    setUsers((prev) => [newUser, ...prev]);
    addAuditLog(
      'USER_CREATED',
      `Super Admin manually created user '${newUser.username}' (${newUser.name}) with role '${newUser.role}'.`,
      currentUser
    );
    return newUser;
  };

  const updateUser = (userId: string, data: Partial<User>) => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      throw new Error('Permission Denied: Only Super Admin can update user accounts.');
    }

    if (data.username) {
      const cleanUser = data.username.trim();
      const conflict = users.find(
        (u) => u.id !== userId && u.username.toLowerCase() === cleanUser.toLowerCase()
      );
      if (conflict) {
        throw new Error(`Username '${cleanUser}' is already taken by another account.`);
      }
    }

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updated = { ...u, ...data };
          addAuditLog(
            'USER_UPDATED',
            `Super Admin updated user account details for '${u.username}'.`,
            currentUser
          );
          return updated;
        }
        return u;
      })
    );
  };

  const adminResetUserPassword = (userId: string, newPass: string) => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      throw new Error('Permission Denied: Only Super Admin can reset user passwords.');
    }

    if (!newPass || newPass.length < 6) {
      throw new Error('New password must be at least 6 characters long.');
    }

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          addAuditLog(
            'PASSWORD_RESET',
            `Super Admin reset password for User ID: '${u.username}'.`,
            currentUser
          );
          return { ...u, password: newPass };
        }
        return u;
      })
    );
  };

  const deleteUser = (userId: string) => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      throw new Error('Permission Denied: Only Super Admin can delete user accounts.');
    }

    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    if (targetUser.username.toLowerCase() === 'superadmin') {
      throw new Error('Protected Account: The primary Super Admin account cannot be deleted.');
    }

    setUsers((prev) => prev.filter((u) => u.id !== userId));
    addAuditLog(
      'USER_DELETED',
      `Super Admin deleted user account: '${targetUser.username}' (${targetUser.role}).`,
      currentUser
    );
  };

  const toggleUserStatus = (userId: string) => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      throw new Error('Permission Denied: Only Super Admin can modify user status.');
    }
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const nextActive = !u.isActive;
          addAuditLog(
            'USER_UPDATED',
            `Super Admin ${nextActive ? 'activated' : 'deactivated'} user '${u.username}'.`,
            currentUser
          );
          return { ...u, isActive: nextActive };
        }
        return u;
      })
    );
  };

  const updateUserRole = (userId: string, newRole: Role) => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      throw new Error('Permission Denied: Only Super Admin can modify user roles.');
    }
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
  };

  /**
   * Super Admin Granular Visibility Controls (Client Name & Quotation Amount)
   */
  const hasClientAccess = (user?: User | null): boolean => {
    const target = user || currentUser;
    if (!target) return false;
    if (target.role === 'SUPER_ADMIN') return true;
    if (target.canViewClientDetails !== undefined) {
      return !!target.canViewClientDetails;
    }
    return ['SUPER_ADMIN', 'ADMIN', 'SALES'].includes(target.role);
  };

  const hasAmountAccess = (user?: User | null): boolean => {
    const target = user || currentUser;
    if (!target) return false;
    if (target.role === 'SUPER_ADMIN') return true;
    if (target.canViewQuotationAmount !== undefined) {
      return !!target.canViewQuotationAmount;
    }
    return ['SUPER_ADMIN', 'ADMIN', 'SALES'].includes(target.role);
  };

  const getUserPreset = (user?: User | null): VisibilityPreset => {
    const canSeeClient = hasClientAccess(user);
    const canSeeAmount = hasAmountAccess(user);
    if (canSeeClient && canSeeAmount) return 'BOTH';
    if (canSeeClient && !canSeeAmount) return 'NAME_ONLY';
    if (!canSeeClient && canSeeAmount) return 'AMOUNT_ONLY';
    return 'NONE';
  };

  const setUserClientAccess = (userId: string, allowed: boolean) => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      throw new Error('Permission Denied: Only Super Admin has authority to grant or revoke client details visibility.');
    }

    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    if (targetUser.role === 'SUPER_ADMIN') {
      throw new Error('Super Admin always has full access to client details.');
    }

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return { ...u, canViewClientDetails: allowed };
        }
        return u;
      })
    );

    if (currentUser.id === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, canViewClientDetails: allowed } : null));
    }

    addAuditLog(
      'CLIENT_ACCESS_UPDATED',
      `Super Admin ${currentUser.name} (${currentUser.username}) ${allowed ? 'GRANTED' : 'REVOKED'} client details visibility for user '${targetUser.username}' (${targetUser.name}, ${targetUser.role}).`,
      currentUser
    );
  };

  const setUserAmountAccess = (userId: string, allowed: boolean) => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      throw new Error('Permission Denied: Only Super Admin has authority to grant or revoke quotation amount visibility.');
    }

    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    if (targetUser.role === 'SUPER_ADMIN') {
      throw new Error('Super Admin always has full access to quotation amounts.');
    }

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return { ...u, canViewQuotationAmount: allowed };
        }
        return u;
      })
    );

    if (currentUser.id === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, canViewQuotationAmount: allowed } : null));
    }

    addAuditLog(
      'QUOTATION_ACCESS_UPDATED',
      `Super Admin ${currentUser.name} (${currentUser.username}) ${allowed ? 'GRANTED' : 'REVOKED'} quotation amount visibility for user '${targetUser.username}' (${targetUser.name}, ${targetUser.role}).`,
      currentUser
    );
  };

  const setUserVisibilityPreset = (userId: string, preset: VisibilityPreset) => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      throw new Error('Permission Denied: Only Super Admin can modify visibility presets.');
    }

    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    if (targetUser.role === 'SUPER_ADMIN') {
      throw new Error('Super Admin always has full access.');
    }

    const clientAllowed = preset === 'BOTH' || preset === 'NAME_ONLY';
    const amountAllowed = preset === 'BOTH' || preset === 'AMOUNT_ONLY';

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return {
            ...u,
            canViewClientDetails: clientAllowed,
            canViewQuotationAmount: amountAllowed,
          };
        }
        return u;
      })
    );

    if (currentUser.id === userId) {
      setCurrentUser((prev) =>
        prev
          ? {
              ...prev,
              canViewClientDetails: clientAllowed,
              canViewQuotationAmount: amountAllowed,
            }
          : null
      );
    }

    addAuditLog(
      'VISIBILITY_PRESET_UPDATED',
      `Super Admin ${currentUser.name} updated visibility preset for '${targetUser.username}' (${targetUser.name}) to '${preset}' (Client: ${clientAllowed ? 'Visible' : 'Masked'}, Quotation Amount: ${amountAllowed ? 'Visible' : 'Masked'}).`,
      currentUser
    );
  };

  const toggleUserClientAccess = (userId: string) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;
    const currentAccess = hasClientAccess(targetUser);
    setUserClientAccess(userId, !currentAccess);
  };

  const toggleUserAmountAccess = (userId: string) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;
    const currentAccess = hasAmountAccess(targetUser);
    setUserAmountAccess(userId, !currentAccess);
  };

  const setBulkUserClientAccess = (allowed: boolean, filterRoles?: Role[]) => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      throw new Error('Permission Denied: Only Super Admin can modify bulk permissions.');
    }

    setUsers((prev) =>
      prev.map((u) => {
        if (u.role === 'SUPER_ADMIN') return u;
        if (filterRoles && !filterRoles.includes(u.role)) return u;
        return { ...u, canViewClientDetails: allowed };
      })
    );

    addAuditLog(
      'PERMISSION_CHANGED',
      `Super Admin ${currentUser.name} bulk ${allowed ? 'GRANTED' : 'REVOKED'} client details visibility for ${filterRoles ? filterRoles.join(', ') : 'all users'}.`,
      currentUser
    );
  };

  const setBulkUserAmountAccess = (allowed: boolean, filterRoles?: Role[]) => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      throw new Error('Permission Denied: Only Super Admin can modify bulk permissions.');
    }

    setUsers((prev) =>
      prev.map((u) => {
        if (u.role === 'SUPER_ADMIN') return u;
        if (filterRoles && !filterRoles.includes(u.role)) return u;
        return { ...u, canViewQuotationAmount: allowed };
      })
    );

    addAuditLog(
      'PERMISSION_CHANGED',
      `Super Admin ${currentUser.name} bulk ${allowed ? 'GRANTED' : 'REVOKED'} quotation amount visibility for ${filterRoles ? filterRoles.join(', ') : 'all users'}.`,
      currentUser
    );
  };

  const setBulkVisibilityPreset = (preset: VisibilityPreset, filterRoles?: Role[]) => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      throw new Error('Permission Denied: Only Super Admin can modify bulk permissions.');
    }

    const clientAllowed = preset === 'BOTH' || preset === 'NAME_ONLY';
    const amountAllowed = preset === 'BOTH' || preset === 'AMOUNT_ONLY';

    setUsers((prev) =>
      prev.map((u) => {
        if (u.role === 'SUPER_ADMIN') return u;
        if (filterRoles && !filterRoles.includes(u.role)) return u;
        return {
          ...u,
          canViewClientDetails: clientAllowed,
          canViewQuotationAmount: amountAllowed,
        };
      })
    );

    addAuditLog(
      'VISIBILITY_PRESET_UPDATED',
      `Super Admin ${currentUser.name} bulk applied visibility preset '${preset}' (Client: ${clientAllowed ? 'Visible' : 'Masked'}, Quotation Amount: ${amountAllowed ? 'Visible' : 'Masked'}) for ${filterRoles ? filterRoles.join(', ') : 'all non-superadmin users'}.`,
      currentUser
    );
  };

  const resetClientAccessToDefaults = () => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      throw new Error('Permission Denied: Only Super Admin can reset permissions.');
    }

    setUsers((prev) =>
      prev.map((u) => {
        const defaultAllowed = ['SUPER_ADMIN', 'ADMIN', 'SALES'].includes(u.role);
        return {
          ...u,
          canViewClientDetails: defaultAllowed,
          canViewQuotationAmount: defaultAllowed,
        };
      })
    );

    addAuditLog(
      'PERMISSION_CHANGED',
      `Super Admin ${currentUser.name} reset all user client data and quotation amount visibility to standard role defaults.`,
      currentUser
    );
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        users,
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
        updateUserRole,
        setUserClientAccess,
        toggleUserClientAccess,
        setUserAmountAccess,
        toggleUserAmountAccess,
        setUserVisibilityPreset,
        setBulkUserClientAccess,
        setBulkUserAmountAccess,
        setBulkVisibilityPreset,
        resetClientAccessToDefaults,
        hasClientAccess,
        hasAmountAccess,
        getUserPreset,
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
