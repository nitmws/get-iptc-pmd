"use strict";

let fs = require("fs");
let appconfig = require("./appconfig"); // configuration of this app
appconfig.loadConfigData("");

let tools1 = require('../services/tools1');

const exiftool = require('node-exiftool');
const ep = new exiftool.ExiftoolProcess('exiftool');

// Data from the PMD Investigation Guide are loaded.
// They control what PMD properties are searched for and how they are displayed
let pmdinvguide = require('./pmdinvestigationguide');
pmdinvguide.loadData();

// codes for the design of the output
const designStds = 'perstandards'; // metadata fields grouped per standard
const designTopics = 'pertopics'; // metadata fields grouped per topic
const designCompStds = 'comparestandards'; // comparing IPTC properties used across formats

// codes to control the PUGJS output
const plainptype = "plain"; // the value of this property is plain text
const structptype = "struct"; // the value of this property is a structure

module.exports = { processImageFileAsHtml };

/**
 * Retrieves metadata from the image file and creates data for the output as HTML rendition
 * @param res - Express response
 * @param imgfpath - file path of the image
 * @param imgtitle - title of the HTML output
 * @param outputdesign - code of the output design
 */
function processImageFileAsHtml (res, imgfpath, imgwsfpath, imgtitle, imglfn, outputdesign, labeltype) {

    // Objects for output of the PMD in different sections of the HTML output
    // for the 'perstandard' design
    let iimOutObj = [];
    let xmpOutObj = [];
    let exifOutObj = [];
    // for the 'pertopics' design
    let gimgcontOutObj = [];
    let personOutObj = [];
    let locationOutObj = [];
    let othingsOutObj = [];
    let rightsOutObj = [];
    let licOutObj = [];
    let adminOutObj = [];
    let anyOutObjStd = [];
    let anyOutObjTopic = [];
    let noneOutObjStd = [];
    let noneOutObjTopic = [];

    // Child Properties: array of child property objects at output structure levels 1 and 2
    let childpropsL1 = [];
    let childpropsL2 = [];

    // let labeltype = 'ipmd'; // FOR TESTING ONLY

    let labelId = -1;
    switch (labeltype){
        case 'et':
            labelId = 0;
            break;
        case 'ipmd':
            labelId = 1;
            break;
        case 'std':
            labelId = 2;
            break;
    }

    // An ExifTool process is started to retrieve the metadata
    ep.open().then((pid) => {
        console.log('Started exiftool process %s', pid);
        return ep.readMetadata(imgfpath, ['j', 'G1', 'struct' ]).then((pmdresult) => {
            // metadata has been retrieved and are processed as pmdresult object
            console.log ('Image tested by ExifTool: ' + imgfpath);

            // each property must be displayed in one of the output objects
            // these target... objects are set by the PMD Investigation Guide
            let targetObjStd = null; // values will be set later
            let targetObjTopics = null; // values will be set later

            // Get the L1 property names from the PMD Investigation Guide
            let pinvPropnamesL1 = getPropnames(pmdinvguide.data);
            // iterate all L1 property names
            for (let i_pnameL1 = 0; i_pnameL1 < pinvPropnamesL1.length; i_pnameL1++){
                let pinvPropnameL1 = pinvPropnamesL1[i_pnameL1];

                // get all child property names of this L1 property name from the PMD Investigation Guide
                let propnamesL2 = getPropnames(pmdinvguide.data[pinvPropnameL1]);
                let pinvPropnamesL2 = []; // the property names for investigation

                // check the L2 property names for special ones for this investigation system
                // the non-special will be added for investigation to pinvPropnamesL2
                let outputAll = ''; // string of all 'output' terms
                for (let i_pnameL2 = 0; i_pnameL2 < propnamesL2.length; i_pnameL2++){
                    let propnameL2 = propnamesL2[i_pnameL2];
                    switch(propnameL2){
                        case 'output':
                            outputAll = pmdinvguide.data[pinvPropnameL1].output;
                            break;
                        case 'label':
                            break;
                        default:
                            pinvPropnamesL2.push(propnamesL2[i_pnameL2]);
                    }
                }
                // now all the properties which should be further processed are in pinvPropnamesL2

                // retrieve where this L1 property and all its sub-properties should be
                // displayed in the output of this system and set the target... variables
                let outputList = outputAll.split(','); // array of all 'output' terms
                // iterate array and set where a property should be displayed
                for (let io = 0; io < outputList.length; io++){
                    switch(outputList[io]){
                        case 'iim':
                            targetObjStd = iimOutObj;
                            break;
                        case 'xmp':
                            targetObjStd = xmpOutObj;
                            break;
                        case 'exif':
                            targetObjStd = exifOutObj;
                            break;
                        case 'gimgcont':
                            targetObjTopics = gimgcontOutObj;
                            break;
                        case 'person':
                            targetObjTopics = personOutObj;
                            break;
                        case 'location':
                            targetObjTopics = locationOutObj;
                            break;
                        case 'othings':
                            targetObjTopics = othingsOutObj;
                            break;
                        case 'rights':
                            targetObjTopics = rightsOutObj;
                            break;
                        case 'lic':
                            targetObjTopics = licOutObj;
                            break;
                        case 'admin':
                            targetObjTopics = adminOutObj;
                            break;
                        case 'any':
                            targetObjTopics = anyOutObjStd;
                            targetObjStd = anyOutObjTopic;
                            break;
                        default :
                            targetObjStd = noneOutObjStd;
                            targetObjTopics = noneOutObjTopic;
                            break;
                    }
                }

                let gobelowL1propnames = false; // search for sub-level property names of L1 or not?
                if (pinvPropnamesL2.length > 0){
                    gobelowL1propnames = true;
                }
                let etPropnameL1 = pinvPropnameL1.replace('_', ':'); // modify for ExifTool
                //  check first if this property exists in the et-data at all
                if (pmdresult.data[0][etPropnameL1]){
                    if (!gobelowL1propnames){ // don't do below L1 names
                        // if no child names exist the value of this property is a plain text
                        // BUT: multiple values (in an array) are merged into a single string!
                        let plainvalueL1 = pmdresult.data[0][etPropnameL1];
                        let pmdLabelL1 = tools1.getLabelPart(etPropnameL1+'|'+ pmdinvguide.data[pinvPropnameL1].label, labelId);
                        addPropObject(targetObjStd, plainptype, pmdLabelL1, plainvalueL1);
                        addPropObject(targetObjTopics, plainptype, pmdLabelL1, plainvalueL1);
                    }
                    else { // go below Level 1 names
                        let plainvalueL2 = null;
                        let pinvPropnameL2;
                        let etPropnameL2;
                        childpropsL1 = []; // this is the output container for child object of this L1 property
                        // check et-data if the sub-properties of the L1 property are in an array
                        let propL1isArray = Array.isArray(pmdresult.data[0][etPropnameL1]);
                        if (propL1isArray) { // sub-properties are in an array
                            // iterate the et-data objects in the Level 1 array
                            for (let iobj2 = 0; iobj2 < pmdresult.data[0][etPropnameL1].length; iobj2++){
                                // iterate all property names at Level 2
                                for (let i_pnameL2 = 0; i_pnameL2 < pinvPropnamesL2.length; i_pnameL2++){
                                    pinvPropnameL2 = pinvPropnamesL2[i_pnameL2];
                                    // get all child property names of this L2 property name from the PMD Investigation Guide
                                    // is a tricky investigation: the testname below could be of type 'string' or 'object'
                                    // only the type 'object' indicates "there are names of sub-properties"
                                    let testname = pmdinvguide.data[pinvPropnameL1][pinvPropnameL2];
                                    // set the array of L3 property names depending on the type of testname
                                    let propnamesL3 = []; // default: empty array
                                    if (typeof testname === 'object' ){ // only if this is an 'object' ...
                                        propnamesL3 = getPropnames(testname); // ... get all property names
                                    }
                                    let gobelowL2propnames = false; // search for sub-level property names of L2 or not?
                                    if (propnamesL3.length > 0) {
                                        gobelowL2propnames = true;
                                    }
                                    etPropnameL2 = pinvPropnameL2.replace('_', ':'); // modify for ExifTool
                                    if (pmdresult.data[0][etPropnameL1][iobj2][etPropnameL2]){ // does it exist?
                                        if (!gobelowL2propnames) { // don't go below L2 names
                                            plainvalueL2 = pmdresult.data[0][etPropnameL1][iobj2][etPropnameL2];
                                            let pmdLabelL2 = tools1.getLabelPart(etPropnameL2+'|'+ pmdinvguide.data[pinvPropnameL1][pinvPropnameL2], labelId);
                                            let labelL2 = '[' + (iobj2 + 1).toString() + '] ' + pmdLabelL2;
                                            addPropObject(childpropsL1, plainptype, labelL2, plainvalueL2);
                                        }
                                        else { // go below L2 names for sub-properties
                                            let labelL2 = '[' + (iobj2 + 1).toString() + '] ' + etPropnameL2;
                                            // check et-data if the sub-properties of the L2 property are in an array
                                            let propL2isArray = Array.isArray(pmdresult.data[0][etPropnameL1][iobj2][etPropnameL2]);
                                            if (propL2isArray) { // sub-properties of L2 property are in an array
                                                childpropsL2 = []; // the container of the children of L2
                                                // iterate the et-data objects in the array
                                                for (let iobj3 = 0; iobj3 < pmdresult.data[0][etPropnameL1][iobj2][etPropnameL2].length; iobj3++) {
                                                    // iterate all property names at Level 3
                                                    for (let i_pnameL3 = 0; i_pnameL3 < propnamesL3.length; i_pnameL3++){
                                                        let pinvPropnameL3 = propnamesL3[i_pnameL3];
                                                        let etPropnameL3 = pinvPropnameL3.replace('_', ':'); // modify for ExifTool
                                                        if (pmdresult.data[0][etPropnameL1][iobj2][etPropnameL2][iobj3][etPropnameL3]){ // does it exist?
                                                            let plainvalueL3 = pmdresult.data[0][etPropnameL1][iobj2][etPropnameL2][iobj3][etPropnameL3];
                                                            let pmdLabelL3 = tools1.getLabelPart(etPropnameL3+'|'+ pmdinvguide.data[pinvPropnameL1][pinvPropnameL2][pinvPropnameL3], labelId);
                                                            let labelL3 = '[' + (iobj3 + 1).toString() + '] ' + pmdLabelL3;
                                                            addPropObject(childpropsL2, plainptype, labelL3, plainvalueL3);
                                                        }
                                                    }
                                                }
                                                addPropObject(childpropsL1, structptype, labelL2, childpropsL2);
                                            }
                                            else { // sub-properties of L2 property are NOT in an array
                                                childpropsL2 = []; // the output container of the children of L2
                                                // iterate all property names at Level 3
                                                for (let i_pnameL3 = 0; i_pnameL3 < propnamesL3.length; i_pnameL3++){
                                                    let pinvPropnameL3 = propnamesL3[i_pnameL3];
                                                    let etPropnameL3 = pinvPropnameL3.replace('_', ':'); // modify for ExifTool
                                                    if (pmdresult.data[0][etPropnameL1][iobj2][etPropnameL2][etPropnameL3]){ // does it exist?
                                                        let plainvalueL3 = pmdresult.data[0][etPropnameL1][iobj2][etPropnameL2][etPropnameL3];
                                                        let pmdLabelL3 = tools1.getLabelPart(etPropnameL3+'|'+ pmdinvguide.data[pinvPropnameL1][pinvPropnameL2][pinvPropnameL3], labelId);
                                                        addPropObject(childpropsL2, plainptype, pmdLabelL3, plainvalueL3);
                                                    }
                                                }
                                                addPropObject(childpropsL1, structptype, labelL2, childpropsL2);
                                            }
                                        }
                                    }
                                }
                            }
                            let pmdLabelL1 = tools1.getLabelPart(etPropnameL1+'|'+ pmdinvguide.data[pinvPropnameL1].label, labelId);
                            addPropObject(targetObjStd, structptype, pmdLabelL1, childpropsL1);
                            addPropObject(targetObjTopics, structptype, pmdLabelL1, childpropsL1);
                        }
                        else { // sub-properties of L1 property are NOT in an array
                            // iterate all property names at Level 2
                            childpropsL1 = [];
                            for (let i_pnameL2 = 0; i_pnameL2 < pinvPropnamesL2.length; i_pnameL2++){
                                pinvPropnameL2 = pinvPropnamesL2[i_pnameL2];
                                etPropnameL2 = pinvPropnameL2.replace('_', ':'); // modify for ExifTool
                                if (pmdresult.data[0][etPropnameL1][etPropnameL2]){ // does it exist?
                                    plainvalueL2 = pmdresult.data[0][etPropnameL1][etPropnameL2];
                                    let pmdLabelL2 = tools1.getLabelPart(etPropnameL2+'|'+ pmdinvguide.data[pinvPropnameL1][pinvPropnameL2], labelId);
                                    addPropObject(childpropsL1, plainptype, pmdLabelL2, plainvalueL2);
                                }
                            }
                            let pmdLabelL1 = tools1.getLabelPart(etPropnameL1+'|'+ pmdinvguide.data[pinvPropnameL1].label, labelId);
                            addPropObject(targetObjStd, structptype, pmdLabelL1, childpropsL1);
                            addPropObject(targetObjTopics, structptype, pmdLabelL1, childpropsL1);
                        } // sub-properties of L1 property are NOT in an array
                    } // go below L1
                } // check if the L1 property exists in et-data
            }

            let techMd = tools1.getTechMd(pmdresult.data[0]);
            switch(outputdesign) {
                case designStds:
                    res.render('pmdresult_stds_bs', { imageTitle: imgtitle, imgwsfpath, imglfn, techMd, iimOutObj, xmpOutObj, exifOutObj, anyOutObjStd });
                    break;
                case designTopics:
                    res.render('pmdresult_topics_bs', { imageTitle: imgtitle, imgwsfpath, imglfn, techMd, gimgcontOutObj, personOutObj, locationOutObj, othingsOutObj, rightsOutObj, licOutObj, adminOutObj, anyOutObjTopic });
                    break;
                case designCompStds:
                    break;
                default:
                    break;
            }
            console.log('Next: HTML is rendered');
        });
        // repeat as many times as required
    }).then(() => {
        return ep.close().then(() => {
            console.log('Closed exiftool');
        });
    });
}
// end of processImageFileAsHtml

/**
 * getPropnames retrieves all property names of an object
 * @param obj
 * @returns {Array}
 */
function getPropnames (obj){
    var propnames = [];
    if (!obj){
        return propnames;
    }
    for(var propname in obj){
        propnames.push(propname);
    }
    return propnames;
}

/**
 * addPropObject: add a property object to a node of the structured output object
 * @param modObjArr
 * @param proptype
 * @param propname
 * @param propvalue
 */
function addPropObject (modObjArr, proptype, propname, propvalue){
    if (modObjArr === undefined){ return; }
    if (proptype === undefined){ return; }
    if (propname === undefined){ return; }
    if (propvalue === undefined){ return; }

    let prop = {
        ptype: proptype,
        pname: propname,
        pvalue: propvalue

    };
    modObjArr.push(prop);
}