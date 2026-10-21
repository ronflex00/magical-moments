/** Préfixe les routes et médias locaux, sans modifier les liens externes ou les ancres. */
export function withBase(path: string, base = import.meta.env?.BASE_URL || '/'): string {
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#|\?)/i.test(path)) return path;
  const prefix = `/${base.replace(/^\/+|\/+$/g, '')}`.replace(/\/$/, '') + '/';
  if (path === prefix.slice(0, -1)) return prefix;
  if (prefix !== '/' && path.startsWith(prefix)) return path;
  return prefix + path.replace(/^\/+/, '');
}
