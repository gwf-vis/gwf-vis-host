import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import styles from "./gwf-vis-ui-collapse.css?inline";

@customElement("gwf-vis-ui-collapse")
export default class GwfVisUICollapse extends LitElement {
  static styles = [css([styles] as any)];

  @property({ type: Boolean, reflect: true }) collapsed: boolean = false;

  render() {
    return html`
      <input
        id="collapse-toggle"
        type="checkbox"
        hidden
        .checked=${this.collapsed}
        @change=${({ currentTarget }: any) =>
          (this.collapsed = (currentTarget as HTMLInputElement).checked)}
      />
      <label part="header-container" for="collapse-toggle">
        <div part="header">
          <slot name="header"></slot>
        </div>
      </label>
      <div part="content-container">
        <div part="content">
          <slot></slot>
        </div>
      </div>
    `;
  }
}
