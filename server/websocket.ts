/**
 * WebSocket Server for real-time WMS notifications
 * Rooms: admin, warehouse, client:{customerId}
 * Events: order.status_changed, inventory.adjusted, return.received, billing.generated, feedback.created
 */

import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'NiceC-WMS-Secret-Token-Key-2026!';

interface AuthenticatedSocket extends WebSocket {
  userId?: string;
  role?: string;
  customerId?: string;
  rooms: Set<string>;
}

export class WmsWebSocket {
  private wss: WebSocketServer;
  private clients: Map<string, AuthenticatedSocket> = new Map();

  constructor(server: HttpServer) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: AuthenticatedSocket, req) => {
      ws.rooms = new Set();

      // Authenticate via token in URL query param
      const url = new URL(req.url || '', 'http://localhost');
      const token = url.searchParams.get('token');

      if (!token) {
        ws.close(4001, 'Authentication required');
        return;
      }

      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        ws.userId = decoded.id;
        ws.role = (decoded.role || '').toUpperCase();
        ws.customerId = decoded.customerId;

        // Join rooms based on role
        if (ws.role === 'ADMIN' || ws.role === 'SUPER_ADMIN') {
          ws.rooms.add('admin');
        }
        if (ws.role === 'WAREHOUSE_MANAGER' || ws.role === 'WAREHOUSE_OPERATOR' || ws.role === 'ADMIN' || ws.role === 'SUPER_ADMIN') {
          ws.rooms.add('warehouse');
        }
        if (ws.customerId) {
          ws.rooms.add(`client:${ws.customerId}`);
        }

        this.clients.set(ws.userId, ws);

        ws.on('close', () => {
          if (ws.userId) this.clients.delete(ws.userId);
        });

        ws.send(JSON.stringify({
          type: 'connected',
          data: { userId: ws.userId, role: ws.role, rooms: Array.from(ws.rooms) },
        }));
      } catch (err) {
        ws.close(4001, 'Invalid token');
      }
    });
  }

  /**
   * Broadcast an event to all sockets in matching rooms
   */
  broadcast(event: string, data: any, targetRooms: string[]) {
    const message = JSON.stringify({ type: event, data, timestamp: new Date().toISOString() });
    this.clients.forEach((ws) => {
      if (targetRooms.some((room) => ws.rooms.has(room))) {
        try {
          ws.send(message);
        } catch {
          // Socket may be closed
        }
      }
    });
  }

  /**
   * Send event to admin room
   */
  toAdmin(event: string, data: any) {
    this.broadcast(event, data, ['admin']);
  }

  /**
   * Send event to warehouse room
   */
  toWarehouse(event: string, data: any) {
    this.broadcast(event, data, ['warehouse']);
  }

  /**
   * Send event to a specific client
   */
  toClient(customerId: string, event: string, data: any) {
    this.broadcast(event, data, [`client:${customerId}`]);
  }

  /**
   * Send event to all relevant parties based on context
   */
  emit(event: string, data: any, customerId?: string) {
    const rooms = ['admin', 'warehouse'];
    if (customerId) rooms.push(`client:${customerId}`);
    this.broadcast(event, data, rooms);
  }

  /**
   * Get connection count
   */
  getConnectionCount(): number {
    return this.clients.size;
  }
}

let wmsWsInstance: WmsWebSocket | null = null;

export function initWebSocket(server: HttpServer): WmsWebSocket {
  wmsWsInstance = new WmsWebSocket(server);
  return wmsWsInstance;
}

export function getWebSocket(): WmsWebSocket | null {
  return wmsWsInstance;
}
