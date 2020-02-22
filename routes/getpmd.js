"use strict";

let express = require('express');
let router = express.Router();
let url = require("url");
let fs = require("fs");
let appconfig = require("../services/appconfig");
appconfig.loadConfigData("");

// Version of the system
let appversion = require("../services/appversion");
appversion.loadVersionData();
let systemVersion = appversion.data.release + ' [' + appversion.data.timestamp + ']';

let randomstring = require("randomstring");
let http = require('http');
let https = require('https');
let imgproc1 = require('../services/processimage');
let pmdmatcher = require('../services/matchpmd');
let tools1 = require('../services/tools1');

let downloadDir = appconfig.data.app.localImageDir;
let webserverDir = appconfig.data.app.webserverImageDir;
let defaultImgFn = appconfig.data.app.defaultimageFname;
let defaultImgLabel = appconfig.data.app.defaultimageLabel;

const designStds = 'perstandards';
const designTopics = 'pertopics';
const designCompStds = 'comparestandards';
const designIsearch1 = 'isearch1';

const imageFragmentSize = appconfig.data.app.minMetadataHeaderSize;

/**
 * Main function of the getpmd router
 * Parsed format of the request URL: {hostname:port}/getpmd/:outputformat?/:outputdesign?/:labeltype?/?imgurl=...
 */
router.get('/:outputfmt?/:outputdesign?/:labeltype?', function(req, res, next) {
    processRequest(req, res);
});

/**
 * Main internal function of the router
 */
function processRequest(req, res) {

    console.log('START: processRequest');
    // *** Process the parameters in the request URL
    let outputformatparam = req.params.outputfmt;
    let outputdesignparam = req.params.outputdesign;
    let outputlabeltype = req.params.labeltype;

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
        case 'isearch1':
            outputdesign = designIsearch1;
            break;
        default:
            outputdesign = designStds;
            break;
    }

    // * Parameter for label type: set it to a default value
    if (outputlabeltype === undefined)
        outputlabeltype = 'ipmd';

    // * Process query param in the request
    // let queryData = url.parse(req.url, true).query;
    // let imgurl = queryData.imgurl;
    // alternate retrieval of image url - as it may contain query strings
    let imglfn = 'NA'; // local file name of an image - preset to "Not Applicable"
    let imgurl = 'NA'; // URL of a web image - preset "Not Applicable"
    let imgurlPos = req.url.indexOf('imgurl=');
    if (imgurlPos > -1) {
        imgurl = req.url.substring(imgurlPos + 7);
    }
    else {
        let imglfnPos = req.url.indexOf('imglfn=');
        if (imglfnPos > -1) {
            imglfn = req.url.substring(imglfnPos + 7);
        }
    }
    imgurl = decodeURIComponent(imgurl);
    let downloadFilename = 'dlimg-' + randomstring.generate(8);
    if (imgurl !== 'NA') {
        if (imgurl.toLowerCase() === 'v') {
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
                    imglfn = downloadFilename;
                    let dlFilepath = downloadDir + downloadFilename;
                    let wsFilepath = webserverDir + downloadFilename;
                    console.log('Download image file name: ' + downloadFilename);
                    downloadImageFile2(imgurl, dlFilepath, function (data) {
                        if (data !== null) {
                            console.log('Result of downloading a file: ' + data);
                            switch (outputdesign) {
                                case designStds:
                                case designTopics:
                                case designIsearch1:
                                    imgproc1.processImageFileAsHtml(res, dlFilepath, wsFilepath, imgurl, imgurl, imglfn, outputdesign, outputlabeltype);
                                    break;
                                case designCompStds:
                                    pmdmatcher.matchPmdShowHtml(res, dlFilepath, wsFilepath, imgurl, imgurl, imglfn, outputlabeltype);
                                    break;
                            }
                            tools1.write2Log('GETPMD: ' + outputformat + '|' + outputdesign + '| [' + imgurl + '] -> ' + downloadFilename, req)
                        } else {
                            tools1.write2Log('GETPMD: ' + outputformat + '|' + outputdesign + '| [' + imgurl + '] -> NULL (download error)', req);
                            res.render('noimage1', {imageTitle: imgurl, noImageMessage : 'This image cannot be downloaded from the hosting server.'});
                        }
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
        if (imglfn !== 'NA'){
            // at this point imglfn may have an appended orginal image URL, separated by ||
            let imglfnArr = imglfn.split('||');// split them
            imglfn = imglfnArr[0];
            let imgurl2 = ' -- ';
            let imgurl3 = 'local';
            if (imglfnArr.length > 1){
                imgurl2 = decodeURIComponent(imglfnArr[1]);
                if (imgurl2.startsWith('http')){
                    imgurl3 = imgurl2;
                }
            }
            let processFilepath = downloadDir + imglfn;
            let wsFilepath = webserverDir + imglfn;
            switch (outputdesign) {
                case designStds:
                case designTopics:
                case designIsearch1:
                    imgproc1.processImageFileAsHtml(res, processFilepath, wsFilepath, imgurl2, imgurl3, imglfn, outputdesign, outputlabeltype);
                    break;
                case designCompStds:
                    pmdmatcher.matchPmdShowHtml(res, processFilepath, wsFilepath, imgurl2, imgurl3, imglfn, outputlabeltype);
                    break;
            }
            tools1.write2Log('GETPMD: ' + outputformat + '|' + outputdesign + '| [-] -> as local file:' + imglfnArr[1], req)
        }
        else { // image URL and image local file name undefined: use the default image
            imglfn = defaultImgFn;
            let processFilepath = downloadDir + imglfn;
            let wsFilepath = webserverDir + imglfn;
            switch (outputdesign) {
                case designStds:
                case designTopics:
                case designIsearch1:
                    imgproc1.processImageFileAsHtml(res, processFilepath, wsFilepath, defaultImgLabel, 'local', imglfn, outputdesign, outputlabeltype);
                    break;
                case designCompStds:
                    pmdmatcher.matchPmdShowHtml(res, processFilepath, wsFilepath, defaultImgLabel, 'local', imglfn );
                    break;
            }
            tools1.write2Log('GETPMD: ' + outputformat + '|' + outputdesign + '| [-] -> DEFAULTPHOTO', req)
        }
    }
}

/**
 * Validates formally the image URL
 * @param imgUrl
 * @returns {*}
 */
function validateFormallyImageUrl(imgUrl) {
    let isOk = false;
    if (imgUrl.indexOf('https://')=== 0)
        isOk = true;
    if (imgUrl.indexOf('http://') === 0)
        isOk = true;
    if (isOk) {
        if (imgUrl.length > 18)
            isOk = true;
    }
    return isOk;
}

/**
 * Downloads an image file from a URL
 * @param imgUrl
 * @param destFn
 * @param callback
 */
function downloadImageFile2(imgUrl, destFn, callback) {
    let portNr = 80;
    let protType = 'http';
    if (imgUrl.indexOf('https') === 0)
    {
        portNr = 443;
        protType = 'https';
    }
    let hostname = url.parse(imgUrl).host;
    let pos1 = imgUrl.indexOf(hostname);
    // var path1 = url.parse(imgUrl).path; // core path only
    let path1 = imgUrl.substring(pos1 + hostname.length); // including queries as this might be required by APIs
    let options = {
        host: hostname,
        port: portNr,
        path: path1
    };
    // file_name = url.parse(imgUrl).pathname.split('/').pop(),
    //Creating the file
    let file = fs.createWriteStream(destFn, {flags: 'w', encoding: 'binary'});
    let fileLength = 0;
    let fileOpen = true;

    console.log('Downloading file from ' + imgUrl);
    console.log('to ' + destFn);
    if (protType === 'http') {
        http.get(options, function (res) {
            res.on('data', function (chunk) {
                if (fileOpen) {
                    file.write(chunk);
                    fileLength += chunk.length;
                    if (fileLength > imageFragmentSize) { // file size over limit
                        file.end();
                        fileOpen = false;
                        console.log('Downloaded ' + destFn);
                        callback(destFn);
                    }
                }
            }).on('end', function () {
                //Closing the file
                if (fileOpen) {
                    file.end();
                    console.log('Downloaded ' + destFn);
                    callback(destFn);
                }
            });
        });
    }
    if (protType === 'https') {
        https.get(options, function (res) {
            res.on('data', function (chunk) {
                if (fileOpen) {
                    file.write(chunk);
                    fileLength += chunk.length;
                    if (fileLength > imageFragmentSize) { // file size over limit
                        file.end();
                        fileOpen = false;
                        console.log('Downloaded ' + destFn);
                        callback(destFn);
                    }
                }
            }).on('end', function () {
                //Closing the file
                if (fileOpen) {
                    file.end();
                    console.log('Downloaded ' + destFn);
                    callback(destFn);
                }
            });
        });
    }
    process.on('uncaughtException', function(err) {
        console.log('Cannot download ' + imgUrl + ' (' + err + ')');
        callback(null);
    });
}

module.exports = router;
