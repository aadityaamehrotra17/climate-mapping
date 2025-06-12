const cannons_new = require('./cannons-new.json');
const fs = require('fs');

function removeNullEntries(obj) {
    return Object.fromEntries(
        Object.entries(obj).filter(([key, value]) => value !== null)
    );
}

// const cleaned = removeNullEntries(cannons_new["Longitude"]);

fs.writeFileSync('cleaned.json', JSON.stringify(cleaned, null, 2));