"use strict";

var express = require('express');
var router = express.Router();
var url = require("url");
var fs = require("fs");
var appconfig = require("../services/appconfig");
appconfig.loadConfigData("");

var randomstring = require("randomstring");
var http = require('http');
var https = require('https');
var imgproc1 = require('../services/processimage');
var pmdmatcher = require('../services/matchpmd');
var tools1 = require('../services/tools1');

let downloadDir = appconfig.data.app.localImageDir;
let webserverDir = appconfig.data.app.webserverImageDir;

const designStds = 'perstandards';
const designTopics = 'pertopics';
const designCompStds = 'comparestandards';

// Version of the system
const systemVersion = "2016-11-06";

// format of the URL: {hostname:port}/:outputformat?/:outputdesign?/?imgurl=...
router.get('/:outputfmt?/:outputdesign?', function(req, res, next) {
    processRequest(req, res);
});

/**
 * Main function of the router
 */
function processRequest(req, res) {

    console.log('START: processRequest');
    // *** Process the parameters in the request URL
    var outputformatparam = req.params.outputfmt;
    var outputdesignparam = req.params.outputdesign;

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
    switch (outputdesignparam.toLowerCase()){
        case 'stds':
            outputdesign = designStds;
            break;
        case 'topics':
            outputdesign = designTopics;
            break;
        case 'compare':
            outputdesign = designCompStds;
            break;
        default:
            outputdesign = designStds;
            break;
    }

    // * Process query param in the request
    let queryData = url.parse(req.url, true).query;
    let imgurl = queryData.imgurl;
    let downloadFilename = 'dlimg-' + randomstring.generate(8);
    if (imgurl !== undefined) {
        if (imgurl.toLowerCase() == 'v') {
            res.render('appversion', {theappversion: systemVersion});
        }
        else {
            if (validateFormallyImageUrl(imgurl)) {
                // image URL is valid
                let checkFnextResult = tools1.checkForExtension(imgurl);
                if (checkFnextResult !== 'NA') {
                    // file name extension is usable
                    let fnext = checkFnextResult;
                    if (checkFnextResult === 'NONE') {
                        fnext = 'img';
                    }
                    downloadFilename += '.' + fnext;
                    let dlFilepath = downloadDir + downloadFilename;
                    let wsFilepath = webserverDir + downloadFilename;
                    let options = {
                        url: imgurl,
                        dest: dlFilepath
                    };
                    console.log('Download image file name: ' + downloadFilename);
                    downloadImageFile(imgurl, dlFilepath, function (data) {
                        console.log('Result of downloading a file: ' + data);
                        switch (outputdesign){
                            case designStds:
                            case designTopics:
                                imgproc1.processImageFileAsHtml(res, dlFilepath, wsFilepath, imgurl, outputdesign);
                                break;
                            case designCompStds:
                                pmdmatcher.matchPmdShowHtml(res, dlFilepath, wsFilepath, imgurl);
                                break;
                        }
                        tools1.write2Log('GETPMD: ' + outputformat + '|' + outputdesign + '| [' + imgurl + '] -> ' + downloadFilename, req)
                    });
                }
                else { // file extension is not applicable
                    res.render('noimage1', {imageTitle: imgurl, noImageMessage : 'The file name extension in this image URL does not align with an image format processed by this system'});
                }
            }
            else {
                res.render('noimage1', {imageTitle: imgurl, noImageMessage : 'This image URL cannot be processed.'});
            }
        }
    }
    else { // image URL is undefined
        let processFilepath = downloadDir + 'testphoto1.jpg';
        let wsFilepath = webserverDir + 'testphoto1.jpg';
        switch (outputdesign){
            case designStds:
            case designTopics:
                imgproc1.processImageFileAsHtml(res, processFilepath, wsFilepath, 'default IPTC reference photo', outputdesign);
                break;
            case designCompStds:
                pmdmatcher.matchPmdShowHtml(res, processFilepath, wsFilepath, 'default IPTC reference photo' );
                break;
        }
        tools1.write2Log('GETPMD: ' + outputformat + '|' + outputdesign + '| [-] -> DEFAULTPHOTO', req)
    }
}

/**
 * Validates formally the image URL
 * @param imgUrl
 * @returns {*}
 */
function validateFormallyImageUrl(imgUrl) {
    var isOk = false;
    if (imgUrl.indexOf('https://') == 0)
        isOk = true;
    if (imgUrl.indexOf('http://') == 0)
        isOk = true;
    if (isOk) {
        if (imgUrl.length > 18)
            isOk = true;
    }
    return isOk;
}

/**
 * Downloads the image file from a URL
 */
function downloadImageFile(imgUrl, destFn, callback) {
    var portNr = 80;
    var protType = 'http';
    if (imgUrl.indexOf('https') == 0)
    {
        portNr = 443;
        protType = 'https';
    }
    var options = {
            host: url.parse(imgUrl).host,
            port: portNr,
            path: url.parse(imgUrl).pathname
        },
        file_name = url.parse(imgUrl).pathname.split('/').pop(),
        //Creating the file
        file = fs.createWriteStream(destFn, {flags: 'w', encoding: 'binary'});
    console.log('Downloading file from ' + imgUrl);
    console.log('to ' + destFn);
    if (protType === 'http') {
        http.get(options, function (res) {
            res.pipe(file, {end: 'false'});
            //When the file is complete
            res.on('end', function () {
                //Closing the file
                file.end();
                console.log('Downloaded ' + file_name);
                callback(file_name);
            });
        });
    }
    if (protType === 'https') {
        https.get(options, function (res) {
            res.pipe(file, {end: 'false'});
            //When the file is complete
            res.on('end', function () {
                //Closing the file
                file.end();
                console.log('Downloaded ' + file_name);
                callback(file_name);
            });
        });
    }
    process.on('uncaughtException', function(err) {
        console.log('Can t download ' + imgUrl + '\t(' + err + ')');
        callback(null);
    });
}

module.exports = router;
