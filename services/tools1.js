"use strict";

var fs = require("fs");
var appconfig = require("./appconfig");
appconfig.loadConfigData("");

/**
 * Writes a line to the standard log file
 */
function write2Log(logline, req) {
    var now = new Date();
    var ipaddr = req.ip; // || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
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
    if (lastdot > - 1 && lastdot + 1 < imgUrl.length){
        let fnameext = imgUrl.substring(lastdot + 1).toLowerCase();
        fnameextOk = false; // default result
        switch (fnameext){ // see http://www.file-extensions.org/filetype/extension/name/bitmap-image-files
            case 'dng':
            case 'tiff' :
            case 'gif':
            case 'png':
            case 'tif':
            case 'jpg':
            case 'jpeg':
                fnameextOk = true; // only known file extensions are accepted
        }
        if (fnameextOk){
            return fnameext;
        }
        else {
            return "NA";
        }
    }
    else {
        return "NONE";
    }
}
exports.checkForExtension = checkForExtension;