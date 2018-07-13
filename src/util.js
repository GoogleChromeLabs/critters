export function tap (inst, hook, pluginName, async, callback) {
  if (inst.hooks) {
    const camel = hook.replace(/-([a-z])/g, (s, i) => i.toUpperCase());
    inst.hooks[camel][async ? 'tapAsync' : 'tap'](pluginName, callback);
  } else {
    inst.plugin(hook, callback);
  }
}
