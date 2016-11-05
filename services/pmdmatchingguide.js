"use strict";
let fs = require("fs");
let yaml = require('js-yaml');
function loadData() {
    let pmdinvguide = null;
    try {
        exports.data = yaml.safeLoad(fs.readFileSync('./config/pmdmatchingguide.yml', 'utf8'));
        // console.log(pinvprops);
    } catch (e) {
        console.log(e);
    }
    Object.freeze(exports.data);
}
exports.loadData = loadData;