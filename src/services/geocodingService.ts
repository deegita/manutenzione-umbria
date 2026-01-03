import { Coordinates } from '../types';

export const getAddressFromCoordinates = async (coords: Coordinates): Promise<string> => {
  try {
    // Using OpenStreetMap Nominatim API (Free, requires User-Agent identification usually handled by browser)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'it-IT' // Request Italian results
        }
      }
    );

    if (!response.ok) {
      throw new Error('Geocoding failed');
    }

    const data = await response.json();
    
    // Construct a clean address
    // Nominatim returns complex objects, we try to grab the most relevant parts
    const addr = data.address;
    let road = addr.road || addr.pedestrian || addr.street || '';
    let number = addr.house_number ? `, ${addr.house_number}` : '';
    let city = addr.city || addr.town || addr.village || addr.municipality || '';
    
    if (road) {
      return `${road}${number}, ${city}`;
    } else if (data.display_name) {
      // Fallback to the full string but truncated
      return data.display_name.split(',').slice(0, 3).join(',');
    }
    
    return "Posizione sulla mappa";

  } catch (error) {
    console.error("Geocoding error:", error);
    return "Indirizzo non disponibile";
  }
};