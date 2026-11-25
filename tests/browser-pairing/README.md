# Synthetic browser pairing fixture

HTML based on PWA-Template index.html, with nonessential assets removed. The smoke script routes all requests in isolated Chrome contexts and supplies a tiny synthetic app/config plus the actual checked-out Core. No real network API calls or production credentials. The existing CI job uses the runner's installed Chrome, not a second browser download. This is not a WebAuthn, installed-PWA or offline service-worker acceptance test.
