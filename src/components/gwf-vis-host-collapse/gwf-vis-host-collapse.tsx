import { Component, Host, h, ComponentInterface, Prop } from '@stencil/core';

@Component({
  tag: 'gwf-vis-host-collapse',
  styleUrl: 'gwf-vis-host-collapse.css',
  shadow: true,
})
export class GwfVisHostCollapse implements ComponentInterface {
  @Prop({ reflect: true, mutable: true }) collapsed: boolean;

  render() {
    return (
      <Host>
        <input
          id="collapse-toggle"
          type="checkbox"
          hidden
          checked={this.collapsed}
          onChange={({ currentTarget }) => (this.collapsed = (currentTarget as HTMLInputElement).checked)}
        />
        <label part="header" htmlFor="collapse-toggle">
          <slot name="header"></slot>
        </label>
        <div part="content">
          <slot></slot>
        </div>
      </Host>
    );
  }
}
