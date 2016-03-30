var express = require('express')
    , router = express.Router()
    //, urlencodedParser = require('body-parser').urlencoded({ extended: false })
    //, formidable = require("formidable")
    //, fs = require('fs')
    //, uuid = require('node-uuid')
    , path = require('path')
    , routesAuthorize = require('./authorize.js')
    , cradle = require('cradle')
    , db = new(cradle.Connection)('192.168.1.13').database('datum_shopping')

var appBaseFolder = path.join(__dirname, '\\..');
var uploadFolder = appBaseFolder + "\\public\\uploads\\";

router.get('/', routesAuthorize.isAuthorized(), function (req, res) {
    var type = 'Checkout';

    console.log('Authorize: ' + routesAuthorize.ensureLoggedIn);

    db.view('sales/by_date', function (err, rows) {
        if (!err) {
            res.render('sales_list', { title: 'Sales', isAuthenticated: req.isAuthenticated(), data: rows })
        }
        else {
            console.log(err);
            console.log(rows);
            console.log('There was an error fetching sales.' + err);
        }
    })
});

router.post('/Delete', routesAuthorize.isAuthorized(), function (req, res) {
    console.log('id:' + req.query.id + ', rev:' + req.query.rev);
    
    db.remove(req.query.id, req.query.rev, function (err, body) {
        if (!err) {
            console.log('Document deleted with id:' + req.query.id)
            
            res.redirect('/Sales');
        }
    });
});

module.exports = router;

