const FB = require('fb');
const db = require('../database/database.js');

var UserSchema = db.UserSchema;
var EventSchema = db.EventSchema;

var User = UserSchema.User;
var Event = EventSchema.Event;

function getUsersHandler(req, res) {
    res.setHeader('Content-Type', 'application/json');

    var loadAllUsers = User.find({});

    loadAllUsers.then(function(users) {
        res.status(200).send(users).end();
    })
    .catch(function(err) {
        res.status(400).send({ msg: err }).end();
    });
}

/**
 * JSON request body:
 * {
	"user": {
		"name": {
            "firstname": "Alex",
            "lastname": "Marshall"
        },
    	"email": "amhokies@gmail.com",
    	"androidregid": "sj2k32j3klsfsajfl"
	},
	"accesstoken": "j23j4j234kljlwlfjsfkjasls"
   }
 */
function createUserHandler(req, res) {
    res.setHeader('Content-Type', 'application/json');

    if (!req.fbUser) {
        res.status(400).send({ 'error': 'Access Token Required' }).end();
        return;
    }

    var user = req.body;

    if (!user) {
        res.status(400).send({ 'error': 'User object required' }).end();
        return;
    }

    if (!user.androidregid) {
        res.status(400).send({ 'error': 'androidregid required' }).end();
        return;
    }

    var userParams = {
        name: {
            firstname: req.fbUser.first_name,
            lastname: req.fbUser.last_name
        },
        email: req.fbUser.email,
        fbtokenid: req.fbUser.id,
        androidregid: user.androidregid,
    };

    var findUser = User.findOne({ fbtokenid: req.fbUser.id });

    findUser.then(function(foundUser) {
        if (foundUser) {
            foundUser.androidregid = user.androidregid;

            foundUser.save().then(function() {
                res.status(200).send(foundUser).end();
            })
        } else {
            var newUser = new User(userParams);
            newUser.save().then(function() {
                res.status(201).send(newUser).end();
            });
        }
    })
    .catch(function(err) {
        res.status(400).send({ 'error': err }).end();
    });
};

function getUserHandler(req, res) {
    res.setHeader('Content-Type', 'application/json');

    var userId = req.params.userId;

    var findUser = User.findOne({ 'fbtokenid': userId }).exec();

    findUser.then(function(user) {
        if (!user) {
            res.status(404).send({ 'error': 'User not found' }).end();
        } else {
            res.status(200).send(user).end();
        }
    })
    .catch(function(err) {
        res.status(400).send({ 'error': err }).end();
    });
};

function updateUserHandler(req, res) {
    res.setHeader('Content-Type', 'application/json');

    if (!req.fbUser) {
        res.status(400).send({ 'error': 'Access Token Required' }).end();
        return;
    }

    var userId = req.params.userId;
    var updatedUser = req.body;
    var loc = updatedUser.recentlocation;

    if (!updatedUser) {
        res.status(400).send({ 'error': 'User object required' }).end();
        return;
    }

    // The facebook id we get back should match the facebook
    // id of the user we're trying to update
    // TODO: Maybe allow admins to update a user?
    if (userId != req.fbUser.id) {
        res.status(401).send({ 'error': 'You can\'t update another user!' }).end();
        return;
    }

    // Find the user to update by user id
    var findUser = User.findOne({ 'fbtokenid': userId }).exec();

    findUser.then(function(user) {
        if (!user) {
            throw { 'code' : 404 };
        } else {

            if (updatedUser.name) {
                if (updatedUser.name.firstname)
                    user.name.firstname = updatedUser.name.firstname

                if (updatedUser.name.lastname)
                    user.name.lastname = updatedUser.name.lastname
            }

            if (loc && loc.lat && loc.lon) {
                user.recentlocation = loc;
            }

            if (updatedUser.email)
                user.email = updatedUser.email

            if (updatedUser.androidregid)
                user.androidregid = updatedUser.androidregid

            return user.save();
        }
    })
    .then(function(user) {
        res.status(200).send(user).end();
    })
    .catch({ code: 404 }, function(err) {
        res.status(404).send({ 'error': 'User not found' }).end();
    })
    .catch(function(err) {
        res.status(400).send({ 'error': err }).end();
    });
};

function getUsersEventsHandler(req, res) {
    res.setHeader('Content-Type', 'application/json');

    if (!req.fbUser) {
        res.status(400).send({ 'error': 'Access Token Required' }).end();
        return;
    }

    var fbId = req.params.userId;
    var accessToken = req.query.accesstoken;

    if (!fbId) {
        res.status(400).send({ 'error': 'Facebook id required' }).end();
        return;
    }

    // The facebook id we get back should match the facebook
    // id of the user we're trying to update
    // TODO: Maybe allow admins?
    if (fbId != req.fbUser.id) {
        res.status(401).send({ 'error': 'You can\'t get another user\'s events!' }).end();
        return;
    }

    var yesterday = new Date(new Date().getTime() - (24 * 60 * 60 * 1000));

    var findUser = User.findOne({ 'fbtokenid': fbId }, 'eventsjoined').populate({
    	path: 'eventsjoined',
        select: '-id -__v -invitations -attendees',
        match: { starttime: { $gte: yesterday } },
        populate: {
    		path: 'admin',
    		select: 'name email fbtokenid _id'
        }
    }).exec();

    findUser.then(function(user) {
        if (!user) {
            throw { 'code' : 404 };
        } else {
            res.status(200).send(user.eventsjoined.reverse()).end();
        }
    })
    .catch({ code: 404 }, function(err) {
        res.status(404).send({ 'error': 'User not found' }).end();
    })
    .catch(function(err) {
        res.status(400).send({ 'error': err }).end();
    });
};

function usersInviteHandler(req, res) {
    res.setHeader('Content-Type', 'application/json');

    if (!req.fbUser) {
        res.status(400).send({ 'error': 'Access Token Required' }).end();
        return;
    }

    var fbId = req.body.fbid;
    var eventId = req.body.eventid;

    if (!fbId) {
        res.status(400).send({ 'error': 'Facebook id required' }).end();
        return;
    }

    if (!eventId) {
        res.status(400).send({ 'error': 'Event id required' }).end();
        return;
    }

    var promises = [
        Event.findById(eventId, '_id'),
        User.findOne({ 'fbtokenid': req.fbUser.id }, '_id')
    ]

    Promise.all(promises).then(function(results) {
        var event = results[0];
        var invitingUser = results[1];

        if (!event) {
            throw { code: 404, msg: 'Event not found' };
        } else if (!invitingUser) {
            throw { code: 404, msg: 'Inviting user not found' };
        } else {
            return EventSchema.inviteFriend_FbIdAsync(event._id, invitingUser._id, fbId);
        }
    })
    .then(function(event) {
        res.status(200).send(event).end();
    })
    .catch(function(err) {
        if (err.code && err.msg) {
            res.status(err.code).send({ 'error': err.msg }).end();
        } else {
            res.status(400).send(err).end();
        }
    });
}

function userInvitationResponseHandler(req, res) {
    res.setHeader('Content-Type', 'application/json');

    if (!req.fbUser) {
        res.status(400).send({ 'error': 'Access Token Required' }).end();
        return;
    }

    var eventId = req.body.eventid;
    var accepted = req.body.accepted;
    var location = req.body.recentlocation;

    if (!eventId) {
        res.status(400).send({ 'error': 'Event id required' }).end();
        return;
    }

    if (accepted == undefined) {
        res.status(400).send({ 'error': 'Accepted param required' }).end();
        return;
    }

    var promises = [
        Event.findById(eventId, '_id'),
        User.findOne({ 'fbtokenid': req.fbUser.id }, '_id')
    ]

    Promise.all(promises).then(function(results) {
        var event = results[0];
        var user = results[1];

        if (!event) {
            throw { code: 404, msg: 'Event not found' };
        } else if (!user) {
            throw { code: 404, msg: 'Inviting user not found' };
        } else {
            return EventSchema.respond_To_InvitationAsync(event._id, user._id, accepted, location);
        }
    })
    .then(function(event) {
    	var eventToSend = event;
        eventToSend.invitations = undefined;
    	eventToSend.attendees = undefined;
    	eventToSend.admin = undefined;
    	res.status(200).send(eventToSend).end();
    })
    .catch(function(err) {
        if (err.code && err.msg) {
            res.status(err.code).send({ 'error': err.msg }).end();
        } else {
            res.status(400).send(err).end();
        }
    });
}

function getUserInvitationsHandler(req, res) {
    res.setHeader('Content-Type', 'application/json');

    if (!req.fbUser) {
        res.status(400).send({ 'error': 'Access Token Required' }).end();
        return;
    }

    var fbId = req.params.userId;

    if (!fbId) {
        res.status(400).send({ 'error': 'Facebook id required' }).end();
        return;
    }

    // The facebook id we get back should match the facebook
    // id of the user we're trying to update
    // TODO: Maybe allow admins?
    if (fbId != req.fbUser.id) {
        res.status(401).send({ 'error': 'You can\'t get another user\'s invitations!' }).end();
        return;
    }

    var findUser = User.findOne({ 'fbtokenid': req.fbUser.id }, '_id');

    findUser.then(function(user) {
        if (!user) {
            throw { code: 404, msg: 'User not found' };
        } else {
            return Event.find({ invitations: user._id });
        }
    })
    .then(function(events) {
        res.status(200).send(events).end();
    })
    .catch(function(err) {
        if (err.code && err.msg) {
            res.status(err.code).send({ 'error': err.msg }).end();
        } else {
            res.status(400).send(err).end();
        }
    });
}

module.exports.getUsersHandler = getUsersHandler
module.exports.createUserHandler = createUserHandler

module.exports.getUserHandler = getUserHandler
module.exports.updateUserHandler = updateUserHandler

module.exports.getUsersEventsHandler = getUsersEventsHandler;

module.exports.usersInviteHandler = usersInviteHandler;

module.exports.userInvitationResponseHandler = userInvitationResponseHandler;
module.exports.getUserInvitationsHandler = getUserInvitationsHandler;
