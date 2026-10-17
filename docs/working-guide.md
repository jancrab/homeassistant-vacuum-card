# Project workflow

The card uses Lit, a bundled ES module, a native HA form editor, node:test and Happy DOM. Room tiles call explicitly configured button.press or script.turn_on targets. Sensor mappings default to automatic registry discovery; explicit overrides win. Never guess entities from names.

## Room controls and sensor semantics

A button's state is its last-pressed timestamp. `unknown` may mean never pressed, so do not disable that button as unavailable. Keep unavailable/missing entities disabled. Serialize in-flight calls per card, show failures and acknowledge only the command; never optimistically claim the robot started cleaning.

Allow unfinished room rows in the native editor, preserve unknown config fields, and never execute a control when editing settings. Battery/progress values must be finite percentages, preserving true zero. Explicit unavailable sensors must not fall back to stale vacuum attributes. Roborock error sensors use raw `none`/`ok` values; binary water shortage uses `on`/`off`. Unknown error data is not proof of a healthy robot.

The demo's ha-form and ha-icon are labeled stand-ins. Mocked and browser tests verify card behavior, not Home Assistant's native selectors or physical cleaning. Room routines already encode their map and cleaning parameters; the card must not invent them.

## Editor and state

The robot icon follows confirmed vacuum state. Charging uses an explicitly selected binary sensor, or an explicit charging status when no charging sensor is configured; docked alone is not charging. Active cleaning/returning/paused/error and offline states take precedence over a stale charging sensor. Keep CSS animation disabled for reduced motion and paused offscreen/in hidden tabs. Release the IntersectionObserver and visibility listener on disconnect and restore them on reconnect.

Both layouts automatically use a dense rest view outside cleaning/returning. Render only battery in the rest header, omitting area/time/progress rather than showing stale last-run metrics. Always preserve alerts, action failures and room controls, and restore the saved working layout on live state changes without mutating configuration.

Native HA forms/selectors can be lazy-loaded. Keep getConfigElement's native editor loading until a tested replacement exists. HA can reuse its hass object, so rendering must still update. The starter accepts both hass and the states context; unsubscribe when disconnected.

Discover related entities through shared device_id where available; do not guess unrelated devices. Use exact preset strings and supported_features from the actual integration. A writable number's name does not prove that it measures live device position. Validate before actions; stop commands should not wait behind optional polling or profile validation.

## Testing

Run npm run check. Add service sequencing and failure tests with controls. Use npm run dev for the simulated preview. An HTML preview or mock test is not real Home Assistant/device verification. Native editor loading and live integration behavior must be checked in HA when possible.

## HACS and releases

The repository slug, hacs filename, bundle and release asset must match. HACS installs the frontend JavaScript, not backend scripts or an iPhone widget. Document any backend additions separately.

Commit the generated package-lock.json and dist bundle. The release workflow checks tag/version consistency and publishes the JS asset; validation verifies the committed build and HACS structure. Public HACS custom distribution requires a public repository. Do not change visibility or publish without task authorization.

For manual updates replace the file and change the query version on the existing module resource; do not add a duplicate. Check actual GitHub release assets and workflow results after publishing.

GitHub login does not set Git author/committer metadata. Check effective identity and keep per-project changes repository-local. Do not store tokens, personal device data or inherited authorization in this guide.

Sources: https://hacs.dev/docs/publish/plugin/ and https://developers.home-assistant.io/docs/frontend/custom-ui/custom-card/.

## Automatic sensor selection

Use the full entity registry list and device registry list (read-only callWS). Scope candidates to the selected vacuum's device_id, platform and config_entry_id. Standard battery and battery_charging classes work across integrations; other mappings currently use verified Roborock translation keys. Progress is clean_percent, not a guessed entity suffix. Total cleaning time/area are not current cleaning metrics. Skip disabled entries and ambiguous matches.

Roborock docks are separate devices identified by the robot identifier plus _dock; the current integration does not supply a via_device relationship. Match this exact identifier and config entry, never every dock in the account. Keep room controls explicit. Automatic fields are resolved at runtime and displayed in the editor without writing them as manual overrides. Store only changed sensor fields; an empty string opts out of discovery and allows existing attribute fallbacks. Preserve manual overrides and unknown settings across vacuum changes. Ignore obsolete/disconnected registry responses, cache per connection, and provide an explicit refresh/retry in the editor. Dashboard registry snapshots refresh on reload.

The robot details button contains one centered robot SVG; no separate dock silhouette above it. Charge/paused/error markers belong inside the robot body.

Verified source references: [HA entity registry frontend](https://github.com/home-assistant/frontend/blob/dev/src/data/entity/entity_registry.ts), [Roborock sensors](https://github.com/home-assistant/core/blob/dev/homeassistant/components/roborock/sensor.py), [binary sensors](https://github.com/home-assistant/core/blob/dev/homeassistant/components/roborock/binary_sensor.py), [dock device identifiers](https://github.com/home-assistant/core/blob/dev/homeassistant/components/roborock/coordinator.py).

## Robot controls and optional details

Vacuum control flags are START=8192, PAUSE=4, STOP=8, RETURN_HOME=16, FAN_SPEED=32 and LOCATE=512. Check both selected-entity features and the HA service registry (when provided) at render time and again before dispatch. Resume uses vacuum.start. Pass fan_speed_list strings unchanged. Keep UI values tied to HA state; do not update them optimistically after service acknowledgement. Stop has its own in-flight lock and bypasses a pending routine/ordinary control; newer command feedback must not be overwritten by older responses.

Robot controls automatically collapse outside cleaning/returning. Optional statistics stay in a collapsed section, support scalar entity/attribute values and working/resting visibility, and never reset consumables. A unit override is a label only. Preserve unknown fields and unfinished editor rows.

Map selection is explicit (image or camera). Create the native picture-entity card only while expanded, pass hass through, and drop obsolete async loads when closed, reconfigured or disconnected. Native HA owns authentication/refresh; do not construct token URLs or add independent map polling. The demo map and helpers are stand-ins, not real HA verification.

References: [vacuum feature flags](https://github.com/home-assistant/core/blob/dev/homeassistant/components/vacuum/const.py), [vacuum actions](https://www.home-assistant.io/integrations/vacuum/), [picture-entity](https://www.home-assistant.io/dashboards/picture-entity/). Feature inspiration: [denysdovhan/vacuum-card](https://github.com/denysdovhan/vacuum-card); no copied code or images.
