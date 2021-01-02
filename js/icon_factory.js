import {create_element} from "./utilities.js";

export class IconFactory {
    constructor() {
        this.font = '16px sans';
        this.canvas = null;
    }

    create_map_icon(text, color) {
        const encoder = create_element('span');
        encoder.textContent = text;
        const domString = encoder.innerHTML;
        // domString is UTF-16; we need to convert it to UTF-8.
        const encoded_text = encodeURIComponent(domString).replace(
            /%([0-9A-F]{2})/g,
            (_match, p1) => {
                return String.fromCharCode(parseInt(p1, 16));
            },
        );

        const w = Math.max(
                33.0,
                16.0 + this.compute_text_width(text),
            ),
            w2 = 0.5 * w,
            d = 4.0,
            text_color = color.text_color().to_hash_string(),
            svg = `<svg
                       xmlns:svg="http://www.w3.org/2000/svg"
                       xmlns="http://www.w3.org/2000/svg"
                       width="${w}" height="37"
                       viewBox="0 0 ${w} 37"
                       version="1.1">
                     <defs>
                       <filter id="shadow" x="0" y="0" width="200%" height="200%">
                         <feOffset result="offOut" in="SourceAlpha" dx="1" dy="1" />
                         <feGaussianBlur result="blurOut" in="offOut" stdDeviation="1" />
                         <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
                       </filter>
                     </defs>
                       <path
                         fill="#7F7F7F" stroke="#7F7F7F"
                         d="M 4 4 L 4 26 L ${w2 - d} 26 L ${w2} 33 L ${
    w2 + d
} 26 L ${w - d} 26 L ${w - d} 4 L 4 4 z"
                         filter="url(#shadow)" />
                       <path
                         fill="${color.to_hash_string()}" stroke="#000000"
                         d="M 4 4 L 4 26 L ${w2 - d} 26 L ${w2} 33 L ${
    w2 + d
} 26 L ${w - d} 26 L ${w - d} 4 L 4 4 z" />
                       <text
                         style="text-anchor:middle;font-family:Arial,Helvetica,sans-serif;font-style:normal;font-weight:normal;font-size:16px;line-height:100%;font-family:sans;letter-spacing:0px;word-spacing:0px;fill:${text_color};fill-opacity:1;stroke:none;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
                         x="${w2}" y="21">${encoded_text}</text>
                   </svg>`,
            url = `data:image/svg+xml;charset=UTF-8;base64,${window.btoa(svg)}`;

        return {
            url: url,
            size: [w, 37],
            anchor: [w2, 37 - 4.0],
        };
    }

    compute_text_width(text) {
        // re-use canvas object for better performance
        if (!this.canvas) {
            this.canvas = create_element('canvas');
        }

        const context = this.canvas.getContext('2d');
        context.font = this.font;

        return context.measureText(text).width;
    }
}
