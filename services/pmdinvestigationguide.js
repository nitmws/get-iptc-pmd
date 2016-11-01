"use strict";
let fs = require("fs");
let yaml = require('js-yaml');
function loadData() {
    let pmdinvguide = null;
    try {
        exports.data = yaml.safeLoad(fs.readFileSync('./config/pmdinvestigationguide.yaml', 'utf8'));
        // console.log(pinvprops);
    } catch (e) {
        console.log(e);
    }
// console.log(pmdinvguide);
    Object.freeze(exports.data);
}
exports.loadData = loadData;