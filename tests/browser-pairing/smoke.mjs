// Test-only browser smoke test. All app and GitHub requests are intercepted.
// No real credentials, remote writes, service workers or authenticators.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE);
const origin = 'http://localhost:4173';
const password = 'Synthetic-password-42!';
const marker = 'Synthetic browser fixture record';
const github = { owner: 'synthetic-owner', repo: 'synthetic-repo', branch: 'main', path: 'vault.json', token: 'synthetic-token' };
const prefix = 'browser-pairing-fixture';
const config = { name: 'Pairing test fixture', version: '0.0.0', storagePrefix: prefix, defaultDataPath: 'vault.json', defaultBranch: 'main', autoLockMinutes: 0, autoBiometricUnlock: false, syncDelaySeconds: 60, minPasswordLength: 12, kdfIterations: 100000 };
const app = `export const app = {
  screens: [{id:'items', label:'Lijst', icon:'list'}], schemaVersion:1,
  initialData:()=>({schema:1,marker:${JSON.stringify(marker)}}),
  migrate:d=>d, merge:(a,b)=>({...b,...a}),
  render(root,ctx){root.textContent=ctx.data.marker;}
};`;
const browser = await chromium.launch({ channel: 'chrome', headless: true });
let remote = null, sha = 'synthetic-sha-0', offline = false, revision = 0;
let stage = 'startup';
const errors = [];
async function makePage() {
  const context = await browser.newContext({ serviceWorkers: 'block' });
  await context.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url());
    if (url.origin === origin) {
      const path = url.pathname;
      if (path === '/' || path === '/index.html') return route.fulfill({ contentType:'text/html', body:await readFile('tests/browser-pairing/index.html','utf8') });
      if (path === '/js/config.js') return route.fulfill({ contentType:'text/javascript', body:'export const APP = '+JSON.stringify(config) });
      if (path === '/js/main.js') return route.fulfill({ contentType:'text/javascript', body:"import { start } from './core/shell.js'; start().catch(e=>{document.body.textContent='Fixture start failed'; throw e;});" });
      if (path === '/js/app.js') return route.fulfill({ contentType:'text/javascript', body:app });
      if (/^\/js\/core\/[a-z0-9-]+\.js$/.test(path) || path === '/css/base.css') {
        return route.fulfill({ contentType:path.endsWith('.css')?'text/css':'text/javascript', body:await readFile(resolve('.'+path),'utf8') });
      }
      return route.fulfill({status:404,body:''});
    }
    if (url.origin === 'https://api.github.com') {
      const headers = {'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'GET,PUT,OPTIONS'};
      const reply = (status, json) => route.fulfill({status,headers,contentType:'application/json',body:JSON.stringify(json)});
      if (request.method()==='OPTIONS') return reply(200,{});
      if (request.headers().authorization !== 'Bearer synthetic-token') return reply(401,{message:'synthetic unauthorized'});
      if (offline) return route.abort('internetdisconnected');
      if (url.pathname === '/repos/synthetic-owner/synthetic-repo') return reply(200,{private:true,default_branch:'main'});
      if (url.pathname !== '/repos/synthetic-owner/synthetic-repo/contents/vault.json') return reply(404,{});
      if (request.method()==='GET') return remote ? reply(200,{sha,encoding:'base64',content:remote}) : reply(404,{});
      if (request.method()==='PUT') {
        remote = request.postDataJSON().content;
        sha = 'synthetic-sha-'+(++revision);
        return reply(200,{content:{sha}});
      }
      return reply(405,{});
    }
    return route.abort();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.on('pageerror', () => errors.push('page error'));
  page.on('dialog', dialog => dialog.accept());
  return page;
}
const visible = (page, selector) => page.locator(selector).waitFor({state:'visible',timeout:15000});
try {
  stage='source create';
  const source = await makePage();
  await source.goto(origin);
  await visible(source,'#form-setup-new');
  await source.locator('#form-setup-new [name=password]').fill(password);
  await source.locator('#form-setup-new [name=confirm]').fill(password);
  await source.locator('#form-setup-new button[type=submit]').click();
  await visible(source,'#screen-app');
  assert.equal(await source.locator('#app-root').textContent(),marker);
  stage='source configure';
  stage='source open settings';
  await source.locator('[data-screen=settings]').click();
  stage='source open sync page';
  await source.locator('[data-page=sync]').click();
  stage='source connection disclosure';
  // Core opens this disclosure automatically for an unconfigured vault.
  const connection = source.locator('#sync-connection');
  if (!(await connection.evaluate(el => el.open))) await connection.locator('summary').click();
  await visible(source,'#form-github [name=owner]');
  stage='source fill settings';
  for (const [name,value] of Object.entries(github)) await source.locator('#form-github [name='+name+']').fill(value);
  stage='source save and sync';
  await source.locator('#form-github button[type=submit]').click();
  await source.waitForFunction(()=>!document.querySelector('#form-github button[type=submit]').disabled);
  assert.ok(remote,'mock upload expected');
  stage='source QR';
  await source.locator('#btn-pair-out').click();
  await visible(source,'#dlg-pair .pair-qr');
  const code = await source.locator('#dlg-pair textarea').inputValue();
  assert.ok(code.startsWith('PWA-CORE-PAIR-3:'),'v3 expected');
  assert.equal(await source.locator('#dlg-pair #pair-pin-panel').count(),0);
  await source.locator('#dlg-pair button').filter({hasText:'Klaar'}).click();
  const link = await source.evaluate(async code => (await import('/js/core/pairing-ui.js')).pairingLink(code,location.href),code);
  stage='target QR';
  const target = await makePage();
  await target.goto(link);
  await visible(target,'#form-setup-link');
  assert.equal(new URL(target.url()).hash,'');
  assert.equal(await target.locator('#form-setup-link [name=pairCode]').inputValue(),code);
  assert.equal(await target.locator('#form-setup-link [name=pairPin]').isVisible(),false);
  assert.equal(await target.locator('#form-setup-link [name=password]').isVisible(),false);
  stage='target offline';
  offline=true;
  await target.locator('#form-setup-link button[type=submit]').click();
  await visible(target,'#setup-error');
  assert.match(await target.locator('#setup-error').textContent(),/Geen verbinding/);
  assert.equal(await target.evaluate(p=>localStorage.getItem(p+':vault')===null,prefix),true);
  stage='target retry';
  offline=false;
  await target.locator('#form-setup-link button[type=submit]').click();
  await visible(target,'#screen-app');
  assert.equal(await target.locator('#app-root').textContent(),marker);
  assert.equal(await target.evaluate(p=>!!localStorage.getItem(p+':pairing:used'),prefix),true);
  assert.equal(await target.evaluate(p=>!localStorage.getItem(p+':device').includes('synthetic-token'),prefix),true);
  stage='password fallback';
  await target.locator('#btn-lock').click();
  await visible(target,'#form-unlock');
  await target.locator('#form-unlock [name=password]').fill(password);
  await target.locator('#form-unlock button[type=submit]').click();
  await visible(target,'#screen-app');
  assert.equal(await target.locator('#app-root').textContent(),marker);
  stage='same-document existing vault guard';
  const currentVault = await target.evaluate(p=>localStorage.getItem(p+':vault'),prefix);
  await target.evaluate(link=>{ location.hash = new URL(link).hash; },link);
  await target.waitForFunction(()=>!location.hash);
  assert.equal(await target.locator('#screen-app').isVisible(),true);
  assert.equal(await target.evaluate(p=>localStorage.getItem(p+':vault'),prefix),currentVault);
  assert.match(await target.locator('#toast').textContent(),/al een kluis/);
  stage='same-document fresh setup';
  const fresh = await makePage();
  await fresh.goto(origin);
  await visible(fresh,'#form-setup-new');
  await fresh.evaluate(link=>{ location.hash = new URL(link).hash; },link);
  await visible(fresh,'#form-setup-link');
  assert.equal(new URL(fresh.url()).hash,'');
  assert.equal(await fresh.locator('#form-setup-link [name=pairCode]').inputValue(),code);
  assert.equal(await fresh.locator('#form-setup-link [name=password]').isVisible(),false);
  stage='existing vault guard snapshot';
  const before = await target.evaluate(p=>localStorage.getItem(p+':vault'),prefix);
  assert.ok(before,'existing encrypted vault expected');
  // A same-document fragment navigation does not run the startup handler.
  // A new tab in the same context models opening the QR link in a fresh document
  // while retaining the existing device's local storage.
  stage='existing vault guard fresh document';
  const existing = await target.context().newPage();
  existing.on('pageerror', () => errors.push('page error'));
  await existing.goto(link);
  await visible(existing,'#form-unlock');
  stage='existing vault guard assertions';
  assert.equal(new URL(existing.url()).hash,'');
  assert.equal(await existing.locator('#form-setup-link').isVisible(),false);
  assert.equal(await existing.evaluate(p=>localStorage.getItem(p+':vault'),prefix),before);
  assert.match(await existing.locator('#toast').textContent(),/al een kluis/);
  assert.equal(errors.length,0,'unexpected browser error');
  console.log('PASS: synthetic browser QR, offline retry, password fallback and existing-vault guard');
} catch (error) {
  // Avoid dumping locator values, links, or secret material in CI logs.
  console.error('Browser pairing smoke test failed at stage:',stage,'(',error.name,')');
  process.exitCode=1;
} finally {
  await browser.close();
}
