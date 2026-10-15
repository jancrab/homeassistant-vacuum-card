import { test, before, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';
import { percent, alerts, metric } from '../src/model.js';
const window = new Window();
for (const key of ['window', 'document', 'customElements', 'HTMLElement', 'Element', 'Document', 'CSSStyleSheet', 'ShadowRoot', 'CustomEvent', 'Event']) globalThis[key] = window[key];
globalThis.__VERSION__ = 'test';
let validateConfig;
before(async () => { ({ validateConfig } = await import('../src/homeassistant-vacuum-card.js')); });
afterEach(() => document.body.replaceChildren());
const bathroom = { entity: 'button.wohnzimmer_roborock_qrevo_master_bad', name: 'Bad', icon: 'mdi:shower' };
function fixture(patch = {}) {
  const card = document.createElement('homeassistant-vacuum-card');
  card.setConfig({ entity: 'vacuum.example', rooms: [bathroom], ...patch });
  card.hass = { states: {
    'vacuum.example': { state: 'docked', attributes: { friendly_name: 'Roborock', battery_level: 82 } },
    [bathroom.entity]: { state: 'unknown', attributes: {} },
  }, callService: async () => {} };
  document.body.append(card);
  return card;
}
const change = value => new CustomEvent('value-changed', { detail: { value }, bubbles: true });

test('validates domains and layout, allows incomplete editor rows without mutating input', () => {
  for (const config of [{ entity: 'invalid' }, { entity: 'light.example' }, { entity: 'vacuum.example', layout: 'invalid' }, { entity: 'vacuum.example', rooms: [{ entity: 'switch.bad' }] }, { entity: 'vacuum.example', rooms: 'bad' }, { entity: 'vacuum.example', progress_entity: 'button.bad' }]) assert.throws(() => validateConfig(config));
  const input = { entity: 'vacuum.example', rooms: [{ name: 'Bad', custom: 7 }] };
  const result = validateConfig(input);
  result.rooms[0].name = 'Changed';
  assert.equal(input.rooms[0].name, 'Bad');
  assert.equal(result.rooms[0].custom, 7);
});

test('reused hass renders state, sensor changes, zero battery and unavailable state', async () => {
  const card = fixture({ progress_entity: 'sensor.progress' }); await card.updateComplete;
  assert.equal(card.shadowRoot.querySelector('h1').textContent, 'Docked');
  card.hass.states['vacuum.example'] = { state: 'cleaning', attributes: { battery_level: 0 } };
  card.hass.states['sensor.progress'] = { state: '36', attributes: {} };
  card.hass = card.hass; await card.updateComplete;
  assert.equal(card.shadowRoot.querySelector('h1').textContent, 'Cleaning');
  assert.equal(card.shadowRoot.querySelector('progress').value, 36);
  assert.match(card.shadowRoot.querySelector('.stats').textContent, /0 %/);
  card.hass.states['vacuum.example'] = { state: 'unavailable', attributes: { battery_level: 82 } };
  card.hass = card.hass; await card.updateComplete;
  assert.equal(card.shadowRoot.querySelector('h1').textContent, 'Unavailable');
  assert.equal(card.shadowRoot.querySelector('.room').disabled, true);
  assert.match(card.shadowRoot.querySelector('.stats').textContent, /—/);
});

test('more-info targets selected vacuum and names are rendered as text', async () => {
  const card = fixture({ name: '<img src=x>', rooms: [{ ...bathroom, name: '<script>bad</script>' }] }); await card.updateComplete;
  assert.equal(card.shadowRoot.querySelector('img, script'), null);
  let result; card.addEventListener('hass-more-info', event => { result = event.detail; });
  card.shadowRoot.querySelector('.details').click();
  assert.deepEqual(result, { entityId: 'vacuum.example' });
});

test('context updates drive sensors and release subscription on disconnect/reconnect', async () => {
  let callback, releases = 0;
  const host = document.createElement('div'); document.body.append(host);
  host.addEventListener('context-request', event => { if (event.context === 'states') callback = event.callback; });
  const card = document.createElement('homeassistant-vacuum-card');
  card.setConfig({ entity: 'vacuum.example', battery_entity: 'sensor.battery' }); host.append(card);
  callback({ 'vacuum.example': { state: 'cleaning', attributes: {} }, 'sensor.battery': { state: '42' } }, () => releases++); await card.updateComplete;
  assert.equal(card.shadowRoot.querySelector('h1').textContent, 'Cleaning');
  assert.match(card.shadowRoot.querySelector('.stats').textContent, /42 %/);
  card.remove(); assert.equal(releases, 1);
  host.append(card);
  callback({ 'vacuum.example': { state: 'docked', attributes: {} } }, () => releases++); await card.updateComplete;
  assert.equal(card.shadowRoot.querySelector('h1').textContent, 'Docked');
  card.remove(); assert.equal(releases, 2);
});

test('room click calls exactly the configured button, including a never-pressed unknown button', async () => {
  const card = fixture(); const calls = [];
  card.hass.callService = async (...args) => calls.push(args);
  await card.updateComplete;
  card.shadowRoot.querySelector('.room').click(); await card.updateComplete; await card.updateComplete;
  assert.deepEqual(calls, [['button', 'press', { entity_id: bathroom.entity }]]);
  assert.equal(card.hass.states['vacuum.example'].state, 'docked');
  assert.match(card.shadowRoot.querySelector('.feedback').textContent, /Command sent: Bad/);
});

test('serializes requests, shows failure, allows retry and calls configured scripts', async () => {
  const room = { entity: 'script.kitchen', name: 'Kitchen' };
  const card = fixture({ rooms: [bathroom, room] });
  card.hass.states[room.entity] = { state: 'off', attributes: {} };
  let reject, count = 0;
  card.hass.callService = () => { count++; return new Promise((_, fail) => { reject = fail; }); };
  const request = card._clean(bathroom, 0);
  await card._clean(room, 1); await card.updateComplete;
  assert.equal(count, 1);
  assert.ok([...card.shadowRoot.querySelectorAll('.room')].every(button => button.disabled));
  reject(new Error('Connection lost')); await request; await card.updateComplete;
  assert.match(card.shadowRoot.querySelector('[role=alert]').textContent, /Connection lost/);
  const calls = []; card.hass.callService = async (...args) => calls.push(args);
  await card._clean(room, 1); await card.updateComplete;
  assert.deepEqual(calls, [['script', 'turn_on', { entity_id: 'script.kitchen' }]]);
  assert.equal(card.shadowRoot.querySelector('.feedback.error'), null);
});

test('missing controls, unavailable controls, robot offline and missing services never execute', async () => {
  const card = fixture(); let calls = 0;
  card.hass.callService = async () => { calls++; };
  for (const state of [undefined, { state: 'unavailable' }]) {
    card.hass.states[bathroom.entity] = state;
    await card._clean(bathroom, 0);
  }
  card.hass.states[bathroom.entity] = { state: 'unknown' };
  card.hass.states['vacuum.example'].state = 'unavailable';
  await card._clean(bathroom, 0);
  card.hass.states['vacuum.example'].state = 'docked'; card.hass.services = {};
  await card._clean(bathroom, 0);
  assert.equal(calls, 0);
});

test('percent metrics preserve zero, reject invalid readings, and respect explicit sources', () => {
  for (const value of [null, undefined, '', ' ', 'unknown', 'unavailable', -1, 101, false, [], Infinity]) assert.equal(percent(value), null);
  assert.equal(percent('0'), 0); assert.equal(percent('42.5'), 42.5);
  const states = { 'vacuum.example': { state: 'cleaning', attributes: { battery_level: 82 } }, 'sensor.battery': { state: 'unavailable' } };
  assert.equal(metric({ entity: 'vacuum.example', battery_entity: 'sensor.battery' }, states, 'battery_entity', 'battery_level'), null);
});

test('progress is optional, real zero renders and invalid values do not become progress', async () => {
  const card = fixture(); await card.updateComplete;
  assert.equal(card.shadowRoot.querySelector('progress'), null);
  card.setConfig({ entity: 'vacuum.example', progress_entity: 'sensor.progress' });
  for (const value of ['0', '67', 'unknown', '101', '']) {
    card.hass.states['sensor.progress'] = { state: value };
    card.hass = card.hass; await card.updateComplete;
    const progress = card.shadowRoot.querySelector('progress');
    if (value === '0' || value === '67') assert.equal(progress.value, Number(value));
    else assert.equal(progress, null);
  }
});

test('water shortage and vacuum/dock errors are distinct from healthy or unavailable sensors', () => {
  const config = { entity: 'vacuum.example', water_shortage_entity: 'binary_sensor.water', vacuum_error_entity: 'sensor.error', dock_error_entity: 'sensor.dock' };
  const states = { 'vacuum.example': { state: 'docked' }, 'binary_sensor.water': { state: 'on' }, 'sensor.error': { state: 'brush_jammed' }, 'sensor.dock': { state: 'ok' } };
  assert.deepEqual(alerts(config, states).map(item => item.label), ['Water shortage', 'Vacuum error']);
  for (const value of ['none', 'ok', 'no_error', '0']) {
    states['sensor.error'].state = value; states['binary_sensor.water'].state = 'off';
    assert.equal(alerts(config, states).length, 0);
  }
  states['sensor.error'].state = 'unavailable';
  assert.equal(alerts(config, states)[0].unavailable, true);
  states['vacuum.example'].state = 'error';
  assert.ok(alerts(config, states).some(item => item.label === 'Vacuum error' && !item.unavailable));
});

test('fresh native editor bootstrap, room editing/order/removal, sensor settings and unknown fields survive', async () => {
  let loads = 0;
  window.loadCardHelpers = async () => ({ createCardElement: () => ({ constructor: { getConfigElement: async () => { loads++; customElements.define('ha-form', class extends HTMLElement {}); } } }) });
  const editor = await customElements.get('homeassistant-vacuum-card').getConfigElement();
  const input = { entity: 'vacuum.example', custom_setting: 7, rooms: [{ ...bathroom, custom: 8 }] };
  editor.setConfig(input); editor.hass = { states: {} }; document.body.append(editor); await editor.updateComplete;
  let result; editor.addEventListener('config-changed', event => { result = event.detail.config; });
  editor.shadowRoot.querySelector('ha-form').dispatchEvent(change({ name: 'Updated' }));
  assert.equal(result.custom_setting, 7); assert.equal(result.name, 'Updated');
  editor.shadowRoot.querySelector('.room-form').dispatchEvent(change({ name: 'Bath', icon: 'mdi:bathtub' })); await editor.updateComplete;
  assert.equal(result.rooms[0].custom, 8); assert.equal(input.rooms[0].name, 'Bad');
  editor.shadowRoot.querySelector('.add-room').click(); await editor.updateComplete;
  assert.equal(result.rooms.length, 2); assert.doesNotThrow(() => validateConfig(result));
  editor.shadowRoot.querySelectorAll('.room-form')[1].dispatchEvent(change({ entity: 'button.kitchen', name: 'Kitchen' })); await editor.updateComplete;
  editor.shadowRoot.querySelector('[aria-label="Move room 2 up"]').click(); await editor.updateComplete;
  assert.equal(result.rooms[0].entity, 'button.kitchen');
  editor.shadowRoot.querySelector('[aria-label="Remove room 2"]').click(); await editor.updateComplete;
  assert.equal(result.rooms.length, 1);
  editor.shadowRoot.querySelector('.sensor-form').dispatchEvent(change({ progress_entity: 'sensor.progress' }));
  assert.equal(result.progress_entity, 'sensor.progress'); assert.equal(result.custom_setting, 7);
  assert.deepEqual(editor.shadowRoot.querySelector('.room-form').schema[0].selector.entity.domain, ['button', 'script']);
  await customElements.get('homeassistant-vacuum-card').getConfigElement(); assert.equal(loads, 1);
});

test('robot icon follows live state and never infers charging from docked alone', async () => {
  const card = fixture({ charging_entity: 'binary_sensor.charging' });
  for (const [state, charging, expected] of [
    ['docked', 'off', 'docked'], ['docked', 'on', 'charging'],
    ['docked', 'unavailable', 'docked'], ['cleaning', 'on', 'cleaning'],
    ['returning', 'off', 'returning'], ['paused', 'on', 'paused'],
    ['error', 'on', 'error'], ['unavailable', 'on', 'offline'], ['idle', 'off', 'idle'],
  ]) {
    card.hass.states['vacuum.example'].state = state;
    card.hass.states['binary_sensor.charging'] = { state: charging };
    card.hass = card.hass; await card.updateComplete;
    assert.ok(card.shadowRoot.querySelector(`.robot-${expected}`), `${state}/${charging}: ${expected}`);
    if (expected === 'charging') assert.equal(card.shadowRoot.querySelector('h1').textContent, 'Charging');
  }
  card.setConfig({ entity: 'vacuum.example', status_entity: 'sensor.status' });
  card.hass.states['vacuum.example'].state = 'docked';
  card.hass.states['sensor.status'] = { state: 'charging' };
  card.hass = card.hass; await card.updateComplete;
  assert.ok(card.shadowRoot.querySelector('.robot-charging'));
  card.hass.states['sensor.status'].state = 'charging_complete';
  card.hass = card.hass; await card.updateComplete;
  assert.ok(card.shadowRoot.querySelector('.robot-docked'));
});

test('motion pauses offscreen/in hidden tabs and observers are released on disconnect', async () => {
  let intersection, observed = 0, disconnected = 0;
  const originalObserver = globalThis.IntersectionObserver;
  const hiddenDescriptor = Object.getOwnPropertyDescriptor(document, 'hidden');
  globalThis.IntersectionObserver = class {
    constructor(callback) { intersection = callback; }
    observe() { observed++; }
    disconnect() { disconnected++; }
  };
  try {
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    const card = fixture();
    assert.equal(card.hasAttribute('motion-paused'), true);
    intersection([{ isIntersecting: true }]);
    assert.equal(card.hasAttribute('motion-paused'), false);
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
    assert.equal(card.hasAttribute('motion-paused'), true);
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));
    intersection([{ isIntersecting: false }]);
    assert.equal(card.hasAttribute('motion-paused'), true);
    card.remove(); assert.equal(disconnected, 1);
    document.dispatchEvent(new Event('visibilitychange'));
    assert.equal(card.hasAttribute('motion-paused'), true);
    document.body.append(card); assert.equal(observed, 2);
    card.remove(); assert.equal(disconnected, 2);
  } finally {
    if (originalObserver === undefined) delete globalThis.IntersectionObserver;
    else globalThis.IntersectionObserver = originalObserver;
    if (hiddenDescriptor) Object.defineProperty(document, 'hidden', hiddenDescriptor);
    else delete document.hidden;
  }
});
