"use strict";

let express = require('express');
let router = express.Router();
let url = require("url");
let fs = require("fs");
let request = require("request");
let cheerio = require("cheerio");

/**
 * Main function of the checkpage router
 * Parsed format of the request URL: {hostname:port}/:outputformat?/?pageurl=...
 */
router.get('/:outputfmt?', function(req, res, next) {
    processRequest(req, res);
});

/**
 * Main internal function of the router
 */
function processRequest(req, res) {
    console.log('START: checkPage processRequest');
    // *** Process the parameters in the request URL
    let outputformatparam = req.params.outputfmt;

    // * Process query param in the request
    let queryData = url.parse(req.url, true).query;
    let pageurl = queryData.pageurl;

    // Array of urls referring to image resources
    let imageurls = [];

    // get HTML of target page
    request(pageurl, function(error, response, html){
        if(!error){
            let $ = cheerio.load(html);

            let Rex=/.(jpe?g|dng|png|tiff?)$/i; // filtering image file extensions
            let imgsrc = $('img');
            for (let i= 0; i < imgsrc.length; i++){
                let srcattr = imgsrc[i].attribs.src;
                if (srcattr === undefined) {
                    srcattr = imgsrc[i].attribs['data-original'];
                    if(!Rex.test(srcattr)) {
                        srcattr = undefined;
                    }
                }
                if (srcattr !== undefined) {
                    imageurls.push(srcattr);
                }
            }
            imgsrc = $('a');
            for (let i= 0; i < imgsrc.length; i++){
                let hrefattr = imgsrc[i].attribs.href;
                if(Rex.test(hrefattr)) {
                    imageurls.push(hrefattr);
                }
            }
            // call rendition template
            res.render('checkedpage', { webpageurl : pageurl, imageurls });
        }
    })

}

module.exports = router;

