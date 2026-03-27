#!/usr/bin/env node
import crypto from 'crypto';
import fs from 'fs';
import fsp from 'fs/promises';
import os from 'os';
import path from 'path';
import readline from 'readline';
import { createRequire } from 'module';

function expandHome(inputPath) {
  if (!inputPath) return inputPath;
  if (inputPath === '~') return os.homedir();
  if (inputPath.startsWith('~/') || inputPath.startsWith('~\\')) {
    return path.join(os.homedir(), inputPath.slice(2));
  }
  return inputPath;
}

const SHARED_ROOT = path.resolve(expandHome(process.env.AEE_ROOT || path.join(os.homedir(), '.auto-e2e')));
const SESSION_LOCK_FILE = path.join(SHARED_ROOT, '.live-session.json');
const BINDING_REQUIRED_COMMANDS = new Set(['executeStep', 'saveStorageState', 'finishSession', 'abortSession', 'pollCapturedSteps']);
const ALLOWED_COMMANDS = {
  idle: new Set(['startSession', 'inspectStorageTarget', 'getState', 'shutdown']),
  recording: new Set(['executeStep', 'getState', 'saveStorageState', 'finishSession', 'abortSession', 'shutdown']),
  replaying: new Set(['executeStep', 'getState', 'saveStorageState', 'finishSession', 'abortSession', 'shutdown']),
  storage_capturing: new Set(['executeStep', 'getState', 'saveStorageState', 'finishSession', 'abortSession', 'shutdown']),
  capturing_observed: new Set(['pollCapturedSteps', 'getState', 'finishSession', 'abortSession', 'shutdown']),
  finishing: new Set(['getState', 'abortSession', 'shutdown']),
  finished_open: new Set(['getState', 'abortSession', 'shutdown']),
};



function createObservedState() {
  return {
    enabled: false,
    steps: [],
    nextSeq: 1,
    waiters: [],
    browserClosed: false,
    closeReason: null,
    lastNavigationUrl: null,
    lastActionAt: 0,
  };
}

function resetObservedState() {
  for (const waiter of state.observed?.waiters || []) {
    try {
      waiter.resolve();
    } catch {
      // noop
    }
  }
  state.observed = createObservedState();
}

const state = {
  playwright: null,
  browser: null,
  context: null,
  page: null,
  session: null,
  persistentContext: false,
  pendingStorageSavePath: null,
  lifecycleState: 'idle',
  observed: createObservedState(),
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


function observedCaptureBootstrap() {
  if (window.__AEE_CAPTURE_INSTALLED) return;
  window.__AEE_CAPTURE_INSTALLED = true;

  function truncate(value, max) {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    return text.length > max ? text.slice(0, max) : text;
  }

  function findLabel(element) {
    if (!element) return '';
    if (element.labels && element.labels.length > 0) {
      return truncate(Array.from(element.labels).map((label) => label.innerText || label.textContent || '').join(' '), 160);
    }
    if (element.id) {
      const explicit = document.querySelector(`label[for="${CSS.escape(element.id)}"]`);
      if (explicit) return truncate(explicit.innerText || explicit.textContent || '', 160);
    }
    const wrapping = element.closest('label');
    if (wrapping) return truncate(wrapping.innerText || wrapping.textContent || '', 160);
    return '';
  }

  function buildSelector(element) {
    if (!element || !element.tagName) return '';
    const tag = element.tagName.toLowerCase();
    if (element.id) return `${tag}#${element.id}`;
    if (element.name) return `${tag}[name="${element.name}"]`;
    return tag;
  }

  function describeTarget(element) {
    if (!element || !element.tagName) return {};
    const roleName = truncate(element.getAttribute('aria-label') || '', 120);
    const text = truncate(element.innerText || element.textContent || element.value || '', 120);
    const option = element.tagName.toLowerCase() === 'select' ? element.selectedOptions?.[0] : null;
    return {
      tagName: element.tagName.toLowerCase(),
      type: (element.getAttribute('type') || '').toLowerCase(),
      role: (element.getAttribute('role') || '').toLowerCase(),
      roleName,
      text,
      ariaLabel: roleName,
      placeholder: truncate(element.getAttribute('placeholder') || '', 120),
      label: findLabel(element),
      name: truncate(element.getAttribute('name') || '', 120),
      id: truncate(element.id || '', 120),
      selector: buildSelector(element),
      value: typeof element.value === 'string' ? truncate(element.value, 400) : '',
      checked: !!element.checked,
      selectValue: option ? truncate(option.value, 200) : '',
      selectLabel: option ? truncate(option.innerText || option.textContent || '', 200) : '',
    };
  }

  function emit(payload) {
    try {
      if (typeof window.__aeeCaptureEmit === 'function') {
        window.__aeeCaptureEmit(payload);
      }
    } catch {
      // noop
    }
  }

  document.addEventListener('click', (event) => {
    const target = event.target && event.target.closest ? event.target.closest('button, a, input, textarea, select, [role], [aria-label], label') || event.target : event.target;
    const details = describeTarget(target);
    if (details.tagName === 'input' && (details.type === 'checkbox' || details.type === 'radio')) {
      return;
    }
    emit({ type: 'click', target: details });
  }, true);

  document.addEventListener('change', (event) => {
    const target = event.target;
    const details = describeTarget(target);
    emit({ type: 'change', target: details });
  }, true);

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== 'Escape') return;
    const target = event.target;
    emit({ type: 'keydown', key: event.key, target: describeTarget(target) });
  }, true);
}

function quote(value) {
  return JSON.stringify(String(value ?? ''));
}

function escapeCssValue(value) {
  return String(value ?? '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function chooseTargetName(target = {}) {
  return [target.roleName, target.label, target.placeholder, target.text, target.name, target.id, target.selector].find((value) => value && String(value).trim()) || '目标元素';
}

function buildLocator(target = {}) {
  const name = target.roleName || target.ariaLabel || target.text || target.label;
  if (target.role && name) {
    return `page.getByRole(${quote(target.role)}, { name: ${quote(name)} })`;
  }
  if (target.label) {
    return `page.getByLabel(${quote(target.label)})`;
  }
  if (target.placeholder) {
    return `page.getByPlaceholder(${quote(target.placeholder)})`;
  }
  if (target.text) {
    return `page.getByText(${quote(target.text)})`;
  }
  if (target.id) {
    return `page.locator(${quote(`#${escapeCssValue(target.id)}`)})`;
  }
  if (target.name) {
    return `page.locator(${quote(`[name="${escapeCssValue(target.name)}"]`)})`;
  }
  if (target.selector) {
    return `page.locator(${quote(target.selector)}).first()`;
  }
  return "page.locator('body')";
}

function buildObservedStep(event = {}) {
  const target = event.target || {};
  const locator = buildLocator(target);
  const targetName = chooseTargetName(target);
  if (event.type === 'click') {
    return {
      kind: 'click',
      summary: `点击“${targetName}”`,
      description: `click ${targetName}`,
      code: `await ${locator}.click();\nawait helpers.settle();`,
      target,
    };
  }
  if (event.type === 'change') {
    if (target.tagName === 'select') {
      const optionValue = target.selectValue || target.selectLabel || target.value || '';
      return {
        kind: 'select',
        summary: `在“${targetName}”中选择“${optionValue}”`,
        description: `select ${optionValue} in ${targetName}`,
        code: `await ${locator}.selectOption(${quote(target.selectValue || target.value || optionValue)});\nawait helpers.settle();`,
        target,
        value: optionValue,
      };
    }
    if (target.type === 'checkbox' || target.type === 'radio') {
      const checked = !!target.checked;
      return {
        kind: checked ? 'check' : 'uncheck',
        summary: `${checked ? '勾选' : '取消勾选'}“${targetName}”`,
        description: `${checked ? 'check' : 'uncheck'} ${targetName}`,
        code: `await ${locator}.${checked ? 'check' : 'uncheck'}();\nawait helpers.settle();`,
        target,
        checked,
      };
    }
    return {
      kind: 'fill',
      summary: `在“${targetName}”输入“${target.value || ''}”`,
      description: `fill ${targetName}`,
      code: `await ${locator}.fill(${quote(target.value || '')});\nawait helpers.settle();`,
      target,
      value: target.value || '',
    };
  }
  if (event.type === 'keydown') {
    return {
      kind: 'press',
      summary: `在“${targetName}”按下 ${event.key}`,
      description: `press ${event.key} on ${targetName}`,
      code: `await ${locator}.press(${quote(event.key)});\nawait helpers.settle();`,
      target,
      key: event.key,
    };
  }
  if (event.type === 'navigation') {
    return {
      kind: 'navigation',
      summary: `页面跳转到 ${event.url}`,
      description: `navigate to ${event.url}`,
      code: `await page.goto(${quote(event.url)});\nawait helpers.settle();`,
      url: event.url,
    };
  }
  return null;
}

function notifyObservedWaiters() {
  const waiters = state.observed?.waiters || [];
  state.observed.waiters = [];
  for (const waiter of waiters) {
    try {
      waiter.resolve();
    } catch {
      // noop
    }
  }
}

function markObservedBrowserClosed(reason = 'browser_closed') {
  if (!state.observed?.enabled) return;
  state.observed.browserClosed = true;
  state.observed.closeReason = reason;
  notifyObservedWaiters();
}

function queueObservedStep(step) {
  if (!step || !state.observed?.enabled) return null;
  const now = Date.now();
  if (step.kind === 'navigation') {
    if (!step.url || step.url === state.observed.lastNavigationUrl) {
      return null;
    }
    if (state.observed.lastActionAt && now - state.observed.lastActionAt < 1200) {
      state.observed.lastNavigationUrl = step.url;
      return null;
    }
    state.observed.lastNavigationUrl = step.url;
  } else {
    state.observed.lastActionAt = now;
  }
  const recorded = {
    seq: state.observed.nextSeq++,
    capturedAt: new Date().toISOString(),
    ...step,
  };
  state.observed.steps.push(recorded);
  notifyObservedWaiters();
  return recorded;
}

function buildObservedPollResult(cursor = 0, timedOut = false) {
  const numericCursor = Number.isFinite(Number(cursor)) ? Number(cursor) : 0;
  const steps = (state.observed?.steps || []).filter((step) => step.seq > numericCursor);
  const nextCursor = steps.length > 0 ? steps[steps.length - 1].seq : numericCursor;
  return {
    steps,
    nextCursor,
    totalCaptured: state.observed?.steps?.length || 0,
    browserClosed: !!state.observed?.browserClosed,
    closeReason: state.observed?.closeReason || null,
    timedOut,
  };
}

async function pollCapturedSteps(payload = {}) {
  if (!state.session || currentLifecycleState() !== 'capturing_observed') {
    throw fail('Observed capture is not active.', {
      code: 'no_observed_capture_session',
      lifecycleState: currentLifecycleState(),
    });
  }
  const cursor = Number.isFinite(Number(payload.cursor)) ? Number(payload.cursor) : 0;
  const timeoutMs = Math.max(0, Math.min(30000, Number(payload.timeoutMs || 0)));
  const immediate = buildObservedPollResult(cursor, false);
  if (immediate.steps.length > 0 || immediate.browserClosed || timeoutMs === 0) {
    return immediate;
  }
  await new Promise((resolve) => {
    const timer = setTimeout(resolve, timeoutMs);
    state.observed.waiters.push({
      resolve: () => {
        clearTimeout(timer);
        resolve();
      },
    });
  });
  return buildObservedPollResult(cursor, true);
}

async function prepareObservedPage(pageRef) {
  if (!pageRef) return;
  if (typeof pageRef.addInitScript === 'function') {
    await pageRef.addInitScript(observedCaptureBootstrap);
  }
  if (typeof pageRef.evaluate === 'function') {
    try {
      await pageRef.evaluate(observedCaptureBootstrap);
    } catch {
      // ignore pages that are not ready yet
    }
  }
  if (typeof pageRef.on === 'function') {
    pageRef.on('framenavigated', (frame) => {
      try {
        if (typeof pageRef.mainFrame === 'function' && frame !== pageRef.mainFrame()) {
          return;
        }
      } catch {
        // noop
      }
      const url = typeof pageRef.url === 'function' ? pageRef.url() : null;
      if (url) {
        queueObservedStep(buildObservedStep({ type: 'navigation', url }));
      }
    });
    pageRef.on('close', () => markObservedBrowserClosed('page_closed'));
  }
}

async function installObservedCapture(context, pageRef, browserRef) {
  resetObservedState();
  state.observed.enabled = true;
  state.observed.lastNavigationUrl = typeof pageRef?.url === 'function' ? pageRef.url() : null;
  if (typeof context?.exposeBinding === 'function') {
    try {
      await context.exposeBinding('__aeeCaptureEmit', (_source, payload) => {
        const observed = buildObservedStep(payload || {});
        if (observed) {
          queueObservedStep(observed);
        }
      });
    } catch (error) {
      if (!String(error?.message || '').includes('has been already registered')) {
        throw error;
      }
    }
  }
  await prepareObservedPage(pageRef);
  if (typeof context?.on === 'function') {
    context.on('page', async (newPage) => {
      await prepareObservedPage(newPage);
    });
    context.on('close', () => markObservedBrowserClosed('context_closed'));
  }
  if (typeof browserRef?.on === 'function') {
    browserRef.on('disconnected', () => markObservedBrowserClosed('browser_disconnected'));
  }
}


function currentLifecycleState() {
  return state.lifecycleState || 'idle';
}

function setLifecycleState(nextState) {
  state.lifecycleState = nextState;
}

function assertCommandAllowed(command) {
  const lifecycleState = currentLifecycleState();
  const allowed = ALLOWED_COMMANDS[lifecycleState] || ALLOWED_COMMANDS.idle;
  if (!allowed.has(command)) {
    throw fail(`Command ${command} is not allowed while the recorder is in state ${lifecycleState}.`, {
      code: 'invalid_state_transition',
      lifecycleState,
      command,
      allowedCommands: Array.from(allowed),
    });
  }
}

function resolveSharedPath(inputPath) {
  if (!inputPath) {
    throw fail('A path is required.');
  }
  const expanded = expandHome(inputPath);
  if (path.isAbsolute(expanded)) {
    return path.normalize(expanded);
  }
  return path.resolve(SHARED_ROOT, expanded);
}

async function ensureDir(filePath) {
  const dir = path.dirname(resolveSharedPath(filePath));
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

async function validateStorageStateFile(targetPath) {
  const absolutePath = resolveSharedPath(targetPath);
  let raw = '';
  try {
    raw = await fsp.readFile(absolutePath, 'utf8');
  } catch (error) {
    throw fail('Failed to read the storage-state file.', {
      code: 'storage_state_read_failed',
      storageStatePath: targetPath,
      absolutePath,
      cause: error.message,
    });
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw fail('The storage-state file is not valid JSON.', {
      code: 'storage_state_invalid_json',
      storageStatePath: targetPath,
      absolutePath,
      cause: error.message,
    });
  }

  if (!parsed || !Array.isArray(parsed.cookies) || !Array.isArray(parsed.origins)) {
    throw fail('The storage-state file does not match Playwright storageState structure.', {
      code: 'storage_state_invalid_shape',
      storageStatePath: targetPath,
      absolutePath,
    });
  }

  return {
    storageStatePath: targetPath,
    absolutePath,
    cookies: parsed.cookies.length,
    origins: parsed.origins.length,
  };
}

function isPidAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) {
    return false;
  }
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function readSessionLock() {
  try {
    const raw = await fsp.readFile(SESSION_LOCK_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw fail('Failed to read the recorder session lock file.', {
      code: 'session_lock_read_failed',
      path: SESSION_LOCK_FILE,
      cause: error.message,
    });
  }
}

async function removeSessionLockIfOwned(lock = null) {
  const currentLock = lock || await readSessionLock();
  if (!currentLock) {
    return;
  }
  if (state.session && currentLock.sessionId && currentLock.sessionId !== state.session.sessionId) {
    return;
  }
  try {
    await fsp.unlink(SESSION_LOCK_FILE);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw fail('Failed to remove the recorder session lock file.', {
        code: 'session_lock_remove_failed',
        path: SESSION_LOCK_FILE,
        cause: error.message,
      });
    }
  }
}

async function ensureNoConflictingLiveSession() {
  const lock = await readSessionLock();
  if (!lock) {
    return;
  }
  if (lock.pid === process.pid && !state.session) {
    await removeSessionLockIfOwned(lock);
    return;
  }
  if (!isPidAlive(lock.pid)) {
    await removeSessionLockIfOwned(lock);
    return;
  }
  throw fail('A live recorder session is already active under ~/.auto-e2e. Reuse it instead of opening another browser runtime.', {
    code: 'cross_runtime_fallback_forbidden',
    activeLock: lock,
    path: SESSION_LOCK_FILE,
  });
}

async function writeSessionLock() {
  if (!state.session) {
    return;
  }
  await fsp.mkdir(SHARED_ROOT, { recursive: true });
  const lock = {
    pid: process.pid,
    sessionId: state.session.sessionId,
    runtimeLock: state.session.runtimeLock,
    lifecycleState: currentLifecycleState(),
    sessionMode: state.session.sessionMode,
    startedAt: state.session.startedAt,
    sharedRoot: SHARED_ROOT,
  };
  await fsp.writeFile(SESSION_LOCK_FILE, `${JSON.stringify(lock, null, 2)}\n`, 'utf8');
}

function requireSessionBinding(payload, command) {
  if (!state.session || !BINDING_REQUIRED_COMMANDS.has(command)) {
    return;
  }
  const sessionId = payload?.sessionId;
  const runtimeLock = payload?.runtimeLock;
  if (!sessionId || !runtimeLock) {
    throw fail('This live command must target the existing recorder session explicitly.', {
      code: 'session_binding_required',
      command,
      expectedSessionId: state.session.sessionId,
      expectedRuntimeLock: state.session.runtimeLock,
    });
  }
  if (sessionId !== state.session.sessionId || runtimeLock !== state.session.runtimeLock) {
    throw fail('This command does not match the active recorder session. Do not reopen a fresh browser runtime or mix tools mid-session.', {
      code: 'cross_runtime_fallback_forbidden',
      command,
      expectedSessionId: state.session.sessionId,
      expectedRuntimeLock: state.session.runtimeLock,
      receivedSessionId: sessionId,
      receivedRuntimeLock: runtimeLock,
    });
  }
}

async function inspectStorageTarget(payload = {}) {
  const storageStatePath = requirePayload(payload, 'storageStatePath');
  const absolutePath = resolveSharedPath(storageStatePath);
  const exists = fs.existsSync(absolutePath);
  if (!exists) {
    return {
      storageStatePath,
      absolutePath,
      exists: false,
      valid: false,
      requiresDecision: false,
      suggestedNext: 'start-new',
      allowedDecisions: ['reset'],
    };
  }

  try {
    const validation = await validateStorageStateFile(storageStatePath);
    return {
      ...validation,
      exists: true,
      valid: true,
      requiresDecision: true,
      suggestedNext: 'ask-reset-or-append',
      allowedDecisions: ['reset', 'append'],
    };
  } catch (error) {
    return {
      storageStatePath,
      absolutePath,
      exists: true,
      valid: false,
      requiresDecision: true,
      suggestedNext: 'ask-reset-or-repair',
      allowedDecisions: ['reset'],
      validationError: {
        message: error.message,
        details: error.details || null,
      },
    };
  }
}

async function saveAndValidateStorageState(targetPath, options = {}) {
  if (!state.context) {
    throw fail('No active context to save.');
  }
  const { settleBeforeSave = true } = options;
  if (settleBeforeSave) {
    await settle();
  }
  await ensureDir(targetPath);
  const absolutePath = resolveSharedPath(targetPath);
  await state.context.storageState({ path: absolutePath });
  return validateStorageStateFile(targetPath);
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
        await fsp.writeFile(resolveSharedPath(options.path), JSON.stringify(data, null, 2));
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
  const sharedPackage = path.join(SHARED_ROOT, 'package.json');
  const cwdPackage = path.join(process.cwd(), 'package.json');
  const requireFrom = fs.existsSync(sharedPackage) ? sharedPackage : (fs.existsSync(cwdPackage) ? cwdPackage : import.meta.url);
  const req = createRequire(requireFrom);
  try {
    state.playwright = req('playwright');
  } catch (error) {
    throw fail(
      `Unable to load playwright. Run npm install in ${SHARED_ROOT} before starting the recorder.`,
      { cause: error.message, sharedRoot: SHARED_ROOT }
    );
  }
  return state.playwright;
}

async function getSnapshot() {
  if (!state.page) {
    return { active: false, sharedRoot: SHARED_ROOT, lifecycleState: currentLifecycleState() };
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
    sharedRoot: SHARED_ROOT,
    lifecycleState: currentLifecycleState(),
    sessionId: state.session?.sessionId || null,
    runtimeLock: state.session?.runtimeLock || null,
    observedCapture: state.observed?.enabled ? {
      totalCaptured: state.observed.steps.length,
      nextCursor: state.observed.nextSeq - 1,
      browserClosed: state.observed.browserClosed,
      closeReason: state.observed.closeReason,
    } : null,
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
  await removeSessionLockIfOwned();
  state.browser = null;
  state.context = null;
  state.page = null;
  state.session = null;
  state.persistentContext = false;
  state.pendingStorageSavePath = null;
  resetObservedState();
  setLifecycleState('idle');
  if (closeErrors.length) {
    throw fail('Failed to close the live session cleanly.', { closeErrors });
  }
}

function lifecycleForSessionMode(sessionMode) {
  switch (sessionMode) {
    case 'replay':
      return 'replaying';
    case 'storage':
      return 'storage_capturing';
    case 'capture':
      return 'capturing_observed';
    case 'record':
    default:
      return 'recording';
  }
}

async function startSession(payload = {}) {
  if (state.session) {
    throw fail('A recorder session is already active. Finish or abort it before starting another.', {
      code: 'session_already_active',
      sessionId: state.session.sessionId,
      runtimeLock: state.session.runtimeLock,
      lifecycleState: currentLifecycleState(),
    });
  }
  await ensureNoConflictingLiveSession();

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
    const inspection = await inspectStorageTarget({ storageStatePath: storagePath });
    if (inspection.exists && !storageBehavior) {
      throw fail('Storage target already exists and requires an explicit reset or append decision.', {
        code: 'storage_decision_required',
        storageStatePath: storagePath,
        absolutePath: inspection.absolutePath,
        choices: ['reset', 'append'],
      });
    }
    if (storageBehavior === 'append') {
      if (!inspection.exists) {
        throw fail('Cannot append to a storage-state file that does not exist.', {
          code: 'storage_state_missing_for_append',
          storageStatePath: storagePath,
        });
      }
      if (!inspection.valid) {
        throw fail('Cannot append because the existing storage-state file is invalid. Choose reset or repair the file first.', {
          code: 'storage_state_invalid_for_append',
          storageStatePath: storagePath,
          absolutePath: inspection.absolutePath,
          validationError: inspection.validationError || null,
        });
      }
      browser = await chromium.launch({ headless: browserRuntime.headless });
      context = await browser.newContext({ storageState: resolveSharedPath(storagePath) });
      pendingStorageSavePath = storagePath;
    } else {
      browser = await chromium.launch({ headless: browserRuntime.headless });
      context = await browser.newContext();
      pendingStorageSavePath = storagePath;
    }
  } else if (browserRuntime.profileMode === 'persistent') {
    if (!browserRuntime.profileDir) {
      throw fail('Persistent profile mode requires profileDir.', { code: 'profile_dir_required' });
    }
    const profileDir = resolveSharedPath(browserRuntime.profileDir);
    await fsp.mkdir(profileDir, { recursive: true });
    context = await chromium.launchPersistentContext(profileDir, { headless: browserRuntime.headless });
    persistentContext = true;
  } else {
    browser = await chromium.launch({ headless: browserRuntime.headless });
    if (browserRuntime.profileMode === 'storageState') {
      if (!browserRuntime.storageStatePath) {
        throw fail('storageState mode requires storageStatePath.', { code: 'storage_state_path_required' });
      }
      const inspection = await inspectStorageTarget({ storageStatePath: browserRuntime.storageStatePath });
      if (inspection.exists) {
        if (!inspection.valid) {
          throw fail('Requested storage-state file exists but is invalid.', {
            code: 'storage_state_invalid',
            storageStatePath: browserRuntime.storageStatePath,
            validationError: inspection.validationError || null,
          });
        }
        context = await browser.newContext({ storageState: resolveSharedPath(browserRuntime.storageStatePath) });
      } else if (browserRuntime.initializeStorageStateIfMissing) {
        context = await browser.newContext();
        pendingStorageSavePath = browserRuntime.storageStatePath;
      } else {
        throw fail('Requested storage-state file does not exist and initialization was not allowed.', {
          code: 'storage_state_missing',
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
    await settle();
  }

  if (sessionMode === 'capture') {
    await installObservedCapture(context, page, browser);
  }

  const sessionId = crypto.randomUUID();
  const runtimeLock = crypto.randomBytes(12).toString('hex');

  state.browser = browser;
  state.context = context;
  state.page = page;
  state.session = {
    sessionId,
    runtimeLock,
    sessionMode,
    targetUrl,
    browserRuntime,
    storageBehavior,
    startedAt: new Date().toISOString(),
    lastStepAt: null,
    sharedRoot: SHARED_ROOT,
  };
  state.persistentContext = persistentContext;
  state.pendingStorageSavePath = pendingStorageSavePath;
  setLifecycleState(lifecycleForSessionMode(sessionMode));
  await writeSessionLock();

  return getSnapshot();
}

async function executeStep(payload = {}) {
  if (!state.session || !state.page) {
    throw fail('No active session. Start a session before executing steps.', { code: 'no_active_session' });
  }
  const description = payload.description || 'step';
  const code = requirePayload(payload, 'code');
  const helpers = {
    settle,
    snapshot: getSnapshot,
    sharedRoot: SHARED_ROOT,
    resolveSharedPath,
    validateStorageStateFile,
    saveStorageState: async (targetPath) => saveAndValidateStorageState(targetPath),
  };
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const fn = new AsyncFunction('page', 'context', 'browser', 'session', 'helpers', code);
  await fn(state.page, state.context, state.browser, state.session, helpers);
  state.session.lastStepAt = new Date().toISOString();
  await writeSessionLock();
  return {
    description,
    snapshot: await getSnapshot(),
  };
}

async function saveStorageState(payload = {}) {
  const targetPath = requirePayload(payload, 'path');
  return saveAndValidateStorageState(targetPath);
}

async function finishSession(payload = {}) {
  if (!state.session) {
    throw fail('No active session to finish.', { code: 'no_active_session' });
  }
  setLifecycleState('finishing');
  await writeSessionLock();
  let savedStorageState = null;
  if (state.pendingStorageSavePath) {
    savedStorageState = await saveAndValidateStorageState(state.pendingStorageSavePath, { settleBeforeSave: true });
  }
  const finalSnapshot = await getSnapshot();
  const result = {
    finalSnapshot,
    savedStorageState,
    savedStorageStatePath: savedStorageState?.storageStatePath || null,
    sessionId: state.session.sessionId,
    runtimeLock: state.session.runtimeLock,
    capturedStepsCount: state.observed?.steps?.length || 0,
  };
  if (!payload.keepOpen) {
    await closeLiveSession();
  } else {
    setLifecycleState('finished_open');
    await writeSessionLock();
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
  assertCommandAllowed(command);
  requireSessionBinding(payload, command);
  switch (command) {
    case 'startSession':
      return startSession(payload);
    case 'inspectStorageTarget':
      return inspectStorageTarget(payload);
    case 'executeStep':
      return executeStep(payload);
    case 'pollCapturedSteps':
      return pollCapturedSteps(payload);
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
      } else {
        await removeSessionLockIfOwned();
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
  await fsp.rm(SHARED_ROOT, { recursive: true, force: true });

  const inspection = await inspectStorageTarget({ storageStatePath: '.auth/mock.json' });
  if (inspection.exists) {
    throw fail('Self-test expected no storage-state file before creation.', inspection);
  }

  const started = await dispatch('startSession', { sessionMode: 'record', targetUrl: 'https://example.com', browserRuntime: { profileMode: 'incognito', headless: true } });
  await dispatch('executeStep', {
    sessionId: started.sessionId,
    runtimeLock: started.runtimeLock,
    description: 'bump counter',
    code: 'session.counter = (session.counter || 0) + 1; await helpers.settle();',
  });

  let mismatched = false;
  try {
    await dispatch('executeStep', {
      sessionId: 'wrong',
      runtimeLock: 'wrong',
      description: 'bad binding',
      code: 'await helpers.settle();',
    });
  } catch (error) {
    mismatched = error.details?.code === 'cross_runtime_fallback_forbidden';
  }
  if (!mismatched) {
    throw fail('Self-test expected a hard error for mismatched session binding.');
  }

  const snapshot = await getSnapshot();
  if (!snapshot.active || snapshot.url !== 'https://example.com') {
    throw fail('Self-test did not preserve the mock page state.', snapshot);
  }


  const finishedRecord = await dispatch('finishSession', { sessionId: started.sessionId, runtimeLock: started.runtimeLock, keepOpen: false });
  if (!finishedRecord.finalSnapshot.active) {
    throw fail('Self-test finish did not return a final snapshot.', finishedRecord);
  }

  const captureStarted = await dispatch('startSession', { sessionMode: 'capture', targetUrl: 'https://capture.example.com', browserRuntime: { profileMode: 'incognito', headless: true } });
  queueObservedStep(buildObservedStep({ type: 'click', target: { role: 'button', text: 'Create', tagName: 'button' } }));
  const observed = await dispatch('pollCapturedSteps', { sessionId: captureStarted.sessionId, runtimeLock: captureStarted.runtimeLock, cursor: 0, timeoutMs: 0 });
  if (!observed.steps || observed.steps.length !== 1 || observed.steps[0].kind !== 'click') {
    throw fail('Self-test expected one observed click step.', observed);
  }
  await dispatch('abortSession', { sessionId: captureStarted.sessionId, runtimeLock: captureStarted.runtimeLock });

  const restarted = await dispatch('startSession', { sessionMode: 'record', targetUrl: 'https://example.com', browserRuntime: { profileMode: 'incognito', headless: true } });
  const saveResult = await dispatch('saveStorageState', { sessionId: restarted.sessionId, runtimeLock: restarted.runtimeLock, path: '.auth/mock.json' });
  if (saveResult.storageStatePath !== '.auth/mock.json') {
    throw fail('Self-test did not save the mocked storage state.', saveResult);
  }
  await dispatch('abortSession', { sessionId: restarted.sessionId, runtimeLock: restarted.runtimeLock });

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
  jsonResponse(null, false, {
    message: error.message || String(error),
    details: error.details || null,
  });
  process.exitCode = 1;
});
