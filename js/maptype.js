const MapType = {
    OPENSTREETMAP:    "OPENSTREETMAP",
    OPENTOPOMAP:      "OPENTOPOMAP",
    STAMEN_TERRAIN:   "STAMEN_TERRAIN",
    GOOGLE_ROADMAP:   "GOOGLE_ROADMAP",
    GOOGLE_SATELLITE: "GOOGLE_SATELLITE",
    GOOGLE_HYBRID:    "GOOGLE_HYBRID",
    GOOGLE_TERRAIN:   "GOOGLE_TERRAIN",
    BING_ROAD:        "BING_ROAD",
    BING_AERIAL:      "BING_AERIAL"
};

if (Object.freeze) {
    Object.freeze(MapType);
}

const maptype2string = (type) => {
    return type;
};

const string2maptype = (s) => {
    switch (s.toUpperCase()) {
        case MapType.OPENSTREETMAP:    return MapType.OPENSTREETMAP;
        case MapType.OPENTOPOMAP:      return MapType.OPENTOPOMAP;
        case MapType.STAMEN_TERRAIN:   return MapType.STAMEN_TERRAIN;
        case MapType.GOOGLE_ROADMAP:   return MapType.GOOGLE_ROADMAP;
        case MapType.GOOGLE_SATELLITE: return MapType.GOOGLE_SATELLITE;
        case MapType.GOOGLE_HYBRID:    return MapType.GOOGLE_HYBRID;
        case MapType.GOOGLE_TERRAIN:   return MapType.GOOGLE_TERRAIN;
        case MapType.BING_ROAD:        return MapType.BING_ROAD;
        case MapType.BING_AERIAL:      return MapType.BING_AERIAL;
    }
    return null;
};

export {MapType, maptype2string, string2maptype};
