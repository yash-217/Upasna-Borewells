/**
 * Error handling utilities for consistent error management across the app
 */

/**
 * Extracts a user-friendly error message from various error types
 */
export function getErrorMessage(error: unknown): string {
    // Supabase errors
    if (error && typeof error === 'object' && 'message' in error) {
        const msg = (error as { message: string }).message;

        // Map common Supabase/Postgres errors to user-friendly messages
        if (msg.includes('duplicate key')) {
            return 'This record already exists';
        }
        if (msg.includes('foreign key')) {
            return 'Cannot delete - this record is referenced elsewhere';
        }
        if (msg.includes('row-level security')) {
            return 'You do not have permission for this action';
        }
        if (msg.includes('JWT expired')) {
            return 'Your session has expired. Please log in again';
        }
        if (msg.includes('network') || msg.includes('fetch')) {
            return 'Network error - please check your connection';
        }

        return msg;
    }

    // Standard Error objects
    if (error instanceof Error) {
        return error.message;
    }

    // String errors
    if (typeof error === 'string') {
        return error;
    }

    return 'An unexpected error occurred';
}

/**
 * Entity-specific error messages for CRUD operations
 */
export const ErrorMessages = {
    serviceRequest: {
        add: 'Failed to create service request',
        update: 'Failed to update service request',
        delete: 'Failed to delete service request',
    },
    product: {
        add: 'Failed to add product',
        update: 'Failed to update product',
        delete: 'Failed to delete product',
    },
    employee: {
        add: 'Failed to add employee',
        update: 'Failed to update employee',
        delete: 'Failed to delete employee',
    },
    expense: {
        add: 'Failed to add expense',
        delete: 'Failed to delete expense',
    },
    auth: {
        login: 'Login failed',
        logout: 'Logout failed',
        session: 'Session error',
    },
} as const;

/**
 * Logs error to console in development, could be extended for error reporting
 */
export function logError(context: string, error: unknown): void {
    // Only log in development (production builds strip console.*)
    console.error(`[${context}]`, error);

    // Future: Add error reporting service integration here
    // e.g., Sentry.captureException(error, { tags: { context } });
}
