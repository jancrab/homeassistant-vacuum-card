import { LitElement, html, nothing } from 'lit';
import { isUnavailable } from './model.js';

// HA owns image authentication, refresh and more-info. Mount only while expanded.
export class VacuumMap extends LitElement {
  static properties = { hass: { attribute: false, hasChanged: () => true }, entity: {}, _card: { state: true }, _error: { state: true } };
  createRenderRoot() { return this; }
  disconnectedCallback() { this._request = undefined; this._loaded = undefined; this._card = undefined; super.disconnectedCallback(); }
  updated(changed) {
    if (this._loaded !== this.entity && this.isConnected) this._load();
    if (this._card && (changed.has('hass') || changed.has('_card'))) this._card.hass = this.hass;
  }
  async _load() {
    const entity = this._loaded = this.entity, request = this._request = {};
    this._card = undefined; this._error = false;
    try {
      if (!/^(image|camera)\.[a-z0-9_]+$/.test(entity || '')) throw new Error('Select a map entity');
      const helpers = await window.loadCardHelpers();
      if (this._request !== request || this.entity !== entity || !this.isConnected) return;
      const card = helpers.createCardElement({ type: 'picture-entity', entity, show_name: false, show_state: false, camera_view: 'auto', tap_action: { action: 'more-info' }, hold_action: { action: 'none' } });
      card.hass = this.hass; this._card = card;
    } catch { if (this._request === request) this._error = true; }
  }
  render() {
    if (isUnavailable(this.hass?.states?.[this.entity])) return html`<p class="hint" role="status">Map unavailable. Check the selected image or camera entity.</p>`;
    if (this._error) return html`<p class="hint" role="alert">Could not load the map.</p><button @click=${() => this._load()}>Retry map</button>`;
    return this._card || (this.entity ? html`<p class="hint" role="status">Loading map…</p>` : nothing);
  }
}
if (!customElements.get('vacuum-card-map')) customElements.define('vacuum-card-map', VacuumMap);
