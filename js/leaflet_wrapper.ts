import * as L from 'leaflet';

import {App} from './app';
import {Color} from './color';
import {Coordinates} from './coordinates';
import {Line} from "./line";
import {MapType} from './map_type';
import {MapWrapper} from './map_wrapper';
import {Marker} from "./marker";

function from_coordinates(c: Coordinates): L.LatLng {
    return L.latLng(c.raw_lat(), c.raw_lng());
};

function to_coordinates(leaflet_latlng: L.LatLng): Coordinates {
    return new Coordinates(leaflet_latlng.lat, leaflet_latlng.lng);
};

interface MarkerObjDict {
    marker_obj: L.Marker;
    circle_obj: L.Polygon;
    last_name: string;
    last_color: Color;
};

interface LineObjDict {
    line_obj: L.Polyline;
    arrow_obj: L.Polyline;
    last_color: Color;
};

export class LeafletWrapper extends MapWrapper {
    private automatic_event: boolean;
    private hillshading_enabled: boolean;
    private hillshading_layer: L.TileLayer;
    private german_npa_enabled: boolean;
    private german_npa_layer: L.TileLayer;
    private map: L.Map;
    private layer_openstreetmap: L.TileLayer;
    private layer_opentopomap: L.TileLayer;
    private layer_stamen_terrain: L.TileLayer;
    private layer_arcgis_worldimagery: L.TileLayer;
    private layers: L.TileLayer[];

    constructor(div_id: string, app: App) {
        super(div_id, app);
        this.automatic_event = false;
        this.hillshading_enabled = false;
        this.hillshading_layer = null;
        this.german_npa_enabled = false;
        this.german_npa_layer = null;
    }

    public create_map_object(div_id: string): void {
        const self = this;

        this.map = L.map(div_id);

        this.layer_openstreetmap = L.tileLayer(
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            {
                attribution:
                    'Map tiles by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.',
                maxZoom: 16,
                subdomains: 'abc',
            },
        );
        this.layer_opentopomap = L.tileLayer(
            'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
            {
                attribution:
                    'Map tiles by <a href="http://opentopomap.org">OpenTopoMap</a>, under <a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.',
                maxZoom: 17,
                subdomains: 'abc',
            },
        );
        this.layer_stamen_terrain = L.tileLayer(
            'https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg',
            {
                attribution:
                    'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.',
                maxZoom: 14,
                subdomains: 'abcd',
            },
        );
        this.layer_arcgis_worldimagery = L.tileLayer(
            'https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            {
                attribution:
                    'Source: Esri, Maxar, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community',
                maxZoom: 18,
            },
        );

        this.layers = [
            this.layer_openstreetmap,
            this.layer_opentopomap,
            this.layer_stamen_terrain,
            this.layer_arcgis_worldimagery,
        ];
        ['zoom', 'move'].forEach((event_name: string): void => {
            self.map.on(event_name, (): void => {
                if (self.active && !self.automatic_event) {
                    self.app.map_state.set_view(
                        to_coordinates(self.map.getCenter()),
                        self.map.getZoom(),
                    );
                }
            });
        });

        this.map.on('contextmenu', (event: L.LeafletMouseEvent): boolean => {
            self.app.map_menu.showMap(
                self,
                event.containerPoint.x,
                event.containerPoint.y,
                to_coordinates(event.latlng),
            );
            return false;
        });
        ['zoom', 'move', 'mousedown'].forEach((event_name: string): void => {
            self.map.on(event_name, (): void => {
                self.app.map_menu.hide();
            });
        });
    }

    public set_map_type(map_type: string): void {
        let layer = null;
        switch (map_type) {
            case MapType.OPENSTREETMAP:
                layer = this.layer_openstreetmap;
                break;
            case MapType.OPENTOPOMAP:
                layer = this.layer_opentopomap;
                break;
            case MapType.STAMEN_TERRAIN:
                layer = this.layer_stamen_terrain;
                break;
            case MapType.ARCGIS_WORLDIMAGERY:
                layer = this.layer_arcgis_worldimagery;
                break;
            default:
                break;
        }

        if (layer && !this.map.hasLayer(layer)) {
            const self = this;
            this.layers.forEach((otherLayer: L.TileLayer): void => {
                if (otherLayer !== layer) {
                    self.map.removeLayer(otherLayer);
                }
            });
            this.map.addLayer(layer);
            layer.bringToBack();
        }
    }

    public set_hillshading(enabled: boolean): void {
        if (this.hillshading_enabled === enabled) {
            return;
        }

        this.hillshading_enabled = enabled;
        if (enabled) {
            if (!this.hillshading_layer) {
                this.hillshading_layer = L.tileLayer(
                    'https://tiles.wmflabs.org/hillshading/{z}/{x}/{y}.png',
                    {attribution: 'Hillshading by wmflabs.org', maxZoom: 15},
                );
            }
            this.map.addLayer(this.hillshading_layer);
        } else if (this.hillshading_layer) {
            this.map.removeLayer(this.hillshading_layer);
        }
    }

    public set_german_npa(enabled: boolean): void {
        if (this.german_npa_enabled === enabled) {
            return;
        }

        this.german_npa_enabled = enabled;
        if (enabled) {
            if (!this.german_npa_layer) {
                this.german_npa_layer = L.tileLayer.wms("https://geodienste.bfn.de/ogc/wms/schutzgebiet?", {
                    layers: 'Naturschutzgebiete',
                    format: 'image/png',
                    transparent: true,
                    opacity: 0.5,
                    attribution: "Bundesamt für Naturschutz (BfN)"
                });
            }
            this.map.addLayer(this.german_npa_layer);
        } else if (this.german_npa_layer) {
            this.map.removeLayer(this.german_npa_layer);
        }
    }

    public set_map_view(center: Coordinates, zoom: number): void {
        this.automatic_event = true;
        this.map.setView(from_coordinates(center), zoom, {animate: false});
        this.automatic_event = false;
    }

    public invalidate_size(): void {
        this.map.invalidateSize();
    }

    protected create_marker_object(marker: Marker): void {
        const self = this;

        const obj = {
            marker_obj: L.marker(from_coordinates(marker.coordinates), {
                draggable: true,
                autoPan: true,
                icon: this.create_icon(marker),
            }),
            circle_obj: null,
            last_name: marker.name,
            last_color: marker.color,
        };
        obj.marker_obj.addTo(this.map);


        obj.marker_obj.on('drag', (): void => {
            self.app.map_state.set_marker_coordinates(
                marker.get_id(),
                to_coordinates(obj.marker_obj.getLatLng())
            );
            if (obj.circle_obj) {
                const center = to_coordinates(obj.marker_obj.getLatLng());
                const points = center
                    .geodesic_circle(marker.radius)
                    .map(from_coordinates);
                obj.circle_obj.setLatLngs(points);
            }
        });

        obj.marker_obj.on('contextmenu', (event: L.LeafletMouseEvent): boolean => {
            self.app.map_menu.showMarker(
                self,
                event.containerPoint.x,
                event.containerPoint.y,
                marker,
            );
            return false;
        });

        this.markers.set(marker.get_id(), obj);

        this.update_marker_object(obj, marker);
    }

    protected update_marker_object(obj: MarkerObjDict, marker: Marker): void {
        obj.marker_obj.setLatLng(from_coordinates(marker.coordinates));
        if (marker.radius > 0) {
            if (!obj.circle_obj) {
                obj.circle_obj = L.polygon([], {
                    color: marker.color.to_hash_string(),
                    weight: 1,
                    interactive: false,
                }).addTo(this.map);
            }
            obj.circle_obj.setLatLngs(
                marker.coordinates
                    .geodesic_circle(marker.radius)
                    .map(from_coordinates),
            );
        } else if (obj.circle_obj) {
            this.map.removeLayer(obj.circle_obj);
            obj.circle_obj = null;
        }

        if (
            !marker.color.equals(obj.last_color) ||
            marker.name !== obj.last_name
        ) {
            obj.marker_obj.setIcon(this.create_icon(marker));
        }
        if (obj.circle_obj && !marker.color.equals(obj.last_color)) {
            obj.circle_obj.setStyle({color: marker.color.to_hash_string()});
        }

        obj.last_color = marker.color;
        obj.last_name = marker.name;
    }

    public delete_marker_object(obj: MarkerObjDict): void {
        if (obj.circle_obj) {
            this.map.removeLayer(obj.circle_obj);
        }
        this.map.removeLayer(obj.marker_obj);
    }

    public create_line_object(line: Line): void {
        if (
            !this.has_marker_object(line.marker1) ||
            !this.has_marker_object(line.marker2)
        ) {
            return;
        }

        const obj = {
            line_obj: L.polyline([], {
                color: line.color.to_hash_string(),
                weight: 2,
                interactive: false,
            }),
            arrow_obj: L.polyline([], {
                color: line.color.to_hash_string(),
                weight: 2,
                interactive: false,
            }),
            last_color: line.color,
        };

        obj.line_obj.addTo(this.map);
        obj.arrow_obj.addTo(this.map);

        this.lines.set(line.get_id(), obj);

        this.update_line_object(obj, line);
    }

    private arrow_head(p1: L.LatLng, p2: L.LatLng): L.LatLng[] {
        const compute_heading = (a: L.Point, b: L.Point): number =>
            ((Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI + 90 + 360) %
            360

        const headAngle = 60;
        const pixelSize = 10;
        const d2r = Math.PI / 180;
        const zoom = this.map.getZoom();
        const prevPoint = this.map.project(p1, zoom);
        const tipPoint = this.map.project(p2, zoom);
        if (
            Math.abs(prevPoint.x - tipPoint.x) <= 1 &&
            Math.abs(prevPoint.y - tipPoint.y) <= 1
        ) {
            return [];
        }
        const heading = compute_heading(prevPoint, tipPoint);
        const direction = -(heading - 90) * d2r;
        const radianArrowAngle = (headAngle / 2) * d2r;

        const headAngle1 = direction + radianArrowAngle;
        const headAngle2 = direction - radianArrowAngle;
        const arrowHead1 = L.point(
            tipPoint.x - pixelSize * Math.cos(headAngle1),
            tipPoint.y + pixelSize * Math.sin(headAngle1),
        );
        const arrowHead2 = L.point(
            tipPoint.x - pixelSize * Math.cos(headAngle2),
            tipPoint.y + pixelSize * Math.sin(headAngle2),
        );

        return [
            this.map.unproject(arrowHead1, zoom),
            p2,
            this.map.unproject(arrowHead2, zoom),
        ];
    }

    public update_line_object(obj: LineObjDict, line: Line): void {
        if (
            !this.has_marker_object(line.marker1) ||
            !this.has_marker_object(line.marker2)
        ) {
            this.delete_line_object(obj);
            this.lines.delete(line.get_id());
            return;
        }

        const path = this.app.map_state
            .get_marker(line.marker1)
            .coordinates.interpolate_geodesic_line(
                this.app.map_state.get_marker(line.marker2).coordinates,
                this.app.map_state.zoom,
            );
        const leaflet_path = path.map(from_coordinates);
        obj.line_obj.setLatLngs(leaflet_path);
        if (leaflet_path.length <= 1) {
            obj.arrow_obj.setLatLngs([]);
        } else {
            const last = leaflet_path[leaflet_path.length - 1];
            const last1 = leaflet_path[leaflet_path.length - 2];
            obj.arrow_obj.setLatLngs(this.arrow_head(last1, last));
        }

        if (!line.color.equals(obj.last_color)) {
            obj.line_obj.setStyle({
                color: line.color.to_hash_string(),
            });
            obj.arrow_obj.setStyle({
                color: line.color.to_hash_string(),
            });
            obj.last_color = line.color;
        }
    }

    public delete_line_object(obj: LineObjDict): void {
        this.map.removeLayer(obj.arrow_obj);
        this.map.removeLayer(obj.line_obj);
    }

    public create_icon(marker: Marker): L.Icon {
        const icon = this.app.icon_factory.create_map_icon(
            marker.name,
            marker.color,
        );
        return L.icon({
            iconUrl: icon.url,
            iconSize: L.point(icon.size[0], icon.size[1]),
            iconAnchor: L.point(icon.anchor[0], icon.anchor[1]),
        });
    }
}
