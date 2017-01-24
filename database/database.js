const debug = require('debug')('database:main');
const mongoose = require('mongoose');
const blueBird = require('bluebird');
const userSchema = require('./UserSchema.js');
const eventSchema = require('./EventSchema.js');

blueBird.promisifyAll(eventSchema);

module.exports.databaseInit = databaseInit;
module.exports.UserSchema = userSchema;
module.exports.EventSchema = eventSchema;

var mongoConnection;
/**
 * Perform initialization for database module
 */
function databaseInit () {
	mongoConnection = mongoose.connect('mongodb://localhost/slapdashdb');
	mongoose.Promise = blueBird;
	debug('Initialized MongoDB: ' + mongoConnection);
}
