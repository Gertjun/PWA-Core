// Unieke namespace voor deze testfixture. Niet hergebruiken in productie-apps.
// Bewust langer dan 64 bytes om de compacte WebAuthn-userHandle te accepteren.
export const APP = Object.freeze({
  name: 'PWA-Core acceptatietest',
  storagePrefix: 'pwa-core-acceptance-long-namespace-v1-' + 'x'.repeat(72),
});
