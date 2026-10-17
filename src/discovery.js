import { sensorFields } from './model.js';

// Integration keys, never user-visible names or entity-id suffixes.
const roborockKeys = {
  status: 'status_entity', q7_status: 'status_entity',
  clean_percent: 'progress_entity', cleaning_area: 'cleaning_area_entity',
  cleaning_time: 'cleaning_time_entity', vacuum_error: 'vacuum_error_entity',
  dock_error: 'dock_error_entity', water_shortage: 'water_shortage_entity',
};

export function discoverSensors(vacuumId, entities, devices, states = {}) {
  const vacuum = entities.find(entry => entry.entity_id === vacuumId);
  if (!vacuum?.device_id || !vacuum.platform || !vacuum.config_entry_id) return {};
  const robot = devices.find(device => device.id === vacuum.device_id);
  // Roborock creates a separate dock device with <robot identifier>_dock.
  const dockIdentifiers = (robot?.identifiers || [])
    .filter(([domain]) => domain === 'roborock').map(([, id]) => `${id}_dock`);
  const docks = new Set(vacuum.platform === 'roborock' ? devices.filter(device =>
    !device.disabled_by && device.config_entries?.includes(vacuum.config_entry_id) &&
    device.identifiers?.some(([domain, id]) => domain === 'roborock' && dockIdentifiers.includes(id))
  ).map(device => device.id) : []);
  const candidates = {};
  for (const entry of entities) {
    if (entry.disabled_by || entry.platform !== vacuum.platform || entry.config_entry_id !== vacuum.config_entry_id) continue;
    const sameDevice = entry.device_id === vacuum.device_id;
    if (!sameDevice && !docks.has(entry.device_id)) continue;
    const domain = entry.entity_id.split('.')[0];
    const deviceClass = states[entry.entity_id]?.attributes?.device_class || entry.device_class || entry.original_device_class;
    let field;
    if (sameDevice && domain === 'sensor' && deviceClass === 'battery') field = 'battery_entity';
    else if (sameDevice && domain === 'binary_sensor' && deviceClass === 'battery_charging') field = 'charging_entity';
    else if (vacuum.platform === 'roborock') {
      field = Object.hasOwn(roborockKeys, entry.translation_key) ? roborockKeys[entry.translation_key] : undefined;
      if (domain !== (field === 'water_shortage_entity' ? 'binary_sensor' : 'sensor')) continue;
      if (!sameDevice && field !== 'dock_error_entity') continue;
    }
    if (field) (candidates[field] ||= []).push(entry.entity_id);
  }
  // Ambiguity must be resolved explicitly in the editor, never by list order.
  return Object.fromEntries(Object.entries(candidates).filter(([, ids]) => ids.length === 1).map(([field, ids]) => [field, ids[0]]));
}

const registries = new WeakMap();
function loadRegistries(hass, refresh) {
  const key = hass.connection || hass;
  if (refresh) registries.delete(key);
  if (!registries.has(key)) {
    const promise = Promise.all([
      hass.callWS({ type: 'config/entity_registry/list' }),
      hass.callWS({ type: 'config/device_registry/list' }),
    ]).then(([entities, devices]) => ({ entities, devices }));
    registries.set(key, promise);
    promise.catch(() => { if (registries.get(key) === promise) registries.delete(key); });
  }
  return registries.get(key);
}

// Shared by the live card and editor. No services or configuration writes.
export class SensorDiscovery {
  constructor(host) { this.host = host; host.addController(this); }
  hostConnected() { this.key = undefined; this.host.requestUpdate(); }
  hostDisconnected() { this.run = undefined; this.key = undefined; this.data = undefined; }
  hostUpdated() {
    const { hass, _config: config } = this.host;
    if (!config || config.auto_detect === false || !hass?.callWS) return;
    const key = hass.connection || hass;
    if (this.key !== key) this.load();
  }
  async load(refresh = false) {
    const { hass } = this.host;
    if (!hass?.callWS) return;
    const run = this.run = {};
    this.key = hass.connection || hass;
    this.data = undefined; this.error = false; this.loading = true;
    this.host.requestUpdate();
    try {
      const data = await loadRegistries(hass, refresh);
      if (this.run === run) this.data = data;
    } catch { if (this.run === run) this.error = true; }
    finally {
      if (this.run === run) { this.loading = false; this.host.requestUpdate(); }
    }
  }
  get detected() {
    const { _config: config, hass } = this.host;
    if (!config || config.auto_detect === false || !this.data || this.key !== (hass?.connection || hass)) return {};
    return discoverSensors(config.entity, this.data.entities, this.data.devices, this.host.states || hass?.states);
  }
  get config() { return { ...this.detected, ...this.host._config }; }
  get count() {
    const detected = this.detected;
    return sensorFields.filter(field => !Object.hasOwn(this.host._config, field) && detected[field]).length;
  }
}
