import ClipboardJS from "clipboard";

import {App} from "./app";

interface IClipboardJsEvent {
    action: string;
    text: string;
    trigger: Element;
    clearSelection(): void;
}

export class LinkDialog {
    private readonly div: HTMLElement;
    private readonly app: App;
    private readonly clipboard: ClipboardJS;

    public constructor(app: App) {
        this.div = document.querySelector("#link-dialog")!;
        this.app = app;
        this.clipboard = new ClipboardJS("#link-dialog-copy-button");
        this.clipboard.on("success", (e: IClipboardJsEvent): void => {
            this.app.message(this.app.translate("dialog.link.copied-message").replace("{1}", e.text));
        });
        this.clipboard.on("error", (_e: IClipboardJsEvent): void => {
            this.app.message_error(
                this.app.translate("dialog.link.failed-message"),
            );
        });

        this.div.querySelectorAll("[data-cancel]").forEach((element: HTMLElement): void => {
            element.addEventListener("click", (): void => {
                this.hide();
            });
        });
    }

    public show(): void {
        this.div.classList.add("is-active");
        const link = this.app.map_state.create_link();
        (document.querySelector("#link-dialog-input") as HTMLInputElement).value = link;
    }

    public hide(): void {
        this.div.classList.remove("is-active");
    }
}
