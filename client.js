window.__ModuleLoader__.load({
  id: 'dsh-feishu-view',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useState, useEffect, useCallback, useMemo } = React;

    const NS = 'feishuView';
    const base = (() => {
      try { return new URL('.', document.baseURI).href; } catch { return '/'; }
    })();

    const ZH = {
      tab: '飞书',
      title: '飞书',
      checking: '正在读取飞书云空间…',
      ready: '已接入',
      notReady: '尚未接入',
      reload: '刷新',
      search: '搜索文档、多维表格…',
      statAll: '全部内容',
      statTable: '多维表格',
      statDoc: '文档',
      statRecent: '7 天内更新',
      statLatest: '最近更新',
      match: '匹配',
      clear: '清除',
      noMatch: '没有匹配到',
      wiki: '知识库',
      wikiPrivate: '私有',
      open: '打开',
      bitable: '多维表格',
      doc: '文档',
      docx: '文档',
      sheet: '电子表格',
      mindnote: '思维笔记',
      folder: '文件夹',
      file: '普通文件',
      shortcut: '快捷方式',
      viewAll: '查看全部',
      collapse: '收起',
      examples: '可以这样说',
      ex1: '把这份总结写成飞书文档',
      ex2: '读一下「爆款选题库」前 10 条',
      ex3: '查一下我明天的会议',
      empty: '云空间里还没有内容。',
      error: '读取失败',
      needAuth: '需要重新授权：在对话里让我发起飞书授权，完成后点「刷新」。',
      openFail: '打不开这个链接',
      settingsTitle: '飞书 · 顶栏入口',
      settingsShowTab: '在会话顶栏显示「飞书」标签',
      settingsHint: '默认不显示。打开后会多一个「飞书」标签，点进去看云空间内容；关掉只是收走标签，飞书能力一直在。',
      settingsSaved: '已保存，刷新后生效。',
      settingsSavedLocal: '已保存到本机，刷新后生效',
      settingsReload: '立即刷新',
      settingsSaveFail: '保存失败',
      intel: '每日情报',
      agenda: '近日日程',
      noAgenda: '未来 30 天没有日程',
      noTask: '没有未完成的待办',
      intelEmpty: '还没有推送记录,每天 9:00 自动生成',
      chats: '群组',
      tasks: '我的任务',
      caps: '能力',
      capOff: '未开通,点击去开通',
      today: '今天',
      tomorrow: '明天',
      last7: '近 7 天变动',
      typeDist: '类型分布',
      updated: '更新',
      other: '其他',
      noData: '暂无数据',
      scaleNote: '按修改时间统计，单位为次',
      totalItems: '全部内容',
      inRoot: '在根目录',
      dupNote: '同名副本',
      extNote: '外部群',
      newBtn: '＋ 新建',
      newDoc: '文档',
      newBitable: '多维表格',
      newTitle: '标题',
      newTitlePh: '不填就自动按时间命名',
      newPlace: '位置',
      newDefault: '默认 · 企业知识库',
      create: '创建',
      cancel: '取消',
      creating: '创建中…',
      createdOk: '已创建',
      note: '速记',
      notePh: '想到什么写什么，Ctrl+Enter 提交',
      noteSave: '存到飞书',
      noteSaving: '保存中…',
      noteSaved: '已存到飞书',
      noteOpen: '打开速记本',
      noteTargetPh: '还没有速记本，第一次提交会自动创建',
      upload: '上传文件',
      uploading: '上传中…',
      uploaded: '已上传',
      uploadFail: '上传失败',
      uploadWhich: '正在上传',
      uploadHint: '存到速记本附带的「速记附件」文件夹，单个文件 ≤ 20MB，可多选',
      createFail: '创建失败',
      noteFail: '保存失败',
    };

    const EN = {
      tab: 'Feishu',
      title: 'Feishu',
      checking: 'Loading your Feishu drive…',
      ready: 'Connected',
      notReady: 'Not configured',
      reload: 'Refresh',
      search: 'Search docs, bases…',
      statAll: 'All items',
      statTable: 'Bases',
      statDoc: 'Docs',
      statRecent: 'Updated in 7d',
      statLatest: 'Last update',
      match: 'Matched',
      clear: 'Clear',
      noMatch: 'No match for',
      wiki: 'Wiki',
      wikiPrivate: 'Private',
      open: 'Open',
      bitable: 'Base',
      doc: 'Doc',
      docx: 'Doc',
      sheet: 'Sheet',
      mindnote: 'Mindnote',
      folder: 'Folder',
      file: 'File',
      shortcut: 'Shortcut',
      viewAll: 'View all',
      collapse: 'Collapse',
      examples: 'Try saying',
      ex1: 'Turn this summary into a Feishu doc',
      ex2: 'Read the first 10 rows of my topic base',
      ex3: 'What meetings do I have tomorrow?',
      empty: 'Nothing in the drive yet.',
      error: 'Failed to load',
      needAuth: 'Authorization needed: ask me in chat to start Feishu OAuth, then press Refresh.',
      openFail: 'Could not open the link',
      settingsTitle: 'Feishu · top bar entry',
      settingsShowTab: 'Show the "Feishu" tab in the session top bar',
      settingsHint: 'Hidden by default. Turning it on adds a Feishu tab with your drive contents; turning it off only removes the tab, the capability stays.',
      settingsSaved: 'Saved. Reload to apply.',
      settingsSavedLocal: 'Saved locally. Reload to apply',
      settingsReload: 'Reload now',
      settingsSaveFail: 'Save failed',
      intel: 'Daily intel',
      agenda: 'Upcoming',
      noAgenda: 'Nothing scheduled in 30 days',
      noTask: 'No open tasks',
      intelEmpty: 'No digest yet — generated daily at 9:00',
      chats: 'Chats',
      tasks: 'My tasks',
      caps: 'Capabilities',
      capOff: 'Not enabled — click to open settings',
      today: 'Today',
      tomorrow: 'Tomorrow',
      last7: 'Last 7 days',
      typeDist: 'By type',
      updated: 'updated',
      other: 'Other',
      noData: 'No data',
      scaleNote: 'Counted by modified time',
      totalItems: 'All items',
      inRoot: 'in root',
      dupNote: 'duplicates',
      extNote: 'external',
      newBtn: '+ New',
      newDoc: 'Doc',
      newBitable: 'Base',
      newTitle: 'Title',
      newTitlePh: 'Leave blank to name it by time',
      newPlace: 'Location',
      newDefault: 'Default · company wiki',
      create: 'Create',
      cancel: 'Cancel',
      creating: 'Creating…',
      createdOk: 'Created',
      note: 'Quick note',
      notePh: 'Jot it down, Ctrl+Enter to submit',
      noteSave: 'Save to Feishu',
      noteSaving: 'Saving…',
      noteSaved: 'Saved to Feishu',
      noteOpen: 'Open notebook',
      noteTargetPh: 'No notebook yet — the first note creates one',
      upload: 'Attach file',
      uploading: 'Uploading…',
      uploaded: 'Uploaded',
      uploadFail: 'Upload failed',
      uploadWhich: 'Uploading',
      uploadHint: 'Saved into the "速记附件" folder, up to 20 MB each, multi-select supported',
      createFail: 'Create failed',
      noteFail: 'Save failed',
    };

    const MUTED = 'rgba(20,20,20,.6)';
    const LINE = 'rgba(0,0,0,.10)';

    const S = {
      btn: {
        padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', font: 'inherit',
        fontSize: '13px', background: '#ffffff', border: `1px solid ${LINE}`, color: '#141414',
      },
      err: { color: '#b42318', fontSize: '12px', background: '#fef3f2', padding: '10px 12px', borderRadius: '10px' },
    };

    /* ---------------- 样式(作用域限定在 .fsv-) ---------------- */
    const CSS = `
.fsv-newbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:10px 12px;margin:10px 0 2px;
  background:var(--dsw-alias-bg-layer-1,#fff);border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));border-radius:10px}
.fsv-seg{display:flex;gap:2px;padding:2px;border-radius:8px;background:rgba(38,49,72,.05)}
.fsv-seg button{border:0;background:transparent;font:inherit;font-size:12px;color:var(--dsw-alias-label-secondary,rgba(20,20,20,.74));
  padding:4px 10px;border-radius:6px;cursor:pointer}
.fsv-seg button.on{background:var(--dsw-alias-bg-layer-1,#fff);color:var(--dsw-alias-label-primary,#141414);
  box-shadow:0 1px 2px rgba(0,0,0,.08);font-weight:600}
.fsv-newin{flex:1 1 180px;min-width:120px;height:30px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));
  background:rgba(38,49,72,.03);padding:0 10px;font:inherit;font-size:12.5px;color:var(--dsw-alias-label-primary,#141414);outline:0}
.fsv-newin:focus{border-color:var(--dsw-alias-brand-primary,#0f1115)}
.fsv-sel{height:30px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));
  background:var(--dsw-alias-bg-layer-1,#fff);padding:0 8px;font:inherit;font-size:12px;color:var(--dsw-alias-label-primary,#141414);outline:0}
.fsv-btn-primary{height:30px;padding:0 14px;border:0;border-radius:8px;background:var(--dsw-alias-brand-primary,#0f1115);
  color:#fff;font:inherit;font-size:12px;cursor:pointer}
.fsv-btn-primary:disabled{opacity:.5;cursor:default}
.fsv-btn-ghost{height:30px;padding:0 12px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));
  background:transparent;font:inherit;font-size:12px;color:var(--dsw-alias-label-secondary,rgba(20,20,20,.74));cursor:pointer}
.fsv-note-ta{width:100%;box-sizing:border-box;min-height:52px;resize:vertical;border-radius:8px;
  border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));background:rgba(38,49,72,.03);padding:9px 11px;
  font:inherit;font-size:12.5px;line-height:1.6;color:var(--dsw-alias-label-primary,#141414);outline:0}
.fsv-note-ta:focus{border-color:var(--dsw-alias-brand-primary,#0f1115)}
.fsv-note-bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:8px}
.fsv-note-bar .fsv-sp{flex:1}
.fsv-hd-sub{font-size:11px;font-weight:400;color:var(--dsw-alias-label-tertiary,rgba(20,20,20,.5))}
.fsv-mini-link{font-size:11.5px;color:var(--dsw-alias-brand-business,#4176e6);text-decoration:none;cursor:pointer;
  border:0;background:transparent;font-family:inherit;padding:0}
.fsv-mini-link:hover{text-decoration:underline}
.fsv-ok{font-size:11.5px;color:var(--dsw-alias-state-success,#22c55e)}
.fsv-bad{font-size:11.5px;color:#d33}

.fsv-wrap{
  display:flex;flex-direction:column;gap:18px;padding:20px;height:100%;overflow-y:auto;
  box-sizing:border-box;font:inherit;
  color:var(--dsw-alias-label-primary,rgba(20,20,20,1));
  background:var(--dsw-alias-bg-layer-1,#fff);
}
.fsv-hd{display:flex;align-items:center;gap:10px}
.fsv-h1{font-size:15px;font-weight:600;letter-spacing:.01em}
.fsv-badge{display:inline-flex;align-items:center;gap:5px;font-size:11px;
  color:var(--dsw-alias-label-secondary,rgba(20,20,20,.74));
  border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));border-radius:999px;padding:2px 9px}
.fsv-dot{width:6px;height:6px;border-radius:50%;background:var(--dsw-alias-state-success-primary,#22c55e)}
.fsv-dot.off{background:var(--dsw-alias-label-tertiary,rgba(20,20,20,.4))}
.fsv-sp{flex:1}
.fsv-ib{height:28px;padding:0 10px;border-radius:var(--dsw-radius-sm,8px);
  border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));background:transparent;cursor:pointer;
  font:inherit;font-size:12px;color:var(--dsw-alias-label-secondary,rgba(20,20,20,.74))}
.fsv-ib:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(38,49,72,.06))}
.fsv-search{display:flex;align-items:center;gap:8px;height:34px;padding:0 10px 0 12px;border-radius:var(--dsw-radius-sm,8px);
  background:var(--dsw-alias-interactive-bg-hover,rgba(38,49,72,.05));font-size:12px;
  color:var(--dsw-alias-label-tertiary,rgba(20,20,20,.55));transition:background .12s ease, box-shadow .12s ease}
.fsv-search:focus-within{background:var(--dsw-alias-bg-layer-1,#fff);
  box-shadow:0 0 0 1px var(--dsw-alias-border-l3,rgba(0,0,0,.12))}
.fsv-search svg{flex:none;opacity:.5}
.fsv-search-in{flex:1;min-width:0;height:100%;border:0;background:transparent;font:inherit;font-size:12px;
  color:var(--dsw-alias-label-primary,rgba(20,20,20,.9));outline:none}
.fsv-search-in::placeholder{color:var(--dsw-alias-label-tertiary,rgba(20,20,20,.5))}
.fsv-search-k{flex:none;font-size:10px;line-height:16px;padding:0 4px;border-radius:4px;
  border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));color:var(--dsw-alias-label-tertiary,rgba(20,20,20,.45))}
.fsv-clear{flex:none;border:0;background:none;cursor:pointer;font:inherit;font-size:12px;line-height:1;
  padding:2px 3px;border-radius:4px;color:var(--dsw-alias-label-tertiary,rgba(20,20,20,.55))}
.fsv-clear:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(38,49,72,.08));color:var(--dsw-alias-label-primary,#141414)}
.fsv-hint{font-size:11px;color:var(--dsw-alias-label-tertiary,rgba(20,20,20,.6))}
.fsv-hint b{font-weight:600;color:var(--dsw-alias-label-secondary,rgba(20,20,20,.74))}
.fsv-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
.fsv-stat{border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));border-radius:var(--dsw-radius-md,12px);padding:10px 12px}
.fsv-stat b{display:block;font-size:18px;font-weight:600;line-height:1.2;letter-spacing:-.01em}
.fsv-stat span{font-size:11px;color:var(--dsw-alias-label-tertiary,rgba(20,20,20,.6))}
.fsv-sec{display:flex;flex-direction:column;gap:10px}
.fsv-sec-hd{display:flex;align-items:baseline;gap:8px}
.fsv-sec-hd h2{font-size:12px;font-weight:600;margin:0}
.fsv-sec-hd .n{font-size:11px;color:var(--dsw-alias-label-tertiary,rgba(20,20,20,.6))}
.fsv-more{margin-left:auto;font-size:11px;background:none;border:0;padding:0;cursor:pointer;font:inherit;
  color:var(--dsw-alias-state-business-primary,#4176e6)}
.fsv-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.fsv-card{display:flex;flex-direction:column;gap:5px;text-align:left;cursor:pointer;font:inherit;
  border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));border-radius:var(--dsw-radius-md,12px);
  padding:11px 12px;background:transparent;color:inherit;min-width:0}
.fsv-card:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(38,49,72,.06))}
.fsv-card .top{display:flex;align-items:center;gap:7px;min-width:0}
.fsv-name{font-size:12.5px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.fsv-meta{font-size:10.5px;color:var(--dsw-alias-label-tertiary,rgba(20,20,20,.6));
  display:flex;gap:6px;align-items:center;white-space:nowrap;overflow:hidden}
.fsv-sq{width:18px;height:18px;border-radius:5px;display:flex;align-items:center;justify-content:center;
  font-size:10px;color:#fff;flex:0 0 auto;line-height:1}
.fsv-tag{font-size:10px;padding:1px 5px;border-radius:4px;background:rgba(245,158,11,.14);color:#a16207}
.fsv-row{display:flex;align-items:center;gap:10px;padding:8px 6px;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.05));
  background:none;border-left:0;border-right:0;border-top:0;cursor:pointer;font:inherit;color:inherit;text-align:left;width:100%}
.fsv-row:last-child{border-bottom:0}
.fsv-row:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(38,49,72,.06))}
.fsv-row .nm{font-size:12.5px;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.fsv-row .loc{font-size:10.5px;color:var(--dsw-alias-label-tertiary,rgba(20,20,20,.6));white-space:nowrap;max-width:38%;overflow:hidden;text-overflow:ellipsis}
.fsv-row .when{font-size:10.5px;color:var(--dsw-alias-label-tertiary,rgba(20,20,20,.6));white-space:nowrap;width:44px;text-align:right;flex:0 0 auto}
.fsv-rowlist{display:flex;flex-direction:column}
.fsv-wiki-ic{font-size:13px;line-height:1;flex:0 0 auto}
.fsv-slot{flex:0 0 auto;width:76px;font-size:11px;color:var(--dsw-alias-label-secondary,rgba(20,20,20,.74));font-variant-numeric:tabular-nums}
.fsv-caps-ib{display:flex;align-items:center;gap:5px;min-width:0;overflow:hidden;margin-left:2px;flex:0 1 auto}
.fsv-caps-ib .fsv-cap{font-size:10.5px;line-height:1.5;padding:1px 7px;gap:5px;height:20px;white-space:nowrap;flex:0 0 auto}
.fsv-caps-ib .fsv-dot{width:5px;height:5px}
.fsv-cap{display:inline-flex;align-items:center;gap:6px;font:inherit;font-size:11px;line-height:1.6;padding:2px 9px;border-radius:999px;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));background:transparent;color:var(--dsw-alias-label-secondary,rgba(20,20,20,.74))}
.fsv-cap.off{cursor:pointer;border-style:dashed;color:var(--dsw-alias-label-tertiary,rgba(20,20,20,.6))}
.fsv-cap.off:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(38,49,72,.06))}
.fsv-intel-row{display:flex;align-items:flex-start;gap:8px;padding:7px 2px;border-bottom:1px dashed var(--dsw-alias-border-l1);cursor:pointer}
.fsv-intel-row:last-child{border-bottom:none}
.fsv-intel-row:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(38,49,72,.06))}
.fsv-intel-tt{font-size:13px;line-height:1.5;color:var(--dsw-alias-label-primary,rgb(20,20,20));overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.fsv-tag{flex:0 0 auto;font-size:10.5px;line-height:18px;height:18px;padding:0 6px;border-radius:5px;font-weight:600;margin-top:1px}
.fsv-tag-AI{background:rgba(86,134,254,.14);color:#3563d6}
.fsv-tag-X{background:rgba(20,20,20,.08);color:rgba(20,20,20,.78)}
.fsv-tag-政策{background:rgba(34,197,94,.15);color:#178a45}
.fsv-tag-抖音{background:rgba(232,89,12,.14);color:#c2410c}
.fsv-wiki-go{font-size:10.5px;color:var(--dsw-alias-brand-primary,#0f1115);opacity:.65;flex:0 0 auto}
.fsv-foot{border-top:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.05));padding-top:12px;display:flex;flex-direction:column;gap:7px}
.fsv-foot .t{font-size:10.5px;color:var(--dsw-alias-label-tertiary,rgba(20,20,20,.6));letter-spacing:.02em}
.fsv-chips{display:flex;gap:6px;flex-wrap:wrap}
.fsv-chip{font-size:11px;color:var(--dsw-alias-label-secondary,rgba(20,20,20,.74));cursor:pointer;font:inherit;
  border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));border-radius:999px;padding:4px 10px;background:transparent}
.fsv-chip:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(38,49,72,.06))}
/* ---------- 仪表盘骨架(对齐上下文洞察的卡片/网格规范) ---------- */
.fsv-wrap{display:flex;flex-direction:column;gap:14px;padding:14px;box-sizing:border-box;
  min-height:100%;overflow-y:auto;color:var(--dsw-alias-label-primary,#141414)}
.fsv-hd{display:flex;align-items:center;gap:8px;flex-wrap:nowrap}
.fsv-h1{font-size:14px;font-weight:600;letter-spacing:.01em}
.fsv-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
.fsv-kpi{border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));border-radius:var(--dsw-radius-md,12px);
  padding:12px 14px;background:var(--dsw-alias-bg-layer-1,#fff);min-width:0}
.fsv-kpi b{display:block;font-size:22px;font-weight:650;letter-spacing:-.02em;line-height:1.15}
.fsv-kpi span{display:block;margin-top:4px;font-size:11px;color:var(--dsw-alias-label-tertiary,rgba(20,20,20,.6));
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fsv-main{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(280px,1fr);gap:12px;align-items:start}
.fsv-duo{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px;align-items:stretch}
.fsv-col{display:flex;flex-direction:column;gap:12px;min-width:0}
.fsv-card2{border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));border-radius:var(--dsw-radius-md,12px);
  padding:12px 14px 8px;background:var(--dsw-alias-bg-layer-1,#fff);min-width:0}
.fsv-card2>.hd{display:flex;align-items:center;gap:8px;padding-bottom:8px;margin-bottom:4px;
  border-bottom:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.05))}
.fsv-card2>.hd h2{font-size:12.5px;font-weight:600;margin:0}
.fsv-card2>.hd .n{font-size:11px;color:var(--dsw-alias-label-tertiary,rgba(20,20,20,.6));font-variant-numeric:tabular-nums}
.fsv-card2 .body{display:flex;flex-direction:column;min-width:0}

.fsv-top{display:grid;grid-template-columns:minmax(300px,1.1fr) minmax(300px,1.15fr) minmax(230px,.85fr);gap:12px;align-items:stretch}
.fsv-kpis6{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-auto-rows:minmax(0,1fr);gap:10px}
.fsv-kpi{display:flex;flex-direction:column;justify-content:center;min-width:0;background:var(--dsw-alias-bg-layer-1,#fff);
  border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));border-radius:var(--dsw-radius-md,12px);padding:10px 12px}
.fsv-kpi b{font-size:19px;font-weight:650;line-height:1.2;letter-spacing:-.02em}
.fsv-kpi span{font-size:11px;color:var(--dsw-alias-label-tertiary,rgba(20,20,20,.6));margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fsv-kpi u{display:block;margin-top:2px;font-size:10px;text-decoration:none;color:var(--dsw-alias-label-tertiary,rgba(20,20,20,.5));white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fsv-bars{display:flex;align-items:flex-end;gap:9px;height:104px;padding:0 2px}
.fsv-barcol{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:3px}
.fsv-barval{font-size:10px;color:var(--dsw-alias-label-tertiary,rgba(20,20,20,.55));font-variant-numeric:tabular-nums;height:12px}
.fsv-bar{width:100%;border-radius:4px 4px 2px 2px;background:linear-gradient(180deg,#8fadff,#4b78ee);min-height:3px}
.fsv-bar.zero{background:var(--dsw-alias-border-l2,rgba(0,0,0,.08))}
.fsv-barlabel{font-size:9.5px;color:var(--dsw-alias-label-tertiary,rgba(20,20,20,.5));white-space:nowrap}
.fsv-donutwrap{display:flex;align-items:center;gap:14px;padding:2px 0 6px}
.fsv-donut{position:relative;width:88px;height:88px;border-radius:50%;flex:none}
.fsv-donut::after{content:'';position:absolute;inset:17px;border-radius:50%;background:var(--dsw-alias-bg-layer-1,#fff)}
.fsv-donut b{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;z-index:1}
.fsv-legend{display:flex;flex-direction:column;gap:4px;flex:1;min-width:0}
.fsv-legend div{display:flex;align-items:center;gap:6px;font-size:11.5px;color:var(--dsw-alias-label-secondary,rgba(20,20,20,.74))}
.fsv-legend i{width:7px;height:7px;border-radius:2px;flex:none}
.fsv-legend span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.fsv-legend em{font-style:normal;color:var(--dsw-alias-label-tertiary,rgba(20,20,20,.55));font-variant-numeric:tabular-nums}
.fsv-hd-ic{font-style:normal;font-size:12px;line-height:1;flex:none;color:var(--dsw-alias-label-tertiary,rgba(20,20,20,.5))}
.fsv-card2>.hd .meta{margin-left:auto;font-size:10.5px;color:var(--dsw-alias-label-tertiary,rgba(20,20,20,.5))}
@media (max-width:980px){
  .fsv-main{grid-template-columns:minmax(0,1fr)}
  .fsv-duo{grid-template-columns:minmax(0,1fr)}
  .fsv-top{grid-template-columns:minmax(0,1fr)}
  .fsv-kpis6{grid-template-columns:repeat(2,minmax(0,1fr))}
}
`;

    let injected = false;
    function useStyles() {
      if (injected || typeof document === 'undefined') return;
      injected = true;
      const el = document.createElement('style');
      el.setAttribute('data-feishu-view', '1');
      el.textContent = CSS;
      document.head.appendChild(el);
    }

    let currentT = (k) => ZH[k] || k;
    function useT() { return currentT; }

    /* ---------------- 类型元信息 ---------------- */
    const TYPES = {
      bitable: { fg: 'var(--dsw-static-deepseek-450,#5686fe)', glyph: '▦', soft: 'rgba(65,118,230,.12)' },
      docx: { fg: '#7b61ff', glyph: '≡', soft: 'rgba(123,97,255,.12)' },
      doc: { fg: '#7b61ff', glyph: '≡', soft: 'rgba(123,97,255,.12)' },
      sheet: { fg: 'var(--dsw-static-green-500,#22c55e)', glyph: '▤', soft: 'rgba(34,197,94,.14)' },
      mindnote: { fg: 'var(--dsw-static-amber-500,#f59e0b)', glyph: '◈', soft: 'rgba(245,158,11,.16)' },
      folder: { fg: '#81858c', glyph: '▢', soft: 'rgba(129,133,140,.14)' },
      file: { fg: '#a2a4a6', glyph: '◻', soft: 'rgba(162,164,166,.14)' },
      shortcut: { fg: '#60a5fa', glyph: '↗', soft: 'rgba(96,165,250,.14)' },
      image: { fg: '#adb2b8', glyph: '▩', soft: 'rgba(173,178,184,.14)' },
    };
    const metaOf = (type) => TYPES[type] || TYPES.file;

    const DAY = 86_400_000;
    function fmtDate(ms) {
      if (!ms) return '—';
      const d = new Date(ms);
      if (Number.isNaN(d.getTime())) return '—';
      const pad = (n) => String(n).padStart(2, '0');
      return `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }

    function fmtSlot(ms, t) {
      if (!ms) return '';
      const d = new Date(ms);
      if (Number.isNaN(d.getTime())) return '';
      const pad = (n) => String(n).padStart(2, '0');
      const hm = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
      const today = new Date();
      const sameDay = (a, b) => a.getFullYear() === b.getFullYear()
        && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
      if (sameDay(d, today)) return `${t('today')} ${hm}`;
      const tomorrow = new Date(today.getTime() + DAY);
      if (sameDay(d, tomorrow)) return `${t('tomorrow')} ${hm}`;
      return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${hm}`;
    }

    function openLink(url, t) {
      if (!url) {
        try { window.alert(t('openFail')); } catch { /* ignore */ }
        return;
      }
      try {
        window.open(url, '_blank', 'noopener,noreferrer');
      } catch {
        try { window.location.href = url; } catch { /* ignore */ }
      }
    }

    /* ---------------- 主机通道 ---------------- */
    const RPC_CHANNEL = '/feishu-view';
    let rpc = null;

    function attachRpc(ctx) {
      try {
        const direct = typeof ctx.get === 'function' ? ctx.get('connection') : ctx.connection;
        if (direct && direct.rpc && typeof direct.rpc.call === 'function') rpc = direct.rpc;
      } catch { rpc = null; }
      try {
        if (typeof ctx.inject === 'function') {
          ctx.inject(['connection'], (scope) => {
            const connection = scope && scope.connection;
            if (connection && connection.rpc && typeof connection.rpc.call === 'function') rpc = connection.rpc;
            return () => { rpc = null; };
          });
        }
      } catch { /* keep whatever we found */ }
    }

    async function hostCall(method, payload) {
      const res = await fetch(`${base}api/feishu-view`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ method, payload: payload || {} }),
      });
      let body = null;
      try {
        body = await res.json();
      } catch {
        throw new Error(`HTTP ${res.status}`);
      }
      if (!body || body.ok !== true) {
        const msg = (body && body.error && (body.error.message || body.error.code)) || `HTTP ${res.status}`;
        const err = new Error(String(msg));
        err.needAuth = Boolean(body && body.needAuth);
        throw err;
      }
      return body.value;
    }

    async function loadStatus() {
      try {
        if (rpc) {
          const result = await rpc.call(RPC_CHANNEL, 'status', {});
          const value = result && typeof result === 'object' && 'value' in result ? result.value : result;
          if (value) return value;
        }
      } catch { /* fall through */ }
      return hostCall('status');
    }

    async function saveTabPref(showTab) {
      try {
        if (rpc) {
          const result = await rpc.call(RPC_CHANNEL, 'settings', { showTab });
          const value = result && typeof result === 'object' && 'value' in result ? result.value : result;
          if (value) return value;
        }
      } catch { /* fall through */ }
      return hostCall('settings', { showTab });
    }

    const TAB_FLAG = 'dsh-feishu-view:show-tab';
    const CACHE_KEY = 'dsh-feishu-view:cache';
    const CACHE_MAX = 900_000;

    /* 面板打开瞬间先用上次的数据渲染，网络结果回来再覆盖 —— 解决"点开没反应" */
    function readLocalCache() {
      try {
        const raw = window.localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed && parsed.ok ? parsed : null;
      } catch { return null; }
    }

    function writeLocalCache(data) {
      try {
        if (!data || !data.ok) return;
        const raw = JSON.stringify({ ...data, cachedAt: Date.now() });
        if (raw.length > CACHE_MAX) return;
        window.localStorage.setItem(CACHE_KEY, raw);
      } catch { /* 存不下就算了，不影响主流程 */ }
    }

    function readTabFlag() {
      try { return window.localStorage.getItem(TAB_FLAG) === '1'; } catch { return false; }
    }
    function hasTabFlag() {
      try { return window.localStorage.getItem(TAB_FLAG) !== null; } catch { return false; }
    }
    function writeTabFlag(value) {
      try { window.localStorage.setItem(TAB_FLAG, value ? '1' : '0'); } catch { /* ignore */ }
    }

    /* ---------------- 工作台 ---------------- */
    function Stat(props) {
      return h('div', { className: 'fsv-stat' },
        h('b', null, String(props.value)),
        h('span', null, props.label));
    }

    function BitCard(props) {
      const item = props.item;
      const meta = metaOf(item.type);
      return h('button', {
        className: 'fsv-card',
        title: item.url,
        onClick: () => props.onOpen(item),
      },
        h('div', { className: 'top' },
          h('i', { className: 'fsv-sq', style: { background: meta.fg } }, meta.glyph),
          h('span', { className: 'fsv-name' }, item.name)),
        h('div', { className: 'fsv-meta' },
          h('span', null, item.path || '根目录'),
          h('span', null, '·'),
          h('span', null, fmtDate(item.mtime)),
          props.dupLevel > 1 ? h('span', { className: 'fsv-tag' }, `${props.dupLevel} 个同名`) : null));
    }

    function DocRow(props) {
      const item = props.item;
      const meta = metaOf(item.type);
      return h('button', { className: 'fsv-row', title: item.url, onClick: () => props.onOpen(item) },
        h('i', { className: 'fsv-sq', style: { background: meta.fg } }, meta.glyph),
        h('span', { className: 'nm' }, item.name),
        props.dupLevel > 1 ? h('span', { className: 'fsv-tag' }, `${props.dupLevel} 份`) : null,
        item.path ? h('span', { className: 'loc' }, item.path) : null,
        h('span', { className: 'when' }, fmtDate(item.mtime)));
    }

    function Card(props) {
      const kids = [];
      if (props.more) kids.push(props.more);
      return h('div', { className: 'fsv-card2' },
        h('div', { className: 'hd' },
          props.icon ? h('i', { className: 'fsv-hd-ic' }, props.icon) : null,
          h('h2', null, props.title),
          props.count === undefined || props.count === null ? null : h('span', { className: 'n' }, String(props.count)),
          ...kids),
        h('div', { className: 'body' }, ...(props.children ? [].concat(props.children) : [])));
    }

    function Panel() {
      const t = useT();
      useStyles();

      const [data, setData] = useState(() => readLocalCache());
      const [error, setError] = useState('');
      const [needAuth, setNeedAuth] = useState(false);
      const [busy, setBusy] = useState(false);
      const [showAllBases, setShowAllBases] = useState(false);
      const [showAllDocs, setShowAllDocs] = useState(false);
      const [showAllChats, setShowAllChats] = useState(false);
      const [query, setQuery] = useState('');
      const [showNew, setShowNew] = useState(false);
      const [newKind, setNewKind] = useState('doc');
      const [newTitle, setNewTitle] = useState('');
      const [newSpace, setNewSpace] = useState('');
      const [newBusy, setNewBusy] = useState(false);
      const [created, setCreated] = useState(null);
      const [noteText, setNoteText] = useState('');
      const [noteBusy, setNoteBusy] = useState(false);
      const [noteMsg, setNoteMsg] = useState('');
      const [noteTarget, setNoteTarget] = useState(null);
      const [upBusy, setUpBusy] = useState(false);
      const [upMsg, setUpMsg] = useState('');
      const fileRef = React.useRef(null);
      const searchRef = React.useRef(null);

      const load = useCallback(async (force) => {
        setBusy(true);
        setError('');
        setNeedAuth(false);
        try {
          /* 两段式:先出根目录 + 群组/日程/任务(约 1.5s),再补知识库节点(更慢) */
          const first = await hostCall('inventory', { fast: true });
          if (first && first.ok) setData(first);
          const full = await hostCall('inventory', { force: Boolean(force) });
          setData(full);
          writeLocalCache(full);
        } catch (e) {
          setNeedAuth(Boolean(e && e.needAuth));
          setError(String((e && e.message) || e));
        } finally {
          setBusy(false);
        }
      }, []);

      useEffect(() => { void load(false); }, [load]);

      useEffect(() => {
        let alive = true;
        void (async () => {
          try {
            const r = await hostCall('noteTarget', { peek: true });
            if (alive && r && r.note && r.note.url) setNoteTarget(r.note);
          } catch { /* 还没配置速记本属正常 */ }
        })();
        return () => { alive = false; };
      }, []);

      useEffect(() => {
        const onKey = (e) => {
          const tag = (e.target && e.target.tagName) || '';
          if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
            e.preventDefault();
            if (searchRef.current) searchRef.current.focus();
          }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
      }, []);

      const items = (data && Array.isArray(data.items)) ? data.items : [];
      const spaces = (data && Array.isArray(data.spaces)) ? data.spaces : [];
      const chats = (data && Array.isArray(data.chats)) ? data.chats : [];
      const intel = (data && Array.isArray(data.intel)) ? data.intel : [];
      const [showAllIntel, setShowAllIntel] = useState(false);
      const INTEL_PREVIEW = 8;
      const intelItems = (() => {
        const flat = intel.reduce((acc, day) => acc.concat((day.items || []).map((x) => (typeof x === 'string'
          ? { tag: '·', title: x, url: day.url } : x))), []);
        const bucket = {};
        flat.forEach((it) => { (bucket[it.tag] = bucket[it.tag] || []).push(it); });
        const order = ['AI', 'X', '政策', '抖音'];
        const keys = order.filter((k) => bucket[k]).concat(Object.keys(bucket).filter((k) => order.indexOf(k) < 0));
        const out = [];
        let more = true;
        for (let i = 0; more; i += 1) {
          more = false;
          keys.forEach((k) => { if (bucket[k][i]) { out.push(bucket[k][i]); more = true; } });
        }
        return out;
      })();
      const events = (data && Array.isArray(data.events)) ? data.events : [];
      const tasks = (data && Array.isArray(data.tasks)) ? data.tasks : [];
      const caps = (data && Array.isArray(data.caps)) ? data.caps : [];

      const groups = useMemo(() => {
        const bases = [];
        const docs = [];
        for (const item of items) {
          if (item.type === 'bitable') bases.push(item);
          else if (item.type === 'docx' || item.type === 'doc') docs.push(item);
        }
        const nameCount = new Map();
        for (const item of bases) nameCount.set(item.name, (nameCount.get(item.name) || 0) + 1);
        const byNewest = (a, b) => (b.mtime || 0) - (a.mtime || 0);
        bases.sort(byNewest);
        docs.sort(byNewest);
        return { bases, docs, nameCount };
      }, [items]);

      const recent = useMemo(() => {
        const edge = Date.now() - 7 * DAY;
        return items.filter((item) => item.mtime > edge).length;
      }, [items]);

      const latestMtime = useMemo(() => {
        let max = 0;
        for (const item of items) if (item.mtime > max) max = item.mtime;
        return max;
      }, [items]);

      const docCount = groups.docs.length;

      const q = query.trim().toLowerCase();
      const matchItem = (item) => !q
        || String(item.name || '').toLowerCase().includes(q)
        || String(item.path || '').toLowerCase().includes(q);
      const fBases = groups.bases.filter(matchItem);
      const fDocs = groups.docs.filter(matchItem);

      const bases = showAllBases ? fBases : fBases.slice(0, 6);
      const docs = showAllDocs ? fDocs : fDocs.slice(0, 6);

      const moreBtn = (shown, setter, total, limit) => (total > limit
        ? h('button', { className: 'fsv-more', onClick: () => setter((v) => !v) },
          shown ? t('collapse') : `${t('viewAll')} ›`)
        : null);

      const extChats = chats.filter((c) => c.sub === '外部' || c.external).length;

      // 近 7 天修改量
      const trend = useMemo(() => {
        const out = [];
        const midnight = new Date();
        midnight.setHours(0, 0, 0, 0);
        for (let i = 6; i >= 0; i -= 1) {
          const dayStart = midnight.getTime() - i * DAY;
          const n = items.filter((it) => it.mtime >= dayStart && it.mtime < dayStart + DAY).length;
          const d = new Date(dayStart);
          out.push({ key: dayStart, n, label: `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` });
        }
        return out;
      }, [items]);
      const trendMax = trend.reduce((m, x) => Math.max(m, x.n), 1);
      const trendSum = trend.reduce((a, x) => a + x.n, 0);

      // 类型分布
      const typeStats = useMemo(() => {
        const colors = { bitable: '#5686fe', docx: '#7b61ff', sheet: '#22c55e', folder: '#9aa2b1', mindnote: '#f59e0b', file: '#c9ced8', other: '#e2e5ea' };
        const counts = new Map();
        for (const it of items) {
          const key = it.type === 'doc' ? 'docx'
            : (it.type === 'shortcut' || it.type === 'image' || !colors[it.type]) ? 'other' : it.type;
          counts.set(key, (counts.get(key) || 0) + 1);
        }
        const order = ['bitable', 'docx', 'sheet', 'folder', 'mindnote', 'file', 'other'];
        const rows = order.filter((k) => counts.get(k)).map((k) => ({
          k, n: counts.get(k), color: colors[k], label: k === 'other' ? t('other') : t(k),
        }));
        const total = items.length || 1;
        let acc = 0;
        const stops = rows.map((r) => {
          const from = (acc / total) * 100;
          acc += r.n;
          const to = (acc / total) * 100;
          return `${r.color} ${from.toFixed(2)}% ${to.toFixed(2)}%`;
        });
        return { rows, total: items.length, background: stops.length ? `conic-gradient(${stops.join(',')})` : 'none' };
      }, [items, t]);

      const dupGroups = [...groups.nameCount.values()].filter((v) => v > 1).length;

      const kpi = (value, label, sub) => h('div', { className: 'fsv-kpi' },
        h('b', null, value),
        h('span', null, label),
        sub ? h('u', null, sub) : null);


      const baseRows = bases.map((item) => h(DocRow, {
        key: item.token || item.name,
        item,
        dupLevel: groups.nameCount.get(item.name) || 1,
        onOpen: (it) => openLink(it.url, t),
      }));

      const docRows = docs.map((item) => h(DocRow, {
        key: item.token || item.name,
        item,
        onOpen: (it) => openLink(it.url, t),
      }));

      const wikiRows = spaces.map((sp) => h('button', {
        key: sp.spaceId || sp.name,
        className: 'fsv-row',
        title: sp.url,
        onClick: () => openLink(sp.url, t),
      },
      h('i', { className: 'fsv-sq', style: { background: '#3f6ae0' } }, '◫'),
      h('span', { className: 'nm' }, sp.name),
      h('span', { className: 'loc' }, sp.visibility === 'private' ? t('wikiPrivate') : '')));

      const chatRows = (showAllChats ? chats : chats.slice(0, 6)).map((c) => h('button', {
        key: c.id || c.name,
        className: 'fsv-row',
        title: c.url,
        onClick: () => openLink(c.url, t),
      },
      h('i', { className: 'fsv-sq', style: { background: '#0ea5e9' } }, '◍'),
      h('span', { className: 'nm' }, c.name),
      h('span', { className: 'loc' }, c.sub || '')));

      const eventRows = events.slice(0, 4).map((ev) => h('button', {
        key: `${ev.name}-${ev.ts}`,
        className: 'fsv-row',
        title: ev.url || ev.name,
        onClick: () => openLink(ev.url, t),
      },
      h('span', { className: 'fsv-slot' }, fmtSlot(ev.ts, t)),
      h('span', { className: 'nm' }, ev.name)));

      const taskRows = tasks.slice(0, 4).map((tk) => h('button', {
        key: tk.url || tk.name,
        className: 'fsv-row',
        title: tk.url,
        onClick: () => openLink(tk.url, t),
      },
      h('i', { className: 'fsv-sq', style: { background: '#22c55e' } }, '✓'),
      h('span', { className: 'nm' }, tk.name),
      h('span', { className: 'loc' }, tk.ts ? fmtDate(tk.ts) : '')));

      const emptyLine = (text) => h('div', { className: 'fsv-hint', style: { padding: '10px 2px 12px' } }, text);

      const capsInline = caps.length
        ? h('div', { className: 'fsv-caps-ib', title: `${t('caps')}` },
          caps.map((c) => (c.ok
            ? h('span', { key: c.key, className: 'fsv-cap on' }, h('i', { className: 'fsv-dot' }), c.label)
            : h('button', {
              key: c.key,
              className: 'fsv-cap off',
              title: c.need ? `${c.need}` : t('capOff'),
              onClick: () => openLink(c.auth, t),
            }, h('i', { className: 'fsv-dot off' }), c.label))))
        : null;

      const teamSpaces = (spaces || []).filter((s) => /^\d+$/.test(String(s.spaceId || '')));

      const createNow = async () => {
        if (newBusy) return;
        setNewBusy(true);
        setCreated(null);
        try {
          const res = await hostCall(newKind === 'doc' ? 'createDoc' : 'createBitable', {
            title: newTitle.trim(),
            spaceId: newSpace,
          });
          if (res && res.url) setCreated({ url: res.url, title: res.title });
          setNewTitle('');
          void load(true);
        } catch (e) {
          setCreated({ error: String((e && e.message) || e) });
        } finally {
          setNewBusy(false);
        }
      };

      const submitNote = async () => {
        const text = noteText.trim();
        if (!text || noteBusy) return;
        setNoteBusy(true);
        setNoteMsg('');
        try {
          const res = await hostCall('note', { text });
          setNoteText('');
          if (res && res.url) setNoteTarget({ url: res.url, title: res.title });
          setNoteMsg(`ok:${(res && res.at) || ''}`);
        } catch (e) {
          setNoteMsg(`bad:${String((e && e.message) || e)}`);
        } finally {
          setNoteBusy(false);
        }
      };

      const fileToBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const s = String(reader.result || '');
          const i = s.indexOf(',');
          resolve(i >= 0 ? s.slice(i + 1) : '');
        };
        reader.onerror = () => reject(new Error('读取文件失败'));
        reader.readAsDataURL(file);
      });

      const uploadFiles = async (list) => {
        const files = Array.from(list || []);
        if (!files.length || upBusy) return;
        setUpBusy(true);
        let done = 0;
        try {
          for (let i = 0; i < files.length; i += 1) {
            const f = files[i];
            setUpMsg(`busy:${t('uploadWhich')} ${i + 1}/${files.length} · ${f.name}`);
            if (f.size > 20 * 1024 * 1024) {
              setUpMsg(`bad:${f.name} 超过 20MB`);
              continue;
            }
            const data = await fileToBase64(f);
            const res = await hostCall('noteFile', { name: f.name, data });
            if (res && res.noteUrl) setNoteTarget({ url: res.noteUrl });
            done += 1;
          }
          setUpMsg(`ok:${done}`);
        } catch (e) {
          setUpMsg(`bad:${String((e && e.message) || e)}`);
        } finally {
          setUpBusy(false);
          if (fileRef.current) fileRef.current.value = '';
        }
      };

      const newBar = showNew ? h('div', { className: 'fsv-newbar' },
        h('div', { className: 'fsv-seg' },
          h('button', { className: newKind === 'doc' ? 'on' : '', onClick: () => setNewKind('doc') }, t('newDoc')),
          h('button', { className: newKind === 'base' ? 'on' : '', onClick: () => setNewKind('base') }, t('newBitable'))),
        h('input', {
          className: 'fsv-newin',
          type: 'text',
          value: newTitle,
          placeholder: t('newTitlePh'),
          spellCheck: false,
          onChange: (e) => setNewTitle(e.target.value),
          onKeyDown: (e) => {
            if (e.key === 'Enter') void createNow();
            if (e.key === 'Escape') setShowNew(false);
          },
        }),
        h('select', {
          className: 'fsv-sel',
          value: newSpace,
          onChange: (e) => setNewSpace(e.target.value),
        },
        h('option', { value: '' }, t('newDefault')),
        teamSpaces.map((s) => h('option', { key: s.spaceId, value: String(s.spaceId) }, s.name))),
        h('button', { className: 'fsv-btn-primary', disabled: newBusy, onClick: () => void createNow() },
          newBusy ? t('creating') : t('create')),
        h('button', { className: 'fsv-btn-ghost', onClick: () => setShowNew(false) }, t('cancel')),
        created && created.url
          ? h('a', {
            className: 'fsv-mini-link',
            href: created.url,
            target: '_blank',
            rel: 'noopener noreferrer',
          }, `${t('createdOk')}：${created.title || ''} ${t('open')} ›`)
          : null,
        created && created.error
          ? h('span', { className: 'fsv-bad' }, `${t('createFail')}：${created.error}`)
          : null) : null;

      const noteLink = noteTarget && noteTarget.url
        ? h('a', {
          className: 'fsv-mini-link',
          href: noteTarget.url,
          target: '_blank',
          rel: 'noopener noreferrer',
        }, `${t('noteOpen')} ›`)
        : (noteTarget ? null : h('span', { className: 'fsv-hd-sub' }, t('noteTargetPh')));

      const noteCard = h(Card, { title: t('note'), icon: '✎', more: noteLink },
        h('textarea', {
          className: 'fsv-note-ta',
          value: noteText,
          placeholder: t('notePh'),
          onChange: (e) => setNoteText(e.target.value),
          onKeyDown: (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault();
              void submitNote();
            }
          },
        }),
        h('div', { className: 'fsv-note-bar' },
          h('div', { className: 'fsv-sp' }),
          noteMsg.indexOf('ok:') === 0
            ? h('span', { className: 'fsv-ok' }, `${t('noteSaved')}${noteMsg.slice(3) ? ` · ${noteMsg.slice(3)}` : ''}`)
            : null,
          noteMsg.indexOf('bad:') === 0
            ? h('span', { className: 'fsv-bad' }, `${t('noteFail')}：${noteMsg.slice(4)}`)
            : null,
          upMsg.indexOf('ok:') === 0
            ? h('span', { className: 'fsv-ok' }, `${t('uploaded')} ${upMsg.slice(3)}`)
            : null,
          upMsg.indexOf('bad:') === 0
            ? h('span', { className: 'fsv-bad' }, `${t('uploadFail')}：${upMsg.slice(4)}`)
            : null,
          upMsg.indexOf('busy:') === 0
            ? h('span', { className: 'fsv-hint', style: { margin: 0 } }, upMsg.slice(5))
            : null,
          h('input', {
            ref: fileRef,
            type: 'file',
            multiple: true,
            style: { display: 'none' },
            onChange: (e) => void uploadFiles(e.target.files),
          }),
          h('button', {
            className: 'fsv-btn-ghost',
            disabled: upBusy,
            title: t('uploadHint'),
            onClick: () => fileRef.current && fileRef.current.click(),
          }, upBusy ? t('uploading') : `⇪ ${t('upload')}`),
          h('button', {
            className: 'fsv-btn-primary',
            disabled: noteBusy || !noteText.trim(),
            onClick: () => void submitNote(),
          }, noteBusy ? t('noteSaving') : t('noteSave'))));

      return h('div', { className: 'fsv-wrap' },

        // 顶部工具条
        h('div', { className: 'fsv-hd' },
          h('div', { className: 'fsv-h1' }, t('title')),
          h('span', { className: 'fsv-badge' },
            h('i', { className: `fsv-dot${data ? '' : ' off'}` }),
            data ? `${t('ready')}${data.tenant ? ` · ${data.tenant}` : ''}` : t('notReady')),
          capsInline,
          h('div', { className: 'fsv-sp' }),
          h('div', { className: 'fsv-search', style: { width: '248px', height: '30px' } },
            h('svg', { width: 13, height: 13, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, 'aria-hidden': 'true' },
              h('circle', { cx: 7, cy: 7, r: 4.4 }),
              h('path', { d: 'M10.4 10.4 14 14', strokeLinecap: 'round' })),
            h('input', {
              className: 'fsv-search-in',
              type: 'text',
              ref: searchRef,
              value: query,
              placeholder: t('search'),
              spellCheck: false,
              'aria-label': t('search'),
              onChange: (e) => setQuery(e.target.value),
              onKeyDown: (e) => { if (e.key === 'Escape') setQuery(''); },
            }),
            query
              ? h('button', { className: 'fsv-clear', title: t('clear'), onClick: () => setQuery('') }, '×')
              : h('span', { className: 'fsv-search-k' }, '/')),
          h('button', {
            className: 'fsv-ib',
            onClick: () => setShowNew(!showNew),
          }, t('newBtn')),
          h('button', {
            className: 'fsv-ib',
            disabled: busy,
            onClick: () => void load(true),
          }, busy ? '…' : t('reload'))),

        // 新建条:文档 / 多维表格
        newBar,

        // 置顶:速记(全宽、紧凑)
        noteCard,

        // 顶部仪表盘:6 个 KPI + 近 7 天 + 类型分布
        h('div', { className: 'fsv-top' },
          h('div', { className: 'fsv-kpis6' },
            kpi(data ? String(items.length) : '—', t('totalItems')),
            kpi(data ? String(groups.bases.length) : '—', t('statTable'), dupGroups ? `${dupGroups} ${t('dupNote')}` : null),
            kpi(data ? String(docCount) : '—', t('statDoc')),
            kpi(data ? String(chats.length) : '—', t('chats'), extChats ? `${extChats} ${t('extNote')}` : null),
            kpi(data ? String(spaces.length) : '—', t('wiki')),
            kpi(data ? String(trendSum) : '—', t('last7'), data && latestMtime ? `${t('statLatest')} ${fmtDate(latestMtime)}` : null)),

          h(Card, {
            title: t('last7'),
            icon: '▤',
            more: h('span', { className: 'meta' }, t('scaleNote')),
          },
          h('div', { className: 'fsv-bars' },
            trend.map((d) => h('div', { className: 'fsv-barcol', key: d.key },
              h('span', { className: 'fsv-barval' }, d.n ? String(d.n) : ''),
              h('div', {
                className: `fsv-bar${d.n ? '' : ' zero'}`,
                style: { height: `${Math.max(3, Math.round((d.n / trendMax) * 74))}px` },
                title: `${d.label} · ${d.n}`,
              }),
              h('span', { className: 'fsv-barlabel' }, d.label))))),

          h(Card, { title: t('typeDist'), icon: '◔' },
            typeStats.rows.length
              ? h('div', { className: 'fsv-donutwrap' },
                h('div', { className: 'fsv-donut', style: { background: typeStats.background } },
                  h('b', null, String(typeStats.total))),
                h('div', { className: 'fsv-legend' },
                  typeStats.rows.map((r) => h('div', { key: r.k },
                    h('i', { style: { background: r.color } }),
                    h('span', null, r.label),
                    h('em', null, String(r.n))))))
              : h('div', { className: 'fsv-hint', style: { padding: '10px 2px' } }, t('noData')))),

        // 命中提示 / 错误
        q
          ? h('div', { className: 'fsv-hint' }, `${t('match')} `,
            h('b', null, `${fBases.length + fDocs.length}`), ` / ${groups.bases.length + groups.docs.length}`)
          : null,
        error
          ? h('div', { style: S.err }, `${t('error')}：${error}${needAuth ? ` ${t('needAuth')}` : ''}`)
          : null,

        // 主区:左(多维表格/文档) 右(知识库/群组/日程任务)
        h('div', { className: 'fsv-main' },
          h('div', { className: 'fsv-col' },
            h(Card, {
              title: t('bitable'),
              icon: '▦',
              count: fBases.length,
              more: moreBtn(showAllBases, setShowAllBases, fBases.length, 6),
            }, fBases.length ? baseRows : emptyLine(t('empty'))),
            h(Card, {
              title: t('doc'),
              icon: '≡',
              count: fDocs.length,
              more: moreBtn(showAllDocs, setShowAllDocs, fDocs.length, 6),
            }, fDocs.length ? docRows : emptyLine(t('empty')))),
          h('div', { className: 'fsv-col' },
            h(Card, { title: t('intel'), icon: '▤', count: intelItems.length,
              more: intelItems.length > INTEL_PREVIEW
                ? h('span', { className: 'fsv-more', onClick: () => setShowAllIntel(!showAllIntel) },
                  `${showAllIntel ? t('collapse') : t('viewAll')} ›`)
                : null },
              intelItems.length
                ? (showAllIntel ? intelItems : intelItems.slice(0, INTEL_PREVIEW)).map((it, i) => h('div', {
                  key: `${it.tag}-${i}`,
                  className: 'fsv-intel-row',
                  onClick: () => it.url && window.open(it.url, '_blank', 'noopener,noreferrer'),
                  title: it.title,
                },
                h('span', { className: `fsv-tag fsv-tag-${it.tag}` }, it.tag),
                h('span', { className: 'fsv-intel-tt' }, it.title)))
                : emptyLine(t('intelEmpty'))),
            h(Card, { title: t('wiki'), icon: '◫', count: spaces.length },
              wikiRows.length ? wikiRows : emptyLine(t('empty'))),
            h(Card, { title: t('chats'), icon: '◍', count: chats.length, more: moreBtn(showAllChats, setShowAllChats, chats.length, 6) },
              chatRows.length ? chatRows : emptyLine(t('empty'))),
            h(Card, { title: `${t('agenda')} · ${t('tasks')}`, icon: '◔', count: events.length + tasks.length },
              events.length ? eventRows : emptyLine(t('noAgenda')),
              tasks.length ? taskRows : emptyLine(t('noTask'))))),

        // 底部:可以这样说
        h(Card, { title: t('examples'), icon: '✦' },
          h('div', { className: 'fsv-chips', style: { paddingBottom: '6px' } },
            h('span', { className: 'fsv-chip' }, t('ex1')),
            h('span', { className: 'fsv-chip' }, t('ex2')),
            h('span', { className: 'fsv-chip' }, t('ex3')))),

        // 空态
        (data && !items.length && !error)
          ? h('div', { className: 'fsv-hint' }, t('empty'))
          : null,
        (data && items.length && q && !fBases.length && !fDocs.length)
          ? h('div', { className: 'fsv-hint' }, `${t('noMatch')}「${query.trim()}」`)
          : null,
      );
    }

    /* ---------------- 设置页 ---------------- */
    function SettingsPanel() {
      const t = useT();
      const [showTab, setShowTab] = useState(false);
      const [msg, setMsg] = useState('');
      const [loaded, setLoaded] = useState(false);

      useEffect(() => {
        let alive = true;
        setShowTab(readTabFlag());
        setLoaded(true);
        void (async () => {
          try {
            const s = await loadStatus();
            if (!alive || !s || !s.settings) return;
            if (!hasTabFlag()) {
              const serverValue = Boolean(s.settings.showTab);
              writeTabFlag(serverValue);
              setShowTab(serverValue);
            }
          } catch {
            /* 主机接口不可达时保持本地值 */
          }
        })();
        return () => { alive = false; };
      }, []);

      const save = useCallback(async (next) => {
        setShowTab(next);
        writeTabFlag(next);
        setMsg('');
        try {
          await saveTabPref(next);
          setMsg(t('settingsSaved'));
        } catch (e) {
          setMsg(`${t('settingsSavedLocal')}（主机备份未写入：${String((e && e.message) || e)}）`);
        }
      }, [t]);

      return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '10px', padding: '4px 0', maxWidth: '560px' } },
        h('div', { style: { fontSize: '15px', fontWeight: 600 } }, t('settingsTitle')),
        h('label', { style: { display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', opacity: loaded ? 1 : 0.6 } },
          h('input', {
            type: 'checkbox',
            checked: showTab,
            disabled: !loaded,
            onChange: (e) => void save(e.target.checked),
          }),
          h('span', null, t('settingsShowTab')),
        ),
        h('div', { style: { fontSize: '12px', opacity: 0.65, lineHeight: 1.6 } }, t('settingsHint')),
        h('div', { style: { display: 'flex', alignItems: 'center', gap: '10px' } },
          h('button', { style: S.btn, onClick: () => location.reload() }, t('settingsReload')),
          msg ? h('span', { style: { fontSize: '12px', opacity: 0.7 } }, msg) : null,
        ),
      );
    }

    /* 渲染异常兜底：宁可显示一行红字，也不要白屏让用户以为"卡死" */
    function guard(Comp) {
      if (!React.Component) return Comp;
      class Boundary extends React.Component {
        constructor(props) {
          super(props);
          this.state = { err: null };
        }

        static getDerivedStateFromError(err) {
          return { err };
        }

        componentDidCatch(err) {
          console.warn('[feishu-view] render error:', err);
        }

        render() {
          if (!this.state.err) return this.props.children;
          return h('div', {
            style: {
              padding: '18px 20px', margin: '12px', borderRadius: '10px',
              background: 'rgba(220,38,38,.06)', color: '#b91c1c',
              fontSize: '12.5px', lineHeight: 1.7, whiteSpace: 'pre-wrap',
            },
          }, `飞书面板渲染出错：${String((this.state.err && this.state.err.message) || this.state.err)}\n请点右上角刷新，或把这段文字发给我。`);
        }
      }
      return function Guarded(props) {
        return h(Boundary, null, h(Comp, props));
      };
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        attachRpc(ctx);
        ctx.effect(() => ctx.locale.register(NS, { zh: ZH, en: EN }), 'feishu-view: dictionaries');
        const bind = ctx.locale.bind ? ctx.locale.bind(NS) : null;
        if (bind) currentT = (k) => bind(k);

        try {
          ctx.slots.inject('settings.section', () => ctx.slots.register({
            name: 'settings.section',
            id: 'feishu-view',
            order: 350,
            label: () => (currentT('tab') || '飞书') + ' · 顶栏入口',
          }, SettingsPanel));
        } catch (error) {
          console.warn('[feishu-view] settings panel registration failed:', error);
        }

        // 顶栏标签默认不注册;开关打开后才向 slot 注册。
        // 注意:插件被反复重挂时 apply 会重复执行,重复注册会让标签点上没反应,这里去重。
        let viewRegistered = false;
        const registerView = () => {
          if (viewRegistered) return;
          viewRegistered = true;
          try {
            ctx.slots.inject('conversation.view', () => ctx.slots.register({
              name: 'conversation.view',
              id: 'feishu-view',
              order: 50,
              locale: NS,
              label: () => {
                try { return currentT('tab') || '飞书'; } catch { return '飞书'; }
              },
            }, guard(Panel)));
          } catch (error) {
            viewRegistered = false;
            console.warn('[feishu-view] tab registration failed:', error);
          }
        };

        if (readTabFlag()) registerView();

        void (async () => {
          for (let i = 0; i < 5; i += 1) {
            try {
              const s = await loadStatus();
              if (s && s.settings) {
                if (!hasTabFlag()) {
                  writeTabFlag(Boolean(s.settings.showTab));
                  if (s.settings.showTab) registerView();
                }
              }
              return;
            } catch {
              await new Promise((r) => setTimeout(r, 600));
            }
          }
        })();
      },
    };
  },
});
