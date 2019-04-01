"use strict";
var fs = require("fs");
var path = require("path");

/**
 * Loads configuration data into the 'data' variable and freezes it
 */
function loadConfigData(configFilePath) {
    var filePath;
    if (configFilePath) {
        filePath = configFilePath;
    }
    else {
        filePath = path.join(__dirname, "../config/appconfig.json");
        // console.log("INFO: app config file path: " + filePath);
    }
    var readdata = fs.readFileSync(filePath, { encoding: "utf-8" });
    exports.data = JSON.parse(readdata);
    Object.freeze(exports.data);
}
exports.loadConfigData = loadConfigData;
