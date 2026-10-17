import { isUnavailable } from './model.js';

// Home Assistant VacuumEntityFeature, not integration-specific commands.
const features = { start: 8192, pause: 4, stop: 8, return_to_base: 16, locate: 512, set_fan_speed: 32 };
export function supports(vacuum, hass, service) {
  return Boolean((Number(vacuum?.attributes?.supported_features) & features[service]) &&
    (!hass?.services || hass.services.vacuum?.[service]));
}
export function controlBlocked(vacuum, hass, service, commandPending = false) {
  if (!supports(vacuum, hass, service)) return 'Not supported by this robot';
  if (isUnavailable(vacuum) || !hass?.callService) return 'Robot unavailable';
  if (service === 'start' && vacuum.state === 'cleaning') return 'Already cleaning';
  if (service === 'pause' && !['cleaning', 'returning'].includes(vacuum.state)) return 'Robot is not working';
  if (service === 'stop' && !commandPending && !['cleaning', 'returning', 'paused', 'error'].includes(vacuum.state)) return 'Robot is already stopped';
  if (service === 'return_to_base' && ['docked', 'charging', 'returning'].includes(vacuum.state)) return 'Already docked or returning';
  return '';
}
export function controls(vacuum, hass) {
  const main = vacuum?.state === 'cleaning' || vacuum?.state === 'returning'
    ? ['pause', 'Pause', 'mdi:pause'] : ['start', vacuum?.state === 'paused' ? 'Resume' : 'Start', 'mdi:play'];
  return [main, ['stop', 'Stop', 'mdi:stop'], ['return_to_base', 'Dock', 'mdi:home-import-outline'], ['locate', 'Locate', 'mdi:map-marker-radius']]
    .filter(([service]) => supports(vacuum, hass, service));
}
export function fanSpeeds(vacuum, hass) {
  if (!supports(vacuum, hass, 'set_fan_speed')) return [];
  const list = vacuum.attributes?.fan_speed_list;
  return Array.isArray(list) ? [...new Set(list.filter(value => typeof value === 'string' && value.length))] : [];
}
