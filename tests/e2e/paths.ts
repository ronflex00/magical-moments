import { withBase } from '../../src/lib/paths';

export const appBase = process.env.PLAYWRIGHT_BASE_URL
  ? new URL(process.env.PLAYWRIGHT_BASE_URL).pathname
  : process.env.BASE_PATH || '/magical-moments/';
export const appPath = (path: string) => withBase(path, appBase);
