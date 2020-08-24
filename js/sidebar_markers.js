import $ from 'jquery';

import {Color} from './color.js';
import {Coordinates, CoordinatesFormat} from './coordinates.js';
import {MapStateChange, MapStateObserver} from './map_state.js';
import {
    parse_float,
    parse_int,
    create_button,
    create_dropdown,
    create_text_input,
    create_color_input,
} from './utilities.js';

export class SidebarMarkers extends MapStateObserver {
    constructor(app) {
        super(app);

        const self = this;

        $('#btn-add-marker').click(() => {
            self.map_state.add_marker();
        });
        $('#btn-delete-markers').click(() => {
            self.map_state.delete_all_markers();
        });

        this.settingsDiv = $('#marker-settings');
        this.hide_settings();
        [
            {id: CoordinatesFormat.D, name: 'Degrees'},
            {id: CoordinatesFormat.DM, name: 'Degrees+Minutes'},
            {id: CoordinatesFormat.DMS, name: 'Degrees+Minutes+Seconds'},
        ].forEach((item) => {
            const option = $(`<option value="${item.id}">${item.name}</option>`);
            option.text(item.name);
            if (item.id === Coordinates.get_coordinates_format()) {
                option.prop('selected', true);
            }
            this.settingsDiv.find('[data-coordinates-format]').append(option);
        });
        $('#btn-marker-settings').click(() => {
            self.toggle_settings();
        });
        this.settingsDiv.find('[data-cancel]').click(() => {
            self.hide_settings();
        });
        this.settingsDiv.find('[data-submit]').click(() => {
            self.submit_settings();
        });
    }

    update_state(changes) {
        if ((changes & MapStateChange.MARKERS) == MapStateChange.NOTHING) {
            return;
        }

        const self = this;

        /* update and add markers */
        this.map_state.markers.forEach((marker) => {
            if ($(`#marker-${marker.get_id()}`).length == 0) {
                $('#markers').append(self.create_div(marker));
            }
            const div = $(`#marker-${marker.get_id()}`);

            const circle =
                marker.radius > 0
                    ? `Circle: ${marker.radius.toFixed(2)} m`
                    : 'No circle';
            div.find('.marker-color').css(
                'background-color',
                marker.color.to_hash_string(),
            );
            div.find('.marker-name').text(marker.name);
            div.find('.marker-radius').text(circle);
            div.find('.marker-coordinates').text(
                marker.coordinates.to_string_format(
                    self.map_state.settings_marker_coordinates_format,
                ),
            );

            self.update_edit_values(marker);
        });

        /* remove spurious markers */
        const markers = $('#markers > .marker');
        if (markers.length > this.map_state.markers.length) {
            const ids = new Set();
            this.map_state.markers.forEach((marker) => {
                ids.add(marker.get_id());
            });

            const deleted_ids = [];
            markers.each((i, m) => {
                const id = parse_int(m.id.substring(7));
                if (!ids.has(id)) {
                    deleted_ids.push(id);
                }
            });

            deleted_ids.forEach((id) => {
                $(`#marker-${id}`).remove();
                $(`#marker-edit-${id}`).remove();
            });
        }

        this.update_settings_display();
    }

    create_div(marker) {
        const self = this;
        const m = $(`<div id="marker-${marker.get_id()}" class="marker">`);

        const left = $(`<div class="marker-left">
            <div class="marker-color"></div>
        </div>`);
        m.append(left);

        const center = $(`<div class="marker-center">
            <div class="marker-name"></div>
            <div class="marker-coordinates"></div>
            <div class="marker-radius"></div>
        </div>`);
        m.append(center);

        const right = $('<div class="marker-right"></div>');
        right.append(this.create_marker_dropdown(marker));
        m.append(right);

        m.click(() => {
            self.map_state.set_center(marker.coordinates, null);
        });

        return m;
    }

    create_edit_div(marker) {
        const self = this;
        const div = $(`<div id="marker-edit-${marker.get_id()}" class="edit">`);

        const name = create_text_input('Name', 'data-name', 'Name');
        const coordinates = create_text_input(
            'Coordinates',
            'data-coordinates',
            'Coordinates',
        );
        const radius = create_text_input(
            'Circle Radius (m)',
            'data-radius',
            'Circle Radius',
        );
        const color = create_color_input('Color', 'data-color', 'Color');

        const submit_button = create_button('Submit', () => {
            self.submit_edit(marker);
        });
        const cancel_button = create_button('Cancel', () => {
            div.remove();
        });
        const buttons = $('<div class="field is-grouped">')
            .append(submit_button)
            .append(cancel_button);

        div.append(name)
            .append(coordinates)
            .append(radius)
            .append(color)
            .append(buttons);

        return div;
    }

    create_marker_dropdown(marker) {
        const self = this;
        return create_dropdown(`dropdown-marker-${marker.get_id()}`, [
            {
                label: 'Edit',
                callback: () => {
                    if ($(`#marker-edit-${marker.get_id()}`).length == 0) {
                        self.create_edit_div(marker).insertAfter(
                            `#marker-${marker.get_id()}`,
                        );
                        self.update_edit_values(marker);
                    }
                },
            },
            {
                label: 'Waypoint Projection',
                callback: () => {
                    self.app.show_projection_dialog(marker);
                },
            },
            {
                label: 'Delete',
                callback: () => {
                    self.map_state.delete_marker(marker.get_id());
                },
            },
        ]);
    }

    update_edit_values(marker) {
        const div = $(`#marker-edit-${marker.get_id()}`);
        if (div.length == 0) {
            return;
        }
        div.find('[data-name]').val(marker.name);
        div.find('[data-coordinates]').val(
            marker.coordinates.to_string_format(
                this.map_state.settings_marker_coordinates_format,
            ),
        );
        div.find('[data-radius]').val(marker.radius);
        div.find('[data-color]').val(marker.color.to_hash_string());
    }

    submit_edit(marker) {
        const div = $(`#marker-edit-${marker.get_id()}`);
        const name = div.find('[data-name]').val();
        const coordinates = Coordinates.from_string(
            div.find('[data-coordinates]').val(),
        );
        const radius = parse_float(div.find('[data-radius]').val());
        const color = Color.from_string(div.find('[data-color]').val());

        if (name.length == 0 || !coordinates || radius === null || !color) {
            this.app.message_error('Bad values.');
            return;
        }

        div.remove();

        marker.name = name;
        marker.coordinates = coordinates;
        marker.radius = radius;
        marker.color = color;
        this.map_state.update_marker_storage(marker);
        this.map_state.update_observers(MapStateChange.MARKERS);
    }

    settings_shown() {
        return !this.settingsDiv.hasClass('is-hidden');
    }

    show_settings() {
        if (this.settings_shown()) {
            return;
        }

        this.settingsDiv.removeClass('is-hidden');
        this.update_settings_display();
    }

    hide_settings() {
        this.settingsDiv.addClass('is-hidden');
    }

    toggle_settings() {
        if (this.settings_shown()) {
            this.hide_settings();
        } else {
            this.show_settings();
        }
    }

    submit_settings() {
        const coordinates_format = parseInt(
            this.settingsDiv.find('[data-coordinates-format]').val(),
            10,
        );
        const random_color = this.settingsDiv
            .find('[data-random-color]')
            .prop('checked');
        const color = Color.from_string(
            this.settingsDiv.find('[data-color]').val(),
        );
        const radius = parse_float(this.settingsDiv.find('[data-radius]').val());

        if (color === null || radius === null) {
            this.app.message_error('Bad values.');
            return;
        }

        this.map_state.set_default_marker_settings({
            coordinates_format: coordinates_format,
            random_color: random_color,
            color: color,
            radius: radius,
        });

        this.hide_settings();
    }

    update_settings_display() {
        if (!this.settings_shown()) {
            return;
        }

        this.settingsDiv
            .find('[data-coordinates-format]')
            .val(this.map_state.settings_marker_coordinates_format);
        this.settingsDiv
            .find('[data-random-color]')
            .prop('checked', this.map_state.settings_marker_random_color);
        this.settingsDiv
            .find('[data-color]')
            .val(this.map_state.settings_marker_color.to_hash_string());
        this.settingsDiv
            .find('[data-radius]')
            .val(this.map_state.settings_marker_radius);
    }
}
