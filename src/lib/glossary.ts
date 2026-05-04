export const REMOTE_SENSING_GLOSSARY = [
  { acronym: "CZCS", meaning: "Coastal Zone Colour Scanner" },
  { acronym: "DEM", meaning: "Digital Elevation Model" },
  { acronym: "DTM", meaning: "Digital Terrain Model" },
  { acronym: "EOS", meaning: "Earth Observation System" },
  { acronym: "ESA", meaning: "European Space Agency" },
  { acronym: "FOV", meaning: "Field of View" },
  { acronym: "GIS", meaning: "Geographic Information System" },
  { acronym: "GOES", meaning: "Geostationary Operational Environmental Satellite" },
  { acronym: "GPS", meaning: "Global Positioning System" },
  { acronym: "IFOV", meaning: "Instantaneous Field of View" },
  { acronym: "IR", meaning: "Infrared" },
  { acronym: "LAI", meaning: "Leaf Area Index" },
  { acronym: "MODIS", meaning: "Moderate Resolution Imaging Spectrometer - Nadir" },
  { acronym: "MSS", meaning: "Multispectral Scanner" },
  { acronym: "NASA", meaning: "National Aeronautics and Space Administration" },
  { acronym: "NDVI", meaning: "Normalized Difference Vegetation Index" },
  { acronym: "NESDIS", meaning: "NOAA Environmental Satellite Data and Information Service" },
  { acronym: "NEXRAD", meaning: "Next Radar (operational system, USA)" },
  { acronym: "NIR", meaning: "Near Infrared" },
  { acronym: "NOAA", meaning: "National Oceanic & Atmospheric Administration (USA)" },
  { acronym: "RADAR", meaning: "Radio Direction and Ranging" },
  { acronym: "SAR", meaning: "Synthetic Aperture Radar" },
  { acronym: "SeaWiFS", meaning: "Sea-viewing, Wide Field-of view Sensor" },
  { acronym: "SPOT", meaning: "Système Probatoire d'Observation de la Terre" },
  { acronym: "SST", meaning: "Sea Surface Temperature" },
  { acronym: "TM", meaning: "Thematic Mapper" },
  { acronym: "TRMM", meaning: "Tropical Rainfall Monitoring Mission" },
  { acronym: "USGS", meaning: "US Geological Survey" },
  { acronym: "VHRR", meaning: "Very High Resolution Radiometer" },
  { acronym: "WMO", meaning: "World Meteorological Organization" }
];

export function getAcronymMeaning(acronym: string): string | null {
  const entry = REMOTE_SENSING_GLOSSARY.find(e => e.acronym === acronym);
  return entry ? entry.meaning : null;
}
