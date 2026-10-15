import { LitElement, html, css, nothing } from 'lit';

const entity = (name, domain, required = false) => ({ name, required, selector: { entity: { domain } } });
const baseSchema = [entity('entity', 'vacuum', true), { name: 'name', selector: { text: {} } }, { name: 'layout', selector: { select: { options: ['compact', 'wide'] } } }];
const roomSchema = [entity('entity', ['button', 'script'], true), { name: 'name', selector: { text: {} } }, { name: 'icon', selector: { icon: {} } }];
const sensorSchema = ['status', 'charging', 'battery', 'progress', 'cleaning_area', 'cleaning_time', 'vacuum_error', 'dock_error', 'water_shortage'].map(name => entity(`${name}_entity`, ['water_shortage', 'charging'].includes(name) ? 'binary_sensor' : 'sensor'));
const labels = { entity: 'Vacuum', name: 'Name (optional)', layout: 'Layout', status_entity: 'Detailed status (optional)', charging_entity: 'Charging binary sensor (optional)', battery_entity: 'Battery sensor (optional)', progress_entity: 'Cleaning progress, 0–100 % (optional)', cleaning_area_entity: 'Cleaned area (optional)', cleaning_time_entity: 'Cleaning time (optional)', vacuum_error_entity: 'Vacuum error (optional)', dock_error_entity: 'Dock error (optional)', water_shortage_entity: 'Water shortage (optional)' };

export class VacuumCardEditor extends LitElement {
  static properties = { hass: { attribute: false, hasChanged: () => true }, _config: { state: true } };
  static styles = css`
    :host { display: block; color: var(--primary-text-color); }
    h3 { font-size: 16px; margin: 24px 0 8px; }
    p { color: var(--secondary-text-color); font-size: 13px; line-height: 1.5; }
    fieldset { border: 1px solid var(--divider-color); border-radius: 12px; margin: 16px 0; padding: 12px; min-width: 0; }
    legend { padding: 0 6px; overflow-wrap: anywhere; }
    button { min-height: 44px; padding: 8px 12px; font: inherit; color: var(--primary-text-color); background: var(--secondary-background-color); border: 1px solid var(--divider-color); border-radius: 8px; cursor: pointer; }
    button:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
    button:disabled { opacity: .5; cursor: default; }
    .actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
    details { margin-top: 24px; }
    summary { cursor: pointer; min-height: 44px; line-height: 44px; }
  `;
  setConfig(config) { this._config = { ...config, rooms: (config.rooms || []).map(room => ({ ...room })) }; }
  _emit(patch) {
    this._config = { ...this._config, ...patch };
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this._config }, bubbles: true, composed: true }));
  }
  _update(event) { event.stopPropagation(); this._emit(event.detail.value); }
  _room(event, index) {
    event.stopPropagation();
    this._emit({ rooms: this._config.rooms.map((room, i) => i === index ? { ...room, ...event.detail.value } : room) });
  }
  _move(index, offset) {
    const rooms = [...this._config.rooms], next = index + offset;
    if (next < 0 || next >= rooms.length) return;
    [rooms[index], rooms[next]] = [rooms[next], rooms[index]];
    this._emit({ rooms });
  }
  render() {
    if (!this.hass || !this._config) return nothing;
    return html`
      <ha-form .hass=${this.hass} .data=${{ layout: 'compact', ...this._config }} .schema=${baseSchema} .computeLabel=${field => labels[field.name]} @value-changed=${this._update}></ha-form>
      <p>Compact uses a small status header and room buttons with icons beside their names. Wide uses larger tiles while working. Both automatically shrink when the robot stops: only status, battery, room controls and alerts remain. Choose a charging sensor below to distinguish charging from docked.</p>
      <h3>Rooms</h3><p>Choose the existing cleaning button or script for each room. A tap runs that control immediately. Names and icons are optional overrides.</p>
      ${this._config.rooms.map((room, index) => html`<fieldset><legend>${room.name || `Room ${index + 1}`}</legend><ha-form class="room-form" .hass=${this.hass} .data=${room} .schema=${roomSchema} .computeLabel=${field => ({ entity: 'Cleaning control', name: 'Room name', icon: 'Room icon' })[field.name]} @value-changed=${event => this._room(event, index)}></ha-form><div class="actions"><button aria-label=${`Move room ${index + 1} up`} ?disabled=${index === 0} @click=${() => this._move(index, -1)}>Move up</button><button aria-label=${`Move room ${index + 1} down`} ?disabled=${index === this._config.rooms.length - 1} @click=${() => this._move(index, 1)}>Move down</button><button aria-label=${`Remove room ${index + 1}`} @click=${() => this._emit({ rooms: this._config.rooms.filter((_, i) => i !== index) })}>Remove</button></div></fieldset>`)}
      <button class="add-room" @click=${() => this._emit({ rooms: [...this._config.rooms, { entity: '', name: '', icon: 'mdi:floor-plan' }] })}>Add room</button>
      <details><summary>Statistics and alerts</summary><p>Choose sensors belonging to this robot. Battery uses the vacuum's battery_level attribute when no sensor is selected. Progress uses cleaning_progress if available. Missing values are never treated as zero.</p><ha-form class="sensor-form" .hass=${this.hass} .data=${this._config} .schema=${sensorSchema} .computeLabel=${field => labels[field.name]} @value-changed=${this._update}></ha-form></details>`;
  }
}
if (!customElements.get('homeassistant-vacuum-card-editor')) customElements.define('homeassistant-vacuum-card-editor', VacuumCardEditor);
