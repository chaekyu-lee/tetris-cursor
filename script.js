// --- 설정 ---
const COLS = 10;
const ROWS = 20;
const CELL_SIZE = 24;
const DROP_INTERVAL_MS = 800;

const LINE_SCORES = {
  1: 100,
  2: 300,
  3: 500,
  4: 800,
};

const GAME_OVER_MESSAGE = "게임 오버! 블록이 더 이상 생성될 수 없습니다.";

const PIECES = {
  I: {
    colorClass: "cell--i",
    spawnRow: 0,
    spawnCol: 3,
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
  },
  O: {
    colorClass: "cell--o",
    spawnRow: 0,
    spawnCol: 4,
    shape: [
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
  },
  T: {
    colorClass: "cell--t",
    spawnRow: 0,
    spawnCol: 3,
    shape: [
      [0, 1, 0, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
  },
  S: {
    colorClass: "cell--s",
    spawnRow: 0,
    spawnCol: 3,
    shape: [
      [0, 1, 1, 0],
      [1, 1, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
  },
  Z: {
    colorClass: "cell--z",
    spawnRow: 0,
    spawnCol: 3,
    shape: [
      [1, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
  },
  J: {
    colorClass: "cell--j",
    spawnRow: 0,
    spawnCol: 3,
    shape: [
      [1, 0, 0, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
  },
  L: {
    colorClass: "cell--l",
    spawnRow: 0,
    spawnCol: 3,
    shape: [
      [0, 0, 1, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
  },
};

// --- DOM ---
const boardElement = document.getElementById("board");
const scoreElement = document.getElementById("score");
const statusElement = document.getElementById("status");
const startButton = document.getElementById("start-btn");
const restartButton = document.getElementById("restart-btn");

if (!boardElement || !scoreElement || !statusElement || !startButton || !restartButton) {
  throw new Error("필수 DOM 요소를 찾을 수 없습니다. index.html을 확인하세요.");
}

// --- 게임 상태 ---
let board = createEmptyBoard();
let cellElements = [];
let currentPiece = null;
let score = 0;
let dropTimerId = null;
let isPlaying = false;
let isGameOver = false;
let keyboardControlsInitialized = false;

// --- 보드 / 좌표 ---
function createEmptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function isInsideBoard(row, col) {
  return col >= 0 && col < COLS && row >= 0 && row < ROWS;
}

function applyBoardDimensions() {
  const root = document.documentElement;

  root.style.setProperty("--board-cols", String(COLS));
  root.style.setProperty("--board-rows", String(ROWS));
  root.style.setProperty("--cell-size", `${CELL_SIZE}px`);

  boardElement.setAttribute("aria-rowcount", String(ROWS));
  boardElement.setAttribute("aria-colcount", String(COLS));
}

// --- 블록 정의 / 생성 ---
function getPieceTypes() {
  return Object.keys(PIECES);
}

function getColorClass(pieceType) {
  const pieceDefinition = PIECES[pieceType];
  return pieceDefinition ? pieceDefinition.colorClass : "";
}

function createPiece(type) {
  const pieceTypes = getPieceTypes();
  const pieceType = type && PIECES[type] ? type : pieceTypes[Math.floor(Math.random() * pieceTypes.length)];
  const pieceDefinition = PIECES[pieceType];

  return {
    type: pieceType,
    shape: pieceDefinition.shape.map((row) => [...row]),
    row: pieceDefinition.spawnRow,
    col: pieceDefinition.spawnCol,
  };
}

function getPieceCells(piece) {
  const occupiedCells = [];

  for (let shapeRow = 0; shapeRow < piece.shape.length; shapeRow += 1) {
    for (let shapeCol = 0; shapeCol < piece.shape[shapeRow].length; shapeCol += 1) {
      if (piece.shape[shapeRow][shapeCol] === 1) {
        occupiedCells.push({
          row: piece.row + shapeRow,
          col: piece.col + shapeCol,
        });
      }
    }
  }

  return occupiedCells;
}

function rotateShape(shape) {
  const matrixSize = shape.length;
  const rotatedShape = Array.from({ length: matrixSize }, () => Array(matrixSize).fill(0));

  for (let row = 0; row < matrixSize; row += 1) {
    for (let col = 0; col < matrixSize; col += 1) {
      rotatedShape[col][matrixSize - 1 - row] = shape[row][col];
    }
  }

  return rotatedShape;
}

// --- 충돌 / 이동 ---
function canMove(piece, offsetCol, offsetRow, boardMatrix) {
  for (let shapeRow = 0; shapeRow < piece.shape.length; shapeRow += 1) {
    for (let shapeCol = 0; shapeCol < piece.shape[shapeRow].length; shapeCol += 1) {
      if (piece.shape[shapeRow][shapeCol] !== 1) {
        continue;
      }

      const targetRow = piece.row + shapeRow + offsetRow;
      const targetCol = piece.col + shapeCol + offsetCol;

      if (!isInsideBoard(targetRow, targetCol)) {
        return false;
      }

      if (boardMatrix[targetRow][targetCol]) {
        return false;
      }
    }
  }

  return true;
}

function canSpawnPiece(piece) {
  return canMove(piece, 0, 0, board);
}

function isGameActive() {
  return isPlaying && !isGameOver && currentPiece !== null;
}

function tryMovePiece(offsetCol, offsetRow) {
  if (!currentPiece) {
    return false;
  }

  if (!canMove(currentPiece, offsetCol, offsetRow, board)) {
    return false;
  }

  currentPiece.row += offsetRow;
  currentPiece.col += offsetCol;
  renderBoard();
  return true;
}

function tryMoveDown() {
  return tryMovePiece(0, 1);
}

function tryRotate() {
  if (!currentPiece) {
    return false;
  }

  const shapeBeforeRotate = currentPiece.shape.map((row) => [...row]);
  currentPiece.shape = rotateShape(currentPiece.shape);

  if (canMove(currentPiece, 0, 0, board)) {
    renderBoard();
    return true;
  }

  currentPiece.shape = shapeBeforeRotate;
  return false;
}

function softDrop() {
  if (!tryMoveDown()) {
    lockAndSpawnNext();
  }
}

function hardDrop() {
  if (!currentPiece || !isPlaying) {
    return;
  }

  while (tryMoveDown()) {
    // 충돌할 때까지 반복
  }

  lockAndSpawnNext();
}

// --- 렌더링 ---
function applyCellStyle(cell, pieceType) {
  const colorClass = getColorClass(pieceType);
  if (!colorClass) {
    return;
  }

  cell.classList.add("cell--filled", colorClass);
}

function createBoardCell(row, col) {
  const cell = document.createElement("div");
  cell.className = "cell";
  cell.dataset.row = String(row);
  cell.dataset.col = String(col);
  cell.setAttribute("role", "gridcell");
  return cell;
}

function renderLockedCells() {
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const lockedPieceType = board[row][col];
      const cell = createBoardCell(row, col);

      if (lockedPieceType) {
        applyCellStyle(cell, lockedPieceType);
      }

      cellElements[row][col] = cell;
      boardElement.appendChild(cell);
    }
  }
}

function drawPiece() {
  if (!currentPiece) {
    return;
  }

  getPieceCells(currentPiece).forEach(({ row, col }) => {
    if (!isInsideBoard(row, col)) {
      return;
    }

    const cell = cellElements[row][col];
    if (!cell) {
      return;
    }

    applyCellStyle(cell, currentPiece.type);
  });
}

function renderBoard() {
  boardElement.innerHTML = "";
  cellElements = Array.from({ length: ROWS }, () => []);
  renderLockedCells();
  drawPiece();
}

function renderScore() {
  scoreElement.textContent = String(score);
}

function setStatus(message) {
  statusElement.textContent = message;
}

// --- 점수 / 라인 삭제 ---
function getLineScore(linesCleared) {
  return LINE_SCORES[linesCleared] || linesCleared * 100;
}

function addScore(linesCleared) {
  if (linesCleared <= 0) {
    return;
  }

  score += getLineScore(linesCleared);
  renderScore();
}

function isRowFull(boardMatrix, rowIndex) {
  return boardMatrix[rowIndex].every((cell) => cell !== null);
}

function clearLines() {
  const compactedBoard = createEmptyBoard();
  let targetRow = ROWS - 1;
  let linesCleared = 0;

  for (let row = ROWS - 1; row >= 0; row -= 1) {
    if (isRowFull(board, row)) {
      linesCleared += 1;
      continue;
    }

    compactedBoard[targetRow] = board[row].slice();
    targetRow -= 1;
  }

  board = compactedBoard;
  return linesCleared;
}

function formatSpawnStatusMessage(linesCleared, pieceType) {
  if (linesCleared > 0) {
    return `${linesCleared}줄 삭제! +${getLineScore(linesCleared)}점 · ${pieceType} 블록 생성`;
  }

  return `${pieceType} 블록이 생성되었습니다.`;
}

// --- 고정 / 스폰 / 낙하 ---
function lockPiece() {
  if (!currentPiece) {
    return;
  }

  getPieceCells(currentPiece).forEach(({ row, col }) => {
    if (!isInsideBoard(row, col)) {
      return;
    }

    board[row][col] = currentPiece.type;
  });
}

function spawnNextPiece(linesCleared = 0) {
  currentPiece = createPiece();

  if (!canSpawnPiece(currentPiece)) {
    triggerGameOver();
    return false;
  }

  setStatus(formatSpawnStatusMessage(linesCleared, currentPiece.type));
  renderBoard();
  return true;
}

function lockAndSpawnNext() {
  lockPiece();

  const linesCleared = clearLines();
  if (linesCleared > 0) {
    addScore(linesCleared);
  }

  spawnNextPiece(linesCleared);
}

function dropPiece() {
  if (!isPlaying || !currentPiece) {
    return;
  }

  if (tryMoveDown()) {
    return;
  }

  lockAndSpawnNext();
}

function triggerGameOver() {
  isGameOver = true;
  isPlaying = false;
  currentPiece = null;
  stopDropLoop();
  setStatus(GAME_OVER_MESSAGE);
  renderBoard();
}

// --- 타이머 / 게임 흐름 ---
function startDropLoop() {
  stopDropLoop();
  isPlaying = true;
  isGameOver = false;
  dropTimerId = window.setInterval(dropPiece, DROP_INTERVAL_MS);
}

function stopDropLoop() {
  if (dropTimerId !== null) {
    window.clearInterval(dropTimerId);
    dropTimerId = null;
  }
}

function resetGame() {
  stopDropLoop();
  isPlaying = false;
  isGameOver = false;
  board = createEmptyBoard();
  currentPiece = createPiece();
  score = 0;
  renderBoard();
  renderScore();
  setStatus("게임을 준비했습니다.");
}

function startGame(messageFn) {
  resetGame();

  if (!canSpawnPiece(currentPiece)) {
    triggerGameOver();
    return;
  }

  const startMessage = messageFn
    ? messageFn(currentPiece)
    : `${currentPiece.type} 블록이 떨어지기 시작했습니다.`;
  setStatus(startMessage);
  startDropLoop();
}

function handleStart() {
  startGame();
}

function handleRestart() {
  startGame((piece) => `게임이 재시작되었습니다. (${piece.type} 블록)`);
}

// --- 입력 ---
const KEY_ACTIONS = {
  ArrowLeft: () => tryMovePiece(-1, 0),
  ArrowRight: () => tryMovePiece(1, 0),
  ArrowDown: () => softDrop(),
  ArrowUp: () => tryRotate(),
  " ": () => hardDrop(),
};

function handleKeyDown(event) {
  if (!isGameActive()) {
    return;
  }

  const action = KEY_ACTIONS[event.key];
  if (!action) {
    return;
  }

  event.preventDefault();
  action();
}

function initKeyboardControls() {
  if (keyboardControlsInitialized) {
    return;
  }

  document.addEventListener("keydown", handleKeyDown);
  keyboardControlsInitialized = true;
}

function initApp() {
  applyBoardDimensions();
  initKeyboardControls();
  startButton.addEventListener("click", handleStart);
  restartButton.addEventListener("click", handleRestart);
  startGame();
}

initApp();
