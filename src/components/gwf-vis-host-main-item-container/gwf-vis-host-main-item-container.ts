import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import styles from "./gwf-vis-host-main-item-container.css?inline";

@customElement("gwf-vis-host-main-item-container")
export default class GwfVisHostMainItemContainer extends LitElement {
  static styles = [css([styles] as any)];

  @property({ reflect: true }) header?: string;
  @property() containerProps?: { width?: string };

  render() {
    return html`
      <style>
        :host {
          width: ${this.containerProps?.width ?? "auto"};
        }
      </style>
      <gwf-vis-ui-collapse>
        <div part="header" slot="header" .innerHTML=${this.header ?? ""}></div>
        <div part="content">
          <slot></slot>
        </div>
      </gwf-vis-ui-collapse>
    `;
  }
}
