// TODO: Convert from original securityLogger.js
// Temporary stub for compilation

export const SECURITY_EVENTS = {
  ACCOUNT_CREATED: 'ACCOUNT_CREATED',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT_SUCCESS: 'LOGOUT_SUCCESS',
  EMAIL_VERIFIED: 'EMAIL_VERIFIED',
  PASSWORD_RESET_REQUESTED: 'PASSWORD_RESET_REQUESTED',
  PASSWORD_RESET_SUCCESS: 'PASSWORD_RESET_SUCCESS',
  PASSWORD_HASH_ATTEMPT: 'PASSWORD_HASH_ATTEMPT',
  PASSWORD_HASH_SUCCESS: 'PASSWORD_HASH_SUCCESS',
  PASSWORD_HASH_FAILURE: 'PASSWORD_HASH_FAILURE',
  PASSWORD_VERIFY_SUCCESS: 'PASSWORD_VERIFY_SUCCESS',
  PASSWORD_VERIFY_FAILURE: 'PASSWORD_VERIFY_FAILURE',
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
  MULTIPLE_FAILED_LOGINS: 'MULTIPLE_FAILED_LOGINS',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
};

export const logSecurityEvent = (event: string, data: any, req: any) => {
  console.log('Security event:', event, data);
};

export const trackFailedLogin = (ip: string) => {
  console.log('Failed login tracked for IP:', ip);
};

export const clearFailedAttempts = (ip: string) => {
  console.log('Failed attempts cleared for IP:', ip);
};
