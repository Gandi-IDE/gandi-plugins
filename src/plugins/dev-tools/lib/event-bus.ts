import { debounce } from "lodash-es";

export type EventCallback = (...args: unknown[]) => void;

type Listener = {
  callback: EventCallback;
};

class EventBus {
  private listeners: { [key: string]: Listener[] } = {};

  // creates an event that can be triggered any number of times
  on(eventName: string, callback: EventCallback) {
    this.registerListener(eventName, callback);
  }

  // kill an event with all it's callbacks
  off(eventName: string) {
    delete this.listeners[eventName];
  }

  // removes the given callback for the given event
  detach(eventName: string, callback: EventCallback) {
    let listeners = this.listeners[eventName] || [];

    listeners = listeners.filter(function (value) {
      return value.callback !== callback;
    });

    if (eventName in this.listeners) {
      this.listeners[eventName] = listeners;
    }
  }

  // removes all the events for the given name
  detachAll(eventName: string) {
    this.off(eventName);
  }

  emit(eventName: string, ...args: unknown[]) {
    let listeners: Listener[] = [];

    // name exact match
    if (this.hasListeners(eventName)) {
      listeners = this.listeners[eventName];
    }

    listeners.forEach((listener) => {
      const callback = listener.callback;
      callback(...args);
    });
  }

  hasListeners(eventName: string): boolean {
    return eventName in this.listeners;
  }

  private registerListener(eventName: string, callback: EventCallback) {
    if (!this.hasListeners(eventName)) {
      this.listeners[eventName] = [];
    }

    this.listeners[eventName].push({
      callback: debounce(callback, 100, {
        maxWait: 300,
      }),
    });
  }
}

export default EventBus;
