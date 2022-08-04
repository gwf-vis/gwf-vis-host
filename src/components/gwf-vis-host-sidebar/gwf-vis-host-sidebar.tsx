import { Component, Host, h, ComponentInterface, Prop } from '@stencil/core';
import { GwfVisHost } from '../gwf-vis-host/gwf-vis-host';

@Component({
  tag: 'gwf-vis-host-sidebar',
  styleUrl: 'gwf-vis-host-sidebar.css',
  shadow: true,
})
export class GwfVisHostSidebar implements ComponentInterface {
  @Prop() visHost: GwfVisHost;
  @Prop({ reflect: true, mutable: true }) active: boolean = true;

  render() {
    return (
      <Host>
        <input part="toggle" type="checkbox" checked={this.active} onChange={({ currentTarget }) => (this.active = (currentTarget as HTMLInputElement).checked)} />
        <div part="container">
          <slot>Sidebar</slot>
        </div>
      </Host>
    );
  }
}
