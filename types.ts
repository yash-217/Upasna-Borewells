// Re-export all types from the organized types folder
// This maintains backward compatibility with existing imports
export * from './types/index';

// Also export DB types for services that need them
export type {
  DBProduct,
  DBEmployee,
  DBServiceRequest,
  DBVehicle,
  DBExpense
} from './types/database';
