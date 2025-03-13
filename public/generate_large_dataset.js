/**
 * Script to generate a large sample dataset of locations for testing
 * Run with: node generate_large_dataset.js
 */

const fs = require('fs');
const path = require('path');

// San Francisco area boundaries
const SF_BOUNDS = {
  north: 37.84,
  south: 37.70,
  east: -122.35,
  west: -122.52
};

// Types of locations
const LOCATION_TYPES = [
  'Restaurant',
  'Cafe',
  'Store',
  'Office',
  'Park',
  'School',
  'Hospital',
  'Hotel',
  'Apartment',
  'House'
];

// Street names
const STREET_NAMES = [
  'Market St',
  'Mission St',
  'Valencia St',
  'Geary Blvd',
  'Van Ness Ave',
  'Divisadero St',
  'Fillmore St',
  'Haight St',
  'Irving St',
  'Judah St',
  'Taraval St',
  'Ocean Ave',
  'Portola Dr',
  'Columbus Ave',
  'Broadway',
  'California St',
  'Sacramento St',
  'Pine St',
  'Bush St',
  'Sutter St'
];

// Generate a random number between min and max
function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

// Generate a random integer between min and max (inclusive)
function randomIntBetween(min, max) {
  return Math.floor(randomBetween(min, max + 1));
}

// Generate a random location within SF bounds
function generateRandomLocation() {
  const lat = randomBetween(SF_BOUNDS.south, SF_BOUNDS.north);
  const lng = randomBetween(SF_BOUNDS.west, SF_BOUNDS.east);
  const streetNumber = randomIntBetween(1, 9999);
  const streetName = STREET_NAMES[randomIntBetween(0, STREET_NAMES.length - 1)];
  const type = LOCATION_TYPES[randomIntBetween(0, LOCATION_TYPES.length - 1)];
  const id = `LOC-${randomIntBetween(10000, 99999)}`;
  
  return {
    id,
    name: `${type} ${id}`,
    latitude: lat.toFixed(6),
    longitude: lng.toFixed(6),
    address: `${streetNumber} ${streetName}`,
    city: 'San Francisco',
    state: 'CA',
    zip: `941${randomIntBetween(0, 3)}${randomIntBetween(0, 9)}`,
    type
  };
}

// Generate CSV content
function generateCSV(numRecords) {
  const headers = ['id', 'name', 'latitude', 'longitude', 'address', 'city', 'state', 'zip', 'type'];
  const rows = [headers.join(',')];
  
  for (let i = 0; i < numRecords; i++) {
    const location = generateRandomLocation();
    const row = headers.map(header => {
      const value = location[header];
      // Quote strings with commas
      return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
    });
    rows.push(row.join(','));
    
    // Log progress
    if (i > 0 && i % 1000 === 0) {
      console.log(`Generated ${i} records...`);
    }
  }
  
  return rows.join('\n');
}

// Main function
function main() {
  const numRecords = 10000; // Change this to generate more or fewer records
  const outputFile = path.join(__dirname, 'large_sample_locations.csv');
  
  console.log(`Generating ${numRecords} random locations...`);
  const csvContent = generateCSV(numRecords);
  
  fs.writeFileSync(outputFile, csvContent);
  console.log(`Done! File saved to ${outputFile}`);
}

main(); 