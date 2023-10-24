/**
 * @module Utility
 *
 */
export default {
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

	silent() {},
};
