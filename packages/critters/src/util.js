import chalk from 'chalk';
import path from 'path';

const LOG_LEVELS = ['trace', 'debug', 'info', 'warn', 'error', 'silent'];

export const defaultLogger = {
  trace(msg) {
    console.trace(msg);
  },

  debug(msg) {
    console.debug(msg);
  },

  warn(msg) {
    console.warn(chalk.yellow(msg));
  },

  error(msg) {
    console.error(chalk.bold.red(msg));
  },

  info(msg) {
    console.info(chalk.bold.blue(msg));
  },

  silent() {}
};

export function createLogger(logLevel) {
  const logLevelIdx = LOG_LEVELS.indexOf(logLevel);

  return LOG_LEVELS.reduce((logger, type, index) => {
    if (index >= logLevelIdx) {
      logger[type] = defaultLogger[type];
    } else {
      logger[type] = defaultLogger.silent;
    }
    return logger;
  }, {});
}

export function isSubpath(basePath, currentPath) {
  return !path.relative(basePath, currentPath).startsWith('..');
}
