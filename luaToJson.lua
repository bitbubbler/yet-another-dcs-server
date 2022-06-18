json = require "dkjson"

dofile([[../DCS-miscScripts/ObjectDB/everyObject.lua]]) 

print(json.encode(everyObject))