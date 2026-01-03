import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { isCalendarAvailable, connectCalendar, disconnectCalendar, initializeCalendarAuth } from '@/services/calendar';
import { cn } from '@/lib/utils';

interface CalendarConnectionProps {
  onConnectionChange?: (connected: boolean) => void;
}

/**
 * CalendarConnection component for managing Google Calendar sync
 * 
 * DESIGN INVARIANT: Calendar connection is optional and advisory.
 * The app works perfectly fine without calendar connection.
 */
export function CalendarConnection({ onConnectionChange }: CalendarConnectionProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check connection status on mount and verify token is actually valid
  useEffect(() => {
    const checkConnection = async () => {
      // Check if token exists
      const hasToken = isCalendarAvailable();
      
      if (hasToken) {
        // Token exists - verify it's actually valid by trying to authenticate
        // This will clear invalid tokens automatically
        const isValid = await initializeCalendarAuth();
        if (!isValid) {
          // Token was invalid and has been cleared
          setIsConnected(false);
          setIsLoading(false);
          onConnectionChange?.(false);
          return;
        }
      }
      
      setIsConnected(hasToken);
      setIsLoading(false);
      onConnectionChange?.(hasToken);
    };
    checkConnection();
  }, [onConnectionChange]);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      console.log('Attempting to connect calendar...');
      const success = await connectCalendar();
      console.log('Calendar connection result:', success);
      if (success) {
        setIsConnected(true);
        onConnectionChange?.(true);
      } else {
        // Connection failed - provide helpful error message
        alert('Failed to connect calendar. Check the browser console for details. Make sure:\n1. VITE_GOOGLE_CLIENT_ID is set in .env\n2. Dev server was restarted after adding .env\n3. Client ID is correctly configured in Google Cloud Console');
      }
    } catch (error) {
      console.error('Failed to connect calendar:', error);
      alert(`Error connecting calendar: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnectCalendar();
    setIsConnected(false);
    onConnectionChange?.(false);
  };

  if (isLoading) {
    return null; // Don't show anything while loading
  }

  return (
    <div className="flex items-center gap-2">
      {isConnected ? (
        <>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="hidden sm:inline">Calendar synced</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDisconnect}
            className="h-8 px-2 text-xs"
          >
            Disconnect
          </Button>
        </>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={handleConnect}
          disabled={isConnecting}
          className="h-8 gap-1.5 text-xs"
        >
          <Calendar className="w-3.5 h-3.5" />
          {isConnecting ? 'Connecting...' : 'Connect Calendar'}
        </Button>
      )}
    </div>
  );
}

