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
let refTopPropNamesWPf = getPropnames(pmdinvguide.data.topwithprefix);
let refTopPropNamesNoPf = getPropnames(pmdinvguide.data.topnoprefix);
let refStruPropNames = getPropnames(pmdinvguide.data.instructure);

// codes for the design of the output
const designStds = 'perstandards'; // metadata fields grouped per standard
const designTopics = 'pertopics'; // metadata fields grouped per topic
const designCompStds = 'comparestandards'; // comparing IPTC properties used across formats

// codes to control the PUGJS output
const plainptype = "plain"; // the value of this property is plain text
const structptype = "struct"; // the value of this property is a structure

// codes for PropValueData
const pvdType = 'propType';
const pvdValue = 'propValue';

module.exports = { processImageFileAsHtml };

/**
 * Retrieves metadata from the image file and creates data for the output as HTML rendition
 * @param res - Express response
 * @param imgfpath - file path of the image
 * @param imgtitle - title of the HTML output
 * @param outputdesign - code of the output design
 */
function processImageFileAsHtml (res, imgfpath, imgwsfpath, imgtitle, imgurl, imglfn, outputdesign, labeltype) {

    // Arrays of objects for output of the PMD in different sections of the HTML output
    // for the 'perstandard' design
    let iimOutObjarr = [];
    let xmpOutObjarr = [];
    let exifOutObjarr = [];
    // for the 'pertopics' design
    let gimgcontOutObjarr = [];
    let personOutObjarr = [];
    let locationOutObjarr = [];
    let othingsOutObjarr = [];
    let rightsOutObjarr = [];
    let licOutObjarr = [];
    let adminOutObjarr = [];
    let imgregOutObjarr = [];
    let anyOutObjStdarr = [];
    let anyOutObjarrTopic = [];
    let noneOutObjarrStd = [];
    let noneOutObjarrTopic = [];

    let labelId = -1;
    if (labeltype === undefined){
        labelId = 1;
    }
    else {
        switch (labeltype.toLowerCase()) {
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
    }
    if (ep.isOpen) {
        ep.close().then(() => {
            console.log('Start action: close exiftool');
        }).catch(err => {
            tools1.write2Log('ERROR @default closing of exiftool: ' + err);
        });
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


            let topPmdPropNames = Object.getOwnPropertyNames(pmdresult.data[0]);

            // iterate across all top level property names found in the pmd result
            for (let tPPNidx = 0; tPPNidx < topPmdPropNames.length; tPPNidx++){
                let topPmdPropName = topPmdPropNames[tPPNidx];
                let topPmdPropName4ref = topPmdPropName.replace(":","_");
                if (!(refTopPropNamesWPf.includes(topPmdPropName4ref))){ // topPmdPropName not in reference list
                    continue;
                }
                // topPmdPropName found in reference list

                let topProp = pmdresult.data[0][topPmdPropName];
                let propType = undefined;
                let propLabel = tools1.getLabelPart(topPmdPropName + "|" + pmdinvguide.data.topwithprefix[topPmdPropName4ref].label, labelId);
                let propSortorder = pmdinvguide.data.topwithprefix[topPmdPropName4ref].sortorder;
                let propOutputAll = pmdinvguide.data.topwithprefix[topPmdPropName4ref].output;
                let propValue = undefined; // value will be set in different ways (further down)
                // retrieve where this top level property and all its sub-properties should be
                // displayed in the output of this system and set the target... variables
                let outputList = propOutputAll.split(','); // array of all 'output' terms
                // iterate array and set where a property should be displayed
                for (let io = 0; io < outputList.length; io++){
                    switch(outputList[io]){
                        case 'iim':
                            targetObjStd = iimOutObjarr;
                            break;
                        case 'xmp':
                            targetObjStd = xmpOutObjarr;
                            break;
                        case 'exif':
                            targetObjStd = exifOutObjarr;
                            break;
                        case 'gimgcont':
                            targetObjTopics = gimgcontOutObjarr;
                            break;
                        case 'person':
                            targetObjTopics = personOutObjarr;
                            break;
                        case 'location':
                            targetObjTopics = locationOutObjarr;
                            break;
                        case 'othings':
                            targetObjTopics = othingsOutObjarr;
                            break;
                        case 'rights':
                            targetObjTopics = rightsOutObjarr;
                            break;
                        case 'licensing':
                            targetObjTopics = licOutObjarr;
                            break;
                        case 'admin':
                            targetObjTopics = adminOutObjarr;
                            break;
                        case 'imgreg':
                            targetObjTopics = imgregOutObjarr;
                            break;
                        case 'any':
                            targetObjTopics = anyOutObjStdarr;
                            targetObjStd = anyOutObjarrTopic;
                            break;
                        default :
                            targetObjStd = noneOutObjarrStd;
                            targetObjTopics = noneOutObjarrTopic;
                            break;
                    }
                }
                let topPropSpecidx = "";
                if (pmdinvguide.data.topwithprefix[topPmdPropName4ref].specidx){
                    topPropSpecidx = pmdinvguide.data.topwithprefix[topPmdPropName4ref].specidx;
                }

                let topPropIsArray = Array.isArray(topProp);
                if (topPropIsArray){ // the values of the topProp are in an array
                    if (topProp.length > 0){
                        if (typeof topProp[0] === 'object' ){ // array items are objects
                            propType = structptype;
                            propValue = getPropValueData(topProp, labelId)[pvdValue]; // investigate the value object of the topProp
                        }
                        else { // array items are a string, make a single one out of them
                            let pvalueConcat = "";
                            // iterate items of the array
                            for (let arrIdx = 0; arrIdx < topProp.length; arrIdx++) {
                                pvalueConcat += '[' + (arrIdx + 1).toString() + '] ' +  topProp[arrIdx] + " ";
                            }
                            propType = plainptype;
                            propValue = pvalueConcat;
                        }

                    }
                }
                else { // topProp has a single value, not an array of values

                    if (typeof topProp === 'object' ){ // the value is an object
                        propType = structptype;
                        propValue = getPropValueData(topProp, labelId)[pvdValue]; // investigate the value object of the topProp
                    }
                    else { // the value is a string
                        propType = plainptype;
                        propValue = topProp;
                    }
                }

                addPropObject(targetObjStd, propType, propLabel, propSortorder, topPropSpecidx, propValue);
                addPropObject(targetObjTopics, propType, propLabel, propSortorder, topPropSpecidx, propValue);

            } // eo: iterate across all top level property names found in the pmd result

            // sort all output objects of the top level properties
            iimOutObjarr.sort(compareByPropname);
            xmpOutObjarr.sort(compareByPropname);
            exifOutObjarr.sort(compareByPropname);
            anyOutObjStdarr.sort(compareBySortorder);
            gimgcontOutObjarr.sort(compareBySortorder);
            personOutObjarr.sort(compareBySortorder);
            locationOutObjarr.sort(compareBySortorder);
            othingsOutObjarr.sort(compareBySortorder);
            rightsOutObjarr.sort(compareBySortorder);
            licOutObjarr.sort(compareBySortorder);
            adminOutObjarr.sort(compareBySortorder);
            anyOutObjarrTopic.sort(compareBySortorder);

            let techMd = tools1.getTechMd(pmdresult.data[0]);
            switch(outputdesign) {
                case designStds:
                    res.render('pmdresult_stds', { imageTitle: imgtitle, imgurl, imgwsfpath, imglfn, labeltype, techMd, iimOutObj: iimOutObjarr, xmpOutObj: xmpOutObjarr, exifOutObj: exifOutObjarr, anyOutObjStd: anyOutObjStdarr });
                    break;
                case designTopics:
                    res.render('pmdresult_topics', { imageTitle: imgtitle, imgurl, imgwsfpath, imglfn, labeltype, techMd, gimgcontOutObj: gimgcontOutObjarr, personOutObj: personOutObjarr, locationOutObj: locationOutObjarr, othingsOutObj: othingsOutObjarr, rightsOutObj: rightsOutObjarr, licOutObj: licOutObjarr, adminOutObj: adminOutObjarr, imgregOutObj: imgregOutObjarr, anyOutObjTopic: anyOutObjarrTopic });
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
    }).catch( err => {
        tools1.write2Log('ERROR @retrieving PMD by exiftool: ' + err);
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
 * addPropObject: add a property object to an array of property objects (by push)
 * @param modObjArr - to be modified array of property objects
 * @param proptype
 * @param propname
 * @param propsortorder
 * @param propvalue
 */
function addPropObject (modObjArr, proptype, propname, propsortorder, propspecidx, propvalue){
    if (modObjArr === undefined){ return; }
    if (proptype === undefined){ return; }
    if (propname === undefined){ return; }
    if (propsortorder === undefined){ return; }
    if (propvalue === undefined){ return; }

    let prop = {
        ptype: proptype,
        pname: propname,
        psort: propsortorder,
        pspecidx: propspecidx,
        pvalue: propvalue

    };
    modObjArr.push(prop);
}

/**
 * Reads the data of a the value of a metadata property and transforms it to an output object
 * @param propValueObj
 * @param labelId
 * @returns {{}}
 */
function getPropValueData (propValueObj, labelId){
    let propValueData = {};
    let propArr = []; // this array collects all sub-properties of propValueObj, if they exist
    let propType = undefined;
    let propValue = undefined;
    let propValueObjIsArray = Array.isArray(propValueObj);
    if (propValueObjIsArray){ // propValueObj is an array of plain values or objects
        if (propValueObj.length > 0){
            if (typeof propValueObj[0] === 'object' ){ // array items are objects, investigate each one
                propType = structptype;
                // iterate items of the array
                for (let arrIdx = 0; arrIdx < propValueObj.length; arrIdx++){
                    // get all names of child properties
                    let childPropNames = Object.getOwnPropertyNames(propValueObj[0]);
                    // iterate child properties
                    for (let childPNidx = 0; childPNidx < childPropNames.length; childPNidx++){
                        let childPropName = childPropNames[childPNidx];
                        let childPropLabel = childPropName;
                        let childPropSpecidx = "";
                        let childPropName4ref = childPropName.replace(":","_");
                        if (!(refStruPropNames.includes(childPropName4ref))){ // childPropName not in reference list
                            if (!(refTopPropNamesNoPf.includes(childPropName4ref))){ // childPropName not in reference list
                                if (!(refTopPropNamesWPf.includes(childPropName4ref))){ // childPropName not in reference list
                                    continue;
                                }
                                else {
                                    childPropLabel = tools1.getLabelPart(childPropName + "|" + pmdinvguide.data.topwithprefix[childPropName4ref].label, labelId);
                                    if (pmdinvguide.data.topwithprefix[childPropName4ref].specidx){
                                        childPropSpecidx = pmdinvguide.data.topwithprefix[childPropName4ref].specidx;
                                    }
                                }
                            }
                            else {
                                childPropLabel = tools1.getLabelPart(childPropName + "|" + pmdinvguide.data.topnoprefix[childPropName4ref].label, labelId);
                                if (pmdinvguide.data.topnoprefix[childPropName4ref].specidx){
                                    childPropSpecidx = pmdinvguide.data.topnoprefix[childPropName4ref].specidx;
                                }
                            }
                        }
                        else {
                            childPropLabel = tools1.getLabelPart(childPropName + "|" + pmdinvguide.data.instructure[childPropName4ref].label, labelId);
                        }
                        // childPropName found in reference list
                        let childPropValueData = getPropValueData(propValueObj[arrIdx][childPropName], labelId);
                        let displayChildPropLabel = '[' + (arrIdx + 1).toString() + '] ' + childPropLabel;
                        addPropObject(propArr, childPropValueData[pvdType], displayChildPropLabel, '', childPropSpecidx,
                          childPropValueData[pvdValue]);
                    }
                }
            }
            else { // array items are a plain value = a string, concatenate them to a single string
                let pvalueConcat = "";
                // iterate items of the array
                for (let arrIdx = 0; arrIdx < propValueObj.length; arrIdx++) {
                    pvalueConcat += '[' + (arrIdx + 1).toString() + '] ' + propValueObj[arrIdx] + " ";
                }
                propType = plainptype;
                propValue = pvalueConcat;
            }

        }
    }
    else { // propValueObj is a single value, not an array of values
        if (typeof propValueObj === 'object' ){ // the value is an object
            propType = structptype;
            let childPropNames = Object.getOwnPropertyNames(propValueObj);
            for (let childPNidx = 0; childPNidx < childPropNames.length; childPNidx++){
                let childPropName = childPropNames[childPNidx];
                let childPropLabel = childPropName;
                let childPropSpecidx = "";
                let childPropName4ref = childPropName.replace(":","_");
                if (!(refStruPropNames.includes(childPropName4ref))){ // childPropName not in reference list
                    if (!(refTopPropNamesNoPf.includes(childPropName4ref))){ // childPropName not in reference list
                        continue;
                    }
                    else {
                        childPropLabel = tools1.getLabelPart(childPropName + "|" + pmdinvguide.data.topnoprefix[childPropName4ref].label, labelId);
                        if (pmdinvguide.data.topwithprefix[childPropName4ref].specidx){
                            childPropSpecidx = pmdinvguide.data.topnoprefix[childPropName4ref].specidx;
                        }
                    }
                }
                else {
                    childPropLabel = tools1.getLabelPart(childPropName + "|" + pmdinvguide.data.instructure[childPropName4ref].label, labelId);
                }
                // childPropName found in reference list
                let childPropValueData = getPropValueData(propValueObj[childPropName], labelId);
                addPropObject(propArr, childPropValueData[pvdType], childPropLabel, '', childPropSpecidx, childPropValueData[pvdValue]);
            }
        }
        else { // the value is a plain value = a string
            propType = plainptype;
            let propString = propValueObj;
            switch (propValueObj){
                case "Rectangle":
                case "Circle":
                case "Polygon":
                case "Pixel":
                case "Relative":
                    propString = propValueObj.toLowerCase();
                    break;
            }
            propValue = propString;
        }
    }

    if (propArr.length > 0){ // if the array is not empty make it the returned value
        propValue = propArr;
    }
    propValueData[pvdType] = propType;
    propValueData[pvdValue] = propValue;
    return propValueData;
}

/**
 * Function comparing two output properties by pname - used for sorting the investigation results
 * @param prop1
 * @param prop2
 * @returns {number}
 */
function compareByPropname(prop1, prop2){
    return prop1.pname.localeCompare(prop2.pname);
}

/**
 * Function comparing two output properties by psort - used for sorting the investigation results
 * @param prop1
 * @param prop2
 * @returns {number}
 */
function compareBySortorder(prop1, prop2){
    return prop1.psort.localeCompare(prop2.psort);
}

