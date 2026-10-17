import { test } from 'node:test';
import assert from 'node:assert/strict';
import { discoverSensors, SensorDiscovery } from '../src/discovery.js';

export function registryFixture() {
  const entry = (entity_id, extra = {}) => ({ entity_id, device_id: 'robot', platform: 'roborock', config_entry_id: 'account', disabled_by: null, ...extra });
  const entities = [entry('vacuum.robot'), entry('sensor.renamed_battery'), entry('binary_sensor.charging'),
    ...Object.entries({ status: 'status', progress: 'clean_percent', area: 'cleaning_area', time: 'cleaning_time', error: 'vacuum_error', dock: 'dock_error' })
      .map(([name, translation_key]) => entry(`sensor.${name}`, { translation_key, ...(name === 'dock' ? { device_id: 'dock' } : {}) })),
    entry('binary_sensor.water', { translation_key: 'water_shortage' }),
    entry('sensor.other_battery', { device_id: 'other' }),
    entry('sensor.total', { translation_key: 'total_cleaning_time' }),
    entry('sensor.wrong_account', { config_entry_id: 'other', translation_key: 'vacuum_error' }),
    entry('sensor.disabled', { translation_key: 'clean_percent', disabled_by: 'user' }),
  ];
  const devices = [{ id: 'robot', identifiers: [['roborock', 'robot-id']] },
    { id: 'dock', identifiers: [['roborock', 'robot-id_dock']], config_entries: ['account'] },
    { id: 'other-dock', identifiers: [['roborock', 'other-id_dock']], config_entries: ['account'] }];
  const states = {
    'vacuum.robot': { state: 'cleaning', attributes: {} },
    'sensor.renamed_battery': { state: '72', attributes: { device_class: 'battery' } },
    'binary_sensor.charging': { state: 'off', attributes: { device_class: 'battery_charging' } },
    'sensor.other_battery': { attributes: { device_class: 'battery' } },
    'sensor.progress': { state: '38' },
  };
  return { entities, devices, states };
}

test('discovery uses device/integration semantics, including the exact Roborock dock', () => {
  const { entities, devices, states } = registryFixture();
  assert.deepEqual(discoverSensors('vacuum.robot', entities, devices, states), {
    battery_entity: 'sensor.renamed_battery', charging_entity: 'binary_sensor.charging',
    status_entity: 'sensor.status', progress_entity: 'sensor.progress', cleaning_area_entity: 'sensor.area',
    cleaning_time_entity: 'sensor.time', vacuum_error_entity: 'sensor.error', dock_error_entity: 'sensor.dock',
    water_shortage_entity: 'binary_sensor.water',
  });
  entities.push({ ...entities[0], entity_id: 'sensor.unrelated_dock_error', device_id: 'other-dock', translation_key: 'dock_error' });
  assert.equal(discoverSensors('vacuum.robot', entities, devices, states).dock_error_entity, 'sensor.dock');
  entities.push({ ...entities[1], entity_id: 'sensor.duplicate' });
  states['sensor.duplicate'] = { attributes: { device_class: 'battery' } };
  assert.equal(discoverSensors('vacuum.robot', entities, devices, states).battery_entity, undefined);
  assert.deepEqual(discoverSensors('vacuum.missing', entities, devices, states), {});
});

test('other integrations get standard battery/charging only, never guessed Roborock keys', () => {
  const { entities, devices, states } = registryFixture();
  assert.deepEqual(discoverSensors('vacuum.robot', entities.map(entry => ({ ...entry, platform: 'another_integration' })), devices, states), {
    battery_entity: 'sensor.renamed_battery', charging_entity: 'binary_sensor.charging',
  });
});

test('discovery preserves manual/cleared mappings and follows the currently selected robot', async () => {
  const data = registryFixture();
  let calls = 0, resolveEntities;
  const host = { addController() {}, requestUpdate() {}, _config: { entity: 'vacuum.robot', battery_entity: 'sensor.manual', progress_entity: '' },
    hass: { states: data.states, callWS: ({ type }) => {
      calls++;
      return type.includes('entity_registry') ? new Promise(resolve => resolveEntities = resolve) : Promise.resolve(data.devices);
    } } };
  const controller = new SensorDiscovery(host);
  const pending = controller.load();
  host._config.entity = 'vacuum.other';
  resolveEntities(data.entities); await pending;
  assert.equal(controller.config.charging_entity, undefined);
  host._config.entity = 'vacuum.robot';
  assert.equal(controller.config.battery_entity, 'sensor.manual');
  assert.equal(controller.config.progress_entity, '');
  assert.equal(controller.config.charging_entity, 'binary_sensor.charging');
  controller.hostUpdated(); assert.equal(calls, 2);
  host._config.auto_detect = false;
  assert.equal(controller.config.charging_entity, undefined);
  assert.equal(controller.config.battery_entity, 'sensor.manual');
});

test('registry failures allow retry, and obsolete/disconnected requests cannot change selection', async () => {
  const data = registryFixture();
  let fail = true;
  const host = { addController() {}, requestUpdate() {}, _config: { entity: 'vacuum.robot' }, hass: {
    states: data.states, callWS: async ({ type }) => { if (fail) throw new Error('Connection lost'); return type.includes('entity_registry') ? data.entities : data.devices; },
  } };
  const controller = new SensorDiscovery(host);
  await controller.load(); assert.equal(controller.error, true); assert.deepEqual(controller.detected, {});
  fail = false; await controller.load(true);
  assert.equal(controller.error, false); assert.equal(controller.detected.battery_entity, 'sensor.renamed_battery');
  let resolveEntities;
  host.hass = { ...host.hass, callWS: ({ type }) => type.includes('entity_registry') ? new Promise(resolve => resolveEntities = resolve) : Promise.resolve(data.devices) };
  const pending = controller.load();
  controller.hostDisconnected();
  resolveEntities(data.entities); await pending;
  assert.deepEqual(controller.detected, {});
});
