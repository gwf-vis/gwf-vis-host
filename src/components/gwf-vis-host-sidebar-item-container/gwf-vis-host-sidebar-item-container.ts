import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { GWFVisPlugin } from "../../utils/plugin";

import styles from "./gwf-vis-host-sidebar-item-container.css?inline";

@customElement("gwf-vis-host-sidebar-item-container")
export class GWFVisHostSidebarItemContainer extends LitElement {
  static styles = [css([styles] as any)];

  @property({ reflect: true }) header?: string;
  @property() containerProps?: { slot?: string };
  @property() showContentInlargeViewCallback?: (content: GWFVisPlugin) => void;

  updated() {
    this.setAttribute("slot", this.containerProps?.slot ?? "");
  }

  render() {
    return this.containerProps?.slot === "top"
      ? this.renderContent()
      : html`
          <gwf-vis-ui-collapse>${this.renderContent()}</gwf-vis-ui-collapse>
        `;
  }

  private renderContent() {
    return html`
      <div
        part="header"
        slot=${this.containerProps?.slot === "top" ? "" : "header"}
      >
        <span .innerHTML=${this.header ?? ""}></span>
        <button
          id="show-in-large-view-button"
          @click=${(event: Event) => {
            event.preventDefault();
            this.showContentInlargeViewCallback?.(
              this.firstChild as GWFVisPlugin
            );
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
