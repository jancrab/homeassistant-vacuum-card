import { LitElement, html, nothing } from 'lit';
import { validateConfig, isUnavailable, formatState, metric, roomName, roomAction, roomBlocked, alerts, robotMode, humanize } from './model.js';
import { robotIcon } from './robot-icon.js';
import { cardStyles } from './styles.js';
import { SensorDiscovery } from './discovery.js';
import { controls, controlBlocked, fanSpeeds } from './controls.js';
import { extraStats } from './extra-stats.js';
import './editor.js';
import './map.js';
export { validateConfig } from './model.js';

export class VacuumCard extends LitElement {
  static properties = {
    hass: { attribute: false, hasChanged: () => true },
    _states: { state: true, hasChanged: () => true }, _config: { state: true },
    _pending: { state: true }, _feedback: { state: true }, _failed: { state: true },
    _stopping: { state: true }, _mapOpen: { state: true },
  };
  static styles = cardStyles;
  constructor() { super(); this._discovery = new SensorDiscovery(this); }

  connectedCallback() {
    super.connectedCallback();
    this._inViewport = typeof IntersectionObserver === 'undefined';
    this._visibilityChanged = () => this.toggleAttribute('motion-paused', document.hidden || !this._inViewport);
    document.addEventListener('visibilitychange', this._visibilityChanged);
    if (typeof IntersectionObserver !== 'undefined') {
      this._observer = new IntersectionObserver(entries => {
        this._inViewport = entries.some(entry => entry.isIntersecting);
        this._visibilityChanged();
      });
      this._observer.observe(this);
    }
    this._visibilityChanged();
    const request = new CustomEvent('context-request', { bubbles: true, composed: true, cancelable: true });
    request.context = 'states';
    request.subscribe = true;
    request.callback = (states, unsubscribe) => { this._states = states; this._unsubscribe = unsubscribe; };
    this.dispatchEvent(request);
  }
  disconnectedCallback() {
    document.removeEventListener('visibilitychange', this._visibilityChanged);
    this._observer?.disconnect(); this._observer = undefined;
    this.setAttribute('motion-paused', '');
    this._unsubscribe?.(); this._unsubscribe = undefined; this._states = undefined;
    super.disconnectedCallback();
  }
  setConfig(config) { this._config = validateConfig(config); this._feedback = ''; this._mapOpen = false; }
  updated() {
    // Set the value after Lit has inserted options, including the initial render.
    const select = this.shadowRoot.querySelector('.fan-speed select');
    if (select) {
      const speed = this.states[this._config.entity]?.attributes?.fan_speed;
      select.value = [...select.options].some(option => option.value === speed) ? speed : '';
    }
  }
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
  getCardSize() {
    const rows = Math.ceil((this._config?.rooms.length || 0) / (this._config?.layout === 'wide' ? 3 : 2));
    const vacuum = this.states[this._config?.entity], resting = this._config && !['cleaning', 'returning'].includes(robotMode(this._discovery.config, this.states));
    const toolbar = this._config?.show_toolbar !== false && (controls(vacuum, this.hass).length || fanSpeeds(vacuum, this.hass).length) ? (resting ? 1 : 3) : 0;
    const extra = (this._config?.stats?.length ? 1 : 0) + (this._config?.map_entity ? (this._mapOpen ? 5 : 1) : 0);
    return (resting ? 2 + rows : this._config?.layout === 'compact' ? 3 + rows : 4 + rows * 2) + toolbar + extra;
  }
  getGridOptions() { return { columns: this._config?.layout === 'wide' ? 12 : 6, min_columns: 6 }; }
  _details() {
    this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId: this._config.entity }, bubbles: true, composed: true }));
  }
  async _clean(room, index) {
    if (this._pending !== undefined || this._stopping || roomBlocked(room, this._config, this.states, this.hass)) return;
    const config = this._config, action = roomAction(room.entity), name = roomName(room, this.states);
    return this._send(action, name, index, config);
  }
  async _control(service, speed) {
    const config = this._config, vacuum = this.states[config.entity], urgent = service === 'stop';
    if (config.show_toolbar === false || controlBlocked(vacuum, this.hass, service, this._pending !== undefined) || this._stopping || (!urgent && this._pending !== undefined)) return;
    if (service === 'set_fan_speed' && !fanSpeeds(vacuum, this.hass).includes(speed)) return;
    const data = { entity_id: config.entity, ...(service === 'set_fan_speed' ? { fan_speed: speed } : {}) };
    return this._send({ domain: 'vacuum', service, data }, service === 'set_fan_speed' ? `Fan speed: ${speed}` : humanize(service), service, config, urgent);
  }
  async _send(action, name, key, config, urgent = false) {
    const generation = this._commandGeneration = (this._commandGeneration || 0) + 1;
    if (urgent) this._stopping = true; else this._pending = key;
    this._feedback = ''; this._failed = false;
    try {
      await this.hass.callService(action.domain, action.service, action.data);
      if (this._config === config && this._commandGeneration === generation) this._feedback = `Command sent: ${name}. Robot status updates from Home Assistant.`;
    } catch (error) {
      if (this._config === config && this._commandGeneration === generation) {
        this._failed = true;
        this._feedback = `Could not send ${name}: ${error?.message || 'Home Assistant rejected the action'}. Try again.`;
      }
    } finally { if (urgent) this._stopping = false; else this._pending = undefined; }
  }
  _stat(label, value, icon) {
    return html`<div class="stat" data-metric=${label} title=${`${label}: ${value}`} aria-label=${`${label}: ${value}`}><ha-icon icon=${icon} aria-hidden="true"></ha-icon><strong>${value}</strong></div>`;
  }
  render() {
    if (!this._config) return nothing;
    const config = this._discovery.config, states = this.states, vacuum = states[config.entity];
    const status = config.status_entity ? states[config.status_entity] : vacuum;
    const battery = metric(config, states, 'battery_entity', 'battery_level');
    const progress = metric(config, states, 'progress_entity', 'cleaning_progress');
    const issues = alerts(config, states, this.hass), active = vacuum?.state === 'cleaning';
    const mode = robotMode(config, states);
    const resting = !['cleaning', 'returning'].includes(mode);
    const availableControls = config.show_toolbar === false ? [] : controls(vacuum, this.hass);
    const speeds = config.show_toolbar === false ? [] : fanSpeeds(vacuum, this.hass);
    const statistics = extraStats(config, states, this.hass, !resting);
    const batteryStat = this._stat('Battery', battery === null ? '—' : `${battery} %`, mode === 'charging' ? 'mdi:battery-charging' : 'mdi:battery-outline');
    return html`
      <ha-card class=${`${config.layout}${resting ? ' compact resting' : ''}`}>
        <div class="hero">
          <div class="heading">
            <div class="identity"><span class="name">${config.name || vacuum?.attributes?.friendly_name || config.entity}</span><h1 role="status">${isUnavailable(vacuum) ? 'Unavailable' : mode === 'charging' && !config.status_entity ? 'Charging' : formatState(this.hass, status)}</h1></div>
            ${resting ? batteryStat : nothing}
            <button class="details" aria-label="Open robot details" title=${`${humanize(mode)} · Open robot details`} @click=${this._details}>${robotIcon(mode)}</button>
          </div>
          ${!resting && config.status_entity && status?.state !== vacuum?.state && !isUnavailable(vacuum) ? html`<p class="robot-state">${formatState(this.hass, vacuum)}</p>` : nothing}
          ${!resting ? html`<div class="stats">
            ${batteryStat}
            ${[['cleaning_area_entity', 'Cleaned area', 'mdi:ruler-square'], ['cleaning_time_entity', 'Cleaning time', 'mdi:timer-outline']].map(([field, label, icon]) => config[field] ? this._stat(label, isUnavailable(states[config[field]]) ? '—' : this.hass?.formatEntityState ? formatState(this.hass, states[config[field]]) : `${states[config[field]].state} ${states[config[field]].attributes?.unit_of_measurement || ''}`, icon) : nothing)}
          </div>
          ${progress !== null ? html`<div class="progress"><div class="progress-label"><span>${active ? 'Cleaning progress' : 'Last reported progress'}</span><span>${progress} %</span></div><progress aria-label="Cleaning progress" max="100" .value=${progress}></progress></div>` : config.progress_entity ? html`<p class="hint">Cleaning progress unavailable</p>` : nothing}` : nothing}
        </div>
        ${issues.length ? html`<div class="alerts">${issues.map(issue => html`<div class="alert ${issue.unavailable ? 'unavailable' : ''}" role=${issue.unavailable ? 'status' : 'alert'}><ha-icon icon=${issue.unavailable ? 'mdi:information-outline' : 'mdi:alert-circle-outline'} aria-hidden="true"></ha-icon><div><strong>${issue.label}</strong>${issue.text}</div></div>`)}</div>` : nothing}
        ${availableControls.length || speeds.length ? html`<details class="extras robot-controls" ?open=${!resting}><summary>Robot controls</summary>
          <div class="toolbar">${availableControls.map(([service, label, icon]) => {
            const blocked = controlBlocked(vacuum, this.hass, service, this._pending !== undefined);
            const busy = service === 'stop' ? this._stopping : this._pending !== undefined || this._stopping;
            return html`<button class="control" data-service=${service} aria-label=${label} title=${blocked || label} ?disabled=${Boolean(blocked || busy)} aria-busy=${String(service === 'stop' ? Boolean(this._stopping) : this._pending === service)} @click=${() => this._control(service)}><ha-icon icon=${icon} aria-hidden="true"></ha-icon><span>${label}</span></button>`;
          })}</div>
          ${speeds.length ? html`<label class="fan-speed">Suction<select aria-label="Suction power" .value=${speeds.includes(vacuum?.attributes?.fan_speed) ? vacuum.attributes.fan_speed : ''} ?disabled=${Boolean(controlBlocked(vacuum, this.hass, 'set_fan_speed')) || this._pending !== undefined || this._stopping} @change=${event => { const speed = event.target.value; event.target.value = speeds.includes(vacuum?.attributes?.fan_speed) ? vacuum.attributes.fan_speed : ''; this._control('set_fan_speed', speed); }}><option value="" disabled ?selected=${!speeds.includes(vacuum?.attributes?.fan_speed)}>Choose a level</option>${speeds.map(speed => html`<option .value=${speed} ?selected=${speed === vacuum?.attributes?.fan_speed}>${speed}</option>`)}</select></label>` : nothing}
        </details>` : nothing}
        <section class="rooms-section" aria-label="Room cleaning">
          <h2>Clean a room</h2><p class="hint ${config.rooms.length ? 'rooms-intro' : ''}">${config.rooms.length ? 'Tap a room to start its cleaning routine.' : 'Add rooms and their cleaning controls in the card editor.'}</p>
          <div class="rooms">${config.rooms.map((room, index) => {
            const name = roomName(room, states), blocked = roomBlocked(room, config, states, this.hass), pending = this._pending === index;
            return html`<button class="room" ?disabled=${Boolean(blocked) || this._pending !== undefined || this._stopping} aria-label=${`Clean ${name}`} aria-busy=${String(pending)} title=${blocked || `Clean ${name}`} @click=${() => this._clean(room, index)}><ha-icon icon=${room.icon || states[room.entity]?.attributes?.icon || 'mdi:floor-plan'} aria-hidden="true"></ha-icon><span>${name}</span><small class=${pending || blocked ? 'room-message' : 'room-caption'}>${pending ? 'Sending…' : blocked || 'Start cleaning'}</small></button>`;
          })}</div>
          <p class="feedback ${this._failed ? 'error' : ''}" role=${this._failed ? 'alert' : 'status'} aria-live="polite">${this._feedback || ''}</p>
        </section>
        ${statistics.length ? html`<details class="extras additional-stats"><summary>Maintenance and statistics</summary><div class="extra-stat-grid">${statistics.map(stat => html`<div class="extra-stat"><span>${stat.name}</span>${this._stat(stat.name, stat.value, stat.icon)}</div>`)}</div></details>` : nothing}
        ${config.map_entity ? html`<details class="extras map-panel" .open=${Boolean(this._mapOpen)} @toggle=${event => { this._mapOpen = event.target.open; }}><summary>Map</summary>${this._mapOpen ? html`<vacuum-card-map .entity=${config.map_entity} .hass=${this.hass}></vacuum-card-map>` : nothing}</details>` : nothing}
      </ha-card>`;
  }
}
if (!customElements.get('homeassistant-vacuum-card')) customElements.define('homeassistant-vacuum-card', VacuumCard);
window.customCards = window.customCards || [];
if (!window.customCards.some(card => card.type === 'homeassistant-vacuum-card')) window.customCards.push({ type: 'homeassistant-vacuum-card', name: 'Vacuum Card', preview: true, description: 'Room cleaning controls and robot health, configured in the visual editor.' });
console.info(`Vacuum Card ${__VERSION__}`);
