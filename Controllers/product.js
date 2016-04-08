var express = require('express')
    , router = express.Router()
    , urlencodedParser = require('body-parser').urlencoded({ extended: false })
    , formidable = require("formidable")
    , fs = require('fs')
    , uuid = require('node-uuid')
    , path = require('path')
    , routesAuthorize = require('./authorize.js')
    , cradle = require('cradle')
    , db = new(cradle.Connection)('192.168.1.13').database('datum_shopping')
    , multer = require('multer')
    , upload = multer({dest: 'public/uploads/'})

var appBaseFolder = path.join(__dirname, '\\..');
var uploadFolder = appBaseFolder + "\\public\\uploads\\";

router.get('/', routesAuthorize.isAuthorized(), function (req, res) {
    db.view('product/by_type', function (err, rows) {
        if (!err) {
            res.render('product_list', { title: 'Products', isAuthenticated: req.isAuthenticated(), data: rows });
        }
        else {
            console.log(err);
            console.log(rows);
            
            console.log('There was an error fetching products.' + err);
        }
    })
});

router.post('/Delete', routesAuthorize.isAuthorized(), function (req, res) {
    console.log('id:' + req.query.id + ', rev:' + req.query.rev);
    
    db.remove(req.query.id, req.query.rev, function (err, body) {
        if (!err) {
            console.log('Document deleted with id:' + req.query.id);
            
            res.writeHead(301, {
                Location: (req.socket.encrypted ? 'https://' : 'http://') +
                    req.headers.host + '/Product'
            });
            res.end();
        }
    });
});

router.get('/Create', routesAuthorize.isAuthorized(), function (req, res, next) {
    db.view('size/by_name', function (err, rows) {
        if (!err) {
            res.sizes = rows;
        }
        else {
            console.log('There was an error fetching sizes.' + err);
            res.sizes = [];
        }
        next();
    });
});

router.get('/Create', function (req, res, next) {
    db.view('color/by_name', function (err, rows) {
        if (!err) {
            res.colors = rows;
        }
        else {
            console.log('There was an error fetching colors.' + err);
            res.colors = [];
        }
        next();
    });
});

router.get('/Create', function (req, res, next) {
    db.view('brand/by_name', function (err, rows) {
        if (!err) {
            res.brands = rows;
        }
        else {
            console.log('There was an error fetching brands.' + err);
            res.brands = [];
        }
        next();
    });
});

router.get('/Create', routesAuthorize.isAuthorized(), function (req, res) {
    var data = {
        _id: ''
        ,_ver: ''
        ,ProductName: ''
        ,SalePrice: 0
        ,Sizes:[]
        ,Colors:[]
        ,BrandID:0
    };
    
    console.log(!req.query.id);
    
    if (!req.query.id) {
        
        res.render('product_new', { title: 'Edit Product', isAuthenticated: req.isAuthenticated()
            , data: data
            , categories: res.categories
            , sizes: res.sizes
            , colors: res.colors
            , brands: res.brands
        });

    } else {
        db.get(req.query.id, { revs_info: true }, function (err, body) {
            if (!err) {
                console.log("Product:" + body);
                console.log(JSON.stringify(res.categories));

                res.render('product_new', { title: 'Create Product'
                    , isAuthenticated: req.isAuthenticated()
                    , data: body
                    , categories: res.categories
                    , sizes: res.sizes
                    , colors: res.colors
                    , brands: res.brands
                })
            }
        })
    }
});

router.post('/Create', upload.single('Picture'), routesAuthorize.isAuthorized(), function (req, res) {

    console.log('file: ' + JSON.stringify(req.file));
    console.log('body: ' + JSON.stringify(req.body));

    if (req.file){
        var newfile = req.file.destination.replace('public', '') + req.file.filename;
    }

    console.log('Picture Uploaded: ' + newfile);

    var data = {
        Type: 'Product'
        ,ProductName: req.body.ProductName
        ,SalePrice: req.body.SalePrice
        ,PicturePath: newfile
        ,IsNewArrival: req.body.IsNewArrival
        ,Description: req.body.Description
        ,DiscountAmount: req.body.DiscountAmount
        ,CategoryID: req.body.CategoryID
        ,Sizes: req.body.Sizes
        ,Colors: req.body.Colors
        ,BrandID: req.body.BrandID
    };

    db.get(req.body._id, function (err, body) {
        if (!err) {
            data._rev = body._rev;
            if (!newfile) data.PicturePath = body.PicturePath
        }

        db.save(req.body._id, data, function (err, body) {
            if (!err) {
                console.log('Product created successfully.');
                res.redirect('/Product');
            }
        })
    })

});

//Fetch product (/Product/Purchase)
router.get('/Purchase', function (req, res, next){
    var model = {
        title: 'Purchase Product'
        , message: ''
        , data:{}
        , isAuthenticated: req.isAuthenticated()
    };

    if (req.query.id) {
        db.get(req.query.id, { revs_info: true }, function (err, product) {
            if (!err) {
                model.data = product;
                console.log("product found");

                res.model = model;
                next();
            }
            else{
                res.model = model;
                next();
            }
        });
    }
    else{
        res.model = model;
        next();
    }
});

//Fetch sizes for product (/Product/Purchase)
router.get('/Purchase', function (req, res, next){
    var model = res.model;

    if (model.data.Sizes){
        db.get(model.data.Sizes, function(err, Sizes){
            if (!err){
                model.data.Sizes = Sizes;
                console.log("sizes found");
                res.model = model;
                next();
            }
            else{
                res.model = model;
                next();
            }
        });
    }
    else{
        res.model = model;
        next();
    }
});

//Fetch colors for product (/Product/Purchase)
router.get('/Purchase', function (req, res, next){
    var model = res.model;

    console.log(model.data.Colors);

    if (model.data.Colors){
        db.get(model.data.Colors, function(err, Colors){
            if (!err){
                if (Colors instanceof Array) {
                    console.log('Colors is array');
                } else{
                    console.log('Colors is not array');
                    Colors = [Colors];
                }

                model.data.Colors = Colors;
                res.model = model;
                next();
            }
            else{
                res.model = model;
                next();
            }
        });
    }
    else{
        res.model = model;
        next();
    }
});

//Render /Product/Purchase view
router.get('/Purchase', function (req, res) {
    res.render('product_purchase', res.model);
});

router.post('/Purchase', urlencodedParser, function (req, res) {
    var form = new formidable.IncomingForm();
    
    console.log(req.body);
    
    form.parse(req, function (err, fields, files) {
        if (!err) {
            console.log('fields:' + JSON.stringify(fields));
            console.log('files:' + JSON.stringify(files));
            
            var cart = req.session.cart;
            if (!cart) {
                cart = [];
            }
            
            var data = {
                Type: 'Checkout'
                , ProductID: fields._id
                , ProductName: fields.ProductName
                , SalePrice: fields.SalePrice
                , Description: fields.Description
                , DiscountAmount: fields.DiscountAmount
                , ChargedAmount: fields.DiscountAmount > 0 ? fields.SalePrice - fields.DiscountAmount : fields.SalePrice
                , ColorID: fields.ColorID
                , SizeID: fields.SizeID
                , ColorName: fields.SelectedColorName
                , SizeName: fields.SelectedSizeName
            };

            cart.push(data);
            req.session.cart = cart;
            
            console.log('Cart:' + cart);

            console.log('Added to cart successfully.');
            res.redirect('/Cart');
        }
    })        
})


module.exports = router;

