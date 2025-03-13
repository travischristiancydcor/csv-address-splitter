# CSV Map Visualizer

A web application that allows users to upload CSV files containing location data and visualize them on Google Maps. The application is designed to handle large datasets (7,000 - 50,000 records) efficiently using marker clustering and web workers.

## Features

- Upload and parse CSV files with location data
- Map CSV fields to latitude and longitude coordinates
- Visualize locations on Google Maps with marker clustering
- Toggle between list and map views
- Filter and search records
- View detailed information by clicking on markers
- Optimized for large datasets using web workers and marker clustering

## Requirements

- Node.js (v12 or higher)
- Google Maps API key with the following enabled services:
  - Maps JavaScript API
  - Geocoding API (optional, if addresses need to be converted to coordinates)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd csv-map-visualizer
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with your Google Maps API key:
```
API_KEY=your_google_maps_api_key
```

4. Start the server:
```bash
npm start
```

5. Open your browser and navigate to `http://localhost:8080`

## Usage

### 1. Configure Google Maps API

- Enter your Google Maps API key in the configuration section
- Click "Save API Key" to store it in your browser's local storage

### 2. Upload CSV File

- Click the upload area or drag and drop a CSV file
- The file should contain columns with latitude and longitude data
- Maximum file size: 10MB

### 3. Process CSV Data

- Click "Process CSV" to parse the file
- The application will display a preview of the data

### 4. Map CSV Fields

- Select which columns contain latitude and longitude data
- Optionally select a column to use as the marker title
- The application will attempt to auto-detect common field names

### 5. Visualize on Map

- Click "Visualize on Map" to display the data on Google Maps
- The application will process the data in batches using a web worker
- Markers will be clustered for better performance with large datasets

### 6. Interact with the Map

- Toggle between list and map views
- Filter records using the search box
- Click on markers to view detailed information
- Zoom and pan the map to explore the data

## Performance Optimization

The application includes several optimizations for handling large datasets:

- **Web Workers**: CSV processing is offloaded to a separate thread to prevent UI freezing
- **Batch Processing**: Data is processed and rendered in batches
- **Marker Clustering**: Markers are clustered to improve rendering performance
- **Lazy Loading**: Only visible markers are rendered

## Browser Compatibility

The application works best in modern browsers:
- Chrome (recommended)
- Firefox
- Safari
- Edge

## License

MIT

## Acknowledgements

- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript/overview)
- [PapaParse](https://www.papaparse.com/) for CSV parsing
- [MarkerClusterer](https://github.com/googlemaps/js-markerclusterer) for marker clustering 