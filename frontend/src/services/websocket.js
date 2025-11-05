class WebSocketService {
  constructor() {
    this.socket = null;
    this.gameId = null;
    this.playerName = null;
    this.messageHandlers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
  }

  connect(gameId, playerName) {
    this.gameId = gameId;
    this.playerName = playerName;
    
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = process.env.REACT_APP_WS_HOST || 'localhost:8000';
    const wsUrl = `${wsProtocol}//${wsHost}/ws/${gameId}/${encodeURIComponent(playerName)}`;
    
    this.socket = new WebSocket(wsUrl);
    
    this.socket.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.emit('connected');
    };
    
    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };
    
    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    };
    
    this.socket.onclose = () => {
      console.log('WebSocket disconnected');
      this.emit('disconnected');
      this.attemptReconnect();
    };
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
        if (this.gameId && this.playerName) {
          this.connect(this.gameId, this.playerName);
        }
      }, this.reconnectDelay);
    } else {
      console.error('Max reconnection attempts reached');
      this.emit('reconnect_failed');
    }
  }

  handleMessage(message) {
    const { type, payload } = message;
    
    // Call all handlers for this message type
    if (this.messageHandlers.has(type)) {
      this.messageHandlers.get(type).forEach(handler => {
        try {
          handler(payload);
        } catch (error) {
          console.error(`Error in message handler for ${type}:`, error);
        }
      });
    }
    
    // Also emit a general message event
    this.emit('message', { type, payload });
  }

  on(type, handler) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type).push(handler);
  }

  off(type, handler) {
    if (this.messageHandlers.has(type)) {
      const handlers = this.messageHandlers.get(type);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    // Simple event emitter pattern
    if (!this._eventHandlers) {
      this._eventHandlers = new Map();
    }
    if (this._eventHandlers.has(event)) {
      this._eventHandlers.get(event).forEach(handler => handler(data));
    }
  }

  addEventListener(event, handler) {
    if (!this._eventHandlers) {
      this._eventHandlers = new Map();
    }
    if (!this._eventHandlers.has(event)) {
      this._eventHandlers.set(event, []);
    }
    this._eventHandlers.get(event).push(handler);
  }

  removeEventListener(event, handler) {
    if (this._eventHandlers && this._eventHandlers.has(event)) {
      const handlers = this._eventHandlers.get(event);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  send(action, payload = {}) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ action, payload }));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.gameId = null;
    this.playerName = null;
    this.messageHandlers.clear();
  }

  isConnected() {
    return this.socket && this.socket.readyState === WebSocket.OPEN;
  }
}

const wsService = new WebSocketService();
export default wsService;

