import { Component, Host, h, ComponentInterface } from '@stencil/core';

@Component({
  tag: 'gwf-main-vis',
  styleUrl: 'gwf-main-vis.css',
  shadow: true,
})
export class GwfMainVis implements ComponentInterface {
  render() {
    return (
      <Host>
        <slot>Hello World!</slot>
      </Host>
    );
  }
}
