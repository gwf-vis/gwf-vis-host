import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import styles from "./gwf-vis-host-sidebar.css?inline";

@customElement("gwf-vis-host-sidebar")
export class GWFVisHostSidebar extends LitElement {
  static styles = [css([styles] as any)];

  @property({ type: Boolean, reflect: true }) active: boolean = true;

  render() {
    return html`
      <input
        id="toggle"
        hidden
        type="checkbox"
        .checked=${this.active}
        title=${this.active ? "Hide Sidebar" : "Show Sidebar"}
        @change=${({ currentTarget }: any) =>
          (this.active = (currentTarget as HTMLInputElement).checked)}
      />
      <label
        part="toggle"
        for="toggle"
        title=${this.active ? "Hide Sidebar" : "Show Sidebar"}
      ></label>
      <div part="container">
        <div part="inner-container">
          <div style="overflow: auto; flex: 0 0 auto; maxHeight: 50%;">
            <slot name="top"></slot>
          </div>
          <div style="overflow-y: auto; ">
            <slot></slot>
          </div>
        </div>
      </div>
    `;
  }
}
