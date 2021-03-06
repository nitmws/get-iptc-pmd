"use strict";

let express = require('express');
let router = express.Router();
let multer = require('multer');
let imgproc1 = require('../services/processimage');
let pmdmatcher = require('../services/matchpmd');
let tools1 = require('../services/tools1');

let appconfig = require("../services/appconfig");
appconfig.loadConfigData("");
let ulDir =  appconfig.data.app.uploadDir;
let webserverDir = appconfig.data.app.webserverImageDir;

const uploadImgPrefix = 'ulimg-';

/* the diskStorage worker provided by multer
let storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, ulDir);
    },
    filename: function (req, file, callback) {
        callback(null, uploadImgPrefix + file.originalname);
    }
});
*/

// the uploadStorage worker provided by this application
let uploadStorage = require('../services/uploadStorage');
let storage = uploadStorage({
    destination: function (req, file, callback) {
        callback(null, ulDir + uploadImgPrefix + file.originalname);
    }
});

const designStds = 'perstandards'; // metadata fields grouped per standard
const designTopics = 'pertopics'; // metadata fields grouped per topic
const designCompStds = 'comparestandards'; // comparing IPTC properties used across formats
const designIsearch1 = 'isearch1'; // IPTC metadata relevant for image search results (variant 1)


router.post('/', multer({ storage : storage}).single('userPhoto'), function(req, res, next) {

    if (req.file === undefined){
        res.render('noimage1', {imageTitle: 'NONE selected', noImageMessage : 'No local file was selected'});
    }
    else { // uploaded file defined

        // *** Process the parameters in the request URL
        let outputformatparam = 'html';
        let outputdesignparam = designStds;
        if (req.body.design !== undefined) {
            outputdesignparam = req.body.design;
        }
        let outputlabeltype = 'ipmd';
        if (req.body.labeltype !== undefined) {
            outputlabeltype = req.body.labeltype;
        }

        // * Parameter for Output Format
        let outputformat = '';
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
        let outputdesign = '';
        if (outputdesignparam === undefined)
            outputdesignparam = 'std';
        switch (outputdesignparam.toLowerCase()) {
            case 'stds':
                outputdesign = designStds;
                break;
            case 'topics':
                outputdesign = designTopics;
                break;
            case 'compare':
                outputdesign = designCompStds;
                break;
            case 'isearch1':
                outputdesign = designIsearch1;
                break;
            default:
                outputdesign = designStds;
                break;
        }

        let checkFnextResult = tools1.checkForExtension(req.file.originalname);
        if (checkFnextResult !== 'NA') {

            let ulFilename = uploadImgPrefix + req.file.originalname;
            let ulFilepath = ulDir + ulFilename;
            let wsFilepath = webserverDir + ulFilename;
            let imgTitle = 'Uploaded file ' + req.file.originalname;

            // html output
            switch (outputdesign){
                case designStds:
                case designTopics:
                case designIsearch1:
                    imgproc1.processImageFileAsHtml(res, ulFilepath, wsFilepath, imgTitle, 'local', ulFilename, outputdesign, outputlabeltype);
                    break;
                case designCompStds:
                    pmdmatcher.matchPmdShowHtml(res, ulFilepath, wsFilepath, 'default IPTC reference photo', 'local', ulFilename, outputlabeltype );
                    break;
            }
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
