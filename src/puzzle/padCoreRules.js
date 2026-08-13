export const PAD_BOARD_COLUMNS = 6;
export const PAD_BOARD_ROWS = 5;
export const PAD_MINIMUM_MATCH = 3;
export const PAD_MASS_ATTACK_ORBS = 5;
export const PAD_DEFAULT_MOVE_TIME_SECONDS = 5;
export const PAD_EXTRA_ORB_BONUS = 0.25;
export const PAD_EXTRA_COMBO_BONUS = 0.25;

// Version 21.9.0's restored image exposes the corresponding native routines as
// cGAMEMAIN::_isNeighborBlock (0x673e24), _swapBlock (0x67ab14),
// _checkFlood/_checkFlood2 (0x666724/0x666a78), and _checkErases (0x66c81c).

export function padOrbMatchMultiplier(size) {
  return 1 + PAD_EXTRA_ORB_BONUS * Math.max(0, size - PAD_MINIMUM_MATCH);
}

export function padComboMultiplier(combos) {
  return 1 + PAD_EXTRA_COMBO_BONUS * Math.max(0, combos - 1);
}

export function padAttributeMultiplier(attacker, defender) {
  if ((attacker === 'fire' && defender === 'wood') ||
      (attacker === 'wood' && defender === 'water') ||
      (attacker === 'water' && defender === 'fire')) return 2;
  if ((attacker === 'wood' && defender === 'fire') ||
      (attacker === 'water' && defender === 'wood') ||
      (attacker === 'fire' && defender === 'water')) return 0.5;
  if ((attacker === 'light' && defender === 'dark') ||
      (attacker === 'dark' && defender === 'light')) return 2;
  return 1;
}

export function padMatchPower(attack, matchSizes) {
  return matchSizes.reduce((total, size) => total + attack * padOrbMatchMultiplier(size), 0);
}

// libpad keeps attack lanes as integers. _applyComboMul routes each matched
// lane through sCARD::dmgUpBase, which uses izMathCeiling, while later attack
// multipliers route through sCARD::dmgUp and round positive values with +0.5.
// _calcAttackPow then applies elemental advantage with izMathCeilingSint64.
export function padNativeBaseAttackPower(attack, matchSizes, combos) {
  const comboMultiplier = padComboMultiplier(combos);
  return matchSizes.reduce((total, size) =>
    total + Math.ceil(attack * padOrbMatchMultiplier(size) * comboMultiplier), 0);
}

export function padApplyAttackMultipliers(attack, multipliers) {
  return multipliers.reduce((value, multiplier) => Math.floor(value * multiplier + 0.5), attack);
}

export function padDamageAfterDefense(attack, attributeMultiplier, defense) {
  return Math.max(1, Math.ceil(attack * attributeMultiplier) - Math.max(0, defense));
}

// Android may coalesce pointer motion. The native normal-board swap routine
// rejects diagonal neighbours, so a sparse event must be expanded into the
// orthogonal grid boundaries crossed by its line segment. Exact corner ties are
// resolved horizontally first and never become a one-step diagonal swap.
export function tracePadDragCells(fromRow, fromColumn, toRow, toColumn) {
  if (![fromRow, fromColumn, toRow, toColumn].every(Number.isInteger)) {
    throw new Error('PAD drag coordinates must be integer cells.');
  }
  const rowDelta = toRow - fromRow;
  const columnDelta = toColumn - fromColumn;
  const rowDistance = Math.abs(rowDelta);
  const columnDistance = Math.abs(columnDelta);
  const rowStep = Math.sign(rowDelta);
  const columnStep = Math.sign(columnDelta);
  let row = fromRow;
  let column = fromColumn;
  let rowCrossing = rowDistance ? 0.5 / rowDistance : Infinity;
  let columnCrossing = columnDistance ? 0.5 / columnDistance : Infinity;
  const rowIncrement = rowDistance ? 1 / rowDistance : Infinity;
  const columnIncrement = columnDistance ? 1 / columnDistance : Infinity;
  const cells = [];
  while (row !== toRow || column !== toColumn) {
    if (column !== toColumn && columnCrossing <= rowCrossing) {
      column += columnStep;
      columnCrossing += columnIncrement;
    } else {
      row += rowStep;
      rowCrossing += rowIncrement;
    }
    cells.push({ row, column });
  }
  return cells;
}

function matchShape(cells) {
  const coordinates = new Set(cells.map(({ row, column }) => `${row}:${column}`));
  const rows = new Set(cells.map(({ row }) => row));
  const columns = new Set(cells.map(({ column }) => column));
  const isBox = cells.length === 9 && rows.size === 3 && columns.size === 3 &&
    [...rows].every((row) => [...columns].every((column) => coordinates.has(`${row}:${column}`)));
  const isCross = cells.length === 5 && cells.some(({ row, column }) =>
    coordinates.has(`${row - 1}:${column}`) && coordinates.has(`${row + 1}:${column}`) &&
    coordinates.has(`${row}:${column - 1}`) && coordinates.has(`${row}:${column + 1}`));
  const isL = cells.length === 5 && cells.some(({ row, column }) => {
    const arms = [
      [[1, 0], [2, 0], [0, 1], [0, 2]],
      [[-1, 0], [-2, 0], [0, 1], [0, 2]],
      [[1, 0], [2, 0], [0, -1], [0, -2]],
      [[-1, 0], [-2, 0], [0, -1], [0, -2]],
    ];
    return arms.some((offsets) => offsets.every(([dr, dc]) => coordinates.has(`${row + dr}:${column + dc}`)));
  });
  return { isRow: rows.size === 1, isColumn: columns.size === 1, isBox, isCross, isL };
}

export function findPadMatches(board, getType = (cell) => cell?.type, minimum = PAD_MINIMUM_MATCH) {
  const rowCount = board.length;
  const columnCount = board[0]?.length || 0;
  if (!rowCount || !columnCount || board.some((row) => row.length !== columnCount)) {
    throw new Error('PAD board must be a non-empty rectangle.');
  }
  const marked = Array.from({ length: rowCount }, () => Array(columnCount).fill(false));
  for (let row = 0; row < rowCount; row += 1) {
    let start = 0;
    while (start < columnCount) {
      const type = getType(board[row][start]);
      let end = start + 1;
      while (end < columnCount && getType(board[row][end]) === type) end += 1;
      if (type != null && end - start >= minimum) {
        for (let column = start; column < end; column += 1) marked[row][column] = true;
      }
      start = end;
    }
  }
  for (let column = 0; column < columnCount; column += 1) {
    let start = 0;
    while (start < rowCount) {
      const type = getType(board[start][column]);
      let end = start + 1;
      while (end < rowCount && getType(board[end][column]) === type) end += 1;
      if (type != null && end - start >= minimum) {
        for (let row = start; row < end; row += 1) marked[row][column] = true;
      }
      start = end;
    }
  }

  const visited = Array.from({ length: rowCount }, () => Array(columnCount).fill(false));
  const matches = [];
  for (let row = 0; row < rowCount; row += 1) {
    for (let column = 0; column < columnCount; column += 1) {
      if (!marked[row][column] || visited[row][column]) continue;
      const type = getType(board[row][column]);
      const cells = [];
      const queue = [{ row, column }];
      visited[row][column] = true;
      for (let index = 0; index < queue.length; index += 1) {
        const cell = queue[index];
        cells.push(cell);
        for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const nextRow = cell.row + dr;
          const nextColumn = cell.column + dc;
          if (nextRow < 0 || nextRow >= rowCount || nextColumn < 0 || nextColumn >= columnCount ||
              visited[nextRow][nextColumn] || !marked[nextRow][nextColumn] ||
              getType(board[nextRow][nextColumn]) !== type) continue;
          visited[nextRow][nextColumn] = true;
          queue.push({ row: nextRow, column: nextColumn });
        }
      }
      matches.push({
        type,
        cells,
        size: cells.length,
        isMassAttack: cells.length >= PAD_MASS_ATTACK_ORBS,
        ...matchShape(cells),
      });
    }
  }
  return matches;
}
