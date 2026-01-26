// Formation data for KanColle-style tactical combat

export const FORMATIONS = {
  LINE_AHEAD: {
    id: 'LINE_AHEAD',
    name: 'Line Ahead',
    description: 'Balanced attack formation',
    icon: '│',
    modifiers: {
      firepower: 1.0,
      torpedo: 1.0,
      evasion: 1.0,
      antiAir: 1.0,
    },
  },
  DOUBLE_LINE: {
    id: 'DOUBLE_LINE',
    name: 'Double Line',
    description: 'Anti-air focused formation',
    icon: '║',
    modifiers: {
      firepower: 0.8,
      torpedo: 0.8,
      evasion: 1.0,
      antiAir: 1.2,
    },
  },
  DIAMOND: {
    id: 'DIAMOND',
    name: 'Diamond',
    description: 'Maximum anti-air defense',
    icon: '◇',
    modifiers: {
      firepower: 0.7,
      torpedo: 0.4,
      evasion: 1.1,
      antiAir: 1.5,
    },
  },
  ECHELON: {
    id: 'ECHELON',
    name: 'Echelon',
    description: 'Evasion focused formation',
    icon: '⋱',
    modifiers: {
      firepower: 0.75,
      torpedo: 0.6,
      evasion: 1.3,
      antiAir: 1.0,
    },
  },
};

export const FORMATION_ORDER = ['LINE_AHEAD', 'DOUBLE_LINE', 'DIAMOND', 'ECHELON'];

export function getFormationById(id) {
  return FORMATIONS[id] || FORMATIONS.LINE_AHEAD;
}

// Format modifier as percentage string (+20%, -10%, etc.)
export function formatModifier(value) {
  const percent = Math.round((value - 1) * 100);
  if (percent === 0) return '±0%';
  return percent > 0 ? `+${percent}%` : `${percent}%`;
}
