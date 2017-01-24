/**
 *  This should include all the routing in the server
 *  If there is any file or handler created that should
 *  listen on a path add it to the 'routes' and it should
 *  be added to the listeners
 *  Note: It will be cleaner if function are in different
 *  files than this file and are imported here
 */
const apiRouter = require('express').Router();
const debug = require('debug')('server:router');
const config = require('config');

const userRouting = require('../api/user-routing.js');
const eventRouting = require('../api/event-routing.js');

const middlewareAccessTokenFilter = require('../middleware/access-token-filter.js');

apiRouter.use(middlewareAccessTokenFilter.accessTokenFilter);

// Only allow "get all" api calls to be used in development
if (config.util.getEnv('NODE_ENV') === 'dev') {
    apiRouter.get('/api/v1/events', eventRouting.getEventsHandler);
    apiRouter.get('/api/v1/users', userRouting.getUsersHandler);
}

apiRouter.post('/api/v1/users', userRouting.createUserHandler);

apiRouter.post('/api/v1/users/invite', userRouting.usersInviteHandler);

apiRouter.post('/api/v1/users/invitations/respond', userRouting.userInvitationResponseHandler);
apiRouter.get('/api/v1/users/:userId/invitations', userRouting.getUserInvitationsHandler);

apiRouter.get('/api/v1/users/:userId', userRouting.getUserHandler);
apiRouter.put('/api/v1/users/:userId', userRouting.updateUserHandler);

apiRouter.get('/api/v1/users/:userId/events', userRouting.getUsersEventsHandler);

apiRouter.post('/api/v1/events', eventRouting.createEventHandler);

apiRouter.get('/api/v1/events/:eventId', eventRouting.getEventHandler);
apiRouter.put('/api/v1/events/:eventId', eventRouting.updateEventHandler);

apiRouter.post('/api/v1/events/:eventId/leave', eventRouting.leaveEventHandler);

apiRouter.post('/api/v1/events/:eventId/cancel', eventRouting.cancelEventHandler);

apiRouter.get('/api/v1/events/:eventId/users', eventRouting.getEventUsersHandler);

apiRouter.post('/api/v1/events/:eventId/reroll', eventRouting.rerollHandler);
apiRouter.post('/api/v1/events/:eventId/lockin', eventRouting.lockInEventHandler);


apiRouter.get('/api/v1', apiV1Handler);

/**
 * Function that will verify that api/v1 is accessed
 * @param  {object} req The request http
 * @param  {object} res The http response
 */
function apiV1Handler(req, res) {
    res.setHeader('Content-Type', 'application/json');
    var apiV1 = { 'message': 'You have accessed SlapDash API' };
    res.status(200).send(apiV1).end();
};

module.exports = apiRouter;
