/* 《远风归途》游戏数据 */

export const BIOMES = {
  plain:  { name: '平原牧场', color: '#8ab86a', dark: '#5a8040', emoji: '🌾' },
  forest: { name: '原始森林', color: '#3d6b35', dark: '#2a4a25', emoji: '🌲' },
  town:   { name: '沿河小镇', color: '#c4956a', dark: '#8b6040', emoji: '🏘️' },
  swamp:  { name: '湿地沼泽', color: '#5a6b4a', dark: '#3a4a30', emoji: '🌿' },
  snow:   { name: '雪山山林', color: '#a8c4d8', dark: '#6a8aa8', emoji: '🏔️' },
  desert: { name: '荒漠峡谷', color: '#d4a060', dark: '#a07030', emoji: '🏜️' },
  mine:   { name: '矿业城镇', color: '#7a7a80', dark: '#4a4a50', emoji: '⛏️' },
};

export const MAP_REGIONS = [
  { id: 'plain',   name: '哈登平原', chapter: 1, x: 42, y: 55, quests: ['ch1_wagon', 'ch1_horse'] },
  { id: 'town',    name: '橡树镇',   chapter: 2, x: 62, y: 48, quests: ['ch2_tribe'] },
  { id: 'swamp',   name: '芦苇湾',   chapter: 3, x: 75, y: 62, quests: ['ch3_wetland'] },
  { id: 'snow',    name: '银松坡',   chapter: 4, x: 55, y: 22, quests: ['ch4_storm'] },
  { id: 'forest',  name: '橡树溪',   chapter: 0, x: 30, y: 40, quests: ['side_deer'] },
  { id: 'desert',  name: '日落隘口', chapter: 0, x: 18, y: 65, quests: ['side_traveler'] },
  { id: 'mine',    name: '铜溪镇',   chapter: 0, x: 80, y: 35, quests: ['side_photos'] },
];

export const QUESTS = {
  ch1_wagon: {
    id: 'ch1_wagon',
    title: '帮修马车',
    chapter: 1,
    desc: '晨曦旅社的马车轮轴断裂，帮助他们修理马车。',
    steps: ['找到断裂的车轮', '向托马斯借工具', '修理马车'],
    reward: { rep: 10, gold: 5 },
  },
  ch1_horse: {
    id: 'ch1_horse',
    title: '寻回走失的马',
    chapter: 1,
    desc: '驮马在晨雾中走失，协助社群找回。',
    steps: ['在平原北部搜索', '用口哨呼唤马匹', '带马回到营地'],
    reward: { rep: 15, gold: 8 },
  },
  ch2_tribe: {
    id: 'ch2_tribe',
    title: '河湾调解',
    chapter: 2,
    desc: '协助晨曦旅社与白杨族化解土地误会。',
    steps: ['倾听双方诉求', '记录土地情况', '陪同递交申诉'],
    reward: { rep: 20, gold: 12 },
  },
};

export const NPCS = {
  elin:    { name: '艾琳·布鲁克斯', emoji: '👩‍🦳', role: '社群长者' },
  thomas:  { name: '托马斯·怀特', emoji: '🔨', role: '铁匠' },
  mary:    { name: '小玛莉·陈', emoji: '📚', role: '记录员' },
  jimmy:   { name: '吉米·霍金斯', emoji: '🎵', role: '乐手' },
  sara:    { name: '萨拉·米勒', emoji: '🌿', role: '草药师' },
  sam:     { name: '老山姆·里维拉', emoji: '🛤️', role: '向导' },
};

export const DIALOGUES = {
  elin_greet: [
    { text: '年轻人，谢谢你愿意停下脚步。我们的马车坏了，一时走不了。', speaker: 'elin' },
    { text: '我叫艾琳，是晨曦旅社的负责人。你愿意帮帮我们吗？', speaker: 'elin', choices: [
      { label: '当然，我很乐意帮忙', next: 'elin_accept' },
      { label: '发生了什么？', next: 'elin_explain' },
    ]},
  ],
  elin_explain: [
    { text: '车轮轴在颠簸中断裂了。托马斯正在想办法，但需要有人去北边找备用的木轴。', speaker: 'elin' },
    { text: '你能帮我们去平原北边找找吗？那里有一棵倒下的橡树。', speaker: 'elin', choices: [
      { label: '我这就去', next: 'elin_accept', action: 'start_quest_ch1_wagon' },
    ]},
  ],
  elin_accept: [
    { text: '真是太感谢了！托马斯在马车那边，他会告诉你需要什么。', speaker: 'elin', action: 'start_quest_ch1_wagon' },
  ],
  thomas_greet: [
    { text: '你是艾琳说的那位好心人？轮子找到了的话，我这里有工具可以修。', speaker: 'thomas' },
    { text: '把木轴带到马车旁边，按 E 修理就行。', speaker: 'thomas' },
  ],
  thomas_repair: [
    { text: '干得漂亮！马车修好了，我们可以继续上路了。', speaker: 'thomas', action: 'complete_quest_ch1_wagon' },
  ],
  mary_greet: [
    { text: '你好！我在记录今天的行程。平原的晨雾好美，你看到了吗？', speaker: 'mary' },
  ],
  jimmy_greet: [
    { text: '嘿！要不要听我吹一段口琴？这曲子是我妈妈教我的。', speaker: 'jimmy' },
  ],
  sara_greet: [
    { text: '走路久了记得喝水。这瓶草药茶可以恢复一些体力。', speaker: 'sara', action: 'give_tea' },
  ],
  sam_greet: [
    { text: '年轻人，前面的路我走了几十年。有事尽管问我。', speaker: 'sam' },
  ],
  horse_found: [
    { text: '你找到了走失的驮马！它在外面吃草呢，谢谢你！', speaker: 'elin', action: 'complete_quest_ch1_horse' },
  ],
  traveler_lost: [
    { text: '我……我好像迷路了。水也喝完了。', speaker: null },
    { text: '你能带我去前面的驿站吗？', speaker: null, choices: [
      { label: '分享水囊，指引方向', next: 'traveler_thanks', action: 'help_traveler' },
      { label: '告诉他驿站的方向', next: 'traveler_dir' },
    ]},
  ],
  traveler_thanks: [
    { text: '太感谢你了！你是个好人，愿远风指引你的路。', speaker: null, action: 'rep_up' },
  ],
  traveler_dir: [
    { text: '好的，我顺着你的指引走。谢谢你！', speaker: null, action: 'rep_small' },
  ],
};

export const TOOLS = [
  { id: 'axe',     name: '砍柴斧', emoji: '🪓', desc: '砍伐木材、修理工具' },
  { id: 'shovel',  name: '采药铲', emoji: '⛏️', desc: '采集草药与植物' },
  { id: 'net',     name: '捕鱼网', emoji: '🎣', desc: '在河边垂钓渔获' },
  { id: 'scope',   name: '望远镜', emoji: '🔭', desc: '远距离观测动植物' },
  { id: 'canvas',  name: '写生画板', emoji: '🎨', desc: '记录风景、绘制画作' },
  { id: 'herbs',   name: '草药包', emoji: '🌿', desc: '基础医疗与照料' },
];

export const FAUNA = [
  { id: 'deer',    name: '白尾鹿', biome: 'forest', emoji: '🦌' },
  { id: 'eagle',   name: '金雕',   biome: 'plain',  emoji: '🦅' },
  { id: 'heron',   name: '苍鹭',   biome: 'swamp',  emoji: '🦢' },
  { id: 'rabbit',  name: '野兔',   biome: 'plain',  emoji: '🐇' },
  { id: 'mustang', name: '野马',   biome: 'plain',  emoji: '🐴' },
];
