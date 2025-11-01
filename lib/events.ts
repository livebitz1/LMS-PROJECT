import EventEmitter from 'events';

declare global {
  // allow attaching serverEvents for hot-reload during development
  var serverEvents: EventEmitter | undefined;
}

// Singleton event bus for server-side in-memory events (suitable for single-instance development)
class ServerEvents extends EventEmitter {}

const serverEvents = global.serverEvents || new ServerEvents();
if (process.env.NODE_ENV !== 'production') global.serverEvents = serverEvents;

export default serverEvents;
