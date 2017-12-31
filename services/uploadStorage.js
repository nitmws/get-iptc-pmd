"use strict";

let fs = require('fs')

function getDestination (req, file, cb) {
    cb(null, '/dev/null')
}

function UploadStorage (opts) {
    this.getDestination = (opts.destination || getDestination)
}

const imageFragmentSize = 71680; // 71680 = 70kB

UploadStorage.prototype._handleFile = function _handleFile (req, uploadFile, cb) {
    this.getDestination(req, uploadFile, function (err, path) {
        if (err) return cb(err)

        let outStream = fs.createWriteStream(path)
        let outstreamLength = 0;
        let outstreamOpen = true;

        uploadFile.stream.on('data', function (chunk) {
            if (outstreamOpen) {
                outStream.write(chunk);
                outstreamLength += chunk.length;
                if (outstreamLength > imageFragmentSize) { // file size over limit
                    outStream.end();
                    outstreamOpen = false;
                    cb(null, {
                        path: path,
                        size: outStream.bytesWritten
                    })
                }
            }
        }).on('end', function () {
            if (outstreamOpen) {
                outStream.end();
                cb(null, {
                    path: path,
                    size: outStream.bytesWritten
                })
            }
        });
        outStream.on('error', cb);
    })
}

UploadStorage.prototype._removeFile = function _removeFile (req, uploadFile, cb) {
    fs.unlink(uploadFile.path, cb)
}

module.exports = function (opts) {
    return new UploadStorage(opts)
}
