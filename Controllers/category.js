var express = require('express')
    , router = express.Router()
    , urlencodedParser = require('body-parser').urlencoded({ extended: false })
    , formidable = require("formidable")
    , routesAuthorize = require('./authorize.js')
    , cradle = require('cradle')
    , db = new(cradle.Connection)('192.168.1.13').database('datum_shopping')

router.get('/', routesAuthorize.isAuthorized(), function (req, res) {
    db.view('category/by_name', function (err, rows) {
        if (!err) {
            console.log(JSON.stringify(rows));

            res.render('category_list', { title: 'Categories', isAuthenticated: req.isAuthenticated(), data: rows });
        }
        else {
            console.log('Category/' + err);
            console.log('Category/' + rows);
        }
    });
});

router.get('/Create', routesAuthorize.isAuthorized(), function (req, res) {
    var data = {
        _id: '',
        _ver: '',
        CategoryName: ''
    };

    console.log(!req.query.id);

    if (!req.query.id) {

        res.render('category_new', { title: 'Create Category', isAuthenticated: req.isAuthenticated(), data: data })

    } else {
        db.get(req.query.id, { revs_info: true }, function (err, body) {
            if (!err) {
                console.log(body);

                res.render('category_new', { title: 'Edit Category', isAuthenticated: req.isAuthenticated(), data: body })
            }
        })
    }
});

router.post('/Create', routesAuthorize.isAuthorized(), function (req, res) {

    console.log('file: ' + JSON.stringify(req.file));
    console.log('body: ' + JSON.stringify(req.body));

    var data = {
        Type: 'Category',
        CategoryName: req.body.CategoryName,
    };

    db.get(req.body._id, function (err, body) {
        if (!err) {
            data._rev = body._rev;
        }

        db.save(req.body._id, data, function (err, body) {
            if (!err) {
                console.log('Category created successfully.');
                res.redirect('/Category');
            }
        })
    })

});

router.post('/Delete', routesAuthorize.isAuthorized(), function (req, res) {
    console.log('id:' + req.query.id + ', rev:' + req.query.rev);
    
    db.remove(req.query.id, req.query.rev, function (err, body) {
        if (!err) {
            console.log('Document deleted with id:' + req.query.id);
            res.redirect('/Category');
        }
    });
});

module.exports = router;

