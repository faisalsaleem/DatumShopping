exports.isAuthorized = function isLoggedIn(options) {
    if (typeof options == 'string') {
        options = { redirectTo: options }
    }
    options = options || {};

    var url = options.redirectTo || '/login';
    var setReturnTo = (options.setReturnTo === undefined) ? true : options.setReturnTo;

    return function(req, res, next) {

        console.log('Authorize body: ' + JSON.stringify(req.user));

        if (!req.isAuthenticated || !req.isAuthenticated()) {
            if (setReturnTo && req.session) {
                req.session.returnTo = req.originalUrl || req.url;
            }
            return res.redirect(url);
        }
        else if (!req.user || !req.user.username || req.user.username != 'faisal'){
            return res.redirect('/Error/404');
        }
        next();
    }
};
