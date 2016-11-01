var express = require('express');
var router = express.Router();
var multer  = require('multer');
var imgproc1 = require('../services/processimage');
var tools1 = require('../services/tools1');

const uploadImgPrefix = 'ulimg-';

var storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, './images');
    },
    filename: function (req, file, callback) {
        callback(null, uploadImgPrefix + file.originalname); // + '-' + Date.now());
    }
});

var upload = multer({ storage : storage}).single('userPhoto');

const designStds = 'perstandards';
const designTopics = 'pertopics';
const designCompStds = 'comparestandards';


router.post('/', multer({ storage : storage}).single('userPhoto'), function(req, res, next) {

    if (req.file === undefined){
        res.render('noimage1', {imageTitle: 'NONE selected', noImageMessage : 'No local file was selected'});
    }
    else { // uploaded file defined

        // *** Process the parameters in the request URL
        var outputformatparam = 'html';
        var outputdesignparam = designStds;
        if (req.body.design !== undefined) {
            outputdesignparam = req.body.design;
        }

        // * Parameter for Output Format
        var outputformat = '';
        if (outputformatparam === undefined)
            outputformatparam = 'html';
        switch (outputformatparam.toLowerCase()) {
            case 'html':
                outputformat = 'html';
                break;
            case 'ejson':
                outputformat = 'ejson';
                break;
            case 'ijson':
                outputformat = 'ijson';
                break;
            default:
                outputformat = 'html';
                break;
        }

        // * Parameter for Output Design and layout of the page
        var outputdesign = '';
        if (outputdesignparam === undefined)
            outputdesignparam = 'std';
        switch (outputdesignparam.toLowerCase()) {
            case 'stds':
                outputdesign = designStds;
                break;
            case 'topics':
                outputdesign = designTopics;
                break;
            case 'compared':
                outputdesign = designCompStds;
                break;
            default:
                outputdesign = designStds;
                break;
        }

        let checkFnextResult = tools1.checkForExtension(req.file.originalname);
        if (checkFnextResult !== 'NA') {

            var ulFilename = uploadImgPrefix + req.file.originalname;
            var ulFilepath = './images/' + ulFilename;
            var imgTitle = 'Uploaded file ' + req.file.originalname;

            // html output
            imgproc1.processImageFileAsHtml(res, ulFilepath, imgTitle, outputdesign);
            tools1.write2Log('GETPMD: ' + outputformat + '|' + outputdesign + '| [' + ulFilename + ']', req);
        }
        else { // file extension is not applicable
            res.render('noimage1', {
                imageTitle: req.file.originalname,
                noImageMessage: 'The extension of this file name does not align with an image format processed by this system'
            });
        }
    }
});
module.exports = router;
