var express = require('express')
    , router = express.Router()
    , urlencodedParser = require('body-parser').urlencoded({ extended: false })
    , formidable = require("formidable")
    , fs = require('fs')
    , uuid = require('node-uuid')
    , path = require('path')

var appBaseFolder = path.join(__dirname, '\\..');
var uploadFolder = appBaseFolder + "\\public\\uploads\\";

router.get('/', function (req, res) {
    console.log(req.session.cart);

    res.render('cart_list', { title: 'Shopping Cart', isAuthenticated: req.isAuthenticated(), data: req.session.cart })
});

module.exports = router;

