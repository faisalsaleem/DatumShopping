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

//router.use(multer({
//    dest: './uploads/',
//    rename: function (fieldname, filename) {
//        return filename.replace(/\W+/g, '-').toLowerCase() + Date.now()
//    }
//}));

router.get('/', routesAuthorize.isAuthorized(), function (req, res) {
    db.view('product/by_type', function (err, rows) {
        if (!err) {
            console.log(JSON.stringify(rows));

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

router.get('/Create', routesAuthorize.isAuthorized(), function (req, res) {
    var data = {
        _id: '',
        _ver: '',
        ProductName: '',
        SalePrice: 0
    };
    
    console.log(!req.query.id);
    
    if (!req.query.id) {
        
        res.render('product_new', { title: 'Create Product', isAuthenticated: req.isAuthenticated(), data: data })

    } else {
        db.get(req.query.id, { revs_info: true }, function (err, body) {
            if (!err) {
                console.log(body);

                res.render('product_new', { title: 'Create Product', isAuthenticated: req.isAuthenticated(), data: body })
            }
        })
    }
});

router.post('/Create_old', urlencodedParser, routesAuthorize.isAuthorized(), function (req, res) {
    var form = new formidable.IncomingForm();
    
    console.log(req.body);
    
    form.parse(req, function (err, fields, files) {
        if (!err) {
            console.log('fields:' + JSON.stringify(fields));
            console.log('files:' + JSON.stringify(files));
            
            var newfile = uploadFolder + uuid.v1() + path.extname(files.Picture.name);
            
            console.log('Picture Uploaded:' + files.Picture.name);
            
            if (files.Picture.name) {
                fs.readFile(files.Picture.path, function (err, data) {
                    fs.writeFile(newfile, data, function (err) {
                        if (err) {
                            console.log(err);
                        } else {
                            response = {
                                message: "File uploaded successfully",
                                filename: files.Picture.name
                            };
                            console.log(response);
                        }
                    });
                });
            }
            
            var data = {
                Type: 'Product',
                ProductName: fields.ProductName,
                SalePrice: fields.SalePrice,
                PicturePath: newfile,
                IsNewArrival: fields.IsNewArrival,
                Description: fields.Description,
                DiscountAmount: fields.DiscountAmount
            };
            
            db.get(fields._id, function (err, body) {
                if (!err) {
                    data._rev = body._rev;
                    if (!files.Picture.name) data.PicturePath = body.PicturePath
                }
                
                if (data.PicturePath) {
                    console.log('picture path1:' + data.PicturePath);
                    data.PicturePath = data.PicturePath.replace(appBaseFolder + '\\public', '');
                    console.log('picture path2:' + data.PicturePath);
                    data.PicturePath = data.PicturePath.replaceAll('\\', '/');
                    console.log('picture path3:' + data.PicturePath);
                }
                
                db.save(fields._id, data, function (err, body) {
                    if (!err) {
                        console.log('Product created successfully.');
                        res.writeHead(301, {
                            Location: (req.socket.encrypted ? 'https://' : 'http://') + req.headers.host + '/Product'
                        });
                        res.end();
                    }
                })
            })
        }
    })
});

router.post('/Create', upload.single('Picture'), routesAuthorize.isAuthorized(), function (req, res) {

    console.log('file: ' + JSON.stringify(req.file));
    console.log('body: ' + JSON.stringify(req.body));

    var newfile = req.file.destination.replace('public', '') + req.file.filename;

    console.log('Picture Uploaded: ' + newfile);

    var data = {
        Type: 'Product',
        ProductName: req.body.ProductName,
        SalePrice: req.body.SalePrice,
        PicturePath: newfile,
        IsNewArrival: req.body.IsNewArrival,
        Description: req.body.Description,
        DiscountAmount: req.body.DiscountAmount
    };

    db.get(req.body._id, function (err, body) {
        if (!err) {
            data._rev = body._rev;
            if (!newfile) data.PicturePath = body.PicturePath
        }

        if (data.PicturePath) {
            console.log('picture path1:' + data.PicturePath);
            data.PicturePath = data.PicturePath.replace(appBaseFolder + '\\public', '');
            console.log('picture path2:' + data.PicturePath);
            data.PicturePath = data.PicturePath.replaceAll('\\', '/');
            console.log('picture path3:' + data.PicturePath);
        }

        db.save(req.body._id, data, function (err, body) {
            if (!err) {
                console.log('Product created successfully.');
                res.redirect('/Product');
            }
        })
    })

});

router.get('/Purchase', function (req, res) {
    var data = {
        _id: '',
        _ver: '',
        ProductName: '',
        SalePrice: 0
    };

    if (!req.query.id) {
        
        res.render('product_purchase', {
            title: 'Product not found'
            , isAuthenticated: req.isAuthenticated()
            , message: 'Product not found'
        });

    } else {
        db.get(req.query.id, { revs_info: true }, function (err, body) {
            if (!err) {
                res.render('product_purchase', {
                    title: 'Create Product'
                    , isAuthenticated: req.isAuthenticated()
                    , data: body
                    , message: ''
                });
            };
        });
    }
})

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
                Type: 'Checkout',
                ProductID: fields._id,
                ProductName: fields.ProductName,
                SalePrice: fields.SalePrice,
                Description: fields.Description,
                DiscountAmount: fields.DiscountAmount,
                ChargedAmount: fields.DiscountAmount > 0 ? fields.SalePrice - fields.DiscountAmount : fields.SalePrice,
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

