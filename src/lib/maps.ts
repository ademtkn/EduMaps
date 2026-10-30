/** Deep links to the map services people in Kyrgyzstan use. No API keys needed: they open the service itself. */
const coord = (n: number) => n.toFixed(6);

export const googleMapsUrl = (lat: number, lng: number) =>
  `https://www.google.com/maps/search/?api=1&query=${coord(lat)},${coord(lng)}`;

export const googleDirectionsUrl = (lat: number, lng: number) =>
  `https://www.google.com/maps/dir/?api=1&destination=${coord(lat)},${coord(lng)}`;

/** Search by address, for schools that are listed without coordinates. */
export const googleSearchUrl = (text: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(text)}`;

/** 2GIS permalink: ?m=longitude,latitude/zoom (2gis.kg opens in the right city). */
export const twoGisUrl = (lat: number, lng: number, zoom = 17) =>
  `https://2gis.kg/?m=${encodeURIComponent(`${coord(lng)},${coord(lat)}/${zoom}`)}`;

/** 2GIS route to the school (opens the 2GIS app on a phone that has it). Longitude comes first in 2GIS links. */
export const twoGisDirectionsUrl = (lat: number, lng: number) => `https://2gis.kg/routeSearch/rsType/car/to/${coord(lng)},${coord(lat)}`;

/** Key-less Google Maps embed (Google draws its own red pin; a custom school pin needs the Google Maps key, see SchoolLocationMap). */
export const googleEmbedUrl = (lat: number, lng: number) => `https://www.google.com/maps?q=${coord(lat)},${coord(lng)}&z=17&output=embed`;
