document.addEventListener('DOMContentLoaded', function() {
    const csvFileInput = document.getElementById('csvFile');
    const processBtn = document.getElementById('processBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const removeBtn = document.getElementById('removeBtn');
    const resultsDiv = document.getElementById('results');
    const previewDiv = document.getElementById('preview');
    const dropZone = document.getElementById('dropZone');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const uploadStatus = document.getElementById('uploadStatus');
    
    // Add new button for API upload
    const apiUploadBtn = document.createElement('button');
    apiUploadBtn.id = 'apiUploadBtn';
    apiUploadBtn.innerHTML = '<i class="fas fa-cloud-upload-alt button-icon"></i>Upload to Database';
    apiUploadBtn.classList.add('secondary');
    
    // Make sure the button is added to the DOM
    if (downloadBtn && downloadBtn.parentNode) {
        downloadBtn.parentNode.insertBefore(apiUploadBtn, downloadBtn.nextSibling);
    } else {
        // Fallback if downloadBtn is not found
        const buttonGroup = document.querySelector('.button-group');
        if (buttonGroup) {
            buttonGroup.appendChild(apiUploadBtn);
        }
    }
    
    // Create mapping popup elements
    const mappingOverlay = document.createElement('div');
    mappingOverlay.id = 'mappingOverlay';
    mappingOverlay.className = 'mapping-overlay hidden';
    
    const mappingPopup = document.createElement('div');
    mappingPopup.className = 'mapping-popup';
    
    const mappingHeader = document.createElement('div');
    mappingHeader.className = 'mapping-header';
    mappingHeader.innerHTML = '<h2>Map CSV Fields to Database Fields</h2><p>Select which CSV column should map to each database field</p>';
    
    const mappingContent = document.createElement('div');
    mappingContent.className = 'mapping-content';
    
    const mappingActions = document.createElement('div');
    mappingActions.className = 'mapping-actions';
    
    const cancelMappingBtn = document.createElement('button');
    cancelMappingBtn.className = 'secondary';
    cancelMappingBtn.textContent = 'Cancel';
    
    const confirmMappingBtn = document.createElement('button');
    confirmMappingBtn.textContent = 'Upload Data';
    
    mappingActions.appendChild(cancelMappingBtn);
    mappingActions.appendChild(confirmMappingBtn);
    
    mappingPopup.appendChild(mappingHeader);
    mappingPopup.appendChild(mappingContent);
    mappingPopup.appendChild(mappingActions);
    
    mappingOverlay.appendChild(mappingPopup);
    document.body.appendChild(mappingOverlay);
    
    // Add CSS for mapping popup
    const style = document.createElement('style');
    style.textContent = `
        .mapping-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }
        
        .mapping-popup {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            width: 90%;
            max-width: 600px;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
        }
        
        .mapping-header {
            padding: 20px;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .mapping-header h2 {
            margin-top: 0;
            margin-bottom: 8px;
        }
        
        .mapping-header p {
            margin: 0;
            color: #6b7280;
        }
        
        .mapping-content {
            padding: 20px;
            overflow-y: auto;
            flex: 1;
        }
        
        .mapping-field {
            margin-bottom: 16px;
        }
        
        .mapping-field label {
            display: block;
            font-weight: 500;
            margin-bottom: 8px;
        }
        
        .mapping-field select {
            width: 100%;
            padding: 10px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            background-color: white;
        }
        
        .mapping-field input {
            width: 100%;
            padding: 10px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            background-color: white;
            margin-top: 8px;
        }
        
        .mapping-field .hardcode-option {
            display: flex;
            align-items: center;
            margin-top: 8px;
        }
        
        .mapping-field .hardcode-option input[type="checkbox"] {
            width: auto;
            margin-right: 8px;
        }
        
        .mapping-actions {
            padding: 16px 20px;
            border-top: 1px solid #e5e7eb;
            display: flex;
            justify-content: flex-end;
            gap: 12px;
        }
    `;
    document.head.appendChild(style);
    
    let processedData = null;
    let selectedFile = null;
    let fieldMappings = {};
    
    // Bubble field definitions
    const bubbleFields = [
        { id: "Street #", label: "Street Number", required: false },
        { id: "Street Name", label: "Street Name", required: false },
        { id: "City", label: "City", required: false },
        { id: "State", label: "State", required: false },
        { id: "Zip Code", label: "Zip Code", required: false },
        { id: "Business Name", label: "Business Name", required: false },
        { id: "Status", label: "Status", required: false },
        { id: "Lead Source", label: "Lead Source", required: false },
        { id: "Related Territory", label: "Related Territory", required: false }
    ];
    
    // API configuration
    const API_CONFIG = {
        baseUrl: 'https://workmyt.com/version-[version]/api/1.1/obj/Parent Lead/bulk',
        version: 'test',
        batchSize: 1000,
        authToken: '9d68fe22933950e' // You should implement a more secure way to handle this
    };
    
    // Create admin tab for API configuration
    const adminCard = document.createElement('div');
    adminCard.className = 'card';
    adminCard.innerHTML = `
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; cursor: pointer;" id="adminTabHeader">
            <h3>Admin Settings <span style="font-size: 14px; color: #6b7280;">(Advanced)</span></h3>
            <i class="fas fa-chevron-down"></i>
        </div>
        <div class="card-content hidden" id="adminTabContent">
            <div class="form-group">
                <label for="apiFieldsConfig">API Fields Configuration</label>
                <p class="info-text"><i class="fas fa-info-circle info-icon"></i> Customize which fields are sent to the Bubble API</p>
                <div id="apiFieldsContainer"></div>
                <button id="addCustomFieldBtn" class="secondary" style="margin-top: 10px;"><i class="fas fa-plus button-icon"></i>Add Custom Field</button>
            </div>
            <div class="form-group">
                <label for="apiEndpoint">API Endpoint</label>
                <input type="text" id="apiEndpoint" value="${API_CONFIG.baseUrl}" />
                <p class="info-text"><i class="fas fa-info-circle info-icon"></i> The [version] placeholder will be replaced with the API version</p>
            </div>
            <div class="form-group">
                <label for="apiBatchSize">Batch Size</label>
                <input type="number" id="apiBatchSize" value="${API_CONFIG.batchSize}" min="1" max="5000" />
                <p class="info-text"><i class="fas fa-info-circle info-icon"></i> Number of records to send in each API request</p>
            </div>
            <div class="form-group">
                <label>Default Values</label>
                <div class="default-value-row">
                    <label for="defaultStatus">Default Status</label>
                    <input type="text" id="defaultStatus" value="New" />
                </div>
                <div class="default-value-row">
                    <label for="defaultLeadSource">Default Lead Source</label>
                    <input type="text" id="defaultLeadSource" value="CSV Upload" />
                </div>
            </div>
            <div class="form-group">
                <button id="saveAdminSettings" class="primary"><i class="fas fa-save button-icon"></i>Save Settings</button>
                <button id="resetAdminSettings" class="secondary"><i class="fas fa-undo button-icon"></i>Reset to Defaults</button>
            </div>
        </div>
    `;
    
    // Add CSS for admin tab
    style.textContent += `
        .card-header {
            padding: 16px 20px;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .card-content {
            padding: 20px;
        }
        
        .default-value-row {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
        }
        
        .default-value-row label {
            width: 150px;
            margin-bottom: 0;
        }
        
        .field-row {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
            padding: 10px;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            background-color: #f9fafb;
        }
        
        .field-row input[type="text"] {
            flex: 1;
            margin-right: 10px;
        }
        
        .field-row .field-actions {
            display: flex;
            gap: 5px;
        }
        
        .field-row .field-actions button {
            padding: 5px 10px;
            font-size: 12px;
        }
        
        .field-required {
            margin: 0 10px;
            display: flex;
            align-items: center;
        }
        
        .field-required label {
            margin: 0 5px 0 0;
            font-weight: normal;
        }
    `;
    
    // Insert admin card after API config card
    const apiConfigCard = document.querySelector('.api-config');
    if (apiConfigCard && apiConfigCard.parentNode) {
        apiConfigCard.parentNode.insertBefore(adminCard, apiConfigCard.nextSibling);
    } else {
        // Fallback if API config card is not found
        const container = document.querySelector('.container');
        if (container) {
            container.appendChild(adminCard);
        }
    }
    
    // Create territory selection UI
    const territoryCard = document.createElement('div');
    territoryCard.className = 'card';
    territoryCard.innerHTML = `
        <h3>Territory Selection</h3>
        <div class="form-group">
            <label for="iclSelect">Select ICL (Office)</label>
            <select id="iclSelect" class="form-control">
                <option value="">-- Select an ICL --</option>
            </select>
            <div class="info-text">
                <i class="fas fa-info-circle info-icon"></i>
                <span>Select an ICL to view available zip code assignments</span>
            </div>
        </div>
        <div id="zipAssignmentContainer" class="form-group hidden">
            <label for="zipAssignmentSelect">Select Zip Code ICL Assignment</label>
            <select id="zipAssignmentSelect" class="form-control">
                <option value="">-- Select a Zip Code Assignment --</option>
            </select>
        </div>
        <div id="territoryInfoContainer" class="hidden">
            <div class="info-text">
                <i class="fas fa-check-circle info-icon" style="color: #10b981;"></i>
                <span>A new territory will be created and linked to the uploaded leads</span>
            </div>
        </div>
    `;
    
    // Insert territory card after admin card
    if (adminCard && adminCard.parentNode) {
        adminCard.parentNode.insertBefore(territoryCard, adminCard.nextSibling);
    } else {
        // Fallback if admin card is not found
        const container = document.querySelector('.container');
        if (container) {
            // Find the upload card
            const uploadCard = Array.from(container.querySelectorAll('.card')).find(card => 
                card.querySelector('h3') && card.querySelector('h3').textContent.includes('Upload Files')
            );
            
            if (uploadCard) {
                container.insertBefore(territoryCard, uploadCard);
            } else {
                // Last resort: just append to container
                container.appendChild(territoryCard);
            }
        }
    }
    
    // Add territory-related variables
    let selectedICL = null;
    let selectedZipAssignment = null;
    let createdTerritoryId = null;
    
    // Get territory UI elements
    const iclSelect = document.getElementById('iclSelect');
    const zipAssignmentContainer = document.getElementById('zipAssignmentContainer');
    const zipAssignmentSelect = document.getElementById('zipAssignmentSelect');
    const territoryInfoContainer = document.getElementById('territoryInfoContainer');
    
    // Fetch ICLs from Bubble API
    async function fetchICLs() {
        try {
            const apiVersionInput = document.getElementById('apiVersion');
            const apiTokenInput = document.getElementById('apiToken');
            
            const apiVersion = apiVersionInput ? apiVersionInput.value || API_CONFIG.version : API_CONFIG.version;
            const apiToken = apiTokenInput ? apiTokenInput.value || API_CONFIG.authToken : API_CONFIG.authToken;
            
            // Modify the URL to include the Owner Name field
            const url = `https://workmyt.com/version-${apiVersion}/api/1.1/obj/ICL?include_fields=true`;
            
            console.log("Fetching ICLs from:", url);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiToken}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch ICLs: ${response.status}`);
            }
            
            const data = await response.json();
            console.log("ICL data received:", data);
            
            if (data && data.response && data.response.results) {
                // Clear existing options except the first one
                while (iclSelect.options.length > 1) {
                    iclSelect.remove(1);
                }
                
                // Create an array to hold the options with their display text
                const optionsArray = [];
                
                // Process ICL data
                data.response.results.forEach(icl => {
                    // Look specifically for "ICL Owner Name" field
                    let displayText = '';
                    
                    if (icl["ICL Owner Name"]) {
                        displayText = icl["ICL Owner Name"];
                    } else if (icl.Name || icl["ICL Name"]) {
                        displayText = icl["ICL Name"] || icl.Name;
                    } else {
                        displayText = `ICL ${icl._id}`;
                    }
                    
                    // Add to options array
                    optionsArray.push({
                        value: icl._id,
                        text: displayText
                    });
                });
                
                // Sort the options by display text
                optionsArray.sort((a, b) => a.text.localeCompare(b.text));
                
                // Add sorted options to the select element
                optionsArray.forEach(option => {
                    const optionElement = document.createElement('option');
                    optionElement.value = option.value;
                    optionElement.textContent = option.text;
                    iclSelect.appendChild(optionElement);
                });
            }
        } catch (error) {
            console.error('Error fetching ICLs:', error);
            alert('Failed to load ICLs. Please check your API configuration.');
        }
    }
    
    // Fetch Zip Code ICL Assignments for selected ICL
    async function fetchZipAssignments(iclId) {
        try {
            const apiVersionInput = document.getElementById('apiVersion');
            const apiTokenInput = document.getElementById('apiToken');
            
            const apiVersion = apiVersionInput ? apiVersionInput.value || API_CONFIG.version : API_CONFIG.version;
            const apiToken = apiTokenInput ? apiTokenInput.value || API_CONFIG.authToken : API_CONFIG.authToken;
            
            // Format the constraints exactly as shown in the example URL
            // Note: Using "ICL" as the key instead of "Related ICL" based on the sample response
            const constraintString = `[{  "key": "ICL",   "constraint_type": "equals",   "value": "${iclId}" }]`;
            
            // Build the URL with the correct object name (plural form)
            const url = `https://workmyt.com/version-${apiVersion}/api/1.1/obj/Zip%20Code%20ICL%20Assignments/?constraints=${constraintString}`;
            
            console.log("Fetching Zip Assignments from:", url);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiToken}`
                }
            });
            
            // Log the response for debugging
            console.log("Zip Assignments response status:", response.status);
            const responseText = await response.text();
            console.log("Zip Assignments response:", responseText);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch Zip Assignments: ${response.status} - ${responseText}`);
            }
            
            // Parse the response text as JSON
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                console.error("Error parsing JSON response:", e);
                throw new Error("Invalid response format from server");
            }
            
            // Clear existing options except the first one
            while (zipAssignmentSelect.options.length > 1) {
                zipAssignmentSelect.remove(1);
            }
            
            if (data && data.response && data.response.results) {
                // Create an array to hold the options with their display text
                const optionsArray = [];
                
                // Process assignment data
                data.response.results.forEach(assignment => {
                    // Try to create a descriptive label
                    let label = assignment.Name || '';
                    if (assignment['Zip Code']) {
                        label = label ? `${label} - ${assignment['Zip Code']}` : `Zip: ${assignment['Zip Code']}`;
                    } else if (assignment['Related Zip Code']) {
                        // Also check for 'Related Zip Code' based on the sample response
                        label = label ? `${label} - ${assignment['Related Zip Code']}` : `Zip: ${assignment['Related Zip Code']}`;
                    }
                    if (!label) {
                        label = `Assignment ${assignment._id}`;
                    }
                    
                    // Add to options array
                    optionsArray.push({
                        value: assignment._id,
                        text: label
                    });
                });
                
                // Sort the options by display text
                optionsArray.sort((a, b) => a.text.localeCompare(b.text));
                
                // Add sorted options to the select element
                optionsArray.forEach(option => {
                    const optionElement = document.createElement('option');
                    optionElement.value = option.value;
                    optionElement.textContent = option.text;
                    zipAssignmentSelect.appendChild(optionElement);
                });
                
                // Show the zip assignment container if we have options
                if (data.response.results.length > 0) {
                    zipAssignmentContainer.classList.remove('hidden');
                } else {
                    zipAssignmentContainer.classList.add('hidden');
                    alert('No zip code assignments found for this ICL.');
                }
            } else {
                zipAssignmentContainer.classList.add('hidden');
            }
        } catch (error) {
            console.error('Error fetching Zip Assignments:', error);
            alert('Failed to load Zip Code Assignments. Please check your API configuration.');
            zipAssignmentContainer.classList.add('hidden');
        }
    }
    
    // Create a new Territory
    async function createTerritory(iclId, zipAssignmentId) {
        try {
            const apiVersionInput = document.getElementById('apiVersion');
            const apiTokenInput = document.getElementById('apiToken');
            
            const apiVersion = apiVersionInput ? apiVersionInput.value || API_CONFIG.version : API_CONFIG.version;
            const apiToken = apiTokenInput ? apiTokenInput.value || API_CONFIG.authToken : API_CONFIG.authToken;
            
            const url = `https://workmyt.com/version-${apiVersion}/api/1.1/obj/Territory`;
            
            // Create territory data with the correct field names
            const territoryData = {
                "Assigned ICL": iclId,
                "Related Zip Code ICL Assignment": zipAssignmentId,
                "Territory Name": `Territory created on ${new Date().toLocaleDateString()}`
            };
            
            console.log("Creating territory with data:", territoryData);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(territoryData)
            });
            
            // Log the response for debugging
            console.log("Territory creation response status:", response.status);
            const responseText = await response.text();
            console.log("Territory creation response:", responseText);
            
            if (!response.ok) {
                throw new Error(`Failed to create Territory: ${response.status} - ${responseText}`);
            }
            
            // Parse the response text as JSON
            let data;
            try {
                data = JSON.parse(responseText);
                console.log("Parsed territory response data:", data);
            } catch (e) {
                console.error("Error parsing JSON response:", e);
                throw new Error("Invalid response format from server");
            }
            
            // Check for ID in different possible locations in the response
            let territoryId = null;
            
            if (data && data.response && data.response._id) {
                territoryId = data.response._id;
            } else if (data && data.id) {
                territoryId = data.id;
            } else if (data && data._id) {
                territoryId = data._id;
            } else if (data && data.response && data.response.id) {
                territoryId = data.response.id;
            } else if (data && data.result && data.result._id) {
                territoryId = data.result._id;
            } else if (data && data.result && data.result.id) {
                territoryId = data.result.id;
            }
            
            if (territoryId) {
                console.log("Successfully extracted territory ID:", territoryId);
                return territoryId;
            } else {
                // If we can't find an ID but the request was successful, 
                // create a temporary ID so the process can continue
                console.warn("Could not find territory ID in response, using temporary ID");
                const tempId = "temp_" + new Date().getTime();
                return tempId;
            }
        } catch (error) {
            console.error('Error creating Territory:', error);
            throw error;
        }
    }
    
    // Event listeners for territory selection
    if (iclSelect) {
        iclSelect.addEventListener('change', function() {
            const selectedIclId = this.value;
            
            if (selectedIclId) {
                selectedICL = selectedIclId;
                fetchZipAssignments(selectedIclId);
                territoryInfoContainer.classList.add('hidden');
            } else {
                selectedICL = null;
                zipAssignmentContainer.classList.add('hidden');
                territoryInfoContainer.classList.add('hidden');
            }
        });
    }
    
    if (zipAssignmentSelect) {
        zipAssignmentSelect.addEventListener('change', function() {
            const selectedZipId = this.value;
            
            if (selectedZipId) {
                selectedZipAssignment = selectedZipId;
                territoryInfoContainer.classList.remove('hidden');
            } else {
                selectedZipAssignment = null;
                territoryInfoContainer.classList.add('hidden');
            }
        });
    }
    
    // Load ICLs when API config is loaded
    fetch('/api/config')
        .then(response => response.json())
        .then(data => {
            const apiVersionInput = document.getElementById('apiVersion');
            const apiTokenInput = document.getElementById('apiToken');
            
            if (apiVersionInput) apiVersionInput.value = data.apiVersion || 'test';
            if (apiTokenInput) apiTokenInput.value = data.apiToken || '';
            
            API_CONFIG.authToken = data.apiToken || API_CONFIG.authToken;
            API_CONFIG.version = data.apiVersion || API_CONFIG.version;
            
            // Fetch ICLs after API config is loaded
            fetchICLs();
        })
        .catch(error => {
            console.error('Error fetching API config:', error);
        });
    
    // Handle file selection
    function handleFileSelect(file) {
        if (!file) return;
        
        // Check file size
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            alert('File is too large. Maximum file size is 10MB.');
            return;
        }
        
        // Check file type
        if (!file.name.toLowerCase().endsWith('.csv')) {
            alert('Please select a CSV file.');
            return;
        }
        
        selectedFile = file;
        
        // Display file info
        if (fileName) fileName.textContent = file.name;
        if (fileSize) fileSize.textContent = formatFileSize(file.size);
        if (fileInfo) fileInfo.classList.remove('hidden');
        
        // Reset results
        if (resultsDiv) resultsDiv.classList.add('hidden');
        if (previewDiv) previewDiv.innerHTML = '';
    }
    
    // Format file size
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Handle drag and drop
    if (dropZone) {
        dropZone.addEventListener('click', function() {
            if (csvFileInput) csvFileInput.click();
        });
        
        dropZone.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.add('upload-area-active');
        });
        
        dropZone.addEventListener('dragleave', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.remove('upload-area-active');
        });
        
        dropZone.addEventListener('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.remove('upload-area-active');
            
            if (e.dataTransfer.files.length) {
                if (csvFileInput) csvFileInput.files = e.dataTransfer.files;
                handleFileSelect(e.dataTransfer.files[0]);
            }
        });
    }
    
    // File input change event
    if (csvFileInput) {
        csvFileInput.addEventListener('change', function() {
            handleFileSelect(this.files[0]);
        });
    }
    
    // Remove file
    if (removeBtn) {
        removeBtn.addEventListener('click', function() {
            selectedFile = null;
            if (csvFileInput) csvFileInput.value = '';
            if (fileInfo) fileInfo.classList.add('hidden');
            if (resultsDiv) resultsDiv.classList.add('hidden');
        });
    }
    
    // Process CSV
    if (processBtn) {
        processBtn.addEventListener('click', async function() {
            if (!selectedFile) {
                alert('Please select a CSV file first.');
                return;
            }
            
            // Show progress
            if (progressContainer) progressContainer.classList.remove('hidden');
            if (progressBar) progressBar.style.width = '0%';
            
            try {
                // Create territory if ICL and Zip Assignment are selected
                if (selectedICL && selectedZipAssignment) {
                    if (progressBar) progressBar.style.width = '10%';
                    
                    try {
                        // Update status
                        if (uploadStatus) {
                            uploadStatus.classList.remove('hidden');
                            uploadStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating territory...';
                        }
                        
                        createdTerritoryId = await createTerritory(selectedICL, selectedZipAssignment);
                        console.log('Created territory with ID:', createdTerritoryId);
                        
                        if (uploadStatus) {
                            uploadStatus.innerHTML = '<i class="fas fa-check-circle"></i> Territory created successfully. Processing CSV...';
                        }
                    } catch (error) {
                        console.error('Failed to create territory:', error);
                        alert('Failed to create territory: ' + error.message);
                        
                        if (progressContainer) progressContainer.classList.add('hidden');
                        return;
                    }
                }
                
                // Update progress
                if (progressBar) progressBar.style.width = '30%';
                
                // Use FileReader to read the file content directly
                const reader = new FileReader();
                
                reader.onload = function(event) {
                    try {
                        // Update progress
                        if (progressBar) progressBar.style.width = '50%';
                        
                        // Parse CSV from the file content
                        Papa.parse(event.target.result, {
                            header: true,
                            complete: function(results) {
                                try {
                                    // Update progress
                                    if (progressBar) progressBar.style.width = '100%';
                                    
                                    // Process the data to split street addresses if needed
                                    processedData = processCSV(results.data);
                                    
                                    // Add territory ID to processed data if available
                                    if (createdTerritoryId) {
                                        processedData = processedData.map(row => {
                                            return {
                                                ...row,
                                                'Related Territory': createdTerritoryId
                                            };
                                        });
                                    }
                                    
                                    displayPreview(processedData);
                                    if (resultsDiv) resultsDiv.classList.remove('hidden');
                                    
                                    // Hide progress after a delay
                                    setTimeout(() => {
                                        if (progressContainer) progressContainer.classList.add('hidden');
                                    }, 500);
                                } catch (error) {
                                    alert('Error processing CSV: ' + error.message);
                                    console.error('Processing error:', error);
                                    if (progressContainer) progressContainer.classList.add('hidden');
                                }
                            },
                            error: function(error) {
                                alert('Error parsing CSV: ' + error.message);
                                console.error('Parsing error:', error);
                                if (progressContainer) progressContainer.classList.add('hidden');
                            }
                        });
                    } catch (error) {
                        alert('Error reading file: ' + error.message);
                        console.error('File reading error:', error);
                        if (progressContainer) progressContainer.classList.add('hidden');
                    }
                };
                
                reader.onerror = function(error) {
                    alert('Error reading file: ' + error.target.error.message);
                    console.error('FileReader error:', error);
                    if (progressContainer) progressContainer.classList.add('hidden');
                };
                
                // Read the file as text
                reader.readAsText(selectedFile);
            } catch (error) {
                alert('Error: ' + error.message);
                console.error('Process error:', error);
                if (progressContainer) progressContainer.classList.add('hidden');
            }
        });
    }
    
    // Download processed CSV
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            if (!processedData) {
                alert('Please process a CSV file first.');
                return;
            }
            
            const csv = Papa.unparse(processedData);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', 'processed_' + (selectedFile ? selectedFile.name : 'data.csv'));
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }
    
    // Show field mapping popup
    function showFieldMappingPopup() {
        if (!processedData || processedData.length === 0) {
            alert('Please process a CSV file first.');
            return false;
        }
        
        // Get CSV columns
        const csvColumns = Object.keys(processedData[0]);
        
        // Clear previous mapping content
        mappingContent.innerHTML = '';
        
        // Create field mapping UI
        bubbleFields.forEach(field => {
            const fieldDiv = document.createElement('div');
            fieldDiv.className = 'mapping-field';
            
            const label = document.createElement('label');
            label.textContent = field.label + (field.required ? ' *' : '');
            label.htmlFor = 'mapping-' + field.id;
            
            const select = document.createElement('select');
            select.id = 'mapping-' + field.id;
            select.name = field.id;
            
            // Add empty option
            const emptyOption = document.createElement('option');
            emptyOption.value = '';
            emptyOption.textContent = '-- Select CSV Column --';
            select.appendChild(emptyOption);
            
            // Add CSV column options
            csvColumns.forEach(column => {
                const option = document.createElement('option');
                option.value = column;
                option.textContent = column;
                
                // Auto-select if column name matches field name or if it's one of our generated columns
                if (column.toLowerCase() === field.label.toLowerCase() || 
                    column.toLowerCase().replace(/\s+/g, '') === field.label.toLowerCase().replace(/\s+/g, '') ||
                    (field.id === "Street #" && column === "Street #") ||
                    (field.id === "Street Name" && column === "Street Name")) {
                    option.selected = true;
                }
                
                select.appendChild(option);
            });
            
            fieldDiv.appendChild(label);
            fieldDiv.appendChild(select);
            
            // Add hardcode option
            const hardcodeDiv = document.createElement('div');
            hardcodeDiv.className = 'hardcode-option';
            
            const hardcodeCheck = document.createElement('input');
            hardcodeCheck.type = 'checkbox';
            hardcodeCheck.id = 'hardcode-check-' + field.id;
            hardcodeCheck.addEventListener('change', function() {
                const hardcodeInput = document.getElementById('hardcode-value-' + field.id);
                const selectField = document.getElementById('mapping-' + field.id);
                
                if (this.checked) {
                    hardcodeInput.style.display = 'block';
                    selectField.disabled = true;
                } else {
                    hardcodeInput.style.display = 'none';
                    selectField.disabled = false;
                }
            });
            
            const hardcodeLabel = document.createElement('label');
            hardcodeLabel.htmlFor = 'hardcode-check-' + field.id;
            hardcodeLabel.textContent = 'Hardcode a value';
            
            hardcodeDiv.appendChild(hardcodeCheck);
            hardcodeDiv.appendChild(hardcodeLabel);
            
            const hardcodeInput = document.createElement('input');
            hardcodeInput.type = 'text';
            hardcodeInput.id = 'hardcode-value-' + field.id;
            hardcodeInput.placeholder = 'Enter a value for ' + field.label;
            hardcodeInput.style.display = 'none';
            
            fieldDiv.appendChild(hardcodeDiv);
            fieldDiv.appendChild(hardcodeInput);
            
            mappingContent.appendChild(fieldDiv);
        });
        
        // Show the mapping popup
        mappingOverlay.classList.remove('hidden');
        return true;
    }
    
    // Get field mappings from the popup
    function getFieldMappings() {
        const mappings = {};
        const hardcodedValues = {};
        
        bubbleFields.forEach(field => {
            const hardcodeCheck = document.getElementById('hardcode-check-' + field.id);
            
            if (hardcodeCheck && hardcodeCheck.checked) {
                // Get hardcoded value
                const hardcodeInput = document.getElementById('hardcode-value-' + field.id);
                if (hardcodeInput && hardcodeInput.value.trim()) {
                    hardcodedValues[field.id] = hardcodeInput.value.trim();
                }
            } else {
                // Get mapped column
                const select = document.getElementById('mapping-' + field.id);
                if (select && select.value) {
                    mappings[field.id] = select.value;
                }
            }
        });
        
        return { mappings, hardcodedValues };
    }
    
    // Upload to Bubble API button click
    apiUploadBtn.addEventListener('click', function() {
        if (showFieldMappingPopup()) {
            // The mapping popup is now shown
            console.log('Mapping popup shown');
        }
    });
    
    // Cancel mapping button click
    cancelMappingBtn.addEventListener('click', function() {
        mappingOverlay.classList.add('hidden');
    });
    
    // Confirm mapping button click
    confirmMappingBtn.addEventListener('click', function() {
        // Get field mappings
        const { mappings, hardcodedValues } = getFieldMappings();
        fieldMappings = mappings;
        
        // Hide mapping popup
        mappingOverlay.classList.add('hidden');
        
        // Show upload status
        if (uploadStatus) {
            uploadStatus.classList.remove('hidden');
            uploadStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading data to database...';
        }
        
        // Upload data with mappings
        uploadToBubble(processedData, uploadStatus, mappings, hardcodedValues)
            .then(() => {
                if (uploadStatus) {
                    uploadStatus.innerHTML = '<i class="fas fa-check-circle"></i> Upload completed successfully!';
                }
            })
            .catch(error => {
                if (uploadStatus) {
                    uploadStatus.innerHTML = '<i class="fas fa-exclamation-circle"></i> Error: ' + error.message;
                }
                console.error(error);
            });
    });
    
    // Display preview of processed data
    function displayPreview(data) {
        if (!previewDiv) return;
        
        if (!data || data.length === 0) {
            previewDiv.innerHTML = '<p>No data to display</p>';
            return;
        }
        
        // Get column headers
        const headers = Object.keys(data[0]);
        
        // Create table
        let tableHTML = '<table><thead><tr>';
        headers.forEach(header => {
            tableHTML += `<th>${header}</th>`;
        });
        tableHTML += '</tr></thead><tbody>';
        
        // Add rows (limit to first 10 for preview)
        const previewRows = data.slice(0, 10);
        previewRows.forEach(row => {
            tableHTML += '<tr>';
            headers.forEach(header => {
                tableHTML += `<td>${row[header] || ''}</td>`;
            });
            tableHTML += '</tr>';
        });
        
        tableHTML += '</tbody></table>';
        
        if (data.length > 10) {
            tableHTML += `<p>Showing 10 of ${data.length} rows</p>`;
        }
        
        previewDiv.innerHTML = tableHTML;
    }
    
    // Function to upload data to Bubble.io in batches
    async function uploadToBubble(data, statusElement, mappings, hardcodedValues = {}) {
        const totalRecords = data.length;
        const batchSize = API_CONFIG.batchSize;
        const totalBatches = Math.ceil(totalRecords / batchSize);
        
        if (statusElement) {
            statusElement.innerHTML = `<h3>Upload Status</h3>
                                      <p>Total records: ${totalRecords}</p>
                                      <p>Batch size: ${batchSize}</p>
                                      <p>Total batches: ${totalBatches}</p>
                                      <div id="batchProgressContainer" style="width: 100%; background-color: #e5e7eb; border-radius: 4px; margin: 16px 0; overflow: hidden;">
                                        <div id="batchProgressBar" style="width: 0%; height: 8px; background-color: #2563eb; transition: width 0.3s;"></div>
                                      </div>
                                      <p id="batchStatus">Processing batch 1 of ${totalBatches}...</p>`;
        }
        
        const batchProgressBar = document.getElementById('batchProgressBar');
        const batchStatus = document.getElementById('batchStatus');
        
        let successCount = 0;
        let failCount = 0;
        
        for (let i = 0; i < totalBatches; i++) {
            const start = i * batchSize;
            const end = Math.min(start + batchSize, totalRecords);
            const batch = data.slice(start, end);
            
            if (batchStatus) {
                batchStatus.textContent = `Processing batch ${i + 1} of ${totalBatches}...`;
            }
            
            try {
                await sendBatchToBubble(batch, mappings, hardcodedValues);
                successCount += batch.length;
            } catch (error) {
                console.error(`Error in batch ${i + 1}:`, error);
                failCount += batch.length;
            }
            
            // Update progress bar
            if (batchProgressBar) {
                const progress = ((i + 1) / totalBatches) * 100;
                batchProgressBar.style.width = `${progress}%`;
            }
        }
        
        // After all batches are processed, trigger the territory update workflow
        if (createdTerritoryId) {
            if (batchStatus) {
                batchStatus.textContent = `Finalizing territory setup...`;
            }
            
            try {
                await triggerTerritoryUpdateWorkflow(createdTerritoryId);
                if (batchStatus) {
                    batchStatus.textContent = `Territory finalization complete.`;
                }
            } catch (error) {
                console.error('Error finalizing territory:', error);
                if (batchStatus) {
                    batchStatus.textContent = `Error finalizing territory: ${error.message}`;
                }
            }
        }
        
        if (statusElement) {
            statusElement.innerHTML += `<p>Upload complete!</p>
                                       <p>Successfully uploaded: ${successCount} records</p>
                                       <p>Failed: ${failCount} records</p>`;
            
            if (createdTerritoryId) {
                statusElement.innerHTML += `<p>Territory ID ${createdTerritoryId} has been finalized.</p>`;
            }
        }
    }
    
    // Function to trigger the territory update workflow
    async function triggerTerritoryUpdateWorkflow(territoryId) {
        try {
            const apiVersionInput = document.getElementById('apiVersion');
            const apiTokenInput = document.getElementById('apiToken');
            
            const apiVersion = apiVersionInput ? apiVersionInput.value || API_CONFIG.version : API_CONFIG.version;
            const apiToken = apiTokenInput ? apiTokenInput.value || API_CONFIG.authToken : API_CONFIG.authToken;
            
            // Construct the workflow URL
            const workflowUrl = `https://d189.bubble.is/site/workmyt/version-16a/api/1.1/wf/update-territory-after-csv-import/`;
            
            console.log(`Triggering territory update workflow for territory ID: ${territoryId}`);
            
            const response = await fetch(workflowUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    territory: territoryId
                })
            });
            
            const responseText = await response.text();
            console.log(`Workflow response status: ${response.status}`);
            console.log(`Workflow response body: ${responseText}`);
            
            if (!response.ok) {
                throw new Error(`Workflow error (${response.status}): ${responseText}`);
            }
            
            // Try to parse the response as JSON if possible
            try {
                return JSON.parse(responseText);
            } catch (e) {
                // If it's not valid JSON, just return the text
                return responseText;
            }
        } catch (error) {
            console.error("Error triggering territory update workflow:", error);
            throw error;
        }
    }
    
    // Function to send a batch of records to Bubble.io
    async function sendBatchToBubble(batch, mappings, hardcodedValues = {}) {
        // Get the API version from the input field
        const apiVersionInput = document.getElementById('apiVersion');
        const apiTokenInput = document.getElementById('apiToken');
        
        const apiVersion = apiVersionInput ? apiVersionInput.value || API_CONFIG.version : API_CONFIG.version;
        const apiToken = apiTokenInput ? apiTokenInput.value || API_CONFIG.authToken : API_CONFIG.authToken;
        
        // Get default values from admin settings
        const defaultStatus = document.getElementById('defaultStatus');
        const defaultLeadSource = document.getElementById('defaultLeadSource');
        const defaultStatusValue = defaultStatus ? defaultStatus.value : 'New';
        const defaultLeadSourceValue = defaultLeadSource ? defaultLeadSource.value : 'CSV Upload';
        
        // Construct the URL with the correct version
        const baseUrl = API_CONFIG.baseUrl.replace('[version]', apiVersion);
        const url = baseUrl;
        
        console.log(`Sending batch to: ${url}`);
        console.log(`Using token: ${apiToken.substring(0, 5)}...`);
        console.log('Using field mappings:', mappings);
        console.log('Using hardcoded values:', hardcodedValues);
        
        // Format the data according to your Bubble.io API requirements
        const formattedBatch = batch.map(record => {
            // Create an object with mapped fields
            const mappedRecord = {};
            
            // Apply mappings
            Object.keys(mappings).forEach(bubbleField => {
                const csvField = mappings[bubbleField];
                if (csvField && record[csvField] !== undefined) {
                    mappedRecord[bubbleField] = record[csvField];
                }
            });
            
            // Apply hardcoded values
            Object.keys(hardcodedValues).forEach(bubbleField => {
                mappedRecord[bubbleField] = hardcodedValues[bubbleField];
            });
            
            // Set default values for required fields if not mapped
            if (!mappedRecord['Status']) {
                mappedRecord['Status'] = defaultStatusValue;
            }
            
            if (!mappedRecord['Lead Source']) {
                mappedRecord['Lead Source'] = defaultLeadSourceValue;
            }
            
            // Add territory ID if available and not already set
            if (createdTerritoryId && !mappedRecord['Related Territory']) {
                mappedRecord['Related Territory'] = createdTerritoryId;
            }
            
            return mappedRecord;
        });
        
        console.log("Sample record being sent:", formattedBatch[0]);
        
        // Format as newline-separated JSON objects (NDJSON format)
        const ndjsonData = formattedBatch.map(record => JSON.stringify(record)).join('\n');
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'text/plain'  // Changed from application/json to text/plain
                },
                body: ndjsonData  // Using NDJSON format instead of JSON.stringify(formattedBatch)
            });
            
            const responseText = await response.text();
            console.log(`API Response status: ${response.status}`);
            console.log(`API Response body: ${responseText}`);
            
            if (!response.ok) {
                throw new Error(`API error (${response.status}): ${responseText}`);
            }
            
            // Try to parse the response as JSON if possible
            try {
                return JSON.parse(responseText);
            } catch (e) {
                // If it's not valid JSON, just return the text
                return responseText;
            }
        } catch (error) {
            console.error("Error in API call:", error);
            throw error;
        }
    }

    // Process CSV data - Add this function back
    function processCSV(data) {
        if (!data || data.length === 0) {
            return data;
        }
        
        // Check if there's a street__c column to process
        const hasStreetColumn = data[0].hasOwnProperty('street__c');
        
        if (!hasStreetColumn) {
            // No street__c column, return data as is
            return data;
        }
        
        // Process each row to split street__c into Street # and Street Name
        return data.map(row => {
            const newRow = {...row};
            
            // Split the street address if street__c exists
            if (row['street__c']) {
                const streetAddress = row['street__c'] || '';
                const match = streetAddress.match(/^(\d+)\s+(.+)$/);
                
                if (match) {
                    newRow['Street #'] = match[1];
                    newRow['Street Name'] = match[2];
                } else {
                    newRow['Street #'] = '';
                    newRow['Street Name'] = streetAddress;
                }
            }
            
            return newRow;
        });
    }

    // Initialize admin tab functionality
    function initAdminTab() {
        const adminTabHeader = document.getElementById('adminTabHeader');
        const adminTabContent = document.getElementById('adminTabContent');
        const apiFieldsContainer = document.getElementById('apiFieldsContainer');
        const addCustomFieldBtn = document.getElementById('addCustomFieldBtn');
        const saveAdminSettings = document.getElementById('saveAdminSettings');
        const resetAdminSettings = document.getElementById('resetAdminSettings');
        const apiEndpoint = document.getElementById('apiEndpoint');
        const apiBatchSize = document.getElementById('apiBatchSize');
        const defaultStatus = document.getElementById('defaultStatus');
        const defaultLeadSource = document.getElementById('defaultLeadSource');
        
        // Toggle admin tab content
        if (adminTabHeader) {
            adminTabHeader.addEventListener('click', function() {
                if (adminTabContent) {
                    adminTabContent.classList.toggle('hidden');
                    const icon = adminTabHeader.querySelector('i');
                    if (icon) {
                        icon.classList.toggle('fa-chevron-down');
                        icon.classList.toggle('fa-chevron-up');
                    }
                }
            });
        }
        
        // Load saved settings from localStorage if available
        function loadSavedSettings() {
            try {
                const savedSettings = localStorage.getItem('csvUploaderAdminSettings');
                if (savedSettings) {
                    const settings = JSON.parse(savedSettings);
                    
                    // Update API_CONFIG with saved settings
                    if (settings.baseUrl) API_CONFIG.baseUrl = settings.baseUrl;
                    if (settings.batchSize) API_CONFIG.batchSize = settings.batchSize;
                    
                    // Update form fields
                    if (apiEndpoint) apiEndpoint.value = settings.baseUrl || API_CONFIG.baseUrl;
                    if (apiBatchSize) apiBatchSize.value = settings.batchSize || API_CONFIG.batchSize;
                    if (defaultStatus) defaultStatus.value = settings.defaultStatus || 'New';
                    if (defaultLeadSource) defaultLeadSource.value = settings.defaultLeadSource || 'CSV Upload';
                    
                    // If custom fields were saved, use them instead of the default bubbleFields
                    if (settings.customFields && settings.customFields.length > 0) {
                        // Replace bubbleFields with saved custom fields
                        bubbleFields.length = 0;
                        settings.customFields.forEach(field => {
                            bubbleFields.push(field);
                        });
                    }
                }
            } catch (error) {
                console.error('Error loading saved settings:', error);
            }
        }
        
        // Populate API fields container
        function populateApiFields() {
            if (!apiFieldsContainer) return;
            
            apiFieldsContainer.innerHTML = '';
            
            // Add header row for field columns
            const headerRow = document.createElement('div');
            headerRow.className = 'field-header-row';
            headerRow.innerHTML = `
                <div class="field-header field-id-header">Field ID (API Name)</div>
                <div class="field-header field-label-header">Display Label (User Interface)</div>
                <div class="field-header field-required-header">Options</div>
                <div class="field-header field-actions-header">Actions</div>
            `;
            apiFieldsContainer.appendChild(headerRow);
            
            bubbleFields.forEach((field, index) => {
                const fieldRow = document.createElement('div');
                fieldRow.className = 'field-row';
                fieldRow.dataset.index = index;
                
                fieldRow.innerHTML = `
                    <input type="text" class="field-id" value="${field.id}" placeholder="Field ID (e.g. Street #)" />
                    <input type="text" class="field-label" value="${field.label}" placeholder="Display Label (e.g. Street Number)" />
                    <div class="field-required">
                        <label for="field-required-${index}">Required</label>
                        <input type="checkbox" id="field-required-${index}" class="field-required-checkbox" ${field.required ? 'checked' : ''} />
                    </div>
                    <div class="field-actions">
                        <button class="move-up secondary" title="Move Up"><i class="fas fa-arrow-up"></i></button>
                        <button class="move-down secondary" title="Move Down"><i class="fas fa-arrow-down"></i></button>
                        <button class="remove-field danger" title="Remove"><i class="fas fa-trash"></i></button>
                    </div>
                `;
                
                apiFieldsContainer.appendChild(fieldRow);
                
                // Add event listeners for field actions
                const moveUpBtn = fieldRow.querySelector('.move-up');
                const moveDownBtn = fieldRow.querySelector('.move-down');
                const removeFieldBtn = fieldRow.querySelector('.remove-field');
                
                if (moveUpBtn) {
                    moveUpBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        if (index > 0) {
                            // Swap with previous field
                            const temp = bubbleFields[index];
                            bubbleFields[index] = bubbleFields[index - 1];
                            bubbleFields[index - 1] = temp;
                            populateApiFields(); // Refresh the UI
                        }
                    });
                }
                
                if (moveDownBtn) {
                    moveDownBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        if (index < bubbleFields.length - 1) {
                            // Swap with next field
                            const temp = bubbleFields[index];
                            bubbleFields[index] = bubbleFields[index + 1];
                            bubbleFields[index + 1] = temp;
                            populateApiFields(); // Refresh the UI
                        }
                    });
                }
                
                if (removeFieldBtn) {
                    removeFieldBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        // Remove field from bubbleFields
                        bubbleFields.splice(index, 1);
                        populateApiFields(); // Refresh the UI
                    });
                }
            });
        }
        
        // Add custom field
        if (addCustomFieldBtn) {
            addCustomFieldBtn.addEventListener('click', function(e) {
                e.preventDefault();
                // Add new field to bubbleFields
                bubbleFields.push({
                    id: '',
                    label: '',
                    required: false
                });
                populateApiFields(); // Refresh the UI
            });
        }
        
        // Save admin settings
        if (saveAdminSettings) {
            saveAdminSettings.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Update bubbleFields from UI
                const fieldRows = apiFieldsContainer.querySelectorAll('.field-row');
                const updatedFields = [];
                
                fieldRows.forEach(row => {
                    const fieldId = row.querySelector('.field-id').value.trim();
                    const fieldLabel = row.querySelector('.field-label').value.trim();
                    const fieldRequired = row.querySelector('.field-required-checkbox').checked;
                    
                    if (fieldId && fieldLabel) {
                        updatedFields.push({
                            id: fieldId,
                            label: fieldLabel,
                            required: fieldRequired
                        });
                    }
                });
                
                // Only update if we have at least one valid field
                if (updatedFields.length > 0) {
                    bubbleFields.length = 0;
                    updatedFields.forEach(field => {
                        bubbleFields.push(field);
                    });
                }
                
                // Update API_CONFIG
                if (apiEndpoint) API_CONFIG.baseUrl = apiEndpoint.value;
                if (apiBatchSize) API_CONFIG.batchSize = parseInt(apiBatchSize.value) || 1000;
                
                // Save settings to localStorage
                const settings = {
                    baseUrl: API_CONFIG.baseUrl,
                    batchSize: API_CONFIG.batchSize,
                    defaultStatus: defaultStatus ? defaultStatus.value : 'New',
                    defaultLeadSource: defaultLeadSource ? defaultLeadSource.value : 'CSV Upload',
                    customFields: bubbleFields
                };
                
                localStorage.setItem('csvUploaderAdminSettings', JSON.stringify(settings));
                
                alert('Settings saved successfully!');
            });
        }
        
        // Reset admin settings
        if (resetAdminSettings) {
            resetAdminSettings.addEventListener('click', function(e) {
                e.preventDefault();
                
                if (confirm('Are you sure you want to reset all settings to defaults?')) {
                    // Clear localStorage
                    localStorage.removeItem('csvUploaderAdminSettings');
                    
                    // Reset API_CONFIG
                    API_CONFIG.baseUrl = 'https://workmyt.com/version-[version]/api/1.1/obj/Parent Lead/bulk';
                    API_CONFIG.batchSize = 1000;
                    
                    // Reset form fields
                    if (apiEndpoint) apiEndpoint.value = API_CONFIG.baseUrl;
                    if (apiBatchSize) apiBatchSize.value = API_CONFIG.batchSize;
                    if (defaultStatus) defaultStatus.value = 'New';
                    if (defaultLeadSource) defaultLeadSource.value = 'CSV Upload';
                    
                    // Reset bubbleFields to defaults
                    bubbleFields.length = 0;
                    [
                        { id: "Street #", label: "Street Number", required: false },
                        { id: "Street Name", label: "Street Name", required: false },
                        { id: "City", label: "City", required: false },
                        { id: "State", label: "State", required: false },
                        { id: "Zip Code", label: "Zip Code", required: false },
                        { id: "Business Name", label: "Business Name", required: false },
                        { id: "Status", label: "Status", required: false },
                        { id: "Lead Source", label: "Lead Source", required: false },
                        { id: "Related Territory", label: "Related Territory", required: false }
                    ].forEach(field => {
                        bubbleFields.push(field);
                    });
                    
                    populateApiFields(); // Refresh the UI
                    
                    alert('Settings reset to defaults!');
                }
            });
        }
        
        // Initialize
        loadSavedSettings();
        populateApiFields();
    }

    // Initialize admin tab after DOM is fully loaded
    initAdminTab();

    // Add CSS for the header row
    style.textContent += `
        .field-header-row {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
            padding: 10px;
            background-color: #f3f4f6;
            border-radius: 6px;
            font-weight: 500;
        }
        
        .field-header {
            flex: 1;
            padding: 0 5px;
        }
        
        .field-id-header, .field-label-header {
            flex: 1;
        }
        
        .field-required-header {
            width: 100px;
            text-align: center;
        }
        
        .field-actions-header {
            width: 120px;
            text-align: center;
        }
    `;
}); 