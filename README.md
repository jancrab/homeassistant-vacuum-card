# Vacuum Card

A theme-native Home Assistant card for Roborock room cleaning. Choose an existing cleaning button or script for each room, give it a name and icon, and run it directly from the dashboard. Status, battery, optional cleaning progress, area/time and water/vacuum/dock alerts share one card.

## Installation

### Manual

Copy `dist/homeassistant-vacuum-card.js` to `/config/www/`. Register `/local/homeassistant-vacuum-card.js?v=0.4.0` as a JavaScript module under Settings > Dashboards > Resources and reload the browser. On updates, replace the file and change the query version on the existing resource.

### HACS (after public publication)

[![Open in HACS](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=jancrab&repository=homeassistant-vacuum-card&category=plugin)

Once this repository is published publicly, add it as a custom Dashboard repository in HACS. The module resource is `/hacsfiles/homeassistant-vacuum-card/homeassistant-vacuum-card.js`. This local project has not been published.

## Configure in the visual editor

1. Add **Vacuum Card** and select your vacuum entity.
2. Under **Rooms**, select **Add room**. Choose the existing cleaning control, for example `button.wohnzimmer_roborock_qrevo_master_bad`.
3. Enter **Bad** as the room name and choose `mdi:shower` as the icon. Add other rooms the same way. Move up/down and Remove manage the list.
4. Expand **Statistics and alerts** and explicitly select the robot's battery, cleaning progress, status and error sensors as needed.
5. Save. Tapping a room starts its configured routine immediately.

Names and icons fall back to the selected control's friendly name/icon. Both remain visible on every room tile. No entities are guessed or selected from other robots. The editor uses HA's native entity and icon pickers.

Choose **compact** under **Layout** for a dense status header, a single statistics row and two columns of room buttons with icons beside their names. Compact is the default. **Wide** keeps the spacious header and larger tiles, with three columns when the actual card is at least 440 px wide. All buttons retain a minimum 44 px target height; pending, unavailable and error messages stay visible in both modes.

Both layouts automatically shrink when the robot is not cleaning or returning. Charging, docked, idle, paused, error and offline states use a small header with status, robot icon and battery, followed by compact room buttons. Area, time and progress are omitted at rest, including old readings from the last run. Alerts and action feedback remain visible. Starting/resuming work restores the chosen layout automatically from HA state updates; no manual mode switch is needed. While working, battery, area and time occupy a slim icon-and-value row, with accessible labels and hover descriptions.

The small robot icon moves while cleaning or returning, and shows a pulsing lightning bolt while charging. Docked, paused, error, offline and idle states have distinct static symbols. Select **Charging binary sensor** under **Statistics and alerts** to use Roborock's charging entity. Docked alone does not trigger charging animation. Without that mapping, an explicit `charging` vacuum/detailed status can supply the signal. Animation pauses offscreen and in hidden browser tabs, and becomes static with the system's reduced-motion preference. The icon still opens robot details.

## YAML example

Replace `vacuum.your_robot` with the real vacuum entity. The bathroom control below is the supplied existing entity; the card does not create it.

```yaml
type: custom:homeassistant-vacuum-card
entity: vacuum.your_robot
name: Roborock Qrevo Master
layout: compact
rooms:
  - name: Bad
    icon: mdi:shower
    entity: button.wohnzimmer_roborock_qrevo_master_bad
```

Optional sensor mappings (replace every example with an actual entity or omit it):

```yaml
status_entity: sensor.your_robot_status
charging_entity: binary_sensor.your_robot_charging
battery_entity: sensor.your_robot_battery
progress_entity: sensor.your_robot_cleaning_progress
cleaning_area_entity: sensor.your_robot_cleaning_area
cleaning_time_entity: sensor.your_robot_cleaning_time
water_shortage_entity: binary_sensor.your_robot_water_shortage
vacuum_error_entity: sensor.your_robot_vacuum_error
dock_error_entity: sensor.your_robot_dock_error
```

| Setting | Behavior when omitted |
| --- | --- |
| `status_entity` | Use the vacuum state. |
| `charging_entity` | Animate charging only when the vacuum or configured detailed status explicitly reports `charging`. |
| `battery_entity` | Use the vacuum's `battery_level` attribute, if available. |
| `progress_entity` | Use the vacuum's `cleaning_progress` attribute, if available. |
| `cleaning_area_entity`, `cleaning_time_entity` | Hide these optional statistics. |
| `water_shortage_entity`, `vacuum_error_entity`, `dock_error_entity` | No sensor alert for that source. A vacuum `error` state or `error` attribute still appears. |

Battery and progress accept only numeric 0–100 values. Missing values never become zero. A configured but unavailable source does not silently fall back to another source. Progress is shown during cleaning or returning, labeled **Last reported progress** while returning; no completion percentage is estimated. Area/time reflect the values reported by HA. These cleaning metrics are hidden in the automatic rest view.

Water shortage `on` shows a warning. Error sensor states other than `none`, `ok`, `no_error`, `no error`, `0`, `off` or `false` show their reported error. Missing/unknown/unavailable configured error sensors show a separate **Sensor unavailable** notice. HA's state formatter supplies localized entity values where available; card labels are English.

## How room controls work

- `button.*` calls `button.press` with exactly that entity ID. An `unknown` button timestamp is valid for a button that has never been pressed.
- `script.*` calls `script.turn_on` with exactly that entity ID. A running script is disabled until it stops.
- Missing/unavailable controls and an unavailable robot disable room actions. While a call is in flight, all room tiles on that card are disabled to prevent duplicate/concurrent requests.
- Failures are shown on the card and can be retried. **Command sent** acknowledges the service call; only HA updates the displayed robot state.

The card runs the existing routine as configured in Home Assistant/Roborock. It does not determine room IDs, change maps or override that routine's cleaning settings. It contains no browser-based schedule; use Home Assistant automations to run the same buttons on a schedule. The robot icon opens HA's more-info dialog for the vacuum.

Supported HA behavior is documented in the official [button integration](https://www.home-assistant.io/integrations/button/), [script integration](https://www.home-assistant.io/integrations/script/) and [Roborock integration](https://www.home-assistant.io/integrations/roborock/).

## Development and verification

```sh
npm ci
npm run check
npm run dev
```

Open `http://127.0.0.1:4173` for the built card with simulated data, light/dark themes, 280/360/480 px widths, error/offline/missing-data scenarios, a service log and simulated editor inputs. Icons and selectors in this standalone demo are local stand-ins for HA's native components. No command reaches a real robot.

Automated tests cover exact button/script targets, in-flight serialization, failure/retry, unavailable controls, zero/missing metrics, sensor alerts, reused `hass`, context subscription cleanup and visual-editor configuration preservation. Browser checks exercise the built bundle. Real Home Assistant editor startup and physical robot operation still require verification in the target installation.

Commit `package-lock.json` and the built bundle with source changes. CI verifies the committed build; the release workflow requires a matching version tag. Public HACS validation and publication have not been run locally. See [AGENTS.md](AGENTS.md), [the working guide](docs/working-guide.md) and [the design guide](docs/design-style.md).

MIT; see LICENSE.
