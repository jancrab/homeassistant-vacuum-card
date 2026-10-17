import { formatState, isUnavailable } from './model.js';

export function extraStats(config, states, hass, working) {
  return (config.stats || []).filter(stat => (stat.entity || stat.attribute) &&
    (!stat.when || stat.when === 'always' || stat.when === (working ? 'working' : 'resting'))).map(stat => {
    const id = stat.entity || config.entity, source = states[id];
    const raw = stat.attribute ? source?.attributes?.[stat.attribute] : source?.state;
    const valid = !isUnavailable(source) && raw !== null && raw !== undefined && raw !== '' &&
      ['string', 'number', 'boolean'].includes(typeof raw) && (typeof raw !== 'number' || Number.isFinite(raw));
    const unit = stat.unit ?? (stat.attribute ? '' : source?.attributes?.unit_of_measurement || '');
    const value = !valid ? 'Unavailable' : !stat.attribute && stat.unit === undefined && hass?.formatEntityState
      ? formatState(hass, source) : `${raw}${unit ? ` ${unit}` : ''}`;
    return { id, name: stat.name || source?.attributes?.friendly_name || stat.attribute || id, icon: stat.icon || source?.attributes?.icon || 'mdi:chart-box-outline', value };
  });
}
