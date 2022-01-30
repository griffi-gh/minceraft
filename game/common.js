export function call(fn, ...args) {
  fn(...args);
  return fn;
}