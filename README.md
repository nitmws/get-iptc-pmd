# Get IPTC Photo MetaData (PMD)

A web based system for retrieving embedded photo metadata from image files. 

Metadata fields may be embedded in IPTC's [IIM](https://iptc.org/standards/iim/), Adobe/ISO's [XMP](http://www.adobe.com/devnet/xmp.html) and CIPA's [Exif](http://www.cipa.jp/std/std-sec_e.html) format.

Metadata fields and their values are retrieved by Phil Harvey's [ExifTool](http://owl.phy.queensu.ca/~phil/exiftool/)

The retrieved metadata fields are sorted out and displayed as defined by the [IPTC Photo Metadata Standard](https://iptc.org/standards/photo-metadata/iptc-standard/) 

For the processing of an image either its web URL can be provided or it can be uploaded from a local computer.

For the display of the data three options are available:

* Grouped by technical format standards IIM, XMP and Exif
* Grouped by common topics of fields (General content, persons, locations, ..., rights, licence, administrative issues) as outlined in the IPTC Photo Metadata [User Guide](https://www.iptc.org/std/photometadata/documentation/userguide/)
* Comparing the IIM, XMP and Exif values of fields which can embedded in at least two of these technical formats
