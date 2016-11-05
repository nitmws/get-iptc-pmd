"use strict";
let fs = require("fs");
let yaml = require('js-yaml');
function loadData() {
    try {
        exports.data = yaml.safeLoad(fs.readFileSync('./config/pmdinvestigationguide.yml', 'utf8'));
    } catch (e) {
        console.log(e);
    }
    Object.freeze(exports.data);
}
exports.loadData = loadData;