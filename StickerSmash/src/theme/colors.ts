/**
 * Centralized Industrial ERP Color System & Status Tracking Theme
 */

export const Palette = {
  primaryLight: '#29585C',      // Accent teal for sublabels and titles in Light Mode
  secondary: '#4B7172',
  accentTeal: '#29585C',
  darkBlue: '#FFFFFF',          // Card container surface mapped to pure white in Light Mode
  primaryDark: '#F8FAFC',       // Application background mapped to light slate-50 in Light Mode
  industrialOrange: '#B34B20',
  highlightOrange: '#F86102',

  // Utility & Surface Colors (Light Mode Theme)
  white: '#FFFFFF',
  textLight: '#0F172A',       // Primary dark slate text for light mode
  textWhite: '#FFFFFF',       // White text for dark buttons & badges
  textMuted: '#334155',       // Slate-700 secondary text
  textSubtle: '#64748B',      // Slate-500 subtle caption text
  cardBg: '#FFFFFF',          // Crisp white surface for card containers
  bgDark: '#F8FAFC',          // Soft light slate background
  inputBg: '#F1F5F9',         // Input field background
  borderDark: '#E2E8F0',      // Crisp light border
  borderMuted: '#CBD5E1',     // Soft divider border
  overlay: 'rgba(15, 23, 42, 0.4)',

  // Status & Feedback Signals
  success: '#22C55E',
  successBright: '#22C55E',
  warning: '#FACC15',
  danger: '#EF4444',
  dangerBright: '#EF4444',
  info: '#29585C',
};

/**
 * STRICT PIPELINE STATUS COLOR SYSTEM
 * Green = Completed (#22C55E, text #FFFFFF, border #16A34A)
 * Yellow = In Progress (#FACC15, text #000000, border #EAB308)
 * Dark Gray / Black = Pending (#1F2937, text #FFFFFF, border #111827)
 */
export const StatusColors = {
  COMPLETED: {
    bg: '#22C55E',
    text: '#FFFFFF',
    border: '#16A34A',
  },
  IN_PROGRESS: {
    bg: '#FACC15',
    text: '#000000',
    border: '#EAB308',
  },
  PENDING: {
    bg: '#1F2937',
    text: '#FFFFFF',
    border: '#111827',
  },
  FAILED: {
    bg: '#EF4444',
    text: '#FFFFFF',
    border: '#DC2626',
  },
  PROGRESS_BAR: {
    completed: '#22C55E',
    active: '#FACC15',
    remaining: '#E2E8F0',
  },
  STEPPER: {
    completedCircle: '#22C55E',
    completedText: '#FFFFFF',
    completedConnector: '#22C55E',

    inProgressCircle: '#FACC15',
    inProgressText: '#000000',
    inProgressConnector: '#EAB308',

    pendingCircle: '#1F2937',
    pendingText: '#FFFFFF',
    pendingConnector: '#CBD5E1',
  },
};

export const Colors = {
  ...Palette,
  status: StatusColors,

  // Role Badges & Department Color Mappings
  roles: {
    SUPER_ADMIN: '#B34B20',      // Industrial Orange
    ADMIN: '#29585C',            // Accent Teal
    SALES: '#0284C7',            // Sky Blue
    PURCHASE: '#D97706',         // Industrial Amber
    PRODUCTION: '#B34B20',       // Industrial Orange
    QUALITY_TESTING: '#4B7172',  // Secondary Teal
    DISPATCH: '#29585C',         // Accent Teal
  },
};
