/**
 * @module Utility
 * 
 */
export default (logLevel) => {
	const logLevelIdx = LOG_LEVELS.indexOf(logLevel);

	return LOG_LEVELS.reduce((logger, type, index) => {
		if (index >= logLevelIdx) {
			logger[type] = defaultLogger[type];
		} else {
			logger[type] = defaultLogger.silent;
		}
		return logger;
	}, {});
};

export const LOG_LEVELS = ["trace", "debug", "info", "warn", "error", "silent"];
