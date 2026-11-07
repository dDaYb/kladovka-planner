
// ==========================================
// 1. КАТАЛОГ МОДЕЛЕЙ (SE 750кг, Лемана ПРО, Велосипеды)
// ==========================================
// Сетка SE 750кг по СтелТех: высота в планировщике только 3000 мм, полки SE-140.
// Цена стеллажа = стойки 3276 ₽ + N× полка SE-140 (цены с stel-teh.ru, раздел комплектующих).
// Глубина 700 мм есть только при ширине ≥ 900; комбинации 700×700 у производителя нет.
const SE_HEIGHT = 3000;
const SE_POSTS_PRICE = 3276;
const SE_DEFAULT_SHELVES = 5;
const SE_WIDTHS = [700, 900, 1000, 1200, 1500];
const SE_DEPTHS = [300, 400, 500, 600, 700, 800];
const SE_DEPTHS_BY_WIDTH = {
  700: [300, 400, 500, 600, 800],
  900: [300, 400, 500, 600, 700, 800],
  1000: [300, 400, 500, 600, 700, 800],
  1200: [300, 400, 500, 600, 700, 800],
  1500: [300, 400, 500, 600, 700, 800]
};
// Цена одной полки SE-140 (W×D), ₽ — с карточек stel-teh.ru / stellazh_se_komplektuyushchie.
const SE_SHELF_PRICES = {
  '700_300': 614, '700_400': 728, '700_500': 846, '700_600': 1016, '700_800': 1311,
  '900_300': 798, '900_400': 886, '900_500': 1153, '900_600': 1335, '900_700': 1530, '900_800': 1742,
  '1000_300': 773, '1000_400': 914, '1000_500': 1092, '1000_600': 1270, '1000_700': 1547, '1000_800': 1660,
  '1200_300': 1053, '1200_400': 1237, '1200_500': 1471, '1200_600': 1698, '1200_700': 2019, '1200_800': 2214,
  '1500_500': 1811, '1500_600': 2229, '1500_700': 2403, '1500_800': 2531
};
// Доставка СтелТех (stel-teh.ru/shipping-and-payment/), Москва/МО до 1000 кг или 7 м³.
const STELTECH_DELIVERY = {
  source: 'https://stel-teh.ru/shipping-and-payment/',
  zones: [
    { id: 'none', label: 'Без доставки / самовывоз', price: 0 },
    { id: 'mkad', label: 'Москва в пределах МКАД', price: 1350 },
    { id: 'mkad10', label: 'до 10 км от МКАД', price: 1970 },
    { id: 'mkad25', label: '10–25 км от МКАД', price: 3430 },
    { id: 'mkad50', label: '25–50 км от МКАД', price: 5950 },
    { id: 'mkad50p', label: 'более 50 км от МКАД (от)', price: 8150 },
    { id: 'tk', label: 'До терминала ТК в Москве', price: 1850 }
  ]
};
let deliveryZoneId = 'none';
const SE_COLORS = { 300: '#0369a1', 400: '#0284c7', 500: '#2563eb', 600: '#1d4ed8', 700: '#1e40af', 800: '#172554' };
function seDepthsForWidth(w) {
  return (SE_DEPTHS_BY_WIDTH[w] || SE_DEPTHS_BY_WIDTH[700]).slice();
}
function isSeSize(w, d) {
  return SE_WIDTHS.includes(Number(w)) && seDepthsForWidth(Number(w)).includes(Number(d));
}
function nearestSeWidth(w) {
  return SE_WIDTHS.reduce((best, x) => Math.abs(x - w) < Math.abs(best - w) ? x : best, SE_WIDTHS[0]);
}
function nearestSeDepth(w, d) {
  const depths = seDepthsForWidth(w);
  return depths.reduce((best, x) => Math.abs(x - d) < Math.abs(best - d) ? x : best, depths[0]);
}
function seShelfUnitPrice(w, d) {
  return SE_SHELF_PRICES[`${Number(w)}_${Number(d)}`] || 0;
}
function seRackPrice(w, d, shelves = SE_DEFAULT_SHELVES) {
  const unit = seShelfUnitPrice(w, d);
  if (!unit) return 0;
  const n = Math.max(0, Math.round(Number(shelves) || 0));
  return SE_POSTS_PRICE + n * unit;
}
/** Комплект на 5 полок SE-140 (для подсказок в меню размеров). */
const SE_PRICES = Object.fromEntries(
  Object.keys(SE_SHELF_PRICES).map(k => {
    const [w, d] = k.split('_').map(Number);
    return [k, seRackPrice(w, d, SE_DEFAULT_SHELVES)];
  })
);
function deliveryZone() {
  return STELTECH_DELIVERY.zones.find(z => z.id === deliveryZoneId) || STELTECH_DELIVERY.zones[0];
}
function deliveryPrice() {
  return deliveryZone().price || 0;
}
function setDeliveryZone(id) {
  if (!STELTECH_DELIVERY.zones.some(z => z.id === id)) return;
  deliveryZoneId = id;
  refreshAll();
  if (document.getElementById('bomModal')?.classList.contains('open')) openBomModal();
}
function makeSeModel(w, d, shelves = SE_DEFAULT_SHELVES) {
  const width = SE_WIDTHS.includes(w) ? w : nearestSeWidth(w);
  const depth = isSeSize(width, d) ? d : nearestSeDepth(width, d);
  const n = Math.max(2, Math.min(8, Math.round(Number(shelves) || SE_DEFAULT_SHELVES)));
  return {
    id: `se_${width}_${depth}`,
    brand: 'SE 750кг',
    name: `Стеллаж SE ${SE_HEIGHT}×${width}×${depth}`,
    w: width, d: depth, h: SE_HEIGHT, shelves: n,
    price: seRackPrice(width, depth, n),
    color: SE_COLORS[depth] || '#2563eb'
  };
}
/** Приводит SE / Профи-Т к размеру, который есть в продаже у СтелТех. */
function normalizeBuyableRack(item) {
  if (!item) return item;
  if (item.brand === 'SE 750кг') {
    const shelves = item.shelves || SE_DEFAULT_SHELVES;
    const m = makeSeModel(item.w, item.d, shelves);
    Object.assign(item, {
      modelId: m.id, name: m.name, w: m.w, d: m.d, h: m.h, price: m.price, color: m.color, shelves: m.shelves
    });
    return item;
  }
  if (item.brand === 'Профи-Т 2500кг') {
    const shelves = item.shelves || PT_DEFAULT_SHELVES;
    const m = makePtModel(item.w, item.d, shelves);
    Object.assign(item, {
      modelId: m.id, name: m.name, w: m.w, d: m.d, h: m.h, price: m.price, color: m.color, shelves: m.shelves
    });
  }
  return item;
}

// Профи-Т 2500кг (СтелТех): в планировщике только высота 3000 мм, настил — фанера.
// Цена = стойки 6532 ₽ + N× ярус с фанерой (актуально на stel-teh.ru). Шаг перфорации 45 мм.
const PT_HEIGHT = 3000;
const PT_POSTS_PRICE = 6532;
const PT_DEFAULT_SHELVES = 4;
const PT_SHELF_STEP = 45;
const PT_WIDTHS = [455, 500, 655, 770, 1005, 1240, 1540, 1845];
const PT_DEPTHS = [455, 500, 655, 770, 1005];
const PT_SHELF_PRICES = {
  '455_455': 1399, '455_500': 1429, '455_655': 1551, '455_770': 1721, '455_1005': 2075,
  '500_455': 1429, '500_500': 1459, '500_655': 1626, '500_770': 1806, '500_1005': 2177,
  '655_455': 1551, '655_500': 1626, '655_655': 1908, '655_770': 2117, '655_1005': 2672,
  '770_455': 1721, '770_500': 1806, '770_655': 2117, '770_770': 2347, '770_1005': 2821,
  '1005_455': 2075, '1005_500': 2177, '1005_655': 2672, '1005_770': 2821, '1005_1005': 4003,
  '1240_455': 2424, '1240_500': 2534, '1240_655': 2975, '1240_770': 2992, '1240_1005': 4386,
  '1540_455': 2639, '1540_500': 2689, '1540_655': 3144, '1540_770': 3392, '1540_1005': 4634,
  '1845_455': 2899, '1845_500': 2995, '1845_655': 3503, '1845_770': 3797, '1845_1005': 5136
};
const PT_COLORS = { 455: '#1d4ed8', 500: '#1e40af', 655: '#1e3a8a', 770: '#172554', 1005: '#0f172a' };
function isPtSize(w, d) {
  return PT_WIDTHS.includes(Number(w)) && PT_DEPTHS.includes(Number(d));
}
function nearestPtWidth(w) {
  return PT_WIDTHS.reduce((best, x) => Math.abs(x - w) < Math.abs(best - w) ? x : best, PT_WIDTHS[0]);
}
function nearestPtDepth(d) {
  return PT_DEPTHS.reduce((best, x) => Math.abs(x - d) < Math.abs(best - d) ? x : best, PT_DEPTHS[0]);
}
function ptShelfUnitPrice(w, d) {
  return PT_SHELF_PRICES[`${Number(w)}_${Number(d)}`] || 0;
}
function ptRackPrice(w, d, shelves = PT_DEFAULT_SHELVES) {
  const unit = ptShelfUnitPrice(w, d);
  if (!unit) return 0;
  return PT_POSTS_PRICE + Math.max(0, Math.round(Number(shelves) || 0)) * unit;
}
function makePtModel(w, d, shelves = PT_DEFAULT_SHELVES) {
  const width = PT_WIDTHS.includes(w) ? w : nearestPtWidth(w);
  const depth = PT_DEPTHS.includes(d) ? d : nearestPtDepth(d);
  const n = Math.max(2, Math.min(8, Math.round(Number(shelves) || PT_DEFAULT_SHELVES)));
  return {
    id: `pt_${width}_${depth}`,
    brand: 'Профи-Т 2500кг',
    name: `Профи-Т ${PT_HEIGHT}×${width}×${depth} · фанера`,
    w: width, d: depth, h: PT_HEIGHT, shelves: n,
    price: ptRackPrice(width, depth, n),
    color: PT_COLORS[depth] || '#1e40af'
  };
}

// Быстрый каталог: сметные позиции + глубины 600/700/800 (700 — только где есть у СтелТех).
const CATALOG = {
  se: [
    makeSeModel(1200, 500),
    makeSeModel(900, 500),
    makeSeModel(1000, 500),
    makeSeModel(700, 400),
    makeSeModel(700, 300),
    makeSeModel(1200, 600), makeSeModel(900, 600), makeSeModel(1000, 600), makeSeModel(700, 600),
    makeSeModel(1200, 700), makeSeModel(900, 700), makeSeModel(1000, 700),
    makeSeModel(1200, 800), makeSeModel(900, 800), makeSeModel(1000, 800), makeSeModel(700, 800)
  ],
  pt: [
    makePtModel(1005, 500), makePtModel(1005, 655), makePtModel(770, 500),
    makePtModel(1240, 500), makePtModel(655, 500), makePtModel(500, 500),
    makePtModel(1540, 500), makePtModel(1005, 770), makePtModel(1240, 770),
    makePtModel(455, 500), makePtModel(1845, 500)
  ],
  lm: [
    { id: 'lm_1000_500', brand: 'Лемана ПРО', name: 'Практик/Stynergy 2000×1000×500 (арт. 82285507)', w: 1000, d: 500, h: 2000, shelves: 5, price: 5510, color: '#16a34a' },
    { id: 'lm_1200_400', brand: 'Лемана ПРО', name: 'Стеллаж 1800×1200×400 (арт. 89377054)',          w: 1200, d: 400, h: 1800, shelves: 5, price: 5501, color: '#15803d' },
    { id: 'lm_900_400',  brand: 'Лемана ПРО', name: 'Стеллаж 1800×900×400 (арт. 87767422)',           w: 900,  d: 400, h: 1800, shelves: 5, price: 4180, color: '#166534' },
    { id: 'lm_700_400',  brand: 'Лемана ПРО', name: 'Ironmebel 2200×700×400 (арт. 91083607)',         w: 700,  d: 400, h: 2200, shelves: 5, price: 5475, color: '#0d9488' },
    { id: 'lm_700_300',  brand: 'Лемана ПРО', name: 'Ironmebel 2200×700×300 (арт. 91083606)',         w: 700,  d: 300, h: 2200, shelves: 5, price: 5768, color: '#0f766e' },
    { id: 'lm_800_400',  brand: 'Лемана ПРО', name: 'Практик 1800×800×400 (арт. 82260136)',           w: 800,  d: 400, h: 1800, shelves: 4, price: 3894, color: '#059669' }
  ],
  bike: [
    { id: 'bike_floor',      brand: 'Велосипед', isBike: true, bikeMode: 'floor',      name: 'Велосипед на полу (прямой руль)',     w: 1700, d: 500, h: 1000, shelves: 1, price: 0, color: '#d97706' },
    { id: 'bike_floor_turn', brand: 'Велосипед', isBike: true, bikeMode: 'floor_turn', name: 'Велосипед на полу (повернут руль)',   w: 1700, d: 420, h: 1000, shelves: 1, price: 0, color: '#ea580c' },
    { id: 'bike_vert',       brand: 'Велосипед', isBike: true, bikeMode: 'vert',       name: 'Велосипед на стене, колесом вверх',       w: 500,  d: 1000, h: 1700, shelves: 1, price: 0, color: '#b45309' }
  ]
};

CATALOG.ski = [
 {id:'ski_alpine',brand:'Лыжи',name:'Горные лыжи · вертикальный подвес',isSki:true,w:250,d:220,h:1800,z:150,shelves:0,price:0,color:'#7c3aed'},
 {id:'ski_nordic',brand:'Лыжи',name:'Беговые лыжи · вертикальный подвес',isSki:true,w:180,d:160,h:2100,z:150,shelves:0,price:0,color:'#a21caf'}
];
CATALOG.ladder = [{id:'ladder_folded',brand:'Стремянка',name:'Стремянка сложенная',isLadder:true,w:500,d:120,h:1800,shelves:0,price:0,color:'#0891b2'}];
// Предметы только на полки стеллажа (не ставятся на пол комнаты).
// Короба — пластиковые из Fix Price / Fimako (габариты с карточек товара; цвет по объёму).
CATALOG.cargo = [
  {id:'fix_3l', brand:'На полку', isCargo:true, name:'Fix Price 3,3 л · 240×170×120', w:240, d:170, h:120, price:0, color:'#67e8f9'},
  {id:'fix_5l', brand:'На полку', isCargo:true, name:'Fix Price 5 л · 305×168×129', w:305, d:168, h:129, price:0, color:'#5eead4'},
  {id:'fix_6l', brand:'На полку', isCargo:true, name:'Fix Price SMART BOX 6 л · 300×193×170', w:300, d:193, h:170, price:0, color:'#2dd4bf'},
  {id:'fix_6sq', brand:'На полку', isCargo:true, name:'Fix Price мультибокс 6 л · 250×240×140', w:250, d:240, h:140, price:0, color:'#34d399'},
  {id:'fix_10l', brand:'На полку', isCargo:true, name:'Fix Price Майбокс 10 л · 360×250×140', w:360, d:250, h:140, price:0, color:'#4ade80'},
  {id:'fix_18l', brand:'На полку', isCargo:true, name:'Fix Price Fimako 18 л · 395×295×200', w:395, d:295, h:200, price:0, color:'#60a5fa'},
  {id:'fix_32l', brand:'На полку', isCargo:true, name:'Fix Price на колёсах 32 л · 470×360×250', w:470, d:360, h:250, price:0, color:'#818cf8'},
  {id:'fix_35l', brand:'На полку', isCargo:true, name:'Fix Price корзина 35 л · 530×360×250', w:530, d:360, h:250, price:0, color:'#c084fc'},
  // R18: типовой легковой 225/45R18 ≈ Ø660 × ширина 225; стоит на протекторе.
  {id:'tire_r18', brand:'На полку', isCargo:true, name:'Шина R18 · Ø≈660 × 225', w:660, d:225, h:660, price:0, color:'#1f2937'},
  // Makita Makpac: база 395×295 мм, высота по типу (официальные габариты).
  {id:'makpac_1', brand:'На полку', isCargo:true, name:'Makita Makpac тип 1 · 395×295×105', w:395, d:295, h:105, price:0, color:'#008fc5'},
  {id:'makpac_2', brand:'На полку', isCargo:true, name:'Makita Makpac тип 2 · 395×295×157', w:395, d:295, h:157, price:0, color:'#007eb0'},
  {id:'makpac_3', brand:'На полку', isCargo:true, name:'Makita Makpac тип 3 · 395×295×210', w:395, d:295, h:210, price:0, color:'#006e9a'},
  {id:'makpac_4', brand:'На полку', isCargo:true, name:'Makita Makpac тип 4 · 395×295×315', w:395, d:295, h:315, price:0, color:'#005f85'},
  // Чемоданы: типовые авиационные габариты (лежат плашмя: длина×ширина×толщина).
  // Ручная кладь — частые лимиты авиакомпаний / IATA Cabin OK; багаж — сумма трёх сторон ≤158 см.
  {id:'bag_cabin_ok', brand:'На полку', isCargo:true, name:'Ручная кладь IATA Cabin OK · 550×400×200', w:550, d:400, h:200, price:0, color:'#64748b'},
  {id:'bag_cabin_55', brand:'На полку', isCargo:true, name:'Ручная кладь 55×40×23 · 550×400×230', w:550, d:400, h:230, price:0, color:'#475569'},
  {id:'bag_cabin_56', brand:'На полку', isCargo:true, name:'Ручная кладь 56×45×25 · 560×450×250', w:560, d:450, h:250, price:0, color:'#334155'},
  {id:'bag_personal', brand:'На полку', isCargo:true, name:'Личная сумка / underseat · 400×300×150', w:400, d:300, h:150, price:0, color:'#94a3b8'},
  {id:'bag_check_m', brand:'На полку', isCargo:true, name:'Багаж M (≤158 см) · 650×450×250', w:650, d:450, h:250, price:0, color:'#1e3a8a'},
  {id:'bag_check_l', brand:'На полку', isCargo:true, name:'Багаж L (≤158 см) · 750×500×280', w:750, d:500, h:280, price:0, color:'#172554'},
  {id:'suitcase', brand:'На полку', isCargo:true, name:'Багаж L · 750×450×280 (совместимость)', w:750, d:450, h:280, price:0, color:'#1e293b'},
  {id:'canister', brand:'На полку', isCargo:true, name:'Канистра 350×200×400', w:350, d:200, h:400, price:0, color:'#b45309'},
  {id:'custom_cargo', brand:'На полку', isCargo:true, name:'Свой предмет 400×300×300', w:400, d:300, h:300, price:0, color:'#64748b'}
];

const SHELF_STEP = 25;      // шаг перфорации SE
const SHELF_PLATE = 25;     // толщина полки в модели
const SHELF_MIN = 2;
const SHELF_MAX = 8;
function shelfStepForBrand(brand) {
  if (brand === 'SE 750кг') return SHELF_STEP;
  if (brand === 'Профи-Т 2500кг') return PT_SHELF_STEP;
  return 50;
}
// Геометрия стен:
// left: x=0, y in [0..2860]
// top: y=0, x in [0..1468]
// right_top: x=1468, y in [0..1394]
// right_bot: x=1779, y in [1394..2860]
const WALL_INFO = {
  top:       { label: 'Верхняя (1468 мм)',     maxLen: 1468 },
  left:      { label: 'Левая (2860 мм)',       maxLen: 2860 },
  right_top: { label: 'Правая верх (1394 мм)', maxLen: 1394 },
  right_bot: { label: 'Правая низ (1466 мм)',  maxLen: 1466 }
};

// Дверь на нижней стене. Стороны — как изнутри кладовки, глядя на дверь:
// слева до стены 200 мм, справа обмер ≈500 → 529 мм (200+1050+529=1779).
// На плане дверь внизу, смотрим «от себя» на дверь → изнутри лево/право зеркальны оси X:
// DOOR.left = отступ от x=0 (план «слева») = изнутри СПРАВА = 529;
// DOOR.right = до x=1779 (план «справа») = изнутри СЛЕВА = 200.
const DOOR = {
  left: 529,
  width: 1050,
  height: 2100,
  bottomWidth: 1779,
  get right() { return this.bottomWidth - this.left - this.width; },
  get start() { return this.left; },
  get end() { return this.left + this.width; }
};

let currentCatalogTab = 'se';
let items = [];
let selectedId = null;
let ceilingHeight = 3358;
let wallOpacity = 0.35;
let nextUid = 1;
let nextCargoId = 1;
let activeShelfIndex = 0; // полка выбранного стеллажа для добавления из каталога
let selectedCargoId = null; // id выбранной вещи на полке (строка c_N)

function cargoKind(modelId) {
  const id = String(modelId || '');
  if (id === 'tire_r18') return 'tire';
  if (id === 'suitcase' || id.startsWith('bag_')) return 'suitcase';
  if (id.startsWith('makpac_')) return 'makpac';
  if (id === 'canister') return 'canister';
  return 'box';
}

function makeCargoInstance(model, shelfIndex, order) {
  const n = nextCargoId++;
  return {
    id: `c_${n}`,
    cid: n,
    modelId: model.id,
    kind: cargoKind(model.id),
    name: model.name,
    w: model.w,
    d: model.d,
    h: model.h,
    color: model.color,
    shelfIndex,
    order: Number.isFinite(order) ? order : 0,
    inventory: [], // будущий список содержимого коробки
    photo: null    // будущая фотка содержимого (data URL / ссылка)
  };
}

function normalizeCargo(raw, shelfN) {
  const n = Number(raw?.cid);
  const cid = Number.isFinite(n) && n > 0 ? n : nextCargoId++;
  if (cid >= nextCargoId) nextCargoId = cid + 1;
  const id = typeof raw?.id === 'string' && raw.id ? String(raw.id).slice(0, 40) : `c_${cid}`;
  const si = Math.max(0, Math.min(Math.max(0, shelfN - 1), Number(raw?.shelfIndex) || 0));
  const inventory = Array.isArray(raw?.inventory)
    ? raw.inventory.slice(0, 100).map(row => ({
        name: String(row?.name || 'Вещь').slice(0, 80),
        qty: Math.max(1, Math.min(999, Number(row?.qty) || 1))
      }))
    : [];
  const photo = raw?.photo == null || raw.photo === '' ? null : String(raw.photo).slice(0, 500000);
  return {
    id,
    cid,
    modelId: String(raw?.modelId || 'custom_cargo').slice(0, 40),
    kind: raw?.kind || cargoKind(raw?.modelId),
    name: String(raw?.name || 'Предмет').slice(0, 80),
    w: Number(raw.w),
    d: Number(raw.d),
    h: Number(raw.h),
    color: raw?.color || '#64748b',
    shelfIndex: si,
    order: Math.max(0, Number(raw?.order) || 0),
    inventory,
    photo
  };
}

function findCargo(rack, cargoId) {
  return (rack?.contents || []).find(c => c.id === cargoId || String(c.cid) === String(cargoId));
}

function reindexShelfOrders(rack, shelfIndex) {
  shelfCargo(rack, shelfIndex).forEach((c, i) => { c.order = i; });
}

function cargoThumbSvg(m) {
  const fill = m.color || '#94a3b8';
  const kind = cargoKind(m.id);
  if (m.id === 'tire_r18' || kind === 'tire') {
    return `<svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="18" fill="#111827" stroke="#4b5563" stroke-width="2"/><circle cx="22" cy="22" r="8" fill="#e5e7eb"/><circle cx="22" cy="22" r="3" fill="#6b7280"/></svg>`;
  }
  if (kind === 'makpac') {
    return `<svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
      <defs><linearGradient id="mk${m.id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1e293b"/><stop offset="55%" stop-color="${fill}"/><stop offset="100%" stop-color="#0f172a"/></linearGradient></defs>
      <rect x="5" y="10" width="34" height="28" rx="3" fill="url(#mk${m.id})" stroke="#0f172a" stroke-width="1"/>
      <rect x="7" y="12" width="30" height="8" rx="1.5" fill="#0b1220" fill-opacity=".55"/>
      <rect x="10" y="14" width="18" height="4" rx="1" fill="#facc15"/>
      <text x="19" y="17.5" text-anchor="middle" font-size="3.2" font-weight="700" fill="#0f172a" font-family="sans-serif">makita</text>
      <rect x="8" y="22" width="28" height="2" fill="#94a3b8" fill-opacity=".35"/>
      <rect x="8" y="26" width="28" height="2" fill="#94a3b8" fill-opacity=".28"/>
      <rect x="8" y="30" width="28" height="2" fill="#94a3b8" fill-opacity=".22"/>
      <rect x="3.5" y="18" width="3" height="8" rx="1" fill="#e2e8f0"/><rect x="37.5" y="18" width="3" height="8" rx="1" fill="#e2e8f0"/>
      <path d="M16 8h12c1 0 2 .8 2 1.6V10H14V9.6c0-.8 1-1.6 2-1.6z" fill="#cbd5e1"/>
    </svg>`;
  }
  if (kind === 'suitcase') {
    const soft = String(m.id || '').includes('personal');
    return `<svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
      <defs><linearGradient id="bg${m.id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${fill}" stop-opacity=".95"/><stop offset="100%" stop-color="#0f172a" stop-opacity=".85"/></linearGradient></defs>
      <rect x="8" y="9" width="28" height="28" rx="${soft ? 6 : 3}" fill="url(#bg${m.id})" stroke="#0f172a" stroke-width="1"/>
      <path d="M10 23h24" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="2 1.5" opacity=".7"/>
      <rect x="18" y="5" width="8" height="5" rx="1" fill="#334155"/>
      <rect x="20" y="3" width="4" height="3" rx="0.8" fill="#64748b"/>
      <circle cx="12" cy="36" r="2.2" fill="#1e293b"/><circle cx="32" cy="36" r="2.2" fill="#1e293b"/>
      <rect x="19" y="16" width="6" height="10" rx="1" fill="#e2e8f0" fill-opacity=".25"/>
      <path d="M14 14h4M26 14h4" stroke="#cbd5e1" stroke-width="1.4" stroke-linecap="round"/>
    </svg>`;
  }
  return `<svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
    <rect x="6" y="12" width="32" height="26" rx="3" fill="${fill}" fill-opacity=".55" stroke="${fill}" stroke-width="1.5"/>
    <rect x="5" y="8" width="34" height="7" rx="2" fill="${fill}" stroke="#0f172a33" stroke-width="1"/>
    <rect x="10" y="20" width="18" height="10" rx="1" fill="#fff" fill-opacity=".35"/>
  </svg>`;
}

function snapShelfZ(z, brand) {
  const n = Math.round(Number(z) || 0);
  const step = shelfStepForBrand(brand);
  if (brand === 'SE 750кг' || brand === 'Профи-Т 2500кг') {
    return Math.max(SHELF_PLATE, Math.round(n / step) * step);
  }
  return Math.max(SHELF_PLATE, n);
}

function defaultShelfZs(h, n, brand) {
  const count = Math.max(SHELF_MIN, Math.min(SHELF_MAX, Number(n) || 5));
  const height = Math.max(400, Number(h) || 1800);
  const step = shelfStepForBrand(brand);
  let first = snapShelfZ(Math.min(150, Math.round(height * 0.08)), brand);
  let last = snapShelfZ(height - Math.min(250, Math.round(height * 0.08)), brand);
  if (last <= first + step) last = snapShelfZ(height - 50, brand);
  const zs = [];
  for (let i = 0; i < count; i++) {
    const raw = count === 1 ? first : first + i * (last - first) / (count - 1);
    zs.push(snapShelfZ(raw, brand));
  }
  for (let i = 1; i < zs.length; i++) {
    if (zs[i] <= zs[i - 1]) zs[i] = zs[i - 1] + step;
  }
  while (zs.length && zs[zs.length - 1] >= height) zs[zs.length - 1] -= step;
  return zs;
}

function ensureShelfLayout(item) {
  if (!isShelfRack(item)) return item;
  const n = Math.max(SHELF_MIN, Math.min(SHELF_MAX, Number(item.shelves) || 5));
  item.shelves = n;
  const step = shelfStepForBrand(item.brand);
  if (!Array.isArray(item.shelfZs) || item.shelfZs.length !== n) {
    item.shelfZs = defaultShelfZs(item.h, n, item.brand);
  } else {
    item.shelfZs = item.shelfZs.map(z => snapShelfZ(z, item.brand));
    for (let i = 1; i < item.shelfZs.length; i++) {
      if (item.shelfZs[i] <= item.shelfZs[i - 1]) item.shelfZs[i] = item.shelfZs[i - 1] + step;
    }
    item.shelfZs = item.shelfZs.map(z => Math.min(item.h - SHELF_PLATE, Math.max(SHELF_PLATE, z)));
  }
  if (!Array.isArray(item.contents)) item.contents = [];
  item.contents = item.contents.map(c => {
    const normalized = normalizeCargo(c, n);
    return normalized;
  });
  for (let s = 0; s < n; s++) reindexShelfOrders(item, s);
  activeShelfIndex = Math.max(0, Math.min(n - 1, activeShelfIndex));
  return item;
}

function shelfClearance(item, shelfIndex) {
  ensureShelfLayout(item);
  const z = item.shelfZs[shelfIndex];
  const top = shelfIndex < item.shelfZs.length - 1 ? item.shelfZs[shelfIndex + 1] - SHELF_PLATE : item.h;
  return Math.max(0, top - z);
}

function shelfCargo(item, shelfIndex) {
  return (item.contents || [])
    .filter(c => c.shelfIndex === shelfIndex)
    .sort((a, b) => (a.order || 0) - (b.order || 0) || String(a.id).localeCompare(String(b.id)));
}

function shelfIssues(item) {
  if (!isShelfRack(item)) return [];
  ensureShelfLayout(item);
  const issues = [];
  for (let i = 0; i < item.shelves; i++) {
    const clear = shelfClearance(item, i);
    const cargo = shelfCargo(item, i);
    const widthUsed = cargo.reduce((s, c) => s + (c.w || 0), 0);
    if (widthUsed > item.w) issues.push(`Полка ${i + 1}: сумма ширин ${widthUsed} > ${item.w} мм`);
    for (const c of cargo) {
      if (c.h > clear) issues.push(`«${c.name}» на полке ${i + 1}: нужно ${c.h} мм, просвет ${clear} мм`);
      if (c.d > item.d) issues.push(`«${c.name}» глубже полки (${c.d} > ${item.d} мм)`);
    }
  }
  return issues;
}

function findCatalogModel(modelId) {
  for (const k of Object.keys(CATALOG)) {
    const found = CATALOG[k].find(m => m.id === modelId);
    if (found) return found;
  }
  const se = /^se_(\d+)_(\d+)$/.exec(modelId || '');
  // Несуществующие пары (например 700×700) приводим к ближайшему покупаемому размеру.
  if (se) return makeSeModel(Number(se[1]), Number(se[2]));
  const pt = /^pt_(\d+)_(\d+)$/.exec(modelId || '');
  if (pt) return makePtModel(Number(pt[1]), Number(pt[2]));
  return null;
}

function isShelfRack(item) {
  return !!(item && !item.isBike && !item.isSki && !item.isLadder);
}

function catalogRacksForBrand(brand) {
  return Object.values(CATALOG).flat().filter(m => m.brand === brand && !m.isBike && !m.isSki && !m.isLadder && !m.isCargo);
}
function rackSizeOptions(item, key) {
  if (item.brand === 'SE 750кг') {
    if (key === 'w') return SE_WIDTHS.slice();
    return seDepthsForWidth(item.w);
  }
  if (item.brand === 'Профи-Т 2500кг') {
    if (key === 'w') return PT_WIDTHS.slice();
    return PT_DEPTHS.slice();
  }
  // Для каталожных брендов — только размеры, которые реально есть в паре с другой стороной.
  const sizes = new Set();
  for (const m of catalogRacksForBrand(item.brand)) {
    if (key === 'w') sizes.add(m.w);
    else if (m.w === item.w) sizes.add(m.d);
  }
  if (!sizes.size) sizes.add(item[key]);
  return [...sizes].sort((a, b) => a - b);
}

function setRackDimension(uid, key, value) {
  const item = items.find(i => i.uid === uid);
  if (!isShelfRack(item) || !['w', 'd'].includes(key)) return;
  const n = Number(value);
  if (!Number.isFinite(n) || !rackSizeOptions(item, key).includes(n)) return;
  closeObjectMenu();
  item[key] = n;
  if (item.brand === 'SE 750кг' || item.brand === 'Профи-Т 2500кг') {
    normalizeBuyableRack(item);
  } else {
    let match = catalogRacksForBrand(item.brand).find(m => m.w === item.w && m.d === item.d);
    if (!match) {
      const candidates = catalogRacksForBrand(item.brand).filter(m => key === 'w' ? m.w === item.w : m.d === item.d);
      match = candidates[0] || catalogRacksForBrand(item.brand)[0];
      if (match) { item.w = match.w; item.d = match.d; }
    }
    if (match) Object.assign(item, { modelId: match.id, name: match.name, h: match.h, price: match.price, color: match.color, w: match.w, d: match.d });
  }
  ensureShelfLayout(item);
  if (!item.free) {
    const max = WALL_INFO[item.wall].maxLen - placedSize(item).w;
    item.offset = Math.max(0, Math.min(item.offset, Math.max(0, max)));
  }
  selectedId = uid;
  refreshAll();
}

function renderBuyableSizeControls(item) {
  if (item.brand === 'SE 750кг') {
    const widths = SE_WIDTHS;
    const depths = seDepthsForWidth(item.w);
    return `
      <div class="note">Только размеры из каталога СтелТех SE 750кг (высота ${SE_HEIGHT} мм).</div>
      <label class="inspector-row">Ширина, мм
        <select aria-label="w" onchange="setRackDimension(${item.uid},'w',this.value)">
          ${widths.map(w => `<option value="${w}" ${w === item.w ? 'selected' : ''}>${w}</option>`).join('')}
        </select>
      </label>
      <label class="inspector-row">Глубина, мм
        <select aria-label="d" onchange="setRackDimension(${item.uid},'d',this.value)">
          ${depths.map(d => `<option value="${d}" ${d === item.d ? 'selected' : ''}>${d}</option>`).join('')}
        </select>
      </label>
      <label class="inspector-row">Высота, мм<input aria-label="h" type="number" value="${SE_HEIGHT}" disabled title="У SE в планировщике только ${SE_HEIGHT} мм"></label>
      ${['gap','z'].map((k,j)=>`<label class="inspector-row">${['Отступ от стены','Низ над полом'][j]}<input type="number" aria-label="${k}" min="0" max="5000" value="${item[k]||0}" onchange="editDimension(${item.uid},'${k}',this.value)"></label>`).join('')}
    `;
  }
  if (item.brand === 'Профи-Т 2500кг') {
    return `
      <div class="note">Профи-Т 2500кг · СтелТех: высота только ${PT_HEIGHT} мм, настил фанера.</div>
      <label class="inspector-row">Ширина, мм
        <select aria-label="w" onchange="setRackDimension(${item.uid},'w',this.value)">
          ${PT_WIDTHS.map(w => `<option value="${w}" ${w === item.w ? 'selected' : ''}>${w}</option>`).join('')}
        </select>
      </label>
      <label class="inspector-row">Глубина, мм
        <select aria-label="d" onchange="setRackDimension(${item.uid},'d',this.value)">
          ${PT_DEPTHS.map(d => `<option value="${d}" ${d === item.d ? 'selected' : ''}>${d}</option>`).join('')}
        </select>
      </label>
      <label class="inspector-row">Высота, мм<input aria-label="h" type="number" value="${PT_HEIGHT}" disabled title="В планировщике только ${PT_HEIGHT} мм"></label>
      ${['gap','z'].map((k,j)=>`<label class="inspector-row">${['Отступ от стены','Низ над полом'][j]}<input type="number" aria-label="${k}" min="0" max="5000" value="${item[k]||0}" onchange="editDimension(${item.uid},'${k}',this.value)"></label>`).join('')}
    `;
  }
  if (item.brand === 'Лемана ПРО') {
    const widths = rackSizeOptions(item, 'w');
    const depths = rackSizeOptions(item, 'd');
    return `
      <div class="note">Только размеры из каталога «Лемана ПРО».</div>
      <label class="inspector-row">Ширина, мм
        <select aria-label="w" onchange="setRackDimension(${item.uid},'w',this.value)">
          ${widths.map(w => `<option value="${w}" ${w === item.w ? 'selected' : ''}>${w}</option>`).join('')}
        </select>
      </label>
      <label class="inspector-row">Глубина, мм
        <select aria-label="d" onchange="setRackDimension(${item.uid},'d',this.value)">
          ${depths.map(d => `<option value="${d}" ${d === item.d ? 'selected' : ''}>${d}</option>`).join('')}
        </select>
      </label>
      <label class="inspector-row">Высота, мм<input aria-label="h" type="number" value="${item.h}" disabled></label>
      ${['gap','z'].map((k,j)=>`<label class="inspector-row">${['Отступ от стены','Низ над полом'][j]}<input type="number" aria-label="${k}" min="0" max="5000" value="${item[k]||0}" onchange="editDimension(${item.uid},'${k}',this.value)"></label>`).join('')}
    `;
  }
  return `
    <div class="note">Размеры вдоль стены × глубина × высота, мм</div>
    ${['w','d','h','gap','z'].map((k,j)=>`<label class="inspector-row">${['Ширина вдоль стены','Глубина','Высота','Отступ от стены','Низ над полом'][j]}<input type="number" aria-label="${k}" min="${k==='gap'||k==='z'?0:1}" max="5000" value="${item[k]||0}" onchange="editDimension(${item.uid},'${k}',this.value)"></label>`).join('')}
  `;
}

// Вычисление мировых 2D координат прямоугольника объекта (x, y, width, height)
function getItemRect(item) {
  if(item.free){const size=placedSize(item);return {x:item.x||0,y:item.y||0,width:item.wall==='top'?size.w:size.d,height:item.wall==='top'?size.d:size.w};}
  const w = placedSize(item).w; // rotated footprint along wall
  const d = placedSize(item).d; const gap = item.gap || 0; // wall clearance
  if (item.wall === 'top') {
    return { x: item.offset, y: gap, width: w, height: d };
  } else if (item.wall === 'left') {
    return { x: gap, y: item.offset, width: d, height: w };
  } else if (item.wall === 'right_top') {
    return { x: 1468 - gap - d, y: item.offset, width: d, height: w };
  } else if (item.wall === 'right_bot') {
    return { x: 1779 - gap - d, y: 1394 + item.offset, width: d, height: w };
  }
  return { x: 0, y: 0, width: w, height: d };
}

function addItem(modelId, wall = 'left', offset = 0) {
  const m = findCatalogModel(modelId);
  if (!m || m.isCargo) return;
  if(items.length>=100){toast('В проекте не более 100 объектов');return;}
  const maxOffset = Math.max(0, WALL_INFO[wall].maxLen - m.w);
  const clampedOffset = Math.min(Math.max(0, offset), maxOffset);
  const newItem = {
    uid: nextUid++,
    modelId: m.id,
    brand: m.brand,
    name: m.name,
    w: m.w,
    d: m.d,
    h: m.h,
    shelves: m.shelves,
    price: m.price,
    color: m.color,
    isBike: !!m.isBike,
    bikeMode: m.bikeMode || null,
    isLadder: !!m.isLadder, isSki: !!m.isSki, z: m.z || 0, gap: 20,
    wall: wall,
    offset: clampedOffset,
    contents: [],
    shelfZs: null
  };
  if (isShelfRack(newItem)) ensureShelfLayout(newItem);
  items.push(newItem);
  selectedId = newItem.uid;
  refreshAll();
}

function addCargoToRack(rackUid, modelId, shelfIndex) {
  const rack = items.find(i => i.uid === rackUid);
  const m = findCatalogModel(modelId);
  if (!isShelfRack(rack) || !m?.isCargo) { toast('Сначала выберите стеллаж на плане'); return; }
  ensureShelfLayout(rack);
  const idx = Math.max(0, Math.min(rack.shelves - 1, Number(shelfIndex ?? activeShelfIndex) || 0));
  if ((rack.contents || []).length >= 40) { toast('На одном стеллаже не более 40 предметов'); return; }
  const order = shelfCargo(rack, idx).length;
  const cargo = makeCargoInstance(m, idx, order);
  rack.contents.push(cargo);
  activeShelfIndex = idx;
  selectedId = rackUid;
  selectedCargoId = cargo.id;
  refreshAll();
  const clear = shelfClearance(rack, idx);
  if (m.h > clear) toast(`${cargo.id}: добавлено на полку ${idx + 1}, но высоты ${m.h} мм не хватает (просвет ${clear} мм)`);
  else toast(`${cargo.id}: на полку ${idx + 1}`);
}

function applyPreset(presetName) {
  items = [];
  nextUid = 1;
  nextCargoId = 1;
  activeShelfIndex = 0;
  selectedCargoId = null;
  if (presetName === 'se_bike') {
    addItem('se_900_500','top',550);
    addItem('se_1200_500','left',40);
    addItem('se_700_300','right_top',600);
    addItem('bike_vert','right_bot',56);
  } else if (presetName === 'lm_bike') {
    addItem('lm_900_400','top',550);
    addItem('lm_1000_500','left',40);
    addItem('lm_700_300','right_top',600);
    addItem('bike_vert','right_bot',56);
  } else if (presetName === 'se_full') {
    // Полная смета со скриншота (7 стеллажей = 56 827 руб)
    addItem('se_900_500',  'top', 500);
    addItem('se_1200_500', 'left', 0);
    addItem('se_1200_500', 'left', 1200);
    addItem('se_700_300',  'right_top', 0);
    addItem('se_700_300',  'right_top', 694);
    addItem('se_700_400',  'right_bot', 0);
    addItem('se_700_400',  'right_bot', 700);
  } else if (presetName === 'lm_full') {
    // Аналог Лемана ПРО (7 стеллажей = 36 865 руб)
    addItem('lm_900_400',  'top', 500);
    addItem('lm_1000_500', 'left', 0);
    addItem('lm_1000_500', 'left', 1000);
    addItem('lm_700_300',  'right_top', 0);
    addItem('lm_700_300',  'right_top', 694);
    addItem('lm_700_400',  'right_bot', 0);
    addItem('lm_700_400',  'right_bot', 700);
  }
  refreshAll();
}

function clearAll() {
  items = [];
  selectedId = null;
  refreshAll();
}

// ==========================================
// 2. РЕНДЕР КАТАЛОГА И ИНСПЕКТОРА
// ==========================================
function switchCatalogTab(tab, btnEl) {
  currentCatalogTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');
  renderCatalog();
}

function shelfWidthUsed(item, shelfIndex) {
  return shelfCargo(item, shelfIndex).reduce((s, c) => s + (c.w || 0), 0);
}

function renderCatalog() {
  const container = document.getElementById('catalogList');
  const list = CATALOG[currentCatalogTab] || [];
  if (currentCatalogTab === 'cargo') {
    const rack = items.find(i => i.uid === selectedId && isShelfRack(i));
    if (!rack) {
      container.innerHTML = '<div class="cargo-empty">Выберите стеллаж на 2D-плане.<br><span class="note">Потом сюда добавляют коробки и шины — чтобы понять число полок и нужный просвет.</span></div>';
      return;
    }
    ensureShelfLayout(rack);
    activeShelfIndex = Math.max(0, Math.min(rack.shelves - 1, activeShelfIndex));
    const clear = shelfClearance(rack, activeShelfIndex);
    const used = shelfWidthUsed(rack, activeShelfIndex);
    const left = Math.max(0, rack.w - used);
    container.innerHTML = `
      <div class="shelf-panel" style="margin:0 0 10px">
        <div class="shelf-panel-head">
          <div>
            <div class="shelf-panel-title">Стеллаж №${rack.uid}</div>
            <div class="note">Полка ${activeShelfIndex + 1}: просвет ${clear} мм · свободно ${left} из ${rack.w} мм</div>
          </div>
        </div>
        <div class="shelf-fill" aria-hidden="true"><span style="width:${Math.min(100, Math.round(used / Math.max(1, rack.w) * 100))}%"></span></div>
        <div class="shelf-chip-row">${rack.shelfZs.map((z, i) => `
          <button type="button" class="shelf-chip${i===activeShelfIndex?' active':''}" onclick="selectShelfIndex(${i})">
            <span class="shelf-chip-title">Полка ${i + 1}</span>
            <span class="shelf-chip-meta">${z} мм · ${shelfCargo(rack, i).length || 'пусто'}</span>
          </button>`).join('')}
        </div>
      </div>
      ${list.map(m => {
        const tall = m.h > clear;
        const wide = m.w > left;
        const deep = m.d > rack.d;
        const ok = !tall && !wide && !deep;
        const tip = ok ? 'Влезает' : [tall && `нужен просвет ≥ ${m.h}`, wide && `ширина ${m.w} > свободно ${left}`, deep && `глубина ${m.d} > ${rack.d}`].filter(Boolean).join(' · ');
        return `
        <div class="catalog-item${ok?'':' catalog-item-tight'}">
          <div class="catalog-item-top">
            <div style="display:flex;gap:10px;align-items:center">
              ${cargoThumbSvg(m)}
              <div>
                <div class="catalog-item-name">${m.name}</div>
                <div class="catalog-item-sub">${m.w}×${m.d}×${m.h} мм</div>
              </div>
            </div>
            <span class="fit-badge ${ok?'fit-ok':'fit-warn'}">${ok?'влезает':'тесно'}</span>
          </div>
          <div class="note" style="margin:4px 0 6px">${tip}</div>
          <div class="wall-add-btns">
            <button class="btn ${ok?'primary':''}" onclick="addCargoToRack(${rack.uid}, '${m.id}', ${activeShelfIndex})">+ На полку ${activeShelfIndex + 1}</button>
          </div>
        </div>`;
      }).join('')}`;
    return;
  }
  container.innerHTML = list.map(m => `
    <div class="catalog-item">
      <div class="catalog-item-top">
        <div>
          <div class="catalog-item-name">${m.name}</div>
          <div class="catalog-item-sub">Габариты: ${m.w}×${m.d} мм • Высота: ${m.h} мм</div>
        </div>
        <div class="catalog-item-price">${m.price > 0 ? m.price.toLocaleString('ru-RU') + ' ₽' : (m.brand === 'SE 750кг' ? 'уточнить' : 'Свой')}</div>
      </div>
      <div class="wall-add-btns">
        <button onclick="addItem('${m.id}', 'left', 0)">+ Левая</button>
        <button onclick="addItem('${m.id}', 'top', 0)">+ Верхняя</button>
        <button onclick="addItem('${m.id}', 'right_top', 0)">+ Прав.верх</button>
        <button onclick="addItem('${m.id}', 'right_bot', 0)">+ Прав.низ</button>
      </div>
    </div>
  `).join('');
}

function selectShelfIndex(index) {
  activeShelfIndex = Math.max(0, Number(index) || 0);
  renderCatalog();
  renderInspector();
}

function openCargoCatalog() {
  currentCatalogTab = 'cargo';
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.toggle('active', (b.getAttribute('onclick') || '').includes("'cargo'"));
  });
  renderCatalog();
}

function renderInspector() {
  const box = document.getElementById('inspectorContent');
  const badge = document.getElementById('selBadge');
  const item = items.find(i => i.uid === selectedId);
  if (!item) {
    badge.textContent = 'Нет выбора';
    badge.className = 'badge';
    box.innerHTML = 'Кликните на любой стеллаж или велосипед на 2D-плане, чтобы передвинуть его, перенести на другую стену или удалить.';
    return;
  }

  badge.textContent = item.brand;
  badge.className = 'badge ' + (item.isBike ? 'badge-bike' : (item.brand === 'SE 750кг' ? 'badge-se' : (item.brand === 'Профи-Т 2500кг' ? 'badge-pt' : 'badge-lm')));

  const wallMax = WALL_INFO[item.wall].maxLen;
  const maxOff = Math.max(0, wallMax - placedSize(item).w);

  let bikeControls = '';
  if (item.isBike) {
    bikeControls = `
      <div style="margin-bottom:8px;">
        <div style="font-weight:600; margin-bottom:4px;">Способ размещения велосипеда:</div>
        <div class="wall-add-btns">
          <button style="${item.bikeMode==='floor'?'background:#2563eb;color:#fff;':''}" onclick="setBikeMode(${item.uid}, 'floor')">На полу (500мм)</button>
          <button style="${item.bikeMode==='floor_turn'?'background:#2563eb;color:#fff;':''}" onclick="setBikeMode(${item.uid}, 'floor_turn')">Руль повёрнут (≈420мм)</button>
          <button style="${item.bikeMode==='vert'?'background:#2563eb;color:#fff;':''}" onclick="setBikeMode(${item.uid}, 'vert')">Колесом вверх</button>
        </div>
      </div>
    `;
  }

  box.innerHTML = `
    <div style="font-weight:700; color:var(--text); margin-bottom:6px;">${item.name}</div>
    <div class="wall-add-btns" style="margin-bottom:8px"><button onclick="rotateItem(${item.uid})">↻ Повернуть 90°</button><button onclick="duplicateItem(${item.uid})">＋ Копия</button></div>
    <div class="note">Поворот: ${item.rotation||0}°. На плане: ${placedSize(item).w} × ${placedSize(item).d} мм вдоль / от стены.</div>
    ${bikeControls}
    ${item.isBike?`<button class="btn" onclick="freeBike(${item.uid})">Поставить свободно между стеллажами</button><div class="note">Свободный режим: перетаскивайте в любую точку. Поворот — 90°. Выбор стены возвращает привязку.</div>`:''}
    ${item.free?`<div class="note">Свободное положение, мм от левого верхнего угла</div>${['x','y'].map(k=>`<label class="inspector-row">${k.toUpperCase()}<input aria-label="position-${k}" type="number" value="${item[k]||0}" onchange="editFreePosition(${item.uid},'${k}',this.value)"></label>`).join('')}`:''}
    ${item.isLadder?'<div class="note">Хранение в сложенном виде. Начальные размеры примерные — замените своими.</div>':''}
    ${item.isBike?`<fieldset style="margin:8px 0;border:1px solid #cbd5e1;border-radius:8px"><legend>Зона снятия велосипеда</legend>
    <label><input type="checkbox" ${item.clearanceVisible!==false?'checked':''} onchange="editBikeClearance(${item.uid},'clearanceVisible',this.checked)"> Показать в 2D и 3D</label>
    ${[['bikeLength','Длина велосипеда',1700],['handlingSpace','Запас для человека',600],['liftSpace','Подъём с крюка',150]].map(([k,label,v])=>`<label class="inspector-row">${label}, мм<input aria-label="${k}" type="number" min="0" max="5000" value="${item[k]??v}" onchange="editBikeClearance(${item.uid},'${k}',this.value)"></label>`).join('')}
    <div class="note">Обмер велосипеда: 1700×500×1000 мм (Д×Ш×В). При подвесе: 500×1000×1700 мм без крепления. Ширина с повёрнутым рулём пока оценочная.</div><div class="note">Оценочный объём для опускания и манёвра. Не проверяет весь путь через дверь. Размеры уточните по велосипеду и креплению.</div></fieldset>`:''}
    ${renderBuyableSizeControls(item)}
    ${isShelfRack(item)?renderShelfInspector(item):''}

    <div style="margin-bottom:8px;">
      <div style="margin-bottom:4px;">Привязка к стене:</div>
      <div class="wall-add-btns">
        <button style="${item.wall==='left'?'background:#2563eb;color:#fff;':''}" onclick="changeItemWall(${item.uid}, 'left')">Левая</button>
        <button style="${item.wall==='top'?'background:#2563eb;color:#fff;':''}" onclick="changeItemWall(${item.uid}, 'top')">Верхняя</button>
        <button style="${item.wall==='right_top'?'background:#2563eb;color:#fff;':''}" onclick="changeItemWall(${item.uid}, 'right_top')">Прав.верх</button>
        <button style="${item.wall==='right_bot'?'background:#2563eb;color:#fff;':''}" onclick="changeItemWall(${item.uid}, 'right_bot')">Прав.низ</button>
      </div>
    </div>
    <div class="inspector-row">
      <span>Сдвиг вдоль стены (мм):</span>
      <input type="number" value="${Math.round(item.offset)}" min="-500" max="${wallMax}" onchange="updateItemOffset(${item.uid}, this.value)">
    </div>
    <div class="inspector-row">
      <input type="range" min="-300" max="${Math.max(100, maxOff + 300)}" value="${Math.round(item.offset)}" oninput="updateItemOffset(${item.uid}, this.value)">
    </div>
    <div style="display:flex; gap:6px; margin-top:6px;">
      <button class="btn" style="flex:1;" onclick="snapItemToNeighbor(${item.uid})">🧲 Вплотную к углу/соседу</button>
      <button class="btn danger" onclick="deleteItem(${item.uid})">🗑 Удалить</button>
    </div>
  `;
}

function renderShelfInspector(item) {
  ensureShelfLayout(item);
  const issues = shelfIssues(item);
  const cargoCount = (item.contents || []).length;
  const active = Math.max(0, Math.min(item.shelves - 1, activeShelfIndex));
  const clear = shelfClearance(item, active);
  const cargo = shelfCargo(item, active);
  const used = shelfWidthUsed(item, active);
  const fillPct = Math.min(100, Math.round(used / Math.max(1, item.w) * 100));
  const fillOver = used > item.w;
  const shelfChips = item.shelfZs.map((z, i) => {
    const n = shelfCargo(item, i).length;
    const gapMm = shelfClearance(item, i);
    const gapCm = Math.round(gapMm / 10);
    const bad = shelfCargo(item, i).some(c => c.h > gapMm) || shelfWidthUsed(item, i) > item.w;
    return `<button type="button" class="shelf-chip${i===active?' active':''}${bad?' warn':''}" data-shelf-drop="${i}" onclick="selectShelfIndex(${i})" role="tab" aria-selected="${i===active}">
      <span class="shelf-chip-title">Полка ${i + 1}</span>
      <span class="shelf-chip-meta">${z} мм · ${gapCm} см${n?` · ${n}`:' · пусто'}${bad?' · !':''}</span>
    </button>`;
  }).join('');
  const cargoCards = cargo.map((c, idx) => {
    const sel = selectedCargoId === c.id;
    const fits = c.h <= clear && c.d <= item.d;
    const shelfOpts = item.shelfZs.map((_, s) => `<option value="${s}" ${s===c.shelfIndex?'selected':''}>→ полка ${s + 1}</option>`).join('');
    return `<article class="cargo-card${sel?' selected':''}${fits?'':' problem'}" data-cargo-id="${c.id}" data-cargo-index="${idx}" data-rack-uid="${item.uid}" tabindex="0" aria-selected="${sel}" aria-grabbed="false">
      <div class="cargo-card-main">
        <span class="cargo-drag-handle" title="Перетащить" aria-hidden="true">⋮⋮</span>
        ${cargoThumbSvg({id:c.modelId,color:c.color})}
        <div class="cargo-card-text">
          <div class="cargo-card-top"><span class="cargo-id">${c.id}</span>${fits?'':'<span class="cargo-flag">не влезает</span>'}</div>
          <div class="cargo-card-name">${c.name}</div>
          <div class="cargo-card-meta">${c.w}×${c.d}×${c.h} мм</div>
        </div>
      </div>
      <div class="cargo-card-actions${sel?' open':''}">
        <button type="button" class="btn icon" title="Левее на полке" aria-label="Левее" ${idx===0?'disabled':''} onclick="reorderCargo(${item.uid}, '${c.id}', -1)">←</button>
        <button type="button" class="btn icon" title="Правее на полке" aria-label="Правее" ${idx===cargo.length-1?'disabled':''} onclick="reorderCargo(${item.uid}, '${c.id}', 1)">→</button>
        <select class="cargo-shelf-select" aria-label="Перенести ${c.id}" onchange="moveCargoToShelf(${item.uid}, '${c.id}', this.value)">${shelfOpts}</select>
        <button type="button" class="btn" onclick="editCargoSize(${item.uid}, '${c.id}')">Размер</button>
        <button type="button" class="btn danger icon" title="Удалить" aria-label="Удалить ${c.id}" onclick="removeCargo(${item.uid}, '${c.id}')">✕</button>
      </div>
      ${sel?'':'<div class="cargo-card-hint">⋮⋮ перетащить · ← → · на чип полки</div>'}
    </article>`;
  }).join('');
  return `
    <section class="shelf-panel" data-rack-uid="${item.uid}">
      <div class="shelf-panel-head">
        <div>
          <div class="shelf-panel-title">Полки и вещи</div>
          <div class="note">${item.shelves} полок · ${cargoCount} вещей${issues.length?` · ${issues.length} проблем`:''}</div>
        </div>
        <button type="button" class="btn primary" onclick="openCargoCatalog()">+ Вещь</button>
      </div>
      <div class="shelf-toolbar">
        <label class="inspector-row shelf-count">Полок
          <input type="number" aria-label="shelves" min="${SHELF_MIN}" max="${SHELF_MAX}" value="${item.shelves}" onchange="setShelfCount(${item.uid}, this.value)">
        </label>
        <button type="button" class="btn" onclick="redistributeShelves(${item.uid})">Выровнять высоты</button>
      </div>
      ${item.brand==='SE 750кг'?`<div class="note">Цена: стойки ${SE_POSTS_PRICE.toLocaleString('ru-RU')} ₽ + ${item.shelves}× SE-140 ${seShelfUnitPrice(item.w,item.d).toLocaleString('ru-RU')} ₽ = <b>${(item.price||0).toLocaleString('ru-RU')} ₽</b></div>`:''}
      ${item.brand==='Профи-Т 2500кг'?`<div class="note">Цена: стойки ${PT_POSTS_PRICE.toLocaleString('ru-RU')} ₽ + ${item.shelves}× ярус (фанера) ${ptShelfUnitPrice(item.w,item.d).toLocaleString('ru-RU')} ₽ = <b>${(item.price||0).toLocaleString('ru-RU')} ₽</b></div>`:''}
      <div class="shelf-chip-row" role="tablist" aria-label="Полки стеллажа">${shelfChips}</div>
      <div class="note" aria-label="Расстояния между полками">${item.shelfZs.map((_, i) => `№${i + 1}: ${Math.round(shelfClearance(item, i) / 10)} см`).join(' · ')}</div>
      <div class="shelf-active">
        <label class="inspector-row">Высота полки ${active + 1}, мм от низа
          <input type="number" aria-label="shelf-z-${active}" min="${SHELF_PLATE}" max="${item.h - SHELF_PLATE}" step="${shelfStepForBrand(item.brand)}" value="${item.shelfZs[active]}" onchange="setShelfZ(${item.uid}, ${active}, this.value)">
        </label>
        <div class="note">Между полками: <b>${Math.round(clear/10)} см</b> (${clear} мм просвет) · ширина <b>${used}</b> / ${item.w} мм${item.brand==='SE 750кг'?' · шаг 25 мм':(item.brand==='Профи-Т 2500кг'?' · шаг 45 мм':'')}</div>
        <div class="shelf-fill${fillOver?' over':''}" role="meter" aria-valuemin="0" aria-valuemax="${item.w}" aria-valuenow="${used}" aria-label="Занятость полки по ширине"><span style="width:${fillPct}%"></span></div>
      </div>
      <div class="cargo-list" data-rack-uid="${item.uid}">
        ${cargoCards || `<div class="cargo-empty" data-shelf-drop="${active}">На этой полке пусто.<br><button type="button" class="btn primary" onclick="openCargoCatalog()">Добавить из каталога</button></div>`}
      </div>
      ${issues.length?`<div class="warn">${issues[0]}${issues.length>1?` (+ ещё ${issues.length-1})`:''}</div>`:(cargoCount?`<div class="ok">По высоте и ширине всё помещается.</div>`:'')}
    </section>`;
}

function setShelfCount(uid, value) {
  const item = items.find(i => i.uid === uid);
  if (!isShelfRack(item)) return;
  const n = Math.max(SHELF_MIN, Math.min(SHELF_MAX, Math.round(Number(value) || 5)));
  item.shelves = n;
  item.shelfZs = defaultShelfZs(item.h, n, item.brand);
  if (item.brand === 'SE 750кг') {
    item.price = seRackPrice(item.w, item.d, n);
  } else if (item.brand === 'Профи-Т 2500кг') {
    item.price = ptRackPrice(item.w, item.d, n);
  }
  ensureShelfLayout(item);
  refreshAll();
}

function setShelfZ(uid, index, value) {
  const item = items.find(i => i.uid === uid);
  if (!isShelfRack(item)) return;
  ensureShelfLayout(item);
  if (index < 0 || index >= item.shelfZs.length) return;
  item.shelfZs[index] = snapShelfZ(value, item.brand);
  ensureShelfLayout(item);
  refreshAll();
}

function redistributeShelves(uid) {
  const item = items.find(i => i.uid === uid);
  if (!isShelfRack(item)) return;
  ensureShelfLayout(item);
  item.shelfZs = defaultShelfZs(item.h, item.shelves, item.brand);
  refreshAll();
  toast('Высоты полок выровнены');
}

function removeCargo(rackUid, cargoId) {
  const rack = items.find(i => i.uid === rackUid);
  if (!isShelfRack(rack)) return;
  ensureShelfLayout(rack);
  const victim = findCargo(rack, cargoId);
  if (!victim) return;
  rack.contents = rack.contents.filter(c => c.id !== victim.id);
  reindexShelfOrders(rack, victim.shelfIndex);
  if (selectedCargoId === cargoId || selectedCargoId === victim.id) selectedCargoId = null;
  refreshAll();
}

function editCargoSize(rackUid, cargoId) {
  const rack = items.find(i => i.uid === rackUid);
  if (!isShelfRack(rack)) return;
  ensureShelfLayout(rack);
  const cargo = findCargo(rack, cargoId);
  if (!cargo) return;
  selectedCargoId = cargo.id;
  const w = prompt('Ширина предмета, мм', String(cargo.w));
  if (w == null) return;
  const d = prompt('Глубина предмета, мм', String(cargo.d));
  if (d == null) return;
  const h = prompt('Высота предмета, мм', String(cargo.h));
  if (h == null) return;
  const nw = Math.round(Number(w)), nd = Math.round(Number(d)), nh = Math.round(Number(h));
  if (![nw, nd, nh].every(n => Number.isFinite(n) && n >= 1 && n <= 3000)) { toast('Некорректные размеры'); return; }
  cargo.w = nw; cargo.d = nd; cargo.h = nh;
  if (cargo.modelId === 'custom_cargo' || cargo.kind === 'box') cargo.name = `Свой предмет ${nw}×${nd}×${nh}`;
  refreshAll();
}

function selectCargo(cargoId) {
  selectedCargoId = cargoId;
  const rack = items.find(i => isShelfRack(i) && findCargo(i, cargoId));
  if (rack) {
    selectedId = rack.uid;
    const c = findCargo(rack, cargoId);
    if (c) activeShelfIndex = c.shelfIndex;
  }
  refreshAll();
}

function placeCargo(rackUid, cargoId, toShelf, toIndex) {
  const rack = items.find(i => i.uid === rackUid);
  if (!isShelfRack(rack)) return false;
  ensureShelfLayout(rack);
  const cargo = findCargo(rack, cargoId);
  if (!cargo) return false;
  const from = cargo.shelfIndex;
  const targetShelf = Math.max(0, Math.min(rack.shelves - 1, Number(toShelf)));
  const oldIndex = shelfCargo(rack, from).findIndex(c => c.id === cargo.id);
  const dest = shelfCargo(rack, targetShelf).filter(c => c.id !== cargo.id);
  const idx = Math.max(0, Math.min(dest.length, Number.isFinite(Number(toIndex)) ? Number(toIndex) : dest.length));
  if (from === targetShelf && oldIndex === idx) return false;
  cargo.shelfIndex = targetShelf;
  dest.splice(idx, 0, cargo);
  dest.forEach((c, i) => { c.order = i; });
  if (from !== targetShelf) reindexShelfOrders(rack, from);
  activeShelfIndex = targetShelf;
  selectedCargoId = cargo.id;
  refreshAll();
  return true;
}

function moveCargoToShelf(rackUid, cargoId, shelfIndex) {
  const rack = items.find(i => i.uid === rackUid);
  if (!isShelfRack(rack)) return;
  ensureShelfLayout(rack);
  const cargo = findCargo(rack, cargoId);
  if (!cargo) return;
  const to = Math.max(0, Math.min(rack.shelves - 1, Number(shelfIndex)));
  if (to === cargo.shelfIndex) return;
  placeCargo(rackUid, cargoId, to, shelfCargo(rack, to).length);
  toast(`${cargoId} → полка ${to + 1}`);
}

function reorderCargo(rackUid, cargoId, direction) {
  const rack = items.find(i => i.uid === rackUid);
  if (!isShelfRack(rack)) return;
  ensureShelfLayout(rack);
  const cargo = findCargo(rack, cargoId);
  if (!cargo) return;
  const list = shelfCargo(rack, cargo.shelfIndex);
  const idx = list.findIndex(c => c.id === cargo.id);
  const swapWith = idx + (direction < 0 ? -1 : 1);
  if (idx < 0 || swapWith < 0 || swapWith >= list.length) return;
  placeCargo(rackUid, cargoId, cargo.shelfIndex, swapWith);
}

let cargoDrag = null;

function clearCargoDropMarks() {
  document.querySelectorAll('.cargo-card.drag-over-before,.cargo-card.drag-over-after,.shelf-chip.drag-target,.cargo-list.drag-active,.cargo-card.dragging').forEach(el => {
    el.classList.remove('drag-over-before', 'drag-over-after', 'drag-target', 'drag-active', 'dragging');
    if (el.hasAttribute('aria-grabbed')) el.setAttribute('aria-grabbed', 'false');
  });
}

function endCargoDrag(commit) {
  if (!cargoDrag) return;
  const state = cargoDrag;
  cargoDrag = null;
  window.removeEventListener('pointermove', onCargoDragMove);
  window.removeEventListener('pointerup', onCargoDragUp);
  window.removeEventListener('pointercancel', onCargoDragCancel);
  clearCargoDropMarks();
  if (!commit || !state.moved) {
    if (!state.moved && state.cargoId) selectCargo(state.cargoId);
    return;
  }
  if (state.dropShelf != null && state.dropShelf !== state.fromShelf) {
    placeCargo(state.rackUid, state.cargoId, state.dropShelf, Number.POSITIVE_INFINITY);
    toast(`${state.cargoId} → полка ${state.dropShelf + 1}`);
    return;
  }
  if (state.dropIndex != null) {
    placeCargo(state.rackUid, state.cargoId, state.fromShelf, state.dropIndex);
  }
}

function onCargoDragCancel() { endCargoDrag(false); }

function onCargoDragMove(e) {
  if (!cargoDrag) return;
  const dx = e.clientX - cargoDrag.x;
  const dy = e.clientY - cargoDrag.y;
  if (!cargoDrag.moved && Math.hypot(dx, dy) < 6) return;
  if (!cargoDrag.moved) {
    cargoDrag.moved = true;
    const card = document.querySelector(`.cargo-card[data-cargo-id="${cargoDrag.cargoId}"]`);
    card?.classList.add('dragging');
    card?.setAttribute('aria-grabbed', 'true');
    document.querySelector('.cargo-list')?.classList.add('drag-active');
    try { card?.setPointerCapture?.(cargoDrag.pointerId); } catch (_) {}
  }
  e.preventDefault();
  clearCargoDropMarks();
  document.querySelector(`.cargo-card[data-cargo-id="${cargoDrag.cargoId}"]`)?.classList.add('dragging');
  document.querySelector('.cargo-list')?.classList.add('drag-active');
  const under = document.elementFromPoint(e.clientX, e.clientY);
  const chip = under?.closest?.('[data-shelf-drop]');
  if (chip) {
    const shelf = Number(chip.getAttribute('data-shelf-drop'));
    cargoDrag.dropShelf = shelf;
    cargoDrag.dropIndex = null;
    chip.classList.add('drag-target');
    return;
  }
  cargoDrag.dropShelf = null;
  const overCard = under?.closest?.('.cargo-card:not(.dragging)');
  const list = document.querySelector('.cargo-list');
  if (overCard && list?.contains(overCard)) {
    const rect = overCard.getBoundingClientRect();
    const before = e.clientY < rect.top + rect.height / 2;
    const overIndex = Number(overCard.getAttribute('data-cargo-index'));
    let dropIndex = before ? overIndex : overIndex + 1;
    const fromIndex = cargoDrag.fromIndex;
    if (dropIndex > fromIndex) dropIndex -= 1;
    cargoDrag.dropIndex = dropIndex;
    overCard.classList.add(before ? 'drag-over-before' : 'drag-over-after');
    return;
  }
  if (list && under && list.contains(under)) {
    cargoDrag.dropIndex = shelfCargo(items.find(i => i.uid === cargoDrag.rackUid), cargoDrag.fromShelf).length - 1;
  }
}

function onCargoDragUp() { endCargoDrag(true); }

function startCargoDrag(e, card) {
  if (e.button != null && e.button !== 0) return;
  if (e.target.closest('button, select, input, a, .cargo-card-actions')) return;
  // На тачскрине drag только за ручку — иначе жест скролла перехватывается карточкой.
  const touchLike = e.pointerType === 'touch' || e.pointerType === 'pen';
  if (touchLike && !e.target.closest('.cargo-drag-handle')) return;
  const rackUid = Number(card.getAttribute('data-rack-uid'));
  const cargoId = card.getAttribute('data-cargo-id');
  const fromIndex = Number(card.getAttribute('data-cargo-index'));
  if (!cargoId || !Number.isFinite(rackUid)) return;
  const rack = items.find(i => i.uid === rackUid);
  if (!isShelfRack(rack)) return;
  const cargo = findCargo(rack, cargoId);
  if (!cargo) return;
  cargoDrag = {
    rackUid,
    cargoId,
    fromIndex,
    fromShelf: cargo.shelfIndex,
    x: e.clientX,
    y: e.clientY,
    pointerId: e.pointerId,
    moved: false,
    dropIndex: null,
    dropShelf: null
  };
  // Не захватываем pointer сразу — иначе на телефоне блокируется скролл страницы.
  window.addEventListener('pointermove', onCargoDragMove, { passive: false });
  window.addEventListener('pointerup', onCargoDragUp);
  window.addEventListener('pointercancel', onCargoDragCancel);
}

function bindCargoDrag() {
  const box = document.getElementById('inspectorContent');
  if (!box || box.dataset.cargoDrag === '1') return;
  box.dataset.cargoDrag = '1';
  box.addEventListener('pointerdown', e => {
    const card = e.target.closest('.cargo-card');
    if (!card || !box.contains(card)) return;
    startCargoDrag(e, card);
  });
}

function setBikeMode(uid, mode) {
  const item = items.find(i => i.uid === uid);
  const modelId = {floor:'bike_floor', floor_turn:'bike_floor_turn', vert:'bike_vert'}[mode];
  if (!item?.isBike || !modelId) return;
  closeObjectMenu();
  if (item.bikeMode !== mode) {
    item.bikeMode = mode;
    if(mode==='vert')item.free=false;
    item.modelId = modelId;
    item.w = mode === 'vert' ? 500 : 1700;
    item.d = mode === 'vert' ? 1000 : mode === 'floor_turn' ? 420 : 500;
    item.h = mode === 'vert' ? 1700 : 1000;
    item.rotation = 0;
    item.z = 0;
  }
  item.name = mode === 'vert' ? 'Велосипед на стене, колесом вверх' : mode === 'floor_turn' ? 'Велосипед на полу (повернут руль)' : 'Велосипед на полу (прямой руль)';
  selectedId = uid;
  refreshAll();
}

  function changeItemWall(uid, newWall) {
  const item = items.find(i => i.uid === uid);
  if (!item) return;
  item.free = false;
    item.wall = newWall;
  item.offset = 0;
  refreshAll();
}

function updateItemOffset(uid, val) {
  const item = items.find(i => i.uid === uid);
  if (!item) return;
  item.offset = parseFloat(val) || 0;
  refreshAll();
}

function snapItemToNeighbor(uid) {
  const item = items.find(i => i.uid === uid);
  if (!item) return;
  const sameWall = items.filter(i => i.wall === item.wall && i.uid !== item.uid).sort((a,b) => a.offset - b.offset);
  if (sameWall.length === 0) {
    // Если на верхней стене есть стеллаж слева, отступаем на его глубину
    if (item.wall === 'top') {
      const leftCorner = items.find(i => i.wall === 'left' && i.offset < 500);
      item.offset = leftCorner ? leftCorner.d : 0;
    } else {
      item.offset = 0;
    }
  } else {
    const last = sameWall[sameWall.length - 1];
    item.offset = last.offset + placedSize(last).w;
  }
  refreshAll();
}

function deleteItem(uid) {
  items = items.filter(i => i.uid !== uid);
  if (selectedId === uid) selectedId = items.length ? items[items.length - 1].uid : null;
  refreshAll();
}

// ==========================================
// 3. 2D SVG РЕНДЕР И DRAG-AND-DROP
// ==========================================
let dragState = null;

function render2D() {
  const svg = document.getElementById('plan2d');

  const topGap = largestGap(900), botGap = largestGap(2100);
  const leftMaxX = topGap[0], rightMinXTop = topGap[1], rightMinXBot = botGap[1];
  const passageTop = topGap[1]-topGap[0], passageBot = botGap[1]-botGap[0];
  let itemsSvg = items.map(item => {
    const r = getItemRect(item);
    const isSel = item.uid === selectedId;
    const stroke = isSel ? '#dc2626' : '#0f172a';
    const strokeW = isSel ? 16 : 8;

    if (item.isBike) {
      // Иконка велосипеда сверху
      const cx = r.x + r.width / 2;
      const cy = r.y + r.height / 2;
      const isVertWall = (item.wall === 'left' || item.wall === 'right_top' || item.wall === 'right_bot');
      return `
        <g class="draggable" data-uid="${item.uid}" style="cursor:move;">
          <rect x="${r.x}" y="${r.y}" width="${r.width}" height="${r.height}"
                fill="${item.color}" fill-opacity="0.22" stroke="${stroke}" stroke-width="${strokeW}" stroke-dasharray="18,10" rx="20"/>
          <g class="bike-heading" transform="translate(${cx} ${cy}) rotate(${bikeHeading(item)})">
            <line x1="${-(item.bikeMode==='vert'?item.d:item.w)*.4}" y1="0" x2="${(item.bikeMode==='vert'?item.d:item.w)*.4}" y2="0" stroke="#b45309" stroke-width="26" stroke-linecap="round"/>
            <line x1="${(item.bikeMode==='vert'?item.d:item.w)*.3}" y1="${-(item.bikeMode==='vert'?item.w:item.d)*.36}" x2="${(item.bikeMode==='vert'?item.d:item.w)*.3}" y2="${(item.bikeMode==='vert'?item.w:item.d)*.36}" stroke="#1e293b" stroke-width="18" stroke-linecap="round"/>
            <path d="M -30,-45 L 45,0 L -30,45" fill="none" stroke="#92400e" stroke-width="12"/>
          </g>
          <text x="${cx}" y="${cy+85}" fill="#7c2d12" font-size="56" font-weight="bold" text-anchor="middle" dominant-baseline="middle"
                transform="${isVertWall ? `rotate(-90 ${cx},${cy})` : ''}">
            🚲 ${item.w}×${item.d}
          </text>
        </g>
      `;
    }

    const isVert = (item.wall === 'left' || item.wall === 'right_top' || item.wall === 'right_bot');
    const cx = r.x + r.width / 2;
    const cy = r.y + r.height / 2;

    return `
      <g class="draggable" data-uid="${item.uid}" style="cursor:move;">
        <rect x="${r.x}" y="${r.y}" width="${r.width}" height="${r.height}"
              fill="${item.color}" fill-opacity="0.28" stroke="${stroke}" stroke-width="${strokeW}" rx="8"/>
        <!-- Стойки по углам -->
        <rect x="${r.x+6}" y="${r.y+6}" width="24" height="24" fill="${item.color}"/>
        <rect x="${r.x+r.width-30}" y="${r.y+6}" width="24" height="24" fill="${item.color}"/>
        <rect x="${r.x+6}" y="${r.y+r.height-30}" width="24" height="24" fill="${item.color}"/>
        <rect x="${r.x+r.width-30}" y="${r.y+r.height-30}" width="24" height="24" fill="${item.color}"/>
        <text x="${cx}" y="${cy - 15}" fill="#0f172a" font-size="54" font-weight="bold" text-anchor="middle" dominant-baseline="middle"
              transform="${isVert ? `rotate(-90 ${cx},${cy})` : ''}">
          ${item.isLadder?'Стремянка ':''}${item.w}×${item.d}
        </text>
        <text x="${cx}" y="${cy + 45}" fill="#334155" font-size="42" text-anchor="middle" dominant-baseline="middle"
              transform="${isVert ? `rotate(-90 ${cx},${cy})` : ''}">
          H=${item.h}${isShelfRack(item)?` · ${item.shelves||0}п${(item.contents||[]).length?`/${item.contents.length}`:''}`:''}
        </text>
      </g>
    `;
  }).join('');

  svg.innerHTML = `
    <defs>
      <marker id="tick" markerWidth="14" markerHeight="14" refX="7" refY="7" orient="auto">
        <line x1="2" y1="12" x2="12" y2="2" stroke="#64748b" stroke-width="2.5"/>
      </marker>
      <pattern id="grid" width="200" height="200" patternUnits="userSpaceOnUse">
        <path d="M 200 0 L 0 0 0 200" fill="none" stroke="#e2e8f0" stroke-width="3"/>
      </pattern>
    </defs>

    <!-- Контур пола с сеткой 200х200 мм -->
    <path d="M 0,0 L 1468,0 L 1468,1394 L 1779,1394 L 1779,2860 L 0,2860 Z"
          fill="url(#grid)" stroke="none"/>

    <!-- Линии замера свободного прохода -->
    <g stroke="#16a34a" stroke-width="5" stroke-dasharray="18,12">
      <line x1="${leftMaxX}" y1="900" x2="${rightMinXTop}" y2="900"/>
      <line x1="${botGap[0]}" y1="2100" x2="${rightMinXBot}" y2="2100"/>
    </g>
    <text x="${(leftMaxX + rightMinXTop)/2}" y="865" fill="#15803d" font-size="50" font-weight="bold" text-anchor="middle">
      Просвет: ${Math.round(passageTop)} мм
    </text>
    <text x="${(botGap[0] + rightMinXBot)/2}" y="2065" fill="#15803d" font-size="50" font-weight="bold" text-anchor="middle">
      Просвет: ${Math.round(passageBot)} мм
    </text>

    <!-- Выносные и размерные линии стен -->
    <g stroke="#94a3b8" stroke-width="3" fill="none" marker-start="url(#tick)" marker-end="url(#tick)">
      <line x1="0" y1="-110" x2="1468" y2="-110"/>
      <line x1="-110" y1="0" x2="-110" y2="2860"/>
      <line x1="0" y1="3000" x2="1779" y2="3000"/>
      <line x1="1960" y1="0" x2="1960" y2="1394"/>
      <line x1="1960" y1="1394" x2="1960" y2="2860"/>
      <line x1="1468" y1="1270" x2="1779" y2="1270"/>
    </g>

    <!-- Подписи размеров стен -->
    <g fill="#1e293b" font-size="64" font-weight="bold" text-anchor="middle">
      <text x="734" y="-145">1468 мм</text>
      <text x="889" y="3095">1779 мм</text>
      <text x="-150" y="1430" transform="rotate(-90 -150,1430)">2860 мм</text>
      <text x="2035" y="697" transform="rotate(-90 2035,697)">1394 мм</text>
      <text x="2035" y="2127" transform="rotate(-90 2035,2127)">1466 мм</text>
      <text x="1623" y="1235" fill="#dc2626" font-size="56">311 мм</text>
    </g>

    <!-- Стеллажи и велосипед -->
    ${itemsSvg}
    ${renderBikeClearance2D()}

    <!-- Стены кладовой (замкнутый контур) -->
    <path d="M 0,0 L 1468,0 L 1468,1394 L 1779,1394 L 1779,2860 L 0,2860 Z"
          fill="none" stroke="#1e293b" stroke-width="26" stroke-linejoin="miter" pointer-events="none"/>

    <!-- Дверной проём на плане: отступ x0=${DOOR.left} (изнутри справа≈500), проём ${DOOR.width}, до x1779=${DOOR.right} (изнутри слева 200); высота ${DOOR.height} -->
    <line x1="${DOOR.start}" y1="2860" x2="${DOOR.end}" y2="2860" stroke="#ffffff" stroke-width="30"/>
    <line x1="${DOOR.start}" y1="2860" x2="${DOOR.end}" y2="2860" stroke="#d97706" stroke-width="10" stroke-dasharray="28,20"/>
    <text x="${(DOOR.start + DOOR.end) / 2}" y="2810" fill="#92400e" font-size="46" font-weight="bold" text-anchor="middle">Дверь ${DOOR.width} × ${DOOR.height} (с наличниками)</text>
    <g fill="#92400e" font-size="40" text-anchor="middle">
      <text x="${DOOR.left / 2}" y="2945">${DOOR.left}≈500</text>
      <text x="${(DOOR.start + DOOR.end) / 2}" y="2945">${DOOR.width}</text>
      <text x="${DOOR.end + DOOR.right / 2}" y="2945">${DOOR.right}</text>
    </g>
  `;

  // Навешиваем обработчики перетаскивания на объекты
  svg.querySelectorAll('.draggable').forEach(el => {
    el.addEventListener('pointerdown', onSvgPointerDown);
    el.addEventListener('contextmenu',e=>{e.preventDefault();e.stopPropagation();openObjectMenu(Number(el.dataset.uid),e.clientX,e.clientY);});
  });
}

function getSvgPoint(evt) {
  const svg = document.getElementById('plan2d');
  const pt = svg.createSVGPoint();
  pt.x = evt.clientX;
  pt.y = evt.clientY;
  return pt.matrixTransform(svg.getScreenCTM().inverse());
}

function onSvgPointerDown(evt) {
  if(evt.button!==0)return;
  closeObjectMenu();
  evt.stopPropagation();
  const uid = parseInt(evt.currentTarget.getAttribute('data-uid'), 10);
  selectedId = uid;
  const item = items.find(i => i.uid === uid);
  if (!item) return;

  const pt = getSvgPoint(evt);
  dragState = {
    uid: uid,
    startX: pt.x,
    startY: pt.y,
    origWall: item.wall,
    origOffset: item.offset, origX:getItemRect(item).x,origY:getItemRect(item).y
  };
  renderInspector();
  render2D();
  window.addEventListener('pointermove', onSvgPointerMove);
  window.addEventListener('pointerup', onSvgPointerUp);
}

function onSvgPointerMove(evt) {
  if (!dragState) return;
  const item = items.find(i => i.uid === dragState.uid);
  if (!item) return;
  const pt = getSvgPoint(evt);

  if(item.free){item.x=Math.round((dragState.origX+pt.x-dragState.startX)/10)*10;item.y=Math.round((dragState.origY+pt.y-dragState.startY)/10)*10;renderInspector();render2D();render3D();return;}
  // Определяем ближайшую стену к курсору мыши
  const distTop = Math.abs(pt.y - 0);
  const distLeft = Math.abs(pt.x - 0);
  const distRightTop = (pt.y <= 1450) ? Math.abs(pt.x - 1468) : 9999;
  const distRightBot = (pt.y > 1300) ? Math.abs(pt.x - 1779) : 9999;

  const minDist = Math.min(distTop, distLeft, distRightTop, distRightBot);
  if (minDist === distTop) {
    item.wall = 'top';
    item.offset = Math.round((pt.x - placedSize(item).w / 2) / 10) * 10;
  } else if (minDist === distLeft) {
    item.wall = 'left';
    item.offset = Math.round((pt.y - placedSize(item).w / 2) / 10) * 10;
  } else if (minDist === distRightTop) {
    item.wall = 'right_top';
    item.offset = Math.round((pt.y - placedSize(item).w / 2) / 10) * 10;
  } else {
    item.wall = 'right_bot';
    item.offset = Math.round((pt.y - 1394 - placedSize(item).w / 2) / 10) * 10;
  }

  // Ограничиваем в разумных пределах стены
  const maxLen = WALL_INFO[item.wall].maxLen;
  item.offset = Math.max(-200, Math.min(maxLen - placedSize(item).w + 200, item.offset));

  renderInspector();
  render2D();
  render3D();
}

function onSvgPointerUp() {
  dragState = null;
  window.removeEventListener('pointermove', onSvgPointerMove);
  window.removeEventListener('pointerup', onSvgPointerUp);
  refreshAll();
}

// ==========================================
// 4. WebGL uses the same object rectangles as the SVG plan.
function render3D(){ if(window.renderWebGL) window.renderWebGL(); }
function init3DEvents(){}
window.plannerState=()=>({items,selectedId,selectedCargoId,ceilingHeight,wallOpacity,getItemRect,DOOR});
window.DOOR=DOOR;
window.selectPlannerItem=(uid, cargoId)=>{
  selectedId=uid;
  if (cargoId) selectedCargoId = cargoId;
  else if (selectedCargoId) {
    const rack = items.find(i => i.uid === uid && isShelfRack(i));
    if (!rack || !findCargo(rack, selectedCargoId)) selectedCargoId = null;
  }
  if (selectedCargoId) {
    const rack = items.find(i => i.uid === uid && isShelfRack(i));
    const c = rack && findCargo(rack, selectedCargoId);
    if (c) activeShelfIndex = c.shelfIndex;
  }
  refreshAll();
};
window.selectPlannerCargo=(uid, cargoId)=>window.selectPlannerItem(uid, cargoId);
function itemsSubtotal() {
  return items.reduce((sum, i) => sum + (i.price || 0), 0);
}
function projectTotal() {
  return itemsSubtotal() + deliveryPrice();
}
function updateHeaderSummary() {
  const total = projectTotal();
  document.getElementById('headerCount').textContent = `${items.length} поз.`;
  document.getElementById('headerTotal').textContent = `${total.toLocaleString('ru-RU')} ₽`;
}

function updateCeiling(val) {
  ceilingHeight = parseInt(val, 10);
  document.getElementById('ceilVal').textContent = ceilingHeight;
  render3D(); updateAnalysis(); persist();
}

function updateWallOpacity(val) {
  wallOpacity = parseInt(val, 10) / 100;
  render3D();
}

function setViewMode(mode) {
  const p2 = document.getElementById('pane2d');
  const p3 = document.getElementById('pane3d');
  if (mode === 'split') {
    p2.style.display = 'flex';
    p3.style.display = 'flex';
  } else if (mode === '2d') {
    p2.style.display = 'flex';
    p3.style.display = 'none';
  } else if (mode === '3d') {
    p2.style.display = 'none';
    p3.style.display = 'flex';
  }
  render2D();
  render3D();
}

function openBomModal() {
  const grouped = {};
  items.forEach(i => {
    const key = `${i.modelId}_${i.wall}_${i.shelves || 0}_${i.price || 0}`;
    if (!grouped[key]) {
      grouped[key] = { ...i, count: 0 };
    }
    grouped[key].count++;
  });

  const rows = Object.values(grouped).map(g => {
    const seUnit = g.brand === 'SE 750кг' ? seShelfUnitPrice(g.w, g.d) : 0;
    const ptUnit = g.brand === 'Профи-Т 2500кг' ? ptShelfUnitPrice(g.w, g.d) : 0;
    const detail = g.brand === 'SE 750кг' && seUnit
      ? `<br><span style="color:#64748b;font-size:11px;">стойки ${SE_POSTS_PRICE.toLocaleString('ru-RU')} ₽ + ${g.shelves}× полка SE-140 ${seUnit.toLocaleString('ru-RU')} ₽</span>`
      : (g.brand === 'Профи-Т 2500кг' && ptUnit
        ? `<br><span style="color:#64748b;font-size:11px;">стойки ${PT_POSTS_PRICE.toLocaleString('ru-RU')} ₽ + ${g.shelves}× ярус (фанера) ${ptUnit.toLocaleString('ru-RU')} ₽</span>`
        : `<br><span style="color:#64748b;font-size:11px;">${g.brand} • ${g.w}×${g.d}×${g.h} мм</span>`);
    return `
    <tr>
      <td><b>${g.name}</b>${detail}</td>
      <td>${WALL_INFO[g.wall].label}</td>
      <td>${g.count} шт.</td>
      <td><b>${(g.price * g.count).toLocaleString('ru-RU')} ₽</b></td>
    </tr>`;
  }).join('');
  const shelfRows = items.filter(isShelfRack).map(i => {
    ensureShelfLayout(i);
    const cargo = (i.contents || []).map(c => `${c.name} → полка ${c.shelfIndex + 1} (h${c.h})`).join('; ') || 'без вещей';
    return `<tr><td colspan="4"><b>Стеллаж №${i.uid}</b>: ${i.shelves} полок на ${i.shelfZs.join('/')} мм. ${cargo}</td></tr>`;
  }).join('');
  const zone = deliveryZone();
  const goods = itemsSubtotal();
  const ship = deliveryPrice();
  const total = goods + ship;
  const deliveryOpts = STELTECH_DELIVERY.zones.map(z =>
    `<option value="${z.id}" ${z.id === deliveryZoneId ? 'selected' : ''}>${z.label}${z.price ? ` — ${z.price.toLocaleString('ru-RU')} ₽` : ''}</option>`
  ).join('');

  document.getElementById('bomBody').innerHTML = `
    <p><b>Помещение:</b> Кладовая 4.65 м² (Левая стена: 2860 мм, Верхняя: 1468 мм, Выступ: 311 мм, Правая: 1394 + 1466 = 2860 мм, Низ: 1779 мм).</p>
    <table class="bom-table">
      <thead>
        <tr>
          <th>Наименование и габариты</th>
          <th>Размещение (стена)</th>
          <th>Кол-во</th>
          <th>Сумма</th>
        </tr>
      </thead>
      <tbody>
        ${rows || '<tr><td colspan="4">Список пуст</td></tr>'}
        ${shelfRows}
        <tr>
          <td colspan="3"><b>Доставка СтелТех</b><br>
            <span style="color:#64748b;font-size:11px;">тарифы с <a href="${STELTECH_DELIVERY.source}" target="_blank" rel="noopener">stel-teh.ru/shipping-and-payment</a> (Москва/МО до 1000 кг / 7 м³; подъём и перенос отдельно)</span>
            <label class="inspector-row" style="margin-top:6px">Зона
              <select aria-label="delivery" onchange="setDeliveryZone(this.value)">${deliveryOpts}</select>
            </label>
          </td>
          <td><b>${ship.toLocaleString('ru-RU')} ₽</b></td>
        </tr>
      </tbody>
    </table>
    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px; gap:12px; flex-wrap:wrap;">
      <div>
        <div class="note">Товары: ${goods.toLocaleString('ru-RU')} ₽ · ${zone.label}: ${ship.toLocaleString('ru-RU')} ₽</div>
        <div style="font-size:16px; font-weight:700;">ИТОГО: ${total.toLocaleString('ru-RU')} ₽</div>
      </div>
      <button class="btn primary" onclick="copyBomText()">📋 Скопировать смету в буфер</button>
    </div>
  `;
  document.getElementById('bomModal').classList.add('open');
}

function closeBomModal() {
  document.getElementById('bomModal').classList.remove('open');
}

function copyBomText() {
  const lines = ['Смета и план расстановки кладовой (4.65 м²):'];
  items.forEach((i, idx) => {
    lines.push(`${idx+1}. ${i.name} (${i.w}x${i.d}x${i.h} мм) — Стена: ${WALL_INFO[i.wall].label}, отступ ${Math.round(i.offset)} мм — ${i.price.toLocaleString('ru-RU')} ₽`);
    if (i.brand === 'SE 750кг') {
      const unit = seShelfUnitPrice(i.w, i.d);
      lines.push(`   Стойки ${SE_POSTS_PRICE.toLocaleString('ru-RU')} ₽ + ${i.shelves}× SE-140 ${unit.toLocaleString('ru-RU')} ₽`);
    }
    if (i.brand === 'Профи-Т 2500кг') {
      const unit = ptShelfUnitPrice(i.w, i.d);
      lines.push(`   Стойки ${PT_POSTS_PRICE.toLocaleString('ru-RU')} ₽ + ${i.shelves}× ярус (фанера) ${unit.toLocaleString('ru-RU')} ₽`);
    }
    if (isShelfRack(i)) {
      ensureShelfLayout(i);
      lines.push(`   Полки (${i.shelves}): ${i.shelfZs.join(', ')} мм от низа`);
      for (const c of i.contents || []) lines.push(`   · ${c.name} на полке ${c.shelfIndex + 1}, ${c.w}×${c.d}×${c.h} мм`);
    }
  });
  const zone = deliveryZone();
  lines.push(`Доставка СтелТех (${zone.label}): ${deliveryPrice().toLocaleString('ru-RU')} ₽ — ${STELTECH_DELIVERY.source}`);
  lines.push(`Товары: ${itemsSubtotal().toLocaleString('ru-RU')} ₽`);
  lines.push(`ИТОГО: ${projectTotal().toLocaleString('ru-RU')} ₽`);
  lines.push('Цены справочные по СтелТех; подъём на этаж, перенос с борта и сборка — отдельно. Проверить габариты, дверь и трассу трубы.');
  navigator.clipboard.writeText(lines.join('\n')).then(()=>toast('Смета скопирована'),()=>download('kladovka-smeta.txt',lines.join('\n'),'text/plain'));
}

function focusSelectedCargoCard() {
  if (!selectedCargoId) return;
  requestAnimationFrame(() => {
    const el = document.querySelector(`.cargo-card[data-cargo-id="${selectedCargoId}"]`);
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
}

function refreshAll() {
  updateHeaderSummary();
  renderInspector();
  if (currentCatalogTab === 'cargo') renderCatalog();
  render2D();
  render3D();
  updateAnalysis(); persist();
  focusSelectedCargoCard();
}

window.addEventListener('DOMContentLoaded', async () => {
  renderCatalog();
  init3DEvents();
  bindCargoDrag();
  if(!await restorePlan()) applyPreset('se_bike');
  const shareButton=document.querySelector('[onclick="sharePlan()"]');
  shareButton.textContent='Короткая ссылка';shareButton.onclick=shareShortPlan;
});
// Analysis uses the same millimetre coordinates in both views.
const ROOM_AREA=1468*1394+1779*1466;
const STORE_KEY='kladovka-planner-v1';
function rectInside(r){return r.x>=0&&r.y>=0&&r.y+r.height<=2860&&r.x+r.width<=1779&&(r.y>=1394||r.x+r.width<=1468);}
function overlap(a,b){return a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;}
function largestGap(y){
 const width=y<1394?1468:1779;
 const intervals=items.map(getItemRect).filter(r=>r.y<=y&&r.y+r.height>y).map(r=>[Math.max(0,r.x),Math.min(width,r.x+r.width)]).filter(v=>v[1]>v[0]).sort((a,b)=>a[0]-b[0]);
 let end=0,best=[0,0]; for(const [a,b] of intervals){if(a-end>best[1]-best[0])best=[end,a];end=Math.max(end,b);}if(width-end>best[1]-best[0])best=[end,width];return best;
}
function occupiedArea(){
 const rects=items.filter(i=>(i.z||0)===0).map(getItemRect);
 const xs=[0,1468,1779,...rects.flatMap(r=>[Math.max(0,Math.min(1779,r.x)),Math.max(0,Math.min(1779,r.x+r.width))])].sort((a,b)=>a-b);
 const ys=[0,1394,2860,...rects.flatMap(r=>[Math.max(0,Math.min(2860,r.y)),Math.max(0,Math.min(2860,r.y+r.height))])].sort((a,b)=>a-b);
 let sum=0;for(let a=1;a<xs.length;a++)for(let b=1;b<ys.length;b++){const x=(xs[a-1]+xs[a])/2,y=(ys[b-1]+ys[b])/2;if(x>(y<1394?1468:1779))continue;if(rects.some(r=>x>=r.x&&x<r.x+r.width&&y>=r.y&&y<r.y+r.height))sum+=(xs[a]-xs[a-1])*(ys[b]-ys[b-1]);}return sum;
}
function analyze(){
 const warnings=[];for(const i of items){const r=getItemRect(i);if(!rectInside(r))warnings.push(`Объект №${i.uid} выходит за контур помещения.`);if(i.h+(i.z||0)>ceilingHeight)warnings.push(`Объект №${i.uid} выше потолка.`);if(i.h+(i.z||0)>3221)warnings.push(`Объект №${i.uid} выше низа трубы — проверьте её трассу.`);}
 for(let a=0;a<items.length;a++)for(let b=a+1;b<items.length;b++){const i=items[a],j=items[b];if(overlap(getItemRect(i),getItemRect(j))&&(i.z||0)<(j.z||0)+j.h&&(j.z||0)<(i.z||0)+i.h)warnings.push(`Пересечение объектов №${i.uid} и №${j.uid}.`);}
 return {warnings,freeArea:(ROOM_AREA-occupiedArea())/1e6};
}
function updateAnalysis(){
 const a=analyze();
 const shelfStats=items.filter(isShelfRack).map(i=>{ensureShelfLayout(i);return `№${i.uid}: ${i.shelves} полок${(i.contents||[]).length?`, вещей ${(i.contents||[]).length}`:''}`;});
 document.getElementById('layoutStats').innerHTML=`Пол: <b>${(ROOM_AREA/1e6).toFixed(2)} м²</b><br>Свободно на полу: <b>${a.freeArea.toFixed(2)} м²</b>${shelfStats.length?`<br>Стеллажи: ${shelfStats.join('; ')}`:''}<br><span class="note">Без двойного учёта пересечений. Подвешенные предметы не занимают пол, но могут мешать проходу. Зелёные линии — просветы в двух сечениях, не гарантия проходимости.</span>`;
 const node=document.getElementById('warnings');node.replaceChildren();for(const warning of a.warnings){const el=document.createElement('div');el.className='warn';el.textContent=warning;node.append(el);}if(!a.warnings.length)node.innerHTML='<div class="ok">Пересечений и выхода за стены нет.</div>';
 for(const i of items.filter(isShelfRack)){for(const issue of shelfIssues(i)){const el=document.createElement('div');el.className='warn';el.textContent=`Стеллаж №${i.uid}: ${issue}`;node.append(el);}}
 for(const i of items.filter(i=>i.isBike&&i.clearanceVisible!==false)){const issues=bikeClearanceIssues(i),el=document.createElement('div');el.className=issues.length?'warn':'ok';el.textContent=`Зона снятия №${i.uid}: ${issues.length?issues.join('; '):'свободна в пределах оценочного объёма'}.`;node.append(el);}
}
function editDimension(uid,key,value){
  const item=items.find(i=>i.uid===uid),n=Number(value);
  if(!item||!['w','d','h','gap','z'].includes(key)||!Number.isFinite(n))return;
  // SE / Лемана: габариты только из покупаемой сетки, не произвольный ввод.
  if((item.brand==='SE 750кг'||item.brand==='Профи-Т 2500кг'||item.brand==='Лемана ПРО')&&(key==='w'||key==='d')){
    setRackDimension(uid,key,Math.round(n));
    return;
  }
  if(item.brand==='SE 750кг'&&key==='h'){
    item.h=SE_HEIGHT;ensureShelfLayout(item);refreshAll();return;
  }
  if(item.brand==='Профи-Т 2500кг'&&key==='h'){
    item.h=PT_HEIGHT;ensureShelfLayout(item);refreshAll();return;
  }
  if(item.brand==='Лемана ПРО'&&key==='h'){
    const match=catalogRacksForBrand(item.brand).find(m=>m.w===item.w&&m.d===item.d);
    item.h=match?match.h:item.h;ensureShelfLayout(item);refreshAll();return;
  }
  item[key]=Math.max(key==='gap'||key==='z'?0:1,Math.min(5000,Math.round(n)));
  if(isShelfRack(item)&&key==='h')ensureShelfLayout(item);
  refreshAll();
}
function snapshot(){return {version:1,bikeMeasurements:2,shelfLayout:1,cargoIds:1,ceilingHeight,items:items.map(i=>({modelId:i.modelId,wall:i.wall,offset:i.offset,w:i.w,d:i.d,h:i.h,z:i.z||0,gap:i.gap||0,bikeMode:i.bikeMode??null,rotation:i.rotation||0,free:!!i.free,x:i.x||0,y:i.y||0,clearanceVisible:i.clearanceVisible!==false,bikeLength:i.bikeLength??1700,handlingSpace:i.handlingSpace??600,liftSpace:i.liftSpace??150,shelves:i.shelves||0,shelfZs:Array.isArray(i.shelfZs)?i.shelfZs.map(Number):undefined,contents:Array.isArray(i.contents)?i.contents.map(c=>({id:c.id,cid:c.cid,modelId:c.modelId,kind:c.kind,name:c.name,w:c.w,d:c.d,h:c.h,color:c.color,shelfIndex:c.shelfIndex,order:c.order||0,inventory:Array.isArray(c.inventory)?c.inventory:[],photo:c.photo??null})):[]}))};}
function persist(){try{localStorage.setItem(STORE_KEY,JSON.stringify(snapshot()));}catch{}}
function loadSnapshot(data){
 if(!data||data.version!==1||!Array.isArray(data.items)||data.items.length>100)throw Error('Неизвестный формат проекта или более 100 объектов.');
 const parsed=data.items.map((r,k)=>{
  const m=findCatalogModel(r.modelId);if(!m||m.isCargo||!Object.hasOwn(WALL_INFO,r.wall))throw Error('Неизвестная модель или стена.');
  const i={...m,modelId:m.id,uid:k+1,wall:r.wall,isBike:!!m.isBike,isSki:!!m.isSki,isLadder:!!m.isLadder};
  for(const key of ['offset','w','d','h','z','gap']){const n=Number(r[key]??(key==='z'||key==='gap'?0:m[key]));if(!Number.isFinite(n)||Math.abs(n)>10000||(key!=='offset'&&n<0)||(['w','d','h'].includes(key)&&n<1))throw Error('Некорректные размеры.');i[key]=n;}
  for(const [key,fallback] of [['bikeLength',1700],['handlingSpace',600],['liftSpace',150]]){const n=Number(r[key]??fallback);if(!Number.isFinite(n)||n<0||n>5000)throw Error('Некорректная зона снятия.');i[key]=n;}
  i.free=!!r.free;for(const key of ['x','y']){const n=Number(r[key]??0);if(!Number.isFinite(n)||Math.abs(n)>10000)throw Error('Некорректная позиция.');i[key]=n;}
  i.clearanceVisible=r.clearanceVisible!==false;i.rotation=[0,90,180,270].includes(r.rotation)?r.rotation:0;
  i.bikeMode=m.isBike&&['floor','floor_turn','vert'].includes(r.bikeMode)?r.bikeMode:m.bikeMode;
  if(m.isBike&&data.bikeMeasurements!==2){const old=i.bikeMode==='vert'?[800,1000,2000]:i.bikeMode==='floor_turn'?[1750,420,1050]:[1750,620,1050];if(i.w===old[0]&&i.d===old[1]&&i.h===old[2]){i.w=i.bikeMode==='vert'?500:1700;i.d=i.bikeMode==='vert'?1000:i.bikeMode==='floor_turn'?420:500;i.h=i.bikeMode==='vert'?1700:1000;}if(i.bikeLength===1750)i.bikeLength=1700;}
  if(i.brand==='Лемана ПРО'){
    const match=catalogRacksForBrand(i.brand).find(m2=>m2.w===i.w&&m2.d===i.d)||catalogRacksForBrand(i.brand).find(m2=>m2.id===i.modelId);
    if(match)Object.assign(i,{modelId:match.id,name:match.name,w:match.w,d:match.d,h:match.h,price:match.price,color:match.color});
  }
  if(isShelfRack(i)){
   const shelfN=Number(r.shelves??m.shelves??5);
   if(!Number.isFinite(shelfN)||shelfN<SHELF_MIN||shelfN>SHELF_MAX)throw Error('Некорректное число полок.');
   i.shelves=shelfN;
   if(Array.isArray(r.shelfZs)&&r.shelfZs.length===shelfN){
    i.shelfZs=r.shelfZs.map(Number);
    if(i.shelfZs.some(z=>!Number.isFinite(z)||z<0||z>5000))throw Error('Некорректные высоты полок.');
   }else i.shelfZs=defaultShelfZs(i.h,shelfN,i.brand);
   i.contents=[];
   if(Array.isArray(r.contents)){
    if(r.contents.length>40)throw Error('Слишком много предметов на стеллаже.');
    for(const c of r.contents){
     const cw=Number(c.w),cd=Number(c.d),ch=Number(c.h),si=Number(c.shelfIndex??0);
     if(![cw,cd,ch].every(n=>Number.isFinite(n)&&n>=1&&n<=3000)||!Number.isFinite(si)||si<0||si>=shelfN)throw Error('Некорректный предмет на полке.');
     i.contents.push(normalizeCargo({...c,w:cw,d:cd,h:ch,shelfIndex:si},shelfN));
    }
    for(let s=0;s<shelfN;s++)reindexShelfOrders(i,s);
   }
   ensureShelfLayout(i);
  }
  // После shelves: цена SE/Профи-Т = стойки + N×ярус.
  if(i.brand==='SE 750кг'||i.brand==='Профи-Т 2500кг')normalizeBuyableRack(i);
  return i;
 });
 const h=Number(data.ceilingHeight);if(!Number.isFinite(h)||h<1800||h>3400)throw Error('Некорректная высота потолка.');
 items=parsed;ceilingHeight=h;nextUid=items.length+1;
 nextCargoId=Math.max(1,...items.flatMap(i=>(i.contents||[]).map(c=>Number(c.cid)+1||1)),1);
 selectedId=null;selectedCargoId=null;document.getElementById('ceilVal').textContent=h;document.querySelector('[oninput="updateCeiling(this.value)"]').value=h;refreshAll();
}
async function restorePlan(){try{if(location.hash.startsWith('#planz=')){loadSnapshot(await decodeCompressedPlan(location.hash.slice(7)));return true;}if(location.hash.startsWith('#plan=')){loadSnapshot(JSON.parse(decodeURIComponent(escape(atob(location.hash.slice(6))))));return true;}const raw=localStorage.getItem(STORE_KEY);if(raw){loadSnapshot(JSON.parse(raw));return true;}}catch(e){toast('Не удалось открыть сохранённый проект: '+e.message);}return false;}
function download(name,text,type){const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);}
function exportPlan(){download('kladovka-plan.json',JSON.stringify(snapshot(),null,2),'application/json');}
async function importPlan(file){if(!file)return;try{if(file.size>200000)throw Error('Файл слишком большой');loadSnapshot(JSON.parse(await file.text()));toast('Проект открыт');}catch(e){toast(e.message);}}
async function sharePlan(){const url=location.origin+location.pathname+'#plan='+btoa(unescape(encodeURIComponent(JSON.stringify(snapshot()))));try{await navigator.clipboard.writeText(url);toast('Ссылка на текущую расстановку скопирована');}catch{download('kladovka-link.txt',url,'text/plain');toast('Ссылка сохранена в текстовом файле');}}
function exportSvg(){const clone=document.getElementById('plan2d').cloneNode(true);clone.setAttribute('xmlns','http://www.w3.org/2000/svg');download('kladovka-plan.svg',new XMLSerializer().serializeToString(clone),'image/svg+xml');}
function toast(message){document.querySelector('.toast')?.remove();const el=document.createElement('div');el.className='toast';el.role='status';el.textContent=message;document.body.append(el);setTimeout(()=>el.remove(),5000);}
document.addEventListener('keydown',e=>{
  if(e.target.closest('input,textarea,select,[contenteditable="true"]')||document.getElementById('bomModal').classList.contains('open'))return;
  if(e.key==='Escape'){if(selectedCargoId){selectedCargoId=null;refreshAll();return;}closeBomModal();return;}
  if(selectedCargoId&&selectedId!=null&&(e.key==='ArrowLeft'||e.key==='ArrowRight')){
    e.preventDefault();
    reorderCargo(selectedId, selectedCargoId, e.key==='ArrowLeft'?-1:1);
    return;
  }
  if((e.key==='Delete'||e.key==='Backspace')&&selectedId!=null){
    e.preventDefault();
    if(selectedCargoId){removeCargo(selectedId, selectedCargoId);return;}
    deleteItem(selectedId);
  }
});

function placedSize(i){return (i.rotation||0)%180===90?{w:i.d,d:i.w}:{w:i.w,d:i.d};}
function bikeHeading(i){const base=i.bikeMode==='vert'?(i.wall==='top'?90:0):(i.wall==='top'?0:90);return (base+(i.rotation||0))%360;}
window.bikeHeading=bikeHeading;
function rotateItem(uid){const i=items.find(i=>i.uid===uid);if(!i)return;closeObjectMenu();const old=getItemRect(i);i.rotation=((i.rotation||0)+90)%360;if(i.free){const next=getItemRect(i);i.x=old.x+(old.width-next.width)/2;i.y=old.y+(old.height-next.height)/2;}selectedId=uid;refreshAll();}
function duplicateItem(uid){
  const i = items.find(i => i.uid === uid); if (!i) return;
  if (items.length >= 100) { toast('В проекте не более 100 объектов'); return; }
  closeObjectMenu();
  const copy = {
    ...i,
    uid: nextUid++,
    offset: i.offset + placedSize(i).w + 20,
    shelfZs: Array.isArray(i.shelfZs) ? i.shelfZs.slice() : null,
    contents: Array.isArray(i.contents) ? i.contents.map(c => {
      const n = nextCargoId++;
      return {
        ...c,
        cid: n,
        id: `c_${n}`,
        inventory: Array.isArray(c.inventory) ? c.inventory.map(x => ({ ...x })) : [],
        photo: c.photo ?? null
      };
    }) : []
  };
  const max = WALL_INFO[i.wall].maxLen - placedSize(i).w;
  if (copy.offset > max) copy.offset = Math.max(0, i.offset - placedSize(i).w - 20);
  if (copy.free) { copy.x = (i.x || 0) + 100; copy.y = (i.y || 0) + 100; }
  if (isShelfRack(copy)) ensureShelfLayout(copy);
  items.push(copy); selectedId = copy.uid; refreshAll();
  toast('Копия создана. Проверьте пересечения и отступы.');
}
function closeObjectMenu(){document.getElementById('objectMenu')?.remove();}
function placeObjectMenu(menu,x,y){
  document.body.append(menu);
  menu.style.left=Math.max(8,Math.min(x,innerWidth-menu.offsetWidth-8))+'px';
  menu.style.top=Math.max(8,Math.min(y,innerHeight-menu.offsetHeight-8))+'px';
  menu.querySelector('[role="menuitem"]')?.focus();
}
function menuButton(label,onClick){
  const b=document.createElement('button');
  b.className='btn';
  b.setAttribute('role','menuitem');
  b.textContent=label;
  b.style.cssText='display:block;width:100%;text-align:left;margin:3px 0';
  b.onclick=onClick;
  return b;
}
function openRackSizeMenu(uid,key,x,y){
  const item=items.find(i=>i.uid===uid);
  if(!isShelfRack(item))return;
  closeObjectMenu();
  selectedId=uid;
  refreshAll();
  const menu=document.createElement('div');
  menu.id='objectMenu';
  menu.setAttribute('role','menu');
  menu.style.cssText='position:fixed;z-index:100;background:white;border:1px solid #cbd5e1;border-radius:10px;padding:6px;box-shadow:0 10px 30px #172b4533;min-width:220px;max-height:min(70vh,420px);overflow:auto';
  const title=key==='w'?'Ширина':'Глубина';
  menu.append(menuButton(`← Назад`,()=>openObjectMenu(uid,x,y)));
  const note=document.createElement('div');
  note.className='note';
  note.style.cssText='padding:4px 6px;margin:2px 0';
  note.textContent=item.brand==='SE 750кг'
    ?`${title}: только размеры СтелТех${key==='d'?` для ширины ${item.w}`:''}`
    :(item.brand==='Профи-Т 2500кг'
      ?`${title}: Профи-Т 2500кг, H=${PT_HEIGHT}`
      :`${title} сейчас: ${item[key]} мм`);
  menu.append(note);
  for(const size of rackSizeOptions(item,key)){
    const current=size===item[key];
    let priceHint='';
    if(item.brand==='SE 750кг'&&key==='d'&&SE_PRICES[`${item.w}_${size}`]){
      priceHint=` · ${SE_PRICES[`${item.w}_${size}`].toLocaleString('ru-RU')} ₽`;
    } else if(item.brand==='Профи-Т 2500кг'&&key==='d'){
      const p=ptRackPrice(item.w,size,item.shelves||PT_DEFAULT_SHELVES);
      if(p) priceHint=` · ${p.toLocaleString('ru-RU')} ₽`;
    }
    menu.append(menuButton(`${current?'✓ ':'  '}${size} мм${priceHint}`,()=>setRackDimension(uid,key,size)));
  }
  placeObjectMenu(menu,x,y);
}
function openObjectMenu(uid,x,y){
  if(!items.some(i=>i.uid===uid))return;
  closeObjectMenu();
  selectedId=uid;
  refreshAll();
  const menu=document.createElement('div');
  menu.id='objectMenu';
  menu.setAttribute('role','menu');
  menu.style.cssText='position:fixed;z-index:100;background:white;border:1px solid #cbd5e1;border-radius:10px;padding:6px;box-shadow:0 10px 30px #172b4533;min-width:220px;';
  const item=items.find(i=>i.uid===uid);
  const actions=[];
  if(item.isBike)actions.push(item.bikeMode==='vert'?['Поставить велосипед на пол',id=>setBikeMode(id,'floor')]:['Подвесить на стену колесом вверх',id=>setBikeMode(id,'vert')]);
  if(isShelfRack(item)){
    actions.push([`Ширина: ${item.w} мм…`,id=>openRackSizeMenu(id,'w',x,y)]);
    actions.push([`Глубина: ${item.d} мм…`,id=>openRackSizeMenu(id,'d',x,y)]);
  }
  actions.push(['↻ Повернуть на 90°',rotateItem],['＋ Создать копию',duplicateItem],['Удалить',id=>{closeObjectMenu();deleteItem(id);}]);
  for(const [label,fn] of actions)menu.append(menuButton(label,()=>fn(uid)));
  placeObjectMenu(menu,x,y);
}
window.openObjectMenu=openObjectMenu;window.closeObjectMenu=closeObjectMenu;
window.openRackSizeMenu=openRackSizeMenu;window.setRackDimension=setRackDimension;
window.SE_WIDTHS=SE_WIDTHS;window.SE_DEPTHS=SE_DEPTHS;window.SE_PRICES=SE_PRICES;window.SE_POSTS_PRICE=SE_POSTS_PRICE;
window.SE_SHELF_PRICES=SE_SHELF_PRICES;window.STELTECH_DELIVERY=STELTECH_DELIVERY;
window.seShelfUnitPrice=seShelfUnitPrice;window.seRackPrice=seRackPrice;window.setDeliveryZone=setDeliveryZone;
window.deliveryPrice=deliveryPrice;window.projectTotal=projectTotal;window.itemsSubtotal=itemsSubtotal;
window.seDepthsForWidth=seDepthsForWidth;window.isSeSize=isSeSize;window.makeSeModel=makeSeModel;
window.PT_WIDTHS=PT_WIDTHS;window.PT_DEPTHS=PT_DEPTHS;window.PT_SHELF_PRICES=PT_SHELF_PRICES;window.PT_POSTS_PRICE=PT_POSTS_PRICE;
window.ptShelfUnitPrice=ptShelfUnitPrice;window.ptRackPrice=ptRackPrice;window.makePtModel=makePtModel;window.isPtSize=isPtSize;
window.normalizeBuyableRack=normalizeBuyableRack;window.nearestSeDepth=nearestSeDepth;window.catalogRacksForBrand=catalogRacksForBrand;
window.setShelfCount=setShelfCount;window.setShelfZ=setShelfZ;window.redistributeShelves=redistributeShelves;
window.addCargoToRack=addCargoToRack;window.removeCargo=removeCargo;window.editCargoSize=editCargoSize;
window.selectShelfIndex=selectShelfIndex;window.openCargoCatalog=openCargoCatalog;
window.selectCargo=selectCargo;window.moveCargoToShelf=moveCargoToShelf;window.reorderCargo=reorderCargo;window.placeCargo=placeCargo;
window.findCargo=findCargo;window.makeCargoInstance=makeCargoInstance;window.cargoKind=cargoKind;window.cargoThumbSvg=cargoThumbSvg;
window.shelfClearance=shelfClearance;window.shelfIssues=shelfIssues;window.ensureShelfLayout=ensureShelfLayout;window.shelfWidthUsed=shelfWidthUsed;window.shelfCargo=shelfCargo;
window.defaultShelfZs=defaultShelfZs;
document.addEventListener('pointerdown',e=>{if(!e.target.closest('#objectMenu'))closeObjectMenu();});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeObjectMenu();});window.addEventListener('resize',closeObjectMenu);

// Conservative handling envelope, separate from the stored object and floor area.
function getBikeClearance(item){
 const r=getItemRect(item),extra=item.handlingSpace??600;
 const depth=item.bikeMode==='vert'?Math.max(placedSize(item).d,(item.bikeLength??1700)+extra):placedSize(item).d+extra;
 let zone={...r};
 if(item.wall==='top')zone.height=depth;
 else {zone.width=depth;if(item.wall==='right_top'||item.wall==='right_bot')zone.x=r.x+r.width-depth;}
 return {...zone,height3d:(item.z||0)+item.h+(item.bikeMode==='vert'?(item.liftSpace??150):0)};
}
function bikeClearanceIssues(item){
 const r=getBikeClearance(item),issues=[];
 if(!rectInside(r))issues.push('выходит за стены / границы помещения');
 for(const other of items)if(other.uid!==item.uid&&overlap(r,getItemRect(other))&&(other.z||0)<r.height3d)issues.push(`мешает объект №${other.uid}`);
 if(r.height3d>ceilingHeight)issues.push('не хватает высоты для подъёма');
 if(r.height3d>3221)issues.push('проверьте пересечение с трубой');
 return issues;
}
function editBikeClearance(uid,key,value){const i=items.find(i=>i.uid===uid);if(!i?.isBike)return;if(key==='clearanceVisible')i[key]=!!value;else if(['bikeLength','handlingSpace','liftSpace'].includes(key)&&Number.isFinite(Number(value)))i[key]=Math.max(0,Math.min(5000,Number(value)));refreshAll();}
function renderBikeClearance2D(){return items.filter(i=>i.isBike&&i.clearanceVisible!==false).map(i=>{const r=getBikeClearance(i),color=bikeClearanceIssues(i).length?'#dc2626':'#0d9488';return `<g pointer-events="none" data-clearance="${i.uid}"><rect x="${r.x}" y="${r.y}" width="${r.width}" height="${r.height}" fill="${color}" fill-opacity=".07" stroke="${color}" stroke-width="6" stroke-dasharray="30 16"/><text x="${r.x+r.width/2}" y="${r.y+r.height-30}" text-anchor="middle" fill="${color}" font-size="42">Снятие: ${Math.round(r.width)}×${Math.round(r.height)} мм</text></g>`;}).join('');}
window.getBikeClearance=getBikeClearance;window.bikeClearanceIssues=bikeClearanceIssues;

function freeBike(uid){const i=items.find(i=>i.uid===uid);if(!i?.isBike)return;const r=getItemRect(i);if(i.bikeMode==='vert')setBikeMode(uid,'floor');i.free=true;i.x=r.x;i.y=r.y;refreshAll();toast('Велосипед стоит на полу. Перемещайте его в любую точку; поворот — 90°.');}
function editFreePosition(uid,key,value){const i=items.find(i=>i.uid===uid),n=Number(value);if(!i||!['x','y'].includes(key)||!Number.isFinite(n))return;i[key]=Math.max(-5000,Math.min(5000,Math.round(n)));refreshAll();}
let beforeAuto=null;
function undoAutoArrange(){if(!beforeAuto)return;const old=beforeAuto;beforeAuto=null;loadSnapshot(old);document.getElementById('undoAuto').disabled=true;toast('Предыдущая расстановка восстановлена.');}
function autoArrange(){
 if(!items.length){toast('Сначала добавьте предметы.');return;}
 if(items.length>20){toast('Авторасстановка рассчитана максимум на 20 предметов.');return;}
 const entrance={x:DOOR.start,y:2460,width:DOOR.width,height:400};
 const source=items.map(i=>({...i}));let best=null,bestScore=Infinity;
 function candidates(item,placed){const out=[];
  if(item.isBike&&item.bikeMode!=='vert'){
   for(const rotation of [0,90]){const proto={...item,free:true,wall:'top',rotation};const size=placedSize(proto);
    const xs=new Set([20,1779-size.w-20]),ys=new Set([20,2860-size.d-20]);
    const step=50;
    for(let x=20;x+size.w<=1779;x+=step)xs.add(x);for(let y=20;y+size.d<=2860;y+=step)ys.add(y);
    for(const p of placed){const r=getItemRect(p);xs.add(r.x+r.width+20);xs.add(r.x-size.w-20);ys.add(r.y+r.height+20);ys.add(r.y-size.d-20);}
    for(const x of xs)for(const y of ys)out.push({...proto,x,y});
   }
  }else for(const wall of Object.keys(WALL_INFO))for(const rotation of [0,90]){const proto={...item,free:false,wall,rotation,gap:20},size=placedSize(proto),max=WALL_INFO[wall].maxLen-size.w-20;if(max<20)continue;const offsets=new Set([20,max]);for(let v=20;v<=max;v+=100)offsets.add(v);for(const p of placed){const r=getItemRect(p),start=wall==='top'?r.x:r.y-(wall==='right_bot'?1394:0),len=wall==='top'?r.width:r.height;offsets.add(start+len+20);offsets.add(start-size.w-20);}for(const offset of offsets)out.push({...proto,offset});}
  return out.filter(c=>{const r=getItemRect(c);return rectInside(r)&&!overlap(r,entrance)&&(c.z||0)+c.h<=ceilingHeight&&!placed.some(p=>overlap({x:r.x-10,y:r.y-10,width:r.width+20,height:r.height+20},getItemRect(p))&&(c.z||0)<(p.z||0)+p.h&&(p.z||0)<(c.z||0)+c.h);});
 }
 for(let trial=0;trial<48;trial++){
  const order=source.slice().sort((a,b)=>((a.isBike?1:0)-(b.isBike?1:0))||((trial%2?a.w*a.d-b.w*b.d:b.w*b.d-a.w*a.d)));
  if(trial%4===3)order.reverse();
  // После сдвига двери иногда выгоднее ставить велосипед раньше стеллажей.
  if(trial%5===4){const bi=order.findIndex(i=>i.isBike);if(bi>0)order.unshift(order.splice(bi,1)[0]);}
  const placed=[];let score=0;
  for(const item of order){const choices=candidates(item,placed).map(c=>{const r=getItemRect(c);const edge=Math.min(r.x,Math.abs(1779-r.x-r.width));return {c,score:r.y*.2+edge*.5+(c.rotation?30:0)+(item.isBike?-r.y*.3+(r.width>1000?5000:0):0)};}).sort((a,b)=>a.score-b.score);if(!choices.length)break;const accessible=choices.filter(v=>autoReachable([...placed,v.c]));if(!accessible.length)break;const choice=accessible[Math.min(accessible.length-1,trial%4)];placed.push(choice.c);score+=choice.score;}
  if(placed.length===source.length&&autoReachable(placed)&&score<bestScore){best=placed;bestScore=score;}
 }
 if(!best){toast('Не удалось разместить все предметы без пересечений и с зоной у входа. Текущий план сохранён.');return;}
 beforeAuto=snapshot();items=source.map(i=>best.find(p=>p.uid===i.uid));document.getElementById('undoAuto').disabled=false;refreshAll();toast('Предметы расставлены. Проверен проход 400 мм по сетке. Проверьте удобство доступа и зону снятия велосипеда; доступна отмена.');
}

// Coarse 400 mm-wide access check. This is not a swept bicycle trajectory.
function autoReachable(layout){
 const radius=200,step=100,queue=[],seen=new Set(),rects=layout.filter(i=>(i.z||0)<1800).map(getItemRect);
 function clear(x,y){const r={x:x-radius,y:y-radius,width:radius*2,height:radius*2};return rectInside(r)&&!rects.some(o=>overlap(r,o));}
 for(let x=DOOR.start+200;x<=DOOR.end-200;x+=step)if(clear(x,2660)){queue.push([x,2660]);seen.add(`${x},2660`);}
 for(let k=0;k<queue.length;k++){const [x,y]=queue[k];for(const [dx,dy] of [[step,0],[-step,0],[0,step],[0,-step]]){const nx=x+dx,ny=y+dy,key=`${nx},${ny}`;if(!seen.has(key)&&clear(nx,ny)){seen.add(key);queue.push([nx,ny]);}}}
 return layout.every(i=>{const r=getItemRect(i);return queue.some(([x,y])=>{const dx=Math.max(r.x-x,0,x-r.x-r.width),dy=Math.max(r.y-y,0,y-r.y-r.height);if(Math.hypot(dx,dy)>350)return false;if(i.isBike||i.isSki||i.isLadder||i.free)return true;return i.wall==='top'?y>=r.y+r.height:i.wall==='left'?x>=r.x+r.width:x<=r.x;});});
}
