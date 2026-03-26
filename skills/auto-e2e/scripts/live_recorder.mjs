#!/usr/bin/env node
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import readline from 'readline';
import { createRequire } from 'module';

const state = {
  playwright: null,
  browser: null,
  context: null,
  page: null,
  session: null,
  persistentContext: false,
  pendingStorageSavePath: null,
};

function jsonResponse(id, ok, payload) {
  const body = ok ? { id, ok: true, result: payload } : { id, ok: false, error: payload };
  process.stdout.write(`${JSON.stringify(body)}\n`);
}

function fail(message, details) {
  const error = new Error(message);
  if (details) {
    error.details = details;
  }
  return error;
}

function requirePayload(payload, key) {
  if (!payload || !(key in payload)) {
    throw fail(`Missing required payload field: ${key}`);
  }
  return payload[key];
}

async function ensureDir(filePath) {
  const dir = path.dirname(path.resolve(process.cwd(), filePath));
  await fsp.mkdir(dir, { recursive: true });
}

function resolveRuntime(runtime = {}) {
  return {
    profileMode: runtime.profileMode || 'incognito',
    headless: 'headless' in runtime ? !!runtime.headless : false,
    profileDir: runtime.profileDir,
    storageStatePath: runtime.storageStatePath,
    storageStateName: runtime.storageStateName,
    initializeStorageStateIfMissing: !!runtime.initializeStorageStateIfMissing,
  };
}

function buildMockPlaywright() {
  class MockPage {
    constructor() {
      this._url = 'about:blank';
      this._title = 'Mock Page';
    }
    async goto(url) {
      this._url = url;
    }
    url() {
      return this._url;
    }
    async title() {
      return this._title;
    }
    async waitForLoadState() {}
    async waitForTimeout() {}
    async evaluate(fn) {
      if (typeof fn === 'function') {
        return fn();
      }
      return null;
    }
  }

  class MockContext {
    constructor() {
      this._page = new MockPage();
    }
    pages() {
      return [this._page];
    }
    async newPage() {
      this._page = new MockPage();
      return this._page;
    }
    async close() {}
    async storageState(options = {}) {
      const data = { cookies: [], origins: [], mock: true };
      if (options.path) {
        await ensureDir(options.path);
        await fsp.writeFile(path.resolve(process.cwd(), options.path), JSON.stringify(data, null, 2));
      }
      return data;
    }
  }

  class MockBrowser {
    async newContext() {
      return new MockContext();
    }
    async close() {}
  }

  return {
    chromium: {
      async launch() {
        return new MockBrowser();
      },
      async launchPersistentContext() {
        return new MockContext();
      },
    },
  };
}

async function loadPlaywright() {
  if (state.playwright) {
    return state.playwright;
  }
  if (process.env.AEE_MOCK === '1') {
    state.playwright = buildMockPlaywright();
    return state.playwright;
  }
  const cwdPackage = path.join(process.cwd(), 'package.json');
  const req = createRequire(fs.existsSync(cwdPackage) ? cwdPackage : import.meta.url);
  try {
    state.playwright = req('playwright');
  } catch (error) {
    throw fail(
      'Unable to load playwright from the shared home directory. Run npm install in ~/.auto-e2e/ before starting the recorder.',
      { cause: error.message }
    );
  }
  return state.playwright;
}

async function getSnapshot() {
  if (!state.page) {
    return { active: false };
  }
  let textPreview = '';
  try {
    textPreview = await state.page.evaluate(() => {
      const body = document?.body?.innerText || '';
      return body.trim().slice(0, 1000);
    });
  } catch {
    textPreview = '';
  }
  return {
    active: true,
    url: typeof state.page.url === 'function' ? state.page.url() : state.page._url,
    title: await state.page.title(),
    textPreview,
    sessionMode: state.session?.sessionMode || null,
    browserRuntime: state.session?.browserRuntime || null,
    pendingStorageSavePath: state.pendingStorageSavePath,
  };
}

async function settle() {
  if (!state.page) return;
  try {
    await state.page.waitForLoadState('networkidle', { timeout: 5000 });
  } catch {
    // ignore and continue with the extra wait
  }
  await state.page.waitForTimeout(1000);
}

async function closeLiveSession() {
  const closeErrors = [];
  try {
    if (state.context && !state.persistentContext) {
      await state.context.close();
    }
  } catch (error) {
    closeErrors.push(`context: ${error.message}`);
  }
  try {
    if (state.browser) {
      await state.browser.close();
    }
  } catch (error) {
    closeErrors.push(`browser: ${error.message}`);
  }
  try {
    if (state.context && state.persistentContext) {
      await state.context.close();
    }
  } catch (error) {
    closeErrors.push(`persistentContext: ${error.message}`);
  }
  state.browser = null;
  state.context = null;
  state.page = null;
  state.session = null;
  state.persistentContext = false;
  state.pendingStorageSavePath = null;
  if (closeErrors.length) {
    throw fail('Failed to close the live session cleanly.', { closeErrors });
  }
}

async function startSession(payload = {}) {
  if (state.session) {
    throw fail('A recorder session is already active. Finish or abort it before starting another.');
  }
  const sessionMode = payload.sessionMode || 'record';
  const targetUrl = payload.targetUrl || null;
  const browserRuntime = resolveRuntime(payload.browserRuntime);
  const storageBehavior = payload.storageBehavior || null;

  const { chromium } = await loadPlaywright();
  let browser = null;
  let context = null;
  let pendingStorageSavePath = null;
  let persistentContext = false;

  if (sessionMode === 'storage') {
    const storagePath = requirePayload(payload, 'storageStatePath');
    const absoluteStoragePath = path.resolve(process.cwd(), storagePath);
    const exists = fs.existsSync(absoluteStoragePath);
    if (storageBehavior === 'append') {
      if (!exists) {
        throw fail('Cannot append to a storage-state file that does not exist.', { storageStatePath: storagePath });
      }
      browser = await chromium.launch({ headless: browserRuntime.headless });
      context = await browser.newContext({ storageState: absoluteStoragePath });
      pendingStorageSavePath = storagePath;
    } else {
      browser = await chromium.launch({ headless: browserRuntime.headless });
      context = await browser.newContext();
      pendingStorageSavePath = storagePath;
    }
  } else if (browserRuntime.profileMode === 'persistent') {
    if (!browserRuntime.profileDir) {
      throw fail('Persistent profile mode requires profileDir.');
    }
    const profileDir = path.resolve(process.cwd(), browserRuntime.profileDir);
    await fsp.mkdir(profileDir, { recursive: true });
    context = await chromium.launchPersistentContext(profileDir, { headless: browserRuntime.headless });
    persistentContext = true;
  } else {
    browser = await chromium.launch({ headless: browserRuntime.headless });
    if (browserRuntime.profileMode === 'storageState') {
      if (!browserRuntime.storageStatePath) {
        throw fail('storageState mode requires storageStatePath.');
      }
      const absoluteStoragePath = path.resolve(process.cwd(), browserRuntime.storageStatePath);
      const exists = fs.existsSync(absoluteStoragePath);
      if (exists) {
        context = await browser.newContext({ storageState: absoluteStoragePath });
      } else if (browserRuntime.initializeStorageStateIfMissing) {
        context = await browser.newContext();
        pendingStorageSavePath = browserRuntime.storageStatePath;
      } else {
        throw fail('Requested storage-state file does not exist and initialization was not allowed.', {
          storageStatePath: browserRuntime.storageStatePath,
        });
      }
    } else {
      context = await browser.newContext();
    }
  }

  let page = null;
  const existingPages = typeof context.pages === 'function' ? context.pages() : [];
  if (existingPages && existingPages.length > 0) {
    [page] = existingPages;
  } else {
    page = await context.newPage();
  }

  if (targetUrl) {
    await page.goto(targetUrl);
  }

  state.browser = browser;
  state.context = context;
  state.page = page;
  state.session = {
    sessionMode,
    targetUrl,
    browserRuntime,
    storageBehavior,
    startedAt: new Date().toISOString(),
    lastStepAt: null,
  };
  state.persistentContext = persistentContext;
  state.pendingStorageSavePath = pendingStorageSavePath;

  return getSnapshot();
}

async function executeStep(payload = {}) {
  if (!state.session || !state.page) {
    throw fail('No active session. Start a session before executing steps.');
  }
  const description = payload.description || 'step';
  const code = requirePayload(payload, 'code');
  const helpers = {
    settle,
    snapshot: getSnapshot,
    saveStorageState: async (targetPath) => {
      if (!targetPath) {
        throw fail('saveStorageState requires a target path.');
      }
      await ensureDir(targetPath);
      await state.context.storageState({ path: path.resolve(process.cwd(), targetPath) });
      return { saved: targetPath };
    },
  };
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const fn = new AsyncFunction('page', 'context', 'browser', 'session', 'helpers', code);
  await fn(state.page, state.context, state.browser, state.session, helpers);
  state.session.lastStepAt = new Date().toISOString();
  return {
    description,
    snapshot: await getSnapshot(),
  };
}

async function saveStorageState(payload = {}) {
  if (!state.context) {
    throw fail('No active context to save.');
  }
  const targetPath = requirePayload(payload, 'path');
  await ensureDir(targetPath);
  await state.context.storageState({ path: path.resolve(process.cwd(), targetPath) });
  return { path: targetPath };
}

async function finishSession(payload = {}) {
  if (!state.session) {
    throw fail('No active session to finish.');
  }
  if (state.pendingStorageSavePath) {
    await ensureDir(state.pendingStorageSavePath);
    await state.context.storageState({ path: path.resolve(process.cwd(), state.pendingStorageSavePath) });
  }
  const finalSnapshot = await getSnapshot();
  const result = {
    finalSnapshot,
    savedStorageStatePath: state.pendingStorageSavePath,
  };
  if (!payload.keepOpen) {
    await closeLiveSession();
  }
  return result;
}

async function abortSession() {
  if (!state.session) {
    return { aborted: false, reason: 'no-active-session' };
  }
  await closeLiveSession();
  return { aborted: true };
}

async function dispatch(command, payload) {
  switch (command) {
    case 'startSession':
      return startSession(payload);
    case 'executeStep':
      return executeStep(payload);
    case 'getState':
      return getSnapshot();
    case 'saveStorageState':
      return saveStorageState(payload);
    case 'finishSession':
      return finishSession(payload);
    case 'abortSession':
      return abortSession();
    case 'shutdown': {
      const hadSession = !!state.session;
      if (state.session) {
        await closeLiveSession();
      }
      return { shutdown: true, hadSession };
    }
    default:
      throw fail(`Unsupported command: ${command}`);
  }
}

async function runSelfTest() {
  process.env.AEE_MOCK = '1';
  state.playwright = null;
  await startSession({ sessionMode: 'record', targetUrl: 'https://example.com', browserRuntime: { profileMode: 'incognito', headless: true } });
  await executeStep({ description: 'bump counter', code: 'session.counter = (session.counter || 0) + 1; await helpers.settle();' });
  const snapshot = await getSnapshot();
  if (!snapshot.active || snapshot.url !== 'https://example.com') {
    throw fail('Self-test did not preserve the mock page state.', snapshot);
  }
  const finished = await finishSession({ keepOpen: false });
  if (!finished.finalSnapshot.active) {
    throw fail('Self-test finish did not return a final snapshot.', finished);
  }
  process.stdout.write('self-test-ok\n');
}

async function main() {
  if (process.argv.includes('--self-test')) {
    await runSelfTest();
    return;
  }

  const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let message;
    try {
      message = JSON.parse(trimmed);
    } catch (error) {
      jsonResponse(null, false, { message: 'Invalid JSON input.', details: error.message });
      continue;
    }
    const { id = null, command, payload = {} } = message;
    try {
      const result = await dispatch(command, payload);
      jsonResponse(id, true, result);
      if (command === 'shutdown') {
        break;
      }
    } catch (error) {
      jsonResponse(id, false, {
        message: error.message || String(error),
        details: error.details || null,
      });
    }
  }
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});
