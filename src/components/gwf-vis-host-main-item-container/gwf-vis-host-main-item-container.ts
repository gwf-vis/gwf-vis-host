import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { GWFVisPlugin } from "../../utils/plugin";

import styles from "./gwf-vis-host-main-item-container.css?inline";

@customElement("gwf-vis-host-main-item-container")
export class GWFVisHostMainItemContainer extends LitElement {
  static styles = [css([styles] as any)];

  @property({ reflect: true }) header?: string;
  @property() containerProps?: { width?: string };
  @property() showContentInlargeViewCallback?: (content: GWFVisPlugin) => void;

  render() {
    return html`
      <style>
        :host {
          width: ${this.containerProps?.width ?? "auto"};
        }
      </style>
      <gwf-vis-ui-collapse>
        <div part="header" slot="header">
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
      </gwf-vis-ui-collapse>
    `;
  }
}
