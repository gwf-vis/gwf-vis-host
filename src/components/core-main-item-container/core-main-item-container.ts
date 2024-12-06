import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { VGAPlugin } from "../../utils/plugin";

import styles from "./core-main-item-container.css?inline";

@customElement("vga-core-main-item-container")
export class VGACoreMainItemContainer extends LitElement {
  static styles = [css([styles] as any)];

  @property({ reflect: true }) header?: string;
  @property() containerProps?: { width?: string };
  @property() showContentInlargeViewCallback?: (content: VGAPlugin) => void;

  render() {
    return html`
      <style>
        :host {
          width: ${this.containerProps?.width ?? "auto"};
        }
      </style>
      <vga-ui-collapse>
        <div part="header" slot="header">
          <span>${this.header}</span>
          <button
            id="show-in-large-view-button"
            @click=${(event: Event) => {
              event.preventDefault();
              this.showContentInlargeViewCallback?.(
                this.firstChild as VGAPlugin
              );
            }}
          >
            ⛶
          </button>
        </div>
        <div part="content">
          <slot></slot>
        </div>
      </vga-ui-collapse>
    `;
  }
}
