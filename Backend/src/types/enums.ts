// src/types/enums.ts

export const OrderStage = {
  QUOTATION: 'QUOTATION',
  PURCHASE: 'PURCHASE',
  CUTTING: 'CUTTING',
  FORGING: 'FORGING',
  MACHINING: 'MACHINING',
  HEAT_TREATMENT: 'HEAT_TREATMENT',
  TESTING: 'TESTING',
  DISPATCH: 'DISPATCH',
  COMPLETED: 'COMPLETED'
} as const;

export type OrderStage = typeof OrderStage[keyof typeof OrderStage];

export const Priority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT'
} as const;

export type Priority = typeof Priority[keyof typeof Priority];

export const TaskStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED'
} as const;

export type TaskStatus = typeof TaskStatus[keyof typeof TaskStatus];

export const Role = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  SALES: 'SALES',
  PURCHASE: 'PURCHASE',
  PRODUCTION: 'PRODUCTION',
  TESTING: 'TESTING'
} as const;

export type Role = typeof Role[keyof typeof Role];
