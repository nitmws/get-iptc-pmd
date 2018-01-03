# Get IPTC Photo MetaData (PMD)

A web based system for retrieving embedded IPTC photo metadata from image files. 

Metadata fields may be embedded using IPTC's [IIM](https://iptc.org/standards/iim/), Adobe/ISO's [XMP](http://www.adobe.com/devnet/xmp.html) and CIPA's [Exif](http://www.cipa.jp/std/std-sec_e.html) format.

Metadata fields and their values are retrieved by Phil Harvey's [ExifTool](http://owl.phy.queensu.ca/~phil/exiftool/)

The retrieved metadata fields are sorted out and displayed as defined by the [IPTC Photo Metadata Standard](https://iptc.org/standards/photo-metadata/iptc-standard/) 

For the processing of an image either its web URL can be provided or it can be uploaded from a local computer.

For the display of the data three options are available:

* Grouped by technical format standards IIM, XMP and Exif
* Grouped by common topics of fields (General content, persons, locations, ..., rights, licence, administrative issues) as outlined in the IPTC Photo Metadata [User Guide](https://www.iptc.org/std/photometadata/documentation/userguide/)
* Comparing the IIM, XMP and Exif values of fields which can embedded in at least two of these technical formats

For the display of the labels these three options are available:

* The labels as defined by the IPTC Photo Metadata Standard.
* The field identifier as defined by the technical standards IIM, XMP and Exif.
* The field identifier as defined by exiftool

A test site of this project is available at [http://getiptcpmd.nitsvc.net](http://getiptcpmd.nitsvc.net)

## Special Features

* This system is not strictly bound to IPTC metadata; it can be adjusted to any set of metadata supported by exiftools. See more on that below.
* The core web service with its RESTful API can be used with any other user interface. See more on that below.
* The core web service keeps the required web traffic low: by a parameter in the appconfig.json file one can limit the size of the downloaded data. (Be aware: the metadata are located in the first section of an image file, downloading about 70 KByte from a 6 MByte image may be sufficient for retrieving them.)


## How to Make Use of This Project

This project is split into two major parts:

* The service: a Node.js/Express server with a RESTful API design (only read/GET is used). See files in /routes and /services.
* The user interface: the web page getiptcpmd.html in the /public folder (with stylesheets) for collecting user requests and transforming them into API calls. The templates in /views are required for the display of results of the get-iptc-pmd-service as HTML.

Using that framework the project can be adjusted to these purposes:

* Change what metadata fields are displayed: this is controlled by the data in the /config/pmdinvestigationguide.yml file. This file allows to modify the labels, e.g. they can be translated into another language.
* Change how results are displayed: currently two options for displaying the full results - grouped by technical standards and semantic topics - are implemented. This can be modified for specific needs: different groupings, different display of each field.
* Extending beyond IPTC Photo Metadata: in fact any metadata field supported by exiftool could be searched for and shown in the result. This would require additional or changed internal data structure (objects handing over results to the HTML templates) and therefore a deeper look into the Javascript code but is no big problem.
* The use of this project could be stripped down to accessing the API only and attaching a completely different user interface and an business logic (in the services) complying to it.
  
  