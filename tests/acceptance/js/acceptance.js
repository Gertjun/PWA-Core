import { APP } from './config.js';
import * as biometric from './core/biometric.js';
import * as cryptoModule from './core/crypto.js';

const VAULT_KEY = APP.storagePrefix + ':test-vault';
const ITERATIONS = 600_000;
const $ = (id) => document.getElementById(id);

function log(message) {
  const item = document.createElement('li');
  item.textContent = new Date().toLocaleTimeString() + ' – ' + message;
  $('log').prepend(item);
}

function status(message, kind = 'info') {
  $('status').textContent = message;
  $('status').dataset.kind = kind;
  log(message);
}

function readVaultRecord() {
  const raw = localStorage.getItem(VAULT_KEY);
  if (!raw) throw new Error('Er is nog geen lokale testkluis. Maak eerst een testkluis met je testwachtwoord.');
  const record = JSON.parse(raw);
  if (record.iterations !== ITERATIONS || !record.salt || !record.wrapped) {
    throw new Error('De lokale testkluis is ongeldig. Wis de testgegevens en maak een nieuwe testkluis.');
  }
  return record;
}

class WrongPasswordError extends Error {
  constructor() {
    super('Onjuist wachtwoord.');
    this.name = 'WrongPasswordError';
  }
}

async function keyFromPassword() {
  const password = $('password').value;
  if (!password) throw new Error('Vul eerst het testwachtwoord in.');
  const record = readVaultRecord();
  const salt = cryptoModule.b64ToBytes(record.salt);
  const wrappingKey = await cryptoModule.passwordKey(password, salt, record.iterations);
  try {
    return await cryptoModule.unwrapDataKey(record.wrapped, wrappingKey);
  } catch {
    // AES-GCM kan een verkeerd wachtwoord niet onderscheiden van een
    // beschadigde wrapped key. Geef daarom geen browser-/crypto-details door.
    throw new WrongPasswordError();
  }
}

async function refreshState() {
  $('origin').textContent = location.origin;
  $('secure').textContent = window.isSecureContext ? 'Ja' : 'Nee – WebAuthn vereist een beveiligde context';
  let capability = 'Onbekend';
  try {
    const supported = await biometric.isSupported();
    const api = window.PublicKeyCredential;
    let prf = 'niet gerapporteerd';
    if (api && typeof api.getClientCapabilities === 'function') {
      try {
        const values = await api.getClientCapabilities();
        const value = values && values['extension:prf'];
        prf = value === true ? 'ja' : value === false ? 'nee' : 'onbekend';
      } catch {
        prf = 'detectie niet beschikbaar';
      }
    }
    capability = 'platform/passkey: ' + (supported ? 'beschikbaar' : 'niet beschikbaar') + '; browser-PRF: ' + prf;
  } catch {
    capability = 'Detectie mislukt; wachtwoordfallback blijft beschikbaar.';
  }
  $('capability').textContent = capability;
  $('enrollment').textContent = biometric.isEnrolled() ? 'Lokaal ingesteld' : 'Niet ingesteld';
}

async function run(label, action) {
  try {
    await action();
    await refreshState();
  } catch (error) {
    const name = error && error.name ? error.name : 'Error';
    const message = error && error.message ? error.message : 'Onbekende fout';
    status(label + ': ' + name + ' – ' + message, 'error');
    await refreshState();
  }
}

$('refresh').addEventListener('click', () => run('Platformcontrole', async () => {
  await refreshState();
  status('Platformcontrole bijgewerkt.');
}));

$('create-vault').addEventListener('click', () => run('Testkluis', async () => {
  const password = $('password').value;
  if (!password || password.length < 8) throw new Error('Kies een testwachtwoord van minimaal 8 tekens.');
  const dataKey = await cryptoModule.generateDataKey();
  const salt = cryptoModule.randomBytes(16);
  const wrappingKey = await cryptoModule.passwordKey(password, salt, ITERATIONS);
  const wrapped = await cryptoModule.wrapDataKey(dataKey, wrappingKey);
  biometric.disable();
  localStorage.setItem(VAULT_KEY, JSON.stringify({
    iterations: ITERATIONS,
    salt: cryptoModule.bytesToB64(salt),
    wrapped,
  }));
  status('Testkluis aangemaakt. De datasleutel is versleuteld opgeslagen; wachtwoord en sleutel zijn niet opgeslagen.', 'success');
}));

$('password-test').addEventListener('click', () => run('Wachtwoordfallback', async () => {
  await keyFromPassword();
  status('Wachtwoordfallback geslaagd: de lokale testdatasleutel kon worden ontgrendeld.', 'success');
}));

$('register').addEventListener('click', () => run('Passkeyregistratie', async () => {
  const dataKey = await keyFromPassword();
  await biometric.enroll(dataKey);
  status('Passkeyregistratie geslaagd. De authenticator heeft bruikbare PRF-uitvoer geleverd.', 'success');
}));

$('link-existing').addEventListener('click', () => run('Bestaande passkey koppelen', async () => {
  const dataKey = await keyFromPassword();
  await biometric.enrollExisting(dataKey);
  status('Bestaande passkey gekoppeld. Controleer daarna de PRF-ontgrendeling.', 'success');
}));

$('unlock').addEventListener('click', () => run('PRF-ontgrendeling', async () => {
  const expected = await keyFromPassword();
  if (!biometric.isEnrolled()) throw new Error('Er is lokaal geen testpasskey gekoppeld.');
  const actual = await biometric.unlock();
  if (!(await cryptoModule.sameKey(expected, actual))) {
    throw new Error('De passkey leverde niet dezelfde testdatasleutel op als het testwachtwoord.');
  }
  status('PRF-ontgrendeling geslaagd: passkey en wachtwoord leveren dezelfde testdatasleutel op.', 'success');
}));

$('disable-local').addEventListener('click', () => run('Lokale registratie', async () => {
  biometric.disable();
  status('Lokale passkeyregistratie gewist. De platformpasskey en testkluis zijn niet verwijderd.', 'success');
}));

$('reset').addEventListener('click', () => run('Testgegevens wissen', async () => {
  biometric.disable();
  localStorage.removeItem(VAULT_KEY);
  $('password').value = '';
  status('Lokale testkluis en lokale passkeyregistratie gewist. Verwijder de testpasskey zo nodig ook uit het platformwachtwoordbeheer.', 'success');
}));

refreshState().then(() => log('Testfixture geladen. Geen netwerkverzoeken worden uitgevoerd.'));
