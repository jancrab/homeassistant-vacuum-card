import { LitElement, html, nothing } from 'lit';
import { validateConfig, isUnavailable, formatState, metric, roomName, roomAction, roomBlocked, alerts } from './model.js';
import { cardStyles } from './styles.js';
import './editor.js';
export { validateConfig } from './model.js';

export class VacuumCard extends LitElement {
  static properties = {
    hass: { attribute: false, hasChanged: () => true },
    _states: { state: true, hasChanged: () => true }, _config: { state: true },
    _pending: { state: true }, _feedback: { state: true }, _failed: { state: true },
  };
  static styles = cardStyles;

  connectedCallback() {
    super.connectedCallback();
    const request = new CustomEvent('context-request', { bubbles: true, composed: true, cancelable: true });
    request.context = 'states';
    request.subscribe = true;
    request.callback = (states, unsubscribe) => { this._states = states; this._unsubscribe = unsubscribe; };
    this.dispatchEvent(request);
  }
  disconnectedCallback() {
    this._unsubscribe?.(); this._unsubscribe = undefined; this._states = undefined;
    super.disconnectedCallback();
  }
  setConfig(config) { this._config = validateConfig(config); this._feedback = ''; }
  get states() { return this._states || this.hass?.states || {}; }
  static getStubConfig(hass) {
    return { entity: Object.keys(hass?.states || {}).find(id => id.startsWith('vacuum.')) || 'vacuum.example', rooms: [] };
  }
  static async getConfigElement() {
    if (!customElements.get('ha-form')) {
      const helpers = await window.loadCardHelpers();
      await helpers.createCardElement({ type: 'entities', entities: [] }).constructor.getConfigElement();
    }
    return document.createElement('homeassistant-vacuum-card-editor');
  }
  getCardSize() { return 4 + Math.ceil((this._config?.rooms.length || 0) / 2) * 2; }
  getGridOptions() { return { columns: this._config?.layout === 'wide' ? 12 : 6, min_columns: 6 }; }
  _details() {
    this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId: this._config.entity }, bubbles: true, composed: true }));
  }
  async _clean(room, index) {
    if (this._pending !== undefined || roomBlocked(room, this._config, this.states, this.hass)) return;
    const config = this._config, action = roomAction(room.entity), name = roomName(room, this.states);
    this._pending = index; this._feedback = ''; this._failed = false;
    try {
      await this.hass.callService(action.domain, action.service, action.data);
      if (this._config === config) this._feedback = `Command sent: ${name}. Robot status updates from Home Assistant.`;
    } catch (error) {
      if (this._config === config) {
        this._failed = true;
        this._feedback = `Could not start ${name}: ${error?.message || 'Home Assistant rejected the action'}. Try again.`;
      }
    } finally { this._pending = undefined; }
  }
  _stat(label, value) { return html`<div class="stat"><span>${label}</span><strong>${value}</strong></div>`; }
  render() {
    if (!this._config) return nothing;
    const config = this._config, states = this.states, vacuum = states[config.entity];
    const status = config.status_entity ? states[config.status_entity] : vacuum;
    const battery = metric(config, states, 'battery_entity', 'battery_level');
    const progress = metric(config, states, 'progress_entity', 'cleaning_progress');
    const issues = alerts(config, states, this.hass), active = vacuum?.state === 'cleaning';
    return html`
      <ha-card class=${config.layout}>
        <div class="hero">
          <div class="heading"><span class="name">${config.name || vacuum?.attributes?.friendly_name || config.entity}</span><button class="details" aria-label="Open robot details" @click=${this._details}><ha-icon icon="mdi:robot-vacuum" aria-hidden="true"></ha-icon></button></div>
          <h1 role="status">${isUnavailable(vacuum) ? 'Unavailable' : formatState(this.hass, status)}</h1>
          ${config.status_entity && status?.state !== vacuum?.state && !isUnavailable(vacuum) ? html`<p class="robot-state">${formatState(this.hass, vacuum)}</p>` : nothing}
          <div class="stats">
            ${this._stat('Battery', battery === null ? '—' : `${battery} %`)}
            ${[['cleaning_area_entity', 'Cleaned area'], ['cleaning_time_entity', 'Cleaning time']].map(([field, label]) => config[field] ? this._stat(label, isUnavailable(states[config[field]]) ? '—' : this.hass?.formatEntityState ? formatState(this.hass, states[config[field]]) : `${states[config[field]].state} ${states[config[field]].attributes?.unit_of_measurement || ''}`) : nothing)}
          </div>
          ${progress !== null ? html`<div class="progress"><div class="progress-label"><span>${active ? 'Cleaning progress' : 'Last reported progress'}</span><span>${progress} %</span></div><progress aria-label="Cleaning progress" max="100" .value=${progress}></progress></div>` : config.progress_entity ? html`<p class="hint">Cleaning progress unavailable</p>` : nothing}
        </div>
        ${issues.length ? html`<div class="alerts">${issues.map(issue => html`<div class="alert ${issue.unavailable ? 'unavailable' : ''}" role=${issue.unavailable ? 'status' : 'alert'}><ha-icon icon=${issue.unavailable ? 'mdi:information-outline' : 'mdi:alert-circle-outline'} aria-hidden="true"></ha-icon><div><strong>${issue.label}</strong>${issue.text}</div></div>`)}</div>` : nothing}
        <section class="rooms-section" aria-label="Room cleaning">
          <h2>Clean a room</h2><p class="hint">${config.rooms.length ? 'Tap a room to start its cleaning routine.' : 'Add rooms and their cleaning controls in the card editor.'}</p>
          <div class="rooms">${config.rooms.map((room, index) => {
            const name = roomName(room, states), blocked = roomBlocked(room, config, states, this.hass), pending = this._pending === index;
            return html`<button class="room" ?disabled=${Boolean(blocked) || this._pending !== undefined} aria-label=${`Clean ${name}`} aria-busy=${String(pending)} title=${blocked || `Clean ${name}`} @click=${() => this._clean(room, index)}><ha-icon icon=${room.icon || states[room.entity]?.attributes?.icon || 'mdi:floor-plan'} aria-hidden="true"></ha-icon><span>${name}</span><small>${pending ? 'Sending…' : blocked || 'Start cleaning'}</small></button>`;
          })}</div>
          <p class="feedback ${this._failed ? 'error' : ''}" role=${this._failed ? 'alert' : 'status'} aria-live="polite">${this._feedback || ''}</p>
        </section>
      </ha-card>`;
  }
}
if (!customElements.get('homeassistant-vacuum-card')) customElements.define('homeassistant-vacuum-card', VacuumCard);
window.customCards = window.customCards || [];
if (!window.customCards.some(card => card.type === 'homeassistant-vacuum-card')) window.customCards.push({ type: 'homeassistant-vacuum-card', name: 'Vacuum Card', preview: true, description: 'Room cleaning controls and robot health, configured in the visual editor.' });
console.info(`Vacuum Card ${__VERSION__}`);
