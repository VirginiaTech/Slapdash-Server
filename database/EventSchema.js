const debug = require('debug')('database:event');
const User = require('./UserSchema.js').User;
const mongoose = require('mongoose');
const fcm = require('../thirdparty-api/fcm-server.js');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

// ============================= $ Schema $ ====================================
var EventSchema = new Schema({
    title: {
        type: String,
        default: 'New Event'
    },
    description: {
        type: String,
        default: 'Event Description'
    },
    category: {
        type: String,
        enum: ['Food', 'Play', 'Drink', 'SlapDash']
    },
    yelpid: {
        type: String
    },
    capacity: {
        type: Number,
        min: 1
    },
    starttime: Date,
    createtime: {
        type: Date,
        default: Date.now
    },
    invitations: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    attendees: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    admin: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    timeout: {
        type: Number,
        min: 1,
        /* 5 Min */
        default: 15/* 15 Min */
    },
    userpermissions: {
        type: String,
        enum: ['Open', 'Closed', 'Approval'],
        default: 'Open'
    },
    canceled: Boolean
}, {
    toJSON: {virtuals: true}
});

var Event = mongoose.model('Event', EventSchema);

// Virtual Helpers
EventSchema.virtual('starttimeLong').get(function() {
  return this.starttime.getTime();
});

EventSchema.virtual('createtimeLong').get(function() {
  return this.createtime.getTime();
});


// ============================= $ Helpers $ ====================================
/**
 * The wrapper for creating a new event and saving it the database
 * @param {object} newEvent The event specification based on EventSchema
 * @param {object} user The user that has created this event.
 * @param {Function} callback The function that will be called after
 *                      the function is done. The callback function
 *                      should accept two parameters.
 *                      Here is an example of an acceptable callback:
 *
 *                      function doSomething(err, eventInstance)
 *
 * When there is a error saving the fall callback will only be called
 * with the err parameter.
 */
function CreateEvent(newEvent, userId, location, callback) {
    if (!callback || typeof callback !== 'function') {
        throw "Function CreateEvent needs a function for the callback";
    }
    var eventInstance = new Event(newEvent);

    /* Set the admin attribute */
    User.findOne({ _id: userId }, function(err, user) {
        if (err) {
            callback("err: couldn't find a user with userId:" + userId);
            return;
        }

        EventTimer.addEventTimer(eventInstance._id, eventInstance.timeout);

        eventInstance.admin = userId;
        user.eventsjoined.push(eventInstance._id);

        if (location && location.lat && location.lon) {
            user.recentlocation = location;
        }

        user.save(function(errSaveUser) {
            if (errSaveUser) { // Error is not null so error happened
                callback(errSaveUser);
                debug('Error happened saving the user: ' + errSaveUser);
            }
            eventInstance.save(function(errSave) {
                if (errSave) { // Error is not null so error happened
                    callback(errSave);
                    debug('Error happened saving the event: ' + errSave);
                }
                // Went OK and having a callback
                callback(null, eventInstance);
            });
        });
    });
}

// ========================================================================
/**
 * Invite a single friend to an event using their userId
 * @param {object}   eventId   The id of event to invite friend to
 * @param {ObjectId} inviterId Id of user who is inviting the friend
 * @param {ObjectId} userId    Id of the user being invited to the event
 * @param {Function} callback  The callback will be called when the function
 *                             was either successful to invite the friend or
 *                             an error occurred during the process.
 * Two main error this method will throw is when the inviterId is not
 * authorized to invite the user So the error will be either 'Closed' or
 * 'Approval'.
 */
function InviteFriend_Id(eventId, inviterId, userId, callback) {
    if (!callback || typeof callback !== 'function') {
        throw "Function InviteFriend_Id needs a function for the callback";
    }

    if (userId.length) {
        throw new Error("This function expects the userId to be a single ObjectId");
    }


    Event.findOne({ _id: eventId }, function(err, event) {
        // Handle the err
        if (err) {
            callback(err);
            return;
        }

        var permission = UserCanInviteToEvent(event, inviterId);
        if(permission === 0){
            callback('Approval');
            return;
        } else if (permission === -1){
            callback('Closed');
            return;
        }
        // add UserId to the list of invitations
        event.invitations.push(userId);
        event.save(function(errSave) {
            if (errSave) callback(errSave);
            else callback(null, event);
        });
    });
}

// ========================================================================
/**
 * Invite a single friend to an event using the user facebook tokenId.
 * @param {object}   eventId   The id of event to invite friend to
 * @param {ObjectId} inviterId Id of user who is inviting the friend
 * @param {ObjectId} userFbId  FacebookId of the user being invited to the event
 * @param {Function} callback  The callback will be called when the function
 *                             was either successful to invite the friend or
 *                             an error occurred during the process.
 * Two main error this method will throw is when the inviterId is not
 * authorized to invite the user So the error will be either 'Closed' or
 * 'Approval'.
 */
function InviteFriend_FbId(eventId, inviterId, userFbId, callback) {
    if (!callback || typeof callback !== 'function') {
        throw "Function InviteFriends_Id needs a function for the callback";
    }

    Event.findOne({ _id: eventId }, function(err, event) {
        // Handle the err
        if (err) {
            callback(err);
            return;
        }

        if (!event) {
            callback('Event not found');
            return;
        }

        // Check for invitation permission
        var permission = UserCanInviteToEvent(event, inviterId);
        if (permission === 0) {
            callback('Approval');
            return;
        } else if (permission === -1) {
            callback('Closed');
            return;
        }

        var promises = [
            User.findOne({ fbtokenid: userFbId }),
            User.findOne({ _id: inviterId })
        ];

        User.findOne({ fbtokenid: userFbId }, function(err, invitedUser) {
            if (!invitedUser) {
                callback("User not found");
                return;
            }

            var userId = invitedUser._id;

            // user already invited
            if (event.invitations.indexOf(userId) >= 0) {
                callback("Already invited!");
                return;
            }

            // user already attending event
            if (event.attendees.indexOf(userId) >= 0) {
                callback("Already attending!");
                return;
            }

            if (event.admin.equals(userId)) {
                callback("Already admin!");
                return;
            }

            event.invitations.push(userId);

            User.findOne({ _id: inviterId }, function(err, invitingUser) {
                if (!invitingUser) {
                    callback("User not found");
                    return;
                }

                event.save(function(err) {
                    if (err) {
                        callback(err);
                    } else {
                        fcm.sendEventInvitation(invitingUser, event, [invitedUser.androidregid], function(err, response) {
                                debug('FCM invite: ' + response);
                        });

                        callback(null, event);
                    }
                });
            });
        });
    });
}

// ========================================================================
/**
 * Invite a multiple friends to an event using their userIds
 * @param {object}   eventId   The id of event to invite friend to
 * @param {ObjectId} inviterId Id of user who is inviting the friend
 * @param {Array} userIdsArray Array of Ids of the user being invited to the event
 * @param {Function} callback  The callback will be called when the function
 *                             was either successful to invite the friend or
 *                             an error occurred during the process.
 * Two main error this method will throw is when the inviterId is not
 * authorized to invite the user So the error will be either 'Closed' or
 * 'Approval'.
 */
function InviteFriends_Id(eventId, inviterId, userIdsArray, callback) {
    if (!callback || typeof callback !== 'function') {
        throw "Function InviteFriends_Id needs a function for the callback";
    }

    // Make sure userIdsArray is actually and array
    if (!userIdsArray.length) {
        throw new Error('userIdsArray needs to be an array');
    }

    Event.findOne({ _id: eventId }, function(err, event) {
        // Handle the err
        if (err) {
            callback(err);
            return
        }

        // Check for invitation permission
        var permission = UserCanInviteToEvent(event, inviterId);
        if(permission === 0){
            callback('Approval');
            return;
        } else if (permission === -1){
            callback('Closed');
            return;
        }

        for (var userId of userIdsArray) {
            // add UserId to the list of invitations
            event.invitations.push(userId);
        }
        event.save(function(err) {
            if (err) callback(err);
            // Went OK
            else callback(null, event);
        });
    });
}

// ========================================================================
/**
 * Invite a multiple friends to an event using the users facebook tokenId.
 * @param {object}   eventId   The id of event to invite friend to
 * @param {ObjectId} inviterId Id of user who is inviting the friend
 * @param {Array} userFbIdArray Array of FacebookIds of the users being invited to the event
 * @param {Function} callback  The callback will be called when the function
 *                             was either successful to invite the friend or
 *                             an error occurred during the process.
 * Two main error this method will throw is when the inviterId is not
 * authorized to invite the user So the error will be either 'Closed' or
 * 'Approval'.
 */
function InviteFriends_FbId(eventId, inviterId, userFbIdArray, callback) {
    if (!callback || typeof callback !== 'function') {
        throw "Function InviteFriends_Id needs a function for the callback";
    }

    if (!Array.isArray(userFbIdArray)) {
        throw new Error('userFbIdArray needs to be an array');
    }

    Event.findOne({ _id: eventId }, function(err, event) {
        // Handle the err
        if (err) {
            callback(err);
            return;
        }

        // Check for invitation permission
        var permission = UserCanInviteToEvent(event, inviterId);
        if(permission === 0){
            callback('Approval');
            return;
        } else if (permission === -1){
            callback('Closed');
            return;
        }

        User.find({ fbtokenid: { $in: userFbIdArray } }, function(err, users) {
            // Handle the err
            if (err) {
                callback(err);
                return;
            }

            var firebaseTokens = [];

            /* Iterate through all the users to be invited */
            for (var user of users) {
                var userId = user._id;

                // user already invited
                if (event.invitations.indexOf(userId) >= 0) {
                    callback("Already invited!");
                    return;
                }

                // user already attending event
                if (event.attendees.indexOf(userId) >= 0) {
                    callback("Already attending!");
                    return;
                }

                if (event.admin.equals(userId)) {
                    callback("Already admin!");
                    return;
                }

                firebaseTokens.push(user.androidregid);
                event.invitations.push(user._id);
            }

            User.findOne({ _id: inviterId }, function(err, invitingUser) {
                if (!invitingUser) {
                    callback("User not found");
                    return;
                }

                event.save(function(err) {
                    if (err) {
                        callback(err);
                    } else {
                        fcm.sendEventInvitation(invitingUser, event,
                            firebaseTokens, function(err, response) {
                                console.log(response);
                        });

                        callback(null, event);
                    }
                });
            });
        });
    });
}

// ==========================================================================
/**
 * Can respond to an event invitation using the eventId and the userId
 * responding.
 * @param {ObjectId}  eventId  The id of event to invite friend to
 * @param {ObjectId}  userId   Id of the user being invited to the event
 * @param {boolean}   accept   True if user accepted. False if user denied
 * @param {Object}    location The location of the user. Contains lat and lon.
 * @param {Function}  callback To be called when the responding has been processed
 */
function Respond_To_Invitation(eventId, userId, accept, location, callback) {
    if (!callback || typeof callback !== 'function') {
        throw "Function Respond_To_Invitation needs a function for the callback";
    }

    /* First find the event with the given id */
    Event.findOne({ _id: eventId }, function(err, event) {
        // Handle the err
        if (err) {
            callback(err);
            return;
        }
        User.findOne({ _id: userId }, function(err, user) {
            if (err) {
                callback(err);
                return;
            }

            var userId = user._id;
            var eventId = event._id;

            var index = event.invitations.indexOf(userId);
            if (index >= 0) {
                event.invitations.splice(index, 1);
                if (accept) {
                    event.attendees.push(userId);
                    user.eventsjoined.push(eventId);

                    if (location && location.lat && location.lon) {
                        user.recentlocation = location;
                    }
                }

                var savePromises = [ user.save(), event.save() ];

                Promise.all(savePromises).then(function(results) {
                    callback(null, event);
                })
                .catch(function(err) {
                    callback(err);
                });

            } else {
                callback("User is not invited to the event.");
            }
        });
    });
}

// ==========================================================================
/**
 * Validates that the user with the given Id has permission to
 * invite to a specific events.
 * @param {object} event       The event that a user is being invited
 * @param {ObjectId} inviterId The Object Id of user that is inviting
 */
function UserCanInviteToEvent(event, inviterId) {
    if (event.admin.equals(inviterId)) {
        return 1; // Admin can invite others
    } else if (event.invitations.indexOf(inviterId) >= 0) {
        if (!event.userpermissions || event.userpermissions === 'Open') {
            return 1; // No user permission so its Open or Open
        } else if (event.userpermissions === 'Closed') {
            return -1; // doesn't have permission
        } else {
            return 0; // Need Admin Approval
        }
    } else { // User not admin or invitee
        return -1;
    }
}

module.exports.Event = Event;
module.exports.createEvent = CreateEvent;
module.exports.inviteFriend_Id = InviteFriend_Id;
module.exports.inviteFriends_Id = InviteFriends_Id;
module.exports.inviteFriend_FbId = InviteFriend_FbId;
module.exports.inviteFriends_FbId = InviteFriends_FbId;
module.exports.respond_To_Invitation = Respond_To_Invitation;

// Need to put it down here to prevent cyclic references
const EventTimer = require('../lib/event-timer.js');
