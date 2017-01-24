const FB = require('fb');

function accessTokenFilter(req, res, next) {
    token = req.query.accesstoken;

    if (token) {
        FB.api('me', { access_token: token }, function (result) {
            if (!result || result.error) {
                var msg = !result ? 'error occurred' : result.error
                res.status(400).send({ 'error': msg }).end();
                return;
            } else {
                req.fbUser = result;
                next();
            }
        });
    } else {
        next();
    }
};

module.exports.accessTokenFilter = accessTokenFilter;
