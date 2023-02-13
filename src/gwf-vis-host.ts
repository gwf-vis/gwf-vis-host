import { html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("gwf-vis-host")
export default class GwfVisHost extends LitElement {
  render() {
    return html`<slot>Hello World!</slot>`;
  }
}
