let isGameOver = false;
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

const playerImage = new Image();
playerImage.src = "/assets/pjprincipal.png";
playerImage.onload = () => {
  gameLoop();
};

const enemyImage = new Image();
enemyImage.src = "/assets/bandido.png";

const meleeEnemyImage = new Image();
meleeEnemyImage.src = "/assets/esqueleto.png";

// Variables del pj (llamado objeto)
const player = {
  x: canvas.width / 5,
  y: canvas.height / 5,
  width: 50,
  height: 50,
  speed: 4,
  hp: 100,
  maxHp: 100,
  bullets: 12,
  maxBullets: 12,
  score: 0,
  isReloading: false,
  reloadTime: 2000,
  dodgeCooldown: 1000,
  dodgeDuration: 200,
  isDodging: false,
  dodgeSpeed: 10,
  angle: 0,
};

let dodgeTime = 0;
let lastShot = 0;
let bullets = [];
let enemies = [];
let enemyProjectiles = [];
let lastEnemySpawn = Date.now();
let autoShoot = false;
let reloadProgress = 0;

const keys = {};
document.addEventListener("keydown", (e) => {
  keys[e.key] = true;
  
  if (e.key === "r" && !player.isReloading && player.bullets < player.maxBullets) startReload();
  if (e.key === " " && !player.isDodging && Date.now() - dodgeTime > player.dodgeCooldown) {
    player.isDodging = true;
    dodgeTime = Date.now();
  }
  if (player.hp <= 0 && e.key === " ") restartGame();
});
document.addEventListener("keyup", (e) => keys[e.key] = false);
document.addEventListener("mousedown", () => autoShoot = true);
document.addEventListener("mouseup", () => autoShoot = false);
document.addEventListener("mousemove", (e) => {
  player.angle = Math.atan2(e.clientY - player.y, e.clientX - player.x);
});

function shoot() {
  if (!player.isReloading && player.bullets > 0 && Date.now() - lastShot > 100) {
    bullets.push({
      x: player.x,
      y: player.y,
      angle: player.angle,
      speed: 10
    });
    player.bullets--;
    lastShot = Date.now();
  } else if (player.bullets === 0 && !player.isReloading) {
    startReload();
  }
}

function manageShooting() {
  if (isGameOver) return;
  // Permitir disparar solo si no se está recargando
  if (autoShoot && !player.isReloading) {
    shoot();
  }
}

function startReload() {
  player.isReloading = true;
  reloadProgress = 0;
  const reloadInterval = setInterval(() => {
    reloadProgress += 100 / (player.reloadTime / 100);
    if (reloadProgress >= 100) {
      player.bullets = player.maxBullets;
      player.isReloading = false;
      clearInterval(reloadInterval);
    }
  }, 100);
}

function movePlayer() {
  if (isGameOver) return;

  const moveSpeed = player.isDodging ? player.dodgeSpeed : player.speed;
  if (keys["ArrowUp"] || keys["w"]) player.y -= moveSpeed;
  if (keys["ArrowDown"] || keys["s"]) player.y += moveSpeed;
  if (keys["ArrowLeft"] || keys["a"]) player.x -= moveSpeed;
  if (keys["ArrowRight"] || keys["d"]) player.x += moveSpeed;

  if (player.isDodging && Date.now() - dodgeTime > player.dodgeDuration) player.isDodging = false;
  player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
  player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
}

function spawnEnemies() {
  if (Date.now() - lastEnemySpawn > 2000) {
    const enemyType = Math.random() < 0.5 ? 'ranged' : 'melee';
    
    enemies.push({
      x: Math.random() * canvas.width, 
      y: Math.random() * canvas.height,
      hp: enemyType === 'ranged' ? 3 : 5,
      speed: enemyType === 'ranged' ? 3 : 5,
      angle: 0,
      isShooting: enemyType === 'ranged',
      type: enemyType,
      shootCooldown: 1000,
      lastShot: Date.now()
    });
    
    lastEnemySpawn = Date.now();
  }
}

function updateEnemies() {
  enemies.forEach((enemy, i) => {
    let dx = player.x - enemy.x;
    let dy = player.y - enemy.y;
    let dist = Math.sqrt(dx * dx + dy * dy);
    
    // Ajuste para que el enemigo apunte hacia el jugador
    enemy.angle = Math.atan2(dy, dx);

    if (dist > 20) {
      enemy.x += (dx / dist) * enemy.speed;
      enemy.y += (dy / dist) * enemy.speed;
    }
    
    // Disparo para enemigos a distancia
    if (enemy.type === 'ranged' && Date.now() - enemy.lastShot > enemy.shootCooldown) {
      shootEnemyProjectile(enemy);
      enemy.lastShot = Date.now();
    }

    if (enemy.type === 'ranged' && dist < 20) {
      player.hp -= 10;
      player.x += dx / dist * 20;
      player.y += dy / dist * 20;
      if (player.hp <= 0) gameOver();
    }
    
    if (enemy.type === 'melee' && dist < 20) {
      player.hp -= 20;
      player.x += dx / dist * 20;
      player.y += dy / dist * 20;
      if (player.hp <= 0) gameOver();
    }

    if (enemy.hp <= 0) {
      enemies.splice(i, 1);
      player.score++;
    }
  });
}

function shootEnemyProjectile(enemy) {
  enemyProjectiles.push({
    x: enemy.x,
    y: enemy.y,
    angle: Math.atan2(player.y - enemy.y, player.x - enemy.x),
    speed: 6
  });
}

function updateEnemyProjectiles() {
  enemyProjectiles = enemyProjectiles.filter(projectile => projectile.x > 0 && projectile.x < canvas.width && projectile.y > 0 && projectile.y < canvas.height);
  enemyProjectiles.forEach((projectile, pIndex) => {
    projectile.x += Math.cos(projectile.angle) * projectile.speed;
    projectile.y += Math.sin(projectile.angle) * projectile.speed;

    const dx = projectile.x - player.x;
    const dy = projectile.y - player.y;
    if (Math.sqrt(dx * dx + dy * dy) < 20) {
      player.hp -= 10;
      enemyProjectiles.splice(pIndex, 1);
      if (player.hp <= 0) gameOver();
    }
  });
}

function manageShooting() {
  if (isGameOver) return;
  if (autoShoot) shoot();
}


function updateBullets() {
  bullets = bullets.filter(bullet => bullet.x > 0 && bullet.x < canvas.width && bullet.y > 0 && bullet.y < canvas.height);

  bullets.forEach((bullet, bIndex) => {
    bullet.x += Math.cos(bullet.angle) * bullet.speed;
    bullet.y += Math.sin(bullet.angle) * bullet.speed;
    
    enemies.forEach((enemy, eIndex) => {
      const enemyWidth = 50;
      const enemyHeight = 50;
      
      if (
        bullet.x > enemy.x - enemyWidth / 2 &&
        bullet.x < enemy.x + enemyWidth / 2 &&
        bullet.y > enemy.y - enemyHeight / 2 &&
        bullet.y < enemy.y + enemyHeight / 2
      ) {
        enemy.hp--;
        bullets.splice(bIndex, 1);
        return;
      }
    });
  });
}


function drawHealthBar() {
  const barWidth = 200;
  const barHeight = 20;
  const healthRatio = player.hp / player.maxHp;
  ctx.fillStyle = "red";
  ctx.fillRect(10, 10, barWidth * healthRatio, barHeight);
  ctx.strokeStyle = "white";
  ctx.strokeRect(10, 10, barWidth, barHeight);
}

function drawHUD() {
  drawHealthBar();
  ctx.font = "24px Arial";
  ctx.fillStyle = "white";
  ctx.textAlign = "left"; 
  ctx.fillText(`Puntaje: ${player.score}`, 10, 50);
  ctx.fillText(`Balas: ${player.bullets}/${player.maxBullets}`, 10, 80);
  if (player.isReloading) drawReloadBar();
}

function drawReloadBar() {
  const barWidth = 50;
  const barHeight = 10;
  ctx.fillStyle = "gray";
  ctx.fillRect(player.x - barWidth / 2, player.y - player.height - 20, barWidth, barHeight);
  ctx.fillStyle = "white";
  ctx.fillRect(player.x - barWidth / 2, player.y - player.height - 20, (reloadProgress / 100) * barWidth, barHeight);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  //dibujar rotacion del jugador  
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle);
  ctx.drawImage(playerImage, -player.width / 2, -player.height / 2, player.width, player.height);
  ctx.restore();

  bullets.forEach(bullet => {
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = "yellow";
    ctx.fill();
  });

  enemies.forEach(enemy => {
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.rotate(enemy.angle);
  
    if (enemy.type === 'melee') {
      ctx.drawImage(meleeEnemyImage, -15, -15, 50, 50);
    } else {
      ctx.drawImage(enemyImage, -15, -15, 50, 50);
    }
  
    ctx.restore();
  });
  

  enemyProjectiles.forEach(projectile => {
    ctx.fillStyle = "orange";
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, 5, 0, Math.PI * 2);
    ctx.fill();
  });

  drawHUD();
  if (player.hp <= 0) {
    ctx.fillStyle = "red";
    ctx.fillText("Game Over. Presiona espacio para reiniciar", canvas.width / 2 - 50, canvas.height / 2);
  }
}

function gameOver() {
  isGameOver = true;
}

function restartGame() {
  player.hp = player.maxHp;
  player.bullets = player.maxBullets;
  player.score = 0;
  enemies = [];
  bullets = [];
  enemyProjectiles = [];
  player.x = canvas.width / 2;
  player.y = canvas.height / 2;
  player.isReloading = false;
  isGameOver = false;
  
  // Reiniciar el temporizador
  timerStart = Date.now();
}

let isPaused = false;

// diseños pausa
const pauseMenu = document.createElement("div");
pauseMenu.style.position = "fixed";
pauseMenu.style.top = "50%";
pauseMenu.style.left = "50%";
pauseMenu.style.transform = "translate(-50%, -50%)";
pauseMenu.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
pauseMenu.style.color = "white";
pauseMenu.style.padding = "20px";
pauseMenu.style.textAlign = "center";
pauseMenu.style.borderRadius = "10px";
pauseMenu.style.fontFamily = "'Spartan', sans-serif";
pauseMenu.style.display = "none"; // 
document.body.appendChild(pauseMenu);

// Agregar contenido al menú de pausa
pauseMenu.innerHTML = `
    <h2>Pausa</h2>
    <button id="resumeButton" style="width: 100%; padding: 10px;margin-bottom:5px; font-size: 16px; border-radius: 5px; background-color: rgba(42, 95, 53, 0.781);; color: white; border: none; cursor: pointer; margin-right: 30px ">Reanudar</button>
    <button id="mainMenuButton" style="width: 100%; padding: 10px; font-size: 16px; border-radius: 5px; background-color: rgba(42, 95, 53, 0.781);; color: white; border: none; cursor: pointer;"><a href="index.html" style="text-decoration:none;color:white;">Ir al Menú Principal</a></button>
`;

// Seleccionar botones dentro del menú de pausa
const resumeButton = document.getElementById("resumeButton");
const mainMenuButton = document.getElementById("mainMenuButton");

// Función para pausar y reanudar el juego
function togglePause() {
    isPaused = !isPaused;
    pauseMenu.style.display = isPaused ? "block" : "none";
}

// Eventos de los botones del menú de pausa
resumeButton.addEventListener("click", togglePause);
mainMenuButton.addEventListener("click", () => {
    //alert("Ir al menú principal (esto es solo una demostración)."); // Aquí puedes añadir funcionalidad real
});

// Detectar tecla Escape para activar/desactivar el menú de pausa
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && player.hp > 0) {
        togglePause();
    }
});

const timerDuration = 5 * 60 * 1000; // 5 minutos en milisegundos
let timerStart = Date.now();

function updateTimer() {
  if (isGameOver) return; // Detener el temporizador si el juego ha terminado

  const timeElapsed = Date.now() - timerStart;
  const timeRemaining = Math.max(0, timerDuration - timeElapsed);

  // Convertir el tiempo restante a minutos y segundos
  const minutes = Math.floor(timeRemaining / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000);

  ctx.font = "24px Arial";
  ctx.fillStyle = "white";
  ctx.textAlign = "right";
  ctx.fillText(`Tiempo: ${minutes}:${seconds < 10 ? "0" : ""}${seconds}`, canvas.width - 10, 30);

  if (timeRemaining <= 0) {    
    gameOver === true
    window.location.href = "final.html";
  }
}

function gameLoop() {
  if (!isPaused && !isGameOver) {
    movePlayer();
    manageShooting();
    updateBullets();
    spawnEnemies();
    updateEnemies();
    updateEnemyProjectiles();
    draw();
  }
  updateTimer();
  requestAnimationFrame(gameLoop);
}