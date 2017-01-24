var FB = require('fb');
var engine = require('../engine/engine.js');
var eventNamer = require('../lib/random-event-name.js');
var db = require('../database/database.js');
var UserSchema = db.UserSchema;
var EventSchema = db.EventSchema;

var User = UserSchema.User;
var Event = EventSchema.Event;

const EventTimer = require('../lib/event-timer.js');

function getEventsHandler(req, res) {
    res.setHeader('Content-Type', 'application/json');

    var loadAllEvents = Event.find({}).exec();

    loadAllEvents.then(function(events) {
        res.status(200).send(events).end();
    })
    .catch(function(err) {
        res.status(400).send({ msg: err }).end();
    });
};

/**
 * Json object passed in should look like:
 *
 * Note: starttime is milliseconds since the UNIX epoch
 *
 * {
 *     "event": {
 *		   "category": "Food",
 *		   "starttime": 12323423423423,
 *		   "invitations": [
 *			   "fbid1",
 *			   "fbid2",
 *			   "fbid3"
 *		    ],
 *		    "timeout": 30,
 *		    "userpermissions": "Open"
 *	    },
 *	    "accessToken": "FB access token"
 * }
 *
 */
function createEventHandler(req, res) {
    res.setHeader('Content-Type', 'application/json');

    if (!req.fbUser) {
        res.status(400).send({ 'error': 'Access Token Required' }).end();
        return;
    }

    var eventInput = req.body;

    var location = req.body.recentlocation;

    if (!eventInput) {
        res.status(400).send({ 'error': 'Event object required' }).end();
        return;
    }

    if (!eventInput.starttime) {
        res.status(400).send({ 'error': 'Event start time required!' }).end();
        return;
    }

    if (!eventInput.category) {
        res.status(400).send({ 'error': 'Category required!' }).end();
        return;
    }

    var findUser = User.findOne({ 'fbtokenid': req.fbUser.id }, '_id name').exec();

    var invitations = [];

    if (eventInput.invitations) {
        eventInput.invitations.forEach(function(user) {
            invitations.push(user.fbtokenid);
        });
    }

    var invitedUsers = User.find({'fbtokenid': {$in:invitations}}, '_id').exec();

    Promise.all([findUser, invitedUsers]).then(function(result) {
        var user = result[0];
        var invitationList = result[1];
        if (!user) {
            throw { code: 404 };
        } else {
            var userId = user._id;

            // undefined / empty string
            if (!eventInput.title) {
                eventInput.title = eventNamer.randomName(user.name.firstname);
            }

            var newEvent = {
                category: eventInput.category,
                starttime: eventInput.starttime,
                timeout: eventInput.timeout,
                userpermissions: eventInput.userpermissions,
                title: eventInput.title,
                description: eventInput.description,
                canceled: false
            }

            return EventSchema.createEventAsync(newEvent, userId, location);
        }
    })
    .then(function(createdEvent) {
        return EventSchema.inviteFriends_FbIdAsync(createdEvent._id, createdEvent.admin, invitations);
    })
    .then(function(createdEvent) {
        return createdEvent.populate({path: 'admin invitations attendees', model: 'User', select: '_id'}).execPopulate();
    })
    .then(function(populatedEvent) {
        res.status(201).send(populatedEvent).end();
    })
    .catch({ code: 404 }, function(err) {
        res.status(404).send({ 'error': 'User not found' }).end();
    })
    .catch(function(err) {
        console.log(err);
        res.status(400).send({ 'error': err }).end();
    });
};

/**
 * Get a paticular event by its mongo id. Only the event admin,
 * people in the event, or people that were invited can get event information
 *
 * Params:
 *   eventid: The mongo id of the event
 *   accesstoken: The access token of the user making the request
 */
function getEventHandler(req, res) {
    res.setHeader('Content-Type', 'application/json');

    if (!req.fbUser) {
        res.status(400).send({ 'error': 'Access Token Required' }).end();
        return;
    }

    var eventId = req.params.eventId;

    if (!eventId) {
        res.status(400).send({ 'error': 'Event id required' }).end();
        return;
    }

    var promises = [
        Event.findById(eventId).populate('admin attendees invitations', '-eventsjoined -androidregid'),
        User.findOne({ 'fbtokenid': req.fbUser.id }, '_id')
    ]

    Promise.all(promises).then(function(results) {
        var event = results[0];
        var user = results[1];
        if (!event) {
            res.status(404).send({ 'error': 'Event not found' }).end();
        } else if (!user) {
            res.status(404).send({ 'error': 'User not found' }).end();
        } else {
            if (event.admin._id.equals(user._id) ||
                event.invitations.some(elem => elem._id.equals(user._id)) ||
                event.attendees.some(elem => elem._id.equals(user._id))) {
                    res.status(200).send(event).end();
            } else {
                res.status(401).send({ 'error': 'You can\'t view this event!' }).end();
            }
        }
    })
    .catch(function(err) {
        res.status(400).send({ 'error': err }).end();
    });
};

/**
 * Not yet implemented. Might not need to be.
 */
function updateEventHandler(req, res) {

    var eventId = req.params.eventId;

    res.setHeader('Content-Type', 'application/json');
    var successJson = { 'message': 'Event ' + eventId + ' has been successfully updated' };
    res.status(200).send(successJson).end();
};

/**
 * Cancel a particular event. Only admins of the event can cancel.
 *
 * Params:
 *   eventid: The mongo id of the event
 *   accesstoken: The access token of the user making the request
 */
function cancelEventHandler(req, res) {
    res.setHeader('Content-Type', 'application/json');

    if (!req.fbUser) {
        res.status(400).send({ 'error': 'Access Token Required' }).end();
        return;
    }

    var eventId = req.params.eventId;

    if (!eventId) {
        res.status(400).send({ 'error': 'Event id required' }).end();
        return;
    }

    var promises = [
        Event.findById(eventId),
        User.findOne({ 'fbtokenid': req.fbUser.id }, '_id')
    ]

    Promise.all(promises).then(function(results) {
        var event = results[0];
        var user  = results[1];

        if (!event) {
            res.status(404).send({ 'error': 'Event not found' }).end();
        } else if (!user) {
            res.status(404).send({ 'error': 'User not found' }).end();
        } else {
            if (event.admin.equals(user._id)) {

                event.canceled = true;

                event.save(function() {
                    res.status(200).send(event).end();
                    return;
                });
            } else {
                res.status(401).send({ 'error': 'You can\'t cancel this event!' }).end();
            }
        }
    })
    .catch(function(err) {
        res.status(400).send({ 'error': err }).end();
    });
};

function getEventUsersHandler(req, res) {

    var eventId = req.params.eventId;

    res.setHeader('Content-Type', 'application/json');
    var successJson = { 'message': 'Users for event ' + eventId + ' has been successfully retrieved' };
    res.status(200).send(successJson).end();
};

function leaveEventHandler(req, res) {
    res.setHeader('Content-Type', 'application/json');

    if (!req.fbUser) {
        res.status(400).send({ 'error': 'Access Token Required' }).end();
        return;
    }

    var eventId = req.params.eventId;

    if (!eventId) {
        res.status(400).send({ 'error': 'Event id required' }).end();
        return;
    }

    var promises = [
        Event.findById(eventId),
        User.findOne({ 'fbtokenid': req.fbUser.id })
    ]

    Promise.all(promises).then(function(results) {
        var event = results[0];
        var user  = results[1];

        if (!event) {
            res.status(404).send({ 'error': 'Event not found' }).end();
        } else if (!user) {
            res.status(404).send({ 'error': 'User not found' }).end();
        } else {
            var userId = user._id;
            var eventId = event._id;

            if (event.admin.equals(userId)) {
                res.status(400).send({ 'error': 'The admin can\'t leave an event' }).end();
                return;
            }

            var attendeesIndex = event.attendees.indexOf(userId);
            var eventsJoinedIndex = user.eventsjoined.indexOf(eventId);

            if (attendeesIndex >= 0)
                event.attendees.splice(attendeesIndex, 1);

            if (eventsJoinedIndex >= 0)
                user.eventsjoined.splice(eventsJoinedIndex, 1);

            event.save();
            user.save();

            res.status(200).send({ 'success': 'Successfully left the event' });
        }
    })
    .catch(function(err) {
        res.status(400).send({ 'error': err }).end();
    });
}

function rerollHandler(req, res) {
    res.setHeader('Content-Type', 'application/json');

    if (!req.fbUser) {
        res.status(400).send({ 'error': 'Access Token Required' }).end();
        return;
    }

    var eventId = req.params.eventId;

    if (!eventId) {
        res.status(400).send({ 'error': 'Event id required' }).end();
        return;
    }

    var promises = [
        Event.findById(eventId),
        User.findOne({ 'fbtokenid': req.fbUser.id }, '_id')
    ]

    Promise.all(promises).then(function(results) {
        var event = results[0];
        var user  = results[1];

        if (!event) {
            res.status(404).send({ 'error': 'Event not found' }).end();
        } else if (!user) {
            res.status(404).send({ 'error': 'User not found' }).end();
        } else {
            // Needs to be admin and event needs to have run the decision engine before
            if (event.admin.equals(user._id) && event.yelpid !== undefined) {
                EventTimer.addEventTimer(event._id, 0);
                res.status(200).send({ 'success': 'Reroll successful' }).end();
            } else {
                res.status(401).send({ 'error': 'You can\'t reroll this event!' }).end();
            }
        }
    })
    .catch(function(err) {
        res.status(400).send({ 'error': err }).end();
    });
}

function lockInEventHandler(req, res){
    res.setHeader('Content-Type', 'application/json');

    if (!req.fbUser) {
        res.status(400).send({ 'error': 'Access Token Required' }).end();
        return;
    }

    var eventId = req.params.eventId;

    if (!eventId) {
        res.status(400).send({ 'error': 'Event id required' }).end();
        return;
    }

    var promises = [
        Event.findById(eventId),
        User.findOne({ 'fbtokenid': req.fbUser.id })
    ]

    Promise.all(promises).then(function(results) {
        var event = results[0];
        var user  = results[1];

        if (!event) {
            res.status(404).send({ 'error': 'Event not found' }).end();
        } else if (!user) {
            res.status(404).send({ 'error': 'User not found' }).end();
        } else {
            var userId = user._id;
            var eventId = event._id;

            if (!event.admin.equals(userId)) {
                res.status(400).send({ 'error': 'Only the admin can lock in the event' }).end();
            } else if (event.yelpid !== undefined) {
                res.status(400).send({ 'error': 'Decision already made!' }).end();
            } else {
                EventTimer.runDecisionEngine(eventId);

                res.status(200).send({ 'success': 'Successfully locked in the event' }).end();
            }
        }
    })
    .catch(function(err) {
        res.status(400).send({ 'error': err }).end();
    });
}

module.exports.getEventsHandler = getEventsHandler
module.exports.createEventHandler = createEventHandler

module.exports.getEventHandler = getEventHandler
module.exports.updateEventHandler = updateEventHandler
module.exports.cancelEventHandler = cancelEventHandler

module.exports.getEventUsersHandler = getEventUsersHandler;

module.exports.leaveEventHandler = leaveEventHandler;

module.exports.rerollHandler = rerollHandler;

module.exports.lockInEventHandler = lockInEventHandler;
