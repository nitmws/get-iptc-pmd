# Changelog of the Get IPTC Photo MetaData (PMD) app

(Latest changes at the top)

### Version 0.6.3

(2021-02-06) Page with topical grouping: field labels got different backgrounds for IIM, XMP, Exif. Term "technical standard" changed to "technical format (standard)" to adjust to current IPTC terminology.

### Version 0.6.2

(2020-11) schema.org properties copyrightNotice and creditText added to pmdinvestigationguide. Visible on pmdresult_isearch1.pug

### Version 0.6.1

Files with the extension '.webp' can be processed.

### Version 0.6.0

(2020-10-19) Feature of showing metadata property labels in different languages added.

### Version 0.5.0

(2020-08-30) Design isearch1 added. It uses PMD properties with the "isearch1" tag in the output sub-property in  pmdinvestigationguide.yml. Further it uses a retrieved metadata property if the sub-property "schemaorgpropname" exists for a PMD property in the pmdinvestigationguide.yml and creates a set of schema.org metadata properties.
It shows the fourth variant of HTML designs, labeled as "Search engine fields". 

### Version 0.4.0

(2020-02-20) The parsing of the retrieved photo metadata in the ExifTool JSON format is completely rewritten. In previous versions it iterated across the photo metadata properties listed in in the pmdinvestigationguide.yml file and checked if a corresponding property exists in the ExifTool JSON object. Now it follows the ExifTool JSON object and checks if for a property found there has a corresponding entry in the pmdinvestigationguide.yml. The pmdinvestigationguide.yml content was restructured for this purpose, uses the groups topwithprefix, topnoprefix and instructure now.

### Version 0.3.0

(2020-01-02) major rewrite of the processimage service, rendered web pages show links to IPTC standard"

### Version 0.2.3

(2019-12-27) minor edits prior to a major rewrite of the processing of metadata

### Version 0.2.2

(2019-04-30) tools1/checkForExtension: improved testing of lastdot"

### Version 0.2.1

(2019-04-01) accessing config files got a path.join with __dir, appversion moved to config directory"

### Version 0.2.0

(2017-12-31) up/download of image files limited to about 70kBytes = faster

### Version 0.1.0

(2017-01-12) initial release of the project