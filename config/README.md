# Configurations

## appconfig.json

This file configures the application as a whole.

```
{
	"app" : {
		"localImageDir" : ... the local path of the directory for saving the images files,
		"webserverImageDir" : ... the relative path of this director for the web server, like "/testimages/",
		"uploadDir" : "... the relative path for this directory for the Node.js application, like "./public/testimages/",
		"defaultimageFname" : ... the file name of the default image (in the image directory!),
		"defaultimageLabel": ... a free-text name of the default image, shown on the web pages of this app,
		"localLogFpath" : ... path and filename of the log file for this app,
		"logLevel" : ... level for the logs,
		"minMetadataHeaderSize": ... size of the to-be-downloaded header section of the image file, in Bytes
	}
}
```

## pmdmatchingguide.yml

This file defines which properties should be included into the checking of the metadata. How this works is defined by a comment in the header of this file.
  
