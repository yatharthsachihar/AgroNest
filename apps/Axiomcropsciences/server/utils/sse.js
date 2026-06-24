const Notification = require('../models/Notification');

class SSEManager {
  constructor() {
    this.clients = [];
  }

  // Add a new client connection
  addClient(res) {
    this.clients.push(res);
    
    // Remove client when connection closes
    res.on('close', () => {
      this.removeClient(res);
    });
  }

  // Remove a client
  removeClient(res) {
    this.clients = this.clients.filter(client => client !== res);
  }

  // Broadcast an event to all connected clients
  broadcast(event, data) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    this.clients.forEach(client => {
      try {
        client.write(payload);
      } catch (err) {
        console.error('Error broadcasting to client:', err);
      }
    });
  }

  // Create notification in DB and broadcast it instantly
  async dispatch(data) {
    try {
      const notification = await Notification.create(data);
      this.broadcast('notification', notification);
      return notification;
    } catch (err) {
      console.error('Failed to dispatch notification:', err);
    }
  }
}

// Export a singleton instance
module.exports = new SSEManager();
