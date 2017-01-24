const expect = require('chai').expect;
const database = require('../database/database.js').databaseInit();
const User = require('../database/UserSchema.js').User;
const Event = require('../database/EventSchema.js');
const deepCopy = require('deepcopy');

const event1JSON = require('./json/event1.json');
const event2JSON = require('./json/event2.json');
const user1JSON = require('./json/user1.json');
const user2JSON = require('./json/user2.json');
const user3JSON = require('./json/user3.json');

const fakeLocation = { lat: 123, lon: 123 };

describe('DatabaseEvent Test', function() {
    var userIds = [];
    var userFbToken = [];
    beforeEach(function(done) {
        this.timeout(4000);
        var user1 = new User(deepCopy(user1JSON));
        var user2 = new User(deepCopy(user2JSON));
        var user3 = new User(deepCopy(user3JSON));

        var usersPromise = [];
        usersPromise.push(user1.save());
        usersPromise.push(user2.save());
        usersPromise.push(user3.save());

        userIds.push(user1._id);
        userIds.push(user2._id);
        userIds.push(user3._id);

        userFbToken.push(user1.fbtokenid);
        userFbToken.push(user2.fbtokenid);
        userFbToken.push(user3.fbtokenid);

        var i = 0;
        Promise.all(usersPromise).then(function() {
            done();
        });
    });

    afterEach(function(done) {
        var usersPromise = [];
        for (var userId of userIds) {
            usersPromise.push(User.findOneAndRemove({ _id: userId }).exec());
        }

        Promise.all(usersPromise).then(function() {
            userIds = [];
            userFbToken = [];
            done();
        });
    });

    it("Creating an event", function(done) {
        this.timeout(10000);
        // first create a User
        var userId = userIds[0];
        Event.createEvent(deepCopy(event1JSON),
            userId,
            fakeLocation,
            function(errEvent, eventInstance) {
                if (errEvent) done("Failed To createEvent" + errEvent);
                expect(eventInstance.admin).to.equal(userId);
                User.findOne({ _id: userId }, function(err, user) {
                    if (err) {
                        done("failed to find user");
                        return;
                    }
                    expect(user.eventsjoined.length).to.equal(1);
                    Event.Event.findOne({ _id: eventInstance._id }).remove(function() {
                        done();
                    });
                });
            });
    });

    it("Creating an event and inviting one friend using userID", function(done) {
        var userId = userIds[0];
        Event.createEvent(deepCopy(event1JSON),
            userId,
            fakeLocation,
            function(errEvent, eventInstance) {
                if (errEvent) done("Failed To createEvent" + errEvent);
                expect(eventInstance.admin).to.equal(userId);
                Event.inviteFriend_Id(eventInstance._id, userId, userIds[1], function(err) {
                    if (err) {
                        done("Error inviting friend: " + err);
                        return;
                    }
                    Event.Event.findOne({ _id: eventInstance._id }, function(err, event) {
                        expect(event.invitations.length).to.equal(1);
                        Event.Event.findOne({ _id: eventInstance._id }).remove(function() {
                            done();
                        });
                    });
                });
            });
    });

    it("Creating an event and inviting friends using userID", function(done) {
        var userId = userIds[0];
        Event.createEvent(deepCopy(event1JSON),
            userId,
            fakeLocation,
            function(errEvent, eventInstance) {
                if (errEvent) done("Failed To createEvent" + errEvent);
                expect(eventInstance.admin).to.equal(userId);
                var invites = [userIds[1], userIds[2]];
                Event.inviteFriends_Id(eventInstance._id, userId, invites, function(err) {
                    if (err) {
                        done("failed on inviting friends");
                        return;
                    }
                    Event.Event.findOne({ _id: eventInstance._id }, function(err, event) {
                        expect(event.invitations.length).to.equal(2);
                        Event.Event.findOne({ _id: eventInstance._id }).remove(function() {
                            done();
                        });
                    });
                });
            });
    });

    it("Creating an event and inviting one friend using FaceBookToken", function(done) {
        var userId = userIds[0];
        Event.createEvent(deepCopy(event1JSON),
            userId,
            fakeLocation,
            function(errEvent, eventInstance) {
                if (errEvent) done("Failed To createEvent" + errEvent);
                expect(eventInstance.admin).to.equal(userId);
                var invite = userFbToken[1];
                Event.inviteFriend_FbId(eventInstance._id, userId, invite, function(err) {
                    if (err) {
                        done("failed on inviting friends");
                        return;
                    }
                    Event.Event.findOne({ _id: eventInstance._id }, function(err, event) {
                        expect(event.invitations.length).to.equal(1);
                        Event.Event.findOne({ _id: eventInstance._id }).remove(function() {
                            done();
                        });
                    });
                });
            });
    });

    it("Creating an event and inviting friends using FaceBookToken", function(done) {
        var userId = userIds[0];
        Event.createEvent(deepCopy(event1JSON),
            userId,
            fakeLocation,
            function(errEvent, eventInstance) {
                if (errEvent) done("Failed To createEvent" + errEvent);
                expect(eventInstance.admin).to.equal(userId);
                var invite = [userFbToken[1], userFbToken[2]];
                Event.inviteFriends_FbId(eventInstance._id, userId, invite, function(err) {
                    if (err) {
                        done("failed on inviting friends");
                        return;
                    }
                    Event.Event.findOne({ _id: eventInstance._id }, function(err, event) {
                        expect(event.invitations.length).to.equal(2);
                        Event.Event.findOne({ _id: eventInstance._id }).remove(function() {
                            done();
                        });
                    });
                });
            });
    });

    it("Creating an event and inviting friends using id and then accepting", function(done) {
        var userId = userIds[0];
        Event.createEvent(deepCopy(event1JSON),
            userId,
            fakeLocation,
            function(errEvent, eventInstance) {
                if (errEvent) done("Failed To createEvent" + errEvent);
                expect(eventInstance.admin).to.equal(userId);
                var invite = userIds[1];
                Event.inviteFriend_Id(eventInstance._id, userId, invite, function(err) {
                    if (err) {
                        done("failed on inviting friends");
                        return;
                    }
                    Event.respond_To_Invitation(eventInstance._id, userIds[1], true, fakeLocation, function(err, event) {
                        if (err) {
                            done("failed on accept inviting: " + err);
                            return;
                        }
                        Event.Event.findOne({ _id: eventInstance._id }, function(err, event) {
                            expect(event.invitations.length).to.equal(0);
                            expect(event.attendees.length).to.equal(1);
                            expect(event.attendees[0]).to.deep.equal(userIds[1]);
                            Event.Event.findOne({ _id: eventInstance._id }).remove(function() {
                                done();
                            });
                        });
                    });
                });
            });
    });

    it("Creating an event and inviting friends using id and then declining", function(done) {
        var userId = userIds[0];
        Event.createEvent(deepCopy(event1JSON),
            userId,
            fakeLocation,
            function(errEvent, eventInstance) {
                if (errEvent) done("Failed To createEvent" + errEvent);
                expect(eventInstance.admin).to.equal(userId);
                var invite = userIds[1];
                Event.inviteFriend_Id(eventInstance._id, userId, invite, function(err) {
                    if (err) {
                        done("failed on inviting friends");
                        return;
                    }
                    Event.respond_To_Invitation(eventInstance._id, userIds[1], false, fakeLocation, function(err, event) {
                        if (err) {
                            done("failed on accept inviting: " + err);
                            return;
                        }
                        Event.Event.findOne({ _id: eventInstance._id }, function(err, event) {
                            expect(event.invitations.length).to.equal(0);
                            expect(event.attendees.length).to.equal(0);
                            Event.Event.findOne({ _id: eventInstance._id }).remove(function() {
                                done();
                            });
                        });
                    });
                });
            });
    });

    it("Creating an event and then accepting without invitations", function(done) {
        var userId = userIds[0];
        Event.createEvent(deepCopy(event1JSON),
            userId,
            fakeLocation,
            function(errEvent, eventInstance) {
                if (errEvent) done("Failed To createEvent" + errEvent);
                expect(eventInstance.admin).to.equal(userId);
                Event.respond_To_Invitation(eventInstance._id, userIds[1], true, fakeLocation, function(err, event) {
                    expect(err).to.not.be.null;
                    expect(event).to.be.undefined;
                    Event.Event.findOne({ _id: eventInstance._id }, function(err, event) {
                        expect(event.invitations.length).to.equal(0);
                        expect(event.attendees.length).to.equal(0);
                        Event.Event.findOne({ _id: eventInstance._id }).remove(function() {
                            done();
                        });
                    });
                });
            });
    });

    it("Creating an closed event and inviting admin inviting friends", function(done) {
        var userId = userIds[0];
        Event.createEvent(deepCopy(event2JSON),
            userId,
            fakeLocation,
            function(errEvent, eventInstance) {
                if (errEvent) done("Failed To createEvent" + errEvent);
                expect(eventInstance.admin).to.equal(userId);
                var invite = userIds[1];
                Event.inviteFriend_Id(eventInstance._id, userId, invite, function(err) {
                    if (err) {
                        done("failed on inviting friends");
                        return;
                    }

                    Event.Event.findOne({ _id: eventInstance._id }, function(err, event) {
                        expect(event.invitations.length).to.equal(1);
                        expect(event.attendees.length).to.equal(0);
                        Event.Event.findOne({ _id: eventInstance._id }).remove(function() {
                            done();
                        });
                    });
                });
            });
    });

    it("Creating an closed event and inviting an invitee inviting friends", function(done) {
        var userId = userIds[0];
        Event.createEvent(deepCopy(event2JSON),
            userId,
            fakeLocation,
            function(errEvent, eventInstance) {
                if (errEvent) done("Failed To createEvent" + errEvent);
                expect(eventInstance.admin).to.equal(userId);
                var invite = userIds[1];
                Event.inviteFriend_Id(eventInstance._id, userId, invite, function(err) {
                    if (err) {
                        done("failed on inviting friends");
                        return;
                    }
                    invite = userIds[2];
                    Event.inviteFriend_Id(eventInstance._id, userId[1], invite, function(err) {
                        expect(err).to.equal('Closed');
                        Event.Event.findOne({ _id: eventInstance._id }, function(err, event) {
                            expect(event.invitations.length).to.equal(1);
                            expect(event.attendees.length).to.equal(0);
                            Event.Event.findOne({ _id: eventInstance._id }).remove(function() {
                                done();
                            });
                        });
                    });
                });
            });
    });

    it("Creating an closed event and inviting an a non-member inviting friends", function(done) {
        var userId = userIds[0];
        Event.createEvent(deepCopy(event2JSON),
            userId,
            fakeLocation,
            function(errEvent, eventInstance) {
                if (errEvent) done("Failed To createEvent" + errEvent);
                expect(eventInstance.admin).to.equal(userId);
                var invite = userIds[1];
                Event.inviteFriend_Id(eventInstance._id, userId[2], invite, function(err) {
                    expect(err).to.equal('Closed');
                    Event.Event.findOne({ _id: eventInstance._id }, function(err, event) {
                        expect(event.invitations.length).to.equal(0);
                        expect(event.attendees.length).to.equal(0);
                        Event.Event.findOne({ _id: eventInstance._id }).remove(function() {
                            done();
                        });
                    });
                });
            });
    });

});
