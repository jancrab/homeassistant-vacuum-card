# Project workflow

The baseline uses Lit, a bundled ES module, a native HA form editor, node:test and Happy DOM. The initial card displays entity state and opens more-info; add the requested domain controls with capability checks and error feedback.

## Editor and state

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
