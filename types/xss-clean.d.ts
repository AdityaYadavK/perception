declare module 'xss-clean' {
  const value: Function;
  export default value;
}

declare module "xss-clean/lib/xss.js" {
  export function clean(input?: unknown): unknown;
}