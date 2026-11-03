const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const exportsObject = {};
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync("src/plugin-operations.ts", "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
  }).outputText,
  { exports: exportsObject, Promise, Error },
);
const PluginOperations = exportsObject.default;
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((a, b) => {
    resolve = a;
    reject = b;
  });
  return { promise, resolve, reject };
};

test("repeated enable joins the original load", async () => {
  const pending = deferred();
  let calls = 0;
  const operations = new PluginOperations(async () => {
    calls++;
    await pending.promise;
  });
  const first = operations.setEnabled("plugin", true);
  assert.equal(operations.setEnabled("plugin", true), first);
  await Promise.resolve();
  assert.equal(calls, 1);
  pending.resolve();
  await first;
});

test("disable waits for activation, and re-enable waits for disposal", async () => {
  const gates = [deferred(), deferred(), deferred()];
  const observed = [];
  const operations = new PluginOperations(async (name, enabled) => {
    const index = observed.length;
    observed.push(enabled);
    await gates[index].promise;
  });
  const on = operations.setEnabled("plugin", true);
  const off = operations.setEnabled("plugin", false);
  const onAgain = operations.setEnabled("plugin", true);
  await Promise.resolve();
  assert.deepEqual(observed, [true]);
  gates[0].resolve();
  await on;
  await Promise.resolve();
  assert.deepEqual(observed, [true, false]);
  gates[1].resolve();
  await off;
  await Promise.resolve();
  assert.deepEqual(observed, [true, false, true]);
  gates[2].resolve();
  await onAgain;
});

test("a failed download does not leave a permanent loading marker", async () => {
  let count = 0;
  const operations = new PluginOperations(async () => {
    if (count++ === 0) throw new Error("network");
  });
  await assert.rejects(operations.setEnabled("plugin", true), /network/);
  await operations.setEnabled("plugin", true);
  assert.equal(count, 2);
});

test("disposing one controller cannot block a new controller", async () => {
  const oldGate = deferred();
  let newCalls = 0;
  const old = new PluginOperations(async () => oldGate.promise);
  const first = old.setEnabled("plugin", true);
  await Promise.resolve();
  const queued = old.setEnabled("plugin", false);
  old.dispose();
  const queuedFailure = assert.rejects(queued, /disposed/);
  const next = new PluginOperations(async () => {
    newCalls++;
  });
  await next.setEnabled("plugin", true);
  assert.equal(newCalls, 1);
  oldGate.resolve();
  await first;
  await queuedFailure;
});
