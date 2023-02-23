import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";

import styles from "./gwf-vis-ui-input.css?inline";

export type InputType = "text" | "number" | "password";

@customElement("gwf-vis-ui-input")
export class GWFVisUIInput extends LitElement {
  static styles = [css([styles] as any)];

  @property({ reflect: true }) type: InputType = "text";
  @property({ reflect: true }) value?: string;
  @property({ reflect: true, type: Number }) min?: number;
  @property({ reflect: true, type: Number }) max?: number;
  @property({ reflect: true }) placeholder?: string;
  @property({ reflect: true, type: Boolean }) disabled: boolean = false;

  render() {
    return html`
      <div>
        <slot name="before"></slot>
        <input
          part="native"
          type=${this.type}
          min=${ifDefined(this.min)}
          max=${ifDefined(this.min)}
          value=${ifDefined(this.value)}
          ?disabled=${this.disabled}
          placeholder=${ifDefined(this.placeholder)}
          @change=${this.handleOnChangeEvent}
          @input=${this.handleOnInputEvent}
        />
        <slot name="after"></slot>
      </div>
    `;
  }

  private handleOnChangeEvent = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    this.value = (event.currentTarget as HTMLInputElement).value;
    this.dispatchEvent(
      new CustomEvent("change", {
        detail: { value: this.value, innerEvent: event },
        bubbles: true,
        composed: true,
        cancelable: true,
      })
    );
  };

  private handleOnInputEvent = (event: InputEvent) => {
    event.preventDefault();
    event.stopPropagation();
    this.dispatchEvent(
      new CustomEvent("input", {
        detail: { innerEvent: event },
        bubbles: true,
        composed: true,
        cancelable: true,
      })
    );
  };
}
