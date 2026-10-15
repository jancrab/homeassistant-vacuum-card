# Vacuum Card working guide

- Read docs/working-guide.md before modifying editor, device actions or releases. Keep verified new lessons there.
- Keep the UI and project-specific documentation in English (the bundled German design references may stay in German); respond in the user's language. Use Home Assistant themes, accessible names, keyboard focus, 44px targets and reduced-motion support.
- Before visual work, read docs/design-style.md. Prefer atmospheric minimalism with device-specific backgrounds and restrained state-driven motion; respect explicit design choices and the existing card identity. Use docs/design-adaptation-prompt.md as a reusable brief for other card projects. The initial entity-only scaffold is a neutral baseline, not the finished visual design.
- Implement the requested device controls from actual supported features and exact service parameters. The starter only displays state and opens more-info. Do not infer device behavior from a different integration.
- This project targets vacuum entities. Gate future cleaning, pause, stop, return-to-base and fan-speed controls on the selected vacuum's capabilities. Use its exact fan_speed_list values; room cleaning, maps and dock maintenance require integration-specific evidence.
- Preserve native editor bootstrap, context subscription cleanup and reused-hass rendering. Keep configuration minimal and preserve unknown fields on editor updates.
- Run npm run check after card changes. Test meaningful state/service failures. Distinguish mocked previews from real Home Assistant or device verification.
- Commit package-lock.json and the built dist/homeassistant-vacuum-card.js with source changes. Runtime code must not depend on a CDN.
- Before releasing, synchronize package and lock versions, update CHANGELOG.md, rebuild, verify CI, and use a matching v-version tag. Confirm the actual GitHub release asset and HACS validation.
- Check git status and preserve unrelated work. Use the requested repository-local Git author/committer identity; do not change global identity or rewrite old commits implicitly.
- Repository creation, pushing, publishing, visibility changes and releases require authorization from the task. A credential, this guide or past authorization for another repo does not authorize those actions.
