var express = require('express')
    , router = express.Router()
    , urlencodedParser = require('body-parser').urlencoded({ extended: false })
    , https = require('https')
    , paypalFile = require('../Controllers/paypal.js')
    //, routesAuthorize = require('./authorize.js')
    , cradle = require('cradle')
    , db = new(cradle.Connection)().database('datum_shopping')

router.get('/', function (req, res) {
    console.log(req.session.cart);

    res.render('cart_list', { title: 'Shopping Cart', isAuthenticated: req.isAuthenticated(), data: req.session.cart });
});

router.get('/CheckoutSuccess', function (req, res) {
    var data = req.session.cart;
    console.log(data);

    for (var i = 0; i < data.length; i++){
        data[i].DateTime = new Date();
    }

    db.save(data, function (err, body) {
         if (!err) {
             req.session.cart = [];
             console.log('Checkout transaction saved successfully.');
         }
         else {
             console.log('Checkout failed. ' + err);
         }

        res.render('cart_checkout_success', { title: 'Checkout Success', isAuthenticated: req.isAuthenticated(), data: data });
    });
});

router.get('/CheckoutError', function (req, res) {
    var data = {
        "docs": req.session.cart
    };
    console.log(data);
});

var checkoutCallback = function (req, res) {
    console.log(req.body);

    var data = {
        "docs": req.session.cart
    };

    console.log(data);

    var options = {
        host: 'api-3t.sandbox.paypal.com',
        path: '/nvp?user=sdk-three_api1.sdk.com&pwd=QFZCWN5HZM8VBG7Q&signature=A-IzJhZZjhg29XQ2qnhapuwxIDzyAZQ92FRP5dqBzVesOkzbdUONzmOU&method=SetExpressCheckout&version=98&returnUrl=http://www.google.com&cancelUrl=http://www.google.com&PAYMENTREQUEST_0_AMT=10&PAYMENTREQUEST_0_CURRENCYCODE=USD&PAYMENTREQUEST_0_PAYMENTACTION=SALE'
    };

    var req = https.get(options, function (paypalResponse) {
        console.log('STATUS: ' + paypalResponse.statusCode);
        console.log('HEADERS: ' + JSON.stringify(paypalResponse.headers));
        var token;

        paypalResponse.setEncoding('utf8');
        paypalResponse.on('data', function (chunk) {
            console.log('BODY: ' + chunk);
            console.log('ACK:' + chunk.indexOf('ACK=Success'));

            if (chunk.indexOf('ACK=Success') >= 0 && chunk.indexOf('TOKEN') >= 0 && chunk.indexOf('TIMESTAMP') >= 0) {
                token = chunk.substring(chunk.indexOf('TOKEN') + 6, chunk.indexOf('TIMESTAMP') - 1);
            };
        }).on('end', function () {
            console.log('end');
        });
    });

    db.save(data, function (err, body) {
        if (!err) {
            req.session.cart = [];
            console.log('Checkout transaction saved successfully.');
            res.redirect('/');
        }
        else {
            console.log('Checkout failed. ' + err);
            res.redirect('/Cart');
        }
    });
};

router.post('/Checkout', urlencodedParser, function (req, res) {
    var paypal = paypalFile.init('fysalsaleem_api1.gmail.com', '7HAKSGKM9XJQNH7X'
        , 'An5ns1Kso7MWUdW4ErQKJJJ4qi4-AbcNBJ-.Gxik3u0jVKs1uI4Vq7uw'
        , 'http://127.0.0.1:3000/cart/CheckoutSuccess', 'http://127.0.0.1:3000/cart/CheckoutError'
        , true);

    var totalAmount = 0;
    var data = req.session.cart;
    var amount = 0;

    for (var i = 0; i < data.length; i++){
        amount += data[i].ChargedAmount;
    }

    console.log('Total Amount: ' + amount);

    paypal.pay('20130001', amount, 'Sale', 'USD', true, function(err, url) {
        if (err) {
            console.log('Paypal Response: ' + err);
            res.render('cart_checkout_error', { title: 'Checkout Error', isAuthenticated: req.isAuthenticated() });
        }

        // redirect to paypal webpage
        res.redirect(url);
    });
});

module.exports = router;

