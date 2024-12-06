import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { VGAPlugin } from "../../utils/plugin";

import styles from "./core-sidebar-item-container.css?inline";

@customElement("vga-core-sidebar-item-container")
export class VGACoreSidebarItemContainer extends LitElement {
  static styles = [css([styles] as any)];

  @property({ reflect: true }) header?: string;
  @property() containerProps?: { slot?: string };
  @property() showContentInlargeViewCallback?: (content: VGAPlugin) => void;

  updated() {
    this.setAttribute("slot", this.containerProps?.slot ?? "");
  }

  render() {
    return this.containerProps?.slot === "top"
      ? this.renderContent()
      : html`
          <vga-ui-collapse>${this.renderContent()}</vga-ui-collapse>
        `;
  }

  private renderContent() {
    return html`
      <div
        part="header"
        slot=${this.containerProps?.slot === "top" ? "" : "header"}
      >
        <span>${this.header}</span>
        <button
          id="show-in-large-view-button"
          @click=${(event: Event) => {
            event.preventDefault();
            this.showContentInlargeViewCallback?.(this.firstChild as VGAPlugin);
          }}
        >
          ⛶
        </button>
      </div>
      <div part="content">
        <slot></slot>
      </div>
    `;
  }
}
