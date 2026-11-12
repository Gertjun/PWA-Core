# PWA-Core WebAuthn acceptance fixture

This is a deliberately isolated, test-only page for real browser/authenticator acceptance. It is not a production app.

## Safety and data handling

- Uses a dedicated APP.storagePrefix: pwa-core-acceptance-v1.
- Stores only a password-wrapped synthetic data key and the local WebAuthn enrollment record in the browser's local storage.
- The test password is never stored.
- No network requests, external scripts, CDN resources, GitHub tokens, production vaults or production data are used.
- Resetting the page removes only this fixture's local storage records. It does not delete the test passkey from iCloud Keychain or Windows Hello; remove that credential separately after testing if desired.
- Use a new, dedicated test passkey. Do not reuse a production passkey.

## Deployment

The manual workflow Deploy WebAuthn acceptance fixture copies the current js/core/biometric.js and js/core/crypto.js into the static fixture and publishes it under the acceptance/ path on the gh-pages branch.

Before the first deployment, a repository administrator must enable GitHub Pages in Settings → Pages and select Deploy from a branch → gh-pages → /(root). No repository setting is changed by this PR. After that, run the workflow manually from main.

Default project-site URL:

https://gertjun.github.io/PWA-Core/acceptance/

The page requires HTTPS for WebAuthn. It does not install a service worker and does not test offline caching; those checks belong to each app's later pilot-migration PR.

## Test procedure

1. Open the page on a clean browser profile/device. Confirm the origin and secure-context status.
2. Enter a dedicated test password and create a test vault.
3. Run the password fallback test.
4. On iPhone and iPad, separately register a new test passkey with Face ID and confirm PRF registration succeeds.
5. Close/reopen the page, enter the same test password and run PRF unlock. It must report that passkey and password recover the same test key.
6. On iPad, clear only the local passkey enrollment record, then link the existing passkey from iCloud Keychain. Test PRF unlock again.
7. On Windows 11, test Chrome and Edge separately with Windows Hello. If PRF is unavailable, registration must fail safely, the local enrollment must remain disabled and password fallback must still work.
8. Cancel a passkey prompt and verify the page remains usable and password fallback still succeeds.
9. Test an incorrect password and verify it fails without modifying the stored test vault.
10. Record OS/browser versions and outcomes in docs/PLATFORM-ACCEPTANCE.md; never record passwords, PRF bytes, credential IDs or test-key material.

## Updating the fixture

The workflow copies the two current core modules at deployment time, so the fixture does not keep a second manually maintained copy of the implementation. The fixture's config is intentionally separate and supplies only the test app name and storage namespace.
