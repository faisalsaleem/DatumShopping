var express = require('express')
    , router = express.Router()
    , cradle = require('cradle')
    , db = new(cradle.Connection)('192.168.1.13').database('datum_shopping')

router.get('/',  function (req, res) {

    res.render('dashboard_index', { title: 'Dashboard', isAuthenticated: req.isAuthenticated() });

    //db.view('product/by_type', function (err, rows) {
    //    if (!err) {
    //        res.render('product_list', { title: 'Products', isAuthenticated: req.isAuthenticated(), data: rows });
    //    }
    //    else {
    //        console.log(err);
    //        console.log(rows);
    //
    //        console.log('There was an error fetching products.' + err);
    //    }
    //})
});

module.exports = router;

