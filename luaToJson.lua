local json = require "dkjson"

dofile([[../DCS-miscScripts/ObjectDB/everyObject.lua]])

---@diagnostic disable-next-line: undefined-global
print(json.encode(everyObject))
