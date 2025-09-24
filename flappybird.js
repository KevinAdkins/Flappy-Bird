//game (canvas)
let game;
let gameWidth = 360;
let gameHeight = 640;
let context;

//bird
let birdWidth = 34;
let birdHeight = 24;
let birdX = gameWidth / 8;
let birdY = gameHeight / 2;
let birdImag;

let bird = {
  x: birdX,
  y: birdY,
  width: birdWidth,
  height: birdHeight,
};

//pipes
let pipeArray = [];
let pipeWidth = 64;
let pipeHeight = 512;
let pipeX = gameWidth;
let pipeY = 0;

let topPipeImg;
let bottomPipeImg;

//physics
let velocityX = -2;   // pipes moving left speed
let velocityY = 0;    // bird vertical speed
let gravity  = 0.32;  // gravity affecting bird
let maxFall  = 6.5;   // max falling speed

// game state / scoring
let gameOver = false;
let score = 0;
let best  = Number(localStorage.getItem("best")) || 0; // persist best score

function updateScoreUI() {
  document.getElementById("score").textContent = `Score: ${score}`;
  document.getElementById("best").textContent  = `Best: ${best}`;
}

//  sharp DPI rendering
function setupDevicePixelRatio() {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  // set backing store to DPR-scaled size
  game.width  = gameWidth * dpr;
  game.height = gameHeight * dpr;
  // keep CSS size in logical pixels
  game.style.width  = gameWidth + "px";
  game.style.height = gameHeight + "px";
  // scale drawing so coordinates remain logical
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.onload = function () {
  game = document.getElementById("game");
  context = game.getContext("2d");

  setupDevicePixelRatio(); // comment out if you don't want DPR scaling

  // load images
  birdImag = new Image();
  birdImag.src = "./flappybird.png";
  birdImag.onload = function () {
    context.drawImage(birdImag, bird.x, bird.y, bird.width, bird.height);
  };

  topPipeImg = new Image();
  topPipeImg.src = "./toppipe.png";

  bottomPipeImg = new Image();
  bottomPipeImg.src = "./bottompipe.png";

  requestAnimationFrame(update);
  setInterval(placePipes, 1500); // place pipes every 1.5 seconds

  // keyboard controls
  document.addEventListener("keydown", moveBird);
  // prevent page from scrolling when using Space/ArrowUp
  document.addEventListener(
    "keydown",
    (e) => {
      if (["Space", "ArrowUp"].includes(e.code)) e.preventDefault();
    },
    { passive: false }
  );

  // mobile/desktop tap support (pointer covers mouse + touch)
  game.addEventListener("pointerdown", onPointerDown, { passive: false });

  // restart button + R key
  document.getElementById("restart").addEventListener("click", resetGame);
  document.addEventListener("keydown", (e) => {
    if (e.code === "KeyR") resetGame();
  });

  updateScoreUI();
};

function update() {
  requestAnimationFrame(update);

  context.clearRect(0, 0, game.width, game.height); // clear the canvas

  if (!gameOver) {
    // physics
    velocityY += gravity;
    velocityY = Math.min(velocityY, maxFall); // cap fall speed
    bird.y = Math.max(bird.y + velocityY, 0); // don't go above the canvas

    // ground collision
    if (bird.y + bird.height >= gameHeight) {
      bird.y = gameHeight - bird.height;
      endGame();
    }

    // pipes
    for (let i = 0; i < pipeArray.length; i++) {
      const pipe = pipeArray[i];
      pipe.x += velocityX; // move pipes left
      context.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height);

      // score once per pipe pair: when the TOP pipe fully passes the bird
      if (!pipe.passed && pipe.img === topPipeImg && pipe.x + pipe.width < bird.x) {
        pipe.passed = true;
        score++;
        updateScoreUI();
      }

      // collision
      if (detectCollision(bird, pipe)) {
        endGame();
      }
    }

    // remove off-screen pipes
    while (pipeArray.length && pipeArray[0].x + pipeArray[0].width < 0) {
      pipeArray.shift();
    }
  }

  // draw bird (kept outside so it shows on GAME OVER frame too)
  context.drawImage(birdImag, bird.x, bird.y, bird.width, bird.height);

  // GAME OVER overlay
  if (gameOver) {
    context.fillStyle = "white";
    context.font = "45px sans-serif";
    context.fillText("GAME OVER", 50, gameHeight / 2 - 20);
  }
}

function endGame() {
  if (gameOver) return;
  gameOver = true;

  if (score > best) {
    best = score;
    localStorage.setItem("best", String(best));
  }
  updateScoreUI();
}

function resetGame() {
  // reset state
  score = 0;
  gameOver = false;

  // reset bird
  bird.x = gameWidth / 8;
  bird.y = gameHeight / 2;
  velocityY = 0;

  // reset pipes
  pipeArray = [];

  updateScoreUI();
}

function placePipes() {
  if (gameOver) return;

  const randomPipeY = pipeY - pipeHeight / 4 - Math.random() * (pipeHeight / 2); // top pipe y
  const openingSpace = gameHeight / 4; // gap size

  const topPipe = {
    img: topPipeImg,
    x: pipeX,
    y: randomPipeY,
    width: pipeWidth,
    height: pipeHeight,
    passed: false,
  };
  const bottomPipe = {
    img: bottomPipeImg,
    x: pipeX,
    y: randomPipeY + pipeHeight + openingSpace,
    width: pipeWidth,
    height: pipeHeight,
    passed: false,
  };

  pipeArray.push(topPipe, bottomPipe);
}

function moveBird(e) {
  if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyX") {
    if (gameOver) {
      // allow flap to restart immediately
      resetGame();
    }
    velocityY = -8; // jump strength
  }
}

// Tap/click to flap; if game over, tap restarts
function onPointerDown(e) {
  e.preventDefault();           // prevent scroll/zoom on touch
  if (gameOver) resetGame();
  velocityY = -8;
}

function detectCollision(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

