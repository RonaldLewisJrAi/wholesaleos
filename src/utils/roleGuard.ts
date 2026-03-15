/**
 * Phase 60: Role Guard Utility
 * Ensures multi-role safe platform rendering, intercepting developers from production infrastructure.
 */

// Super Admin access check
export function requireSuperAdmin(user) {
    if (!user) return false;
    return user.role === 'super_admin';
}

// Global Admin or Super Admin check
export function requireAdmin(user) {
    if (!user) return false;
    return user.role === 'admin' || user.role === 'super_admin';
}

// Developer Sandbox isolation check
export function requireDeveloper(user) {
    if (!user) return false;
    return user.role === 'developer';
}

// Determines if Sandbox overrides should activate on API calls
export function isDeveloperModeActive(user) {
    if (!user) return false;
    return user.role === 'developer';
}
