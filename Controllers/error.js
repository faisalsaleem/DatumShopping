var express = require('express')
    , router = express.Router()

router.get('/404', function (req, res) {
    res.render('404', { title: 'Not Found', isAuthenticated: req.isAuthenticated() });
});

router.get('/500', function (req, res) {
    res.render('500', { title: 'Internal Server Error', isAuthenticated: req.isAuthenticated() });
});

module.exports = router;

