"use strict";

var fs = require("fs");
var appconfig = require("./appconfig"); // configuration of this app
appconfig.loadConfigData("");

const exiftool = require('node-exiftool');
const ep = new exiftool.ExiftoolProcess('exiftool');

// Data from the PMD Matching Guide are loaded.
// They control what PMD properties are matches against each other
let pmdmatchguide = require('./pmdmatchingguide');
pmdmatchguide.loadData();

module.exports = { matchPmdShowHtml };

// Object holding the output for the PugJs template
let matchOutObj = [];

function matchPmdShowHtml (res, imgfpath, imgtitle) {
    // An ExifTool process is started to retrieve the metadata
    ep.open().then((pid) => {
        console.log('Started exiftool process %s', pid);
        return ep.readMetadata(imgfpath, ['j', 'G', 'struct' ]).then((pmdresult) => {
            // metadata has been retrieved and is available as pmdresult object
            // console.log(pmdmatchguide.data);
            let matchNames = getMatchNames(pmdmatchguide.data);
            for (let i_match = 0; i_match < matchNames.length; i_match++) {
                let iimName = '';
                let iimValue = '';
                let xmpName = '';
                let xmpValue = '';
                let exifName = '';
                let exifValue = '';
                let matchLabel = '';
                let matchProps = [];
                let matchName = matchNames[i_match];
                if (pmdmatchguide.data[matchName].label !== undefined){
                    matchLabel = pmdmatchguide.data[matchName].label;
                }
                if (pmdmatchguide.data[matchName].props !== undefined){
                    matchProps = pmdmatchguide.data[matchName].props;
                    for (let i_propname = 0; i_propname < matchProps.length; i_propname++){
                        let propname = matchProps[i_propname];
                        if (propname.substring(0,5) == 'IPTC_'){
                            iimName = propname.replace('_', ':'); // modify for ExifTool
                            iimValue = pmdresult.data[0][iimName];
                        }
                        if (propname.substring(0,4) == 'XMP_'){
                            xmpName = propname.replace('_', ':'); // modify for ExifTool
                            xmpValue = pmdresult.data[0][xmpName];
                        }
                        if (propname.substring(0,5) == 'EXIF_'){
                            exifName = propname.replace('_', ':'); // modify for ExifTool
                            exifValue = pmdresult.data[0][exifName];
                        }
                    }
                    addCompObject(matchOutObj, matchLabel, iimValue, xmpValue, exifValue, '');
                }
            }
            res.render('pmdresult_compare_bs', { imageTitle: imgtitle, matchOutObj });
        });
    }).then(() => {
        return ep.close().then(() => {
            console.log('Closed exiftool');
        });
    });
}

function getMatchNames (obj){
    var matchnames = [];
    if (!obj){
        return matchnames;
    }
    for(var matchname in obj){
        matchnames.push(matchname);
    }
    return matchnames;
}

function addCompObject (modObjArr, label, iimValue, xmpValue, exifValue, note){
    if (modObjArr === undefined){ return; }
    if (label === undefined){ return; }
    if (iimValue === undefined){ return; }
    if (xmpValue === undefined){ return; }
    if (exifValue === undefined){ return; }
    if (note === undefined){ return; }

    let compdataset = {
        label: label,
        iimvalue: iimValue,
        xmpvalue: xmpValue,
        exifvalue : exifValue,
        note: note
    };
    modObjArr.push(compdataset);
}