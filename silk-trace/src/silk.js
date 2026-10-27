class SilkThread {
  constructor(anchor, tip, options = {}) {
    this.anchor = createVector(anchor.x, anchor.y);
    this.tip = createVector(tip.x, tip.y);
    this.restTip = p5.Vector.lerp(this.anchor, this.tip, options.restRatio ?? random(0.72, 0.92));
    this.velocity = createVector(0, 0);
    this.birthMs = millis();
    this.fixed = options.fixed ?? false;
    this.broken = options.broken ?? false;
    this.edgePermanent = options.edgePermanent ?? false;
    this.baseColor = options.color ?? CONFIG.palettes.white;
    this.weight = options.weight ?? random(1.8, 4.8);
    this.phase = random(TAU);
    this.noiseSeed = random(1000);
    this.maxLifeMs = options.maxLifeMs ?? CONFIG.greyMs;
    const strandCount = options.strandCount ?? (this.broken ? 5 : CONFIG.silkBundleStrands);
    this.strands = Array.from({ length: strandCount }, (_, index) => ({
      ratio: strandCount === 1 ? 0.5 : index / (strandCount - 1),
      phase: random(TAU),
      jitter: random(-1, 1),
      bow: random(-0.55, 0.55),
      lengthOffset: random(-0.12, 0.18),
      weight: random(0.55, 1.12),
    }));
  }

  follow(target) {
    const targetVector = createVector(target.x, target.y);
    const pull = p5.Vector.sub(targetVector, this.tip).mult(CONFIG.stickyPull);
    this.velocity.add(pull);
    this.speedMemory = p5.Vector.sub(targetVector, this.tip).mag();
  }

  release() {
    this.fixed = true;
    this.birthMs = millis();
    this.restTip = p5.Vector.lerp(this.anchor, this.tip, random(0.82, 0.94));
  }

  update(target = null) {
    if (target && !this.fixed) {
      this.follow(target);
    } else {
      const spring = p5.Vector.sub(this.restTip, this.tip).mult(CONFIG.springBack);
      this.velocity.add(spring);
    }

    const drift = createVector(
      noise(this.noiseSeed, frameCount * 0.006) - 0.5,
      noise(this.noiseSeed + 77, frameCount * 0.006) - 0.5,
    ).mult(this.broken ? CONFIG.drift * 0.6 : CONFIG.drift);

    this.velocity.add(drift);
    this.velocity.y += CONFIG.gravity * (this.fixed ? 0.55 : 1);
    this.velocity.mult(CONFIG.damping);
    this.tip.add(this.velocity);
  }

  draw() {
    const colorState = this.getColorState();
    if (colorState.alpha <= 0) return;

    const direction = p5.Vector.sub(this.tip, this.anchor);
    const normal =
      direction.magSq() > 0.01 ? direction.copy().rotate(HALF_PI).normalize() : createVector(0, 1);
    const length = direction.mag();
    const stretch = constrain(length / (width * 0.68), 0, 1);
    const thinness = lerp(1, 0.18, stretch);
    const bundleWidth = constrain(lerp(18, 3.2, stretch) * (this.broken ? 0.44 : 1), 1.8, 22);
    const sag = min(height * 0.24, length * CONFIG.sagStrength * (this.fixed ? 0.62 : 1));
    const pullBack = constrain(length * 0.08, 4, 26);
    const alphaScale = lerp(1, 0.34, stretch);

    noFill();
    for (let i = 0; i < this.strands.length; i += 1) {
      const strand = this.strands[i];
      const side = (strand.ratio - 0.5) * bundleWidth;
      const wobble =
        sin(frameCount * 0.018 + strand.phase + this.phase) * bundleWidth * (this.fixed ? 0.04 : 0.09) +
        strand.jitter * bundleWidth * 0.08;
      const start = p5.Vector.add(this.anchor, normal.copy().mult(side));
      const end = p5.Vector.add(this.tip, normal.copy().mult(side + wobble));
      const controlA = p5.Vector.lerp(start, end, 0.38)
        .add(createVector(0, sag * (0.36 + strand.ratio * 0.36)))
        .add(normal.copy().mult(wobble * 0.42 + strand.bow * bundleWidth));
      const controlB = p5.Vector.lerp(start, end, 0.68)
        .add(createVector(0, sag * (0.78 + abs(strand.bow) * 0.28)))
        .sub(direction.copy().mult(0.04 - strand.lengthOffset * 0.08));
      const centerBoost = constrain(1 - abs(strand.ratio - 0.5) * 1.9, 0.08, 1);

      stroke(colorState.r, colorState.g, colorState.b, colorState.alpha * alphaScale * (0.12 + centerBoost * 0.24));
      strokeWeight(max(0.16, this.weight * strand.weight * thinness * (0.28 + centerBoost * 0.72)));
      bezier(start.x, start.y, controlA.x, controlA.y, controlB.x, controlB.y, end.x, end.y);

      if (i === floor(this.strands.length / 2)) {
        stroke(colorState.r, colorState.g, colorState.b, colorState.alpha * alphaScale * 0.18);
        strokeWeight(max(0.18, this.weight * thinness * 0.38));
        line(
          end.x,
          end.y,
          end.x - direction.x * 0.04 - normal.x * pullBack * 0.03,
          end.y - direction.y * 0.04 + pullBack,
        );
      }
    }
  }

  getColorState() {
    const age = millis() - this.birthMs;
    const fade = this.fixed ? constrain(1 - age / this.maxLifeMs, 0, 1) : 1;

    if (!this.fixed) {
      return { r: this.baseColor[0], g: this.baseColor[1], b: this.baseColor[2], alpha: 78 };
    }

    if (this.broken) {
      const fade = constrain(1 - age / 42000, 0, 1);
      return {
        r: this.baseColor[0],
        g: this.baseColor[1],
        b: this.baseColor[2],
        alpha: 42 * fade,
      };
    }

    return {
      r: this.baseColor[0],
      g: this.baseColor[1],
      b: this.baseColor[2],
      alpha: (this.edgePermanent ? 112 : 82) * fade,
    };
  }

  isDead() {
    return this.fixed && millis() - this.birthMs > this.maxLifeMs;
  }

  samplePoint() {
    return p5.Vector.lerp(this.anchor, this.tip, random(0.15, 0.85));
  }
}

class GlueDroplet {
  constructor(origin, velocity, options = {}) {
    this.position = createVector(origin.x, origin.y);
    this.velocity = velocity.copy();
    this.birthMs = millis();
    this.lifeMs = options.lifeMs ?? random(18000, 52000);
    this.radius = options.radius ?? random(0.8, 3.6);
    this.alpha = options.alpha ?? random(18, 58);
    this.baseColor = options.color ?? CONFIG.palettes.white;
    this.settled = false;
    this.phase = random(TAU);
  }

  update() {
    if (!this.settled) {
      this.velocity.y += CONFIG.gravity * 0.34;
      this.velocity.mult(0.86);
      this.position.add(this.velocity);

      if (this.velocity.magSq() < 0.05 || random() < 0.012) {
        this.settled = true;
      }
    } else {
      this.position.x += sin(frameCount * 0.018 + this.phase) * 0.035;
      this.position.y += CONFIG.gravity * 0.02;
    }
  }

  draw() {
    const age = millis() - this.birthMs;
    const fade = constrain(1 - age / this.lifeMs, 0, 1);
    if (fade <= 0) return;

    noStroke();
    fill(this.baseColor[0], this.baseColor[1], this.baseColor[2], this.alpha * fade);
    circle(this.position.x, this.position.y, this.radius * (this.settled ? 1.18 : 1));

    if (!this.settled && this.velocity.magSq() > 0.3) {
      stroke(this.baseColor[0], this.baseColor[1], this.baseColor[2], this.alpha * 0.38 * fade);
      strokeWeight(max(0.14, this.radius * 0.18));
      line(
        this.position.x,
        this.position.y,
        this.position.x - this.velocity.x * 3.8,
        this.position.y - this.velocity.y * 3.8,
      );
    }
  }

  isDead() {
    return millis() - this.birthMs > this.lifeMs;
  }
}

class SprayFiber {
  constructor(origin, velocity, options = {}) {
    this.start = createVector(origin.x, origin.y);
    this.end = createVector(origin.x, origin.y).add(velocity);
    this.velocity = velocity.copy().mult(options.frozen ? 0 : 0.12);
    this.birthMs = millis();
    this.lifeMs = options.lifeMs ?? random(70000, 160000);
    this.alpha = options.alpha ?? random(16, 46);
    this.weight = options.weight ?? random(0.12, 0.42);
    this.baseColor = options.color ?? CONFIG.palettes.white;
    this.phase = random(TAU);
    this.tintSeed = random(1);
    this.settled = options.frozen ?? false;
    this.shattered = false;
  }

  update() {
    if (!this.settled) {
      this.velocity.y += CONFIG.gravity * 0.22;
      this.velocity.mult(0.88);
      this.end.add(this.velocity);
      if (this.velocity.magSq() < 0.035 || random() < 0.035) {
        this.settled = true;
      }
    } else {
      this.end.y += CONFIG.gravity * 0.006;
    }
  }

  draw() {
    const age = millis() - this.birthMs;
    const fade = constrain(1 - age / this.lifeMs, 0, 1);
    if (fade <= 0) return;

    const direction = p5.Vector.sub(this.end, this.start);
    const normal =
      direction.magSq() > 0.01 ? direction.copy().rotate(HALF_PI).normalize() : createVector(0, 1);
    const sag = min(28, direction.mag() * 0.16);
    const wobble = sin(frameCount * 0.03 + this.phase) * 3.5;
    const c1 = p5.Vector.lerp(this.start, this.end, 0.34)
      .add(createVector(0, sag * 0.45))
      .add(normal.copy().mult(wobble));
    const c2 = p5.Vector.lerp(this.start, this.end, 0.72)
      .add(createVector(0, sag))
      .sub(normal.copy().mult(wobble * 0.35));

    noFill();
    const colorState = this.getColorState(fade);
    stroke(colorState.r, colorState.g, colorState.b, colorState.alpha);
    strokeWeight(this.weight);
    bezier(this.start.x, this.start.y, c1.x, c1.y, c2.x, c2.y, this.end.x, this.end.y);
  }

  getColorState(fade) {
    return {
      r: this.baseColor[0],
      g: this.baseColor[1],
      b: this.baseColor[2],
      alpha: this.alpha * fade,
    };
  }

  isDead() {
    return millis() - this.birthMs > this.lifeMs;
  }

  shouldShatter() {
    return !this.shattered && millis() - this.birthMs > this.lifeMs * CONFIG.breakIntoShardsAt;
  }

  makeShards() {
    this.shattered = true;
    const pieces = floor(random(2, 5));
    const shards = [];

    for (let i = 0; i < pieces; i += 1) {
      const t1 = i / pieces + random(-0.04, 0.04);
      const t2 = (i + random(0.42, 0.86)) / pieces;
      const start = {
        x: lerp(this.start.x, this.end.x, constrain(t1, 0, 1)),
        y: lerp(this.start.y, this.end.y, constrain(t1, 0, 1)),
      };
      const end = {
        x: lerp(this.start.x, this.end.x, constrain(t2, 0, 1)),
        y: lerp(this.start.y, this.end.y, constrain(t2, 0, 1)),
      };
      shards.push(
        new FallingShard(start, end, {
          color: this.baseColor,
          alpha: this.alpha * random(0.42, 0.82),
          weight: this.weight * random(0.65, 1.25),
        }),
      );
    }

    return shards;
  }

  anchorPoint() {
    return {
      x: lerp(this.start.x, this.end.x, 0.72),
      y: lerp(this.start.y, this.end.y, 0.72),
    };
  }
}

class FallingShard {
  constructor(start, end, options = {}) {
    this.start = createVector(start.x, start.y);
    this.end = createVector(end.x, end.y);
    this.velocity = createVector(random(-0.18, 0.18), random(0.12, 0.8));
    this.rotation = random(-0.012, 0.012);
    this.birthMs = millis();
    this.lifeMs = random(18000, 52000);
    this.baseColor = options.color ?? CONFIG.palettes.white;
    this.alpha = options.alpha ?? random(18, 42);
    this.weight = options.weight ?? random(0.1, 0.32);
    this.phase = random(TAU);
  }

  update() {
    const center = p5.Vector.lerp(this.start, this.end, 0.5);
    this.velocity.y += CONFIG.gravity * 0.22;
    this.velocity.mult(0.985);
    this.start.add(this.velocity);
    this.end.add(this.velocity);
    this.start = rotateAround(this.start, center, this.rotation);
    this.end = rotateAround(this.end, center, this.rotation);
  }

  draw() {
    const age = millis() - this.birthMs;
    const fade = constrain(1 - age / this.lifeMs, 0, 1);
    if (fade <= 0) return;

    const mid = p5.Vector.lerp(this.start, this.end, 0.5);
    const bend = sin(frameCount * 0.035 + this.phase) * 2.2;

    noFill();
    stroke(this.baseColor[0], this.baseColor[1], this.baseColor[2], this.alpha * fade);
    strokeWeight(this.weight);
    bezier(
      this.start.x,
      this.start.y,
      mid.x,
      mid.y + bend,
      mid.x,
      mid.y + bend,
      this.end.x,
      this.end.y,
    );
  }

  isDead() {
    return millis() - this.birthMs > this.lifeMs || this.start.y > height + 80;
  }
}

class SilkSystem {
  constructor() {
    this.threads = [];
    this.droplets = [];
    this.sprayFibers = [];
    this.fallingShards = [];
    this.activeThreads = new Map();
    this.suspendedFingers = new Map();
    this.anchors = [];
    this.edgeJourney = null;
    this.lastBurstMs = -Infinity;
    this.wasBurstGesture = false;
    this.lastPluckMs = -Infinity;
    this.paletteName = "white";
    this.currentColor = CONFIG.palettes.white;
    this.sound = null;
  }

  clear() {
    this.threads = [];
    this.droplets = [];
    this.sprayFibers = [];
    this.fallingShards = [];
    this.activeThreads.clear();
    this.suspendedFingers.clear();
    this.anchors = [];
    this.edgeJourney = null;
    this.lastBurstMs = -Infinity;
    this.wasBurstGesture = false;
  }

  setPalette(name) {
    this.paletteName = CONFIG.palettes[name] ? name : "white";
    this.currentColor = CONFIG.palettes[this.paletteName];
  }

  setSoundEngine(sound) {
    this.sound = sound;
  }

  update(hand) {
    this.updateSprayGesture(hand);
    this.updateEdgeJourney(hand);
    this.updateActiveThreads(hand);

    for (const thread of this.threads) {
      thread.update();
    }
    for (const droplet of this.droplets) {
      droplet.update();
    }
    for (const fiber of this.sprayFibers) {
      fiber.update();
    }
    for (const shard of this.fallingShards) {
      shard.update();
    }

    this.threads = this.threads.filter((thread) => !thread.isDead());
    this.droplets = this.droplets.filter((droplet) => !droplet.isDead());
    this.shatterAgedFibers();
    this.sprayFibers = this.sprayFibers.filter((fiber) => !fiber.isDead());
    this.fallingShards = this.fallingShards.filter((shard) => !shard.isDead());
    if (this.threads.length > CONFIG.maxSilks) {
      this.threads.splice(0, min(CONFIG.softCullPerFrame, this.threads.length - CONFIG.maxSilks));
    }
    if (this.droplets.length > CONFIG.maxDroplets) {
      this.droplets.splice(0, this.droplets.length - CONFIG.maxDroplets);
    }
    if (this.sprayFibers.length > CONFIG.maxSprayFibers) {
      this.sprayFibers.splice(0, min(CONFIG.softCullPerFrame, this.sprayFibers.length - CONFIG.maxSprayFibers));
    }
    if (this.fallingShards.length > CONFIG.maxFallingShards) {
      this.fallingShards.splice(0, min(CONFIG.softCullPerFrame, this.fallingShards.length - CONFIG.maxFallingShards));
    }
  }

  draw() {
    blendMode(ADD);
    for (const shard of this.fallingShards) {
      shard.draw();
    }
    for (const fiber of this.sprayFibers) {
      fiber.draw();
    }
    for (const droplet of this.droplets) {
      droplet.draw();
    }
    for (const thread of this.threads) {
      thread.draw();
    }
    for (const thread of this.activeThreads.values()) {
      thread.draw();
    }
    blendMode(BLEND);
  }

  shatterAgedFibers() {
    const remaining = [];
    for (const fiber of this.sprayFibers) {
      if (fiber.shouldShatter() && random() < 0.035) {
        this.fallingShards.push(...fiber.makeShards());
        this.sound?.snap(random(0.08, 0.22), fiber.anchorPoint());
      } else {
        remaining.push(fiber);
      }
    }
    this.sprayFibers = remaining;
  }

  updateActiveThreads(hand) {
    const fingers = hand?.fingers ?? [];
    if (!hand?.drawActive) {
      this.releaseActiveThreads();
      return;
    }

    const seen = new Set();

    for (const finger of fingers) {
      seen.add(finger.id);
      const suspended = this.suspendedFingers.get(finger.id);
      if (suspended) {
        const movedAway = dist(finger.x, finger.y, suspended.x, suspended.y) > 72;
        if (millis() < suspended.untilMs && !movedAway) {
          continue;
        }
        this.suspendedFingers.delete(finger.id);
      }

      let thread = this.activeThreads.get(finger.id);

      if (!thread) {
        const anchor = this.getStickyAnchor(finger);
        if (!anchor) {
          continue;
        }
        thread = new SilkThread(anchor, finger, {
          strandCount: random() < 0.5 ? 4 : CONFIG.silkBundleStrands,
          weight: random(1.1, 3.2),
          color: this.currentColor,
        });
        this.activeThreads.set(finger.id, thread);
        this.pluckGesture(finger, hand, 0.075);
      }

      thread.update(finger);
    }

    for (const [id, thread] of this.activeThreads.entries()) {
      if (!seen.has(id)) {
        thread.release();
        this.threads.push(thread);
        this.rememberAnchor(thread.samplePoint());
        this.activeThreads.delete(id);
      }
    }
  }

  releaseActiveThreads() {
    for (const [id, thread] of this.activeThreads.entries()) {
      thread.release();
      this.threads.push(thread);
      this.rememberAnchor(thread.samplePoint());
      this.activeThreads.delete(id);
    }
  }

  updateSprayGesture(hand) {
    const active = Boolean(hand && hand.count >= 5);
    if (active && !this.wasBurstGesture) {
      this.triggerBurst(hand);
    }
    this.wasBurstGesture = active;
  }

  triggerBurst(hand) {
    if (!hand || millis() - this.lastBurstMs < CONFIG.sprayBurstCooldownMs) return;

    for (const finger of hand.fingers) {
      this.emitSpray(finger, hand.speed, true);
    }
    this.sound?.spray(map(hand.count, 1, 10, 0.35, 1, true), hand.center, hand.speed);
    this.lastBurstMs = millis();
  }

  pluckGesture(finger, hand, volume = 0.08) {
    if (millis() - this.lastPluckMs < 90) return;
    this.sound?.pluck(finger, {
      speed: hand.speed,
      fingerCount: hand.count,
      volume,
    });
    this.lastPluckMs = millis();
  }

  getStickyAnchor(finger) {
    const nearby = this.findNearbySilkPoint(finger);
    if (nearby) return nearby;

    const edgeAnchor = this.closestEdgePoint(finger);
    if (dist(edgeAnchor.x, edgeAnchor.y, finger.x, finger.y) <= CONFIG.edgeBand) {
      return edgeAnchor;
    }

    return null;
  }

  findNearbySilkPoint(point) {
    let best = null;
    let bestDistance = CONFIG.stickDistance;

    for (const droplet of this.droplets) {
      if (!droplet.settled) continue;
      const currentDistance = dist(point.x, point.y, droplet.position.x, droplet.position.y);
      if (currentDistance < bestDistance) {
        bestDistance = currentDistance;
        best = { x: droplet.position.x, y: droplet.position.y };
      }
    }

    for (const fiber of this.sprayFibers) {
      if (!fiber.settled) continue;
      const anchor = fiber.anchorPoint();
      const currentDistance = dist(point.x, point.y, anchor.x, anchor.y);
      if (currentDistance < bestDistance) {
        bestDistance = currentDistance;
        best = anchor;
      }
    }

    for (const thread of this.threads) {
      const candidates = [thread.anchor, thread.tip, p5.Vector.lerp(thread.anchor, thread.tip, 0.5)];
      for (const candidate of candidates) {
        const currentDistance = dist(point.x, point.y, candidate.x, candidate.y);
        if (currentDistance < bestDistance) {
          bestDistance = currentDistance;
          best = { x: candidate.x, y: candidate.y };
        }
      }
    }

    return best;
  }

  updateEdgeJourney(hand) {
    const point = hand?.center;
    if (!point) return;

    const edge = this.detectEdge(point);
    if (!edge) return;

    if (!this.edgeJourney) {
      this.edgeJourney = { edge, point: { x: point.x, y: point.y } };
      return;
    }

    if (edge !== this.edgeJourney.edge) {
      const permanent = new SilkThread(this.edgeJourney.point, point, {
        fixed: true,
        edgePermanent: true,
        weight: random(2.2, 4.2),
        color: this.currentColor,
      });
      this.threads.push(permanent);
      this.rememberAnchor(this.edgeJourney.point);
      this.rememberAnchor({ x: point.x, y: point.y });
      this.edgeJourney = { edge, point: { x: point.x, y: point.y } };
    }
  }

  emitSpray(finger, speed, sticky) {
    const count = sticky
      ? CONFIG.sprayPerFinger
      : max(1, floor(CONFIG.sprayPerFinger * 0.45));
    const force = map(speed, 0, CONFIG.breakSpeed * 1.4, 0.6, 1.65, true);

    for (let i = 0; i < count; i += 1) {
      const angle = random(TAU);
      const radius = random(CONFIG.sprayRadius * 0.12, CONFIG.sprayRadius);
      const origin = {
        x: finger.x + cos(angle) * radius * 0.28,
        y: finger.y + sin(angle) * radius * 0.28,
      };
      const length = random(CONFIG.sprayFiberLength * 0.35, CONFIG.sprayFiberLength) * force;
      const velocity = createVector(cos(angle), sin(angle))
        .mult(length)
        .add(createVector(random(-10, 10), random(-4, 18)));
      const fiber = new SprayFiber(origin, velocity, {
        alpha: sticky ? random(20, 58) : random(12, 34),
        weight: sticky ? random(0.1, 0.34) : random(0.06, 0.18),
        frozen: true,
        color: this.currentColor,
      });
      this.sprayFibers.push(fiber);

      if (sticky && random() < 0.1) {
        this.rememberAnchor(origin);
      }
    }
  }

  detectEdge(point) {
    if (point.x <= CONFIG.edgeBand) return "left";
    if (point.x >= width - CONFIG.edgeBand) return "right";
    if (point.y <= CONFIG.edgeBand) return "top";
    if (point.y >= height - CONFIG.edgeBand) return "bottom";
    return null;
  }

  closestEdgePoint(point) {
    const distances = [
      { x: 0, y: point.y, d: point.x },
      { x: width, y: point.y, d: width - point.x },
      { x: point.x, y: 0, d: point.y },
      { x: point.x, y: height, d: height - point.y },
    ];
    distances.sort((a, b) => a.d - b.d);
    return { x: distances[0].x, y: distances[0].y };
  }

  rememberAnchor(point) {
    this.anchors.push({ x: point.x, y: point.y });
    if (this.anchors.length > CONFIG.maxAnchors) {
      this.anchors.shift();
    }
  }

}

function rotateAround(point, center, angle) {
  const translated = p5.Vector.sub(point, center).rotate(angle);
  return p5.Vector.add(center, translated);
}
