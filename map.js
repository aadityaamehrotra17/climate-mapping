// Initialize the map(s)
var map = L.map('map', {
    center: [45.519292, 11.338594],
    zoom: 6,
    maxBounds: L.latLngBounds([-90, -180], [90, 180]),
    maxBoundsViscosity: 1.0
});
var defaultMap = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    minZoom: 2,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
})
var stadiaMap = L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_terrain_background/{z}/{x}/{y}@2x.png', {
    maxZoom: 18,
    minZoom: 2,
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> contributors'
}).addTo(map);
var esriMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Source: USGS, Esri, TANA, DeLorme, and NPS',
	maxZoom: 9,
    minZoom: 2
});
var shadedRelief = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Source: Esri',
	maxZoom: 13,
    minZoom: 2
});
defaultMap.addTo(map);
map.removeLayer(defaultMap);
stadiaMap.addTo(map);
map.removeLayer(stadiaMap);
esriMap.addTo(map);
map.removeLayer(esriMap);
shadedRelief.addTo(map);
map.removeLayer(shadedRelief);
defaultMap.addTo(map);

// Assign CSS classes more effectively
function assignTileClass(mapLayer, className) {
    mapLayer.on('load', function() {
        document.querySelectorAll('.leaflet-tile-container').forEach(container => {
            container.classList.add(className);
        });
    });
}

assignTileClass(defaultMap, 'default-map');
assignTileClass(stadiaMap, 'stadia-map');
assignTileClass(esriMap, 'esri-map');
assignTileClass(shadedRelief, 'shaded-relief');

// Initialize variables
let currentBasemap = 'default';
let torchOn = false;
let circleScalingFactor = 300;
let exploreOn = false;
const dropdownYears = [1896, 1899, 1900, 1901, 1902, 1903, 1904, 1912];
let isScrolling = false;
let scrollTimeout = null;

// Basemap toggle button
var toggleButton = L.control({position: 'bottomleft'});
toggleButton.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'toggle-button');
    div.innerHTML = '<button id="basemapToggle" class="default-button"><i class="fa fa-map"></i></button>';
    return div;
};
toggleButton.addTo(map);

// Legend stuff
var legendControl = L.control({ position: 'bottomright' });
legendControl.onAdd = function(map) {
    var div = L.DomUtil.create('div');
    div.id = 'cannonsLegend';
    div.innerHTML = `
        <div style="display: flex; align-items: center; margin-bottom: 6px;">
            <span style="
                display: inline-block;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background: #f03;
                border: 2px solid red;
                margin-right: 8px;
            "></span>
            <span>Cannon Count Known</span>
        </div>
        <div style="display: flex; align-items: center;">
            <span style="
                display: inline-block;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background: lightgrey;
                border: 2px solid black;
                margin-right: 8px;
            "></span>
            <span>Cannon Count Unknown</span>
        </div>
    `;
    return div;
};
legendControl.addTo(map);

function showCannonsLegend(show) {
    const cLegend = document.getElementById('cannonsLegend');
    if (cLegend) {
        cLegend.style.display = show ? 'block' : 'none'; // Show or hide the legend
    }
}

// Explore stuff
function explorefunc() {
    if (!exploreOn) {
        exploreOn = true;
        document.getElementById('exploreButton').style.backgroundColor = 'lightgreen';
        document.getElementById('text-column-id').style.display = 'none';
        document.getElementById('map-column-id').style.width = '100%';
        map.invalidateSize();
        
        createYearDropdown();
    } else {
        exploreOn = false;
        document.getElementById('yearDropdownContainer').style.display = 'none';
        document.getElementById('exploreButton').style.backgroundColor = 'white';
        document.getElementById('text-column-id').style.display = 'block';
        document.getElementById('map-column-id').style.width = '70%';
        map.invalidateSize();
    }
}

var exploreControl = L.control({ position: 'topleft' });
exploreControl.onAdd = function(map) {
    var div = L.DomUtil.create('div');
    div.id = 'explore-control';
    div.innerHTML = `<button id="exploreButton"><i class="fa fa-compass"></i></button>`;
    div.style.display = 'none'; // Start hidden
    return div;
};
exploreControl.addTo(map);

document.addEventListener('DOMContentLoaded', function() {
    const exploreButton = document.getElementById('exploreButton');
    if (exploreButton) {
        exploreButton.addEventListener('click', explorefunc);
    }
});

function showExploreControl(show) {
    const eControl = document.getElementById('explore-control');
    if (eControl) {
        eControl.style.display = show ? 'block' : 'none'; // Show or hide the control
    }
}

// Cannons Label
var labelControl = L.control({ position: 'topleft' });
labelControl.onAdd = function(map) {
    var div = L.DomUtil.create('div');
    div.id = 'yearlabel';
    div.innerHTML = '';
    return div;
};
labelControl.addTo(map);

// Dropdown for years
var yearDropdownControl = L.control({ position: 'topleft' });
yearDropdownControl.onAdd = function(map) {
    var div = L.DomUtil.create('div');
    div.id = 'yearDropdownContainer';
    div.innerHTML = '<select id="yearDropdown"></select>';
    div.style.display = 'none'; // Start hidden
    return div;
};
yearDropdownControl.addTo(map);

dropdownYears.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        document.getElementById('yearDropdown').appendChild(option);
    });

function showYearLabel(year) {
    const label = document.getElementById('yearlabel');
    if (label) {
        label.innerHTML = ''; // Clear previous text
        if (year && year.trim() !== '') {
            label.innerHTML = `Year: ${year.trim()}`;
            label.style.display = 'block';
        } else {
            label.style.display = 'none';
        }
    }
}

function createYearDropdown() {
    const select = document.getElementById('yearDropdown');
    document.getElementById('yearDropdownContainer').style.display = 'block';

    const label = document.getElementById('yearlabel');
    if (label && label.textContent) {
        const match = label.textContent.match(/(\d{4})/);
        if (match) {
            select.value = match[1];
        }
    }

    select.addEventListener('change', function() {
        window.displayCannonsByYear(window.cannonsNew, this.value);
        window.displayMissingCannonsByYear(window.cannonsAdjusted, this.value);
    });
}

// Fix mapSwitch function logic for clear transition between maps
function mapSwitch() {
    if (currentBasemap === 'default') {
        map.removeLayer(defaultMap);
        stadiaMap.addTo(map);
        currentBasemap = 'stadia';
        document.getElementById('basemapToggle').classList.remove('default-button');
        document.getElementById('basemapToggle').classList.add('stadia-button');
    } else if (currentBasemap === 'stadia') {
        map.removeLayer(stadiaMap);
        esriMap.addTo(map);
        currentBasemap = 'esri';
        document.getElementById('basemapToggle').classList.remove('stadia-button');
        document.getElementById('basemapToggle').classList.add('esri-button');
    } else if (currentBasemap === 'esri') {
        map.removeLayer(esriMap);
        shadedRelief.addTo(map);
        currentBasemap = 'shadedRelief';
        document.getElementById('basemapToggle').classList.remove('esri-button');
        document.getElementById('basemapToggle').classList.add('shaded-button');
    } else {
        map.removeLayer(shadedRelief);
        defaultMap.addTo(map);
        currentBasemap = 'default';
        document.getElementById('basemapToggle').classList.remove('shaded-button');
        document.getElementById('basemapToggle').classList.add('default-button');
    }
}

document.getElementById('basemapToggle').addEventListener('click', mapSwitch);
document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('keydown', function(event) {
        if (event.keyCode === 77) { // M key
            mapSwitch();
        }
    });
});

let circleLayers = [];
let cannonsList = [];
let missingCannonsList = [];
let cannonsSetNew = false;
let cannonsSetMissing = false;

// Function to fly to location and remove layers
function flyToAndClear(coords, zoom) {
    map.flyTo(coords, zoom);
    showYearLabel('');
    showCannonsLegend(false);
    showExploreControl(false);
    if (cannonsSetNew) {
        cannonsList.forEach(layer => map.removeLayer(layer));
        cannonsList = [];
        cannonsSetNew = false;
    }
    if (cannonsSetMissing) {
        missingCannonsList.forEach(layer => map.removeLayer(layer));
        missingCannonsList = [];
        cannonsSetMissing = false;
    }
}

fetch('cannons-new.json')
    .then(response => response.json())
    .then(cannonsNew => {
        window.cannonsNew = cannonsNew;

        const latitudes = cannonsNew["Latitude"];
        const longitudes = cannonsNew["Longitude"];
        const placeNames = cannonsNew["Place name"];
            
        function displayCannonsByYear(cannonsNew, year) {
            cannonsList.forEach(layer => map.removeLayer(layer));
            cannonsList = [];

            const cannonsForYear = cannonsNew[`Cannons in ${year}`];

            if (!cannonsForYear) {
                cannonsSetNew = false;
                return;
            }

            Object.keys(cannonsForYear).forEach(idx => {
                const numCannons = cannonsForYear[idx];
                if (numCannons !== null && !isNaN(numCannons)) {
                    const lat = latitudes[idx];
                    const lng = parseFloat(longitudes[idx]);
                    const place = placeNames[idx];
                    
                    if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
                        const circle = L.circle([lat, lng], {
                            radius: Math.pow(numCannons, 0.57) * circleScalingFactor, // radius here
                            fillColor: '#f03',
                            color: 'red',
                            weight: 2,
                            opacity: 1,
                            fillOpacity: 0.7
                        }).addTo(map);
                        
                        if (numCannons == 1) {
                            circle.bindPopup(`${place}: ${numCannons} cannon in ${year}`);
                        } else {
                            circle.bindPopup(`${place}: ${numCannons} cannons in ${year}`);
                        }
                        cannonsList.push(circle);
                    }
                }
            });

            cannonsSetNew = true;
        }
        window.displayCannonsByYear = displayCannonsByYear;
    

        document.getElementById('text').addEventListener('click', function(event) {
            if (event.target.id === 'link-3-2') {
                flyToAndClear([45.4384, 10.9917], 7.3);
                displayCannonsByYear(cannonsNew, 1899);
            }
        });
        document.getElementById('text').addEventListener('mouseover', function(event) {
            if (isScrolling) return;
            if (event.target.id === 'link-3-2-1') {
                flyToAndClear([45.4384, 10.9917], 7.3);
                displayCannonsByYear(cannonsNew, 1899);
            }
        });
        document.getElementById('text').addEventListener('mouseover', function(event) {
            if (isScrolling) return;
            if (event.target.id === 'link-3-2-2') {
                flyToAndClear([45.4384, 10.9917], 7.3);
                displayCannonsByYear(cannonsNew, 1899);
            }
        });
        document.getElementById('text').addEventListener('click', function(event) {
            if (event.target.id === 'link-3-3') {
                flyToAndClear([42.35, 13.4], 6);
                displayCannonsByYear(cannonsNew, 1900);
            }
        });
        document.getElementById('text').addEventListener('click', function(event) {
            if (event.target.id === 'link-3-4') {
                flyToAndClear([46.051389, 14.506111], 6);
                displayCannonsByYear(cannonsNew, 1900);
            }
        });
        document.getElementById('text').addEventListener('mouseover', function(event) {
            if (isScrolling) return;
            if (event.target.id === 'link-3-4-1') {
                flyToAndClear([46.051389, 14.506111], 6);
                displayCannonsByYear(cannonsNew, 1900);
            }
        });
        document.getElementById('text').addEventListener('mouseover', function(event) {
            if (isScrolling) return;
            if (event.target.id === 'link-3-4-2') {
                flyToAndClear([46.051389, 14.506111], 6);
                displayCannonsByYear(cannonsNew, 1900);
            }
        });
        document.getElementById('text').addEventListener('click', function(event) {
            if (event.target.id === 'link-3-5') {
                flyToAndClear([46.9933, 3.1572], 6.25);
                displayCannonsByYear(cannonsNew, 1900);
            }
        });
        document.getElementById('text').addEventListener('click', function(event) {
            if (event.target.id === 'link-3-6') {
                flyToAndClear([45.4384, 10.9917], 6.5);
                displayCannonsByYear(cannonsNew, 1900);
            }
        });
        document.getElementById('text').addEventListener('mouseover', function(event) {
            if (isScrolling) return;
            if (event.target.id === 'link-3-6-1') {
                flyToAndClear([45.4384, 10.9917], 6.5);
                displayCannonsByYear(cannonsNew, 1900);
            }
        });
        document.getElementById('text').addEventListener('click', function(event) {
            if (event.target.id === 'link-3-7') {
                flyToAndClear([40.826111, -3.538889], 6.3);
                displayCannonsByYear(cannonsNew, 1901); // only other data is 1904?
            }
        });
        document.getElementById('text').addEventListener('click', function(event) {
            if (event.target.id === 'link-3-8') {
                flyToAndClear([45, 41.116667], 6);
                displayCannonsByYear(cannonsNew, 1901);
            }
        });
        document.getElementById('text').addEventListener('mouseover', function(event) {
            if (isScrolling) return;
            if (event.target.id === 'link-3-8-1') {
                flyToAndClear([45, 41.116667], 6);
                displayCannonsByYear(cannonsNew, 1901);
            }
        });
        document.getElementById('text').addEventListener('mouseover', function(event) {
            if (isScrolling) return;
            if (event.target.id === 'link-3-8-2') {
                flyToAndClear([45, 41.116667], 6);
                displayCannonsByYear(cannonsNew, 1901);
            }
        });
        document.getElementById('text').addEventListener('click', function(event) {
            if (event.target.id === 'link-3-9') {
                flyToAndClear([45.4384, 10.9917], 5);
                displayCannonsByYear(cannonsNew, 1901);
            }
        });
        document.getElementById('text').addEventListener('mouseover', function(event) {
            if (isScrolling) return;
            if (event.target.id === 'link-3-9-1') {
                flyToAndClear([45.4384, 10.9917], 5);
                displayCannonsByYear(cannonsNew, 1901);
            }
        });
        document.getElementById('text').addEventListener('mouseover', function(event) {
            if (isScrolling) return;
            if (event.target.id === 'link-3-9-2') {
                flyToAndClear([45.4384, 10.9917], 5);
                displayCannonsByYear(cannonsNew, 1901);
            }
        });
        document.getElementById('text').addEventListener('mouseover', function(event) {
            if (isScrolling) return;
            if (event.target.id === 'link-3-9-3') {
                flyToAndClear([45.4384, 10.9917], 5);
                displayCannonsByYear(cannonsNew, 1901);
            }
        });
        document.getElementById('text').addEventListener('click', function(event) {
            if (event.target.id === 'link-3-10') {
                flyToAndClear([47.130833, 11.453056], 6);
                displayCannonsByYear(cannonsNew, 1902);
            }
        });
        document.getElementById('text').addEventListener('mouseover', function(event) {
            if (isScrolling) return;
            if (event.target.id === 'link-3-10-1') {
                flyToAndClear([47.130833, 11.453056], 6);
                displayCannonsByYear(cannonsNew, 1902);
            }
        });
        document.getElementById('text').addEventListener('mouseover', function(event) {
            if (isScrolling) return;
            if (event.target.id === 'link-3-10-2') {
                flyToAndClear([47.130833, 11.453056], 6);
                displayCannonsByYear(cannonsNew, 1902);
            }
        });
        document.getElementById('text').addEventListener('click', function(event) {
            if (event.target.id === 'link-3-11') {
                flyToAndClear([45.116667, 10.533333], 7.25);
                displayCannonsByYear(cannonsNew, 1903);
            }
        });
        document.getElementById('text').addEventListener('click', function(event) {
            if (event.target.id === 'link-3-11-1') {
                flyToAndClear([45.116667, 10.533333], 7.25);
                displayCannonsByYear(cannonsNew, 1904); //
            }
        });
        document.getElementById('text').addEventListener('click', function(event) {
            if (event.target.id === 'link-3-12') {
                flyToAndClear([45.4384, 12.9917], 5);
                displayCannonsByYear(cannonsNew, 1904);
            }
        });
    });

//-----------------------------------

fetch('cannons-adjusted.json')
    .then(response => response.json())
    .then(cannonsAdjusted => {
        window.cannonsAdjusted = cannonsAdjusted;

        function displayMissingCannonsByYear(cannonsAdjusted, year) {
            missingCannonsList.forEach(layer => map.removeLayer(layer));
            missingCannonsList = [];

            Object.values(cannonsAdjusted).forEach(entry => {
                const yearsArr = [];
                for (let i = parseFloat(entry["Earliest Year"]); i <= parseFloat(entry["Latest Year"]); i++) {
                    yearsArr.push(i);
                }
                const hasYear = yearsArr.includes(Number(year));

                const cannonsField = `Cannons in ${year}`;
                const cannonsValue = entry.hasOwnProperty(cannonsField) ? entry[cannonsField] : undefined;
                const isMissingOrNull = cannonsValue === undefined || cannonsValue === null;

                if (hasYear && isMissingOrNull) {
                    const lat = parseFloat(entry["Latitude"]);
                    const lng = parseFloat(entry["Longitude"]);
                    const place = entry["Place name"] || "Unknown location";

                    if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
                        const circle = L.circle([lat, lng], {
                            radius: 10 * circleScalingFactor,
                            fillColor: 'lightgrey',
                            color: 'black',
                            weight: 2,
                            opacity: 1,
                            fillOpacity: 0.5
                        }).addTo(map);

                        circle.bindPopup(`${place}: cannons present in ${year}, number unknown.`);
                        missingCannonsList.push(circle);
                    }
                }
            });
            cannonsSetMissing = true;
            showYearLabel(`${year}`);
            showCannonsLegend(true);
            showExploreControl(true);
        }
        window.displayMissingCannonsByYear = displayMissingCannonsByYear;

        document.getElementById('text').addEventListener('click', function(event) {
            if (event.target.id === 'link-3-1') {
                flyToAndClear([46.3928, 15.5744], 5);
                displayMissingCannonsByYear(cannonsAdjusted, 1896);
            }
        });
        document.getElementById('text').addEventListener('click', function(event) {
            if (event.target.id === 'link-3-2') {
                displayMissingCannonsByYear(cannonsAdjusted, 1899);
            }
        });
        document.getElementById('text').addEventListener('mouseover', function(event) {
            if (isScrolling) return;
            if (event.target.id === 'link-3-2-1') {
                displayMissingCannonsByYear(cannonsAdjusted, 1899);
            }
        });
        document.getElementById('text').addEventListener('mouseover', function(event) {
            if (isScrolling) return;
            if (event.target.id === 'link-3-2-2') {
                displayMissingCannonsByYear(cannonsAdjusted, 1899);
            }
        });
        document.getElementById('text').addEventListener('click', function(event) {
            if (event.target.id === 'link-3-3') {
                displayMissingCannonsByYear(cannonsAdjusted, 1900);
            }
        });
        document.getElementById('text').addEventListener('click', function(event) {
            if (event.target.id === 'link-3-4') {
                displayMissingCannonsByYear(cannonsAdjusted, 1900);
            }
        });
        document.getElementById('text').addEventListener('mouseover', function(event) {
            if (isScrolling) return;
            if (event.target.id === 'link-3-4-1') {
                displayMissingCannonsByYear(cannonsAdjusted, 1900);
            }
        });
        document.getElementById('text').addEventListener('mouseover', function(event) {
            if (isScrolling) return;
            if (event.target.id === 'link-3-4-2') {
                displayMissingCannonsByYear(cannonsAdjusted, 1900);
            }
        });
        document.getElementById('text').addEventListener('click', function(event) {
            if (event.target.id === 'link-3-5') {
                displayMissingCannonsByYear(cannonsAdjusted, 1900);
            }
        });
        document.getElementById('text').addEventListener('click', function(event) {
            if (event.target.id === 'link-3-6') {
                displayMissingCannonsByYear(cannonsAdjusted, 1900);
            }
        });
        document.getElementById('text').addEventListener('mouseover', function(event) {
            if (isScrolling) return;
            if (event.target.id === 'link-3-6-1') {
                displayMissingCannonsByYear(cannonsAdjusted, 1900);
            }
        });
        document.getElementById('text').addEventListener('click', function(event) {
            if (event.target.id === 'link-3-7') {
                displayMissingCannonsByYear(cannonsAdjusted, 1901); // only other data is 1904?
            }
        });
        document.getElementById('text').addEventListener('click', function(event) {
            if (event.target.id === 'link-3-8') {
                displayMissingCannonsByYear(cannonsAdjusted, 1901);
            }
        });
        document.getElementById('text').addEventListener('mouseover', function(event) {
            if (isScrolling) return;
            if (event.target.id === 'link-3-8-1') {
                displayMissingCannonsByYear(cannonsAdjusted, 1901);
            }
        });
        document.getElementById('text').addEventListener('mouseover', function(event) {
            if (isScrolling) return;
            if (event.target.id === 'link-3-8-2') {
                displayMissingCannonsByYear(cannonsAdjusted, 1901);
            }
        });
        document.getElementById('text').addEventListener('click', function(event) {
            if (event.target.id === 'link-3-9') {
                displayMissingCannonsByYear(cannonsAdjusted, 1901);
            }
        });
        document.getElementById('text').addEventListener('mouseover', function(event) {
            if (isScrolling) return;
            if (event.target.id === 'link-3-9-1') {
                displayMissingCannonsByYear(cannonsAdjusted, 1901);
            }
        });
        document.getElementById('text').addEventListener('mouseover', function(event) {
            if (isScrolling) return;
            if (event.target.id === 'link-3-9-2') {
                displayMissingCannonsByYear(cannonsAdjusted, 1901);
            }
        });
        document.getElementById('text').addEventListener('mouseover', function(event) {
            if (isScrolling) return;
            if (event.target.id === 'link-3-9-3') {
                displayMissingCannonsByYear(cannonsAdjusted, 1901);
            }
        });
        document.getElementById('text').addEventListener('click', function(event) {
            if (event.target.id === 'link-3-10') {
                displayMissingCannonsByYear(cannonsAdjusted, 1902);
            }
        });
        document.getElementById('text').addEventListener('mouseover', function(event) {
            if (isScrolling) return;
            if (event.target.id === 'link-3-10-1') {
                displayMissingCannonsByYear(cannonsAdjusted, 1902);
            }
        });
        document.getElementById('text').addEventListener('mouseover', function(event) {
            if (isScrolling) return;
            if (event.target.id === 'link-3-10-2') {
                displayMissingCannonsByYear(cannonsAdjusted, 1902);
            }
        });
        document.getElementById('text').addEventListener('click', function(event) {
            if (event.target.id === 'link-3-11') {
                displayMissingCannonsByYear(cannonsAdjusted, 1903);
            }
        });
        document.getElementById('text').addEventListener('click', function(event) {
            if (event.target.id === 'link-3-11-1') {
                displayMissingCannonsByYear(cannonsAdjusted, 1904); //
            }
        });
        document.getElementById('text').addEventListener('click', function(event) {
            if (event.target.id === 'link-3-12') {
                displayMissingCannonsByYear(cannonsAdjusted, 1904);
            }
        });
        document.getElementById('text').addEventListener('click', function(event) {
            if (event.target.id === 'link-3-13') {
                flyToAndClear([46.2276, 2.2137], 6.25)
                displayMissingCannonsByYear(cannonsAdjusted, 1912);
            }
        });
    });

document.getElementById('text').addEventListener('scroll', function() {
    isScrolling = true;
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(function() {
        isScrolling = false;
    }, 250);
});

// Torch effect
function showTorchAtLatLng(lat, lng) {
    if (torchOn) return;

    var torch = document.getElementById('torch');
    var mapContainer = document.getElementById('map');

    // Convert lat/lng to container point (pixel coordinates)
    const point = map.latLngToContainerPoint([lat, lng]);
    const torchWidth = torch.offsetWidth;
    const torchHeight = torch.offsetHeight;
    const mapRect = mapContainer.getBoundingClientRect();

    // Center the torch at the point
    const newLeft = Math.min(Math.max(0, point.x - torchWidth / 2), mapRect.width - torchWidth);
    const newTop = Math.min(Math.max(0, point.y - torchHeight / 2), mapRect.height - torchHeight);

    torch.style.left = `${newLeft}px`;
    torch.style.top = `${newTop}px`;
    torch.style.zIndex = '10000';
    torch.style.opacity = '1';
    torchOn = true;
}

function hideTorch() {
    if (!torchOn) return;

    var torch = document.getElementById('torch');

    torch.style.zIndex = '-10000';
    torch.style.opacity = '0';
    torchOn = false;
}

document.getElementById('text').addEventListener('mouseover', function(event) {
    if (isScrolling) return;

    if (event.target.id === 'link-3-2-1') {
        map.once('moveend', function() {
            showTorchAtLatLng(45.5218, 11.3355);
        });
    }
    if (event.target.id === 'link-3-2-2') {
        map.once('moveend', function() {
            showTorchAtLatLng(45.1291, 8.4507);
        });
    }
    if (event.target.id === 'link-3-4-1') {
        map.once('moveend', function() {
            showTorchAtLatLng(46.393, 15.574);
        });
    }
    if (event.target.id === 'link-3-4-2') {
        map.once('moveend', function() {
            showTorchAtLatLng(48.5626, 16.0787);
        });
    }
    if (event.target.id === 'link-3-6-1') {
        map.once('moveend', function() {
            showTorchAtLatLng(45.4105, 11.8782);
        });
    }
    if (event.target.id === 'link-3-8-1') {
        map.once('moveend', function() {
            showTorchAtLatLng(42.0427, 45.5063);
        });
    }
    if (event.target.id === 'link-3-8-2') {
        map.once('moveend', function() {
            showTorchAtLatLng(45.0578, 34.6051);
        });
    }
    if (event.target.id === 'link-3-9-1') {
        map.once('moveend', function() {
            showTorchAtLatLng(45.7640, 4.8357);
        });
    }
    if (event.target.id === 'link-3-9-2') {
        map.once('moveend', function() {
            showTorchAtLatLng(45.1291, 8.4507);
        });
    }
    if (event.target.id === 'link-3-9-3') {
        map.once('moveend', function() {
            showTorchAtLatLng(44.6444, 7.4927);
        });
    }
    if (event.target.id === 'link-3-10-1') {
        map.once('moveend', function() {
            showTorchAtLatLng(47.0679, 15.4417);
        });
    }
    if (event.target.id === 'link-3-10-2') {
        map.once('moveend', function() {
            showTorchAtLatLng(46.3928, 15.5744);
        });
    }
});

document.getElementById('text').addEventListener('mouseout', function(event) {
    if (event.target.id === 'link-3-2-1') {
        hideTorch();
    }
    if (event.target.id === 'link-3-2-2') {
        hideTorch();
    }
    if (event.target.id === 'link-3-4-1') {
        hideTorch();
    }
    if (event.target.id === 'link-3-4-2') {
        hideTorch();
    }
    if (event.target.id === 'link-3-6-1') {
        hideTorch();
    }
    if (event.target.id === 'link-3-8-1') {
        hideTorch();
    }
    if (event.target.id === 'link-3-8-2') {
        hideTorch();
    }
    if (event.target.id === 'link-3-9-1') {
        hideTorch();
    }
    if (event.target.id === 'link-3-9-2') {
        hideTorch();
    }
    if (event.target.id === 'link-3-9-3') {
        hideTorch();
    }
    if (event.target.id === 'link-3-10-1') {
        hideTorch();
    }
    if (event.target.id === 'link-3-10-2') {
        hideTorch();
    }
});
