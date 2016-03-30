/**
 * Created by faisal on 3/22/2016.
 */
var express = require('express')
    , router = express.Router()

router.use('/', function(req, res, next) {
   console.log('/Temp Request Type:' + req.method);
    next();
});

router.get('/', function (req, res, next) {
    res.send('Temp');
});

router.post('/', function (req, res, next) {
    res.send('Post Temp');
});

router.get('/user/:id', function (req, res, next) {
    // if the user ID is 0, skip to the next route
    if (req.params.id == 0) next('route');
    // otherwise pass the control to the next middleware function in this stack
    else next(); //
}, function (req, res, next) {
    // render a regular page
    res.send('regular');
});

// handler for the /user/:id path, which renders a special page
router.get('/user/:id', function (req, res, next) {
    res.send('special');
});

module.exports = router;
