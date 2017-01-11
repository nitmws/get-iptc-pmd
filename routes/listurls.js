"use strict";
let express = require('express');
let router = express.Router();
let url = require("url");

/**
 * Main function of the listurls router
 * Parsed format of the request URL: {hostname:port}/:outputformat?/?imgurls=...
 */
router.get('/:outputfmt?', function(req, res, next) {
    processRequest(req, res);
});

/**
 * Main internal function of the router
 */
function processRequest(req, res) {
    console.log('START: listurls processRequest');
    // *** Process the parameters in the request URL
    let outputformatparam = req.params.outputfmt;

    // * Process query param in the request
    // alternate retrieval of image url - as it may contain query strings
    let imgurlstr = 'NA'; // URL of a web image - preset "Not Applicable"
    let imgurlPos = req.url.indexOf('imgurls=');
    if (imgurlPos > -1) {
        imgurlstr = req.url.substring(imgurlPos + 8);
    }
    imgurlstr = decodeURIComponent(imgurlstr);
    let imageurls = imgurlstr.split('|');
    // call rendition template
    res.render('checkedpage', { webpageurl : "used with IptcPMD",  imageurls });

}
module.exports = router;
