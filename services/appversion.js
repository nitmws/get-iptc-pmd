"use strict";
var fs = require("fs");
/**
 * Loads version data into the 'data' variable and freezes it
 */
function loadVersionData() {
    let filePath = "./appversion.json";
    let readdata = fs.readFileSync(filePath, { encoding: "utf-8" });
    exports.data = JSON.parse(readdata);
    Object.freeze(exports.data);
}
exports.loadVersionData = loadVersionData;
