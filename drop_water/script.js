const MIN_PLAYERS = 2;

const resultBody = document.getElementById("resultBody");
const actionLog = document.getElementById("actionLog");
const currentPlayerEl = document.getElementById("currentPlayer");
const flowStatusEl = document.getElementById("flowStatus");
const waterEl = document.getElementById("water");
const streamEl = document.getElementById("stream");
const faucetEl = document.getElementById("faucet");
const cupEl = document.getElementById("cup");
const overflowEl = document.getElementById("overflow");
const failureModal = document.getElementById("failureModal");
const failedPlayerNameEl = document.getElementById("failedPlayerName");
const restartBtn = document.getElementById("restartBtn");
const modalRestartBtn = document.getElementById("modalRestartBtn");
const toggleBtn = document.getElementById("toggleBtn");
const candidatePlayerEl = document.getElementById("candidatePlayer");
const addPlayerBtn = document.getElementById("addPlayerBtn");
const clearPlayersBtn = document.getElementById("clearPlayersBtn");
const playerListEl = document.getElementById("playerList");

const FILL_RATE_PER_SEC = 18;
const CUP_CAPACITY = 100;

let nextPlayerIndex = 0;
let activePlayerIndex = null;
let activeControl = null;
let flowOn = false;
let waterLevel = 0;
let gameOver = false;
let lastFrameTime = 0;
let spaceHeld = false;
let buttonHeld = false;
let lastFailedIndex = null;

let players = [];
let records = [];
let audioContext = null;
let noiseSource = null;
let noiseGain = null;

function createRecord(name) {
  return {
    name,
    losses: 0,
  };
}

function ensureWaterAudio() {
  if (audioContext) {
    return;
  }

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) {
    return;
  }

  audioContext = new AudioCtx();

  const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 2, audioContext.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }

  noiseSource = audioContext.createBufferSource();
  noiseSource.buffer = noiseBuffer;
  noiseSource.loop = true;

  const highPass = audioContext.createBiquadFilter();
  highPass.type = "highpass";
  highPass.frequency.value = 400;

  const lowPass = audioContext.createBiquadFilter();
  lowPass.type = "lowpass";
  lowPass.frequency.value = 2600;

  noiseGain = audioContext.createGain();
  noiseGain.gain.value = 0;

  noiseSource.connect(highPass);
  highPass.connect(lowPass);
  lowPass.connect(noiseGain);
  noiseGain.connect(audioContext.destination);
  noiseSource.start();
}

function startWaterSound() {
  ensureWaterAudio();
  if (!audioContext || !noiseGain) {
    return;
  }

  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => {});
  }

  const now = audioContext.currentTime;
  noiseGain.gain.cancelScheduledValues(now);
  noiseGain.gain.setTargetAtTime(0.05, now, 0.03);
}

function stopWaterSound() {
  if (!audioContext || !noiseGain) {
    return;
  }

  const now = audioContext.currentTime;
  noiseGain.gain.cancelScheduledValues(now);
  noiseGain.gain.setTargetAtTime(0, now, 0.05);
}

function appendLog(message) {
  const item = document.createElement("li");
  item.textContent = message;
  actionLog.prepend(item);

  while (actionLog.children.length > 8) {
    actionLog.removeChild(actionLog.lastChild);
  }
}

function renderPlayerList() {
  playerListEl.innerHTML = "";

  for (let i = 0; i < players.length; i += 1) {
    const item = document.createElement("li");
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "remove-player-btn";
    removeBtn.dataset.index = String(i);
    removeBtn.textContent = "×";
    removeBtn.setAttribute("aria-label", `移除参赛人 ${players[i]}`);

    item.append(players[i], removeBtn);
    playerListEl.appendChild(item);
  }
}

function renderResults() {
  resultBody.innerHTML = "";

  for (let i = 0; i < records.length; i += 1) {
    const row = document.createElement("tr");
    const record = records[i];

    if (lastFailedIndex === i) {
      row.classList.add("fail");
    }

    row.innerHTML = `
      <td>${record.name}</td>
      <td>${record.losses}</td>
    `;
    resultBody.appendChild(row);
  }
}

function renderState() {
  if (players.length < MIN_PLAYERS) {
    currentPlayerEl.textContent = `请添加至少 ${MIN_PLAYERS} 人`;
  } else if (gameOver) {
    currentPlayerEl.textContent = "游戏结束";
  } else if (flowOn && activePlayerIndex !== null) {
    currentPlayerEl.textContent = `${players[activePlayerIndex]}（按住中）`;
  } else {
    currentPlayerEl.textContent = players[nextPlayerIndex];
  }

  flowStatusEl.textContent = flowOn ? "放水中" : "关闭";
  waterEl.style.height = `${Math.min(waterLevel, CUP_CAPACITY)}%`;

  streamEl.classList.toggle("running", flowOn && !gameOver);
  faucetEl.classList.toggle("open", flowOn && !gameOver);
}

function triggerFailure() {
  if (gameOver) {
    return;
  }

  if (players.length === 0) {
    return;
  }

  const failedIndex =
    activePlayerIndex !== null
      ? activePlayerIndex
      : (nextPlayerIndex + players.length - 1) % players.length;

  gameOver = true;
  flowOn = false;
  activeControl = null;
  spaceHeld = false;
  buttonHeld = false;
  stopWaterSound();

  records[failedIndex].losses += 1;
  lastFailedIndex = failedIndex;
  failedPlayerNameEl.textContent = players[failedIndex];
  failureModal.classList.remove("hidden");
  cupEl.classList.add("shake");
  overflowEl.classList.add("show");

  appendLog(
    `${players[failedIndex]} 让水溢出了杯口，判定失败。累计失败 ${records[failedIndex].losses} 局。`
  );
  activePlayerIndex = null;
  renderResults();
  renderState();
}

function advancePlayer() {
  nextPlayerIndex = (nextPlayerIndex + 1) % players.length;
}

function startFlow(controlType, triggerName) {
  if (gameOver || flowOn) {
    return;
  }

  if (players.length < MIN_PLAYERS) {
    appendLog(`请先添加至少 ${MIN_PLAYERS} 名参赛人再开始。`);
    renderState();
    return;
  }

  const actor = nextPlayerIndex;

  flowOn = true;
  activePlayerIndex = actor;
  activeControl = controlType;

  appendLog(`${players[actor]} 按住${triggerName}开始放水。`);
  startWaterSound();
  renderResults();
  renderState();
}

function stopFlow(controlType, options = {}) {
  const { force = false } = options;
  if (!flowOn || activePlayerIndex === null) {
    return;
  }

  if (!force && activeControl !== controlType) {
    return;
  }

  const actor = activePlayerIndex;

  flowOn = false;
  activeControl = null;
  activePlayerIndex = null;
  stopWaterSound();

  if (!gameOver) {
    appendLog(`${players[actor]} 松开按键，停止放水。`);
    advancePlayer();
  }

  renderResults();
  renderState();
}

function resetGame() {
  nextPlayerIndex = 0;
  activePlayerIndex = null;
  activeControl = null;
  flowOn = false;
  waterLevel = 0;
  gameOver = false;
  lastFrameTime = 0;
  spaceHeld = false;
  buttonHeld = false;
  lastFailedIndex = null;

  failureModal.classList.add("hidden");
  cupEl.classList.remove("shake");
  overflowEl.classList.remove("show");
  actionLog.innerHTML = "";
  stopWaterSound();

  if (players.length >= MIN_PLAYERS) {
    appendLog(`新一局开始，${players[0]}先按键。`);
  } else {
    appendLog(`请先通过“添加参赛人”设置至少 ${MIN_PLAYERS} 名参赛人。`);
  }
  renderPlayerList();
  renderResults();
  renderState();
}

function addPlayer(name, options = {}) {
  const { silent = false } = options;
  const trimmed = (name || "").trim();
  if (!trimmed) {
    return false;
  }

  if (players.includes(trimmed)) {
    if (!silent) {
      appendLog(`${trimmed} 已在参赛名单中。`);
    }
    return false;
  }

  players.push(trimmed);
  records.push(createRecord(trimmed));

  if (!silent) {
    appendLog(`${trimmed} 已加入参赛名单。`);
  }
  return true;
}

function removePlayerAt(index) {
  if (flowOn) {
    appendLog("放水过程中不能修改参赛名单。");
    return;
  }

  if (index < 0 || index >= players.length) {
    return;
  }

  const removedName = players[index];
  players.splice(index, 1);
  records.splice(index, 1);

  if (nextPlayerIndex > index) {
    nextPlayerIndex -= 1;
  }
  if (nextPlayerIndex >= players.length) {
    nextPlayerIndex = 0;
  }

  if (lastFailedIndex === index) {
    lastFailedIndex = null;
  } else if (lastFailedIndex !== null && lastFailedIndex > index) {
    lastFailedIndex -= 1;
  }

  appendLog(`${removedName} 已移出参赛名单。`);
  renderPlayerList();
  renderResults();
  renderState();
}

function clearPlayers() {
  if (flowOn) {
    appendLog("放水过程中不能清空参赛名单。");
    return;
  }

  players = [];
  records = [];
  nextPlayerIndex = 0;
  activePlayerIndex = null;
  activeControl = null;
  flowOn = false;
  waterLevel = 0;
  gameOver = false;
  lastFrameTime = 0;
  spaceHeld = false;
  buttonHeld = false;
  lastFailedIndex = null;

  failureModal.classList.add("hidden");
  cupEl.classList.remove("shake");
  overflowEl.classList.remove("show");
  stopWaterSound();

  actionLog.innerHTML = "";
  appendLog(`参赛名单已清空，请添加至少 ${MIN_PLAYERS} 名参赛人。`);
  renderPlayerList();
  renderResults();
  renderState();
}

function gameLoop(timestamp) {
  if (!lastFrameTime) {
    lastFrameTime = timestamp;
  }

  const deltaSec = (timestamp - lastFrameTime) / 1000;
  lastFrameTime = timestamp;

  if (!gameOver && flowOn) {
    waterLevel += deltaSec * FILL_RATE_PER_SEC;
    if (waterLevel > CUP_CAPACITY) {
      triggerFailure();
    }
    renderState();
  }

  requestAnimationFrame(gameLoop);
}

document.addEventListener("keydown", (event) => {
  if (event.code !== "Space") {
    return;
  }

  event.preventDefault();
  if (event.repeat || spaceHeld) {
    return;
  }

  spaceHeld = true;
  startFlow("space", "空格键");
});

document.addEventListener("keyup", (event) => {
  if (event.code !== "Space") {
    return;
  }

  event.preventDefault();
  if (!spaceHeld) {
    return;
  }

  spaceHeld = false;
  stopFlow("space");
});

function releaseButtonFlow(pointerId) {
  if (typeof pointerId === "number" && toggleBtn.hasPointerCapture(pointerId)) {
    toggleBtn.releasePointerCapture(pointerId);
  }

  if (!buttonHeld) {
    return;
  }

  buttonHeld = false;
  stopFlow("button");
}

toggleBtn.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  buttonHeld = true;
  toggleBtn.setPointerCapture(event.pointerId);
  startFlow("button", "按钮");
});

toggleBtn.addEventListener("pointerup", (event) => {
  releaseButtonFlow(event.pointerId);
});

toggleBtn.addEventListener("pointercancel", (event) => {
  releaseButtonFlow(event.pointerId);
});

toggleBtn.addEventListener("lostpointercapture", () => {
  releaseButtonFlow();
});

window.addEventListener("blur", () => {
  spaceHeld = false;
  buttonHeld = false;
  stopFlow(activeControl, { force: true });
});

restartBtn.addEventListener("click", resetGame);
modalRestartBtn.addEventListener("click", resetGame);
addPlayerBtn.addEventListener("click", () => {
  const added = addPlayer(candidatePlayerEl.value);
  if (added) {
    if (players.length === 1) {
      nextPlayerIndex = 0;
    }
    if (players.length === MIN_PLAYERS) {
      appendLog("参赛人数已满足，可以开始游戏。");
    }
    renderPlayerList();
    renderResults();
    renderState();
  }
});
clearPlayersBtn.addEventListener("click", clearPlayers);
playerListEl.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const { index } = target.dataset;
  if (typeof index !== "string") {
    return;
  }

  removePlayerAt(Number(index));
});

resetGame();
requestAnimationFrame(gameLoop);
