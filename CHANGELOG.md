# Changelog of the Get IPTC Photo MetaData (PMD) app

(Latest changes at the top)

### Version 0.6.1

Files with the extension '.webp' can be processed.

### Version 0.6.0

Feature of showing metadata property labels in different languages added.

### Version 0.5.0

Design isearch1 added. It uses PMD properties with the "isearch1" tag in the output sub-property in  pmdinvestigationguide.yml. Further it uses a retrieved metadata property if the sub-property "schemaorgpropname" exists for a PMD property in the pmdinvestigationguide.yml and creates a set of schema.org metadata properties.
It shows the fourth variant of HTML designs, labeled as "Search engine fields". 

### Version 0.4.0

The parsing of the retrieved photo metadata in the ExifTool JSON format is completely rewritten. In previous versions it iterated across the photo metadata properties listed in in the pmdinvestigationguide.yml file and checked if a corresponding property exists in the ExifTool JSON object. Now it follows the ExifTool JSON object and checks if for a property found there has a corresponding entry in the pmdinvestigationguide.yml. The pmdinvestigationguide.yml content was restructured for this purpose, uses the groups topwithprefix, topnoprefix and instructure now.
   