// Gedeelde koppel-interface: QR-code tonen, koppelcode/pincode delen en een
// binnenkomende QR-link (?pair=…) opvangen. De cryptografie blijft in pair.js.
// Bruikbaar vanuit shell.js én vanuit apps met een eigen schil (Cryptotracker,
// Vaste Lasten). De app blijft eigenaar van wat er met de syncConfig gebeurt.

import qrcode from './qrcode.js';
import * as pair from './pair.js';
import { h } from './dom.js';

export const PAIR_PARAM = 'pair';
const CODE_PREFIX = 'PWA-CORE-PAIR-2:';

/** Standaard opslagnaam voor de lokale replaybescherming van een app. */
export function pairingUsedKey(storagePrefix) {
  return `${storagePrefix}:pairing:used`;
}

/**
 * Haalt een koppelcode uit geplakte tekst: een kale code of een volledige
 * QR-link met ?pair=. Geeft '' terug als er geen koppelcode in staat.
 */
export function extractPairCode(input) {
  const text = String(input ?? '').trim();
  if (!text) return '';
  const compact = text.replace(/\s+/g, '');
  if (compact.startsWith(CODE_PREFIX)) return compact;
  try {
    const code = new URL(text).searchParams.get(PAIR_PARAM);
    if (code && code.trim().startsWith(CODE_PREFIX)) return code.trim();
  } catch { /* geen URL */ }
  return '';
}

/** Bouwt de app-link die de camera opent: <app-url>?pair=<code>. */
export function pairingLink(code, appUrl) {
  const url = new URL('./', appUrl);
  url.searchParams.set(PAIR_PARAM, code);
  return url.toString();
}

/**
 * Leest ?pair= uit de huidige URL en haalt hem daar direct weg, zodat de code
 * niet in de geschiedenis of een bladwijzer blijft staan.
 * Geeft { code } terug, { invalid: true } bij een onbruikbare waarde, of null.
 */
export function takeIncomingPairCode({ location = globalThis.location, history = globalThis.history } = {}) {
  if (!location?.href) return null;
  const url = new URL(location.href);
  if (!url.searchParams.has(PAIR_PARAM)) return null;
  const raw = url.searchParams.get(PAIR_PARAM) || '';
  url.searchParams.delete(PAIR_PARAM);
  history?.replaceState?.(history.state, '', url.pathname + url.search + url.hash);
  const code = extractPairCode(raw);
  return code ? { code } : { invalid: true };
}

/** Maakt een QR-afbeelding (data-URL) of null als de link niet in één QR-code past. */
export function qrDataUrl(text) {
  try {
    const qr = qrcode(0, 'L');
    qr.addData(text, 'Byte');
    qr.make();
    return qr.createDataURL(5, 4);
  } catch {
    return null;
  }
}

/**
 * Maakt een koppeling voor een ander apparaat: pincode, code, app-link en QR.
 * Valt terug op een tekstcode zonder QR als de gegevens te groot zijn.
 */
export async function createPairing({ syncConfig, context, appUrl, now } = {}) {
  const pin = pair.newPin();
  let created;
  let transport = 'qr';
  try {
    created = await pair.createPairingCode({ syncConfig, pin, context, now, transport });
  } catch (err) {
    if (!/QR-code/.test(err?.message || '')) throw err;
    transport = 'text';
    created = await pair.createPairingCode({ syncConfig, pin, context, now, transport });
  }
  const code = created.payload;
  const link = appUrl ? pairingLink(code, appUrl) : null;
  const qr = transport === 'qr' && link ? qrDataUrl(link) : null;
  return { pin, code, link, qr, expiresAt: created.expiresAt, pairingId: created.pairingId };
}

/**
 * Opent een binnenkomende koppelcode (QR of handmatig) en controleert de
 * lokale replayhistorie, zonder iets te registreren. Roep na een geheel
 * geslaagde koppeling `markUsed()` aan.
 */
export async function openPairing({ input, pin, context, storage = globalThis.localStorage, storageKey, now = Date.now() } = {}) {
  const code = extractPairCode(input);
  if (!code) throw new Error('Plak de koppelcode of de link uit de QR-code.');
  if (!String(pin ?? '').trim()) throw new Error('Vul de pincode in die op je andere apparaat staat.');
  const key = storageKey ?? pairingUsedKey(context);
  const opened = await pair.openPairingCode({ payload: code, pin, context, now, transport: 'text' });
  pair.assertPairingNotUsed(storage, opened.pairingId, { storageKey: key, now });
  return {
    syncConfig: opened.syncConfig,
    pairingId: opened.pairingId,
    markUsed: () => pair.markPairingUsed(storage, opened.pairingId, { storageKey: key }),
  };
}

async function copy(text, field, toast, what) {
  try {
    await navigator.clipboard.writeText(text);
    toast(`${what} gekopieerd.`, 'ok');
  } catch {
    field?.select?.();
    toast(`Kopiëren lukte niet. Selecteer de ${what.toLowerCase()} en kopieer hem zelf.`);
  }
}

/**
 * Toont het venster "Ander apparaat koppelen" met QR-code, koppelcode en
 * (in een apart paneel) de pincode.
 */
export async function openPairOutDialog({ syncConfig, context, appName, appUrl = globalThis.location?.href, toast = () => {} } = {}) {
  const { pin, code, qr } = await createPairing({ syncConfig, context, appUrl });
  const field = h('textarea', { class: 'pair-code', readonly: true, rows: 3, 'aria-label': 'Koppelcode' }, code);
  const copyCode = h('button', { class: 'btn', type: 'button' }, 'Koppelcode kopiëren');
  const showPin = h('button', { class: 'btn btn-primary', type: 'button' }, qr ? 'Pincode tonen (QR-code verbergen)' : 'Pincode tonen (koppelcode verbergen)');
  const copyPin = h('button', { class: 'btn btn-primary', type: 'button' }, 'Pincode kopiëren');
  const backToCode = h('button', { class: 'btn', type: 'button' }, qr ? 'Terug naar QR-code' : 'Terug naar koppelcode');
  const qrImage = qr ? h('img', { class: 'pair-qr', src: qr, alt: `QR-code om ${appName} op een ander apparaat te koppelen` }) : null;
  const codeDetails = qr
    ? h('details', { class: 'pair-code-details' }, h('summary', {}, 'Geen camera? Gebruik de koppelcode'), h('div', { class: 'stack' }, field, copyCode))
    : h('div', { class: 'stack' }, field, copyCode);
  const codePanel = h('div', { class: 'stack', id: 'pair-code-panel' }, qrImage, codeDetails, showPin);
  const pinPanel = h('div', { class: 'stack', id: 'pair-pin-panel', hidden: true },
    h('p', { class: 'pair-pin' }, h('span', { class: 'muted' }, 'Pincode'), h('strong', {}, pin)),
    h('p', { class: 'hint' }, 'De koppelcode is verborgen. Vul deze pincode in op het nieuwe apparaat. Sluit je dit venster, dan is de pincode weg.'),
    copyPin, backToCode);
  const close = h('button', { class: 'btn', type: 'button' }, 'Klaar');
  const steps = qr
    ? [
      h('li', {}, 'Scan de QR-code met de camera van je andere apparaat en open de link.'),
      h('li', {}, 'Tik hier op ', h('strong', {}, 'Pincode tonen'), ' en vul die pincode daar in, samen met het wachtwoord van je kluis.'),
    ]
    : [
      h('li', {}, `Kopieer de koppelcode en plak die in ${appName} op je andere apparaat (Bestaande koppelen).`),
      h('li', {}, 'Tik hier op ', h('strong', {}, 'Pincode tonen'), ' en vul die pincode daar in, samen met het wachtwoord van je kluis.'),
    ];
  const dlg = h('dialog', { id: 'dlg-pair', class: 'sheet pair-sheet', 'aria-labelledby': 'pair-title' },
    h('div', { class: 'sheet-header' }, h('h2', { id: 'pair-title' }, 'Ander apparaat koppelen')),
    h('div', { class: 'sheet-body stack' },
      h('ol', { class: 'pair-steps' }, ...steps),
      h('p', { class: 'hint' }, 'De code is drie minuten geldig.'),
      codePanel, pinPanel, close));
  showPin.addEventListener('click', () => { codePanel.hidden = true; pinPanel.hidden = false; });
  backToCode.addEventListener('click', () => { pinPanel.hidden = true; codePanel.hidden = false; });
  copyCode.addEventListener('click', () => copy(code, field, toast, 'Koppelcode'));
  copyPin.addEventListener('click', () => copy(pin, null, toast, 'Pincode'));
  close.addEventListener('click', () => dlg.close());
  dlg.addEventListener('close', () => dlg.remove());
  document.body.append(dlg);
  dlg.showModal();
  return dlg;
}
