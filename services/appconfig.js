"use strict";
var fs = require("fs");
/**
 * Loads configuration data into the 'data' variable and freezes it
 */
function loadConfigData(configFilePath) {
    var filePath;
    if (configFilePath) {
        filePath = configFilePath;
    }
    else {
        filePath = "./config/appconfig.json";
    }
    var readdata = fs.readFileSync(filePath, { encoding: "utf-8" });
    exports.data = JSON.parse(readdata);
    Object.freeze(exports.data);
}
exports.loadConfigData = loadConfigData;
