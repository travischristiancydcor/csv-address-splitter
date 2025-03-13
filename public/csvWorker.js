/**
 * Web Worker for processing CSV data
 * This worker handles parsing and processing large CSV datasets without blocking the main UI thread
 */

// Process the CSV data and extract location information
self.onmessage = function(event) {
    const { data, mappings, batchSize } = event.data;
    
    try {
        // Process data in batches to avoid memory issues with very large datasets
        const totalRecords = data.length;
        const batches = Math.ceil(totalRecords / batchSize);
        
        for (let i = 0; i < batches; i++) {
            const start = i * batchSize;
            const end = Math.min(start + batchSize, totalRecords);
            const batch = data.slice(start, end);
            
            // Process this batch
            const processedBatch = processBatch(batch, mappings);
            
            // Send the processed batch back to the main thread
            self.postMessage({
                type: 'batch',
                data: processedBatch,
                batchNumber: i + 1,
                totalBatches: batches,
                progress: Math.round(((i + 1) / batches) * 100)
            });
        }
        
        // Signal completion
        self.postMessage({
            type: 'complete',
            totalRecords: totalRecords
        });
    } catch (error) {
        // Send error back to main thread
        self.postMessage({
            type: 'error',
            message: error.message
        });
    }
};

/**
 * Process a batch of CSV records
 * @param {Array} batch - Array of CSV records
 * @param {Object} mappings - Field mappings (lat, lng, title)
 * @returns {Array} - Processed records with extracted location data
 */
function processBatch(batch, mappings) {
    const { latField, lngField, titleField } = mappings;
    
    return batch.map(record => {
        // Extract latitude and longitude
        const lat = parseFloat(record[latField]);
        const lng = parseFloat(record[lngField]);
        
        // Skip records with invalid coordinates
        if (isNaN(lat) || isNaN(lng)) {
            return null;
        }
        
        // Create a processed record with location data
        const processedRecord = {
            ...record,
            position: { lat, lng }
        };
        
        // Add title if specified
        if (titleField && record[titleField]) {
            processedRecord.title = record[titleField];
        }
        
        return processedRecord;
    }).filter(record => record !== null); // Remove invalid records
} 