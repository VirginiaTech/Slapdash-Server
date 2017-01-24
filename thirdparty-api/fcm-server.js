const FCM = require('fcm-node');
const User = require('../database/UserSchema.js').user;

var serverkey = 'AIzaSyDRZQvxuAkaqRLD1SMzjJQNtrKEGpBej58';
var fcm = new FCM(serverkey);

String.prototype.capitalizeFirstLetter = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

/* */
function sendEventInvitation(inviter, event, tokens, callback){
    var message = {};
    message.registration_ids = tokens;
    message.data = {
	type: "INVITATION",
	_id: event._id,
	title: event.title,
	description: event.description,
	admin: inviter.name.firstname + " " + inviter.name.lastname,
    adminFbTokenId: inviter.fbtokenid,
	category: event.category,
	starttimeLong: event.starttime.getTime()};

    fcm.send(message,callback);
}

function sendEventDecision(event, tokens, data, callback) {
    var message = {};

    message.registration_ids = tokens;

    message.data = {
        type: "DECISION",
        eventId: event._id,
        eventTitle: event.title,
        eventDescription: event.description,
        starttimeLong: event.starttime.getTime(),
        category: event.category,
        place_id: data.place_id
    }

    fcm.send(message,callback);
}

function sendPermissionRequest(event, requestUser, invitee, callback){
    var message = {};
    message.notification = {};
    message.notification.title = "Permission Request";
    message.notification.body = requestUser.name.firstname.concat(" wants to invite ")
                                                          .concat(invitee.name.firstname)
                                                          .concat(" to your event");
    // may add event info.
    User.findOne({ _id: event.admin }, function(err, user) {
        if (err) {
            // report error
            return;
        }
        message.to = user.androidregid;// is androidregid fcm id?
        message.notification.body.capitalizeFirstLetter();
        fcm.send(message,callback);
    });
}

function sendRespondToInvitation(inviter, event, respond, invitee, callback){

    var message = {};
    message.notification = {};
    message.to = inviter.androidregid;
    message.notification.title = "Respond to Invitation";
    if(respond){
        message.notification.body = invitee.name.firstname.concat(" accepted your invitation");
    }
    else{
        message.notification.body = invitee.name.firstname.concat(" denied your invitation");
    }
    // May add event description in notification
    message.notification.body.capitalizeFirstLetter();
    fcm.send(message,callback);
}

function sendEventUpdate(event, updateInfo, callback) {
    var message = {};
    message.notification = {};
    message.notification.title = "Event Update";
    message.notification.body = updateInfo;
    event.attendees.forEach(function(userId){
        User.findOne({ _id: userId }, function(err, user) {
            if (err) {
                // report error
                return;
            }
            message.to = user.androidregid;// is androidregid is fcm id?
            message.notification.body.capitalizeFirstLetter();
            fcm.send(message,callback);
        });
    });

    User.findOne({ _id: event.admin }, function(err, user) {
        if (err) {
            // report error
            return;
        }
        message.to = user.androidregid;// is androidregid fcm id?
        message.notification.body.capitalizeFirstLetter();
        fcm.send(message,callback);
    });
}

function sendEventCancellation(event, callback){
    var message = "Event Cancelled by ";
    User.findOne({ _id: event.admin }, function(err, user) {
        if (err) {
            // report error
            return;
        }
        message.concat(user.name.firstname);// is there a user nickname?
    });
    sendEventUpdate(event, message, callback);
}

// Should be called after the person has been removed.
function sendRemoveFromEvent(event, removedUser, callback){
    var message = {};
    message.notification = {};
    message.notification.title = "Remove from Event";
    message.notification.body = "You have been removed from the event";
    message.to = removedUser.androidregid; //  is androidregid is fcm id?
    // may add event info
    message.notification.body.capitalizeFirstLetter();
    fcm.send(message, callback);

    var message1 = removedUser.name.firstname.concat(" has been removed from the event");
    sendEventUpdate(event, message1, callback);
}

function sendAttendeeLeft(event, leftUser, callback){
    var message = leftUser.name.firstname.concat(" has left the event");
    // may add event info in notification
    sendEventUpdate(event, message, callback);
}

function sendAttendeeJion(event, joinedUser, callback){
    var message = joinedUser.name.firstname.concat(" has joined the event");
    // may add event info in notification
    sendEventUpdate(event, message, callback);
}

module.exports.sendEventInvitation = sendEventInvitation;
module.exports.sendEventDecision = sendEventDecision;
module.exports.sendPermissionRequest = sendPermissionRequest;
module.exports.sendRespondToInvitation = sendRespondToInvitation;
module.exports.sendEventUpdate = sendEventUpdate;
module.exports.sendRemoveFromEvent = sendRemoveFromEvent;
module.exports.sendAttendeeLeft = sendAttendeeLeft;
module.exports.sendAttendeeJion = sendAttendeeJion;
