class PointerInput {
  constructor(statusElement) {
    this.statusElement = statusElement;
    this.mode = "mouse";
    this.video = null;
    this.camera = null;
    this.hands = null;
    this.lastHand = null;
    this.mediaPipeHand = null;
    this.mousePoint = null;
    this.mouseFingerCount = 1;
    this.mouseDown = false;
  }

  setMouse(x, y) {
    this.mousePoint = { x, y };
  }

  clearMouse() {
    this.mousePoint = null;
  }

  setMouseDown(active) {
    this.mouseDown = active;
  }

  setMouseFingerCount(count) {
    this.mouseFingerCount = constrain(count, 1, 10);
    this.statusElement.textContent = `Mouse simulating ${this.mouseFingerCount} finger(s). Camera mode can detect up to 10 fingers across both hands.`;
  }

  async toggleCamera() {
    if (this.camera) {
      this.stopCamera();
      return;
    }

    if (!window.Hands || !window.Camera) {
      this.statusElement.textContent = "MediaPipe failed to load. Check your network — mouse input still works.";
      return;
    }

    this.mode = "camera";
    this.video = document.createElement("video");
    this.video.className = "camera-preview";
    this.video.setAttribute("aria-label", "Camera preview");
    this.video.playsInline = true;
    this.video.muted = true;
    document.getElementById("cameraSlot").appendChild(this.video);

    this.hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });
    this.hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.62,
      minTrackingConfidence: 0.6,
    });
    this.hands.onResults((results) => this.handleHandResults(results));

    this.statusElement.textContent = "Requesting camera access. Both hands supported, up to 10 fingers.";
    this.camera = new Camera(this.video, {
      onFrame: async () => {
        await this.hands.send({ image: this.video });
      },
      width: CONFIG.cameraWidth,
      height: CONFIG.cameraHeight,
    });

    try {
      await this.camera.start();
      this.statusElement.textContent = "Camera enabled. Pinch thumb and index finger to draw, release to end; spread five fingers to spray.";
    } catch (error) {
      this.statusElement.textContent = "Camera failed to start. Check permissions — mouse input still works.";
      this.stopCamera();
    }
  }

  stopCamera() {
    this.camera?.stop?.();
    if (this.video?.srcObject) {
      for (const track of this.video.srcObject.getTracks()) {
        track.stop();
      }
    }
    this.video?.remove();
    this.video = null;
    this.camera = null;
    this.hands = null;
    this.mediaPipeHand = null;
    this.lastHand = null;
    this.mode = "mouse";
    this.statusElement.textContent = "Camera off — move the mouse or touch to leave a trace.";
  }

  handleHandResults(results) {
    const hands = results.multiHandLandmarks ?? [];
    if (hands.length === 0) {
      this.mediaPipeHand = null;
      return;
    }

    const drawActive = hands.some((landmarks) => this.isPinching(landmarks));
    const fingers = hands.flatMap((landmarks, handIndex) => {
      const extended = this.getExtendedFingers(landmarks);
      if (this.isPinching(landmarks) && !extended.some((finger) => finger.id === "index")) {
        extended.push({ id: "pinch", tip: landmarks[8] });
      }
      return extended.map((finger) => ({
        id: `hand-${handIndex}-${finger.id}`,
        x: (1 - finger.tip.x) * width,
        y: finger.tip.y * height,
      }));
    });

    this.mediaPipeHand = this.buildHand(fingers, drawActive);
  }

  isPinching(landmarks) {
    const thumb = landmarks[4];
    const index = landmarks[8];
    const wrist = landmarks[0];
    const middleBase = landmarks[9];
    const handScale = max(0.001, dist(wrist.x, wrist.y, middleBase.x, middleBase.y));
    return dist(thumb.x, thumb.y, index.x, index.y) < handScale * 0.46;
  }

  getExtendedFingers(landmarks) {
    const fingerSpecs = [
      { id: "thumb", tip: 4, pip: 3 },
      { id: "index", tip: 8, pip: 6 },
      { id: "middle", tip: 12, pip: 10 },
      { id: "ring", tip: 16, pip: 14 },
      { id: "pinky", tip: 20, pip: 18 },
    ];

    return fingerSpecs.filter((finger) => {
      const tip = landmarks[finger.tip];
      const pip = landmarks[finger.pip];
      if (finger.id === "thumb") {
        const palm = landmarks[5];
        return dist(tip.x, tip.y, palm.x, palm.y) > dist(pip.x, pip.y, palm.x, palm.y) * 1.12;
      }
      return tip.y < pip.y - 0.018;
    }).map((finger) => ({
      id: finger.id,
      tip: landmarks[finger.tip],
    }));
  }

  update() {
    const hand = this.mode === "camera" && this.mediaPipeHand ? this.mediaPipeHand : this.getMouseHand();
    if (!hand || hand.fingers.length === 0) {
      this.lastHand = null;
      return null;
    }

    const previous = this.lastHand;
    const center = hand.center;
    const speed = previous ? dist(previous.center.x, previous.center.y, center.x, center.y) : 0;
    const nextHand = { ...hand, speed };
    this.lastHand = nextHand;
    return nextHand;
  }

  getMouseHand() {
    if (!this.mousePoint) return null;

    const spread = 16;
    const fingers = [];
    for (let i = 0; i < this.mouseFingerCount; i += 1) {
      const offset = (i - (this.mouseFingerCount - 1) / 2) * spread;
      fingers.push({
        id: `mouse-${i}`,
        x: this.mousePoint.x + offset,
        y: this.mousePoint.y,
      });
    }

    return this.buildHand(fingers, this.mouseDown);
  }

  buildHand(fingers, drawActive = false) {
    const center = fingers.reduce(
      (sum, finger) => ({
        x: sum.x + finger.x / fingers.length,
        y: sum.y + finger.y / fingers.length,
      }),
      { x: 0, y: 0 },
    );
    return { fingers, center, count: fingers.length, drawActive };
  }
}
