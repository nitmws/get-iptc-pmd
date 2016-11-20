"use strict";

let fs = require("fs");
let appconfig = require("./appconfig");
appconfig.loadConfigData("");

/**
 * Writes a line to the standard log file
 */
function write2Log(logline, req) {
    let now = new Date();
    let ipaddr = req.ip;
    fs.appendFile(appconfig.data.app.localLogFpath, now.toISOString() + "|" + ipaddr + "|" + req.headers['user-agent'] + "|" + logline + "\r\n", function (err) {
    });
}
exports.write2Log = write2Log;

/**
 * Checks the image URL for a file name extension
 * @param imgUrl
 * @returns {*}
 */
function checkForExtension(imgUrl){
    let fnameextOk = false;
    let lastdot = imgUrl.lastIndexOf('.');
    if (lastdot > - 1 && lastdot + 1 < imgUrl.length){ // there is a dot at a reasonable position in the URL
        let fnameext = imgUrl.substring(lastdot + 1).toLowerCase();
        if (fnameext.startsWith('jpg')){
            return "jpg";
        }
        if (fnameext.startsWith('jpeg')){
            return "jpeg";
        }
        if (fnameext.startsWith('dng')){
            return "dng";
        }
        if (fnameext.startsWith('tif')){
            return "tif";
        }
        if (fnameext.startsWith('tiff')){
            return "tiff";
        }
        if (fnameext.startsWith('png')){
            return "png";
        }
        if (fnameext.startsWith('gif')){
            return "gif";
        }
        return "NA";
    }
    else {
        return "NONE"; // this URL includes explicitly no file name extension
    }
}
exports.checkForExtension = checkForExtension;

/**
 * Collects technical metadata in an object
 * @param etJson
 * @returns {{}}
 */
function getTechMd(etJson){
    let techObj = {};
    techObj['filesize'] = etJson['File:FileSize'];
    techObj['width'] = etJson['File:ImageWidth'];
    techObj['height'] = etJson['File:ImageHeight'];
    techObj['orientation'] = etJson['EXIF:Orientation'];
    techObj['exifversion'] = etJson['EXIF:ExifVersion'];
    techObj['colorspace'] = etJson['EXIF:ColorSpace'];
    techObj['compression'] = etJson['EXIF:Compression'];

    return techObj;
}
exports.getTechMd = getTechMd;

/**
 * Get a specific label out of a string with multiple parts
 * @param fullLabelStr
 * @param part (number)
 * @returns {string}
 */
function getLabelPart(fullLabelStr, part){
    if (part < 0){
        return '--'; // implicit "part number too small"
    }
    let labelparts = fullLabelStr.split('|');
    let returnLabel = '';
    if (part > labelparts.length){
        returnLabel = '---'; // implicit "part number too high"
    }
    else {
        returnLabel = labelparts[part];
    }
    return returnLabel;
}
exports.getLabelPart = getLabelPart;

