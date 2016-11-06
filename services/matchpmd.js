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

function matchPmdShowHtml (res, imgfpath, imgwsfpath, imgtitle) {
    // An ExifTool process is started to retrieve the metadata
    ep.open().then((pid) => {
        console.log('Started exiftool process %s', pid);
        return ep.readMetadata(imgfpath, ['j', 'G', 'struct' ]).then((pmdresult) => {
            // metadata has been retrieved and is available as pmdresult object
            // console.log(pmdmatchguide.data);
            matchOutObj = [];
            let matchNames = getMatchNames(pmdmatchguide.data);
            for (let i_match = 0; i_match < matchNames.length; i_match++) {
                let iimName = '';
                let iimValue = 'NA';
                let xmpName = '';
                let xmpValue = 'NA';
                let exifName = '';
                let exifValue = 'NA';
                let matchLabel = '';
                let matchProps = [];
                let matchNote = 'NA';
                let matchName = matchNames[i_match];
                if (pmdmatchguide.data[matchName].label !== undefined){
                    matchLabel = pmdmatchguide.data[matchName].label;
                }
                let skipCreateNote = false;
                if (pmdmatchguide.data[matchName].props !== undefined){
                    matchProps = pmdmatchguide.data[matchName].props;
                    for (let i_propname = 0; i_propname < matchProps.length; i_propname++){
                        let propname = matchProps[i_propname];
                        if (propname.substring(0,5) == 'IPTC_'){
                            if (propname !== 'IPTC_TimeCreated') {
                                skipCreateNote = true;
                            }
                            iimName = propname.replace('_', ':'); // modify for ExifTool
                            if (pmdresult.data[0][iimName] !== undefined){
                                iimValue = pmdresult.data[0][iimName];
                            }
                            else {
                                iimValue = 'Not found';
                            }
                        }
                        if (propname.substring(0,4) == 'XMP_'){
                            xmpName = propname.replace('_', ':'); // modify for ExifTool
                            if (pmdresult.data[0][xmpName] !== undefined){
                                xmpValue = pmdresult.data[0][xmpName];
                            }
                            else {
                                xmpValue = 'Not found';
                            }
                        }
                        if (propname.substring(0,5) == 'EXIF_'){
                            exifName = propname.replace('_', ':'); // modify for ExifTool
                            if (pmdresult.data[0][exifName] !== undefined){
                                exifValue = pmdresult.data[0][exifName];
                            }
                            else {
                                exifValue = 'Not found';
                            }
                        }
                    }
                    // create a matchNote if values are not the same
                    // exclude values which occur only in a single format
                    if (!skipCreateNote) {
                        if (iimValue !== xmpValue) {
                            matchNote = 'IIM and XMP don\'t match';
                            if (exifValue !== iimValue) {
                                matchNote += ' and Exif doesn\'t match the IIM value';
                            }
                        }
                        else {
                            if (exifValue !== 'NA') {
                                if (exifValue !== iimValue) {
                                    matchNote = 'Exif doesn\'t match the IIM/XMP value';
                                }
                            }
                        }
                    }
                    addCompObject(matchOutObj, matchLabel, iimValue, xmpValue, exifValue, matchNote);
                }
            }
            res.render('pmdresult_compare_bs', { imageTitle: imgtitle, imgwsfpath, matchOutObj });
        });
    }).then(() => {
        return ep.close().then(() => {
            console.log('Closed exiftool');
        });
    });
}

/**
 * Returns an array of the names of the matching guideline objects
 * @param obj
 * @returns {Array}
 */
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

/**
 * Adds an object with data about comparing metadata values to the output object
 * @param modObjArr
 * @param label
 * @param iimValue
 * @param xmpValue
 * @param exifValue
 * @param note
 */
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