type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const levels: LogLevel[] = ['error', 'warn', 'info', 'debug'];

const log = (level: string, message: string, meta?: unknown): void => {
  const resolved: LogLevel = levels.includes(level as LogLevel) ? (level as LogLevel) : 'info';
  const ts = new Date().toISOString();
  const extra =
    meta !== undefined ? ` ${typeof meta === 'string' ? meta : JSON.stringify(meta)}` : '';
  const line = `[${ts}] [${resolved.toUpperCase()}] ${message}${extra}`;
  if (resolved === 'error') {
    console.error(line);
  } else if (resolved === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
};

const logger = {
  error: (msg: string, meta?: unknown) => log('error', msg, meta),
  warn: (msg: string, meta?: unknown) => log('warn', msg, meta),
  info: (msg: string, meta?: unknown) => log('info', msg, meta),
  debug: (msg: string, meta?: unknown) => log('debug', msg, meta),
};

export default logger;
