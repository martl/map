class Sidebar extends MapStateObserver {
    constructor(sidebar_selector, sidebar_controls_selector, app) {
        super(app.map_state);

        const self = this;
        
        this.app = app;
        this.sidebar_selector = sidebar_selector;
        this.sidebar_controls_selector = sidebar_controls_selector;

        this.controls = [];
        $(".sidebar-control-button").each((index, button) => {
            const id = button.id;
            button.addEventListener('click', () => {
                self.toggle(id);
            });

            const close_button = $(`${button.dataset.container} > .header > .close`);
            close_button.click(() => {
                self.toggle(null);
            });

            self.controls.push(button);
        });

        this.sidebar_location = new SidebarLocation(app);
        this.sidebar_layers = new SidebarLayers(app);
        this.sidebar_markers = new SidebarMarkers(app);
    }

    toggle (toggle_control_id) {
        if ((!toggle_control_id) || $(`#${toggle_control_id}`).parent().hasClass('active')) {
            this.map_state.set_sidebar_open(null);
        } else {
            this.map_state.set_sidebar_open(toggle_control_id);
        }
    }

    update_state() {
        const section = this.map_state.sidebar_open;

        if (!section) {
            this.controls.forEach((control) => {
                const parent = control.parentElement;
                const container = $(control.dataset.container);
                parent.classList.remove('active');
                container.removeClass('active');
            });

            $(this.sidebar_selector).removeClass('sidebar-open');
            $(this.sidebar_controls_selector).removeClass('sidebar-open');
            $(".map-container").each((index, obj) => {
                obj.classList.remove('sidebar-open');
            });
        } else {
            let found = false;
            this.controls.forEach((control) => {
                const parent = control.parentElement;
                const container = $(control.dataset.container);
                if (section == control.id) {
                    found = true;
                    parent.classList.add('active');
                    container.addClass('active');
                } else {
                    parent.classList.remove('active');
                    container.removeClass('active');
                }
            });

            if (!found) {
                const control = this.controls[0];
                control.parentElement.classList.add('active');
                $(control.dataset.container).addClass('active');
            }

            $(this.sidebar_selector).addClass('sidebar-open');
            $(this.sidebar_controls_selector).addClass('sidebar-open');
            $(".map-container").each((index, obj) => {
                obj.classList.add('sidebar-open');
            });
        }

        this.app.update_geometry();
    }
}
