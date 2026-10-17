# Vacuum Card

A theme-native Home Assistant card for Roborock room cleaning. Choose an existing cleaning button or script for each room, give it a name and icon, and run it directly from the dashboard. Status, battery, optional cleaning progress, area/time and water/vacuum/dock alerts share one card.

## Installation

### Manual

Copy `dist/homeassistant-vacuum-card.js` to `/config/www/`. Register `/local/homeassistant-vacuum-card.js?v=0.6.0` as a JavaScript module under Settings > Dashboards > Resources and reload the browser. On updates, replace the file and change the query version on the existing resource.

### HACS

[![Open in HACS](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=jancrab&repository=homeassistant-vacuum-card&category=plugin)

Add [jancrab/homeassistant-vacuum-card](https://github.com/jancrab/homeassistant-vacuum-card) as a custom **Dashboard** repository in HACS, download the latest release and reload the browser. The module resource is `/hacsfiles/homeassistant-vacuum-card/homeassistant-vacuum-card.js`.

## Configure in the visual editor

1. Add **Vacuum Card** and select your vacuum entity.
2. Under **Rooms**, select **Add room**. Choose the existing cleaning control, for example `button.wohnzimmer_roborock_qrevo_master_bad`.
3. Enter **Bad** as the room name and choose `mdi:shower` as the icon. Add other rooms the same way. Move up/down and Remove manage the list.
4. Open **Statistics and alerts** to review the automatically selected sensors. Change a selection to override it; clear a field to use its fallback. **Use detected sensors** removes sensor overrides and restores automatic selection.
5. Save. Tapping a room starts its configured routine immediately.

Names and icons fall back to the selected control's friendly name/icon. Both remain visible on every room tile. Optional robot controls, maps and extra statistics also have native editor settings. No entities are guessed or selected from other robots. The editor uses HA's native entity and icon pickers.

Choose **compact** under **Layout** for a dense status header, a single statistics row and two columns of room buttons with icons beside their names. Compact is the default. **Wide** keeps the spacious header and larger tiles, with three columns when the actual card is at least 440 px wide. All buttons retain a minimum 44 px target height; pending, unavailable and error messages stay visible in both modes.

Both layouts automatically shrink when the robot is not cleaning or returning. Charging, docked, idle, paused, error and offline states use a small header with status, robot icon and battery, followed by compact room buttons and collapsed robot controls. Optional map and maintenance sections stay collapsed until opened. Area, time and progress are omitted at rest, including old readings from the last run. Alerts and action feedback remain visible. Starting/resuming work restores the chosen layout automatically from HA state updates; no manual mode switch is needed. While working, battery, area and time occupy a slim icon-and-value row, with accessible labels and hover descriptions.

The small robot icon moves while cleaning or returning, and shows a pulsing lightning bolt while charging. Docked, paused, error, offline and idle states have distinct static symbols. Roborock's charging entity is selected automatically when available; it can also be selected manually under **Statistics and alerts**. The header shows one robot symbol, with no separate dock drawing above it. Docked alone does not trigger charging animation. Without that mapping, an explicit `charging` vacuum/detailed status can supply the signal. Animation pauses offscreen and in hidden browser tabs, and becomes static with the system's reduced-motion preference. The icon still opens robot details.

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

Automatic sensor selection is enabled by default, including for YAML cards with only a vacuum entity. The editor displays the detected values; automatic fields are resolved at runtime rather than saved as fixed overrides, so they follow a changed vacuum selection. Saved manual mappings always take priority, even when changing robots.

Detection reads Home Assistant's entity and device registries. It requires the same device, integration and configuration entry. Roborock status, progress (`clean_percent`), area, time and error sensors use their integration translation keys. The separate Roborock dock is matched by its exact device identifier. Other integrations support standard battery and battery-charging device classes; additional sensors can be selected manually. Renaming an entity does not change its semantics. Disabled and ambiguous candidates are skipped, and room controls are never auto-selected.

Use **Refresh sensors** after adding/enabling/renaming entities or if registry loading failed. Reload existing dashboard cards to refresh their registry snapshot. If detection is unavailable, existing manual mappings and vacuum-attribute fallbacks still work. Set `auto_detect: false` (or disable **Automatically select related sensors** in the editor) to use only manual mappings. An explicitly empty field such as `progress_entity: ""` opts that field out of detection and uses the fallback below; remove the YAML key to restore automatic selection.

Optional manual sensor overrides (replace every example with an actual entity or omit it):

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

The following fallbacks apply when no sensor was detected or selected:

| Setting | Fallback |
| --- | --- |
| `status_entity` | Use the vacuum state. |
| `charging_entity` | Animate charging only when the vacuum or configured detailed status explicitly reports `charging`. |
| `battery_entity` | Use the vacuum's `battery_level` attribute, if available. |
| `progress_entity` | Use the vacuum's `cleaning_progress` attribute, if available. |
| `cleaning_area_entity`, `cleaning_time_entity` | Hide these optional statistics. |
| `water_shortage_entity`, `vacuum_error_entity`, `dock_error_entity` | No sensor alert for that source. A vacuum `error` state or `error` attribute still appears. |

Battery and progress accept only numeric 0–100 values. Missing values never become zero. A configured but unavailable source does not silently fall back to another source. Progress is shown during cleaning or returning, labeled **Last reported progress** while returning; no completion percentage is estimated. Area/time reflect the values reported by HA. These cleaning metrics are hidden in the automatic rest view.

Water shortage `on` shows a warning. Error sensor states other than `none`, `ok`, `no_error`, `no error`, `0`, `off` or `false` show their reported error. Missing/unknown/unavailable configured error sensors show a separate **Sensor unavailable** notice. HA's state formatter supplies localized entity values where available; card labels are English.

## Robot controls, suction and map

Supported robot controls are enabled by default. The toolbar offers Start/Resume or Pause depending on the current state, plus Stop, Dock and Locate. Buttons require the corresponding vacuum `supported_features` flag and an available service. Missing/offline robots cannot execute commands. Resume calls `vacuum.start`; no integration-specific raw command is invented. **Robot controls** expands while cleaning/returning and collapses at rest. Disable **Show supported robot controls** in the editor (or set `show_toolbar: false`) to hide it.

**Suction** uses the selected vacuum's exact `fan_speed_list` values and calls `vacuum.set_fan_speed`. No fixed Roborock preset list is assumed. The selection remains at the last HA-reported level until a state update confirms the new value. Room actions and ordinary robot commands share an in-flight lock. Stop can be sent immediately during another pending request; duplicate Stop requests are locked, and older responses cannot overwrite its feedback. A service acknowledgement never means physical cleaning has already started or stopped.

Under **Robot controls and map**, choose an existing `image.*` or `camera.*` entity, such as the Roborock integration's map image. The **Map** section loads Home Assistant's native picture-entity card only when opened and removes it when closed. HA handles image access and updates; tapping it opens more-info. Unavailable maps and loading failures have visible feedback. This is a map display; room cleaning continues to use the explicitly configured buttons/scripts.

```yaml
show_toolbar: true
map_entity: image.your_robot_map
```

## Maintenance and extra statistics

Use **Maintenance and extra statistics > Add statistic** to show filter/brush life, cleaning totals or another reading. Select any source entity, or enter an attribute of the vacuum when the entity field is blank. Optional labels, icons and unit overrides are editable in the UI. **Show when** can be `always`, `working` (cleaning/returning) or `resting`. All readings appear inside a collapsed section; they do not expand the charging header.

```yaml
stats:
  - entity: sensor.your_robot_filter_time_left
    name: Filter remaining
    icon: mdi:air-filter
    when: always
  - attribute: total_clean_count
    name: Total runs
    when: resting
```

Units come from the source entity unless overridden. Attribute values have no assumed unit. Unit overrides only change the label, not the value; use a Home Assistant template sensor for conversions. Zero is preserved, and unavailable entities or missing/non-scalar attributes display **Unavailable**. Statistics are display-only and never reset consumables.

## How room controls work

- `button.*` calls `button.press` with exactly that entity ID. An `unknown` button timestamp is valid for a button that has never been pressed.
- `script.*` calls `script.turn_on` with exactly that entity ID. A running script is disabled until it stops.
- Missing/unavailable controls and an unavailable robot disable room actions. While a call is in flight, all room tiles on that card are disabled to prevent duplicate/concurrent requests. Supported Stop remains available during a pending routine.
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

Automated tests cover supported control/service gating, exact fan-speed values, Stop during pending commands, map loading/cleanup/retry, additional statistics and editor preservation, plus registry scoping, dock association, ambiguous/disabled sensors, automatic/manual selection, async failures and editor overrides, as well as exact button/script targets, in-flight serialization, failure/retry, unavailable controls, zero/missing metrics, sensor alerts, reused `hass`, context subscription cleanup and visual-editor configuration preservation. Browser checks exercise the built bundle. Real Home Assistant editor startup and physical robot operation still require verification in the target installation.

Commit `package-lock.json` and the built bundle with source changes. CI verifies the committed build and HACS requirements; the release workflow requires a matching version tag. See [GitHub Actions](https://github.com/jancrab/homeassistant-vacuum-card/actions) for validation results and [Releases](https://github.com/jancrab/homeassistant-vacuum-card/releases) for downloadable bundles. See also [AGENTS.md](AGENTS.md), [the working guide](docs/working-guide.md) and [the design guide](docs/design-style.md).

## Inspiration

The useful toolbar, map and flexible-statistics concepts were informed by [denysdovhan/vacuum-card](https://github.com/denysdovhan/vacuum-card). This implementation retains its own room-button workflow, sensor discovery, compact rest layout and original SVG. No source code or artwork was copied from that project.

Service semantics follow the [Home Assistant vacuum integration](https://www.home-assistant.io/integrations/vacuum/); map display uses the native [picture-entity card](https://www.home-assistant.io/dashboards/picture-entity/). Capability flags are checked against Home Assistant's [VacuumEntityFeature definitions](https://github.com/home-assistant/core/blob/dev/homeassistant/components/vacuum/const.py).

MIT; see LICENSE.
