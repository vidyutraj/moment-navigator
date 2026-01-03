/**
 * Google Calendar integration service
 * 
 * DESIGN INVARIANT: Calendar data is advisory, not authoritative.
 * User-confirmed time always wins over calendar-suggested time.
 * 
 * This service provides read-only calendar access for suggesting time windows.
 * All calendar data is treated as a suggestion that the user can override.
 */

export interface CalendarEvent {
  id: string;
  summary: string;
  startTime: Date;
  endTime: Date;
  isAllDay: boolean;
}

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';
const TOKEN_STORAGE_KEY = 'google_calendar_token';
const CLIENT_ID_STORAGE_KEY = 'google_calendar_client_id';
const REFRESH_TOKEN_STORAGE_KEY = 'google_calendar_refresh_token';
const TOKEN_EXPIRY_STORAGE_KEY = 'google_calendar_token_expiry';

// Get Google OAuth Client ID from environment or use a default
// In production, set VITE_GOOGLE_CLIENT_ID in your .env file
// To get a Client ID: https://console.cloud.google.com/apis/credentials
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// Debug helper to check if Client ID is loaded
if (import.meta.env.DEV) {
  if (GOOGLE_CLIENT_ID) {
    console.log('✓ Google Calendar Client ID loaded:', GOOGLE_CLIENT_ID.substring(0, 20) + '...');
  } else {
    console.warn('⚠ Google Calendar Client ID not found. Make sure VITE_GOOGLE_CLIENT_ID is set in .env file and server is restarted.');
  }
}

/**
 * Connect Google Calendar using OAuth 2.0
 * Opens a popup for user authentication
 * 
 * DESIGN INVARIANT: Calendar connection is optional and advisory.
 * If connection fails, app gracefully degrades to default behavior.
 */
export async function connectCalendar(): Promise<boolean> {
  if (!GOOGLE_CLIENT_ID) {
    console.warn('Google OAuth Client ID not configured. Set VITE_GOOGLE_CLIENT_ID in .env file.');
    // For development: fallback to manual token entry
    const manualToken = prompt('Enter Google Calendar access token manually (for development):');
    if (manualToken) {
      setCalendarToken(manualToken);
      return true;
    }
    return false;
  }

  return new Promise((resolve) => {
    // Load Google Identity Services library if not already loaded
    if (!window.google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initializeOAuth(resolve);
      };
      script.onerror = () => {
        console.error('Failed to load Google Identity Services');
        resolve(false);
      };
      document.head.appendChild(script);
    } else {
      initializeOAuth(resolve);
    }
  });
}

/**
 * Initialize OAuth flow using Google Identity Services
 */
function initializeOAuth(resolve: (success: boolean) => void) {
  if (!window.google) {
    console.error('Google Identity Services not loaded');
    resolve(false);
    return;
  }

  if (!GOOGLE_CLIENT_ID) {
    console.error('Google Client ID not configured');
    resolve(false);
    return;
  }

  console.log('Initializing OAuth with Client ID:', GOOGLE_CLIENT_ID.substring(0, 20) + '...');

  try {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPES,
      callback: (response: any) => {
        if (response.error) {
          console.error('OAuth error:', response.error);
          if (response.error === 'popup_closed_by_user') {
            console.warn('User closed the OAuth popup');
          }
          resolve(false);
          return;
        }

        console.log('OAuth success! Token received.');
        
        // Store access token
        const accessToken = response.access_token;
        const expiresIn = response.expires_in || 3600; // Default to 1 hour
        const expiryTime = Date.now() + (expiresIn * 1000);

        localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
        localStorage.setItem(TOKEN_EXPIRY_STORAGE_KEY, expiryTime.toString());

        // Store refresh token if provided
        if (response.refresh_token) {
          localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, response.refresh_token);
          console.log('Refresh token stored');
        }

        resolve(true);
      },
    });

    // Request access token with consent prompt
    console.log('Requesting access token...');
    tokenClient.requestAccessToken({ prompt: 'consent' });
  } catch (error) {
    console.error('Error initializing OAuth:', error);
    resolve(false);
  }
}

/**
 * Check if we have a valid token (not expired)
 * Automatically refreshes if expired, or clears if invalid
 */
async function getValidToken(): Promise<string | null> {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  const expiryTime = localStorage.getItem(TOKEN_EXPIRY_STORAGE_KEY);

  if (!token) {
    return null;
  }

  // Check if token is expired (with 5 minute buffer)
  if (expiryTime) {
    const expiry = parseInt(expiryTime, 10);
    const now = Date.now();
    if (now > expiry - 5 * 60 * 1000) {
      // Token expired or expiring soon - try to refresh
      console.log('Token expiring soon, attempting refresh...');
      const refreshed = await refreshToken();
      if (refreshed) {
        return refreshed;
      }
      // Refresh failed - token is cleared, return null
      return null;
    }
  }

  // Verify token is still valid (even if not expired, it might have been revoked)
  const isValid = await verifyToken(token);
  if (!isValid) {
    // Token invalid (401) - try to refresh if we have refresh token
    const refreshTokenValue = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
    if (refreshTokenValue) {
      console.log('Token invalid, attempting refresh...');
      const refreshed = await refreshToken();
      if (refreshed) {
        return refreshed;
      }
    }
    // No refresh token or refresh failed - token already cleared by verifyToken
    return null;
  }

  return token;
}

/**
 * Refresh access token using refresh token
 */
async function refreshToken(): Promise<string | null> {
  const refreshTokenValue = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
  if (!refreshTokenValue || !GOOGLE_CLIENT_ID) {
    // No refresh token - user needs to reconnect
    clearCalendarToken();
    return null;
  }

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        refresh_token: refreshTokenValue,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    const accessToken = data.access_token;
    const expiresIn = data.expires_in || 3600;
    const expiryTime = Date.now() + (expiresIn * 1000);

    localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
    localStorage.setItem(TOKEN_EXPIRY_STORAGE_KEY, expiryTime.toString());

    return accessToken;
  } catch (error) {
    console.error('Failed to refresh token:', error);
    clearCalendarToken();
    return null;
  }
}

/**
 * Disconnect calendar (clear all tokens)
 */
export function disconnectCalendar(): void {
  clearCalendarToken();
}

/**
 * Initialize Google Calendar OAuth
 * Checks if we have a valid token
 */
export async function initializeCalendarAuth(): Promise<boolean> {
  try {
    const token = await getValidToken();
    return token !== null;
  } catch (error) {
    console.error('Error initializing calendar auth:', error);
    return false;
  }
}

/**
 * Verify that a token is still valid
 * Returns false if token is invalid or expired
 */
async function verifyToken(token: string): Promise<boolean> {
  try {
    const response = await fetch(`${CALENDAR_API_BASE}/users/me/calendarList?maxResults=1`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      // Token is invalid - clear it
      if (response.status === 401) {
        console.warn('Calendar token is invalid or expired. Please reconnect your calendar.');
        clearCalendarToken();
      }
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error verifying token:', error);
    return false;
  }
}

/**
 * Get list of calendars user has access to
 */
async function getCalendarList(token: string): Promise<string[]> {
  try {
    const response = await fetch(`${CALENDAR_API_BASE}/users/me/calendarList`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.warn('Failed to fetch calendar list');
      // Fallback to primary calendar only
      return ['primary'];
    }

    const data = await response.json();
    const calendars = data.items || [];
    
    // Filter to only calendars owned by the user (exclude other people's shared calendars)
    // accessRole: 'owner' means the user owns the calendar
    // primary: true means it's the user's primary calendar
    const ownedCalendars = calendars
      .filter((cal: any) => {
        // Include only calendars owned by the user
        return cal.accessRole === 'owner' || cal.primary === true;
      })
      .filter((cal: any) => cal.selected !== false) // Also filter to selected/active calendars
      .map((cal: any) => cal.id);
    
    if (ownedCalendars.length === 0) {
      // Fallback to primary if no owned calendars found
      return ['primary'];
    }
    
    if (import.meta.env.DEV) {
      console.log('📅 Checking', ownedCalendars.length, 'owned calendar(s)');
    }
    
    return ownedCalendars;
  } catch (error) {
    console.warn('Error fetching calendar list:', error);
    // Fallback to primary calendar
    return ['primary'];
  }
}

/**
 * Get the next upcoming calendar event from now across ALL calendars
 * Returns null if no event exists or calendar is unavailable
 * 
 * DESIGN INVARIANT: This is advisory only. User can always override.
 */
export async function getNextCalendarEvent(now: Date): Promise<CalendarEvent | null> {
  try {
    const token = await getValidToken();
    if (!token) {
      // No valid authentication - gracefully degrade
      // Token might have been cleared if it was invalid
      // Don't log as error - this is expected when calendar isn't connected
      return null;
    }

    // Get list of all active calendars
    const calendarIds = await getCalendarList(token);

    // Calculate time bounds (now to 24 hours from now)
    const timeMin = now.toISOString();
    const timeMax = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

    // Query events from all calendars in parallel
    const eventPromises = calendarIds.map(async (calendarId: string) => {
      try {
        const response = await fetch(
          `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events?` +
          `timeMin=${encodeURIComponent(timeMin)}&` +
          `timeMax=${encodeURIComponent(timeMax)}&` +
          `singleEvents=true&` +
          `orderBy=startTime&` +
          `maxResults=10`, // Get more events per calendar to compare across calendars
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          // Some calendars might not be accessible - skip them
          return [];
        }

        const data = await response.json();
        return (data.items || []).map((event: any) => ({
          ...event,
          calendarId, // Track which calendar this event is from
        }));
      } catch (error) {
        // Calendar might not be accessible - skip it
        return [];
      }
    });

    // Wait for all calendar queries to complete
    const allEventsArrays = await Promise.all(eventPromises);
    const allEvents = allEventsArrays.flat();

    if (allEvents.length === 0) {
      // No upcoming events across any calendar - user has open time
      return null;
    }

    // Filter and process events
    const validEvents = allEvents
      .filter((event: any) => {
        // Filter out all-day events (they use date, not dateTime)
        if (!event.start.dateTime) {
          return false;
        }
        
        // Filter out declined events
        if (event.attendees) {
          const userAttendee = event.attendees.find((a: any) => a.self);
          if (userAttendee && userAttendee.responseStatus === 'declined') {
            return false;
          }
        }
        
        return true;
      })
      .map((event: any) => {
        // Pre-parse start times for sorting
        const startTime = event.start.dateTime ? new Date(event.start.dateTime) : null;
        const endTime = event.end.dateTime ? new Date(event.end.dateTime) : null;
        return {
          ...event,
          parsedStartTime: startTime,
          parsedEndTime: endTime || startTime,
        };
      })
      .filter((event: any) => {
        // Filter out events that are completely in the past
        if (!event.parsedStartTime) {
          return false;
        }
        const eventEndTime = event.parsedEndTime || event.parsedStartTime;
        return eventEndTime > now;
      });

    if (validEvents.length === 0) {
      // No valid upcoming events
      return null;
    }

    // Sort by start time and get the earliest
    validEvents.sort((a: any, b: any) => {
      const aStart = a.parsedStartTime?.getTime() || Infinity;
      const bStart = b.parsedStartTime?.getTime() || Infinity;
      return aStart - bStart;
    });

    const event = validEvents[0];

    // Debug logging
    if (import.meta.env.DEV) {
      console.log('📅 Found next calendar event:', {
        summary: event.summary,
        calendar: event.calendarId || 'primary',
        start: event.start.dateTime || event.start.date,
        end: event.end.dateTime || event.end.date,
        timezone: event.start.timeZone || 'UTC',
        totalEventsFound: allEvents.length,
        validEventsFound: validEvents.length,
      });
    }

    // Use pre-parsed times
    const startTime = event.parsedStartTime!;
    const eventEndTime = event.parsedEndTime || startTime;
    
    // Check if event is currently happening
    if (startTime <= now && now < eventEndTime) {
      // Event is currently happening - use its end time as the suggestion
      if (import.meta.env.DEV) {
        console.log('📅 Event is currently happening, using end time:', eventEndTime.toLocaleString());
      }
      return {
        id: event.id,
        summary: event.summary || 'Untitled event',
        startTime: eventEndTime, // Use end time for currently happening events
        endTime: eventEndTime,
        isAllDay: false,
      };
    }

    // Event is in the future - use its start time
    if (import.meta.env.DEV) {
      console.log('📅 Using next event start time:', startTime.toLocaleString());
    }

    return {
      id: event.id,
      summary: event.summary || 'Untitled event',
      startTime,
      endTime: eventEndTime,
      isAllDay: false,
    };
  } catch (error) {
    // Any error - gracefully degrade to default
    console.error('Error fetching calendar event:', error);
    return null;
  }
}

/**
 * Manual token setter for development/testing
 * In production, this would be handled by OAuth flow
 */
export function setCalendarToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  // Set a default expiry (1 hour from now)
  const expiryTime = Date.now() + (3600 * 1000);
  localStorage.setItem(TOKEN_EXPIRY_STORAGE_KEY, expiryTime.toString());
}

/**
 * Clear calendar token (for logout or disconnect)
 */
export function clearCalendarToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_STORAGE_KEY);
}

// Extend Window interface for Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: any) => void;
          }) => {
            requestAccessToken: (options?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

/**
 * Check if calendar is available
 * Note: This only checks if a token exists, not if it's valid
 * Validation happens when actually using the token
 */
export function isCalendarAvailable(): boolean {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!token) {
    return false;
  }
  
  // Quick check if token is definitely expired
  const expiryTime = localStorage.getItem(TOKEN_EXPIRY_STORAGE_KEY);
  if (expiryTime) {
    const expiry = parseInt(expiryTime, 10);
    const now = Date.now();
    // If expired by more than 1 hour, consider it unavailable
    if (now > expiry + 60 * 60 * 1000) {
      // Token expired long ago - clear it
      clearCalendarToken();
      return false;
    }
  }
  
  return true;
}

