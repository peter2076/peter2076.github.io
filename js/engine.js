/* 《远风归途》Demo 游戏引擎 */

import { BIOMES, QUESTS, NPCS, DIALOGUES } from './data.js';

const TILE = 32;
const MAP_W = 60;
const MAP_H = 45;

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.keys = {};
    this.running = false;
    this.paused = false;
    this.dialogue = null;
    this.dialogueIdx = 0;
    this.message = null;
    this.messageTimer = 0;
    this.time = 8; // hours 0-24
    this.timeSpeed = 0.008;

    this.player = {
      x: 28 * TILE, y: 30 * TILE,
      w: 20, h: 20,
      speed: 2.2,
      mounted: false,
      dir: 'down',
    };

    this.camera = { x: 0, y: 0 };

    this.stats = {
      stamina: 100,
      hunger: 80,
      warmth: 70,
      fatigue: 20,
      gold: 12,
      rep: 0,
    };

    this.quests = {
      active: [],
      completed: [],
      items: { wood: 0 },
    };

    this.entities = [];
    this.particles = [];
    this.map = this.generateMap();

    this.setupInput();
    this.spawnEntities();
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  generateMap() {
    const map = [];
    for (let y = 0; y < MAP_H; y++) {
      const row = [];
      for (let x = 0; x < MAP_W; x++) {
        const nx = x / MAP_W, ny = y / MAP_H;
        let biome = 'plain';
        if (ny < 0.22) biome = 'snow';
        else if (nx < 0.18 && ny > 0.55) biome = 'desert';
        else if (nx > 0.7 && ny > 0.5) biome = 'swamp';
        else if (nx > 0.75 && ny < 0.4) biome = 'mine';
        else if (nx > 0.55 && ny > 0.35 && ny < 0.55) biome = 'town';
        else if (nx < 0.35 && ny > 0.25 && ny < 0.5) biome = 'forest';
        const noise = Math.sin(x * 0.3) * Math.cos(y * 0.25);
        row.push({ biome, variant: Math.floor(noise * 3) % 3 });
      }
      map.push(row);
    }
    // Camp area (plain center-left)
    for (let y = 28; y < 34; y++)
      for (let x = 24; x < 32; x++)
        map[y][x] = { biome: 'plain', variant: 1, camp: true };
    // River
    for (let x = 0; x < MAP_W; x++) {
      const ry = Math.floor(18 + Math.sin(x * 0.08) * 3);
      for (let dy = -1; dy <= 1; dy++) {
        const yy = ry + dy;
        if (yy >= 0 && yy < MAP_H) map[yy][x] = { biome: 'water', variant: 0 };
      }
    }
    // Fallen oak (quest item location)
    map[12][28] = { biome: 'forest', variant: 2, interact: 'oak_tree' };
    // Wagon
    map[30][27] = { ...map[30][27], interact: 'wagon', wagonBroken: true };
    return map;
  }

  spawnEntities() {
    const camp = [
      { id: 'elin',   x: 26 * TILE, y: 29 * TILE, type: 'npc', dialogue: 'elin_greet' },
      { id: 'thomas', x: 28 * TILE, y: 31 * TILE, type: 'npc', dialogue: 'thomas_greet' },
      { id: 'mary',   x: 30 * TILE, y: 29 * TILE, type: 'npc', dialogue: 'mary_greet' },
      { id: 'jimmy',  x: 25 * TILE, y: 31 * TILE, type: 'npc', dialogue: 'jimmy_greet' },
      { id: 'sara',   x: 29 * TILE, y: 28 * TILE, type: 'npc', dialogue: 'sara_greet' },
      { id: 'sam',    x: 31 * TILE, y: 32 * TILE, type: 'npc', dialogue: 'sam_greet' },
      { id: 'campfire', x: 27.5 * TILE, y: 30 * TILE, type: 'campfire' },
      { id: 'horse',  x: 14 * TILE, y: 10 * TILE, type: 'horse', found: false },
      { id: 'herb1',  x: 20 * TILE, y: 22 * TILE, type: 'herb' },
      { id: 'herb2',  x: 35 * TILE, y: 38 * TILE, type: 'herb' },
      { id: 'traveler', x: 8 * TILE, y: 32 * TILE, type: 'npc', dialogue: 'traveler_lost', oneShot: true },
    ];
    this.entities = camp.map(e => ({ ...e, emoji: NPCS[e.id]?.emoji || this.entityEmoji(e) }));
  }

  entityEmoji(e) {
    if (e.type === 'campfire') return '🔥';
    if (e.type === 'horse') return '🐴';
    if (e.type === 'herb') return '🌿';
    return '❓';
  }

  setupInput() {
    window.addEventListener('keydown', e => {
      this.keys[e.code] = true;
      if (e.code === 'KeyE') this.interact();
      if (e.code === 'Space') { e.preventDefault(); this.rest(); }
      if (e.code === 'KeyM') this.toggleMount();
      if (e.code === 'Escape') {
        if (this.dialogue) { this.dialogue = null; return; }
        this.paused = !this.paused;
      }
    });
    window.addEventListener('keyup', e => { this.keys[e.code] = false; });
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.viewW = this.canvas.width;
    this.viewH = this.canvas.height;
  }

  start() {
    this.running = true;
    this.showMessage('欢迎来到《远风归途》试玩 Demo — 第一章：旷野初遇');
    this.loop();
  }

  loop() {
    if (!this.running) return;
    if (!this.paused && !this.dialogue) this.update();
    this.render();
    requestAnimationFrame(() => this.loop());
  }

  update() {
    this.time += this.timeSpeed;
    if (this.time >= 24) this.time = 0;

    const speed = this.player.mounted ? this.player.speed * 1.8 : this.player.speed;
    let dx = 0, dy = 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) { dy = -speed; this.player.dir = 'up'; }
    if (this.keys['KeyS'] || this.keys['ArrowDown']) { dy = speed; this.player.dir = 'down'; }
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) { dx = -speed; this.player.dir = 'left'; }
    if (this.keys['KeyD'] || this.keys['ArrowRight']) { dx = speed; this.player.dir = 'right'; }

    if (dx && dy) { dx *= 0.707; dy *= 0.707; }

    const nx = this.player.x + dx;
    const ny = this.player.y + dy;
    if (!this.isBlocked(nx, this.player.y)) this.player.x = nx;
    if (!this.isBlocked(this.player.x, ny)) this.player.y = ny;

    if (dx || dy) {
      this.stats.stamina = Math.max(0, this.stats.stamina - 0.04);
      this.stats.hunger = Math.max(0, this.stats.hunger - 0.01);
      this.stats.fatigue = Math.min(100, this.stats.fatigue + 0.02);
    }

    const hour = this.time;
    if (hour < 6 || hour > 20) this.stats.warmth = Math.max(0, this.stats.warmth - 0.03);
    else this.stats.warmth = Math.min(100, this.stats.warmth + 0.01);

    this.camera.x = this.player.x - this.viewW / 2;
    this.camera.y = this.player.y - this.viewH / 2;
    this.camera.x = Math.max(0, Math.min(MAP_W * TILE - this.viewW, this.camera.x));
    this.camera.y = Math.max(0, Math.min(MAP_H * TILE - this.viewH, this.camera.y));

    if (this.messageTimer > 0) this.messageTimer--;

    this.particles = this.particles.filter(p => {
      p.life -= 0.02;
      p.y -= 0.5;
      return p.life > 0;
    });
  }

  isBlocked(x, y) {
    const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
    if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return true;
    return this.map[ty][tx].biome === 'water';
  }

  getNearbyEntity() {
    return this.entities.find(e => {
      if (e.collected || e.found) return false;
      const dist = Math.hypot(e.x - this.player.x, e.y - this.player.y);
      return dist < 40;
    });
  }

  getNearbyTile() {
    const tx = Math.floor(this.player.x / TILE);
    const ty = Math.floor(this.player.y / TILE);
    const tile = this.map[ty]?.[tx];
    return tile?.interact ? tile : null;
  }

  interact() {
    if (this.dialogue) {
      this.advanceDialogue();
      return;
    }

    const entity = this.getNearbyEntity();
    if (entity) {
      if (entity.type === 'herb') {
        entity.collected = true;
        this.quests.items.herbs = (this.quests.items.herbs || 0) + 1;
        this.showMessage('采集到草药 +1');
        this.spawnParticles(entity.x, entity.y, '🌿');
        return;
      }
      if (entity.type === 'horse') {
        entity.found = true;
        this.player.mounted = true;
        this.startDialogue('horse_found');
        return;
      }
      if (entity.type === 'campfire') {
        this.rest();
        return;
      }
      if (entity.dialogue) {
        this.startDialogue(entity.dialogue);
        if (entity.oneShot) entity.collected = true;
        return;
      }
    }

    const tile = this.getNearbyTile();
    if (tile?.interact === 'oak_tree') {
      if (!this.quests.items.wood) {
        this.quests.items.wood = 1;
        this.showMessage('找到了合适的橡木轴！带回马车处修理。');
        this.spawnParticles(this.player.x, this.player.y, '🪵');
      } else {
        this.showMessage('已经采集过木材了。');
      }
      return;
    }
    if (tile?.interact === 'wagon' && tile.wagonBroken && this.quests.items.wood) {
      tile.wagonBroken = false;
      this.completeQuest('ch1_wagon');
      this.startDialogue('thomas_repair');
      return;
    }
  }

  rest() {
    const entity = this.getNearbyEntity();
    const nearFire = entity?.type === 'campfire' || this.entities.some(e =>
      e.type === 'campfire' && Math.hypot(e.x - this.player.x, e.y - this.player.y) < 60
    );
    if (nearFire) {
      this.stats.stamina = Math.min(100, this.stats.stamina + 30);
      this.stats.fatigue = Math.max(0, this.stats.fatigue - 25);
      this.stats.warmth = Math.min(100, this.stats.warmth + 20);
      this.stats.hunger = Math.max(0, this.stats.hunger - 5);
      this.showMessage('在篝火旁休息，恢复了体力与温暖。');
      this.spawnParticles(this.player.x, this.player.y - 10, '✨');
    } else {
      this.showMessage('需要在篝火旁才能休息。');
    }
  }

  toggleMount() {
    const horse = this.entities.find(e => e.type === 'horse');
    if (horse?.found) {
      this.player.mounted = !this.player.mounted;
      this.showMessage(this.player.mounted ? '骑上了驮马' : '下马步行');
    } else {
      this.showMessage('还没有找到走失的马匹。');
    }
  }

  startDialogue(id) {
    this.dialogue = { id, lines: DIALOGUES[id], idx: 0 };
    this.dialogueIdx = 0;
  }

  advanceDialogue() {
    const d = this.dialogue;
    if (!d) return;
    const line = d.lines[d.idx];
    if (line?.action) this.runAction(line.action);
    if (line?.choices) return; // wait for choice click

    d.idx++;
    if (d.idx >= d.lines.length) this.dialogue = null;
  }

  chooseDialogue(next, action) {
    if (action) this.runAction(action);
    if (DIALOGUES[next]) {
      this.dialogue = { id: next, lines: DIALOGUES[next], idx: 0 };
    } else {
      this.dialogue = null;
    }
  }

  runAction(action) {
    if (action === 'start_quest_ch1_wagon') this.startQuest('ch1_wagon');
    if (action === 'complete_quest_ch1_wagon') this.completeQuest('ch1_wagon');
    if (action === 'complete_quest_ch1_horse') this.completeQuest('ch1_horse');
    if (action === 'give_tea') {
      this.stats.stamina = Math.min(100, this.stats.stamina + 15);
      this.showMessage('喝了萨拉的药草茶，体力恢复。');
    }
    if (action === 'help_traveler') { this.stats.rep += 8; this.showMessage('品格声望 +8'); }
    if (action === 'rep_up') { this.stats.rep += 5; }
    if (action === 'rep_small') { this.stats.rep += 2; }
  }

  startQuest(id) {
    if (!this.quests.active.includes(id) && !this.quests.completed.includes(id)) {
      this.quests.active.push(id);
      this.showMessage(`新任务：${QUESTS[id].title}`);
      this.onQuestChange?.();
    }
  }

  completeQuest(id) {
    this.quests.active = this.quests.active.filter(q => q !== id);
    if (!this.quests.completed.includes(id)) this.quests.completed.push(id);
    const q = QUESTS[id];
    if (q?.reward) {
      this.stats.rep += q.reward.rep || 0;
      this.stats.gold += q.reward.gold || 0;
    }
    this.showMessage(`任务完成：${q?.title || id}`);
    this.onQuestChange?.();
  }

  showMessage(text) {
    this.message = text;
    this.messageTimer = 180;
  }

  spawnParticles(x, y, emoji) {
    for (let i = 0; i < 5; i++) {
      this.particles.push({ x, y, emoji, life: 1, ox: (Math.random() - 0.5) * 20 });
    }
  }

  getBiomeAt(x, y) {
    const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
    return this.map[ty]?.[tx]?.biome || 'plain';
  }

  render() {
    const ctx = this.ctx;
    const cx = this.camera.x, cy = this.camera.y;

    // Sky gradient based on time
    const t = this.time;
    let skyTop, skyBot;
    if (t >= 6 && t < 18) {
      const day = Math.sin((t - 6) / 12 * Math.PI);
      skyTop = `rgb(${100 + day * 80},${140 + day * 60},${200 + day * 30})`;
      skyBot = `rgb(${180 + day * 40},${160 + day * 50},${120 + day * 40})`;
    } else {
      skyTop = '#0a1020';
      skyBot = '#1a1830';
    }
    const grad = ctx.createLinearGradient(0, 0, 0, this.viewH);
    grad.addColorStop(0, skyTop);
    grad.addColorStop(1, skyBot);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.viewW, this.viewH);

    // Tiles
    const startX = Math.floor(cx / TILE), startY = Math.floor(cy / TILE);
    const endX = startX + Math.ceil(this.viewW / TILE) + 1;
    const endY = startY + Math.ceil(this.viewH / TILE) + 1;

    for (let y = startY; y < endY && y < MAP_H; y++) {
      for (let x = startX; x < endX && x < MAP_W; x++) {
        const tile = this.map[y][x];
        const b = BIOMES[tile.biome] || BIOMES.plain;
        const px = x * TILE - cx, py = y * TILE - cy;

        if (tile.biome === 'water') {
          const wave = Math.sin(Date.now() * 0.002 + x) * 0.1;
          ctx.fillStyle = `rgba(40, 90, 140, ${0.7 + wave})`;
        } else {
          const shade = tile.variant * 8;
          ctx.fillStyle = this.adjustColor(b.color, -shade);
        }
        ctx.fillRect(px, py, TILE + 1, TILE + 1);

        if (tile.camp) {
          ctx.fillStyle = 'rgba(160, 120, 60, 0.15)';
          ctx.fillRect(px, py, TILE, TILE);
        }
        if (tile.interact === 'oak_tree') {
          ctx.font = '20px serif';
          ctx.fillText('🌳', px + 4, py + 24);
        }
        if (tile.interact === 'wagon') {
          ctx.font = '22px serif';
          ctx.fillText(tile.wagonBroken ? '🛞' : '🚃', px + 2, py + 26);
        }
      }
    }

    // Entities
    this.entities.forEach(e => {
      if (e.collected) return;
      if (e.type === 'horse' && e.found) return;
      const px = e.x - cx, py = e.y - cy;
      ctx.font = '22px serif';
      ctx.fillText(e.emoji, px - 10, py + 8);
      if (Math.hypot(e.x - this.player.x, e.y - this.player.y) < 40) {
        ctx.fillStyle = 'rgba(212,168,83,0.6)';
        ctx.beginPath();
        ctx.arc(px, py - 18, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('E', px, py - 14);
        ctx.textAlign = 'left';
      }
    });

    // Player
    const px = this.player.x - cx, py = this.player.y - cy;
    if (this.player.mounted) {
      ctx.font = '26px serif';
      ctx.fillText('🏇', px - 14, py + 10);
    } else {
      ctx.font = '22px serif';
      ctx.fillText('🧭', px - 10, py + 8);
    }

    // Particles
    this.particles.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.font = '14px serif';
      ctx.fillText(p.emoji, p.x - cx + p.ox, p.y - cy);
      ctx.globalAlpha = 1;
    });

    // Night overlay
    if (t < 6 || t > 19) {
      const darkness = t < 6 ? (6 - t) / 6 : (t - 19) / 5;
      ctx.fillStyle = `rgba(5, 10, 30, ${darkness * 0.55})`;
      ctx.fillRect(0, 0, this.viewW, this.viewH);
    }

    this.renderHUD();
    if (this.dialogue) this.renderDialogue();
  }

  renderHUD() {
    const ctx = this.ctx;
    const pad = 16;

    // Status panel
    ctx.fillStyle = 'rgba(20,16,12,0.85)';
    ctx.strokeStyle = 'rgba(212,168,83,0.3)';
    ctx.lineWidth = 1;
    this.roundRect(ctx, pad, pad, 200, 130, 10, true, true);

    const bars = [
      { label: '体力', val: this.stats.stamina, color: '#6b9e5a' },
      { label: '饱腹', val: this.stats.hunger, color: '#d4a853' },
      { label: '温暖', val: this.stats.warmth, color: '#c47840' },
      { label: '疲惫', val: 100 - this.stats.fatigue, color: '#7a9eb5' },
    ];
    bars.forEach((b, i) => {
      const y = pad + 14 + i * 28;
      ctx.fillStyle = 'rgba(232,220,200,0.7)';
      ctx.font = '11px sans-serif';
      ctx.fillText(b.label, pad + 12, y);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      this.roundRect(ctx, pad + 44, y - 10, 140, 10, 4, true, false);
      ctx.fillStyle = b.color;
      this.roundRect(ctx, pad + 44, y - 10, 140 * b.val / 100, 10, 4, true, false);
    });

    // Time & biome
    const hour = Math.floor(this.time);
    const min = Math.floor((this.time % 1) * 60);
    const biome = BIOMES[this.getBiomeAt(this.player.x, this.player.y)] || BIOMES.plain;
    ctx.fillStyle = 'rgba(20,16,12,0.85)';
    this.roundRect(ctx, this.viewW - 180, pad, 164, 56, 10, true, true);
    ctx.fillStyle = '#e8c878';
    ctx.font = '13px sans-serif';
    ctx.fillText(`${String(hour).padStart(2,'0')}:${String(min).padStart(2,'0')}`, this.viewW - 168, pad + 22);
    ctx.fillStyle = 'rgba(232,220,200,0.7)';
    ctx.font = '11px sans-serif';
    ctx.fillText(`${biome.emoji} ${biome.name}`, this.viewW - 168, pad + 42);

    // Gold & rep
    ctx.fillStyle = 'rgba(20,16,12,0.85)';
    this.roundRect(ctx, this.viewW - 180, pad + 64, 164, 36, 10, true, true);
    ctx.fillStyle = 'rgba(232,220,200,0.8)';
    ctx.font = '12px sans-serif';
    ctx.fillText(`💰 ${this.stats.gold}  ⭐ 声望 ${this.stats.rep}`, this.viewW - 168, pad + 86);

    // Quest tracker
    if (this.quests.active.length) {
      const qid = this.quests.active[0];
      const q = QUESTS[qid];
      ctx.fillStyle = 'rgba(20,16,12,0.85)';
      this.roundRect(ctx, pad, this.viewH - 80, 280, 56, 10, true, true);
      ctx.fillStyle = '#e8c878';
      ctx.font = '12px sans-serif';
      ctx.fillText(`📜 ${q?.title || qid}`, pad + 12, this.viewH - 58);
      ctx.fillStyle = 'rgba(232,220,200,0.65)';
      ctx.font = '11px sans-serif';
      ctx.fillText(q?.desc || '', pad + 12, this.viewH - 38, 256);
    }

    // Message
    if (this.message && this.messageTimer > 0) {
      ctx.fillStyle = 'rgba(20,16,12,0.9)';
      const tw = ctx.measureText(this.message).width + 32;
      this.roundRect(ctx, (this.viewW - tw) / 2, this.viewH - 140, tw, 36, 8, true, true);
      ctx.fillStyle = '#e8dcc8';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.message, this.viewW / 2, this.viewH - 116);
      ctx.textAlign = 'left';
    }

    // Controls hint
    ctx.fillStyle = 'rgba(20,16,12,0.7)';
    this.roundRect(ctx, pad, this.viewH - 36, 340, 24, 6, true, false);
    ctx.fillStyle = 'rgba(232,220,200,0.5)';
    ctx.font = '10px sans-serif';
    ctx.fillText('WASD 移动 · E 互动 · 空格 休息 · M 骑马 · ESC 暂停', pad + 10, this.viewH - 19);
  }

  renderDialogue() {
    const ctx = this.ctx;
    const d = this.dialogue;
    const line = d.lines[d.idx];
    if (!line) return;

    const boxH = line.choices ? 160 : 110;
    const bx = 40, by = this.viewH - boxH - 40, bw = this.viewW - 80;

    ctx.fillStyle = 'rgba(20,16,12,0.92)';
    ctx.strokeStyle = 'rgba(212,168,83,0.4)';
    this.roundRect(ctx, bx, by, bw, boxH, 12, true, true);

    const speaker = line.speaker ? NPCS[line.speaker] : null;
    if (speaker) {
      ctx.fillStyle = '#e8c878';
      ctx.font = '13px sans-serif';
      ctx.fillText(`${speaker.emoji} ${speaker.name}`, bx + 20, by + 28);
    }

    ctx.fillStyle = '#e8dcc8';
    ctx.font = '14px sans-serif';
    this.wrapText(ctx, line.text, bx + 20, by + (speaker ? 52 : 36), bw - 40, 22);

    if (line.choices) {
      this._choiceRects = [];
      line.choices.forEach((c, i) => {
        const cy = by + 70 + i * 32;
        ctx.fillStyle = 'rgba(212,168,83,0.15)';
        ctx.strokeStyle = 'rgba(212,168,83,0.35)';
        this.roundRect(ctx, bx + 16, cy, bw - 32, 28, 6, true, true);
        ctx.fillStyle = '#e8c878';
        ctx.font = '12px sans-serif';
        ctx.fillText(`${i + 1}. ${c.label}`, bx + 28, cy + 19);
        this._choiceRects.push({ x: bx + 16, y: cy, w: bw - 32, h: 28, next: c.next, action: c.action });
      });
    } else {
      ctx.fillStyle = 'rgba(232,220,200,0.4)';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('按 E 继续', bx + bw - 20, by + boxH - 14);
      ctx.textAlign = 'left';
      this._choiceRects = [];
    }
  }

  roundRect(ctx, x, y, w, h, r, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  wrapText(ctx, text, x, y, maxW, lineH) {
    const words = text.split('');
    let line = '', ly = y;
    for (const ch of words) {
      const test = line + ch;
      if (ctx.measureText(test).width > maxW) {
        ctx.fillText(line, x, ly);
        line = ch;
        ly += lineH;
      } else {
        line = test;
      }
    }
    ctx.fillText(line, x, ly);
  }

  adjustColor(hex, amount) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.max(0, Math.min(255, (n >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + amount));
    const b = Math.max(0, Math.min(255, (n & 0xff) + amount));
    return `rgb(${r},${g},${b})`;
  }
}

// Dialogue choice click
document.addEventListener('click', e => {
  const g = window._game;
  if (!g?._choiceRects?.length) return;
  const mx = e.clientX, my = e.clientY;
  g._choiceRects.forEach(r => {
    if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
      g.chooseDialogue(r.next, r.action);
    }
  });
});

// Number keys for dialogue choices
document.addEventListener('keydown', e => {
  const g = window._game;
  if (!g?.dialogue) return;
  const line = g.dialogue.lines[g.dialogue.idx];
  if (!line?.choices) return;
  const idx = parseInt(e.key) - 1;
  if (idx >= 0 && idx < line.choices.length) {
    const c = line.choices[idx];
    g.chooseDialogue(c.next, c.action);
  }
});
