"use strict";
let fs = require("fs");
let path = require("path");
let yaml = require('js-yaml');
function loadData() {
    try {
        let filepath = path.join(__dirname, '../config/pmdmatchingguide.yml');
        exports.data = yaml.safeLoad(fs.readFileSync(filepath,'utf8'));
    } catch (e) {
        console.log(e);
    }
    Object.freeze(exports.data);
}
exports.loadData = loadData;