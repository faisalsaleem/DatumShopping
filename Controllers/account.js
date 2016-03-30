var express = require('express');
var router = express.Router();

//router.use(function timelog(req, res, next) {
//    console.log('Time:', Date.now());
//    next();
//});

router.get('/Login', function (req, res) {
    res.render('login', { title: 'Login' })
});

module.exports = router;

