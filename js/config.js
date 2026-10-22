// Konfigurasi & data balancing. Semua angka "Sulit" ada di sini.
window.PC = window.PC || {};
(function (PC) {
  const C = {
    TILE: 16, COLS: 26, ROWS: 14, ROOM_W: 416, ROOM_H: 224,
    // Area jalan: kolom 1..24, baris 2..12
    FLOORS: [
      { name: 'Ruang Bawah Tanah Terlupakan', theme: 'crypt', boss: 'colossus', pool: ['slime', 'skeleton', 'archer', 'bat'], budget: 6 },
      { name: 'Katakombe Busuk', theme: 'swamp', boss: 'witch', pool: ['skeleton', 'archer', 'bat', 'ghoul', 'mage'], budget: 8 },
      { name: 'Jurang Bara', theme: 'inferno', boss: 'dragon', pool: ['ghoul', 'mage', 'knight', 'imp', 'bat', 'archer'], budget: 10 },
      { name: 'Kuil Batu Terlarang', theme: 'temple', boss: 'medusa', pool: ['archer', 'mage', 'ghoul', 'imp', 'bat'], budget: 12 },
      { name: 'Gerbang Neraka', theme: 'hell', boss: 'cerberus', pool: ['imp', 'ghoul', 'knight', 'mage', 'bat'], budget: 14 },
      { name: 'Labirin Raja', theme: 'maze', boss: 'minotaur', pool: ['knight', 'ghoul', 'skeleton', 'archer', 'imp'], budget: 16 },
      { name: 'Takhta Langit', theme: 'sky', boss: 'zeus', pool: ['mage', 'knight', 'imp', 'bat', 'archer', 'ghoul'], budget: 18 },
    ],
    ROOMS_PER_FLOOR: 3, // ruang tempur sebelum boss

    PLAYER: { hp: 100, mp: 60, st: 100, speed: 80, dodgeCost: 28, dodgeDur: 0.30, dodgeSpeed: 215, iframes: 0.24, hurtIframes: 0.55, dmgTaken: 1.3 },

    // cost = biaya anggaran spawn
    ENEMY: {
      slime:    { hp: 28,  r: 6, speed: 60, dmg: 8,  cost: 1, gold: 2, name: 'Slime' },
      skeleton: { hp: 44,  r: 6, speed: 44, dmg: 11, cost: 2, gold: 4, name: 'Skeleton' },
      archer:   { hp: 26,  r: 6, speed: 38, dmg: 9,  cost: 2, gold: 4, name: 'Archer' },
      bat:      { hp: 16,  r: 5, speed: 95, dmg: 7,  cost: 1, gold: 2, name: 'Bat', fly: true },
      ghoul:    { hp: 72,  r: 7, speed: 40, dmg: 15, cost: 3, gold: 6, name: 'Ghoul' },
      mage:     { hp: 36,  r: 6, speed: 40, dmg: 9,  cost: 3, gold: 6, name: 'Mage' },
      knight:   { hp: 125, r: 7, speed: 34, dmg: 19, cost: 4, gold: 9, name: 'Dread Knight' },
      imp:      { hp: 24,  r: 5, speed: 58, dmg: 16, cost: 2, gold: 4, name: 'Imp' },
    },
    BOSS: {
      colossus: { name: 'BONE COLOSSUS', sub: 'Raja Tulang Penjaga Gerbang', hp: 700, r: 15, speed: 34, gold: 90, phases: [0.5] },
      witch:    { name: 'MORGANA', sub: 'Ratu Wabah', hp: 850, r: 9, speed: 52, gold: 140, phases: [0.5] },
      dragon:   { name: 'ASHGOR', sub: 'Naga Bara Abadi', hp: 1250, r: 17, speed: 38, gold: 250, phases: [0.66, 0.33] },
      // Boss 4-7: Medusa (CP2), Cerberus (CP3), Minotaur (CP4), Zeus (CP5) — semua mekanik asli.
      medusa:   { name: 'MEDUSA', sub: 'Penjaga Kuil Batu', hp: 900, r: 10, speed: 40, gold: 330, phases: [0.5] },
      cerberus: { name: 'CERBERUS', sub: 'Anjing Gerbang Neraka', hp: 1000, r: 16, speed: 42, gold: 420, phases: [0.66, 0.33] },
      minotaur: { name: 'MINOTAUR', sub: 'Raja Labirin', hp: 1000, r: 15, speed: 40, gold: 520, phases: [0.5] },
      zeus:     { name: 'ZEUS', sub: 'Penguasa Langit', hp: 1500, r: 12, speed: 44, gold: 700, phases: [0.66, 0.33] },
    },

    // Perk: dipilih 1 dari 3 setelah tiap ruangan. `a` mengubah objek pemain.
    PERKS: [
      { id: 'blade',  icon: 'sword',  name: 'Bilah Tajam',     desc: 'Damage +20%',                          a: p => { p.dmgMul += 0.2; } },
      { id: 'heart',  icon: 'heart',  name: 'Hati Baja',       desc: 'HP maks +25 & pulihkan 25',            a: p => { p.maxHp += 25; p.hp = Math.min(p.maxHp, p.hp + 25); } },
      { id: 'boots',  icon: 'boot',   name: 'Sepatu Angin',    desc: 'Kecepatan +10%, stamina cepat pulih',  a: p => { p.speed *= 1.1; p.stRegen *= 1.2; } },
      { id: 'cloak',  icon: 'cloak',  name: 'Jubah Hantu',     desc: 'Kebal dodge +0.08s, stamina dodge -20%', a: p => { p.iframes += 0.08; p.dodgeCost *= 0.8; } },
      { id: 'mana',   icon: 'drop',   name: 'Sumur Mana',      desc: 'MP maks +25, regen +40%, +2 MP/serangan', a: p => { p.maxMp += 25; p.mp += 25; p.mpRegen *= 1.4; p.mpPerHit += 2; } },
      { id: 'vamp',   icon: 'fang',   name: 'Taring Vampir',   desc: 'Pulihkan 1 HP tiap serangan kena',     a: p => { p.lifesteal += 1; } },
      { id: 'crit',   icon: 'star',   name: 'Rune Kritikal',   desc: 'Peluang crit +12%, crit x2.3',         a: p => { p.crit += 0.12; p.critMul = 2.3; } },
      { id: 'whirl',  icon: 'spiral', name: 'Ahli Whirlwind',  desc: 'Whirlwind +25% radius, cooldown -25%', a: p => { p.whirlR *= 1.25; p.cdMul[0] *= 0.75; } },
      { id: 'lance',  icon: 'bolt',   name: 'Ahli Lance',      desc: 'Lance +30% damage, tembus +2',         a: p => { p.lanceDmg *= 1.3; p.lancePierce += 2; } },
      { id: 'aegis',  icon: 'shield', name: 'Ahli Aegis',      desc: 'Aegis +30 serap, cooldown -25%',       a: p => { p.aegisHp += 30; p.cdMul[2] *= 0.75; p.aegisNova *= 1.4; } },
      { id: 'alch',   icon: 'potion', name: 'Alkemis',         desc: '+1 ramuan & ramuan pulihkan +20',      a: p => { p.potions += 1; p.potionHeal += 20; } },
      { id: 'hands',  icon: 'fist',   name: 'Tangan Cepat',    desc: 'Kecepatan serang +18%',                a: p => { p.atkSpeed *= 1.18; } },
      { id: 'reflex', icon: 'eye',    name: 'Refleks Sempurna', desc: 'Perfect dodge: +35 MP & serangan berikut +60%', a: p => { p.perfectBonus = true; } },
    ],

    // Upgrade permanen (Forge). Biaya per level.
    FORGE: [
      { id: 'vit',  icon: 'heart',  name: 'Vitalitas', desc: '+10 HP maks / level',      max: 5, cost: [60, 100, 160, 240, 340] },
      { id: 'pow',  icon: 'sword',  name: 'Kekuatan',  desc: '+6% damage / level',       max: 5, cost: [70, 110, 170, 250, 350] },
      { id: 'foc',  icon: 'drop',   name: 'Fokus',     desc: '+8 MP maks, regen +10% / level', max: 5, cost: [50, 90, 140, 210, 300] },
      { id: 'alch', icon: 'potion', name: 'Alkemi',    desc: '+1 ramuan awal / level',   max: 3, cost: [120, 220, 380] },
      { id: 'agi',  icon: 'boot',   name: 'Kelincahan', desc: '+3% kecepatan, +5 stamina / level', max: 5, cost: [60, 100, 160, 240, 340] },
    ],
  };
  PC.C = C;
})(window.PC);
