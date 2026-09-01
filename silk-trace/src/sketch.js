let input;
let silk;
let sound;
let statusElement;

function setup() {
  const canvas = createCanvas(getCanvasSide(), getCanvasSide());
  canvas.parent("stage");
  pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
  frameRate(CONFIG.targetFps);

  statusElement = document.querySelector("#status");
  input = new PointerInput(statusElement);
  sound = new SoundEngine();
  silk = new SilkSystem();
  silk.setSoundEngine(sound);

  document.querySelector("#toggleSound").addEventListener("click", (event) => {
    const enabled = sound.toggle();
    event.currentTarget.textContent = enabled ? "Mute" : "Sound";
  });
  const cameraToggleButton = document.querySelector("#toggleCamera");
  const syncCameraButton = () => {
    cameraToggleButton.classList.toggle("active", input.mode === "camera");
  };
  cameraToggleButton.addEventListener("click", async () => {
    sound.ensure();
    await input.toggleCamera();
    syncCameraButton();
  });
  document.querySelector("#clearCanvas").addEventListener("click", () => silk.clear());

  // Camera-driven drawing is the intended default experience; fall back to mouse
  // input silently if permission is denied or MediaPipe fails to load.
  input.toggleCamera().then(syncCameraButton);

  const swatches = document.querySelectorAll(".swatch");
  swatches.forEach((swatch) => {
    swatch.addEventListener("click", () => {
      swatches.forEach((other) => {
        other.classList.remove("active");
        other.setAttribute("aria-pressed", "false");
      });
      swatch.classList.add("active");
      swatch.setAttribute("aria-pressed", "true");
      silk.setPalette(swatch.dataset.color);
    });
  });

  background(5, 6, 8);
}

function draw() {
  drawBackgroundMemory();
  const hand = input.update();
  silk.update(hand);
  silk.draw();
  drawHandTrace(hand);
}

function drawBackgroundMemory() {
  noStroke();
  fill(5, 6, 8, 26);
  rect(0, 0, width, height);
}

function drawHandTrace(hand) {
  if (!hand) return;

  for (const finger of hand.fingers) {
    noFill();
    stroke(255, hand.drawActive ? 132 : 58);
    strokeWeight(0.75);
    circle(finger.x, finger.y, 12 + sin(frameCount * 0.1) * 2);
    stroke(255, hand.drawActive ? 32 : 14);
    circle(finger.x, finger.y, 36);
  }
}

function mouseMoved() {
  if (isInsideCanvas(mouseX, mouseY)) {
    input?.setMouse(mouseX, mouseY);
  }
}

function mouseDragged() {
  if (isInsideCanvas(mouseX, mouseY)) {
    input?.setMouse(mouseX, mouseY);
  }
}

let canvasTouchActive = false;

function touchMoved() {
  if (canvasTouchActive && touches.length > 0) {
    input?.setMouse(touches[0].x, touches[0].y);
    return false;
  }
  return true;
}

function mouseOut() {
  input?.clearMouse();
}

function keyPressed() {
  let count = Number(key);
  if (key === "0") {
    count = 10;
  }
  if (count >= 1 && count <= 10) {
    input?.setMouseFingerCount(count);
  }
  if (key === " ") {
    sound?.ensure();
    const hand = input?.update();
    silk?.triggerBurst(hand);
  }
}

function mousePressed() {
  if (isInsideCanvas(mouseX, mouseY)) {
    sound?.ensure();
    input?.setMouseDown(true);
    input?.setMouse(mouseX, mouseY);
  }
}

function mouseReleased() {
  input?.setMouseDown(false);
}

function mouseClicked() {
  if (isInsideCanvas(mouseX, mouseY)) {
    sound?.ensure();
    input?.setMouse(mouseX, mouseY);
    const hand = input?.update();
    silk?.triggerBurst(hand);
  }
}

function touchStarted() {
  if (touches.length > 0 && isInsideCanvas(touches[0].x, touches[0].y)) {
    canvasTouchActive = true;
    sound?.ensure();
    input?.setMouseDown(true);
    input?.setMouse(touches[0].x, touches[0].y);
    return false;
  }
  canvasTouchActive = false;
  return true;
}

function touchEnded() {
  if (canvasTouchActive) {
    canvasTouchActive = false;
    input?.setMouseDown(false);
    return false;
  }
  return true;
}

function windowResized() {
  const side = getCanvasSide();
  resizeCanvas(side, side);
  background(5, 6, 8);
}

function getCanvasSide() {
  return Math.floor(min(windowWidth, windowHeight) * CONFIG.squareScale);
}

function isInsideCanvas(x, y) {
  return x >= 0 && x <= width && y >= 0 && y <= height;
}
