# CSV Address Splitter & Lead Uploader

A web application that processes CSV files containing address data, splits street addresses into separate components, and uploads the processed data to a Bubble.io database.

## Features

- **CSV Processing**: Upload and parse CSV files with automatic street address splitting
- **Data Preview**: View processed data before uploading
- **Bubble.io Integration**: Direct upload to Bubble.io database via API
- **Field Mapping**: Map CSV columns to Bubble.io database fields
- **Territory Management**: Create territories and link them to uploaded leads
- **Batch Processing**: Handle large datasets with configurable batch sizes
- **Admin Settings**: Customize API endpoints, field configurations, and default values

## Getting Started

### Prerequisites

- Node.js (v12 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/csv-address-splitter.git
   cd csv-address-splitter
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with your Bubble.io API credentials:
   ```
   BUBBLE_API_TOKEN=your_api_token
   BUBBLE_API_VERSION=your_api_version
   ```

4. Start the development server:
   ```
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:8080`

## Usage

1. **Upload a CSV File**: Drag and drop or click to select a CSV file
2. **Process the File**: Click "Process CSV" to parse and split address data
3. **Select Territory** (Optional): Choose an ICL and Zip Code Assignment to create a territory
4. **Map Fields**: Click "Upload to Database" to map CSV columns to database fields
5. **Upload Data**: Confirm the mapping to upload data to Bubble.io

## Configuration

### Admin Settings

The application includes an admin panel for customizing:

- API endpoint URL
- Batch size for API requests
- Default values for Status and Lead Source
- Field configurations (ID, label, required status)

Settings are saved to localStorage and persist between sessions.

## Deployment

The application is deployed using Vercel. To deploy your own instance:

1. Install Vercel CLI:
   ```
   npm install -g vercel
   ```

2. Deploy to Vercel:
   ```
   vercel --prod
   ```

## Built With

- Express.js - Web server framework
- PapaParse - CSV parsing library
- Vercel - Deployment platform

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Bubble.io for their API
- PapaParse for CSV parsing capabilities 