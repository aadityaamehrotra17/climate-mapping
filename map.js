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
defaultMap.addTo(map);
map.removeLayer(defaultMap);
stadiaMap.addTo(map);
map.removeLayer(stadiaMap);
esriMap.addTo(map);
map.removeLayer(esriMap);
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

// Initialize variables
let circleExists = false;
let circle, circlee;
let videoExists = false;
let spotlightExists = false;
let maskLayer;
let spotlight;
let captionBoolean = false;
let currentBasemap = 'default';
let torchOn = false;
let modalShow = false;
let homeModalShow = false;

// Additional layers
L.control.rainviewer({
    position: 'bottomleft',
    nextButtonText: '>',
    playStopButtonText: 'Play/Stop',
    prevButtonText: '<',
    positionSliderLabelText: "Hour:",
    opacitySliderLabelText: "Opacity:",
    animationInterval: 500,
    opacity: 0.7
}).addTo(map);
var toggleButton = L.control({position: 'bottomleft'});
toggleButton.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'toggle-button');
    div.innerHTML = '<button id="basemapToggle" class="default-button"><i class="fa fa-map"></i></button>';
    return div;
};
toggleButton.addTo(map);
var qButton = L.control({position: 'bottomright'});
qButton.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'q-button');
    div.innerHTML = '<button id="qButton"><i class="fa fa-question"></i></button>';
    return div;
};
qButton.addTo(map);

// james code
var mostRecentTime;
mostRecentTime = new Date(new Date().getTime() - 3600000).toISOString().slice(0, 16);
console.log("Most recent time:", mostRecentTime);

var lasttime = '2022-12-09T00:45';

// The time control part of the Eumestat widget
var TimeControl = L.Control.extend({
    onAdd: function(map) {
        var input = L.DomUtil.create('input');
        input.type = 'datetime-local';
        input.style = 'width: 250px;';
        input.max = mostRecentTime; 
        input.min = lasttime;
        input.value = mostRecentTime;
        input.onchange = function(e) {
            var newTime = e.target.value + ':00.000Z';
            mostRecentTime = e.target.value; // Update the global variable
            eumetsatRGBNaturalColour.setParams({time: newTime}, false);
        };
        return input;
    }
});

// add satalites to the map here
var eumetsatRGBNaturalColour = new L.tileLayer.wms(`https://view.eumetsat.int/geoserver/wms`, {
    layers: 'msg_fes:h60b',
    format: 'image/png',
    transparent: true,
    time: mostRecentTime + ':00.000Z',
    className: 'overlay-layer',
    minZoom: 2
});

var overlayMaps = {
    "Precipitation - Eumetsat": eumetsatRGBNaturalColour,
};


// CustomControl for the Eumetsat layers
var CustomControl = L.Control.extend({
    onAdd: function(map) {
        var container = L.DomUtil.create('div', 'leaflet-bar');
        L.DomEvent.disableClickPropagation(container);

        // Toggle Button
        var toggleBtn = L.DomUtil.create('a', 'leaflet-bar', container);
        toggleBtn.href = '#';
        toggleBtn.innerHTML = '☰';
        L.DomEvent.on(toggleBtn, 'click', L.DomEvent.stop).on(toggleBtn, 'click', function() {
            panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
        });

        // Control Panel
        var panel = L.DomUtil.create('div', 'control-panel', container);
        panel.style.display = 'none'; // Ensure it starts hidden

        // Panel Title
        var panelTitle = L.DomUtil.create('div', 'panel-title', panel);
        panelTitle.innerHTML = 'Eumetsat Precipitation';
        
        // Close Button
        var closeButton = L.DomUtil.create('a', 'close-button', panel);
        closeButton.innerHTML = '&times';
        closeButton.href = '#';
        closeButton.style.position = 'absolute';
        closeButton.style.top = '10px'; // Adjusted for better vertical alignment
        closeButton.style.right = '10px'; // Adjusted for better horizontal alignment
        closeButton.style.fontSize = '16px'; // Smaller font size for a more subtle button
        closeButton.style.lineHeight = '16px'; // Adjust line height to match font size for better alignment
        closeButton.style.width = '16px'; // Define a specific width
        closeButton.style.height = '16px'; // Define a specific height
        closeButton.style.textAlign = 'center'; // Ensure the '×' is centered
        closeButton.style.padding = '0'; // Remove padding to prevent increasing the widget size
        closeButton.style.margin = '0'; // Ensure no additional space is added around the button
        closeButton.style.border = '#fff';
        L.DomEvent.on(closeButton, 'click', L.DomEvent.stop).on(closeButton, 'click', function() {
            panel.style.display = 'none';
        });

        // Date-Time Picker 
        var timeControl = new TimeControl();
        panel.appendChild(timeControl.onAdd(map));

        // Overlay Layer Toggle Button
        var overlayToggleButton = L.DomUtil.create('button', 'overlay-toggle-button', panel);
        overlayToggleButton.innerHTML = "Enable";
        overlayToggleButton.style.width = '250px'; 
        overlayToggleButton.onclick = function() {
            if (this.classList.contains('active')) {
                this.classList.remove('active');
                this.innerHTML = "Enable";
                this.style.color = "green"
                // Logic to disable overlay
                Object.keys(overlayMaps).forEach(function(key) {
                    map.removeLayer(overlayMaps[key]);
                });
            } else {
                this.classList.add('active');
                this.innerHTML = "Disable";
                this.style.color = "red";
                // Logic to enable overlay
                Object.keys(overlayMaps).forEach(function(key) {
                    map.addLayer(overlayMaps[key]);
                    overlayMaps[key].bringToFront();
                });
            }
        };

        return container;
    }
});
map.addControl(new CustomControl({position: 'bottomleft'}));

// Modal
document.addEventListener('DOMContentLoaded', function() {
    if (!homeModalShow) {
        document.getElementById('home-modal').classList.add('modal-show');
        homeModalShow = true;
    }
    document.getElementById('qButton').addEventListener('click', function() {
        if (modalShow) {
            document.getElementById('modal').classList.remove('modal-show');
            modalShow = false;
        } else {
            document.getElementById('modal').classList.add('modal-show');
            modalShow = true;
        }
    });
    document.getElementById('close').addEventListener('click', function() {
        document.getElementById('modal').classList.remove('modal-show');
        modalShow = false;
    });
    document.getElementById('home-close').addEventListener('click', function() {
        document.getElementById('home-modal').classList.remove('modal-show');
        modalShow = false;
    });
    document.addEventListener('keydown', function(event) {
        if (event.keyCode === 27) {
            if (modalShow) {
                document.getElementById('modal').classList.remove('modal-show');
                modalShow = false;
            }
        }
    });
    document.addEventListener('keydown', function(event) {
        if (event.keyCode === 72) {
            if (!modalShow) {
                document.getElementById('modal').classList.add('modal-show');
                modalShow = true;
            }
        }
    });
});

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
    } else {
        map.removeLayer(esriMap);
        defaultMap.addTo(map);
        currentBasemap = 'default';
        document.getElementById('basemapToggle').classList.remove('esri-button');
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

// Function to fly to location and remove layers
function flyToAndClear(coords, zoom) {
    map.flyTo(coords, zoom);
    if (circleExists) {
        map.removeLayer(circle);
        circleExists = false;
    }
    if (cannonsSet) {
        circleLayers.forEach(layer => map.removeLayer(layer));
        circleLayers = [];
        cannonsSet = false;
    }
    if (cannonsSet2) {
        circleLayers.forEach(layer => map.removeLayer(layer));
        circleLayers = [];
        cannonsSet2 = false;
    }
    if (videoExists) {
        map.removeLayer(videoOverlay);
        videoExists = false;
    }
    if (spotlightExists) {
        map.removeLayer(maskLayer);
        map.removeLayer(spotlight);
        spotlightExists = false;
    }
    if (captionBoolean) {
        map.attributionControl.removeAttribution('hello');
        captionBoolean = false;
    }
}

// Event delegation for hyperlinks
document.getElementById('text').addEventListener('click', function(event) {
    if (event.target.id === 'link-1-1') {
        flyToAndClear([35.519292, 11.338594], 6);
        if (!circleExists) {
            circle = L.circle([35.519292, 11.338594], {
                color: 'red',
                fillColor: '#f03',
                fillOpacity: 0.5,
                radius: 50000
            }).addTo(map);
            circleExists = true;
        }
        if (!captionBoolean) {
            map.attributionControl.addAttribution('hello');
            captionBoolean = true;
        }
    }
});

// Generic function to handle simple button clicks
function handleButtonClick(id, coords, zoom) {
    document.getElementById(id).addEventListener('click', function() {
        flyToAndClear(coords, zoom);
        document.getElementById('progress-bar').style.width = '0%';
    });
}

// Setup event listeners for buttons
handleButtonClick('01', [45.519292, 11.338594], 8);
handleButtonClick('02', [45.4709699, 11.6014322], 15);
handleButtonClick('03', [45.442492, 11.584501], 15);
handleButtonClick('04', [46, 12], 9);
handleButtonClick('05', [41.315, -1.911], 4);
handleButtonClick('06', [41, -1], 5);
handleButtonClick('07', [45.519292, 11.338594], 15);

document.querySelectorAll('.menu a').forEach((menuLink, index) => {
    menuLink.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = `chapter-${index + 1}`; // Adjust this if your ID scheme is different
        const targetElement = document.getElementById(targetId);

        if (targetElement) {
            const container = document.querySelector('.text-container'); // Adjust the selector to your container
            const containerTop = container.getBoundingClientRect().top;
            const targetTop = targetElement.getBoundingClientRect().top;
            const scrollPosition = targetTop - containerTop + container.scrollTop;

            container.scrollTo({
                top: scrollPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Visualize cannons
import { cannons, cannons2 } from './cannons.js';

document.getElementById('link-04-1').addEventListener('click', function() {
    displayCannons(cannons, 'red');
});

document.getElementById('link-4-1').addEventListener('click', function() {
    displayCannons(cannons, 'red');
});

document.getElementById('link-4-2').addEventListener('click', function() {
    displayCannons(cannons2, 'blue');
});

let circleLayers = [];
let cannonsSet = false;
let cannonsSet2 = false;

function displayCannons(cannonsData, color) {
    // Remove existing cannon markers
    circleLayers.forEach(layer => map.removeLayer(layer));
    circleLayers = [];

    // Add new cannon markers
    const newLayers = L.geoJson(cannonsData, {
        pointToLayer: (feature, latlng) => createCircleMarker(feature, latlng, color),
        onEachFeature: onEachFeature
    }).addTo(map);

    circleLayers = newLayers.getLayers();

    cannonsSet = (color === 'red');
    cannonsSet2 = (color === 'blue');
}


function createCircleMarker(feature, latlng, color) {
    if (feature.properties && feature.properties.cannons) {
        const circle = L.circle(latlng, {
            radius: feature.properties.cannons * 30,
            fillColor: color === 'red' ? '#f03' : 'blue',
            color: color === 'red' ? 'red' : 'black',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.7
        });
        circleLayers.push(circle);
        return circle;
    }
}

function onEachFeature(feature, layer) {
    if (feature.properties && feature.properties.name && feature.properties.cannons) {
        const popupContent = `${feature.properties.name} has ${feature.properties.cannons} cannons`;
        layer.bindPopup(popupContent);
    }
}

// Video overlay handling
const videoUrls = [
    'https://dl.dropboxusercontent.com/s/a24ajx7d5gs86poxbfjkh/Video-1-1.mp4?rlkey=vtema9yxkss4twxy1mguscid8&st=ltvp6l0p', // Storm 1
    'https://dl.dropboxusercontent.com/s/e2dxcg321zqepe8v9mtvs/Video-2-1.mp4?rlkey=phnyek34c7i70gen7bw3js29j&st=flzwj5lk', // Storm 2
    'https://dl.dropboxusercontent.com/s/4qzqgeqd491mondd300hb/Video-3-1.mp4?rlkey=0q6c0joio9ne5enzeew97ua17&st=52mumyc0' // Storm 3
];
const coordinates = [
    [[55.921, 32.242], [34.665, -13.381]], // First set of coordinates
    [[55.921, 32.242], [34.665, -13.381]], // Second set of coordinates
    [[55.921, 32.242], [34.665, -13.381]]  // Third set of coordinates
];
let videoOverlay;

function displayVideo(index) {
    // Remove existing video overlay if it exists
    if (videoOverlay) {
        map.removeLayer(videoOverlay);
    }

    // Create new video overlay
    videoOverlay = L.videoOverlay(videoUrls[index], coordinates[index], {
        opacity: 0.7,
        interactive: true,
        autoplay: true,
        muted: true,
        playsInline: true
    }).addTo(map);
    videoExists = true;
}

document.getElementById('link-05-1').addEventListener('click', function() {
    displayVideo(0); // Display Storm 1 with first set of coordinates
});

document.getElementById('link-05-2').addEventListener('click', function() {
    displayVideo(1); // Display Storm 2 with second set of coordinates
});

document.getElementById('link-05-3').addEventListener('click', function() {
    displayVideo(2); // Display Storm 3 with third set of coordinates
});

// Spotlight effect
document.getElementById('06').addEventListener('click', function() {
    if (!spotlightExists) {
        map.createPane('maskPane');
        map.getPane('maskPane').style.zIndex = 450;
        maskLayer = L.rectangle([[-120, -240], [120, 240]], {
            color: "transparent",
            weight: 1,
            fillColor: "#000",
            fillOpacity: 0.3,
            interactive: false,
            pane: 'maskPane'
        }).addTo(map);
        map.createPane('spotlightPane');
        map.getPane('spotlightPane').style.zIndex = 460;
        spotlight = L.circle([41, -1], {
            radius: 1000000,
            color: "transparent",
            fillColor: "#fff",
            fillOpacity: 0.2,
            interactive: false,
            pane: 'spotlightPane'
        }).addTo(map);
        spotlight.bringToFront();
        spotlightExists = true;
    }
});

// Torch feature
function torchToggle() {
    var torch = document.getElementById('torch');
    var mapContainer = document.getElementById('map'); // Assuming your map container has the ID 'map'
    
    if (!torchOn) {
        torch.style.zIndex = '10000';
        torch.style.opacity = '1';
        torchOn = true;
        // Torch movement handler with bounding logic
        map.on('mousemove', function(e) {
            const point = map.latLngToContainerPoint(e.latlng);
            const torchWidth = torch.offsetWidth;
            const torchHeight = torch.offsetHeight;
            const mapRect = mapContainer.getBoundingClientRect();

            const newLeft = Math.min(Math.max(0, point.x - torchWidth / 2), mapRect.width - torchWidth);
            const newTop = Math.min(Math.max(0, point.y - torchHeight / 2), mapRect.height - torchHeight);

            torch.style.left = `${newLeft}px`;
            torch.style.top = `${newTop}px`;
        });

    } else {
        torch.style.zIndex = '-10000';
        torch.style.opacity = '0';
        torchOn = false;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('keydown', function(event) {
        if (event.keyCode === 84) {
            torchToggle();
        }
    });
});

document.addEventListener("DOMContentLoaded", function() {
    const textContainer = document.querySelector('.text-container');
    const progressBar = document.getElementById('progress-bar');
    const chapters = document.querySelectorAll('.chapter');
    const menuItems = document.querySelectorAll('.menu-link'); // Assuming menu items have the class 'menu-link'
    let lastClickedChapterIndex = -1; // Variable to keep track of the last clicked chapter index
    let isScrolling = false; // Variable to track if a scroll is in progress
    let scrollTimeout; // Timeout variable for debounce

    // Function to handle scroll event
    function handleScroll() {
        if (isScrolling) return; // Ignore scroll events if a scroll is in progress

        let currentChapter = null;
        let containerTop = textContainer.getBoundingClientRect().top;
        let containerBottom = textContainer.getBoundingClientRect().bottom;

        chapters.forEach((chapter, index) => {
            const chapterTop = chapter.getBoundingClientRect().top - containerTop;
            const chapterBottom = chapterTop + chapter.offsetHeight;

            if (chapterTop <= 0 && chapterBottom > 0) {
                currentChapter = chapter;

                // Simulate click on the corresponding menu item only if it's a different chapter
                if (index !== lastClickedChapterIndex && menuItems[index]) {
                    menuItems[index].click();
                    lastClickedChapterIndex = index; // Update the last clicked chapter index
                }
            }
        });

        if (currentChapter) {
            const chapterRect = currentChapter.getBoundingClientRect();
            const chapterHeight = chapterRect.height;
            let progress;

            if (currentChapter === chapters[chapters.length - 1]) {
                // Calculate progress based on the entire height of the last chapter
                const scrollPosition = containerBottom - chapterRect.top;
                progress = (scrollPosition / chapterHeight) * 100;

                // Ensure progress reaches 100% for the last chapter
                if (textContainer.scrollTop + textContainer.clientHeight >= textContainer.scrollHeight) {
                    progress = 100;
                }
            } else {
                // Calculate progress based on the top of the container for other chapters
                const scrollPosition = containerTop - chapterRect.top;
                progress = (scrollPosition / chapterHeight) * 100;
            }

            progressBar.style.width = Math.max(0, Math.min(100, progress)) + '%';
        } else {
            progressBar.style.width = '0%';
        }
    }

    // Debounce function to handle scroll end detection
    function debounceScrollEnd() {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            isScrolling = false;
        }, 100); // Adjust timeout duration as needed
    }

    // Attach scroll event listener
    textContainer.addEventListener('scroll', () => {
        handleScroll();
        debounceScrollEnd();
    });

    // Attach click event listeners to menu items
    menuItems.forEach((menuItem, index) => {
        menuItem.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent default link behavior
            isScrolling = true; // Set scrolling flag to true

            // Scroll to the corresponding chapter
            chapters[index].scrollIntoView({ behavior: 'smooth' });
        });
    });
});

// Scroll updates
document.addEventListener('DOMContentLoaded', () => {
    const menuOptions = ['01', '02', '03', '04', '05', '06', '07'];
    menuOptions.forEach(optionId => {
        setupMenuOption(optionId);
    });

    // Set up Intersection Observer for sections
    var par;
    if (window.innerWidth <= 1050) {
        par = 0.25;
    }
    else {
        par = 0.5;
    }
    const sections = document.querySelectorAll('.chapter .section');
    const options = {
        root: null,
        rootMargin: '0px',
        threshold: par // parameter value
    };
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const sectionId = entry.target.id;
                updateMap(sectionId);
            }
        });
    }, options);
    sections.forEach(section => {
        observer.observe(section);
    });

    // Fallback to handle missed intersections
    window.addEventListener('scroll', () => {
        let currentSection = null;
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
                currentSection = section;
            }
        });
        if (currentSection) {
            const sectionId = currentSection.id;
            updateMap(sectionId);
        }
    });
});

function setupMenuOption(optionId) {
    const menuOption = document.getElementById(optionId);
    if (menuOption) {
        menuOption.addEventListener('click', function() {
            // Scroll to the corresponding section
            const section = document.getElementById(`section-${optionId}`);
            if (section) {
                section.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
}

function updateMap(sectionId) {
    switch (sectionId) {
        case 'section-1-1':
            flyToAndClear([45.519292, 11.338594], 8);
            break;
        case 'section-1-2':
            flyToAndClear([45.519292, 11.338594], 10);
            break;
        case 'section-1-3':
            flyToAndClear([45.519292, 11.338594], 12);
            break;
        case 'section-1-4':
            flyToAndClear([45.519292, 11.338594], 14);
            break;
        case 'section-1-5':
            flyToAndClear([45.519292, 11.338594], 16);
            break;
        default:
            break;
    }
}
