var express = require('express')
    , stylus = require('stylus')
    , nib = require('nib')
    //, dbold = require('nano')('http://127.0.0.1:5984').db.use('datum_shopping')
    , passport = require('passport')
    , LocalStrategy = require('passport-local').Strategy
    , routesAccount = require('./Controllers/account.js')
    , routesProduct = require('./Controllers/product.js')
    , routesSales = require('./Controllers/sales.js')
    , routesCart = require('./Controllers/cart.js')
    , routesCategory = require('./Controllers/category.js')
    , routesTemp = require('./Controllers/temp.js')
    , routesError = require('./Controllers/error.js')
    , morgan = require('morgan')
    , cradle = require('cradle')
    , db = new(cradle.Connection)('192.168.1.13').database('datum_shopping')

var app = express();

// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  The
// typical implementation of this is as simple as supplying the user ID when
// serializing, and querying the user record by ID from the database when
// deserializing.


//var db = nano.db.use('datum_shopping');

app.use(morgan('dev')); //combined, common, dev, short, tiny

function compile(str, path) {
    return stylus(str)
        .set('filename', path)
        .use(nib())
}

String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// Use application-level middleware for common functionality, including
// logging, parsing, and session handling.
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));
// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());

app.use(stylus.middleware(
    {
        src: __dirname + '/public'
        , compile: compile
    }));

app.use(express.static(__dirname + '/public'));

app.use(function (req, res, next) {
     res.isAuthenticated = req.isAuthenticated();
     console.log('res.isAuthenticated: ' + res.isAuthenticated);

    db.view('category/by_name', function(err, rows) {
        if (!err) {
            res.categories = rows;
        }
        else {
            res.categories = [];
        }
        next();
    });

 });

passport.use(new LocalStrategy( function (username, password, cb) {
        db.view('user/by_user', { key: username }, function (err, rows) {
            console.log("Passport Err: " + err);
            console.log('passport rows: ' + JSON.stringify(rows));
            if (rows && rows.length > 0) {
                var user = { id: rows[0].id , username: rows[0].key, password: rows[0].value };
                return cb(null, user);
            }
            else{
                console.log('Incorrect username or password.');
                console.log(cb.toString());

                return cb(null, false, {'message': 'Incorrect username or password.'});
            }
        });
    }));

passport.serializeUser(function (user, cb) {
    console.log('serialize:' + user);

    cb(null, user.id);
});

passport.deserializeUser(function (id, cb) {
    var user = { id: "123", username: "faisal", password: "123" }
    return cb(null, user);
    //db.users.findById(id, function (err, user) {
    //    if (err) { return cb(err); }
    //    cb(null, user);
    //});
});

app.get('/login', function (req, res) {
        console.log(req.message);

        res.render('login', { title: 'Login', message: req.message });
});

app.post('/login', function(req, res, next) {
    console.log('login post');

    passport.authenticate('local', function(err, user, info) {
        if (err) {
            return next(err); // will generate a 500 error
        }
        // Generate a JSON response reflecting authentication status
        if (! user) {
            res.render('login', { title: 'Login', success : false, message: 'Invalid user or password' });
            //return res.send({ success : false, message : 'authentication failed' });
        }
        // ***********************************************************************
        // "Note that when using a custom callback, it becomes the application's
        // responsibility to establish a session (by calling req.login()) and send
        // a response."
        // Source: http://passportjs.org/docs
        // ***********************************************************************
        req.login(user, function(loginErr) {
            if (loginErr) {
                return next(loginErr);
            }
            //return res.send({ success : true, message : 'authentication succeeded' });
            //res.render('index', { title: 'Login', success : true, message: 'authentication succeeded' });
            res.redirect('/');
        });
})(req, res, next)
});

app.get('/logout',
  function (req, res) {
    req.logout();
    res.redirect('/');
});

app.get('/', function (req, res) {
    var view = req.query.cat ? req.query.cat : null;
    var options = {};

    if (!view){
        if (req.query.c){
            view = 'by_category';
            options.key = req.query.c;
        } else {
            view = 'by_type';
        }
    };

    console.log('view:' + view + ', options:' + JSON.stringify(options));
    console.log('categories:' + JSON.stringify(res.categories));

    db.view('product/' + view, options , function(err, rows) {
        if (!err) {
            rows =  rows ? rows : [];

            res.render('index', { title: 'Products'
                , isAuthenticated: req.isAuthenticated()
                , data: rows
                , categories: res.categories
            });
        }
        else {
            console.log(err);
            console.log('There was an error fetching products.' + err);
        }
    });
});

app.use('/Product', routesProduct);
app.use('/Account', routesAccount);
app.use('/Sales', routesSales);
app.use('/Cart', routesCart);
app.use('/Category', routesCategory);
app.use('/Temp', routesTemp);
app.use('/Error', routesError);

app.get('/*', function(req, res) {
    //res.redirect('/')
    res.render('404', {title: 'Not Found'});
});

app.use(function(err, req, res, next) {
    console.error(err.stack);
    //res.status(500).send('Something broke!');
    //res.render('500', { title: 'Internal Server Error', success : false });
    res.redirect('/Error/500');
});

app.listen(3000);
