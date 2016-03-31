var express = require('express')
    , router = express.Router()
    , routesAuthorize = require('./authorize.js')
    , cradle = require('cradle')
    , db = new(cradle.Connection)('192.168.1.13').database('datum_shopping')

router.get('/', routesAuthorize.isAuthorized(), function (req, res) {
    db.view('brand/by_name', function (err, rows) {
        if (!err) {
            console.log(JSON.stringify(rows));

            res.render('brand_list', { title: 'Brand', isAuthenticated: req.isAuthenticated(), data: rows });
        }
        else {
            console.log('Brand/' + err);
            console.log('Brand/' + rows);
        }
    });
});

router.get('/Create', routesAuthorize.isAuthorized(), function (req, res) {
    var data = {
        _id: '',
        _ver: '',
        BrandName: ''
    };

    console.log(!req.query.id);

    if (!req.query.id) {

        res.render('brand_new', { title: 'Create Brand', isAuthenticated: req.isAuthenticated(), data: data })

    } else {
        db.get(req.query.id, { revs_info: true }, function (err, body) {
            if (!err) {
                console.log(body);

                res.render('brand_new', { title: 'Edit Brand', isAuthenticated: req.isAuthenticated(), data: body })
            }
        })
    }
});

router.post('/Create', routesAuthorize.isAuthorized(), function (req, res) {

    console.log('file: ' + JSON.stringify(req.file));
    console.log('body: ' + JSON.stringify(req.body));

    var data = {
        Type: 'Brand',
        BrandName: req.body.BrandName,
    };

    db.get(req.body._id, function (err, body) {
        if (!err) {
            data._rev = body._rev;
        }

        db.save(req.body._id, data, function (err, body) {
            if (!err) {
                console.log('Brand created successfully.');
                res.redirect('/Brand');
            }
        })
    })

});

router.post('/Delete', routesAuthorize.isAuthorized(), function (req, res) {
    console.log('id:' + req.query.id + ', rev:' + req.query.rev);
    
    db.remove(req.query.id, req.query.rev, function (err, body) {
        if (!err) {
            console.log('Document deleted with id:' + req.query.id);
            res.redirect('/Brand');
        }
    });
});

module.exports = router;

