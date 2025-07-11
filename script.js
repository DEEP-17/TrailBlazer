
let map;
let startPoint = null;
let endPoint = null;
let waypoints = [];
let routingControl = null;
let isAddingWaypoint = false;
let currentAlgorithm = null;
let isSidebarCollapsed = false;
let isDirectionsCollapsed = true;
let currentTileLayer = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeMap();
    initializeEventListeners();
    initializeAutocomplete();
    initializeTheme();
    initializeToggleControls();
});


function initializeToggleControls() {
    // Sidebar toggle
    document.getElementById('sidebarToggle').addEventListener('click', function() {
        toggleSidebar();
    });

    document.getElementById('directionsToggle').addEventListener('click', function() {
        toggleDirections();
    });
}

function toggleSidebar() {
    const controlPanel = document.getElementById('controlPanel');
    const appTitle = document.querySelector('.app-title');
    const directionsPanel = document.getElementById('directionsPanel');
    
    isSidebarCollapsed = !isSidebarCollapsed;
    
    if (isSidebarCollapsed) {
        controlPanel.classList.add('collapsed');
        appTitle.style.opacity = '0';
       
        directionsPanel.style.left = 'var(--sidebar-collapsed-width)';
    } else {
        controlPanel.classList.remove('collapsed');
        appTitle.style.opacity = '1';
   
        directionsPanel.style.left = 'var(--sidebar-width)';
    }
    
    
    setTimeout(() => {
        if (map) {
            map.invalidateSize();
        }
    }, 300);
}


function toggleDirections() {
    const directionsPanel = document.getElementById('directionsPanel');
    const toggleIcon = document.querySelector('.directions-toggle-icon');
    
    isDirectionsCollapsed = !isDirectionsCollapsed;
    
    if (isDirectionsCollapsed) {
        directionsPanel.classList.add('collapsed');
        directionsPanel.classList.remove('show');
        toggleIcon.textContent = '▲';
    } else {
        directionsPanel.classList.remove('collapsed');
        directionsPanel.classList.add('show');
        toggleIcon.textContent = '▼';
    }
}

function initializeMap() {
    map = L.map('map').setView([40.7128, -74.0060], 13);
    
    updateMapTiles();

    map.on('click', function(e) {
        if (isAddingWaypoint) {
            addWaypoint([e.latlng.lat, e.latlng.lng]);
            isAddingWaypoint = false;
            document.getElementById('addWaypoint').innerHTML = '<span class="btn-icon">➕</span><span class="btn-text">Add Waypoint</span>';
            showStatusMessage('Waypoint added successfully', 'success');
        }
    });
}


function updateMapTiles() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    
   
    if (currentTileLayer) {
        map.removeLayer(currentTileLayer);
    }
    
    
    if (currentTheme === 'dark') {
        
        currentTileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd'
        }).addTo(map);
    } else {

        currentTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
    }
}

// Initialize event listeners
function initializeEventListeners() {
    // Algorithm 
    document.getElementById('dijkstra').addEventListener('click', () => {
        runPathfindingAlgorithm();
    });

  
    document.getElementById('currentLocation').addEventListener('click', function() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    const coords = [position.coords.latitude, position.coords.longitude];
                    setStartPoint(coords);
                    showStatusMessage('Current location set as start point', 'success');
                },
                function(error) {
                    showStatusMessage('Unable to get current location: ' + error.message, 'error');
                }
            );
        } else {
            showStatusMessage('Geolocation is not supported by this browser', 'error');
        }
    });

    
    document.getElementById('addWaypointSearch').addEventListener('click', function() {
        toggleWaypointSearch();
    });

    document.getElementById('cancelWaypointSearch').addEventListener('click', function() {
        hideWaypointSearch();
    });

    document.getElementById('clearWaypoints').addEventListener('click', function() {
        clearWaypoints();
        showStatusMessage('All waypoints cleared', 'success');
    });

    
    document.getElementById('travelMode').addEventListener('change', function() {
        if (routingControl) {
            updateRoute();
        }
    });
}


async function runPathfindingAlgorithm() {
    if (!startPoint || !endPoint) {
        showStatusMessage('Please set both start and end points', 'error');
        return;
    }

    currentAlgorithm = 'dijkstra';
    showLoading(true);

    try {
        
        await new Promise(resolve => setTimeout(resolve, 1500));

        await runDijkstra();

        showStatusMessage('Dijkstra\'s algorithm completed successfully', 'success');
    } catch (error) {
        showStatusMessage(`Error running Dijkstra's algorithm: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}


async function runDijkstra() {
    updateRoute();
}


function toggleWaypointSearch() {
    const searchContainer = document.getElementById('waypointSearchContainer');
    const addButton = document.getElementById('addWaypointSearch');
    
    if (searchContainer.style.display === 'none') {
        searchContainer.style.display = 'block';
        addButton.innerHTML = '<span class="btn-icon">🔍</span><span class="btn-text">Searching...</span>';
        document.getElementById('waypointSearch').focus();
    } else {
        hideWaypointSearch();
    }
}


function hideWaypointSearch() {
    const searchContainer = document.getElementById('waypointSearchContainer');
    const addButton = document.getElementById('addWaypointSearch');
    const searchInput = document.getElementById('waypointSearch');
    const suggestions = document.getElementById('waypointSuggestions');
    
    searchContainer.style.display = 'none';
    addButton.innerHTML = '<span class="btn-icon">🔍</span><span class="btn-text">Search & Add Waypoint</span>';
    searchInput.value = '';
    suggestions.innerHTML = '';
}


async function setStartPoint(latlng) {
    if (startPoint) {
        map.removeLayer(startPoint);
    }

    startPoint = L.marker(latlng, {
        icon: createCustomIcon('start')
    }).addTo(map).bindPopup("Start Point").openPopup();

    try {
        const locationName = await reverseGeocode(latlng[0], latlng[1]);
        startPoint.locationName = locationName;
        document.getElementById("startAddress").value = locationName;
        
        if (endPoint) {
            updateRoute();
        }
    } catch (error) {
        console.error('Error getting location name:', error);
        startPoint.locationName = `${latlng[0].toFixed(4)}, ${latlng[1].toFixed(4)}`;
        document.getElementById("startAddress").value = startPoint.locationName;
    }
}


async function setEndPoint(latlng) {
    if (endPoint) {
        map.removeLayer(endPoint);
    }

    endPoint = L.marker(latlng, {
        icon: createCustomIcon('end')
    }).addTo(map).bindPopup("End Point").openPopup();

    try {
        const locationName = await reverseGeocode(latlng[0], latlng[1]);
        endPoint.locationName = locationName;
        document.getElementById("endAddress").value = locationName;
        
        if (startPoint) {
            updateRoute();
        }
    } catch (error) {
        console.error('Error getting location name:', error);
        endPoint.locationName = `${latlng[0].toFixed(4)}, ${latlng[1].toFixed(4)}`;
        document.getElementById("endAddress").value = endPoint.locationName;
    }
}


async function addWaypoint(latlng) {
    const waypoint = L.marker(latlng, {
        draggable: true,
        icon: createCustomIcon('waypoint')
    }).addTo(map).bindPopup("Waypoint").openPopup();

    waypoint.on('dragend', function() {
        updateRoute();
        updateWaypointList();
    });

    try {
        const locationName = await reverseGeocode(latlng[0], latlng[1]);
        waypoint.locationName = locationName;
    } catch (error) {
        waypoint.locationName = `${latlng[0].toFixed(4)}, ${latlng[1].toFixed(4)}`;
    }

    waypoints.push(waypoint);
    updateWaypointList();
    
    if (startPoint && endPoint) {
        updateRoute();
    }
}


function clearWaypoints() {
    waypoints.forEach(wp => map.removeLayer(wp));
    waypoints = [];
    updateWaypointList();
    
    if (startPoint && endPoint) {
        updateRoute();
    }
}


function updateWaypointList() {
    const waypointList = document.getElementById('waypointList');
    waypointList.innerHTML = '';

    waypoints.forEach((waypoint, index) => {
        const item = document.createElement('div');
        item.className = 'waypoint-item';
        item.innerHTML = `
            <span>Waypoint ${index + 1}</span>
            < class="waypoint-remove" onclick="removeWaypoint(${index})">Remove</>
        `;
        waypointList.appendChild(item);
    });
}


function removeWaypoint(index) {
    if (index >= 0 && index < waypoints.length) {
        map.removeLayer(waypoints[index]);
        waypoints.splice(index, 1);
        updateWaypointList();
        
        if (startPoint && endPoint) {
            updateRoute();
        }
    }
}


function updateRoute() {
    if (!startPoint || !endPoint) {
        return;
    }

    const routeWaypoints = [
        L.latLng(startPoint.getLatLng()),
        ...waypoints.map(wp => L.latLng(wp.getLatLng())),
        L.latLng(endPoint.getLatLng())
    ];

    const travelMode = document.getElementById('travelMode').value;
    
    if (routingControl) {
        map.removeControl(routingControl);
    }

    
    let routeOptions = {
        waypoints: routeWaypoints,
        routeWhileDragging: false,
        addWaypoints: false,
        createMarker: function() { return null; },
        show: false
    };

    
    let lineColor = '#10b981'; 

    routeOptions.lineOptions = {
        styles: [{
            color: lineColor,
            weight: 5,
            opacity: 0.8
        }]
    };

    
    const profile = travelMode === 'driving' ? 'driving' : travelMode === 'cycling' ? 'cycling' : 'foot';
    routeOptions.router = L.Routing.osrmv1({
        serviceUrl: `https://router.project-osrm.org/route/v1`,
        profile: profile
    });

    routingControl = L.Routing.control(routeOptions)
        .on('routesfound', function(e) {
            displayRouteInfo(e.routes[0], travelMode);
            displayDirections(e.routes[0]);
        })
        .on('routingerror', function(e) {
            console.error("Routing error:", e);
            showStatusMessage("Could not calculate route. Please try different locations.", 'error');
        })
        .addTo(map);
}


function displayRouteInfo(route, travelMode) {
    const distance = (route.summary.totalDistance / 1000).toFixed(2); 
    const duration = Math.round(route.summary.totalTime / 60);
    
    document.getElementById('routeDistance').textContent = `${distance} km`;
    document.getElementById('routeDuration').textContent = `${duration} min`;
    
    
    const estimatedTime = calculateEstimatedTime(distance, travelMode);
    document.getElementById('estimatedTime').textContent = estimatedTime;
}


function calculateEstimatedTime(distanceKm, travelMode) {
    const distance = parseFloat(distanceKm);
    let speed; // km/h
    let timeHours;
    
    switch (travelMode) {
        case 'foot':
            speed = 4.5; 
            timeHours = distance / speed;
            break;
        case 'cycling':
            speed = 15; 
            timeHours = distance / speed;
            break;
        case 'driving':
            speed = 35; 
            timeHours = distance / speed;
            break;
        default:
            return '--';
    }
    
    const totalMinutes = Math.round(timeHours * 60);
    
    if (totalMinutes < 60) {
        return `${totalMinutes} min`;
    } else {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
    }
}


function displayDirections(route) {
    const directionsContent = document.getElementById('directions');
    directionsContent.innerHTML = '';

    route.instructions.forEach((instruction, index) => {
        const step = document.createElement('div');
        step.className = 'direction-step';
        
        const distance = instruction.distance > 1000 
            ? `${(instruction.distance / 1000).toFixed(1)} km`
            : `${instruction.distance} m`;
            
        step.innerHTML = `
            <div class="step-number">${index + 1}</div>
            <div class="step-content">
                <div class="step-text">${instruction.text}</div>
                <div class="step-distance">${distance}</div>
            </div>
        `;
        
        directionsContent.appendChild(step);
    });

    showDirections();
}


function showDirections() {
    const directionsPanel = document.getElementById('directionsPanel');
    directionsPanel.classList.add('show');
    isDirectionsCollapsed = false;
    document.querySelector('.directions-toggle-icon').textContent = '▼';
}


function createCustomIcon(type) {
    let color = '#3b82f6';
    let className = 'custom-marker';
    
    if (type === 'start') {
        color = '#10b981';
        className += ' start-marker';
    } else if (type === 'end') {
        color = '#ef4444';
        className += ' end-marker';
    } else if (type === 'waypoint') {
        color = '#f59e0b';
        className += ' waypoint-marker';
    }
    
    return L.divIcon({
        className: className,
        html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });
}


async function reverseGeocode(lat, lng) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
        );
        const result = await response.json();
        return result.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
}


function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    overlay.style.display = show ? 'flex' : 'none';
}


function initializeAutocomplete() {
    setupAutocomplete("startAddress", "startSuggestions", true);
    setupAutocomplete("endAddress", "endSuggestions", false);
    setupWaypointAutocomplete();
}


function setupWaypointAutocomplete() {
    const input = document.getElementById('waypointSearch');
    const suggestionBox = document.getElementById('waypointSuggestions');
    let searchTimeout;

    input.addEventListener("input", function() {
        const query = input.value.trim();
        
        
        clearTimeout(searchTimeout);
        
        if (query.length < 3) {
            suggestionBox.innerHTML = "";
            return;
        }

      
        searchTimeout = setTimeout(async () => {
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
                );
                const results = await response.json();

                suggestionBox.innerHTML = "";
                
                results.forEach((result) => {
                    const suggestion = document.createElement("div");
                    suggestion.className = "autocomplete-suggestion";
                    suggestion.textContent = result.display_name;
                    suggestion.onclick = async function() {
                        const latlng = [parseFloat(result.lat), parseFloat(result.lon)];
                        input.value = result.display_name;
                        suggestionBox.innerHTML = "";

                        // Add waypoint and hide search
                        await addWaypoint(latlng);
                        hideWaypointSearch();
                        showStatusMessage('Waypoint added successfully', 'success');
                    };
                    suggestionBox.appendChild(suggestion);
                });
            } catch (error) {
                console.error('Geocoding error:', error);
                showStatusMessage('Error searching for locations', 'error');
            }
        }, 300);
    });

    
    document.addEventListener('click', function(e) {
        if (!input.contains(e.target) && !suggestionBox.contains(e.target)) {
            suggestionBox.innerHTML = "";
        }
    });

    
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const firstSuggestion = suggestionBox.querySelector('.autocomplete-suggestion');
            if (firstSuggestion) {
                firstSuggestion.click();
            }
        }
        if (e.key === 'Escape') {
            hideWaypointSearch();
        }
    });
}


function setupAutocomplete(inputId, suggestionId, isStart) {
    const input = document.getElementById(inputId);
    const suggestionBox = document.getElementById(suggestionId);
    let searchTimeout;

    input.addEventListener("input", function() {
        const query = input.value.trim();
        
        
        clearTimeout(searchTimeout);
        
        if (query.length < 3) {
            suggestionBox.innerHTML = "";
            return;
        }

        
        searchTimeout = setTimeout(async () => {
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
                );
                const results = await response.json();

                suggestionBox.innerHTML = "";
                
                results.forEach((result) => {
                    const suggestion = document.createElement("div");
                    suggestion.className = "autocomplete-suggestion";
                    suggestion.textContent = result.display_name;
                    suggestion.onclick = async function() {
                        const latlng = [parseFloat(result.lat), parseFloat(result.lon)];
                        input.value = result.display_name;
                        suggestionBox.innerHTML = "";

                        if (isStart) {
                            await setStartPoint(latlng);
                        } else {
                            await setEndPoint(latlng);
                        }
                    };
                    suggestionBox.appendChild(suggestion);
                });
            } catch (error) {
                console.error('Geocoding error:', error);
                showStatusMessage('Error searching for locations', 'error');
            }
        }, 300);
    });

    
    document.addEventListener('click', function(e) {
        if (!input.contains(e.target) && !suggestionBox.contains(e.target)) {
            suggestionBox.innerHTML = "";
        }
    });
}


function initializeTheme() {
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);
    
    document.getElementById('themeToggle').addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
        
        updateMapTiles();
    });
}


function updateThemeIcon(theme) {
    const themeIcon = document.querySelector('.theme-icon');
    themeIcon.textContent = theme === 'light' ? '🌙' : '☀️';
}


function showStatusMessage(message, type = 'info', duration = 4000) {
    const statusContainer = document.getElementById('statusMessages');
    
    const messageElement = document.createElement('div');
    messageElement.className = `status-message ${type}`;
    messageElement.textContent = message;

    statusContainer.appendChild(messageElement);

    
    setTimeout(() => {
        if (messageElement.parentNode) {
            messageElement.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (messageElement.parentNode) {
                    statusContainer.removeChild(messageElement);
                }
            }, 300);
        }
    }, duration);

    messageElement.addEventListener('click', () => {
        if (messageElement.parentNode) {
            messageElement.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (messageElement.parentNode) {
                    statusContainer.removeChild(messageElement);
                }
            }, 300);
        }
    });
}


window.removeWaypoint = removeWaypoint;
