(function () {
  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");

  const ui = {
    modeButtons: Array.from(document.querySelectorAll(".mode-button")),
    trackButtons: Array.from(document.querySelectorAll(".track-card")),
    modeConfigs: Array.from(document.querySelectorAll(".mode-config")),
    racePlayerName: document.getElementById("race-player-name"),
    aiCount: document.getElementById("ai-count"),
    aiCountValue: document.getElementById("ai-count-value"),
    playerNames: document.getElementById("player-names"),
    startButton: document.getElementById("start-button"),
    resetButton: document.getElementById("reset-button"),
    statusMessage: document.getElementById("status-message"),
    overlayTitle: document.getElementById("overlay-title"),
    overlaySubtitle: document.getElementById("overlay-subtitle"),
    resultsPanel: document.getElementById("results-panel"),
    resultsTitle: document.getElementById("results-title"),
    resultsList: document.getElementById("results-list"),
    resultsAction: document.getElementById("results-action"),
    hudMode: document.getElementById("hud-mode"),
    hudTrack: document.getElementById("hud-track"),
    hudSpeed: document.getElementById("hud-speed"),
    hudDistance: document.getElementById("hud-distance"),
    hudRank: document.getElementById("hud-rank"),
    hudTimer: document.getElementById("hud-timer"),
  };

  const ROAD = {
    segmentLength: 180,
    roadWidth: 2000,
    rumbleLength: 3,
    lanes: 3,
    drawDistance: 220,
    cameraHeight: 1100,
    fieldOfView: 100,
  };

  ROAD.cameraDepth = 1 / Math.tan((ROAD.fieldOfView * Math.PI) / 360);
  ROAD.playerZ = ROAD.cameraHeight * ROAD.cameraDepth * 1.15;

  const PHYSICS = {
    maxSpeed: 4200,
    reverseMaxSpeed: 1500,
    acceleration: 2600,
    braking: 3500,
    reverseAcceleration: 2100,
    naturalDeceleration: 950,
    offroadDeceleration: 2500,
    offroadSpeedLimit: 2300,
    steeringRate: 2.35,
    centrifugal: 0.0024,
  };

  const LANE_WORLD_WIDTH = 2 / ROAD.lanes;
  const OBSTACLE_SPECS = {
    puddle: {
      laneCoverage: 0.86,
      hitHalfWidth: LANE_WORLD_WIDTH * 0.43,
      heightRatio: 0.38,
    },
    box: {
      laneCoverage: 0.7,
      hitHalfWidth: LANE_WORLD_WIDTH * 0.35,
      heightRatio: 0.72,
    },
  };

  const MAX_KPH = 320;
  const METERS_PER_UNIT = MAX_KPH / 3.6 / PHYSICS.maxSpeed;
  const KPH_PER_UNIT = MAX_KPH / PHYSICS.maxSpeed;

  const TRACKS = {
    desert: {
      key: "desert",
      name: "沙漠",
      accent: "#df5530",
      accentSoft: "rgba(223, 85, 48, 0.18)",
      skyTop: "#f5c56d",
      skyBottom: "#ffe5b5",
      groundA: "#d9aa68",
      groundB: "#c88d47",
      road: "#5f564e",
      rumbleA: "#f6d2ab",
      rumbleB: "#ba6433",
      lane: "#fff2c2",
      backdropA: "#cb8640",
      backdropB: "#8e552d",
      backdropC: "#f4bb54",
      puddle: "#4f90a0",
      puddleShade: "#1f5d77",
      box: "#8e5a36",
      boxShade: "#5f371e",
      vehicleAccent: "#ffcf66",
      aiSpeedMin: 3000,
      aiSpeedMax: 3620,
      obstacleMinGap: 28,
      obstacleMaxGap: 46,
      puddleBias: 0.42,
      laneMode: "faded",
      previewSpeed: 620,
    },
    jungle: {
      key: "jungle",
      name: "丛林",
      accent: "#2f8c54",
      accentSoft: "rgba(47, 140, 84, 0.18)",
      skyTop: "#8fd2c4",
      skyBottom: "#e0f7de",
      groundA: "#467947",
      groundB: "#345f39",
      road: "#524d48",
      rumbleA: "#c4dd93",
      rumbleB: "#355e34",
      lane: "#f7f3d7",
      backdropA: "#4f8a4a",
      backdropB: "#1f4a27",
      backdropC: "#87b95f",
      puddle: "#5caec1",
      puddleShade: "#296a74",
      box: "#704c32",
      boxShade: "#452e1f",
      vehicleAccent: "#d9ff8a",
      aiSpeedMin: 2920,
      aiSpeedMax: 3480,
      obstacleMinGap: 20,
      obstacleMaxGap: 34,
      puddleBias: 0.68,
      laneMode: "broken",
      previewSpeed: 680,
    },
    highway: {
      key: "highway",
      name: "公路",
      accent: "#2f6ca3",
      accentSoft: "rgba(47, 108, 163, 0.18)",
      skyTop: "#9fc3ea",
      skyBottom: "#f5f0dd",
      groundA: "#728792",
      groundB: "#51616d",
      road: "#484d57",
      rumbleA: "#fefefe",
      rumbleB: "#db5c39",
      lane: "#f7f8fb",
      backdropA: "#607689",
      backdropB: "#32455c",
      backdropC: "#bcd0dd",
      puddle: "#6ba9d1",
      puddleShade: "#336d94",
      box: "#836246",
      boxShade: "#553e2b",
      vehicleAccent: "#f3fbff",
      aiSpeedMin: 3140,
      aiSpeedMax: 3760,
      obstacleMinGap: 32,
      obstacleMaxGap: 48,
      puddleBias: 0.34,
      laneMode: "solid",
      previewSpeed: 760,
    },
    mountain: {
      key: "mountain",
      name: "山路",
      accent: "#a04d2d",
      accentSoft: "rgba(160, 77, 45, 0.18)",
      skyTop: "#c5d6e5",
      skyBottom: "#f7efe2",
      groundA: "#8f7559",
      groundB: "#6c5746",
      road: "#4f4844",
      rumbleA: "#dbcab9",
      rumbleB: "#954325",
      lane: "#f8f3e4",
      backdropA: "#8a765a",
      backdropB: "#493b34",
      backdropC: "#bfa78f",
      puddle: "#5d90a6",
      puddleShade: "#315669",
      box: "#8d6542",
      boxShade: "#5f422b",
      vehicleAccent: "#ffd8b5",
      aiSpeedMin: 2860,
      aiSpeedMax: 3400,
      obstacleMinGap: 24,
      obstacleMaxGap: 36,
      puddleBias: 0.38,
      laneMode: "minimal",
      previewSpeed: 640,
    },
  };

  const CAR_ASSET_VERSION = "20260314-3";
  const AUDIO_ASSET_VERSION = "20260314-1";
  const CAR_SPRITE_SOURCES = {
    red: `assets/car_red_1.png?v=${CAR_ASSET_VERSION}`,
    blue: `assets/car_blue_1.png?v=${CAR_ASSET_VERSION}`,
    green: `assets/car_green_1.png?v=${CAR_ASSET_VERSION}`,
    yellow: `assets/car_yellow_1.png?v=${CAR_ASSET_VERSION}`,
  };
  const BGM_TRACK = {
    src: `assets/bgm_bouncer_cc0.mp3?v=${AUDIO_ASSET_VERSION}`,
    volume: 0.2,
  };
  const CAR_SPRITES = loadCarSprites();
  const AI_SPRITE_KEYS = ["blue", "green", "yellow", "red"];

  const CAR_PALETTE = [
    { body: "#db4e32", stripe: "#ffd166", glass: "#d8eff8" },
    { body: "#327dd2", stripe: "#ffffff", glass: "#c8eff7" },
    { body: "#3ea469", stripe: "#f6f1c6", glass: "#d7f3f7" },
    { body: "#c83a7f", stripe: "#ffe8f5", glass: "#d7eff5" },
    { body: "#c98a2c", stripe: "#fff2d3", glass: "#dff1f5" },
    { body: "#7a56d4", stripe: "#efe6ff", glass: "#dae9f5" },
  ];

  const state = {
    mode: "race",
    trackKey: "desert",
    phase: "idle",
    track: null,
    session: null,
    challenge: null,
    previewPosition: 0,
    lastTime: 0,
    keys: {
      left: false,
      right: false,
      up: false,
      down: false,
    },
    overlay: {
      title: "",
      subtitle: "",
    },
    status: "",
    resultsAction: "",
    audio: new AudioEngine(),
  };

  init();

  function init() {
    bindEvents();
    setMode("race");
    setTrack("desert");
    ui.aiCountValue.textContent = `${ui.aiCount.value} 名电脑`;
    handleReset();
    requestAnimationFrame(frame);
  }

  function bindEvents() {
    ui.modeButtons.forEach((button) => {
      button.addEventListener("click", () => {
        setMode(button.dataset.mode);
      });
    });

    ui.trackButtons.forEach((button) => {
      button.addEventListener("click", () => {
        setTrack(button.dataset.track);
      });
    });

    ui.aiCount.addEventListener("input", () => {
      ui.aiCountValue.textContent = `${ui.aiCount.value} 名电脑`;
    });

    ui.startButton.addEventListener("click", () => {
      state.audio.unlock();

      if (state.phase === "countdown" || state.phase === "playing") {
        return;
      }

      if (state.mode === "race") {
        startRace();
      } else {
        startChallenge();
      }
    });

    ui.resetButton.addEventListener("click", () => {
      handleReset();
    });

    ui.resultsAction.addEventListener("click", () => {
      if (state.resultsAction === "next-run") {
        state.challenge.index += 1;
        prepareChallengeRun();
        return;
      }

      handleReset();
    });

    window.addEventListener("keydown", (event) => {
      if (isEditableElement(event.target) && state.phase === "idle") {
        return;
      }

      if (event.key === "ArrowLeft") {
        state.keys.left = true;
        event.preventDefault();
      } else if (event.key === "ArrowRight") {
        state.keys.right = true;
        event.preventDefault();
      } else if (event.key === "ArrowUp") {
        state.keys.up = true;
        event.preventDefault();
      } else if (event.key === "ArrowDown") {
        state.keys.down = true;
        event.preventDefault();
      }
    });

    window.addEventListener("keyup", (event) => {
      if (event.key === "ArrowLeft") {
        state.keys.left = false;
      } else if (event.key === "ArrowRight") {
        state.keys.right = false;
      } else if (event.key === "ArrowUp") {
        state.keys.up = false;
      } else if (event.key === "ArrowDown") {
        state.keys.down = false;
      }
    });

    window.addEventListener("blur", () => {
      clearKeys();
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        clearKeys();
      }
    });
  }

  function frame(timestamp) {
    if (!state.lastTime) {
      state.lastTime = timestamp;
    }

    const deltaTime = Math.min((timestamp - state.lastTime) / 1000, 0.033);
    state.lastTime = timestamp;

    update(deltaTime);
    render(timestamp);
    requestAnimationFrame(frame);
  }

  function update(deltaTime) {
    if (!state.track) {
      state.track = buildTrack(state.trackKey);
    }

    if (state.phase === "idle") {
      state.previewPosition = increase(state.previewPosition, state.track.theme.previewSpeed * deltaTime, state.track.length);
      state.audio.setEngine(0, false);
      state.audio.setMusic(false);
      syncHud();
      return;
    }

    const session = state.session;
    if (!session) {
      return;
    }

    decrementVehicleTimers(session.player, deltaTime);
    session.aiCars.forEach((car) => decrementVehicleTimers(car, deltaTime));

    if (state.phase === "countdown") {
      session.countdown -= deltaTime;
      session.overlayFlash = Math.max(0, session.overlayFlash - deltaTime);

      const marker = Math.ceil(session.countdown);
      if (marker > 0 && marker !== session.countdownMarker) {
        session.countdownMarker = marker;
        state.audio.playCountdown(marker);
      }

      if (session.countdown <= 0) {
        state.phase = "playing";
        session.elapsed = 0;
        setOverlay("GO", session.type === "race" ? "先冲过终点线获胜" : `${session.player.name} 的 90 秒挑战已经开始`);
        setStatus(session.type === "race" ? "比赛开始，抢占线路并避开障碍。" : `${session.player.name} 正在挑战，90 秒后自动结算。`);
        state.audio.playGo();
      } else {
        const title = `${Math.ceil(session.countdown)}`;
        const subtitle = session.type === "race" ? "准备发车" : `${session.player.name} 准备上车`;
        setOverlay(title, subtitle);
      }

      state.audio.setEngine(0, true);
      state.audio.setMusic(false);
      syncHud();
      return;
    }

    if (state.phase !== "playing") {
      state.audio.setEngine(0, false);
      state.audio.setMusic(false);
      syncHud();
      return;
    }

    session.elapsed += deltaTime;
    updatePlayer(session.player, deltaTime);

    if (session.type === "race") {
      updateAICars(session.aiCars, deltaTime);
      updateRaceProgress();
    } else {
      session.timeLeft = Math.max(0, session.timeLeft - deltaTime);
      if (session.timeLeft <= 0) {
        finishChallengeRun();
      }
    }

    syncHud();
    const isStillPlaying = state.phase === "playing";
    state.audio.setEngine(isStillPlaying ? session.player.speed : 0, isStillPlaying);
    state.audio.setMusic(isStillPlaying);
  }

  function render(timestamp) {
    const track = state.track;
    if (!track) {
      return;
    }

    const renderContext = getRenderContext(timestamp);
    drawWorld(track, renderContext.player, renderContext.aiCars, timestamp);
    drawPlayerCar(renderContext.player, track.theme, timestamp);
    drawCanvasHud(renderContext, track.theme);
  }

  function getRenderContext(timestamp) {
    if (state.phase === "idle") {
      return {
        player: {
          coursePosition: state.previewPosition,
          x: Math.sin(timestamp / 1200) * 0.08,
          speed: state.track.theme.previewSpeed * 2.8,
          spinTimer: 0,
          spinDuration: 1,
          spinDirection: 1,
          bounceTimer: 0,
          steerVisual: Math.sin(timestamp / 650) * 0.18,
          trailJitter: 0,
        },
        aiCars: [],
      };
    }

    return {
      player: state.session.player,
      aiCars: state.session.aiCars,
    };
  }

  function drawWorld(track, player, aiCars, timestamp) {
    const theme = track.theme;
    const horizonY = canvas.height * 0.38;
    const playerPosition = player.coursePosition;
    const baseSegment = findSegment(track, playerPosition);
    const playerSegment = findSegment(track, playerPosition + ROAD.playerZ);
    const playerPercent = percentRemaining(playerPosition + ROAD.playerZ, ROAD.segmentLength);
    const playerY = interpolate(playerSegment.p1.world.y, playerSegment.p2.world.y, playerPercent);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground(theme, horizonY, playerPosition, timestamp);

    let maxY = canvas.height;
    let x = 0;
    let dx = -(baseSegment.curve * percentRemaining(playerPosition, ROAD.segmentLength));
    const visibleSegments = [];
    const visibleCars = collectVisibleCars(track, aiCars, playerPosition);

    for (let drawIndex = 0; drawIndex < ROAD.drawDistance; drawIndex += 1) {
      const segmentIndex = (baseSegment.index + drawIndex) % track.segments.length;
      const segment = track.segments[segmentIndex];
      const looped = segmentIndex < baseSegment.index;
      const cameraZ = playerPosition - (looped ? track.length : 0);

      project(segment.p1, (player.x * ROAD.roadWidth) - x, playerY + ROAD.cameraHeight, cameraZ);
      project(segment.p2, (player.x * ROAD.roadWidth) - x - dx, playerY + ROAD.cameraHeight, cameraZ);

      x += dx;
      dx += segment.curve;

      if (segment.p1.camera.z <= ROAD.cameraDepth || segment.p2.screen.y >= maxY || segment.p2.screen.y >= segment.p1.screen.y) {
        continue;
      }

      segment.clip = maxY;
      segment.fog = drawIndex / ROAD.drawDistance;
      maxY = segment.p2.screen.y;
      visibleSegments.push(segment);
    }

    for (let index = visibleSegments.length - 1; index >= 0; index -= 1) {
      const segment = visibleSegments[index];
      drawRoadSegment(segment, track, index);
    }

    for (let index = visibleSegments.length - 1; index >= 0; index -= 1) {
      const segment = visibleSegments[index];
      drawRoadObjects(segment, track, visibleCars.get(segment.index) || [], playerPosition);
    }
  }

  function drawBackground(theme, horizonY, playerPosition, timestamp) {
    const skyGradient = ctx.createLinearGradient(0, 0, 0, horizonY);
    skyGradient.addColorStop(0, theme.skyTop);
    skyGradient.addColorStop(1, theme.skyBottom);
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, horizonY);

    ctx.fillStyle = theme.groundA;
    ctx.fillRect(0, horizonY, canvas.width, canvas.height - horizonY);

    const parallax = (playerPosition / ROAD.segmentLength) * 0.18;
    if (theme.key === "desert") {
      drawSun(theme.backdropC, canvas.width * 0.78, horizonY * 0.28, 56);
      drawDuneLayer(theme.backdropA, horizonY + 24, 90, 0.8, parallax * 0.55);
      drawDuneLayer(theme.backdropB, horizonY + 58, 150, 1.25, parallax * 0.85);
    } else if (theme.key === "jungle") {
      drawCanopyLayer(theme.backdropA, horizonY + 10, 80, 1, parallax * 0.6);
      drawCanopyLayer(theme.backdropB, horizonY + 48, 130, 1.4, parallax);
      drawMist(theme.backdropC, horizonY);
    } else if (theme.key === "highway") {
      drawSkyline(theme.backdropB, horizonY + 24, 1.1, parallax * 0.8);
      drawSkyline(theme.backdropA, horizonY + 52, 1.4, parallax * 1.15);
      drawCloudBand(theme.backdropC, horizonY * 0.42, timestamp);
    } else {
      drawMountainLayer(theme.backdropC, horizonY + 18, 95, 1, parallax * 0.5);
      drawMountainLayer(theme.backdropA, horizonY + 46, 155, 1.3, parallax * 0.9);
      drawMountainLayer(theme.backdropB, horizonY + 92, 230, 1.55, parallax * 1.2);
    }
  }

  function drawRoadSegment(segment, track, drawOrder) {
    const theme = track.theme;
    const alternator = Math.floor(segment.index / ROAD.rumbleLength) % 2;
    const grassColor = alternator === 0 ? theme.groundA : theme.groundB;
    const rumbleColor = alternator === 0 ? theme.rumbleA : theme.rumbleB;

    const p1 = segment.p1.screen;
    const p2 = segment.p2.screen;
    const roadColor = applyFog(theme.road, segment.fog);
    const laneColor = applyFog(theme.lane, segment.fog);
    const grassFog = applyFog(grassColor, segment.fog);
    const rumbleFog = applyFog(rumbleColor, segment.fog);

    drawQuad(0, p2.y, canvas.width, p2.y, canvas.width, p1.y, 0, p1.y, grassFog);

    const rumble1 = p1.w * 1.12;
    const rumble2 = p2.w * 1.12;
    drawQuad(p1.x - rumble1, p1.y, p1.x - p1.w, p1.y, p2.x - p2.w, p2.y, p2.x - rumble2, p2.y, rumbleFog);
    drawQuad(p1.x + p1.w, p1.y, p1.x + rumble1, p1.y, p2.x + rumble2, p2.y, p2.x + p2.w, p2.y, rumbleFog);
    drawQuad(p1.x - p1.w, p1.y, p1.x + p1.w, p1.y, p2.x + p2.w, p2.y, p2.x - p2.w, p2.y, roadColor);

    if (theme.laneMode !== "minimal") {
      const laneCount = ROAD.lanes - 1;
      const laneWidth1 = (p1.w * 2) / ROAD.lanes;
      const laneWidth2 = (p2.w * 2) / ROAD.lanes;

      for (let lane = 1; lane <= laneCount; lane += 1) {
        if (theme.laneMode === "broken" && Math.floor((segment.index + lane) / 6) % 2 === 1) {
          continue;
        }

        const laneX1 = p1.x - p1.w + laneWidth1 * lane;
        const laneX2 = p2.x - p2.w + laneWidth2 * lane;
        const laneMarkerWidth = theme.laneMode === "solid" ? 6 : 4;
        drawQuad(
          laneX1 - laneMarkerWidth,
          p1.y,
          laneX1 + laneMarkerWidth,
          p1.y,
          laneX2 + laneMarkerWidth,
          p2.y,
          laneX2 - laneMarkerWidth,
          p2.y,
          laneColor
        );
      }
    }

    if (segment.isFinishLine) {
      drawFinishLine(segment);
    }

    const stripeAlpha = Math.max(0.12, 0.4 - drawOrder / 500);
    ctx.strokeStyle = `rgba(255, 255, 255, ${stripeAlpha})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(p2.x - p2.w, p2.y);
    ctx.lineTo(p2.x + p2.w, p2.y);
    ctx.stroke();
  }

  function drawRoadObjects(segment, track, carsOnSegment, playerPosition) {
    const p1 = segment.p1.screen;
    const p2 = segment.p2.screen;
    const theme = track.theme;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, segment.clip);
    ctx.clip();

    segment.obstacles.forEach((obstacle) => {
      const percent = 0.5;
      const roadWidth = interpolate(p1.w, p2.w, percent);
      const laneScreenWidth = (roadWidth * 2) / ROAD.lanes;
      const spec = OBSTACLE_SPECS[obstacle.type];
      const x = interpolate(p1.x, p2.x, percent) + roadWidth * obstacle.offset;
      const y = interpolate(p1.y, p2.y, percent);
      const width = laneScreenWidth * spec.laneCoverage;
      const height = width * spec.heightRatio;
      drawObstacle(obstacle, x, y, width, height, theme);
    });

    carsOnSegment.forEach((car) => {
      const percent = percentRemaining(car.coursePosition, ROAD.segmentLength);
      const roadWidth = interpolate(p1.w, p2.w, percent);
      const x = interpolate(p1.x, p2.x, percent) + roadWidth * car.x;
      const y = interpolate(p1.y, p2.y, percent);
      const scale = roadWidth / ROAD.roadWidth;
      drawAICar(car, x, y, scale, theme);
    });

    if (segment.index % 14 === 0) {
      const leftX = p2.x - p2.w - 40;
      const rightX = p2.x + p2.w + 40;
      const postHeight = Math.max(8, p2.w * 0.04);
      drawRoadPost(leftX, p2.y, postHeight, theme);
      drawRoadPost(rightX, p2.y, postHeight, theme);
    }

    if (track.theme.key === "jungle" && segment.index % 17 === 0) {
      drawVineSilhouette(p2.x - p2.w - 70, p2.y - 8, p2.w * 0.06, theme.backdropB);
      drawVineSilhouette(p2.x + p2.w + 58, p2.y - 4, p2.w * 0.04, theme.backdropA);
    }

    if (track.theme.key === "desert" && segment.index % 19 === 0) {
      drawCactus(p2.x - p2.w - 76, p2.y + 8, p2.w * 0.06, theme.backdropB);
      drawCactus(p2.x + p2.w + 68, p2.y + 10, p2.w * 0.05, theme.backdropA);
    }

    if (track.theme.key === "mountain" && segment.index % 15 === 0) {
      drawPine(p2.x - p2.w - 60, p2.y + 6, p2.w * 0.06, theme.backdropB);
      drawPine(p2.x + p2.w + 64, p2.y + 8, p2.w * 0.05, theme.backdropA);
    }

    if (track.theme.key === "highway" && segment.index % 20 === 0) {
      drawRoadLamp(p2.x - p2.w - 44, p2.y, p2.w * 0.08, theme.backdropC);
      drawRoadLamp(p2.x + p2.w + 44, p2.y, p2.w * 0.08, theme.backdropC);
    }

    if (playerPosition > track.finishDistance - ROAD.segmentLength * 14 && segment.index === track.finishSegmentIndex) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    }

    ctx.restore();
  }

  function drawPlayerCar(player, theme, timestamp) {
    const baseX = canvas.width * 0.5 + player.x * canvas.width * 0.12;
    const baseY = canvas.height * 0.83 + Math.sin(timestamp / 90) * 1.2;
    const bounceOffset = player.bounceTimer > 0 ? Math.sin((1 - player.bounceTimer / player.bounceDuration) * Math.PI * 4) * 10 : 0;
    const tilt = player.spinTimer > 0
      ? player.spinDirection * (1 - player.spinTimer / player.spinDuration) * Math.PI * 2
      : player.steerVisual * 0.32;
    const playerSprite = CAR_SPRITES.red;

    if (isSpriteReady(playerSprite)) {
      drawCarSprite(playerSprite, baseX + bounceOffset, baseY - 4, tilt, 108, 200, 1);
      return;
    }

    const carWidth = 118;
    const carHeight = 164;

    ctx.save();
    ctx.translate(baseX + bounceOffset, baseY);
    ctx.rotate(tilt);

    ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
    ctx.beginPath();
    ctx.ellipse(0, 26, carWidth * 0.42, carHeight * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#121a1f";
    ctx.beginPath();
    roundedRectPath(ctx, -carWidth * 0.35, -carHeight * 0.32, carWidth * 0.14, carHeight * 0.2, 8);
    roundedRectPath(ctx, carWidth * 0.21, -carHeight * 0.32, carWidth * 0.14, carHeight * 0.2, 8);
    roundedRectPath(ctx, -carWidth * 0.35, carHeight * 0.09, carWidth * 0.14, carHeight * 0.2, 8);
    roundedRectPath(ctx, carWidth * 0.21, carHeight * 0.09, carWidth * 0.14, carHeight * 0.2, 8);
    ctx.fill();

    const bodyGradient = ctx.createLinearGradient(0, -carHeight * 0.6, 0, carHeight * 0.4);
    bodyGradient.addColorStop(0, shadeColor(theme.accent, 22));
    bodyGradient.addColorStop(0.55, theme.accent);
    bodyGradient.addColorStop(1, shadeColor(theme.accent, -24));
    ctx.fillStyle = bodyGradient;

    ctx.beginPath();
    ctx.moveTo(0, -carHeight * 0.46);
    ctx.bezierCurveTo(carWidth * 0.45, -carHeight * 0.38, carWidth * 0.48, -carHeight * 0.12, carWidth * 0.38, carHeight * 0.34);
    ctx.bezierCurveTo(carWidth * 0.24, carHeight * 0.46, -carWidth * 0.24, carHeight * 0.46, -carWidth * 0.38, carHeight * 0.34);
    ctx.bezierCurveTo(-carWidth * 0.48, -carHeight * 0.12, -carWidth * 0.45, -carHeight * 0.38, 0, -carHeight * 0.46);
    ctx.fill();

    ctx.fillStyle = theme.vehicleAccent;
    ctx.fillRect(-carWidth * 0.07, -carHeight * 0.35, carWidth * 0.14, carHeight * 0.66);
    ctx.fillRect(-carWidth * 0.22, carHeight * 0.22, carWidth * 0.44, carHeight * 0.06);

    ctx.fillStyle = "rgba(219, 242, 255, 0.88)";
    ctx.beginPath();
    ctx.moveTo(-carWidth * 0.2, -carHeight * 0.15);
    ctx.lineTo(-carWidth * 0.12, -carHeight * 0.28);
    ctx.lineTo(carWidth * 0.12, -carHeight * 0.28);
    ctx.lineTo(carWidth * 0.2, -carHeight * 0.15);
    ctx.lineTo(carWidth * 0.16, carHeight * 0.03);
    ctx.lineTo(-carWidth * 0.16, carHeight * 0.03);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(255, 226, 157, 0.88)";
    ctx.beginPath();
    roundedRectPath(ctx, -carWidth * 0.24, -carHeight * 0.36, carWidth * 0.14, carHeight * 0.08, 10);
    roundedRectPath(ctx, carWidth * 0.1, -carHeight * 0.36, carWidth * 0.14, carHeight * 0.08, 10);
    ctx.fill();

    ctx.restore();
  }

  function drawCanvasHud(renderContext, theme) {
    if (state.phase === "idle") {
      return;
    }

    const player = renderContext.player;

    ctx.save();
    ctx.fillStyle = "rgba(14, 17, 20, 0.34)";
    ctx.fillRect(canvas.width - 260, 18, 242, 122);

    ctx.fillStyle = "#fff8ef";
    ctx.font = "700 22px 'Avenir Next Condensed', 'Franklin Gothic Medium', sans-serif";
    ctx.fillText(player.name, canvas.width - 238, 50);

    ctx.font = "600 16px 'Avenir Next Condensed', 'Franklin Gothic Medium', sans-serif";
    const modeText = state.mode === "race" ? "电脑竞速" : "90 秒挑战";
    const speedText = `${player.speed < 0 ? "-" : ""}${Math.round(Math.abs(player.speed) * KPH_PER_UNIT)} km/h`;
    const distanceText = formatDistance(player.distanceMeters);
    ctx.fillText(modeText, canvas.width - 238, 78);
    ctx.fillText(`速度 ${speedText}`, canvas.width - 238, 102);
    ctx.fillText(`距离 ${distanceText}`, canvas.width - 238, 126);
    ctx.restore();

    if (state.phase === "result") {
      ctx.save();
      ctx.fillStyle = "rgba(255, 248, 237, 0.12)";
      ctx.fillRect(18, canvas.height - 82, 360, 46);
      ctx.fillStyle = "#fff7ef";
      ctx.font = "600 18px 'Avenir Next Condensed', 'Franklin Gothic Medium', sans-serif";
      ctx.fillText("点击右下角结果面板继续或重新开始", 32, canvas.height - 52);
      ctx.restore();
    }
  }

  function updatePlayer(player, deltaTime) {
    const segment = findSegment(state.track, player.coursePosition + ROAD.playerZ);
    const steerInput = (state.keys.left ? -1 : 0) + (state.keys.right ? 1 : 0);
    player.steerVisual = moveToward(player.steerVisual, steerInput, deltaTime * 4.5);

    if (player.lockTimer <= 0) {
      if (state.keys.up && !state.keys.down) {
        player.speed += PHYSICS.acceleration * deltaTime;
      } else if (state.keys.down && !state.keys.up) {
        if (player.speed > 0) {
          player.speed -= PHYSICS.braking * deltaTime;
        } else {
          player.speed -= PHYSICS.reverseAcceleration * deltaTime;
        }
      } else {
        player.speed = moveToward(player.speed, 0, PHYSICS.naturalDeceleration * deltaTime);
      }

      const steeringDirection = player.speed >= 0 ? 1 : -0.55;
      if (Math.abs(player.speed) > 20) {
        player.x += steerInput * PHYSICS.steeringRate * deltaTime * (0.28 + Math.abs(player.speed) / PHYSICS.maxSpeed) * steeringDirection;
      }
    } else {
      player.speed = moveToward(player.speed, player.speed > 0 ? player.speed * 0.82 : player.speed * 0.8, 500 * deltaTime);
    }

    const slope = (segment.p2.world.y - segment.p1.world.y) / ROAD.segmentLength;
    player.speed -= slope * 420 * deltaTime;
    player.speed -= segment.curve * PHYSICS.centrifugal * player.speed * deltaTime;

    player.speed = clamp(player.speed, -PHYSICS.reverseMaxSpeed, PHYSICS.maxSpeed);

    if (Math.abs(player.x) > 1.08) {
      if (Math.abs(player.speed) > PHYSICS.offroadSpeedLimit) {
        player.speed = moveToward(
          player.speed,
          Math.sign(player.speed) * PHYSICS.offroadSpeedLimit,
          PHYSICS.offroadDeceleration * deltaTime
        );
      }
    }

    player.x = clamp(player.x, -1.75, 1.75);

    const movement = player.speed * deltaTime;
    if (state.session.type === "race") {
      player.progress = clamp(player.progress + movement, 0, state.track.finishDistance);
      player.coursePosition = player.progress;
    } else {
      const nextProgress = Math.max(0, player.progress + movement);
      const actualMovement = nextProgress - player.progress;
      player.progress = nextProgress;
      player.coursePosition = player.progress === 0 && actualMovement <= 0
        ? 0
        : increase(player.coursePosition, actualMovement, state.track.length);
    }

    player.distanceMeters = Math.max(0, player.progress * METERS_PER_UNIT);
    handleObstacleCollision(player, true);
  }

  function updateAICars(aiCars, deltaTime) {
    aiCars.forEach((car) => {
      if (car.finished) {
        return;
      }

      if (car.startDelay > 0) {
        car.startDelay -= deltaTime;
        return;
      }

      const segment = findSegment(state.track, car.coursePosition);
      const targetLane = chooseAILane(car, aiCars);
      car.targetX = targetLane;
      car.x = moveToward(car.x, targetLane, deltaTime * 0.75);

      if (car.lockTimer <= 0) {
        const curvePenalty = 1 - Math.min(0.18, Math.abs(segment.curve) * 0.1);
        const slope = (segment.p2.world.y - segment.p1.world.y) / ROAD.segmentLength;
        const hillPenalty = slope > 0 ? 1 - Math.min(0.12, slope * 0.14) : 1 + Math.min(0.06, Math.abs(slope) * 0.08);
        const targetSpeed = car.baseSpeed * curvePenalty * hillPenalty;
        car.speed = moveToward(car.speed, targetSpeed, 1300 * deltaTime);
      } else {
        car.speed = moveToward(car.speed, car.speed * 0.84, 500 * deltaTime);
      }

      car.progress = clamp(car.progress + car.speed * deltaTime, 0, state.track.finishDistance);
      car.coursePosition = car.progress;
      car.distanceMeters = car.progress * METERS_PER_UNIT;
      handleObstacleCollision(car, false);
    });
  }

  function chooseAILane(car, allCars) {
    const segmentIndex = Math.floor(car.coursePosition / ROAD.segmentLength);
    const lanes = [-0.78, -0.4, 0, 0.4, 0.78];
    let bestLane = car.baseLane;
    let bestScore = -Infinity;

    lanes.forEach((candidate) => {
      let score = 0.4 - Math.abs(candidate - car.x);

      for (let lookAhead = 2; lookAhead <= 16; lookAhead += 1) {
        const futureSegment = state.track.segments[Math.min(state.track.segments.length - 1, segmentIndex + lookAhead)];
        futureSegment.obstacles.forEach((obstacle) => {
          const safeDistance = obstacle.type === "puddle" ? 0.25 : 0.2;
          if (Math.abs(candidate - obstacle.offset) < safeDistance) {
            score -= 6 / lookAhead;
          }
        });
      }

      allCars.forEach((otherCar) => {
        if (otherCar === car || otherCar.finished) {
          return;
        }

        const distance = otherCar.progress - car.progress;
        if (distance > 0 && distance < ROAD.segmentLength * 8 && Math.abs(candidate - otherCar.x) < 0.18) {
          score -= 2.8;
        }
      });

      score -= Math.abs(candidate) * 0.24;

      if (score > bestScore) {
        bestScore = score;
        bestLane = candidate;
      }
    });

    return bestLane;
  }

  function handleObstacleCollision(vehicle, isPlayer) {
    if (vehicle.collisionCooldown > 0) {
      return;
    }

    const collisionZ = isPlayer ? vehicle.coursePosition + ROAD.playerZ : vehicle.coursePosition;
    const segment = findSegment(state.track, collisionZ);
    for (const obstacle of segment.obstacles) {
      const hitWidth = OBSTACLE_SPECS[obstacle.type].hitHalfWidth;
      if (Math.abs(vehicle.x - obstacle.offset) < hitWidth + vehicle.width) {
        vehicle.collisionCooldown = obstacle.type === "puddle" ? 0.72 : 0.56;
        if (obstacle.type === "puddle") {
          vehicle.spinDuration = 0.86;
          vehicle.spinTimer = vehicle.spinDuration;
          vehicle.lockTimer = 0.86;
          vehicle.spinDirection = vehicle.x > obstacle.offset ? 1 : -1;
          vehicle.speed *= isPlayer ? 0.62 : 0.72;
          if (isPlayer) {
            setOverlay("打滑", "轮胎失去抓地力，车辆正在旋转");
            state.audio.playSkid();
          }
        } else {
          vehicle.bounceDuration = 0.44;
          vehicle.bounceTimer = vehicle.bounceDuration;
          vehicle.lockTimer = 0.45;
          vehicle.bounceForce = vehicle.x > obstacle.offset ? 0.44 : -0.44;
          vehicle.speed = 0;
          vehicle.x = clamp(vehicle.x + vehicle.bounceForce, -1.75, 1.75);
          if (isPlayer) {
            setOverlay("撞上箱子", "被弹开并且速度归零");
            state.audio.playHit();
          }
        }
        break;
      }
    }
  }

  function updateRaceProgress() {
    const competitors = [state.session.player, ...state.session.aiCars];
    competitors.sort((a, b) => b.progress - a.progress);
    competitors.forEach((vehicle, index) => {
      vehicle.rank = index + 1;
    });

    const winner = competitors.find((vehicle) => vehicle.progress >= state.track.finishDistance);
    if (!winner) {
      return;
    }

    finishRace(winner, competitors);
  }

  function finishRace(winner, standings) {
    if (state.phase === "result") {
      return;
    }

    state.phase = "result";
    state.session.player.finished = true;
    setOverlay(`${winner.name} 获胜`, `本场第一名来自 ${winner.name}`);
    setStatus(`比赛结束。${winner.name} 率先冲线，已生成当前排名。`);
    state.audio.playFinish();
    showResults(
      "竞速结果",
      standings.map((vehicle) => `${vehicle.name} - ${formatDistance(vehicle.distanceMeters)}`),
      "再来一局",
      "restart"
    );
  }

  function finishChallengeRun() {
    if (state.phase === "result") {
      return;
    }

    const player = state.session.player;
    state.phase = "result";
    state.challenge.results.push({
      name: player.name,
      distanceMeters: player.distanceMeters,
    });
    state.challenge.results.sort((a, b) => b.distanceMeters - a.distanceMeters);

    const hasNextRunner = state.challenge.index < state.challenge.players.length - 1;
    const title = hasNextRunner ? `${player.name} 完成挑战` : "全部挑战完成";
    const buttonLabel = hasNextRunner ? "下一位" : "重新开始";
    const action = hasNextRunner ? "next-run" : "restart";
    const subtitle = hasNextRunner
      ? `本轮距离 ${formatDistance(player.distanceMeters)}，请准备下一位选手。`
      : `冠军是 ${state.challenge.results[0].name}，成绩 ${formatDistance(state.challenge.results[0].distanceMeters)}。`;

    setOverlay(title, subtitle);
    setStatus(hasNextRunner ? "当前轮次已结算，点击下一位进入倒计时。" : "所有玩家已完成 90 秒挑战。");
    state.audio.playFinish();
    showResults(
      "挑战排名",
      state.challenge.results.map((result) => `${result.name} - ${formatDistance(result.distanceMeters)}`),
      buttonLabel,
      action
    );
  }

  function startRace() {
    const playerName = sanitizeName(ui.racePlayerName.value, "玩家一");
    const aiCount = clamp(Number(ui.aiCount.value), 2, 6);
    state.track = buildTrack(state.trackKey);
    state.session = {
      type: "race",
      player: createPlayer(playerName),
      aiCars: createAICars(aiCount),
      elapsed: 0,
      countdown: 3.9,
      countdownMarker: 4,
    };
    state.challenge = null;
    state.phase = "countdown";
    ui.resetButton.classList.remove("is-hidden");
    hideResults();
    setOverlay("3", "准备发车");
    setStatus(`赛道已锁定为 ${state.track.name}，共 ${aiCount} 名电脑参赛。`);
    syncHud();
  }

  function startChallenge() {
    const players = parsePlayers(ui.playerNames.value);
    state.challenge = {
      players,
      results: [],
      index: 0,
    };
    prepareChallengeRun();
  }

  function prepareChallengeRun() {
    const currentPlayer = state.challenge.players[state.challenge.index];
    state.track = buildTrack(state.trackKey);
    state.session = {
      type: "time",
      player: createPlayer(currentPlayer),
      aiCars: [],
      elapsed: 0,
      timeLeft: 90,
      countdown: 3.9,
      countdownMarker: 4,
    };
    state.phase = "countdown";
    ui.resetButton.classList.remove("is-hidden");
    hideResults();
    setOverlay("3", `${currentPlayer} 准备上车`);
    setStatus(`${currentPlayer} 的 90 秒挑战即将开始。`);
    syncHud();
  }

  function handleReset() {
    state.phase = "idle";
    state.track = buildTrack(state.trackKey);
    state.session = null;
    state.challenge = null;
    state.previewPosition = 0;
    state.resultsAction = "";
    clearKeys();
    hideResults();
    ui.resetButton.classList.add("is-hidden");
    setOverlay("等待发车", "设置完成后点击开始比赛。");
    setStatus("选择模式和赛道后开始。");
    syncHud();
  }

  function createPlayer(name) {
    return {
      name,
      x: 0,
      targetX: 0,
      baseLane: 0,
      speed: 0,
      progress: 0,
      coursePosition: 0,
      distanceMeters: 0,
      width: 0.15,
      rank: 1,
      spinTimer: 0,
      spinDuration: 1,
      spinDirection: 1,
      bounceTimer: 0,
      bounceDuration: 0.5,
      bounceForce: 0,
      lockTimer: 0,
      collisionCooldown: 0,
      steerVisual: 0,
      finished: false,
    };
  }

  function createAICars(count) {
    const theme = state.track.theme;
    const rng = createRandom(`${theme.key}-${count}`);
    const lanes = [-0.78, -0.4, 0, 0.4, 0.78];

    return Array.from({ length: count }, (_, index) => {
      const palette = CAR_PALETTE[index % CAR_PALETTE.length];
      const lane = lanes[index % lanes.length] + (rng() - 0.5) * 0.12;
      return {
        name: `电脑 ${index + 1}`,
        x: lane,
        targetX: lane,
        baseLane: lane,
        speed: 0,
        progress: 0,
        coursePosition: 0,
        distanceMeters: 0,
        width: 0.14,
        rank: index + 2,
        spinTimer: 0,
        spinDuration: 1,
        spinDirection: 1,
        bounceTimer: 0,
        bounceDuration: 0.5,
        bounceForce: 0,
        lockTimer: 0,
        collisionCooldown: 0,
        steerVisual: 0,
        finished: false,
        startDelay: index * 0.08,
        baseSpeed: theme.aiSpeedMin + rng() * (theme.aiSpeedMax - theme.aiSpeedMin),
        palette,
        spriteKey: AI_SPRITE_KEYS[index % AI_SPRITE_KEYS.length],
      };
    });
  }

  function buildTrack(trackKey) {
    const theme = TRACKS[trackKey];
    const segments = [];

    function lastY() {
      return segments.length > 0 ? segments[segments.length - 1].p2.world.y : 0;
    }

    function addSegment(curve, y) {
      const index = segments.length;
      const p1y = lastY();
      segments.push({
        index,
        curve,
        p1: {
          world: { x: 0, y: p1y, z: index * ROAD.segmentLength },
          camera: {},
          screen: {},
        },
        p2: {
          world: { x: 0, y, z: (index + 1) * ROAD.segmentLength },
          camera: {},
          screen: {},
        },
        clip: 0,
        fog: 0,
        obstacles: [],
        isFinishLine: false,
      });
    }

    function addRoad(enter, hold, leave, curve, hill) {
      const startY = lastY();
      const endY = startY + hill * 920;
      const total = enter + hold + leave;

      for (let index = 0; index < enter; index += 1) {
        addSegment(easeIn(0, curve, index / enter), easeInOut(startY, endY, (index + 1) / total));
      }

      for (let index = 0; index < hold; index += 1) {
        addSegment(curve, easeInOut(startY, endY, (enter + index + 1) / total));
      }

      for (let index = 0; index < leave; index += 1) {
        addSegment(easeOut(curve, 0, index / leave), easeInOut(startY, endY, (enter + hold + index + 1) / total));
      }
    }

    addRoad(18, 40, 18, 0, 0);

    if (trackKey === "desert") {
      for (let index = 0; index < 5; index += 1) {
        addRoad(18, 56, 18, 0.42, 1.2);
        addRoad(12, 28, 12, -0.68, -0.42);
        addRoad(16, 40, 16, 0, 1.45);
        addRoad(10, 25, 10, index % 2 === 0 ? 0.58 : -0.52, 0.18);
      }
    } else if (trackKey === "jungle") {
      for (let index = 0; index < 7; index += 1) {
        addRoad(12, 24, 12, index % 2 === 0 ? 0.72 : -0.68, 0.5);
        addRoad(10, 22, 10, index % 2 === 0 ? -0.78 : 0.74, -0.24);
        addRoad(14, 28, 14, index % 3 === 0 ? 0.48 : -0.42, 0.88);
        addRoad(8, 18, 8, index % 2 === 0 ? -0.84 : 0.86, 0.12);
      }
    } else if (trackKey === "highway") {
      for (let index = 0; index < 4; index += 1) {
        addRoad(22, 76, 22, 0.18, 0.48);
        addRoad(20, 50, 20, index % 2 === 0 ? 0.35 : -0.38, 0.22);
        addRoad(16, 52, 16, 0, 0.92);
        addRoad(14, 34, 14, index % 2 === 0 ? -0.22 : 0.24, -0.36);
      }
    } else {
      for (let index = 0; index < 6; index += 1) {
        addRoad(10, 24, 10, index % 2 === 0 ? 0.88 : -0.9, 1.25);
        addRoad(12, 22, 12, index % 2 === 0 ? -0.94 : 0.92, -0.62);
        addRoad(10, 18, 10, 0.46, 1.6);
        addRoad(8, 18, 8, -0.52, -0.18);
      }
    }

    addRoad(24, 60, 24, 0, 0);

    const track = {
      key: trackKey,
      name: theme.name,
      theme,
      segments,
      length: segments.length * ROAD.segmentLength,
      finishDistance: Math.max(ROAD.segmentLength * 10, (segments.length - 14) * ROAD.segmentLength),
      finishSegmentIndex: Math.max(0, segments.length - 14),
    };

    const finishSegment = segments[track.finishSegmentIndex];
    if (finishSegment) {
      finishSegment.isFinishLine = true;
    }

    placeObstacles(track);
    return track;
  }

  function placeObstacles(track) {
    const theme = track.theme;
    const rng = createRandom(`${track.key}-obstacles`);
    const laneIndexes = Array.from({ length: ROAD.lanes }, (_, index) => index);
    let segmentIndex = 60;

    while (segmentIndex < track.segments.length - 26) {
      const type = rng() < theme.puddleBias ? "puddle" : "box";
      const segment = track.segments[segmentIndex];
      const laneIndex = laneIndexes[Math.floor(rng() * laneIndexes.length)];
      segment.obstacles.push({
        type,
        laneIndex,
        offset: getLaneCenter(laneIndex),
      });

      if (rng() > 0.72) {
        const extraIndex = Math.min(track.segments.length - 28, segmentIndex + 4 + Math.floor(rng() * 8));
        const extraSegment = track.segments[extraIndex];
        const extraLaneIndex = laneIndexes[Math.floor(rng() * laneIndexes.length)];
        extraSegment.obstacles.push({
          type: rng() < 0.5 ? "puddle" : "box",
          laneIndex: extraLaneIndex,
          offset: getLaneCenter(extraLaneIndex),
        });
      }

      segmentIndex += theme.obstacleMinGap + Math.floor(rng() * (theme.obstacleMaxGap - theme.obstacleMinGap));
    }
  }

  function syncHud() {
    ui.hudMode.textContent = state.mode === "race" ? "电脑竞速" : "90 秒挑战";
    ui.hudTrack.textContent = TRACKS[state.trackKey].name;

    if (!state.session) {
      ui.hudSpeed.textContent = "0 km/h";
      ui.hudDistance.textContent = "0 m";
      ui.hudRank.textContent = "-";
      ui.hudTimer.textContent = state.mode === "race" ? "0.0 s" : "90.0 s";
      return;
    }

    const player = state.session.player;
    ui.hudSpeed.textContent = `${player.speed < 0 ? "-" : ""}${Math.round(Math.abs(player.speed) * KPH_PER_UNIT)} km/h`;
    ui.hudDistance.textContent = formatDistance(player.distanceMeters);
    ui.hudRank.textContent = state.mode === "race" ? `${player.rank} / ${state.session.aiCars.length + 1}` : `${state.challenge.index + 1} / ${state.challenge.players.length}`;
    ui.hudTimer.textContent = state.mode === "race" ? `${state.session.elapsed.toFixed(1)} s` : `${Math.max(0, state.session.timeLeft).toFixed(1)} s`;
  }

  function setMode(mode) {
    if (state.mode === mode && state.phase === "idle") {
      return;
    }

    state.mode = mode;
    ui.modeButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.mode === mode);
    });

    ui.modeConfigs.forEach((config) => {
      config.classList.toggle("is-hidden", config.dataset.config !== mode);
    });

    handleReset();
  }

  function setTrack(trackKey) {
    state.trackKey = trackKey;
    ui.trackButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.track === trackKey);
    });

    applyTheme(TRACKS[trackKey]);
    handleReset();
  }

  function applyTheme(theme) {
    document.documentElement.style.setProperty("--accent", theme.accent);
    document.documentElement.style.setProperty("--accent-soft", theme.accentSoft);
    document.documentElement.style.setProperty("--track", theme.accent);
    document.documentElement.style.setProperty("--track-deep", shadeColor(theme.accent, -26));
  }

  function showResults(title, items, buttonLabel, action) {
    ui.resultsTitle.textContent = title;
    ui.resultsList.innerHTML = "";
    items.forEach((item) => {
      const entry = document.createElement("li");
      entry.textContent = item;
      ui.resultsList.appendChild(entry);
    });

    ui.resultsAction.textContent = buttonLabel;
    ui.resultsPanel.classList.remove("is-hidden");
    state.resultsAction = action;
  }

  function hideResults() {
    ui.resultsPanel.classList.add("is-hidden");
    ui.resultsList.innerHTML = "";
  }

  function setOverlay(title, subtitle) {
    if (state.overlay.title === title && state.overlay.subtitle === subtitle) {
      return;
    }

    state.overlay.title = title;
    state.overlay.subtitle = subtitle;
    ui.overlayTitle.textContent = title;
    ui.overlaySubtitle.textContent = subtitle;
  }

  function setStatus(message) {
    if (state.status === message) {
      return;
    }

    state.status = message;
    ui.statusMessage.textContent = message;
  }

  function parsePlayers(rawValue) {
    const players = rawValue
      .split(/\n+/)
      .map((name) => sanitizeName(name, ""))
      .filter(Boolean);

    if (players.length > 0) {
      return players;
    }

    return ["玩家 1", "玩家 2", "玩家 3"];
  }

  function sanitizeName(value, fallback) {
    const cleaned = String(value || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 20);
    return cleaned || fallback;
  }

  function collectVisibleCars(track, cars, playerPosition) {
    const carsBySegment = new Map();

    cars.forEach((car) => {
      if (car.finished || car.startDelay > 0) {
        return;
      }

      const relative = car.progress - playerPosition;
      if (relative < -ROAD.segmentLength || relative > ROAD.drawDistance * ROAD.segmentLength) {
        return;
      }

      const segment = findSegment(track, car.coursePosition);
      if (!carsBySegment.has(segment.index)) {
        carsBySegment.set(segment.index, []);
      }
      carsBySegment.get(segment.index).push(car);
    });

    return carsBySegment;
  }

  function decrementVehicleTimers(vehicle, deltaTime) {
    vehicle.spinTimer = Math.max(0, vehicle.spinTimer - deltaTime);
    vehicle.bounceTimer = Math.max(0, vehicle.bounceTimer - deltaTime);
    vehicle.lockTimer = Math.max(0, vehicle.lockTimer - deltaTime);
    vehicle.collisionCooldown = Math.max(0, vehicle.collisionCooldown - deltaTime);

    if (vehicle.bounceTimer > 0) {
      vehicle.x = clamp(vehicle.x + vehicle.bounceForce * deltaTime * 0.7, -1.75, 1.75);
    } else {
      vehicle.bounceForce = 0;
    }
  }

  function drawObstacle(obstacle, x, y, width, height, theme) {
    if (width < 1.25) {
      return;
    }

    const alpha = clamp((width - 1.25) / 4, 0.35, 1);
    ctx.save();
    ctx.globalAlpha = alpha;

    if (obstacle.type === "puddle") {
      ctx.translate(x, y);
      ctx.fillStyle = theme.puddleShade;
      ctx.beginPath();
      ctx.ellipse(0, 0, width * 0.56, height * 0.58, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = theme.puddle;
      ctx.beginPath();
      ctx.ellipse(-width * 0.04, -height * 0.04, width * 0.46, height * 0.44, -0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255, 255, 255, 0.28)";
      ctx.beginPath();
      ctx.ellipse(-width * 0.14, -height * 0.16, width * 0.18, height * 0.14, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    ctx.translate(x, y - height * 0.08);
    ctx.fillStyle = theme.boxShade;
    ctx.beginPath();
    ctx.moveTo(-width * 0.5, height * 0.18);
    ctx.lineTo(0, height * 0.42);
    ctx.lineTo(width * 0.5, height * 0.18);
    ctx.lineTo(0, -height * 0.04);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = theme.box;
    ctx.beginPath();
    ctx.moveTo(-width * 0.5, height * 0.18);
    ctx.lineTo(-width * 0.5, -height * 0.32);
    ctx.lineTo(0, -height * 0.56);
    ctx.lineTo(0, -height * 0.04);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = shadeColor(theme.box, 16);
    ctx.beginPath();
    ctx.moveTo(0, -height * 0.04);
    ctx.lineTo(0, -height * 0.56);
    ctx.lineTo(width * 0.5, -height * 0.32);
    ctx.lineTo(width * 0.5, height * 0.18);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawAICar(car, x, y, scale) {
    if (scale < 0.01) {
      return;
    }

    const width = 92 * scale;
    const height = 126 * scale;
    const sprite = CAR_SPRITES[car.spriteKey];

    if (isSpriteReady(sprite)) {
      drawCarSprite(sprite, x, y - height * 0.08, (car.targetX - car.x) * 0.15, width * 1.05, width * 1.05 * (131 / 71), 0.96);
      return;
    }

    ctx.save();
    ctx.translate(x, y - height * 0.42);
    ctx.rotate((car.targetX - car.x) * 0.15);

    ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
    ctx.beginPath();
    ctx.ellipse(0, height * 0.46, width * 0.48, height * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#10181d";
    ctx.beginPath();
    roundedRectPath(ctx, -width * 0.34, -height * 0.18, width * 0.14, height * 0.16, 4);
    roundedRectPath(ctx, width * 0.2, -height * 0.18, width * 0.14, height * 0.16, 4);
    roundedRectPath(ctx, -width * 0.34, height * 0.18, width * 0.14, height * 0.16, 4);
    roundedRectPath(ctx, width * 0.2, height * 0.18, width * 0.14, height * 0.16, 4);
    ctx.fill();

    ctx.fillStyle = car.palette.body;
    ctx.beginPath();
    ctx.moveTo(0, -height * 0.42);
    ctx.bezierCurveTo(width * 0.42, -height * 0.3, width * 0.44, 0, width * 0.32, height * 0.34);
    ctx.bezierCurveTo(width * 0.2, height * 0.44, -width * 0.2, height * 0.44, -width * 0.32, height * 0.34);
    ctx.bezierCurveTo(-width * 0.44, 0, -width * 0.42, -height * 0.3, 0, -height * 0.42);
    ctx.fill();

    ctx.fillStyle = car.palette.stripe;
    ctx.fillRect(-width * 0.08, -height * 0.36, width * 0.16, height * 0.64);

    ctx.fillStyle = car.palette.glass;
    ctx.beginPath();
    ctx.moveTo(-width * 0.18, -height * 0.08);
    ctx.lineTo(-width * 0.1, -height * 0.22);
    ctx.lineTo(width * 0.1, -height * 0.22);
    ctx.lineTo(width * 0.18, -height * 0.08);
    ctx.lineTo(width * 0.14, height * 0.05);
    ctx.lineTo(-width * 0.14, height * 0.05);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  function drawRoadPost(x, y, size, theme) {
    if (size < 1) {
      return;
    }

    ctx.fillStyle = theme.backdropB;
    ctx.fillRect(x - size * 0.14, y - size * 1.5, size * 0.28, size * 1.5);
    ctx.fillStyle = theme.rumbleA;
    ctx.fillRect(x - size * 0.34, y - size * 1.8, size * 0.68, size * 0.42);
  }

  function drawVineSilhouette(x, y, size, color) {
    if (size < 1) {
      return;
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1, size * 0.18);
    ctx.beginPath();
    ctx.moveTo(x, y - size * 2);
    ctx.bezierCurveTo(x + size, y - size * 1.4, x - size, y - size * 0.6, x + size * 0.4, y + size * 0.2);
    ctx.stroke();
  }

  function drawCactus(x, y, size, color) {
    if (size < 1.5) {
      return;
    }

    ctx.fillStyle = color;
    ctx.beginPath();
    roundedRectPath(ctx, x - size * 0.16, y - size * 1.4, size * 0.32, size * 1.4, size * 0.12);
    roundedRectPath(ctx, x - size * 0.46, y - size * 0.96, size * 0.18, size * 0.56, size * 0.1);
    roundedRectPath(ctx, x + size * 0.28, y - size * 1.02, size * 0.18, size * 0.54, size * 0.1);
    ctx.fill();
  }

  function drawPine(x, y, size, color) {
    if (size < 1.4) {
      return;
    }

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y - size * 2);
    ctx.lineTo(x - size * 0.78, y - size * 0.7);
    ctx.lineTo(x - size * 0.2, y - size * 0.7);
    ctx.lineTo(x - size * 0.88, y + size * 0.14);
    ctx.lineTo(x + size * 0.88, y + size * 0.14);
    ctx.lineTo(x + size * 0.2, y - size * 0.7);
    ctx.lineTo(x + size * 0.78, y - size * 0.7);
    ctx.closePath();
    ctx.fill();

    ctx.fillRect(x - size * 0.1, y + size * 0.14, size * 0.2, size * 0.66);
  }

  function drawRoadLamp(x, y, size, color) {
    if (size < 1.2) {
      return;
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1, size * 0.14);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - size * 2.1);
    ctx.lineTo(x + size * 0.74, y - size * 2.44);
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 245, 194, 0.9)";
    ctx.beginPath();
    ctx.arc(x + size * 0.74, y - size * 2.44, size * 0.22, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawFinishLine(segment) {
    const p1 = segment.p1.screen;
    const p2 = segment.p2.screen;
    const blocks = 12;
    const step1 = (p1.w * 2) / blocks;
    const step2 = (p2.w * 2) / blocks;

    for (let index = 0; index < blocks; index += 1) {
      ctx.fillStyle = index % 2 === 0 ? "#f8f8f8" : "#232323";
      drawQuad(
        p1.x - p1.w + step1 * index,
        p1.y,
        p1.x - p1.w + step1 * (index + 1),
        p1.y,
        p2.x - p2.w + step2 * (index + 1),
        p2.y,
        p2.x - p2.w + step2 * index,
        p2.y,
        ctx.fillStyle
      );
    }
  }

  function drawSun(color, x, y, radius) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawDuneLayer(color, baseY, amplitude, scale, drift) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, baseY);
    for (let x = 0; x <= canvas.width; x += 40) {
      const y = baseY - Math.sin(x / 180 + drift) * amplitude * scale - Math.cos(x / 95 + drift * 1.2) * amplitude * 0.28;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.closePath();
    ctx.fill();
  }

  function drawCanopyLayer(color, baseY, amplitude, scale, drift) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, baseY);
    for (let x = 0; x <= canvas.width; x += 26) {
      const y = baseY - Math.sin(x / 55 + drift) * amplitude * 0.16 - Math.abs(Math.cos(x / 78 + drift * 0.7)) * amplitude * scale;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.closePath();
    ctx.fill();
  }

  function drawMist(color, horizonY) {
    const mist = ctx.createLinearGradient(0, horizonY - 18, 0, horizonY + 90);
    mist.addColorStop(0, "rgba(255, 255, 255, 0)");
    mist.addColorStop(1, withAlpha(color, 0.22));
    ctx.fillStyle = mist;
    ctx.fillRect(0, horizonY - 18, canvas.width, 108);
  }

  function drawSkyline(color, baseY, scale, drift) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, baseY);
    const width = 58 * scale;
    for (let x = -width; x <= canvas.width + width; x += width) {
      const shiftedX = x - (drift * 70) % width;
      const height = 40 + (Math.sin(shiftedX / 120) * 18 + Math.cos(shiftedX / 46) * 16 + 28) * scale;
      ctx.lineTo(shiftedX, baseY - height);
      ctx.lineTo(shiftedX + width * 0.18, baseY - height);
      ctx.lineTo(shiftedX + width * 0.18, baseY);
      ctx.lineTo(shiftedX + width * 0.82, baseY);
      ctx.lineTo(shiftedX + width * 0.82, baseY - height * 0.84);
      ctx.lineTo(shiftedX + width, baseY - height * 0.84);
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.closePath();
    ctx.fill();
  }

  function drawCloudBand(color, y, timestamp) {
    ctx.fillStyle = withAlpha(color, 0.46);
    for (let index = 0; index < 6; index += 1) {
      const baseX = (index * canvas.width) / 5 + Math.sin(timestamp / 5000 + index) * 42;
      ctx.beginPath();
      ctx.ellipse(baseX, y + Math.sin(index * 1.4) * 18, 78, 24, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawMountainLayer(color, baseY, amplitude, scale, drift) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, baseY);
    for (let x = 0; x <= canvas.width + 60; x += 58) {
      const y = baseY - Math.abs(Math.sin(x / 90 + drift)) * amplitude * scale - Math.abs(Math.cos(x / 54 + drift * 1.1)) * amplitude * 0.65;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.closePath();
    ctx.fill();
  }

  function project(point, cameraX, cameraY, cameraZ) {
    point.camera.x = point.world.x - cameraX;
    point.camera.y = point.world.y - cameraY;
    point.camera.z = point.world.z - cameraZ;
    point.screen.scale = ROAD.cameraDepth / point.camera.z;
    point.screen.x = Math.round(canvas.width / 2 + point.screen.scale * point.camera.x * canvas.width / 2);
    point.screen.y = Math.round(canvas.height / 2 - point.screen.scale * point.camera.y * canvas.height / 2);
    point.screen.w = Math.round(point.screen.scale * ROAD.roadWidth * canvas.width / 2);
  }

  function drawQuad(x1, y1, x2, y2, x3, y3, x4, y4, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.lineTo(x4, y4);
    ctx.closePath();
    ctx.fill();
  }

  function applyFog(color, fogAmount) {
    const clamped = clamp(fogAmount, 0, 1);
    const rgb = hexToRgb(color);
    if (!rgb) {
      return color;
    }

    const fogBase = { r: 242, g: 231, b: 211 };
    const mix = 0.12 + clamped * 0.54;
    const r = Math.round(rgb.r + (fogBase.r - rgb.r) * mix);
    const g = Math.round(rgb.g + (fogBase.g - rgb.g) * mix);
    const b = Math.round(rgb.b + (fogBase.b - rgb.b) * mix);
    return `rgb(${r}, ${g}, ${b})`;
  }

  function findSegment(track, z) {
    const index = Math.floor(z / ROAD.segmentLength) % track.segments.length;
    return track.segments[index < 0 ? index + track.segments.length : index];
  }

  function percentRemaining(z, total) {
    return (z % total) / total;
  }

  function increase(start, increment, max) {
    let result = start + increment;
    while (result >= max) {
      result -= max;
    }
    while (result < 0) {
      result += max;
    }
    return result;
  }

  function interpolate(a, b, percent) {
    return a + (b - a) * percent;
  }

  function easeIn(a, b, percent) {
    return a + (b - a) * Math.pow(percent, 2);
  }

  function easeOut(a, b, percent) {
    return a + (b - a) * (1 - Math.pow(1 - percent, 2));
  }

  function easeInOut(a, b, percent) {
    return a + (b - a) * ((-Math.cos(percent * Math.PI) / 2) + 0.5);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function moveToward(value, target, amount) {
    if (value < target) {
      return Math.min(value + amount, target);
    }
    return Math.max(value - amount, target);
  }

  function drawCarSprite(image, x, y, rotation, width, height, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.globalAlpha = alpha;

    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.beginPath();
    ctx.ellipse(0, height * 0.18, width * 0.34, height * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.drawImage(image, -width / 2, -height / 2, width, height);
    ctx.restore();
  }

  function getLaneCenter(laneIndex) {
    return -1 + LANE_WORLD_WIDTH * (laneIndex + 0.5);
  }

  function roundedRectPath(context, x, y, width, height, radius) {
    const safeRadius = Math.min(radius, width / 2, height / 2);
    context.moveTo(x + safeRadius, y);
    context.lineTo(x + width - safeRadius, y);
    context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
    context.lineTo(x + width, y + height - safeRadius);
    context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
    context.lineTo(x + safeRadius, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
    context.lineTo(x, y + safeRadius);
    context.quadraticCurveTo(x, y, x + safeRadius, y);
    context.closePath();
  }

  function formatDistance(distanceMeters) {
    if (distanceMeters >= 1000) {
      return `${(distanceMeters / 1000).toFixed(2)} km`;
    }
    return `${Math.round(distanceMeters)} m`;
  }

  function clearKeys() {
    state.keys.left = false;
    state.keys.right = false;
    state.keys.up = false;
    state.keys.down = false;
  }

  function isEditableElement(target) {
    if (!(target instanceof HTMLElement)) {
      return false;
    }
    return target.tagName === "INPUT" || target.tagName === "TEXTAREA";
  }

  function createRandom(seedValue) {
    let seed = 1779033703 ^ seedValue.length;
    for (let index = 0; index < seedValue.length; index += 1) {
      seed = Math.imul(seed ^ seedValue.charCodeAt(index), 3432918353);
      seed = (seed << 13) | (seed >>> 19);
    }

    return function random() {
      seed = Math.imul(seed ^ (seed >>> 16), 2246822507);
      seed = Math.imul(seed ^ (seed >>> 13), 3266489909);
      seed ^= seed >>> 16;
      return (seed >>> 0) / 4294967296;
    };
  }

  function loadCarSprites() {
    const sprites = {};
    Object.entries(CAR_SPRITE_SOURCES).forEach(([key, src]) => {
      const image = new Image();
      image.decoding = "async";
      image.loading = "eager";
      image.src = src;
      sprites[key] = image;
    });
    return sprites;
  }

  function isSpriteReady(image) {
    return Boolean(image && image.complete && image.naturalWidth > 0);
  }

  function hexToRgb(color) {
    if (!color.startsWith("#")) {
      return null;
    }

    const normalized = color.length === 4
      ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
      : color;

    const value = Number.parseInt(normalized.slice(1), 16);
    return {
      r: (value >> 16) & 255,
      g: (value >> 8) & 255,
      b: value & 255,
    };
  }

  function shadeColor(color, amount) {
    const rgb = hexToRgb(color);
    if (!rgb) {
      return color;
    }

    return `rgb(${clamp(rgb.r + amount, 0, 255)}, ${clamp(rgb.g + amount, 0, 255)}, ${clamp(rgb.b + amount, 0, 255)})`;
  }

  function withAlpha(color, alpha) {
    const rgb = hexToRgb(color);
    if (!rgb) {
      return color;
    }

    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
  }

  function AudioEngine() {
    this.context = null;
    this.master = null;
    this.engineOscA = null;
    this.engineOscB = null;
    this.engineGainA = null;
    this.engineGainB = null;
    this.noiseBuffer = null;
    this.musicElement = null;
    this.musicActive = false;
  }

  AudioEngine.prototype.unlock = function unlock() {
    this.ensureMusicElement();

    if (this.context) {
      this.context.resume();
      return;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      return;
    }

    this.context = new AudioContextClass();
    this.master = this.context.createGain();
    this.master.gain.value = 0.22;
    this.master.connect(this.context.destination);

    this.engineOscA = this.context.createOscillator();
    this.engineOscB = this.context.createOscillator();
    this.engineGainA = this.context.createGain();
    this.engineGainB = this.context.createGain();

    this.engineOscA.type = "sawtooth";
    this.engineOscB.type = "triangle";
    this.engineGainA.gain.value = 0;
    this.engineGainB.gain.value = 0;

    this.engineOscA.connect(this.engineGainA);
    this.engineOscB.connect(this.engineGainB);
    this.engineGainA.connect(this.master);
    this.engineGainB.connect(this.master);

    this.engineOscA.start();
    this.engineOscB.start();
    this.createNoiseBuffer();
  };

  AudioEngine.prototype.ensureMusicElement = function ensureMusicElement() {
    if (this.musicElement || typeof Audio === "undefined") {
      return;
    }

    this.musicElement = new Audio(BGM_TRACK.src);
    this.musicElement.loop = true;
    this.musicElement.preload = "auto";
    this.musicElement.volume = BGM_TRACK.volume;
  };

  AudioEngine.prototype.createNoiseBuffer = function createNoiseBuffer() {
    if (!this.context) {
      return;
    }

    const buffer = this.context.createBuffer(1, this.context.sampleRate * 0.5, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < data.length; index += 1) {
      data[index] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  };

  AudioEngine.prototype.setEngine = function setEngine(speed, active) {
    if (!this.context) {
      return;
    }

    const now = this.context.currentTime;
    const ratio = clamp(Math.abs(speed) / PHYSICS.maxSpeed, 0, 1);
    const baseFrequency = active ? 68 + ratio * 130 : 52;
    const gainA = active ? 0.025 + ratio * 0.07 : 0.0001;
    const gainB = active ? 0.012 + ratio * 0.035 : 0.0001;

    this.engineOscA.frequency.setTargetAtTime(baseFrequency, now, 0.08);
    this.engineOscB.frequency.setTargetAtTime(baseFrequency * 0.5, now, 0.08);
    this.engineGainA.gain.setTargetAtTime(gainA, now, 0.08);
    this.engineGainB.gain.setTargetAtTime(gainB, now, 0.08);
  };

  AudioEngine.prototype.setMusic = function setMusic(active) {
    if (this.musicActive === active) {
      return;
    }

    this.musicActive = active;
    this.ensureMusicElement();

    if (!this.musicElement) {
      return;
    }

    if (active) {
      this.musicElement.volume = BGM_TRACK.volume;

      try {
        this.musicElement.currentTime = 0;
      } catch (error) {
        // Ignore seek errors while metadata is still loading.
      }

      const playPromise = this.musicElement.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
          this.musicActive = false;
        });
      }
      return;
    }

    this.musicElement.pause();

    try {
      this.musicElement.currentTime = 0;
    } catch (error) {
      // Ignore seek errors while the browser finalizes the pause.
    }
  };

  AudioEngine.prototype.beep = function beep(frequency, duration, type, volume, offset) {
    if (!this.context) {
      return;
    }

    const startTime = this.context.currentTime + (offset || 0);
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type || "sine";
    oscillator.frequency.setValueAtTime(frequency, startTime);
    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    oscillator.connect(gain);
    gain.connect(this.master);
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  };

  AudioEngine.prototype.noise = function noise(duration, cutoff, volume) {
    if (!this.context || !this.noiseBuffer) {
      return;
    }

    const startTime = this.context.currentTime;
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    source.buffer = this.noiseBuffer;
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(cutoff, startTime);
    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    source.start(startTime);
    source.stop(startTime + duration);
  };

  AudioEngine.prototype.playCountdown = function playCountdown(step) {
    this.beep(420 + step * 42, 0.08, "square", 0.06);
  };

  AudioEngine.prototype.playGo = function playGo() {
    this.beep(760, 0.14, "triangle", 0.09);
    this.beep(980, 0.14, "triangle", 0.07, 0.08);
  };

  AudioEngine.prototype.playSkid = function playSkid() {
    this.noise(0.28, 900, 0.06);
    this.beep(210, 0.16, "sawtooth", 0.03);
  };

  AudioEngine.prototype.playHit = function playHit() {
    this.noise(0.18, 320, 0.11);
    this.beep(130, 0.11, "square", 0.08);
  };

  AudioEngine.prototype.playFinish = function playFinish() {
    this.beep(660, 0.12, "triangle", 0.09);
    this.beep(880, 0.14, "triangle", 0.08, 0.12);
    this.beep(1040, 0.16, "triangle", 0.07, 0.26);
  };
})();
