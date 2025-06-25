"use strict";

const States = { IDLE: "idle", SCAN: "scan", HUNT: "hunt", FLEE: "flee" };
const ARENA_WIDTH = 1150;
const ARENA_HEIGHT = 750;
const ATTACK_COOLDOWN = 1000;

const TypeEffectiveness = {
  normal: ["normal","fire","water","electric","grass","ice","fighting","poison","ground","flying","psychic","bug","rock","ghost","dragon","dark","steel","fairy"],
  fire: ["normal","fire","water","electric","grass","ice","fighting","poison","ground","flying","psychic","bug","rock","ghost","dragon","dark","steel","fairy"],
  water: ["normal","fire","water","electric","grass","ice","fighting","poison","ground","flying","psychic","bug","rock","ghost","dragon","dark","steel","fairy"],
  electric: ["normal","fire","water","electric","grass","ice","fighting","poison","ground","flying","psychic","bug","rock","ghost","dragon","dark","steel","fairy"],
  grass: ["normal","fire","water","electric","grass","ice","fighting","poison","ground","flying","psychic","bug","rock","ghost","dragon","dark","steel","fairy"],
  ice: ["normal","fire","water","electric","grass","ice","fighting","poison","ground","flying","psychic","bug","rock","ghost","dragon","dark","steel","fairy"],
  fighting: ["normal","fire","water","electric","grass","ice","fighting","poison","ground","flying","psychic","bug","rock","ghost","dragon","dark","steel","fairy"],
  poison: ["normal","fire","water","electric","grass","ice","fighting","poison","ground","flying","psychic","bug","rock","ghost","dragon","dark","steel","fairy"],
  ground: ["normal","fire","water","electric","grass","ice","fighting","poison","ground","flying","psychic","bug","rock","ghost","dragon","dark","steel","fairy"],
  flying: ["normal","fire","water","electric","grass","ice","fighting","poison","ground","flying","psychic","bug","rock","ghost","dragon","dark","steel","fairy"],
  psychic: ["normal","fire","water","electric","grass","ice","fighting","poison","ground","flying","psychic","bug","rock","ghost","dragon","dark","steel","fairy"],
  bug: ["normal","fire","water","electric","grass","ice","fighting","poison","ground","flying","psychic","bug","rock","ghost","dragon","dark","steel","fairy"],
  rock: ["normal","fire","water","electric","grass","ice","fighting","poison","ground","flying","psychic","bug","rock","ghost","dragon","dark","steel","fairy"],
  ghost: ["normal","fire","water","electric","grass","ice","fighting","poison","ground","flying","psychic","bug","rock","ghost","dragon","dark","steel","fairy"],
  dragon: ["normal","fire","water","electric","grass","ice","fighting","poison","ground","flying","psychic","bug","rock","ghost","dragon","dark","steel","fairy"],
  dark: ["normal","fire","water","electric","grass","ice","fighting","poison","ground","flying","psychic","bug","rock","ghost","dragon","dark","steel","fairy"],
  steel: ["normal","fire","water","electric","grass","ice","fighting","poison","ground","flying","psychic","bug","rock","ghost","dragon","dark","steel","fairy"],
  fairy: ["normal","fire","water","electric","grass","ice","fighting","poison","ground","flying","psychic","bug","rock","ghost","dragon","dark","steel","fairy"]
}; // TODO: Modifier TypeEffectiveness quand DamageMultiplier sera affecté

const excludedIDs = [
  "0511","0513","0515","0519","0521","0522","0537","0538","0557",
  "0563","0564","0579","0587","0590","0591","0593","0598","0599",
  "0600","0615","0616","0617","0625","0659","0664","0667","0682",
  "0711","0712","0730","0731","0732","0733","0734","0740","0747",
  "0749","0755","0764","0774","0818","0819","0831","0833","0835",
  "0836","0837","0838","0846","0862","0865","0869","0877","0888",
  "0892","0895","0912","0915","0916","0928","0929","0930","0941",
  "0942","0943","0944","0945","0946","0948","0949","0952","0953",
  "0954","0955","0961","0972","0976","0985","0989","0992","0993",
  "0998","1000","1001","1002","1007","1009","1011","1012","1013",
  "1019","1020","1021","1022"
]; //ça fait beaucoup

let pokemons = [];

function getRandomDuration(min, max) {
  return min + Math.random() * (max - min);
}

class Pokemon {
  constructor(x, y, pokemonData) {
    this.id = String(pokemonData.id - 1).padStart(4, '0');
    this.name = pokemonData.name;
    this.x = x;
    this.y = y;
    this.type = pokemonData.types[0];
    this.state = States.IDLE;
    this.direction = 0;
    this.speed = 0.7;
    this.alive = true;
    this.winner = false;
    this.lastAttackTime = 0;

    this.hpMax = pokemonData.stats.hp;
    this.hp = this.hpMax;
    this.atk = pokemonData.stats.attack;
    this.def = pokemonData.stats.defense;
    this.kills = 0;

    this.framecount = pokemonData.sprites.columns;
    this.frameHeight = pokemonData.sprites.frameHeight;
    this.frameWidth = pokemonData.sprites.frameWidth;
    this.animTimer = this.framecount * 0.175;

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
    this.elem.style.setProperty("--frame-count", this.framecount);
    this.elem.style.backgroundImage = `url('../sprites/animations/${this.id}/Walk-Anim.png')`;
    this.elem.style.setProperty(
      "--time",
      this.animTimer + "s"
    );
    this.elem.style.setProperty(
      "--frame-width",
      this.frameWidth + "px"
    );
    this.elem.style.setProperty(
      "--frame-height",
      this.frameHeight + "px"
    );
    const bar = document.createElement("div");
    bar.className = "hp-bar";
    const fill = document.createElement("div");
    fill.className = "hp-fill";
    bar.appendChild(fill);
    this.elem.appendChild(bar);

    this.portrait = document.createElement("div");
    this.portrait.className = "portrait";
    this.portrait.style.backgroundImage = `url('../sprites/portraits/${this.id}/Normal.png')`;
    this.portrait.dataset.id = this.id;

    document.getElementById("portraitsContainer").appendChild(this.portrait);
    document.getElementById("arena").appendChild(this.elem);
  }

  updateHpUI() {
    const pct = (this.hp / this.hpMax) * 100;
    this.elem.querySelector(".hp-fill").style.width = pct + "%";
  }

  die() {
    this.alive = false;
    this.elem.classList.add("dead");
    this.elem.style.backgroundImage = `url('../sprites/animations/${this.id}/Sleep-Anim.png')`;
    updateAliveCount();
    updateScoreboard();

    if (this.portrait) {
      this.portrait.classList.add("dead");
      this.portrait.classList.remove("hit");

      const dizzyUrl = `../sprites/portraits/${this.id}/Dizzy.png`;
      const fallbackUrl = `../sprites/portraits/${this.id}/Normal.png`;

      const img = new Image();
      img.onload = () => {
        this.portrait.style.backgroundImage = `url('${dizzyUrl}')`;
      };
      img.onerror = () => {
        this.portrait.style.backgroundImage = `url('${fallbackUrl}')`;
        console.warn(`Manque Image : ${dizzyUrl}`);
      };
      img.src = dizzyUrl;
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

    const damageToOther = this.atk / 5; /* TODO: ADD MULTIPLIER AND DEF */
    const damageToThis = other.atk / 5; /* TODO: ADD MULTIPLIER AND DEF */

    this.hp -= damageToThis;
    other.hp -= damageToOther;

    [this, other].forEach((p) => {
      if (p.hp <= 0 && p.alive) {
        p.die();
      } else {
        p.updateHpUI();
        if (p.portrait) {
          p.portrait.classList.add("hit");

          const painUrl = `../sprites/portraits/${p.id}/Pain.png`;
          const normalUrl = `../sprites/portraits/${p.id}/Normal.png`;

          const img = new Image();
          img.onload = () => {
            p.portrait.style.backgroundImage = `url('${painUrl}')`;
          };
          img.onerror = () => {
            p.portrait.style.backgroundImage = `url('${normalUrl}')`;
            console.warn(`Manque Image : ${painUrl}`);
          };
          img.src = painUrl;

          setTimeout(() => {
            if (p.alive) {
              p.portrait.classList.remove("hit");
              p.portrait.style.backgroundImage = `url('${normalUrl}')`;
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
    this.elem.style.backgroundPositionY = `-${dir8 * this.frameHeight}px`;
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

function getValidRandomPokemon(max, exclusions){
  const validIDs = [];

  for (let i = 0; i <= max; i++) {
    const id = String(i).padStart(4, '0');
    if (!exclusions.includes(id)) {
      validIDs.push(id);
    }
  }

  const randomID = Math.floor(Math.random() * validIDs.length);
  return validIDs[randomID];
}

//precision pokemons spawn number (ici 20, 2 pour test des choses en fin de game).
async function createPokemons(count = 20) {
  pokemons = [];

  document.getElementById("arena").innerHTML = "";
  document.getElementById("winnerMessage").innerHTML = "";

  for (let i = 0; i < count; i++) {
    const id = getValidRandomPokemon(1024, excludedIDs); //pour choisir parmis les 1024 pokémons
    const paddedId = String(id).padStart(4, '0');
    const pokemonUrl = `../data/pokemon-${paddedId}.json`;

    try {
      const res = await fetch(pokemonUrl);
      const pokemonData = await res.json();

      new Pokemon(
        Math.random() * ARENA_WIDTH,
        Math.random() * ARENA_HEIGHT,
        pokemonData
      );
    } catch (err) {
      console.error(`${pokemonUrl}`, err);
    }
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
    drawSound.volume = 0.5;
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
  async () => {
    const battleAudio = document.getElementById("battleMusic");
    if (battleAudio && battleAudio.paused) {
      battleAudio.currentTime = 0;
      battleAudio.volume = 0.1;
      battleAudio.play().catch((err) => console.warn("Autoplay blocked:", err));
    }
    await createPokemons()
    gameLoop();
  },
  { once: true }
);
