/**
 * Debug utilities for calendar integration
 * Use these in browser console to troubleshoot calendar sync issues
 */

export function checkCalendarConfig() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const token = localStorage.getItem('google_calendar_token');
  const expiry = localStorage.getItem('google_calendar_token_expiry');
  const refreshToken = localStorage.getItem('google_calendar_refresh_token');

  console.group('📅 Calendar Configuration Check');
  console.log('Client ID:', clientId ? `${clientId.substring(0, 20)}...` : '❌ NOT SET');
  console.log('Access Token:', token ? '✅ Present' : '❌ Not found');
  if (expiry) {
    const expiryDate = new Date(parseInt(expiry, 10));
    const isExpired = expiryDate < new Date();
    console.log('Token Expiry:', expiryDate.toLocaleString(), isExpired ? '⚠️ EXPIRED' : '✅ Valid');
  }
  console.log('Refresh Token:', refreshToken ? '✅ Present' : '❌ Not found');
  console.groupEnd();

  return {
    clientId: !!clientId,
    token: !!token,
    expiry,
    refreshToken: !!refreshToken,
  };
}

// Make available globally for easy debugging
if (typeof window !== 'undefined') {
  (window as any).checkCalendarConfig = checkCalendarConfig;
}

