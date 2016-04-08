/**
 * Created by faisal on 3/22/2016.
 */
var express = require('express')
    , router = express.Router()
    , path = require('path')
    , exec = require('child_process').exec
    , sys = require('sys')
    , multer = require('multer')
    //, upload = multer({dest: 'public/uploads/'})
    , fs = require('fs')
    , Regex = require('regex')
    , regex = new Regex(/(a|b)*abb/);

var child;

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/'); // Absolute path. Folder must exist, will not be created for you.
    },
    filename: function (req, file, cb) {

        console.log('req: ' + JSON.stringify(req.body));
        console.log('file: ' + JSON.stringify(file));

        newfile = path.basename(file.originalname, path.extname(file.originalname)) + '-' + Date.now() + path.extname(file.originalname);

        console.log("rename: " + newfile);

        cb(null, newfile);
    }
});

var upload = multer({ storage: storage });

router.use('/', function(req, res, next) {
   console.log('/Temp Request Type:' + req.method);
    next();
});

router.get('/', function (req, res, next) {

    console.log(regex.test("abb"));
    console.log(regex.test("aabb"));

    res.render('temp_index', { title: 'Temp', isAuthenticated: req.isAuthenticated(), data: null });
});

router.post('/', upload.single('Picture'), function (req, res, next) {
    console.log(req.file);

    if (req.file){
        var newfile = req.file.destination + req.file.filename;
    }
    console.log('newfile: ' + newfile);

    child = exec("pdftotext " + newfile + " " + newfile + ".txt", function (error, stdout, stderr) {
        //sys.print('stdout: ' + stdout);
        //sys.print('stderr: ' + stderr);
        if (error !== null) {
            console.log('exec error: ' + error);
        }
        else{
            fs.readFile(newfile + '.txt', 'utf8', function(err, data){
                //console.log(data);
                var baseIndex, index, field, value;
                var model = {};

                baseIndex = data.search('Your Policy Profile');

                if (baseIndex > 0){
                    field = 'Insured:';
                    index = data.indexOf(field, baseIndex);
                    value = data.substring(index + field.length + 1, data.indexOf('\n', index));
                    console.log('start: ' + index + ', end: ' + data.indexOf('\n', index)
                        + ', len: ' + (data.indexOf('\n', index) - index)
                        + ', value: ' + value
                    );
                    model.Insured = value;
                    value = value.split(",");
                    model.Name = value[0];
                    model.Gender = value[1];
                    model.Age = value[2];

                    field = 'Initial Death Benefit:';
                    index = data.indexOf(field, baseIndex);
                    value = data.substring(index + field.length + 1, data.indexOf('\n', index));
                    console.log('start: ' + index + ', end: ' + data.indexOf('\n', index)
                        + ', len: ' + (data.indexOf('\n', index) - index)
                        + ', value: ' + value
                    );
                    model.InitialDeathBenefit = value;


                    field = 'Initial Premium:';
                    index = data.indexOf(field, baseIndex);
                    value = data.substring(index + field.length + 1, data.indexOf('\n', index));
                    console.log('start: ' + index + ', end: ' + data.indexOf('\n', index)
                        + ', len: ' + (data.indexOf('\n', index) - index)
                        + ', value: ' + value
                    );
                    model.InitialPremium = value;

                    field = 'Planned Annual Premium:';
                    index = data.indexOf(field, baseIndex);
                    value = data.substring(index + field.length + 1, data.indexOf('\n', index));
                    console.log('start: ' + index + ', end: ' + data.indexOf('\n', index)
                        + ', len: ' + (data.indexOf('\n', index) - index)
                        + ', value: ' + value
                    );
                    model.PlannedAnnualPremium = value;

                    field = 'Total Lump Sum:';
                    index = data.indexOf(field, baseIndex);
                    value = data.substring(index + field.length + 1, data.indexOf('\n', index));
                    console.log('start: ' + index + ', end: ' + data.indexOf('\n', index)
                        + ', len: ' + (data.indexOf('\n', index) - index)
                        + ', value: ' + value
                    );
                    model.TotalLumpSum = value;

                    field = 'Total 1035 Exchange:';
                    index = data.indexOf(field, baseIndex);
                    value = data.substring(index + field.length + 1, data.indexOf('\n', index));
                    console.log('start: ' + index + ', end: ' + data.indexOf('\n', index)
                        + ', len: ' + (data.indexOf('\n', index) - index)
                        + ', value: ' + value
                    );
                    model.Total1035Exchange = value;

                    field = 'Minimum Monthly Premium:';
                    index = data.indexOf(field, baseIndex);
                    value = data.substring(index + field.length + 1, data.indexOf('\n', index));
                    console.log('start: ' + index + ', end: ' + data.indexOf('\n', index)
                        + ', len: ' + (data.indexOf('\n', index) - index)
                        + ', value: ' + value
                    );
                    model.MinimumMonthlyPremium = value;
                }

                console.log(index + ':' + JSON.stringify(model));

                baseIndex = data.search('Page 6 of 29');
                console.log('Page 6 of 29:' + baseIndex);
                field = 'Your Chosen Allocations';
                index = data.indexOf(field, baseIndex);
                value = data.substring(index + field.length + 1, index + 500); //data.indexOf('\n', index));
                console.log('start: ' + index + ', end: ' + data.indexOf('\n', index)
                    + ', len: ' + (data.indexOf('\n', index) - index)
                    + ', value: ' + value
                );
            });
        }
    });

    res.send('File converted');
});

router.get('/user/:id', function (req, res, next) {
    // if the user ID is 0, skip to the next route
    if (req.params.id == 0) next('route');
    // otherwise pass the control to the next middleware function in this stack
    else next(); //
}, function (req, res, next) {
    // render a regular page
    res.send('regular');
});

// handler for the /user/:id path, which renders a special page
router.get('/user/:id', function (req, res, next) {
    res.send('special');
});

module.exports = router;
