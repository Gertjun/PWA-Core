// Houdt één exclusieve schrijfsessie per app-opslagprefix vast.
// Web Locks is de mutex; notificaties/storage-events zijn hiervoor niet voldoende.
import { APP } from '../config.js';

const LOCK_NAME = `pwa-core:${APP.storagePrefix}:unlocked-session`;
let activeRelease = null;
let pendingAcquire = null;

export class SessionLockUnavailableError extends Error {
  constructor() {
    super('Deze browser ondersteunt de vereiste veilige tabsynchronisatie niet. Open de app in een actuele browser.');
    this.name = 'SessionLockUnavailableError';
  }
}

export class SessionLockBusyError extends Error {
  constructor() {
    super('Deze app is al ontgrendeld in een ander tabblad. Vergrendel of sluit eerst dat tabblad.');
    this.name = 'SessionLockBusyError';
  }
}

/**
 * Verkrijg de Web Lock vóór create/import/unlock en houd hem vast tot release().
 * Geeft null terug wanneer een andere tab de sessie al bezit.
 */
export async function acquireSessionLock() {
  if (activeRelease) return { release: activeRelease };
  if (pendingAcquire) return pendingAcquire;

  pendingAcquire = (async () => {
    const locks = globalThis.navigator?.locks;
    if (!locks?.request) throw new SessionLockUnavailableError();

    let settleStart;
    let rejectStart;
    let startSettled = false;
    const started = new Promise((resolve, reject) => {
      settleStart = (value) => { startSettled = true; resolve(value); };
      rejectStart = (error) => { startSettled = true; reject(error); };
    });

    let releaseHold;
    const hold = new Promise((resolve) => { releaseHold = resolve; });
    let localRelease = null;
    let request;

    request = locks.request(LOCK_NAME, { mode: 'exclusive', ifAvailable: true }, async (lock) => {
      if (!lock) {
        settleStart(false);
        return;
      }
      localRelease = () => {
        if (activeRelease === localRelease) activeRelease = null;
        releaseHold();
        // Pas resolve'n nadat de Web Locks-callback is geëindigd en de browser
        // de lock daadwerkelijk heeft vrijgegeven.
        return request;
      };
      activeRelease = localRelease;
      settleStart(true);
      await hold;
      if (activeRelease === localRelease) activeRelease = null;
    });

    // Vangt ook fouten af die optreden voordat de browser de callback start.
    request.catch((error) => {
      if (!startSettled) rejectStart(error);
      else if (activeRelease === localRelease) activeRelease = null;
    });

    const acquired = await started;
    if (!acquired) {
      await request;
      return null;
    }
    return { release: localRelease };
  })();

  try {
    return await pendingAcquire;
  } finally {
    pendingAcquire = null;
  }
}

export function hasSessionLock() {
  return activeRelease !== null;
}
