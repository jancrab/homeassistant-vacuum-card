import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';
const window = new Window();
for (const key of ['window', 'document', 'customElements', 'HTMLElement', 'Element', 'Document', 'CSSStyleSheet', 'ShadowRoot', 'CustomEvent', 'Event']) globalThis[key] = window[key];
globalThis.__VERSION__ = 'test';
let validateConfig;
before(async () => { ({ validateConfig } = await import('../src/homeassistant-vacuum-card.js')); });
function fixture() {
  const card = document.createElement('homeassistant-vacuum-card');
  card.setConfig({ entity: 'vacuum.example' });
  card.hass = { states: { 'vacuum.example': { state: 'on', attributes: { friendly_name: 'Example' } } } };
  document.body.append(card);
  return card;
}
test('invalid entity and layout fail before rendering', () => {
  assert.throws(() => validateConfig({ entity: 'invalid' }));
  assert.throws(() => validateConfig({ entity: 'vacuum.example', layout: 'invalid' }));
});
test('reused hass renders updated and unavailable state', async () => {
  const card = fixture(); await card.updateComplete;
  assert.equal(card.shadowRoot.querySelector('[role=status]').textContent, 'on');
  card.hass.states['vacuum.example'] = { state: 'unavailable', attributes: {} };
  card.hass = card.hass; await card.updateComplete;
  assert.equal(card.shadowRoot.querySelector('[role=status]').textContent, 'Unavailable');
});
test('more-info targets selected entity and escapes custom names', async () => {
  const card = fixture(); card.setConfig({ entity: 'vacuum.example', name: '<img src=x>' }); await card.updateComplete;
  assert.equal(card.shadowRoot.querySelector('img'), null);
  let result; card.addEventListener('hass-more-info', event => { result = event.detail; });
  card.shadowRoot.querySelector('button').click();
  assert.deepEqual(result, { entityId: 'vacuum.example' });
});
test('states context renders and unsubscribes on removal', async () => {
  let callback, releases = 0;
  const host = document.createElement('div'); document.body.append(host);
  host.addEventListener('context-request', event => { if (event.context === 'states') callback = event.callback; });
  const card = document.createElement('homeassistant-vacuum-card'); card.setConfig({ entity: 'vacuum.example' }); host.append(card);
  callback({ 'vacuum.example': { state: '42', attributes: {} } }, () => releases++); await card.updateComplete;
  assert.equal(card.shadowRoot.querySelector('[role=status]').textContent, '42');
  card.remove(); assert.equal(releases, 1); host.remove();
});
test('fresh editor loads native form and preserves unknown settings', async () => {
  let loads = 0;
  window.loadCardHelpers = async () => ({ createCardElement: () => ({ constructor: { getConfigElement: async () => { loads++; customElements.define('ha-form', class extends HTMLElement {}); } } }) });
  const editor = await customElements.get('homeassistant-vacuum-card').getConfigElement();
  editor.setConfig({ entity: 'vacuum.example', custom_setting: 7 }); editor.hass = { states: {} }; document.body.append(editor); await editor.updateComplete;
  let result; editor.addEventListener('config-changed', event => { result = event.detail.config; });
  editor.shadowRoot.querySelector('ha-form').dispatchEvent(new CustomEvent('value-changed', { detail: { value: { name: 'Updated' } } }));
  assert.equal(result.custom_setting, 7); assert.equal(result.name, 'Updated');
  assert.deepEqual(editor.shadowRoot.querySelector('ha-form').schema[0].selector.entity, "vacuum" ? { domain: "vacuum" } : {});
  await customElements.get('homeassistant-vacuum-card').getConfigElement(); assert.equal(loads, 1);
});
