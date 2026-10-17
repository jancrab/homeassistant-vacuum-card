# Changelog

## 0.6.0 — 2026-10-17

- Add capability-gated Start/Resume, Pause, Stop, Dock and Locate controls, with exact integration-provided suction levels.
- Collapse the toolbar at rest and expand it while working. Keep Stop available during an in-flight routine; protect feedback against stale responses.
- Add an optional, explicitly selected image/camera map using HA's native picture card, loaded only while expanded, with failure/retry feedback.
- Add UI-configurable maintenance and extra statistics from entities or attributes, with labels, icons, units and working/resting visibility.
- Preserve the room-control workflow, automatic sensor selection and compact rest presentation. Feature concepts were inspired by denysdovhan/vacuum-card; implementation and artwork remain original.
- Validate using mocked tests and browser scenarios. Native HA map rendering and physical device operation still require target-installation verification.

## 0.5.0 — 2026-10-17

- Automatically select related battery/charging sensors and Roborock status, progress, area/time and error sensors through HA's device and entity registries, including the associated dock.
- Show detected values in the visual editor, preserve manual overrides and offer refresh, reset and opt-out controls. Automatic mappings follow the selected vacuum; room targets stay explicit.
- Skip disabled and ambiguous candidates, handle registry failures and ignore stale responses.
- Remove the extra dock silhouette above the robot; retain one centered status icon with charging animation.
- Verify discovery and UI behavior with mocks; target Home Assistant/device verification is still required.

## 0.4.0 — 2026-10-17

- Automatically shrink both layouts outside cleaning/returning: keep status, battery, robot icon, room controls and alerts, and omit cleaning metrics at rest.
- Restore the configured working layout on live state changes, without changing saved configuration.
- Replace large statistics blocks with a slim icon-and-value row with accessible labels.

## 0.3.0

- Add a small animated robot icon for cleaning, returning and confirmed charging, with static docked, paused, idle, error and offline symbols.
- Add an optional charging binary-sensor mapping to the visual editor; docked alone never implies charging.
- Make compact layout substantially denser while retaining room labels, error messages and 44 px button targets.
- Pause animation outside the viewport and in hidden tabs, honor reduced motion and clean up observers/listeners on disconnect.

## 0.2.0

- Add configurable room tiles for existing cleaning buttons/scripts, with names, icons and visual-editor add/remove/reorder controls.
- Show robot status, battery, optional cleaning progress, cleaned area/time, water shortage and vacuum/dock errors.
- Report unavailable data, prevent concurrent calls and show action failures with retry support.
- Add theme-native compact/wide layouts and an interactive simulated demo with light/dark, narrow, offline and error states.
- Verify actions, state updates, metrics, alerts and editor changes with mocks; real Home Assistant/device verification remains outstanding.

## 0.1.0

- Initial card scaffold with entity picker, compact/wide layout, visual editor, theme variables, simulated preview and HACS build/release setup.
- Domain-specific controls and real Home Assistant testing remain part of implementation.
