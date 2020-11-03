"use strict";

let fs = require("fs");
let appconfig = require("./appconfig");
appconfig.loadConfigData("");

/**
 * Writes a line to the standard log file
 */
function write2Log(logline, req) {
    let now = new Date();
    // next 2 lines: changed following the EU GDPR considering IP addresses as private data on 2018-05-21
    // Logging the IP address may be reactivated under the full legal responsibility of the party running the GET-PMD site
    // let ipaddr = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    let ipaddr = "NA (GDPR)"
    let uaheader = "NA";
    if (req){
        if (req.headers){
            uaheader = req.headers['user-agent'];
        }
    }
    fs.appendFile(appconfig.data.app.localLogFpath, now.toISOString() + "|" + ipaddr + "|" + uaheader + "|" + logline + "\r\n", function (err) {
    });
}
exports.write2Log = write2Log;

/**
 * Gets the preferred language from the config file or from the browser
 *  by checking the accept-language header
 * @param req
 */
function getPreferredLang(req){
    let prefLang = 'en' // set default preferred lang
    if (appconfig.data.app.defaultlang){
        prefLang = appconfig.data.app.defaultlang}
    else {
        let rawAcceptLanguageHdr = req.headers['accept-language'];
        if (rawAcceptLanguageHdr !== ''){
            let acceptedLangs = rawAcceptLanguageHdr.split(',')
            prefLang = acceptedLangs[0]
            if (prefLang.includes('-')){
                prefLang = prefLang.split('.')[0]
            }
        }
    }
    return prefLang;
}
exports.getPreferredLang = getPreferredLang;

/**
 * Checks the image URL for a file name extension
 * @param imgUrl
 * @returns {*}
 */
function checkForExtension(imgUrl){
    let fnameextOk = false;
    let lastdot = imgUrl.lastIndexOf('.');
    if (lastdot > - 1 && lastdot > (imgUrl.length - 7)){ // there is a dot at a reasonable position in the URL
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
        if (fnameext.startsWith('webp')){
            return "webp";
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

