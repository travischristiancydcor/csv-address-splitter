document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const csvFileInput = document.getElementById('csvFile');
    const processBtn = document.getElementById('processBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const removeBtn = document.getElementById('removeBtn');
    const previewDiv = document.getElementById('preview');
    const dropZone = document.getElementById('dropZone');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    
    // Map-specific elements
    const mapFieldsCard = document.getElementById('mapFieldsCard');
    const latField = document.getElementById('latField');
    const lngField = document.getElementById('lngField');
    const titleField = document.getElementById('titleField');
    const visualizeBtn = document.getElementById('visualizeBtn');
    const resultsContainer = document.getElementById('resultsContainer');
    const listViewBtn = document.getElementById('listViewBtn');
    const mapViewBtn = document.getElementById('mapViewBtn');
    const listView = document.getElementById('listView');
    const mapView = document.getElementById('mapView');
    const searchFilter = document.getElementById('searchFilter');
    const filterBtn = document.getElementById('filterBtn');
    
    // Admin settings elements
    const adminHeader = document.getElementById('adminHeader');
    const adminContent = document.getElementById('adminContent');
    const adminToggleIcon = document.getElementById('adminToggleIcon');
    const apiKeyInput = document.getElementById('apiKey');
    const saveApiKeyBtn = document.getElementById('saveApiKey');
    const batchSizeInput = document.getElementById('batchSize');
    
    // State variables
    let csvData = null;
    let parsedData = null;
    let map = null;
    let markers = [];
    let markerCluster = null;
    let infoWindow = null;
    let apiKey = localStorage.getItem('googleMapsApiKey') || '';
    let batchSize = parseInt(localStorage.getItem('batchSize')) || 1000;
    
    // Constants
    const DEFAULT_CENTER = { lat: 37.7749, lng: -122.4194 }; // San Francisco
    const DEFAULT_ZOOM = 10;
    
    // Initialize the application
    init();
    
    /**
     * Initialize the application
     */
    function init() {
        // Set up event listeners
        dropZone.addEventListener('click', () => csvFileInput.click());
        dropZone.addEventListener('dragover', handleDragOver);
        dropZone.addEventListener('dragleave', handleDragLeave);
        dropZone.addEventListener('drop', handleDrop);
        csvFileInput.addEventListener('change', handleFileInputChange);
        processBtn.addEventListener('click', handleProcessClick);
        removeBtn.addEventListener('click', handleRemoveClick);
        downloadBtn.addEventListener('click', handleDownloadClick);
        visualizeBtn.addEventListener('click', handleVisualizeClick);
        listViewBtn.addEventListener('click', () => toggleView('list'));
        mapViewBtn.addEventListener('click', () => toggleView('map'));
        filterBtn.addEventListener('click', handleFilterClick);
        searchFilter.addEventListener('keyup', event => {
            if (event.key === 'Enter') {
                handleFilterClick();
            }
        });
        
        // Admin settings event listeners
        adminHeader.addEventListener('click', toggleAdminSettings);
        
        // API Key handling
        if (apiKey) {
            apiKeyInput.value = apiKey;
        }
        
        // Batch size handling
        if (batchSize) {
            batchSizeInput.value = batchSize;
        }
        
        saveApiKeyBtn.addEventListener('click', () => {
            apiKey = apiKeyInput.value.trim();
            batchSize = parseInt(batchSizeInput.value) || 1000;
            
            localStorage.setItem('googleMapsApiKey', apiKey);
            localStorage.setItem('batchSize', batchSize);
            
            alert('Settings saved successfully!');
        });
    }
    
    /**
     * Toggle admin settings panel
     */
    function toggleAdminSettings() {
        adminContent.classList.toggle('active');
        
        if (adminContent.classList.contains('active')) {
            adminToggleIcon.classList.remove('fa-chevron-down');
            adminToggleIcon.classList.add('fa-chevron-up');
        } else {
            adminToggleIcon.classList.remove('fa-chevron-up');
            adminToggleIcon.classList.add('fa-chevron-down');
        }
    }
    
    /**
     * Handle drag over event
     * @param {Event} e - The drag event
     */
    function handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('upload-area-active');
    }
    
    /**
     * Handle drag leave event
     * @param {Event} e - The drag event
     */
    function handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('upload-area-active');
    }
    
    /**
     * Handle drop event
     * @param {Event} e - The drop event
     */
    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('upload-area-active');
        
        if (e.dataTransfer.files.length) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    }
    
    /**
     * Handle file input change
     * @param {Event} e - The change event
     */
    function handleFileInputChange(e) {
        if (e.target.files.length) {
            handleFileSelect(e.target.files[0]);
        }
    }
    
    /**
     * Handle file selection
     * @param {File} file - The selected file
     */
    function handleFileSelect(file) {
        // Check if it's a CSV file
        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
            alert('Please select a CSV file.');
            return;
        }
        
        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert('File size exceeds the 10MB limit.');
            return;
        }
        
        // Update UI
        csvData = file;
        fileName.textContent = file.name;
        fileSize.textContent = formatFileSize(file.size);
        fileInfo.classList.remove('hidden');
        
        // Reset other UI elements
        previewDiv.innerHTML = '';
        progressContainer.classList.add('hidden');
        progressBar.style.width = '0%';
        mapFieldsCard.classList.add('hidden');
        resultsContainer.classList.add('hidden');
    }
    
    /**
     * Format file size in human-readable format
     * @param {number} bytes - The file size in bytes
     * @returns {string} - Formatted file size
     */
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    /**
     * Handle process button click
     */
    function handleProcessClick() {
        if (!csvData) {
            alert('Please select a CSV file first.');
            return;
        }
        
        // Show progress
        progressContainer.classList.remove('hidden');
        progressBar.style.width = '0%';
        
        // Parse CSV file
        Papa.parse(csvData, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: function(results) {
                parsedData = results.data;
                progressBar.style.width = '100%';
                
                // Show field mapping UI
                populateFieldSelects(results.meta.fields);
                mapFieldsCard.classList.remove('hidden');
                
                // Show preview of the data
                displayPreview(parsedData.slice(0, 10));
            },
            error: function(error) {
                alert('Error parsing CSV: ' + error.message);
                progressContainer.classList.add('hidden');
            }
        });
    }
    
    /**
     * Populate field select dropdowns with CSV headers
     * @param {Array} fields - CSV header fields
     */
    function populateFieldSelects(fields) {
        // Clear existing options
        latField.innerHTML = '';
        lngField.innerHTML = '';
        titleField.innerHTML = '<option value="">-- None --</option>';
        
        // Add options for each field
        fields.forEach(field => {
            const latOption = document.createElement('option');
            latOption.value = field;
            latOption.textContent = field;
            
            const lngOption = document.createElement('option');
            lngOption.value = field;
            lngOption.textContent = field;
            
            const titleOption = document.createElement('option');
            titleOption.value = field;
            titleOption.textContent = field;
            
            latField.appendChild(latOption);
            lngField.appendChild(lngOption);
            titleField.appendChild(titleOption);
        });
        
        // Try to auto-select lat/lng fields based on common naming patterns
        autoSelectCoordinateFields(fields);
    }
    
    /**
     * Auto-select coordinate fields based on common naming patterns
     * @param {Array} fields - CSV header fields
     */
    function autoSelectCoordinateFields(fields) {
        const latPatterns = ['lat', 'latitude', 'y'];
        const lngPatterns = ['lng', 'lon', 'longitude', 'long', 'x'];
        const titlePatterns = ['name', 'title', 'label', 'id'];
        
        // Find best match for latitude
        for (const pattern of latPatterns) {
            const match = fields.find(field => 
                field.toLowerCase() === pattern || 
                field.toLowerCase().includes(pattern)
            );
            if (match) {
                latField.value = match;
                break;
            }
        }
        
        // Find best match for longitude
        for (const pattern of lngPatterns) {
            const match = fields.find(field => 
                field.toLowerCase() === pattern || 
                field.toLowerCase().includes(pattern)
            );
            if (match) {
                lngField.value = match;
                break;
            }
        }
        
        // Find best match for title
        for (const pattern of titlePatterns) {
            const match = fields.find(field => 
                field.toLowerCase() === pattern || 
                field.toLowerCase().includes(pattern)
            );
            if (match) {
                titleField.value = match;
                break;
            }
        }
    }
    
    /**
     * Handle remove button click
     */
    function handleRemoveClick() {
        csvData = null;
        parsedData = null;
        fileInfo.classList.add('hidden');
        previewDiv.innerHTML = '';
        progressContainer.classList.add('hidden');
        mapFieldsCard.classList.add('hidden');
        resultsContainer.classList.add('hidden');
        csvFileInput.value = '';
    }
    
    /**
     * Handle download button click
     */
    function handleDownloadClick() {
        if (!csvData) return;
        
        const url = URL.createObjectURL(csvData);
        const a = document.createElement('a');
        a.href = url;
        a.download = csvData.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    /**
     * Handle visualize button click
     */
    function handleVisualizeClick() {
        if (!parsedData || !parsedData.length) {
            alert('No data to visualize.');
            return;
        }
        
        // Get field mappings
        const mappings = {
            latField: latField.value,
            lngField: lngField.value,
            titleField: titleField.value
        };
        
        // Validate mappings
        if (!mappings.latField || !mappings.lngField) {
            alert('Please select both latitude and longitude fields.');
            return;
        }
        
        // Show loading indicator
        showLoadingOverlay();
        
        // Process data in a web worker
        processDataWithWorker(parsedData, mappings);
    }
    
    /**
     * Process data with a web worker
     * @param {Array} data - CSV data to process
     * @param {Object} mappings - Field mappings
     */
    function processDataWithWorker(data, mappings) {
        // Get current batch size from input
        const currentBatchSize = parseInt(batchSizeInput.value) || 1000;
        
        // Create a web worker
        const worker = new Worker('/csvWorker.js');
        
        // Send data to the worker
        worker.postMessage({
            data: data,
            mappings: mappings,
            batchSize: currentBatchSize
        });
        
        // Initialize markers array
        markers = [];
        
        // Handle messages from the worker
        worker.onmessage = function(event) {
            const message = event.data;
            
            switch (message.type) {
                case 'batch':
                    // Update progress
                    progressBar.style.width = message.progress + '%';
                    
                    // Store processed records
                    if (message.data && message.data.length) {
                        // If this is the first batch, show the results container
                        if (message.batchNumber === 1) {
                            resultsContainer.classList.remove('hidden');
                            
                            // Initialize the map if not already done
                            if (!map) {
                                initMap();
                            }
                        }
                        
                        // Add markers for this batch
                        addMarkersToMap(message.data);
                    }
                    break;
                    
                case 'complete':
                    // Hide loading overlay
                    hideLoadingOverlay();
                    
                    // Create marker cluster if we have markers
                    if (markers.length) {
                        createMarkerCluster();
                        
                        // Show map view
                        toggleView('map');
                    } else {
                        alert('No valid location data found in the CSV file.');
                    }
                    break;
                    
                case 'error':
                    hideLoadingOverlay();
                    alert('Error processing data: ' + message.message);
                    break;
            }
        };
        
        // Handle worker errors
        worker.onerror = function(error) {
            hideLoadingOverlay();
            alert('Worker error: ' + error.message);
        };
    }
    
    /**
     * Initialize Google Maps
     */
    function initMap() {
        // Check if API key is available
        if (!apiKey) {
            alert('Please enter a Google Maps API Key in the Admin Settings section.');
            hideLoadingOverlay();
            return;
        }
        
        // Load Google Maps API dynamically
        if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMapCallback`;
            script.async = true;
            script.defer = true;
            
            // Define callback function in global scope
            window.initMapCallback = function() {
                createMap();
            };
            
            document.head.appendChild(script);
        } else {
            // Google Maps API already loaded
            createMap();
        }
    }
    
    /**
     * Create the Google Map
     */
    function createMap() {
        // Create map instance
        map = new google.maps.Map(document.getElementById('map'), {
            center: DEFAULT_CENTER,
            zoom: DEFAULT_ZOOM,
            mapTypeControl: true,
            fullscreenControl: true,
            streetViewControl: true,
            zoomControl: true
        });
        
        // Create info window for markers
        infoWindow = new google.maps.InfoWindow();
    }
    
    /**
     * Add markers to the map
     * @param {Array} data - Location data to add as markers
     */
    function addMarkersToMap(data) {
        if (!map || !data.length) return;
        
        data.forEach(item => {
            // Create marker
            const marker = new google.maps.Marker({
                position: item.position,
                map: map,
                title: item.title || ''
            });
            
            // Add click event to show info window
            marker.addListener('click', () => {
                showInfoWindow(marker, item);
            });
            
            // Store the original data with the marker
            marker.data = item;
            
            // Add to markers array
            markers.push(marker);
        });
        
        // If this is the first batch, center the map on the first marker
        if (markers.length === data.length) {
            map.setCenter(markers[0].getPosition());
        }
    }
    
    /**
     * Create marker cluster for efficient rendering of large datasets
     */
    function createMarkerCluster() {
        // Remove existing cluster if any
        if (markerCluster) {
            markerCluster.clearMarkers();
        }
        
        // Create new cluster
        markerCluster = new markerClusterer.MarkerClusterer({
            map,
            markers,
            algorithm: new markerClusterer.SuperClusterAlgorithm({
                radius: 100,
                maxZoom: 15
            })
        });
    }
    
    /**
     * Show info window for a marker
     * @param {google.maps.Marker} marker - The marker
     * @param {Object} data - The data associated with the marker
     */
    function showInfoWindow(marker, data) {
        // Create content for info window
        let content = '<div class="marker-info-window">';
        
        // Add title if available
        if (data.title) {
            content += `<div class="marker-info-title">${data.title}</div>`;
        }
        
        // Add content with all fields
        content += '<div class="marker-info-content">';
        
        Object.entries(data).forEach(([key, value]) => {
            // Skip position and title (already displayed)
            if (key === 'position' || key === 'title') return;
            
            content += `
                <div class="marker-info-field">
                    <span class="marker-info-label">${key}:</span>
                    <span>${value}</span>
                </div>
            `;
        });
        
        content += '</div></div>';
        
        // Set content and open info window
        infoWindow.setContent(content);
        infoWindow.open(map, marker);
    }
    
    /**
     * Toggle between list and map views
     * @param {string} view - The view to show ('list' or 'map')
     */
    function toggleView(view) {
        if (view === 'list') {
            listView.classList.remove('hidden');
            mapView.classList.add('hidden');
            listViewBtn.classList.add('active');
            mapViewBtn.classList.remove('active');
        } else {
            listView.classList.add('hidden');
            mapView.classList.remove('hidden');
            listViewBtn.classList.remove('active');
            mapViewBtn.classList.add('active');
            
            // Trigger resize event to fix map rendering issues
            if (map) {
                google.maps.event.trigger(map, 'resize');
            }
        }
    }
    
    /**
     * Handle filter button click
     */
    function handleFilterClick() {
        const filterText = searchFilter.value.toLowerCase().trim();
        
        if (!markers.length) return;
        
        if (!filterText) {
            // Show all markers
            markers.forEach(marker => marker.setVisible(true));
            
            // Update marker cluster
            if (markerCluster) {
                markerCluster.clearMarkers();
                markerCluster.addMarkers(markers);
            }
            
            return;
        }
        
        // Filter markers
        const filteredMarkers = markers.filter(marker => {
            const data = marker.data;
            
            // Check if any field contains the filter text
            const matches = Object.values(data).some(value => {
                if (value === null || value === undefined) return false;
                if (typeof value === 'object') return false;
                return String(value).toLowerCase().includes(filterText);
            });
            
            // Update marker visibility
            marker.setVisible(matches);
            
            return matches;
        });
        
        // Update marker cluster with filtered markers
        if (markerCluster) {
            markerCluster.clearMarkers();
            markerCluster.addMarkers(filteredMarkers);
        }
        
        // Update the list view with filtered data
        const filteredData = filteredMarkers.map(marker => marker.data);
        displayPreview(filteredData.slice(0, 100));
    }
    
    /**
     * Show loading overlay
     */
    function showLoadingOverlay() {
        // Create overlay if it doesn't exist
        let overlay = document.getElementById('loadingOverlay');
        
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loadingOverlay';
            overlay.className = 'loading-overlay';
            
            const spinner = document.createElement('div');
            spinner.className = 'loading-spinner';
            
            overlay.appendChild(spinner);
            document.body.appendChild(overlay);
        } else {
            overlay.classList.remove('hidden');
        }
    }
    
    /**
     * Hide loading overlay
     */
    function hideLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }
    
    /**
     * Display preview of CSV data
     * @param {Array} data - CSV data to preview
     */
    function displayPreview(data) {
        if (!data || !data.length) {
            previewDiv.innerHTML = '<p>No data to display.</p>';
            return;
        }
        
        // Create table
        const table = document.createElement('table');
        
        // Create header row
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        Object.keys(data[0]).forEach(key => {
            const th = document.createElement('th');
            th.textContent = key;
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Create body rows
        const tbody = document.createElement('tbody');
        
        data.forEach(row => {
            const tr = document.createElement('tr');
            
            Object.values(row).forEach(value => {
                const td = document.createElement('td');
                td.textContent = value !== null ? value : '';
                tr.appendChild(td);
            });
            
            tbody.appendChild(tr);
        });
        
        table.appendChild(tbody);
        previewDiv.innerHTML = '';
        previewDiv.appendChild(table);
    }
}); 