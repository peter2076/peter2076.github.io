(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function showView(id) {
    $$('.view').forEach((v) => v.classList.toggle('active', v.id === id));
    $$('.nav-links [data-view]').forEach((a) => {
      a.classList.toggle('active', a.getAttribute('data-view') === id);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    history.replaceState(null, '', id === 'view-home' ? '#' : `#${id.replace('view-', '')}`);
  }

  function bindNav() {
    $$('[data-view]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const id = el.getAttribute('data-view');
        if (id) showView(id);
      });
    });
  }

  function renderProtagonist(c) {
    const p = c.protagonist;
    const el = $('#protagonist-root');
    if (!el) return;
    el.innerHTML = `
      <div class="grid-2">
        <div class="block">
          <div class="portrait" data-initials="EH" aria-hidden="true"></div>
          <div class="meta-row">
            <span class="chip">${p.age} 岁</span>
            <span class="chip">${p.role.split(' / ')[0]}</span>
            <span class="chip">坐骑 · ${p.horse.name}</span>
          </div>
          <h3>${p.name} <span style="font-weight:400;opacity:.65;font-size:.85em">/ ${p.nameEn}</span></h3>
          <p><strong>出身：</strong>${p.origin}</p>
          <p>${p.appearance}</p>
          <h4>坐骑「${p.horse.name}」</h4>
          <p>${p.horse.trait}</p>
        </div>
        <div class="block">
          <h3>性格与内心</h3>
          <ul>${p.personality.map((x) => `<li>${x}</li>`).join('')}</ul>
          <h4>身世</h4>
          <p>${p.backstory}</p>
          <h4>核心困惑</h4>
          <p>${p.innerConflict}</p>
          <h4>擅长</h4>
          <div class="meta-row">${p.skills.map((s) => `<span class="chip">${s}</span>`).join('')}</div>
        </div>
      </div>
    `;
  }

  function renderCommunity(c) {
    const g = c.community;
    const el = $('#community-root');
    if (!el) return;
    el.innerHTML = `
      <div class="block" style="margin-bottom:1.2rem">
        <div class="meta-row">
          <span class="chip">互助流民团体</span>
          <span class="chip">${g.motto}</span>
        </div>
        <h3>${g.name} <span style="font-weight:400;opacity:.65;font-size:.85em">/ ${g.nameEn}</span></h3>
        <p>${g.nature}</p>
        <div class="meta-row">${g.values.map((v) => `<span class="chip">${v}</span>`).join('')}</div>
      </div>
      <div class="grid-2">
        ${g.members
          .map(
            (m) => `
          <div class="block member">
            <strong>${m.name}</strong>
            <span>${m.role}</span>
            <p>${m.note}</p>
          </div>`
          )
          .join('')}
      </div>
    `;
  }

  function renderChapters(c) {
    const el = $('#chapters-root');
    if (!el) return;
    el.innerHTML = `
      ${c.chapters
        .map(
          (ch) => `
        <div class="chapter block">
          <div class="ch-num">章节 · 0${ch.id}</div>
          <h3>${ch.title}</h3>
          <p>${ch.summary}</p>
          <div class="meta-row">${ch.beats.map((b) => `<span class="chip">${b}</span>`).join('')}</div>
        </div>`
        )
        .join('')}
      <div class="grid-2 ending-grid" style="margin-top:1rem">
        ${c.endings
          .map(
            (e) => `
          <div class="block">
            <h3>${e.title}</h3>
            <p>${e.text}</p>
          </div>`
          )
          .join('')}
      </div>
    `;
  }

  function renderSideQuests(c) {
    const el = $('#sidequests-root');
    if (!el) return;
    el.innerHTML = `
      <div class="grid-2">
        ${c.sideQuests
          .map(
            (cat) => `
          <div class="block">
            <h3>${cat.category}</h3>
            <ul class="quest-list">
              ${cat.cases
                .map((q) => `<li><strong>${q.title}</strong> — ${q.desc}</li>`)
                .join('')}
            </ul>
          </div>`
          )
          .join('')}
      </div>
    `;
  }

  function renderCompare(c) {
    const el = $('#compare-root');
    if (!el) return;
    el.innerHTML = `
      <table class="compare">
        <thead>
          <tr>
            <th>系统维度</th>
            <th>对标参考（生活向氛围）</th>
            <th>《尘途灯火》原创方案</th>
          </tr>
        </thead>
        <tbody>
          ${c.systemsCompare
            .map(
              (row) => `
            <tr>
              <td>${row.aspect}</td>
              <td>${row.rdr2}</td>
              <td class="${row.status === 'gone' ? 'gone' : 'keep'}">${row.ours}</td>
            </tr>`
            )
            .join('')}
        </tbody>
      </table>
      <div class="grid-3 systems-grid" style="margin-top:1.4rem">
        ${c.tools
          .map(
            (t) => `
          <div class="block">
            <strong>${t.name}</strong>
            <p style="margin:0">${t.use}</p>
          </div>`
          )
          .join('')}
      </div>
    `;
  }

  function renderCompliance(c) {
    const el = $('#compliance-root');
    if (!el) return;
    el.innerHTML = `<ul>${c.compliance.map((x) => `<li>${x}</li>`).join('')}</ul>`;
  }

  function bootFromHash() {
    const hash = (location.hash || '').replace('#', '');
    const map = {
      '': 'view-home',
      home: 'view-home',
      hero: 'view-hero',
      circle: 'view-circle',
      story: 'view-story',
      quests: 'view-quests',
      systems: 'view-systems',
    };
    showView(map[hash] || 'view-home');
  }

  document.addEventListener('DOMContentLoaded', () => {
    const c = window.CODEX;
    if (!c) return;
    $('#game-title') && ($('#game-title').textContent = c.game.name);
    $('#game-tagline') && ($('#game-tagline').textContent = c.game.tagline);
    $('#game-pitch') && ($('#game-pitch').textContent = c.game.pitch);
    bindNav();
    renderProtagonist(c);
    renderCommunity(c);
    renderChapters(c);
    renderSideQuests(c);
    renderCompare(c);
    renderCompliance(c);
    bootFromHash();
    window.addEventListener('hashchange', bootFromHash);
  });
})();
