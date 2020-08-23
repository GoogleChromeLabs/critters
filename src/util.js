import chalk from 'chalk';

export const logger = {
  warn(msg) {
    console.error(chalk.yellow(msg));
  },

  error(msg) {
    console.error(chalk.bold.red(msg));
  },

  log(msg) {
    console.log(msg);
  },

  info(msg) {
    console.log(chalk.bold.blue(msg));
  }
};
