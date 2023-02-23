import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { when } from "lit/directives/when.js";

import styles from "./gwf-vis-ui-button.css?inline";

export type ButtonVariant = "solid" | "hollow" | "clear" | "round" | "link";

@customElement("gwf-vis-ui-button")
export default class GWFVisUIButton extends LitElement {
  static styles = [css([styles] as any)];

  @property({ reflect: true }) variant: ButtonVariant = "solid";
  @property({ reflect: true }) href?: string;
  @property({ reflect: true, type: Boolean }) disabled: boolean = false;

  render() {
    return html`
      ${when(this.href, () => this.renderHrefHandler())}
      <div id="container">
        <slot></slot>
      </div>
    `;
  }

  renderHrefHandler() {
    return html` <a id="href-handler" href=${ifDefined(this.href)}></a> `;
  }
}
