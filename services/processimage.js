let appconfig = require("./appconfig");
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
const designIsearch1 = 'isearch1'; // IPTC metadata relevant for image search results (variant 1)

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
 * @param imgfpath - file path of the image in the context of the hosting server
 * @param imgwsfpath - file path of the image in the context of the web server
 * @param imgtitle - title of the HTML output
 * @param imgurl - URL of an image posted in the web
 * @param imglfn - local file name of the image
 * @param outputdesign - code of the output design
 * @param labeltype - value of enumeration "IPTC PMD Std prop name", "Technical Format Field Id", "Exiftool Field Id"
 * @param uselang - to be used language
 */
function processImageFileAsHtml (res, imgfpath, imgwsfpath, imgtitle, imgurl, imglfn, outputdesign, labeltype, uselang) {
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
    // for special feature designs
    let isearch1SpecOutObjarr = []; // for the design of image search metadata
    let noneOutObjarrSpec = [];
    // for other purposes
    let schemaorgObjarr = []; // container of schema.org metadata (property name/value pair objects)

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
            // ... for special output designs:
            let targetObjSpecIsearch1 = null; // values will be set later


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

                let usedPropLabelCode = pmdinvguide.data.topwithprefix[topPmdPropName4ref].label;
                if (uselang !== 'en') {
                    if (pmdinvguide.data.topwithprefix[topPmdPropName4ref].labellocal) {
                        if (pmdinvguide.data.topwithprefix[topPmdPropName4ref].labellocal[uselang]) {
                            usedPropLabelCode = pmdinvguide.data.topwithprefix[topPmdPropName4ref].labellocal[uselang];
                        }
                    }
                }
                let propLabel = tools1.getLabelPart(topPmdPropName + "|" + usedPropLabelCode, labelId);
                let propSortorder = pmdinvguide.data.topwithprefix[topPmdPropName4ref].sortorder;
                let propOutputAll = pmdinvguide.data.topwithprefix[topPmdPropName4ref].output;
                let propValue = undefined; // value will be set in different ways (further down)
                // retrieve where this top level property and all its sub-properties should be
                // displayed in the output of this system and set the target... variables
                let outputList = propOutputAll.split(','); // array of all 'output' terms
                // iterate array and set where a property should be displayed
                for (let io = 0; io < outputList.length; io++){
                    targetObjSpecIsearch1 = noneOutObjarrSpec;
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
                        case 'isearch1':
                            targetObjSpecIsearch1 = isearch1SpecOutObjarr;
                            break;
                        default :
                            targetObjStd = noneOutObjarrStd;
                            targetObjTopics = noneOutObjarrTopic;
                            targetObjSpecIsearch1 = noneOutObjarrSpec;
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
                            propValue = getPropValueData(topProp, labelId, schemaorgObjarr)[pvdValue]; // investigate the value object of the topProp
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
                        propValue = getPropValueData(topProp, labelId, schemaorgObjarr)[pvdValue]; // investigate the value object of the topProp
                    }
                    else { // the value is a string
                        propType = plainptype;
                        propValue = topProp;
                    }
                }

                addPropObject(targetObjStd, propType, propLabel, propSortorder, topPropSpecidx, propValue);
                addPropObject(targetObjTopics, propType, propLabel, propSortorder, topPropSpecidx, propValue);
                addPropObject(targetObjSpecIsearch1, propType, propLabel, propSortorder, topPropSpecidx, propValue);

                if (pmdinvguide.data.topwithprefix[topPmdPropName4ref].schemaorgpropname){
                    addSchemaorgProp(schemaorgObjarr, pmdinvguide.data.topwithprefix[topPmdPropName4ref].schemaorgpropname, propValue);
                }

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
            isearch1SpecOutObjarr.sort(compareBySortorder);

            let techMd = tools1.getTechMd(pmdresult.data[0]);

            switch(outputdesign) {
                case designStds:
                    res.render('pmdresult_stds', { imageTitle: imgtitle, imgurl, imgwsfpath, imglfn, labeltype, techMd, iimOutObj: iimOutObjarr, xmpOutObj: xmpOutObjarr, exifOutObj: exifOutObjarr, anyOutObjStd: anyOutObjStdarr });
                    break;
                case designTopics:
                    res.render('pmdresult_topics', { imageTitle: imgtitle, imgurl, imgwsfpath, imglfn, labeltype, techMd, gimgcontOutObj: gimgcontOutObjarr, personOutObj: personOutObjarr, locationOutObj: locationOutObjarr, othingsOutObj: othingsOutObjarr, rightsOutObj: rightsOutObjarr, licOutObj: licOutObjarr, adminOutObj: adminOutObjarr, imgregOutObj: imgregOutObjarr, anyOutObjTopic: anyOutObjarrTopic });
                    break;
                case designIsearch1:
                    let codeStr = transfromSchemaorgObj2Code1(schemaorgObjarr, imgurl);
                    res.render('pmdresult_isearch1', {imageTitle: imgtitle, imgurl, imgwsfpath, imglfn, labeltype, techMd, isearch1OutObj: isearch1SpecOutObjarr, schemaorgCode: codeStr});
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
        if (obj.hasOwnProperty(propname)){
            propnames.push(propname);
        }
    }
    return propnames;
}

/**
 * addPropObject: add a property object to an array of property objects (by push)
 * @param modObjArr - to be modified array of property objects
 * @param proptype
 * @param propname
 * @param propsortorder
 * @param propspecidx
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
 * @param schemaorgObjArr
 * @returns {{}}
 */
function getPropValueData (propValueObj, labelId, schemaorgObjArr){
    let propValueData = {};
    let propArr = []; // this array collects all sub-properties of propValueObj, if they exist
    let propType = undefined;
    let propValue = undefined;
    let propValueObjIsArray = Array.isArray(propValueObj);
    let schemaorgPname = undefined;
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
                                    if (pmdinvguide.data.topwithprefix[childPropName4ref].schemaorgpropname){
                                        schemaorgPname = pmdinvguide.data.topwithprefix[childPropName4ref].schemaorgpropname;
                                    }
                                    else{
                                        schemaorgPname = undefined;
                                    }

                                }
                            }
                            else {
                                childPropLabel = tools1.getLabelPart(childPropName + "|" + pmdinvguide.data.topnoprefix[childPropName4ref].label, labelId);
                                if (pmdinvguide.data.topnoprefix[childPropName4ref].specidx){
                                    childPropSpecidx = pmdinvguide.data.topnoprefix[childPropName4ref].specidx;
                                }
                                if (pmdinvguide.data.topnoprefix[childPropName4ref].schemaorgpropname){
                                    schemaorgPname = pmdinvguide.data.topwithprefix[childPropName4ref].schemaorgpropname;
                                }
                                else{
                                    schemaorgPname = undefined;
                                }
                            }
                        }
                        else {
                            childPropLabel = tools1.getLabelPart(childPropName + "|" + pmdinvguide.data.instructure[childPropName4ref].label, labelId);
                            if (pmdinvguide.data.instructure[childPropName4ref].schemaorgpropname){
                                schemaorgPname = pmdinvguide.data.instructure[childPropName4ref].schemaorgpropname;
                            }
                            else{
                                schemaorgPname = undefined;
                            }
                        }
                        // childPropName found in reference list
                        let childPropValueData = getPropValueData(propValueObj[arrIdx][childPropName], labelId, schemaorgObjArr);
                        let displayChildPropLabel = '[' + (arrIdx + 1).toString() + '] ' + childPropLabel;
                        addPropObject(propArr, childPropValueData[pvdType], displayChildPropLabel, '', childPropSpecidx,
                          childPropValueData[pvdValue]);
                        if (schemaorgPname !== undefined){
                            addSchemaorgProp(schemaorgObjArr, schemaorgPname, childPropValueData[pvdValue]);
                        }
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
                        if (pmdinvguide.data.topnoprefix[childPropName4ref].specidx){
                            childPropSpecidx = pmdinvguide.data.topnoprefix[childPropName4ref].specidx;
                        }
                        if (pmdinvguide.data.topnoprefix[childPropName4ref].schemaorgpropname){
                            schemaorgPname = pmdinvguide.data.topnoprefix[childPropName4ref].schemaorgpropname;
                        }
                        else{
                            schemaorgPname = undefined;
                        }
                    }
                }
                else {
                    childPropLabel = tools1.getLabelPart(childPropName + "|" + pmdinvguide.data.instructure[childPropName4ref].label, labelId);
                    if (pmdinvguide.data.instructure[childPropName4ref].schemaorgpropname){
                        schemaorgPname = pmdinvguide.data.instructure[childPropName4ref].schemaorgpropname;
                    }
                    else{
                        schemaorgPname = undefined;
                    }
                }
                // childPropName found in reference list
                let childPropValueData = getPropValueData(propValueObj[childPropName], labelId, schemaorgObjArr);
                addPropObject(propArr, childPropValueData[pvdType], childPropLabel, '', childPropSpecidx, childPropValueData[pvdValue]);
                if (schemaorgPname !== undefined){
                    addSchemaorgProp(schemaorgObjArr, schemaorgPname, childPropValueData[pvdValue]);
                }
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
 * Adds a schema.org pmd property object to an array
 * @param modSchemaorgObjArr
 * @param propname
 * @param propvalue
 */
function addSchemaorgProp (modSchemaorgObjArr, propname, propvalue){
    if (propname === undefined){ return; }
    if (propvalue === undefined){ return; }
    let schemaorgProp = {
        pname: propname,
        pvalue: propvalue
    }
    modSchemaorgObjArr.push(schemaorgProp);
}


/**
 * Transforms an array of schema.org property objects to a string for the HTML code element
 * @param schemaorgObjArr - the array of schema.org property objects
 * @param imgUrl - the URL of the image being the subject of the metadata
 * @returns {string}
 */
function transfromSchemaorgObj2Code1(schemaorgObjArr, imgUrl){
    if (imgUrl === undefined){ return '';}
    if (imgUrl === ''){ return '';}
    let codeStr = '{\n  "@context": "https://schema.org",\n  "@type": "ImageObject",\n';
    codeStr += '  "url": "' + imgUrl + '"';
    let usedschemaorgProps = [];
    for(let idx = 0; idx < schemaorgObjArr.length; idx++){
        if (schemaorgObjArr[idx].pname){
            let schemaorgPname = schemaorgObjArr[idx].pname;
            if (usedschemaorgProps.includes(schemaorgPname)){
                continue;
            }
            else {
                usedschemaorgProps.push(schemaorgPname);
            }
            if (schemaorgObjArr[idx].pvalue) {
                codeStr += ',\n  "' + schemaorgPname + '": "' + schemaorgObjArr[idx].pvalue + '"';
            }
        }
    }
    codeStr += '\n}'
    return codeStr;
}

/**
 * Transforms an array of schema.org property objects to an array of strings for HTML code elements
 * @param schemaorgObjArr - the array of schema.org property objects
 * @param imgUrl - the URL of the image being the subject of the metadata
 * @returns {string[]}
 */
/*
function transfromSchemaorgObj2Code2(schemaorgObjArr, imgUrl){
    if (imgUrl === undefined){ return '';}
    if (imgUrl === ''){ return '';}
    let tempStr;
    let codeArr = [];
    codeArr.push('{');
    codeArr.push('"@context": "https://schema.org",');
    codeArr.push('"@type": "ImageObject",');
    tempStr = '"url": "' + imgUrl + '",'
    codeArr.push(tempStr);
    let usedschemaorgProps = [];
    for(let idx = 0; idx < schemaorgObjArr.length; idx++){
        if (schemaorgObjArr[idx].pname){
            let schemaorgPname = schemaorgObjArr[idx].pname;
            if (usedschemaorgProps.includes(schemaorgPname)){
                continue;
            }
            else {
                usedschemaorgProps.push(schemaorgPname);
            }
            if (schemaorgObjArr[idx].pvalue) {
                tempStr = '"' + schemaorgPname + '": "' + schemaorgObjArr[idx].pvalue + '"';
                if (idx < (schemaorgObjArr.length - 1)){
                    tempStr += ','
                }
                codeArr.push(tempStr);
            }
        }
    }
    codeArr.push('}');
    return codeArr;
}
*/

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

