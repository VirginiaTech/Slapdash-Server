const debug = require('debug')('event-timer')
const engine = require('../engine/engine.js');
const db = require('../database/database.js');
const fcm = require('../thirdparty-api/fcm-server.js');
const EventSchema = require('../database/EventSchema.js');

const Event = EventSchema.Event;

var timers = {};

function runDecisionEngine(eventId) {
    debug("Timeout for event " + eventId);

    removeEventTimer(eventId);

    var loadEvent = Event.findById(eventId)
                         .populate('attendees admin invitations', 'recentlocation androidregid');

    var _event;
    var firebaseTokens = [];

    loadEvent.then(function(event) {
        var locations = [];

        var admin = event.admin;
        var attendees = event.attendees;
        var invitations = event.invitations;

        var loc = admin.recentlocation;

        // Add admin's recent location, if it exists
        if (loc != undefined && loc.lat != undefined && loc.lon != undefined) {
            locations.push({ latitude: loc.lat, longitude: loc.lon });
        }

        // Add admin's firebase token
        firebaseTokens.push(admin.androidregid);

        // Add attendees' recent locations, if there are any
        if (attendees.length > 0) {
            attendees.forEach(function(user) {
                firebaseTokens.push(user.androidregid);

                var loc = user.recentlocation;
                if (loc != undefined && loc.lat != undefined && loc.lon != undefined) {
                    locations.push({ latitude: loc.lat, longitude: loc.lon });
                }
            });
        }

        if (invitations.length > 0) {
            invitations.forEach(function(user) {
                firebaseTokens.push(user.androidregid);
            });
        }

        // If we didn't get any locations, just add a (0,0) location
        if (locations.length == 0) {
            locations.push({ latitude: 37.244146, longitude: -80.425521 });
        }

        _event = event;

        return engine.decide(locations, event.category.toLowerCase());
    }).then(function(data) {
        debug("Decision made for event " + _event._id);

        fcm.sendEventDecision(_event, firebaseTokens, data, function(err, response) {
            debug(response);
        });

        _event.yelpid = data.place_id;
        _event.save();
    });
}

function addEventTimer(eventId, timeout) {
    debug("Added event " + eventId + " with timeout " + timeout);
    var timer = setTimeout(runDecisionEngine, 1000 * 60 * timeout, eventId);
    timers[eventId] = timer;
}

function removeEventTimer(eventId) {
    debug("Removed event " + eventId);

    // Clear the timeout
    clearTimeout(timers[eventId]);

    // Remove from array
    delete timers[eventId]
}

module.exports.runDecisionEngine = runDecisionEngine;
module.exports.addEventTimer = addEventTimer;
module.exports.removeEventTimer = removeEventTimer;
