// Mapea las categorías del menú con sus IDs correspondientes de la bd
export const MENU_CATEGORY_MAP = {
  graymayas: [13, 14, 21],
  basicos: [1, 12, 2],
  accesorios: [3, 31, 32],
  colaboraciones: [41, 42, 43],
};

// Mapeo de filtros a IDs de categorías específicas
export const FILTER_CATEGORY_MAP = {
  // Graymayas
  "sudaderas-cierre": [13],
  "sudaderas-cerradas": [14],
  playeras: [21],

  // Básicos (mismo mapeo que graymayas)
  // "sudaderas-cierre": [1],
  // "sudaderas-cerradas": [12],
  // "playeras": [2],

  // Accesorios
  collares: [3],
  pulseras: [31],
  aretes: [32],

  // Colaboraciones
  // "playeras": [41],
  // "sudaderas": [42, 43],
};

// Mapeo específico por categoría principal y filtro
export const CATEGORY_FILTER_MAP = {
  graymayas: {
    "sudaderas-cierre": [13],
    "sudaderas-cerradas": [14],
    playeras: [21],
  },
  basicos: {
    "sudaderas-cierre": [1],
    "sudaderas-cerradas": [12],
    playeras: [2],
  },
  accesorios: {
    collares: [3],
    pulseras: [31],
    aretes: [32],
  },
  colaboraciones: {
    playeras: [43],
    sudaderas: [42, 41],
  },
};
