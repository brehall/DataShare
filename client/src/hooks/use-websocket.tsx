import { useEffect, useRef, useState } from "react";
import { queryClient } from "@/lib/queryClient";

export function useWebSocket() {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      setIsConnected(true);
    };

    ws.current.onclose = () => {
      setIsConnected(false);
    };

    ws.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        // Invalidate relevant queries based on the message type
        switch (message.type) {
          case 'customer_created':
          case 'customer_updated':
          case 'customer_deleted':
            queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
            queryClient.invalidateQueries({ queryKey: ['/api/analytics'] });
            queryClient.invalidateQueries({ queryKey: ['/api/team-activity'] });
            break;
          case 'note_created':
            queryClient.invalidateQueries({ queryKey: ['/api/customers', message.data.customerId, 'notes'] });
            queryClient.invalidateQueries({ queryKey: ['/api/team-activity'] });
            break;
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    return () => {
      ws.current?.close();
    };
  }, []);

  return { isConnected };
}
