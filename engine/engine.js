const debug = require('debug')('engine:main')
const GeoModule = require('./geolib.js')
const Places = require('../thirdparty-api/Places.js')
const settings = require('./settings.json');

module.exports.engine = engineInit;
module.exports.decide = decide;
module.exports.reroll = reroll;

/**
 * Perform initialization for engine module
 */
function engineInit () {
	 debug('Initialized');
}

// This function decides on a location for a given event.
// It returns a promise with one Yelp result.
function decide(userLocations, type) {
    // Compute center location.
    var location = GeoModule.computeCenter(userLocations);

		if (type == "slapdash") {
			var types = Object.keys(settings.yelpOption);
			type = randomValue(types);
		}

    // Load Yelp search settings.
    var radius = settings.yelpRadius.default;
    var typeOption = settings.yelpOption[type].type;

    // Call Yelp API.
    var results = Places.getPlaces(location, radius, typeOption);
    var choice = results.then(function(data) {
        var places = data.results;
        return randomValue(places);
    });

    return choice;
}

// This function decides on a location for a given event which has not already been given before.
// Same usage as above function.
function reroll(userLocations, type) {
    // Compute center location.
    var location = GeoModule.computeCenter(userLocations);

		if (type === "slapdash") {
			var types = Object.keys(settings.yelpOption);
			type = randomValue(types);
		}

    // Load Yelp search settings.
    var radius = settings.yelpRadius.extended;
    var typeOption = settings.yelpOption[type].type;

    // Call Yelp API.
    var results = Places.getPlaces(location, radius, typeOption);
    var choice = results.then(function(data) {
        var places = data.results;
        return randomValue(places);
    });

    return choice;
}

function randomValue(arr) {
	return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
    for (var i = arr.length; i; i--) {
        var j = Math.floor(Math.random() * i);
        arr[i - 1], arr[j] = arr[j], arr[i - 1];
    }
}
