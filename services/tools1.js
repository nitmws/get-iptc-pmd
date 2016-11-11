"use strict";

var fs = require("fs");
var appconfig = require("./appconfig");
appconfig.loadConfigData("");

/**
 * Writes a line to the standard log file
 */
function write2Log(logline, req) {
    var now = new Date();
    var ipaddr = req.ip;
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