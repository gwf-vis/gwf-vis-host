import { Component, Host, h, ComponentInterface, Prop } from '@stencil/core';

@Component({
  tag: 'gwf-vis-host-main-item-container',
  styleUrl: 'gwf-vis-host-main-item-container.css',
  shadow: true,
})
export class GwfVisHostMainItemContainer implements ComponentInterface {
  @Prop() header: string;

  render() {
    return (
      <Host>
        <gwf-vis-host-collapse>
          <div part="header" slot="header" innerHTML={this.header}></div>
          <div part="content">
            <slot></slot>
          </div>
        </gwf-vis-host-collapse>
      </Host>
    );
  }
}
