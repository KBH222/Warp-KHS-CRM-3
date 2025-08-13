// Local Network Sync Service for KHS CRM
// Enables peer-to-peer sync on local WiFi network without cloud

import { DataClassification, canSyncData } from '../types/security';
import { auditService } from './auditService';

interface PeerDevice {
  id: string;
  name: string;
  address: string;
  lastSeen: number;
  isActive: boolean;
}

interface SyncMessage {
  type: 'discover' | 'announce' | 'sync-request' | 'sync-data' | 'ack';
  deviceId: string;
  deviceName: string;
  timestamp: number;
  data?: unknown;
  dataType?: string;
  classification?: DataClassification;
}

class LocalNetworkSyncService {
  private ws: WebSocket | null = null;
  private deviceId: string;
  private deviceName: string;
  private peers: Map<string, PeerDevice> = new Map();
  private syncHandlers: Map<string, (data: unknown) => void> = new Map();
  private discoveryInterval: number | null = null;
  private serverUrl: string = '';

  constructor() {
    this.deviceId = this.getOrCreateDeviceId();
    this.deviceName = this.getDeviceName();
  }

  // Initialize local network sync
  async initialize(serverUrl?: string): Promise<void> {
    // Use local network server URL
    this.serverUrl = serverUrl || this.detectLocalServer();
    
    try {
      // Connect to WebSocket server
      this.ws = new WebSocket(this.serverUrl);
      
      this.ws.onopen = () => {
        console.log('Connected to local sync server');
        this.announce();
        this.startDiscovery();
        
        auditService.logAccess('write', 'local-sync', DataClassification.INTERNAL, 'Connected to local network');
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(JSON.parse(event.data));
      };

      this.ws.onerror = (error) => {
        console.error('Local sync error:', error);
        auditService.logAccess('write', 'local-sync', DataClassification.INTERNAL, 'Connection error', false);
      };

      this.ws.onclose = () => {
        console.log('Disconnected from local sync server');
        this.stopDiscovery();
        this.peers.clear();
        
        // Attempt reconnection after delay
        setTimeout(() => {
          if (this.serverUrl) {
            this.initialize(this.serverUrl);
          }
        }, 5000);
      };
    } catch (error) {
      console.error('Failed to initialize local sync:', error);
      throw error;
    }
  }

  // Register a handler for syncing specific data type
  registerSyncHandler(dataType: string, handler: (data: unknown) => void): void {
    this.syncHandlers.set(dataType, handler);
  }

  // Sync data with peers
  async syncData(
    dataType: string, 
    data: unknown, 
    classification: DataClassification
  ): Promise<void> {
    // Check if sync is allowed for this classification
    const settings = JSON.parse(localStorage.getItem('khs-crm-security-settings') || '{}');
    if (!canSyncData(classification, settings)) {
      console.warn(`Cannot sync ${dataType} - classification ${classification} not allowed`);
      return;
    }

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected to local sync server');
    }

    const message: SyncMessage = {
      type: 'sync-data',
      deviceId: this.deviceId,
      deviceName: this.deviceName,
      timestamp: Date.now(),
      dataType,
      data,
      classification,
    };

    this.ws.send(JSON.stringify(message));
    
    auditService.logAccess('sync', dataType, classification, { 
      peerCount: this.peers.size,
      dataSize: JSON.stringify(data).length,
    });
  }

  // Get list of active peers
  getActivePeers(): PeerDevice[] {
    const now = Date.now();
    const activePeers: PeerDevice[] = [];
    
    this.peers.forEach(peer => {
      // Consider peer active if seen in last 30 seconds
      if (now - peer.lastSeen < 30000) {
        activePeers.push({ ...peer, isActive: true });
      }
    });
    
    return activePeers;
  }

  // Disconnect from local sync
  disconnect(): void {
    this.stopDiscovery();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.peers.clear();
  }

  // Private methods

  private handleMessage(message: SyncMessage): void {
    // Ignore messages from self
    if (message.deviceId === this.deviceId) {
      return;
    }

    switch (message.type) {
      case 'announce':
        this.handlePeerAnnounce(message);
        break;
        
      case 'sync-data':
        this.handleSyncData(message);
        break;
        
      case 'discover':
        // Respond to discovery with announce
        this.announce();
        break;
    }
  }

  private handlePeerAnnounce(message: SyncMessage): void {
    const peer: PeerDevice = {
      id: message.deviceId,
      name: message.deviceName,
      address: '', // Would need server support to get IP
      lastSeen: Date.now(),
      isActive: true,
    };
    
    this.peers.set(peer.id, peer);
    console.log(`Discovered peer: ${peer.name} (${peer.id})`);
  }

  private handleSyncData(message: SyncMessage): void {
    if (!message.dataType || !message.data || !message.classification) {
      return;
    }

    // Check if we should accept this data
    const settings = JSON.parse(localStorage.getItem('khs-crm-security-settings') || '{}');
    if (!canSyncData(message.classification, settings)) {
      console.warn(`Rejecting sync for ${message.dataType} - classification not allowed`);
      return;
    }

    // Call registered handler
    const handler = this.syncHandlers.get(message.dataType);
    if (handler) {
      handler(message.data);
      
      auditService.logAccess('sync', message.dataType, message.classification, {
        source: message.deviceName,
        action: 'received',
      });
    }
  }

  private announce(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const message: SyncMessage = {
      type: 'announce',
      deviceId: this.deviceId,
      deviceName: this.deviceName,
      timestamp: Date.now(),
    };

    this.ws.send(JSON.stringify(message));
  }

  private startDiscovery(): void {
    // Send discovery message every 20 seconds
    this.discoveryInterval = window.setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const message: SyncMessage = {
          type: 'discover',
          deviceId: this.deviceId,
          deviceName: this.deviceName,
          timestamp: Date.now(),
        };
        
        this.ws.send(JSON.stringify(message));
      }
    }, 20000);
    
    // Initial discovery
    this.announce();
  }

  private stopDiscovery(): void {
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
      this.discoveryInterval = null;
    }
  }

  private detectLocalServer(): string {
    // Try to detect local server on common ports
    // In production, this would be configured
    const localIP = window.location.hostname;
    
    // If running on localhost, use it
    if (localIP === 'localhost' || localIP === '127.0.0.1') {
      return 'ws://localhost:8080/sync';
    }
    
    // Otherwise, try to use the same host with WebSocket port
    return `ws://${localIP}:8080/sync`;
  }

  private getOrCreateDeviceId(): string {
    let deviceId = localStorage.getItem('khs-crm-device-id');
    
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem('khs-crm-device-id', deviceId);
    }
    
    return deviceId;
  }

  private getDeviceName(): string {
    // Try to get a friendly device name
    const userAgent = navigator.userAgent;
    
    if (/iPhone/.test(userAgent)) {
      return 'iPhone';
    } else if (/iPad/.test(userAgent)) {
      return 'iPad';
    } else if (/Android/.test(userAgent)) {
      return 'Android Device';
    } else if (/Windows/.test(userAgent)) {
      return 'Windows PC';
    } else if (/Mac/.test(userAgent)) {
      return 'Mac';
    }
    
    return 'Unknown Device';
  }
}

// Export singleton instance
export const localNetworkSync = new LocalNetworkSyncService();