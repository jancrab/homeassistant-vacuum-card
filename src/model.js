export const entityPattern = /^[a-z][a-z0-9_]*\.[a-z0-9_]+$/;
export const sensorFields = ['status_entity', 'charging_entity', 'battery_entity', 'progress_entity', 'cleaning_area_entity', 'cleaning_time_entity', 'vacuum_error_entity', 'dock_error_entity', 'water_shortage_entity'];

export function validateConfig(config) {
  if (!config || !entityPattern.test(config.entity || '') || !config.entity.startsWith('vacuum.')) throw new Error('Select a valid vacuum entity.');
  if (config.layout !== undefined && !['compact', 'wide'].includes(config.layout)) throw new Error('Layout must be compact or wide.');
  if (config.name !== undefined && typeof config.name !== 'string') throw new Error('Name must be text.');
  if (config.auto_detect !== undefined && typeof config.auto_detect !== 'boolean') throw new Error('Automatic sensor selection must be true or false.');
  if (config.show_toolbar !== undefined && typeof config.show_toolbar !== 'boolean') throw new Error('Show robot controls must be true or false.');
  if (config.map_entity && !/^(image|camera)\.[a-z0-9_]+$/.test(config.map_entity)) throw new Error('Map must be an image or camera entity.');
  if (config.stats !== undefined && !Array.isArray(config.stats)) throw new Error('Additional statistics must be a list.');
  const stats = (config.stats || []).map(stat => {
    if (!stat || typeof stat !== 'object' || Array.isArray(stat)) throw new Error('Each statistic must be an object.');
    if (stat.entity && !entityPattern.test(stat.entity)) throw new Error('Choose a valid statistic entity.');
    for (const field of ['entity', 'attribute', 'name', 'icon', 'unit']) if (stat[field] !== undefined && typeof stat[field] !== 'string') throw new Error(`Statistic ${field} must be text.`);
    if (stat.when && !['always', 'working', 'resting'].includes(stat.when)) throw new Error('Statistic visibility must be always, working or resting.');
    return { ...stat };
  });
  for (const field of sensorFields) {
    if (config[field] && (typeof config[field] !== 'string' || !/^(sensor|binary_sensor)\.[a-z0-9_]+$/.test(config[field]))) throw new Error(`${field} must be a sensor entity.`);
  }
  if (config.rooms !== undefined && !Array.isArray(config.rooms)) throw new Error('Rooms must be a list.');
  const rooms = (config.rooms || []).map(room => {
    if (!room || typeof room !== 'object' || Array.isArray(room)) throw new Error('Each room must be an object.');
    // Empty rows are valid while the visual editor is being filled in.
    if (room.entity && (typeof room.entity !== 'string' || !/^(button|script)\.[a-z0-9_]+$/.test(room.entity))) throw new Error('Room controls must be button or script entities.');
    for (const field of ['name', 'icon']) if (room[field] !== undefined && typeof room[field] !== 'string') throw new Error(`Room ${field} must be text.`);
    return { ...room };
  });
  return { layout: 'compact', ...config, rooms, stats };
}
export const isUnavailable = state => !state || ['unknown', 'unavailable', ''].includes(state.state);
export function robotMode(config, states) {
  const vacuum = states[config.entity];
  if (isUnavailable(vacuum)) return 'offline';
  const state = vacuum.state;
  if (state === 'error') return 'error';
  if (state === 'cleaning') return 'cleaning';
  if (state === 'returning') return 'returning';
  if (state === 'paused') return 'paused';
  if (['docked', 'idle', 'charging'].includes(state)) {
    // Docked alone does not prove charging; use an explicit live signal.
    const charging = config.charging_entity
      ? states[config.charging_entity]?.state === 'on'
      : state === 'charging' || states[config.status_entity]?.state === 'charging';
    if (charging) return 'charging';
  }
  return state === 'docked' ? 'docked' : 'idle';
}
export function humanize(value) {
  const text = String(value ?? '').replaceAll('_', ' ');
  return text ? text[0].toUpperCase() + text.slice(1) : 'Unknown';
}
export function formatState(hass, state) {
  if (!state) return 'Unavailable';
  try { return hass?.formatEntityState?.(state) || humanize(state.state); }
  catch { return humanize(state.state); }
}
export function percent(value) {
  if ((typeof value !== 'number' && typeof value !== 'string') || String(value).trim() === '') return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 && number <= 100 ? number : null;
}
export function metric(config, states, field, attribute) {
  if (config[field]) {
    const state = states[config[field]];
    return isUnavailable(state) ? null : percent(state.state);
  }
  const vacuum = states[config.entity];
  return isUnavailable(vacuum) ? null : percent(vacuum.attributes?.[attribute]);
}
export function roomName(room, states) {
  return room.name || states[room.entity]?.attributes?.friendly_name || room.entity || 'New room';
}
export function roomAction(entity) {
  if (!/^(button|script)\.[a-z0-9_]+$/.test(entity || '')) return null;
  const domain = entity.split('.')[0];
  return { domain, service: domain === 'button' ? 'press' : 'turn_on', data: { entity_id: entity } };
}
export function roomBlocked(room, config, states, hass) {
  if (!room.entity) return 'Choose a room control in the editor';
  if (isUnavailable(states[config.entity])) return 'Robot unavailable';
  const control = states[room.entity];
  // A never-pressed button has an unknown timestamp but can still be pressed.
  if (!control || control.state === 'unavailable') return 'Room control unavailable';
  const action = roomAction(room.entity);
  if (!action || !hass?.callService) return 'Control unavailable';
  if (hass.services && !hass.services[action.domain]?.[action.service]) return 'Action unavailable';
  if (action.domain === 'script' && control.state === 'on') return 'Routine running';
  return '';
}
export function alerts(config, states, hass) {
  const result = [];
  const healthy = new Set(['none', 'ok', 'no_error', 'no error', '0', 'off', 'false']);
  for (const [field, label] of [['water_shortage_entity', 'Water shortage'], ['vacuum_error_entity', 'Vacuum error'], ['dock_error_entity', 'Dock error']]) {
    const id = config[field];
    if (!id) continue;
    const state = states[id];
    if (isUnavailable(state)) result.push({ id, label, text: 'Sensor unavailable', unavailable: true });
    else if (!healthy.has(String(state.state).trim().toLowerCase())) result.push({ id, label, text: state.state === 'on' ? 'Attention needed' : formatState(hass, state) });
  }
  const vacuum = states[config.entity], error = vacuum?.attributes?.error;
  if (!isUnavailable(vacuum) && error != null && String(error).trim() && !healthy.has(String(error).trim().toLowerCase()) && !result.some(item => item.label === 'Vacuum error' && !item.unavailable)) result.push({ id: config.entity, label: 'Vacuum error', text: humanize(error) });
  if (vacuum?.state === 'error' && !result.some(item => !item.unavailable && item.label === 'Vacuum error')) result.push({ id: config.entity, label: 'Vacuum error', text: 'Open robot details for more information' });
  return result;
}
