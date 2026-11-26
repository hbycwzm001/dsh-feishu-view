import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

export const name = 'dsh-feishu-view';
export const inject = [];

/** RPC 频道:客户端 ctx.connection.rpc.call('/feishu-view', endpoint, payload)。 */
const CHANNEL = '/feishu-view';
/** HTTP 兜底路由(与 dsh-im 同一种写法:POST + JSON body)。 */
const ROUTE = '/api/feishu-view';
/** 内存缓存 2 分钟;磁盘快照 5 分钟后触发后台刷新 */
const SNAPSHOT_TTL_MS = 5 * 60_000;
const snapshotPath = () => join(home(), 'feishu-view', 'snapshot.json');
let refreshInFlight = null;
let cacheFast = { ts: 0, key: '', data: null };

/** 并发限流的 map(飞书单次 RTT 约 1s,串行遍历会卡住面板) */
async function mapPool(list, limit, fn) {
  const out = new Array(list.length);
  let cursor = 0;
  const worker = async () => {
    for (;;) {
      const i = cursor;
      cursor += 1;
      if (i >= list.length) return;
      out[i] = await fn(list[i], i);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, list.length) }, worker));
  return out;
}

function startRefresh() {
  if (refreshInFlight) return;
  refreshInFlight = loadInventory({ force: true })
    .catch(() => null)
    .finally(() => { refreshInFlight = null; });
}

const home = () => process.env.DSH_HOME || join(homedir(), '.dsh');
const settingsFile = () => join(home(), 'feishu-view', 'settings.json');
const feishuFile = () => join(home(), 'dsh-feishu.json');

/** 读每日情报的本地归档(目录来自 FEISHU_INTEL_DIR 或设置项 intelDir,文件名 YYYY-MM-DD.json) */
function readIntelArchive(limit) {
  const dirs = [
    process.env.FEISHU_INTEL_DIR,
    readSettings().intelDir,
  ].filter(Boolean);
  for (const dir of dirs) {
    let names = [];
    try {
      names = readdirSync(dir).filter((n) => /^\d{4}-\d{2}-\d{2}\.json$/.test(n));
    } catch {
      continue;
    }
    names.sort().reverse();
    const out = [];
    for (const n of names.slice(0, limit)) {
      try {
        const d = JSON.parse(readFileSync(join(dir, n), 'utf8'));
        out.push({
          date: String(d.date || n.replace(/\.json$/, '')),
          url: String(d.url || ''),
          brief: String(d.brief || ''),
          items: Array.isArray(d.items) ? d.items.slice(0, 24) : [],
        });
      } catch { /* 单期坏掉不影响其它 */ }
    }
    if (out.length) return out;
  }
  return [];
}

function readJson(path, fallback) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function readSettings() {
  const raw = readJson(settingsFile(), {});
  const note = raw && raw.note && typeof raw.note === 'object' ? raw.note : null;
  const str = (value) => (typeof value === 'string' ? value.trim() : '');
  return {
    showTab: raw && raw.showTab === true,
    note,
    kbSpaceId: str(raw && raw.kbSpaceId),
    intelDir: str(raw && raw.intelDir),
  };
}

function readConfig() {
  return readJson(feishuFile(), null) || {};
}

function readStatus() {
  const cfg = readConfig();
  const appId = typeof cfg.appId === 'string' ? cfg.appId.trim() : '';
  const appSecret = typeof cfg.appSecret === 'string' ? cfg.appSecret.trim() : '';
  return {
    configured: Boolean(appId && appSecret),
    appIdTail: appId ? appId.slice(-6) : '',
    domain: typeof cfg.domain === 'string' && cfg.domain ? cfg.domain : 'https://open.feishu.cn',
    hasUserToken: Boolean(cfg.userAccessToken),
    settings: readSettings(),
  };
}

/** 写开关:主机侧持久化到 <DSH_HOME>/feishu-view/settings.json。 */
function writeShowTab(value, patch = {}) {
  const current = readSettings();
  const str = (v) => (typeof v === 'string' ? v.trim() : '');
  const next = { ...current, showTab: typeof value === 'boolean' ? value : current.showTab };
  if (typeof patch.kbSpaceId === 'string') next.kbSpaceId = str(patch.kbSpaceId);
  if (typeof patch.intelDir === 'string') next.intelDir = str(patch.intelDir);
  writeJson(settingsFile(), next);
  return {
    showTab: next.showTab,
    note: next.note || null,
    kbSpaceId: next.kbSpaceId || '',
    intelDir: next.intelDir || '',
  };
}

function writeNote(note) {
  const current = readSettings();
  const next = { ...current, note: note || null };
  writeJson(settingsFile(), next);
  return { showTab: next.showTab, note: next.note };
}

function patchSettings(patch) {
  const raw = readJson(settingsFile(), {}) || {};
  const next = { ...raw, ...patch };
  writeJson(settingsFile(), next);
  return next;
}

/* ------------------------------------------------------------------ *
 * 云空间清单:用用户令牌遍历 drive/v1/files(带 2 分钟内存缓存)
 * ------------------------------------------------------------------ */

const CACHE_TTL_MS = 120_000;
let cache = { ts: 0, key: '', data: null };

const KIND_ORDER = ['bitable', 'docx', 'doc', 'sheet', 'mindnote', 'folder', 'file', 'shortcut', 'image'];

function pickUrl(domain, item) {
  if (typeof item.url === 'string' && item.url) return item.url;
  const token = item.token || '';
  switch (item.type) {
    case 'bitable': return `${domain}/base/${token}`;
    case 'docx': return `${domain}/docx/${token}`;
    case 'doc': return `${domain}/docs/${token}`;
    case 'sheet': return `${domain}/sheets/${token}`;
    case 'mindnote': return `${domain}/mindnotes/${token}`;
    case 'folder': return `${domain}/drive/folder/${token}`;
    case 'file': return `${domain}/file/${token}`;
    default: return '';
  }
}

function toMs(value) {
  const num = Number(value || 0);
  if (!Number.isFinite(num) || num <= 0) return 0;
  // 飞书这里给的是**秒**,偶尔是毫秒
  return num > 1e12 ? num : num * 1000;
}

async function apiFetch(url, token) {
  const res = await fetch(url, {
    headers: { authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(15_000),
  });
  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { status: res.status, body };
}

async function listWikiNodes(domain, token, spaceId, depth, parent = '', out = []) {
  let page = '';
  const children = [];
  for (let guard = 0; guard < 10; guard += 1) {
    const params = new URLSearchParams({ page_size: '50' });
    if (parent) params.set('parent_node_token', parent);
    if (page) params.set('page_token', page);
    const { body } = await apiFetch(`${domain}/open-apis/wiki/v2/spaces/${spaceId}/nodes?${params}`, token);
    if (!body || body.code !== 0) return out;
    const data = body.data || {};
    for (const nd of data.items || []) {
      out.push(nd);
      if (nd.has_child && depth > 1 && nd.node_token) children.push(String(nd.node_token));
    }
    page = data.has_more ? String(data.page_token || '') : '';
    if (!page) break;
  }
  if (children.length) {
    await mapPool(children, 6, (tok) => listWikiNodes(domain, token, spaceId, depth - 1, tok, out).catch(() => out));
  }
  return out;
}

async function listFolder(domain, token, folderToken) {
  const out = [];
  let page = '';
  for (let guard = 0; guard < 30; guard += 1) {
    const params = new URLSearchParams({ page_size: '200' });
    if (folderToken) params.set('folder_token', folderToken);
    if (page) params.set('page_token', page);
    const { body } = await apiFetch(`${domain}/open-apis/drive/v1/files?${params}`, token);
    if (!body || body.code !== 0) return { files: out, error: body };
    const data = body.data || {};
    out.push(...(data.files || []));
    page = data.next_page_token || '';
    if (!data.has_more || !page) break;
  }
  return { files: out, error: null };
}

async function loadInventory({ force = false, fast = false } = {}) {
  const cfg = readConfig();
  const token = typeof cfg.userAccessToken === 'string' ? cfg.userAccessToken.trim() : '';
  const domain = typeof cfg.domain === 'string' && cfg.domain ? cfg.domain.replace(/\/+$/, '') : 'https://open.feishu.cn';

  if (!token) {
    return { ok: false, needAuth: true, error: '还没有用户身份令牌,需要先完成一次飞书授权。' };
  }

  const key = `${domain}|${token.slice(-12)}`;
  if (!force && cache.data && cache.key === key && Date.now() - cache.ts < CACHE_TTL_MS) {
    return { ...cache.data, cached: true };
  }
  /* 磁盘快照:面板打开时先给上次的结果(毫秒级),再后台刷新,避免"卡住不显示" */
  if (fast && !force && cacheFast.data && cacheFast.key === key && Date.now() - cacheFast.ts < 20_000) {
    return { ...cacheFast.data, cached: true };
  }
  if (!force) {
    const snap = readJson(snapshotPath(), null);
    if (snap && snap.key === key && snap.data) {
      if (Date.now() - Number(snap.ts || 0) > SNAPSHOT_TTL_MS) startRefresh();
      return { ...snap.data, cached: true, stale: true, cachedAt: Number(snap.ts || 0) };
    }
  }

  const items = [];
  const errors = [];
  const visited = new Set();
  let needAuth = null;

  async function walkFolder(folderToken, parentPath, depth) {
    if (visited.has(folderToken) || visited.size >= 40 || items.length >= 600) return;
    visited.add(folderToken);

    const { files, error } = await listFolder(domain, token, folderToken);
    if (error) {
      if (error.code === 99991679 || error.code === 99991663) {
        needAuth = String(error.code);
        return;
      }
      errors.push({ path: parentPath || '根目录', code: error.code, msg: error.msg || 'unknown' });
      return;
    }

    const subs = [];
    for (const item of files) {
      const path = parentPath || '';
      items.push({
        name: String(item.name || '(未命名)'),
        type: String(item.type || 'file'),
        token: String(item.token || ''),
        url: pickUrl(domain, item),
        path,
        mtime: toMs(item.modified_time),
      });
      if (item.type === 'folder' && item.token) {
        subs.push([String(item.token), path ? `${path}/${item.name}` : String(item.name)]);
      }
    }
    if (!fast && depth < 6 && subs.length) {
      await mapPool(subs, 6, ([tok, p]) => walkFolder(tok, p, depth + 1).catch(() => {}));
    }
  }

  await walkFolder('', '', 0);
  if (needAuth) {
    return { ok: false, needAuth: true, error: `用户令牌缺少 drive 权限(${needAuth}),需要重新授权。` };
  }

  let counts = { all: items.length };
  for (const item of items) counts[item.type] = (counts[item.type] || 0) + 1;

  const rank = (item) => {
    const idx = KIND_ORDER.indexOf(item.type);
    return idx === -1 ? KIND_ORDER.length : idx;
  };
  const sortItems = () => {
    items.sort((a, b) => (b.mtime - a.mtime) || 0);
    items.sort((a, b) => rank(a) - rank(b));
  };
  sortItems();

  const recount = () => {
    for (const k of Object.keys(counts)) delete counts[k];
    counts.all = items.length;
    for (const item of items) counts[item.type] = (counts[item.type] || 0) + 1;
    sortItems();
  };

  const host = domain.replace(/^https?:\/\//, '').replace(/\/open-apis$/, '');

  // 知识库空间(失败不影响云文档列表);飞书自带的示例库不算用户内容,直接跳过
  const SAMPLE_SPACE = /示例|samples?/i;
  const spaces = [];
  try {
    const { body } = await apiFetch(`${domain}/open-apis/wiki/v2/spaces?page_size=20`, token);
    if (body && body.code === 0) {
      for (const s of (body.data || {}).items || []) {
        const id = String(s.space_id || '');
        if (!id) continue;
        const name = String(s.name || '(未命名知识库)');
        if (SAMPLE_SPACE.test(name)) continue;
        spaces.push({
          name,
          desc: String(s.description || ''),
          visibility: String(s.visibility || ''),
          url: `https://${host}/wiki/space/${id}`,
          spaceId: id,
        });
      }
    } else if (body) {
      errors.push({ path: '知识库', code: body.code, msg: body.msg || 'unknown' });
    }
  } catch (err) {
    errors.push({ path: '知识库', code: 'network', msg: String(err && err.message ? err.message : err) });
  }

  /* 飞书新版「我的文档库」是 space_type=my_library 的隐藏空间,列表接口不返回,单独取 */
  try {
    const { body } = await apiFetch(`${domain}/open-apis/wiki/v2/spaces/my_library`, token);
    if (body && body.code === 0 && body.data && body.data.space) {
      const s = body.data.space;
      spaces.push({
        name: '我的文档库',
        desc: '',
        visibility: String(s.visibility || ''),
        url: `https://${host}/wiki/space/${s.space_id}`,
        spaceId: 'my_library',
      });
    }
  } catch (err) { /* 没有个人文档库就算了 */ }

  /* 知识库节点:云盘 root 里看不到 wiki 内的文档/表格,必须按 space 逐个拉 */
  const seen = new Set(items.map((it) => `${it.type}:${it.token}`));
  const WIKI_TYPES = new Set(['docx', 'doc', 'sheet', 'bitable', 'mindnote', 'file']);
  for (const sp of (fast ? [] : spaces)) {
    if (items.length >= 900) break;
    try {
      const nodes = await listWikiNodes(domain, token, sp.spaceId, 3);
      for (const nd of nodes) {
        const type = String(nd.obj_type || '');
        if (!WIKI_TYPES.has(type)) continue;
        const tokenKey = `${type}:${String(nd.obj_token || nd.node_token || '')}`;
        if (!tokenKey || seen.has(tokenKey)) continue;
        seen.add(tokenKey);
        items.push({
          name: String(nd.title || '(未命名)'),
          type,
          token: String(nd.obj_token || nd.node_token || ''),
          nodeToken: String(nd.node_token || ''),
          url: String(nd.url || `https://${host}/wiki/${nd.node_token}`),
          path: sp.name,
          mtime: toMs(nd.obj_edit_time || nd.node_create_time),
          wiki: true,
        });
      }
    } catch (err) {
      errors.push({ path: `知识库/${sp.name}`, code: 'network', msg: String(err && err.message ? err.message : err) });
    }
  }
  recount();

  /* 群组 / 日程 / 任务:各能力独立探测,失败只降级为"未开通",不影响云文档区 */
  const caps = [];
  const chats = [];
  const events = [];
  const tasks = [];

  const appId = typeof cfg.appId === 'string' ? cfg.appId.trim() : '';
  const authLink = (need) => (appId && need
    ? `${domain}/app/${appId}/auth?q=${encodeURIComponent(need)}&op_from=openapi&token_type=tenant`
    : '');

  const noteCap = (key, label, body, fallbackNeed) => {
    if (!body || body.code === 0) {
      caps.push({ key, label, ok: true });
      return true;
    }
    const msg = String(body.msg || '');
    const i = msg.indexOf('[');
    const j = msg.indexOf(']', i + 1);
    const need = i >= 0 && j > i ? msg.slice(i + 1, j) : (fallbackNeed || '');
    caps.push({ key, label, ok: false, code: body.code, need, auth: authLink(need) });
    errors.push({ path: label, code: body.code, msg });
    return false;
  };

  const loadChats = async () => {
    try {
    const { body } = await apiFetch(`${domain}/open-apis/im/v1/chats?page_size=20&user_id_type=open_id`, token);
    if (noteCap('chats', '群组与消息', body, 'im:chat:readonly')) {
      for (const c of (body.data || {}).items || []) {
        const id = String(c.chat_id || '');
        if (!id) continue;
        chats.push({
          id,
          name: String(c.name || '(未命名群)'),
          sub: String(c.description || (c.external ? '外部群' : '内部群')),
          url: `https://applink.feishu.cn/client/chat/open?openChatId=${id}`,
        });
      }
    }
  } catch (err) {

    caps.push({ key: 'chats', label: '群组与消息', ok: false, code: 'network', need: '' });
  }
  };

  const loadCal = async () => {
    try {
    const cal = await apiFetch(`${domain}/open-apis/calendar/v4/calendars`, token);
    if (noteCap('events', '日程', cal.body, 'calendar:calendar:readonly')) {
      const list = (cal.body.data || {}).calendar_list || [];
      const primary = list.find((c) => String(c.type) === 'primary') || list[0];
      if (primary && primary.calendar_id) {
        const now = Math.floor(Date.now() / 1000);
        const from = now - 14 * 86400;
        const until = now + 30 * 86400;
        const ev = await apiFetch(
          `${domain}/open-apis/calendar/v4/calendars/${encodeURIComponent(primary.calendar_id)}/events?start_time=${from}&end_time=${until}`,
          token,
        );
        if (ev.body && ev.body.code === 0) {
          const upcoming = [];
          const past = [];
          for (const e of (ev.body.data || {}).items || []) {
            if (String(e.status) === 'cancelled') continue;
            const st = e.start_time || {};
            const ts = Number(st.timestamp || 0) * 1000;
            const row = {
              name: String(e.summary || '(无标题日程)'),
              sub: st.date ? String(st.date) : '',
              ts,
              meta: ts ? new Date(ts).toISOString() : '',
              url: String(e.app_link || ''),
            };
            if (ts >= Date.now() - 3_600_000) upcoming.push(row);
            else past.push(row);
          }
          upcoming.sort((a, b) => (a.ts || 0) - (b.ts || 0));
          past.sort((a, b) => (b.ts || 0) - (a.ts || 0));
          events.push(...(upcoming.length ? upcoming : past.slice(0, 6)));
        } else if (ev.body) {
          errors.push({ path: '日程详情', code: ev.body.code, msg: ev.body.msg || 'unknown' });
        }
      }
    }
  } catch (err) {

    caps.push({ key: 'events', label: '日程', ok: false, code: 'network', need: '' });
  }
  };

  const loadTasks = async () => {
    try {
    const { body } = await apiFetch(`${domain}/open-apis/task/v2/tasks?page_size=50&completed=false&user_id_type=open_id`, token);
    if (noteCap('tasks', '我的任务', body, 'task:task:read')) {
      for (const t of (body.data || {}).items || []) {
        if (Number(t.completed_at || 0) > 0) continue;
        const due = Number((t.due || {}).timestamp || 0) * 1000;
        tasks.push({
          name: String(t.summary || '(未命名任务)'),
          sub: '',
          ts: due,
          meta: due ? new Date(due).toISOString() : '',
          url: `https://applink.feishu.cn/client/todo/task?guid=${t.guid}`,
        });
      }
    }
  } catch (err) {

    caps.push({ key: 'tasks', label: '我的任务', ok: false, code: 'network', need: '' });
  }
  };

  await Promise.all([loadChats(), loadCal(), loadTasks()]);

  caps.unshift({ key: 'drive', label: '云文档', ok: true }, { key: 'wiki', label: '知识库', ok: !!spaces.length || !errors.some((e) => e.path === '知识库') });

  // 每日情报:优先读本地归档(intel/archive/*.json),带每期摘要;读不到再退回知识库文档名
  const intel = readIntelArchive(5);
  if (!intel.length) {
    for (const it of items) {
      if (!/^每日情报\s*\d{4}-\d{2}-\d{2}/.test(it.name)) continue;
      intel.push({ date: it.name.replace(/^每日情报\s*/, ''), url: it.url, brief: '', items: [] });
    }
    intel.sort((a, b) => (a.date < b.date ? 1 : -1));
    intel.splice(5);
  }

  const data = {
    ok: true,
    ts: Date.now(),
    caps,
    chats,
    events,
    tasks,
    intel,
    domain,
    counts,
    items,
    spaces,
    errors,
    tenant: (items.find((i) => /^https?:\/\//.test(i.url))?.url || '').replace(/^https?:\/\//, '').split('/')[0] || host,
  };

  if (fast) {
    cacheFast = { ts: Date.now(), key, data };
    return data;
  }
  cache = { ts: Date.now(), key, data };
  try { writeJson(snapshotPath(), { ts: Date.now(), key, data }); } catch { /* 快照写失败不影响主流程 */ }
  return data;
}

/* ------------------------------------------------------------------ */


/* ------------------------------------------------------------------ *
 * 写入类:新建文档 / 新建多维表格 / 速记追加
 * ------------------------------------------------------------------ */

/** 默认知识库 space_id:设置项 kbSpaceId,或环境变量 FEISHU_VIEW_KB_SPACE_ID。 */
function kbSpaceId() {
  return readSettings().kbSpaceId || (process.env.FEISHU_VIEW_KB_SPACE_ID || '').trim();
}

async function apiJson(url, token, { method = 'POST', body = null } = {}) {
  const res = await fetch(url, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      ...(body ? { 'content-type': 'application/json; charset=utf-8' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(20_000),
  });
  let out = null;
  try { out = await res.json(); } catch { out = null; }
  return out || { code: -1, msg: `HTTP ${res.status}` };
}

function writeCtx() {
  const cfg = readConfig();
  const token = typeof cfg.userAccessToken === 'string' ? cfg.userAccessToken : '';
  const domain = typeof cfg.domain === 'string' && cfg.domain ? cfg.domain : 'https://open.feishu.cn';
  if (!token) return { error: '还没有配置飞书用户令牌,请先在小卡片里点「去授权」' };
  return { token, domain, note: readSettings().note };
}

const esc = (s) => String(s == null ? '' : s);

function noteBlocks(text, stamp) {
  const out = [];
  const title = `速记 ${stamp}`;
  out.push({ block_type: 5, heading3: { elements: [{ text_run: { content: title } }], style: {} } });
  String(text).split(/\r?\n/).forEach((raw) => {
    const line = raw.replace(/\s+$/, '');
    if (!line.trim()) return;
    if (/^\s*[-*]\s+/.test(line)) {
      out.push({ block_type: 12, bullet: { elements: [{ text_run: { content: line.replace(/^\s*[-*]\s+/, '') } }], style: {} } });
    } else if (/^#{1,3}\s+/.test(line)) {
      out.push({ block_type: 5, heading3: { elements: [{ text_run: { content: line.replace(/^#{1,3}\s+/, '') } }], style: {} } });
    } else {
      out.push({ block_type: 2, text: { elements: [{ text_run: { content: line } }], style: {} } });
    }
  });
  if (out.length === 1) {
    out.push({ block_type: 2, text: { elements: [{ text_run: { content: '' } }], style: {} } });
  }
  return out;
}

const pad2 = (n) => String(n).padStart(2, '0');
function stampNow() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** 速记本:没配置就自动在知识库里建一份「📝 速记本」并记住位置 */
async function ensureNoteDoc() {
  const c = writeCtx();
  if (c.error) return c;
  const { token, domain } = c;
  const saved = c.note;
  if (saved && saved.docToken) {
    const probe = await apiJson(`${domain}/open-apis/docx/v1/documents/${saved.docToken}`, token, { method: 'GET' });
    if (probe && probe.code === 0) return { ...c, note: saved };
  }
  const spaceId = kbSpaceId();
  if (!spaceId) return { error: '还没有配置默认知识库 space_id:在 feishu-view/settings.json 里填 kbSpaceId(知识库 URL 里 space 后面的编号)' };
  const created = await apiJson(`${domain}/open-apis/wiki/v2/spaces/${spaceId}/nodes`, token, {
    body: { obj_type: 'docx', node_type: 'origin', title: '📝 速记本' },
  });
  if (!created || created.code !== 0) return { error: `建速记本失败:${(created && created.msg) || '未知错误'}` };
  const node = (created.data && created.data.node) || {};
  const note = {
    docToken: esc(node.obj_token),
    nodeToken: esc(node.node_token),
    spaceId,
    url: `https://${domain.replace(/^https?:\/\//, '')}/wiki/${esc(node.node_token)}`,
    title: '📝 速记本',
    createdAt: Date.now(),
  };
  writeNote(note);
  return { ...c, note };
}

async function saveNote({ text = '', title = '' } = {}) {
  const body = String(text || '').trim();
  if (!body) return { ok: false, error: '内容为空,没东西可记' };
  const ctx2 = await ensureNoteDoc();
  if (ctx2.error) return { ok: false, error: ctx2.error };
  const { token, domain, note } = ctx2;
  const blocks = noteBlocks(title ? `**${title}**\n${body}` : body, stampNow());
  const res = await apiJson(
    `${domain}/open-apis/docx/v1/documents/${note.docToken}/blocks/${note.docToken}/children?document_revision_id=-1`,
    token,
    { body: { children: blocks } },
  );
  if (!res || res.code !== 0) return { ok: false, error: `写入失败:${(res && res.msg) || '未知错误'}` };
  return { ok: true, url: note.url, title: note.title, added: blocks.length, at: stampNow() };
}

const ATTACH_FOLDER_NAME = '速记附件';
const MAX_UPLOAD = 20 * 1024 * 1024;

/** 附件目录:优先用设置里缓存的,没有就在「我的空间」建一个「速记附件」 */
async function ensureAttachFolder(domain, token) {
  const cached = (readJson(settingsFile(), {}) || {}).attachFolder;
  if (cached) {
    const probe = await apiJson(
      `${domain}/open-apis/drive/v1/files?folder_token=${encodeURIComponent(cached)}&page_size=1`,
      token,
      { method: 'GET' },
    );
    if (probe && probe.code === 0) return cached;
  }
  const root = await apiJson(`${domain}/open-apis/drive/explorer/v2/root_folder/meta`, token, { method: 'GET' });
  const rootToken = (root && root.data && root.data.token) || '';
  if (!rootToken) return '';
  const ls = await apiJson(
    `${domain}/open-apis/drive/v1/files?folder_token=${encodeURIComponent(rootToken)}&page_size=200`,
    token,
    { method: 'GET' },
  );
  const list = (ls && ls.data && ls.data.files) || [];
  const hit = list.find((f) => f && f.name === ATTACH_FOLDER_NAME && f.type === 'folder');
  if (hit && hit.token) { patchSettings({ attachFolder: hit.token }); return hit.token; }
  const made = await apiJson(`${domain}/open-apis/drive/v1/files/create_folder`, token, {
    body: { name: ATTACH_FOLDER_NAME, folder_token: rootToken },
  });
  const madeToken = (made && made.data && made.data.token) || '';
  if (madeToken) patchSettings({ attachFolder: madeToken });
  return madeToken;
}

/** 上传附件到「速记附件」,并在速记本末尾追加一行带链接的段落 */
async function uploadNoteFile({ name = '', data = '' } = {}) {
  const c = writeCtx();
  if (c.error) return { ok: false, error: c.error };
  const buf = Buffer.from(String(data || ''), 'base64');
  if (!buf.length) return { ok: false, error: '文件是空的' };
  if (buf.length > MAX_UPLOAD) return { ok: false, error: '单个文件上限 20MB' };
  const ctx2 = await ensureNoteDoc();
  if (ctx2.error) return { ok: false, error: ctx2.error };
  const { token, domain, note } = ctx2;
  const folder = await ensureAttachFolder(domain, token);
  if (!folder) return { ok: false, error: '找不到可用的上传目录' };
  const fileName = String(name || '').trim() || `文件-${Date.now()}`;

  const form = new FormData();
  form.append('file_name', fileName);
  form.append('parent_type', 'explorer');
  form.append('parent_node', folder);
  form.append('size', String(buf.length));
  form.append('file', new Blob([buf]), fileName);

  let out = null;
  try {
    const res = await fetch(`${domain}/open-apis/drive/v1/files/upload_all`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
      body: form,
      signal: AbortSignal.timeout(180_000),
    });
    out = await res.json();
  } catch (error) {
    return { ok: false, error: `上传超时或被中断:${String((error && error.message) || error)}` };
  }
  if (!out || out.code !== 0) return { ok: false, error: `上传失败:${(out && out.msg) || '未知错误'}` };
  const fileToken = (out.data && out.data.file_token) || '';
  const host = domain.replace(/^https?:\/\//, '');
  const url = (out.data && out.data.url) || `https://${host}/file/${fileToken}`;

  const block = {
    block_type: 2,
    text: {
      elements: [
        { text_run: { content: `📎 ${fileName}`, text_element_style: { link: { url: encodeURI(url) } } } },
        { text_run: { content: `  · ${stampNow()}` } },
      ],
      style: {},
    },
  };
  const add = await apiJson(
    `${domain}/open-apis/docx/v1/documents/${note.docToken}/blocks/${note.docToken}/children?document_revision_id=-1`,
    token,
    { body: { children: [block], index: -1 } },
  );
  const linked = Boolean(add && add.code === 0);
  return { ok: true, name: fileName, url, size: buf.length, linked, noteUrl: note.url, at: stampNow() };
}

async function createDoc({ title = '', spaceId = '', parentNodeToken = '' } = {}) {
  const c = writeCtx();
  if (c.error) return { ok: false, error: c.error };
  const name = String(title || '').trim() || `新建文档 ${stampNow()}`;
  const sid = String(spaceId || '').trim() || kbSpaceId();
  if (!sid) return { ok: false, error: '还没有配置默认知识库 space_id(设置 kbSpaceId 或环境变量 FEISHU_VIEW_KB_SPACE_ID)' };
  const payload = { obj_type: 'docx', node_type: 'origin', title: name };
  if (parentNodeToken) payload.parent_node_token = String(parentNodeToken);
  const res = await apiJson(`${c.domain}/open-apis/wiki/v2/spaces/${sid}/nodes`, c.token, { body: payload });
  if (!res || res.code !== 0) return { ok: false, error: `新建文档失败:${(res && res.msg) || '未知错误'}` };
  const node = (res.data && res.data.node) || {};
  return {
    ok: true,
    title: name,
    docToken: esc(node.obj_token),
    nodeToken: esc(node.node_token),
    url: `https://${c.domain.replace(/^https?:\/\//, '')}/wiki/${esc(node.node_token)}`,
  };
}

async function createBitable({ name = '', spaceId = '', parentNodeToken = '' } = {}) {
  const c = writeCtx();
  if (c.error) return { ok: false, error: c.error };
  const title = String(name || '').trim() || `新建多维表格 ${stampNow()}`;
  const res = await apiJson(`${c.domain}/open-apis/bitable/v1/apps`, c.token, { body: { name: title } });
  if (!res || res.code !== 0) return { ok: false, error: `新建多维表格失败:${(res && res.msg) || '未知错误'}` };
  const app = (res.data && res.data.app) || {};
  const appToken = esc(app.app_token);
  const sid = String(spaceId || '').trim() || kbSpaceId();
  let url = esc(app.url);
  let nodeToken = '';
  if (sid && appToken) {
    const mv = await apiJson(`${c.domain}/open-apis/wiki/v2/spaces/${sid}/nodes/move_docs_to_wiki`, c.token, {
      body: {
        parent_wiki_token: String(parentNodeToken || ''),
        obj_type: 'bitable',
        obj_token: appToken,
        apply: true,
      },
    });
    if (mv && mv.code === 0) {
      const wikiTok = esc((mv.data && mv.data.wiki_token) || (mv.data && mv.data.node && mv.data.node.node_token));
      if (wikiTok) {
        nodeToken = wikiTok;
        url = `https://${c.domain.replace(/^https?:\/\//, '')}/wiki/${wikiTok}`;
      }
    }
  }
  return { ok: true, title, appToken, tableId: esc(app.default_table_id), nodeToken, url, moved: Boolean(nodeToken) };
}

async function handle(endpoint, payload) {
  if (endpoint === 'status') return readStatus();
  if (endpoint === 'inventory') {
    const body = payload && typeof payload === 'object' ? payload : {};
    return loadInventory({ force: body.force === true, fast: body.fast === true });
  }
  if (endpoint === 'settings') {
    const body = payload && typeof payload === 'object' ? payload : {};
    return { ok: true, ...writeShowTab(body.showTab, body) };
  }
  if (endpoint === 'note') {
    const body = payload && typeof payload === 'object' ? payload : {};
    return saveNote({ text: body.text, title: body.title });
  }
  if (endpoint === 'noteTarget') {
    const body = payload && typeof payload === 'object' ? payload : {};
    if (body.reset === true) { writeNote(null); return { ok: true, note: null }; }
    if (body.peek === true) return { ok: true, note: readSettings().note || null };
    const c = await ensureNoteDoc();
    if (c.error) return { ok: false, error: c.error };
    return { ok: true, note: c.note };
  }
  if (endpoint === 'createDoc') {
    const body = payload && typeof payload === 'object' ? payload : {};
    return createDoc(body);
  }
  if (endpoint === 'createBitable') {
    const body = payload && typeof payload === 'object' ? payload : {};
    return createBitable(body);
  }
  if (endpoint === 'noteFile') {
    const body = payload && typeof payload === 'object' ? payload : {};
    return uploadNoteFile({ name: body.name, data: body.data });
  }
  throw new Error(`unknown endpoint: ${String(endpoint)}`);
}

const json = (value) => Response.json(value, { headers: { 'cache-control': 'no-store' } });

function reply(result) {
  if (result && typeof result === 'object' && result.ok === false && result.error) {
    return json({ ok: false, error: { code: 'feishu-view/failed', message: String(result.error) }, ...result });
  }
  return json({ ok: true, value: result });
}

export function apply(ctx) {
  // webServer 必须一起 inject:connection.rpc.handle 内部会读 owner.webServer 注册前缀路由。
  ctx.inject(['connection', 'webServer'], (scope) => {
    // 主通道:POST /api/feishu-view,body = { method, payload }
    // (与 @xmanrui/dsh-im 相同的注册方式;RPC 通道在部分 DSH 版本上 405,不再依赖它)
    if (scope.connection?.fetch?.register) {
      scope.effect(() => scope.connection.fetch.register({
        path: ROUTE,
        methods: ['POST'],
        requestBody: 'buffered',
        fetch: async (request) => {
          let body = {};
          try {
            body = await request.json();
          } catch {
            body = {};
          }
          const method = typeof body.method === 'string' ? body.method : 'status';
          try {
            return reply(await handle(method, body.payload));
          } catch (error) {
            return json({
              ok: false,
              error: { code: 'feishu-view/failed', message: String((error && error.message) || error) },
            });
          }
        },
      }), 'feishu-view: route');

      // 兼容旧路由:插件早期版本客户端直接 GET 这两条。
      scope.effect(() => scope.connection.fetch.register({
        path: '/api/feishu-view/status',
        methods: ['GET'],
        requestBody: 'none',
        fetch: () => json(readStatus()),
      }), 'feishu-view: status');

      scope.effect(() => scope.connection.fetch.register({
        path: '/api/feishu-view/inventory',
        methods: ['GET'],
        requestBody: 'none',
        fetch: async () => reply(await loadInventory({})),
      }), 'feishu-view: inventory-get');

      scope.effect(() => scope.connection.fetch.register({
        path: '/api/feishu-view/settings',
        methods: ['POST'],
        requestBody: 'buffered',
        fetch: async (request) => {
          let body = {};
          try {
            body = await request.json();
          } catch {
            body = {};
          }
          return json({ ok: true, ...writeShowTab(body.showTab, body) });
        },
      }), 'feishu-view: settings');
    }

    // 可选:旧版 dsh 的 RPC 通道,存在就一并挂上,不影响 fetch 路由。
    const rpc = scope.connection?.rpc;
    if (rpc && typeof rpc.handle === 'function') {
      try {
        scope.effect(
          () => rpc.handle(CHANNEL, (endpoint, payload) => handle(endpoint, payload)),
          'feishu-view: rpc',
        );
      } catch {
        /* 没有 rpc.handle 时忽略 */
      }
    }
  });
}
