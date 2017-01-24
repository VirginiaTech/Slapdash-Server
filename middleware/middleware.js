const debug = require('debug')('middleware:main')

module.exports.middlewareInit = middlewareInit;

/**
 * Perform initialization for middleware module
 */
function middlewareInit () {
	 debug('Initialized');
}