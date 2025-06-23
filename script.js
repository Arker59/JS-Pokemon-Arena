"use strict";

const States = { IDLE: "idle", SCAN: "scan", HUNT: "hunt", FLEE: "flee" };
const TYPES = ["fire", "water", "grass"];
const TypeEffectiveness = {
  fire: ["grass", "fire", "water"],
  water: ["fire", "water", "grass"],
  grass: ["water", "grass", "fire"],
};
const TypeDamageMultiplier = {
  fire: { grass: 2.0, fire: 1.0, water: 0.5 },
  water: { fire: 2.0, water: 1.0, grass: 0.5 },
  grass: { water: 2.0, grass: 1.0, fire: 0.5 },
};

function getDamageMultiplier(attackerType, defenderType) {
  return TypeDamageMultiplier[attackerType]?.[defenderType] || 1.0;
}

const ARENA_WIDTH = 1150;
const ARENA_HEIGHT = 750;
const ATTACK_COOLDOWN = 1000;
let nextId = 1;
let pokemons = [];

function getRandomDuration(min, max) {
  return min + Math.random() * (max - min);
}

class Pokemon {
  constructor(x, y, type) {
    this.id = nextId++;

    switch (type) {
      case "grass":
        this.name = "Florizard";
        break;
      case "fire":
        this.name = "Dracaufeu";
        break;
      case "water":
        this.name = "Tortank";
        break;
      default:
        this.name = "Pokémon";
        break;
    }

    this.x = x;
    this.y = y;
    this.type = type;
    this.state = States.IDLE;
    this.direction = 0;
    this.speed = 0.7;
    this.alive = true;
    this.winner = false;
    this.lastAttackTime = 0;

    this.hpMax = 100;
    this.hp = this.hpMax;
    this.kills = 0;

    this.setTimers();
    this.setupSprite();

    pokemons.push(this);
    updateAliveCount();
    updateScoreboard();
  }

  setTimers() {
    this.tIdle = getRandomDuration(2000, 4000);
    this.tScan = getRandomDuration(3000, 5000);
    this.tHunt = this.tFlee = 0;
    this.tCnt = 0;
  }

  setupSprite() {
    this.elem = document.createElement("div");
    this.elem.className = `pokemon ${this.type} ${this.state}`;
    this.elem.style.setProperty("--frame-count", this.frameCountByType());
    this.elem.style.setProperty(
      "--time", 
      this.frameTimerByType() + "s"
    );
    this.elem.style.setProperty(
      "--frame-width",
      this.frameWidthByType() + "px"
    );
    this.elem.style.setProperty(
      "--frame-height",
      this.frameHeightByType() + "px"
    );
    const bar = document.createElement("div");
    bar.className = "hp-bar";
    const fill = document.createElement("div");
    fill.className = "hp-fill";
    bar.appendChild(fill);
    this.elem.appendChild(bar);

    this.portrait = document.createElement("div");
    this.portrait.className = "portrait";
    this.portrait.style.backgroundImage = `url('./sprites/${this.type}/Normal.png')`;
    this.portrait.dataset.id = this.id;

    document.getElementById("portraitsContainer").appendChild(this.portrait);
    document.getElementById("arena").appendChild(this.elem);
  }

  frameCountByType() {
    switch (this.type) {
      default:
        return 4;
    }
  }

  frameTimerByType() {
    switch (this.type) {
      default:
        return 0.7;
    }
  }

  frameWidthByType() {
    switch (this.type) {
      case "grass":
        return 32;
      case "water":
        return 32;
      default:
        return 40;
    }
  }

  frameHeightByType() {
    switch (this.type) {
      case "grass":
        return 32;
      case "water":
        return 40;
      default:
        return 48;
    }
  }

  updateHpUI() {
    const pct = (this.hp / this.hpMax) * 100;
    this.elem.querySelector(".hp-fill").style.width = pct + "%";
  }

  die() {
    this.alive = false;
    this.elem.classList.add("dead");
    this.elem.style.backgroundImage = `url('./sprites/${this.type}/Sleep-Anim.png')`;
    updateAliveCount();
    updateScoreboard();

    if (this.portrait) {
      this.portrait.classList.add("dead");
      this.portrait.classList.remove("hit");
      this.portrait.style.backgroundImage = `url('./sprites/${this.type}/Dizzy.png')`;
    }
  }

  awardKill() {
    this.kills++;
    updateScoreboard();
  }

  resolveDual(other) {
    const now = performance.now();

    if (!this.alive || !other.alive || now - this.lastAttackTime < ATTACK_COOLDOWN || now - other.lastAttackTime < ATTACK_COOLDOWN) return;

    this.lastAttackTime = now;
    other.lastAttackTime = now;

    const damageToOther = 10 * getDamageMultiplier(this.type, other.type);
    const damageToThis = 10 * getDamageMultiplier(other.type, this.type);

    this.hp -= damageToThis;
    other.hp -= damageToOther;

    [this, other].forEach((p) => {
      if (p.hp <= 0 && p.alive) {
        p.die();
      } else {
        p.updateHpUI();
        if (p.portrait) {
          p.portrait.classList.add("hit");
          p.portrait.style.backgroundImage = `url('./sprites/${p.type}/Pain.png')`;
          setTimeout(() => {
            if (p.alive) {
              p.portrait.classList.remove("hit");
              p.portrait.style.backgroundImage = `url('./sprites/${p.type}/Normal.png')`;
            }
          }, 500);
        }
      }
    });

    if (!other.alive && this.alive) this.awardKill();
    if (!this.alive && other.alive) other.awardKill();

    checkEndOfGame();
  }

  update(dt) {
    if (!this.alive) return;
    this.tCnt += dt;

    let action = null;
    switch (this.state) {
      case States.IDLE:
        if (this.tCnt > this.tIdle) action = States.SCAN;
        break;
      case States.SCAN:
        if (this.tCnt > this.tScan) action = States.IDLE;
        break;
      case States.HUNT:
        if (this.tCnt <= 0) action = States.IDLE;
        break;
      case States.FLEE:
        if (this.tCnt <= 0) action = States.IDLE;
        break;
    }
    if (action) this.transition(action);

    if (this.state === States.SCAN) {
      this.move(this.speed / 4);
      const prey = pokemons.find(
        (p) =>
          p !== this &&
          p.alive &&
          TypeEffectiveness[this.type]?.includes(p.type)
      );
      const threat = pokemons.find(
        (p) =>
          p !== this &&
          p.alive &&
          TypeEffectiveness[p.type]?.includes(this.type)
      );
      if (prey) return this.startHunt(prey);
      if (threat) return this.startFlee(threat);
    }
    if (this.state === States.HUNT && this.target)
      this.chaseOrLose(this.speed, dt);
    if (this.state === States.FLEE && this.target)
      this.chaseOrLose(-this.speed * 1.2, dt);

    this.checkCollisions();
    this.render();
  }

  transition(newState) {
    this.state = newState;
    this.tCnt = newState === States.IDLE ? 0 : this.tCnt;
    if (newState === States.IDLE) this.tIdle = getRandomDuration(2000, 4000);
    if (newState === States.SCAN) this.tScan = getRandomDuration(3000, 5000);
    this.elem.className = `pokemon ${this.type} ${this.state}`;
  }

  startHunt(t) {
    this.target = t;
    this.state = States.HUNT;
    this.tCnt = this.tHunt = getRandomDuration(4000, 6000);
  }

  startFlee(t) {
    this.target = t;
    this.state = States.FLEE;
    this.tCnt = this.tFlee = getRandomDuration(4000, 5000);
  }

  chaseOrLose(speedMul, dt) {
    if (!this.target.alive) return this.transition(States.IDLE);
    this.tCnt -= dt;
    const dx = this.target.x - this.x,
      dy = this.target.y - this.y;
    this.direction = Math.atan2(dy, dx) + (speedMul < 0 ? Math.PI : 0);
    this.move(Math.abs(speedMul));
  }

  move(dist) {
    this.x += Math.cos(this.direction) * dist;
    this.y += Math.sin(this.direction) * dist;
    this.x = Math.max(0, Math.min(ARENA_WIDTH, this.x));
    this.y = Math.max(0, Math.min(ARENA_HEIGHT, this.y));
  }

  checkCollisions() {
    pokemons.forEach((o) => {
      if (o === this || !o.alive) return;
      if (Math.hypot(this.x - o.x, this.y - o.y) < 40) this.resolveDual(o);
    });
  }

  render() {
    const dir8map = [2, 1, 0, 7, 6, 5, 4, 3];
    const rawDir = Math.floor(
      ((this.direction + 2 * Math.PI) % (2 * Math.PI)) / (Math.PI / 4)
    );
    const dir8 = dir8map[rawDir];
    this.elem.style.backgroundPositionY = `-${
      dir8 * this.frameHeightByType()
    }px`;
    this.elem.style.left = `${this.x}px`;
    this.elem.style.top = `${this.y}px`;
  }
}

function checkEndOfGame() {
  const alivePokemons = pokemons.filter((p) => p.alive);
  if (alivePokemons.length === 1) {
    const winner = alivePokemons[0];
    winner.winner = true;
    showWinner(winner);
    updateScoreboard();
  } else if (alivePokemons.length === 0) {
    showDraw();
  }
}

//precision pokemons spawn number (ici 20, 2 pour test des choses en fin de game).
function createPokemons(count = 20) {
  pokemons = [];
  nextId = 1;
  document.getElementById("arena").innerHTML = "";
  document.getElementById("winnerMessage").innerHTML = "";
  for (let i = 0; i < count; i++) {
    const type = TYPES[Math.floor(Math.random() * TYPES.length)];
    new Pokemon(
      Math.random() * ARENA_WIDTH,
      Math.random() * ARENA_HEIGHT,
      type
    );
  }
}

function updateAliveCount() {
  document.getElementById("aliveCount").textContent = pokemons.filter(
    (p) => p.alive
  ).length;
}

function updateScoreboard() {
  const body = document.getElementById("scoresBody");
  body.innerHTML = "";
  pokemons.forEach((p) => {
    const tr = document.createElement("tr");
    if (!p.alive) tr.classList.add("dead-row");
    if (p.winner) tr.classList.add("winner-row");
    tr.innerHTML = `<td>${p.id}</td><td>${p.name}</td><td>${p.type}</td><td>${p.kills}</td>`;
    body.appendChild(tr);
  });
}

function showWinner(pokemon) {
  const msg = document.createElement("div");

  msg.id = "winnerMessage";
  msg.textContent = `🏆 Winner: ${pokemon.name}(${pokemon.id}) of type : ${pokemon.type} !`;
  document.body.appendChild(msg);

  if (pokemon.portrait) {
    pokemon.portrait.classList.add("win");
  }

  const winSound = document.getElementById("winMusic");
  if (winSound) {
    winSound.currentTime = 0;
    winSound.volume = 0.1;
    winSound.play().catch(console.warn);
  }

  const battleAudio = document.getElementById("battleMusic");
  if (battleAudio) {
    battleAudio.pause();
  }
}

function showDraw() {
  const msg = document.createElement("div");

  msg.id = "drawMessage";
  msg.innerHTML = `Draw: No Pokemon Remaines.`;
  document.body.appendChild(msg);

  const darkBackGround = document.getElementById("darkOverlay");
  darkBackGround.classList.add("active");

  const drawSound = document.getElementById("drawMusic");
  if (drawSound) {
    drawSound.currentTime = 0;
    drawSound.volume = 0.1;
    drawSound.play().catch(console.warn);
  }

  const battleAudio = document.getElementById("battleMusic");
  if (battleAudio) {
    battleAudio.pause();
  }
}

function gameLoop(now = performance.now()) {
  pokemons.forEach((p) => p.update(now - (gameLoop.last || now)));
  gameLoop.last = now;
  updateAliveCount();
  requestAnimationFrame(gameLoop);
}

window.addEventListener(
  "click",
  () => {
    const battleAudio = document.getElementById("battleMusic");
    if (battleAudio && battleAudio.paused) {
      battleAudio.currentTime = 0;
      battleAudio.volume = 0.1;
      battleAudio.play().catch((err) => console.warn("Autoplay blocked:", err));
    }
    createPokemons();
    gameLoop();
  },
  { once: true }
);
