import { LitElement, html, css, nothing } from 'lit';
const domain = "vacuum";
export function validateConfig(config) {
  if (!config || !/^[a-z][a-z0-9_]*\.[a-z0-9_]+$/.test(config.entity || '') || (domain && !config.entity.startsWith(`${domain}.`))) throw new Error(`Select a valid ${domain || 'Home Assistant'} entity.`);
  if (config.layout !== undefined && !['compact', 'wide'].includes(config.layout)) throw new Error('Layout must be compact or wide.');
  if (config.name !== undefined && typeof config.name !== 'string') throw new Error('Name must be text.');
  return { layout: 'compact', ...config };
}
export class StarterCard extends LitElement {
  static properties = { hass: { attribute: false, hasChanged: () => true }, _states: { state: true, hasChanged: () => true }, _config: { state: true } };
  connectedCallback() {
    super.connectedCallback();
    const request = new CustomEvent('context-request', { bubbles: true, composed: true, cancelable: true });
    request.context = 'states';
    request.subscribe = true;
    request.callback = (states, unsubscribe) => { this._states = states; this._unsubscribe = unsubscribe; };
    this.dispatchEvent(request);
  }
  disconnectedCallback() { this._unsubscribe?.(); this._unsubscribe = undefined; this._states = undefined; super.disconnectedCallback(); }
  setConfig(config) { this._config = validateConfig(config); }
  static getStubConfig(hass) { return { entity: Object.keys(hass?.states || {}).find(id => !domain || id.startsWith(`${domain}.`)) || 'vacuum.example' }; }
  static async getConfigElement() {
    if (!customElements.get('ha-form')) {
      const helpers = await window.loadCardHelpers();
      await helpers.createCardElement({ type: 'entities', entities: [] }).constructor.getConfigElement();
    }
    return document.createElement('homeassistant-vacuum-card-editor');
  }
  getCardSize() { return 1; }
  getGridOptions() { return { columns: this._config?.layout === 'wide' ? 12 : 6, min_columns: 6 }; }
  render() {
    if (!this._config) return nothing;
    const state = (this._states || this.hass?.states)?.[this._config.entity];
    const unavailable = !state || ['unknown', 'unavailable'].includes(state.state);
    return html`<ha-card class=${this._config.layout}><button aria-label="Open entity details" @click=${() => this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId: this._config.entity }, bubbles: true, composed: true }))}><span class="name">${this._config.name || state?.attributes?.friendly_name || this._config.entity}</span><span class="state" role="status">${unavailable ? 'Unavailable' : state.state}</span></button></ha-card>`;
  }
  static styles = css`
    :host { display: block; color: var(--primary-text-color); font-family: var(--paper-font-body1_-_font-family, inherit); }
    ha-card { display: block; padding: 12px; background: var(--ha-card-background, var(--card-background-color, white)); border: 1px solid var(--ha-card-border-color, var(--divider-color, #ddd)); border-radius: var(--ha-card-border-radius, 16px); box-shadow: var(--ha-card-box-shadow, none); }
    button { min-height: 44px; width: 100%; border: 0; border-radius: 8px; background: transparent; color: inherit; font: inherit; text-align: left; cursor: pointer; }
    button:focus-visible { outline: 2px solid var(--primary-color, #2196f3); outline-offset: 2px; }
    .name, .state { display: block; overflow-wrap: anywhere; }
    .name { font-size: 14px; font-weight: 600; }
    .state { color: var(--secondary-text-color, #666); font-size: 12px; margin-top: 4px; }
    .wide button { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
  `;
}
class StarterEditor extends LitElement {
  static properties = { hass: { attribute: false, hasChanged: () => true }, _config: { state: true } };
  setConfig(config) { this._config = { ...config }; }
  render() {
    if (!this.hass || !this._config) return nothing;
    const schema = [{ name: 'entity', required: true, selector: { entity: domain ? { domain } : {} } }, { name: 'layout', selector: { select: { options: ['compact', 'wide'] } } }, { name: 'name', selector: { text: {} } }];
    return html`<ha-form .hass=${this.hass} .data=${{ layout: 'compact', ...this._config }} .schema=${schema} .computeLabel=${field => ({ entity: 'Entity', layout: 'Layout', name: 'Name (optional)' })[field.name]} @value-changed=${event => { event.stopPropagation(); this._config = { ...this._config, ...event.detail.value }; this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this._config }, bubbles: true, composed: true })); }}></ha-form>`;
  }
}
if (!customElements.get('homeassistant-vacuum-card')) customElements.define('homeassistant-vacuum-card', StarterCard);
if (!customElements.get('homeassistant-vacuum-card-editor')) customElements.define('homeassistant-vacuum-card-editor', StarterEditor);
window.customCards = window.customCards || [];
if (!window.customCards.some(card => card.type === 'homeassistant-vacuum-card')) window.customCards.push({ type: 'homeassistant-vacuum-card', name: 'Vacuum Card', preview: true, description: 'Home Assistant custom dashboard card' });
console.info(`Vacuum Card ${__VERSION__}`);
