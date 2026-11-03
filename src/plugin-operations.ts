// Operations belong to one editor/controller. Background settings restoration
// joins this queue, so it cannot cancel or race a user operation.
export default class PluginOperations {
  private pending = new Map<string, { enabled: boolean; promise: Promise<void> }>();
  private disposed = false;

  constructor(private apply: (name: string, enabled: boolean) => Promise<void>) {}

  setEnabled(name: string, enabled: boolean): Promise<void> {
    if (this.disposed) return Promise.reject(new Error("Plugin controller has been disposed"));
    const previous = this.pending.get(name);
    if (previous?.enabled === enabled) return previous.promise;
    const promise = (previous ? previous.promise.catch(() => undefined) : Promise.resolve()).then(() => {
      if (this.disposed) throw new Error("Plugin controller has been disposed");
      return this.apply(name, enabled);
    });
    const operation = { enabled, promise };
    this.pending.set(name, operation);
    const clear = () => {
      if (this.pending.get(name) === operation) this.pending.delete(name);
    };
    promise.then(clear, clear);
    return promise;
  }

  dispose() {
    this.disposed = true;
    this.pending.clear();
  }
}
