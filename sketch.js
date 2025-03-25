let video;
let handpose;
let predictions = [];
let drawing = [];

let drawingColor;
let lastVSignTime = 0;

let isShowingText = false;
let smoothedX = null;
let smoothedY = null;
let smoothingFactor = 0.2;
let movementThreshold = 50;

let prevPalmX = null;
let waving = false;
let lastWaveTime = 0;

let buttons = [
  { label: "okay~ 👌", x: 20, y: 20, w: 120, h: 40, gesture: "ok" },
  { label: "최고예요 👍", x: 20, y: 70, w: 120, h: 40, gesture: "thumb" },
  { label: "하이파이브 🙌", x: 20, y: 120, w: 120, h: 40, gesture: "highfive" },
  { label: "지우기 🧼", x: 20, y: 170, w: 120, h: 40, gesture: "clear" }
];

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  handpose = ml5.handpose(video, modelReady);
  handpose.on("predict", (results) => {
    predictions = results;
  });

  drawingColor = color(0);
}

function modelReady() {
  console.log("🤖 Handpose model loaded");
}

function draw() {
  translate(width, 0);
  scale(-1, 1);
  image(video, 0, 0, width, height);

  // 버튼 그리기
  push();
  resetMatrix();
  for (let btn of buttons) {
    fill(240);
    stroke(0);
    rect(btn.x, btn.y, btn.w, btn.h, 8);
    fill(0);
    noStroke();
    textSize(14);
    textAlign(CENTER, CENTER);
    text(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2);
  }
  pop();

  // 그림 그리기
  noFill();
  for (let i = 1; i < drawing.length; i++) {
    let prev = drawing[i - 1];
    let curr = drawing[i];
    if (prev && curr) {
      stroke(prev.color);
      strokeWeight(4);
      line(prev.x, prev.y, curr.x, curr.y);
    }
  }

  isShowingText = false;

  if (predictions.length > 0) {
    let hand = predictions[0];
    let lm = hand.landmarks;

    // 버튼 체크용 좌표
    let indexX = width - lm[8][0];
    let indexY = lm[8][1];

    for (let btn of buttons) {
      if (
        indexX > btn.x && indexX < btn.x + btn.w &&
        indexY > btn.y && indexY < btn.y + btn.h
      ) {
        if (btn.gesture === "clear") {
          drawing = [];
          return;
        }

        isShowingText = true;
        drawing = [];

        push();
        resetMatrix();
        fill(255, 204, 0);
        textSize(48);
        textAlign(CENTER, CENTER);
        if (btn.gesture === "ok") text("okay~ 👌", width / 2, height / 2 + 120);
        if (btn.gesture === "thumb") text("최고예요 👍", width / 2, height / 2);
        if (btn.gesture === "highfive") text("하이파이브~ 🙌", width / 2, height / 2 + 60);
        pop();

        smoothedX = null;
        smoothedY = null;
        return;
      }
    }

    // 손가락 좌표 정보
    let thumbIndexDist = dist(lm[4][0], lm[4][1], lm[8][0], lm[8][1]);

    // 엄지 척
    let thumbTipY = lm[4][1];
    let thumbIPY = lm[3][1];
    let thumbBaseY = lm[2][1];
    let indexTipY = lm[8][1];
    let midFolded = lm[12][1] > lm[10][1];
    let ringFold = lm[16][1] > lm[14][1];
    let pinkyFold = lm[20][1] > lm[18][1];

    let isThumbsUp = (
      thumbTipY < thumbIPY &&
      thumbIPY < thumbBaseY &&
      thumbTipY < indexTipY - 20 &&
      midFolded && ringFold && pinkyFold &&
      thumbIndexDist > 60 &&
      lm[8][1] > lm[5][1] + 10 &&
      lm[12][1] > lm[9][1] + 10 &&
      lm[16][1] > lm[13][1] + 10 &&
      lm[20][1] > lm[17][1] + 10
    );

    // OK
    let okCondition = thumbIndexDist < 30 &&
                      lm[12][1] < lm[10][1] &&
                      lm[16][1] < lm[14][1] &&
                      lm[20][1] < lm[18][1];

    // 브이
    let isVSign = (
      lm[8][1] < lm[6][1] - 10 &&
      lm[12][1] < lm[10][1] - 10 &&
      lm[16][1] > lm[14][1] + 5 &&
      lm[20][1] > lm[18][1] + 5 &&
      dist(lm[8][0], lm[8][1], lm[12][0], lm[12][1]) > 40 &&
      lm[4][0] < lm[3][0] // 좌우 반전 상황에 따라 필요시 > 로 변경
    );

    // 하이파이브
    let isHighFive = (
      lm[8][1] < lm[6][1] - 10 &&
      lm[12][1] < lm[10][1] - 10 &&
      lm[16][1] < lm[14][1] - 10 &&
      lm[20][1] < lm[18][1] - 10 &&
      lm[4][1] < lm[3][1] - 10 &&
      abs(lm[8][0] - lm[12][0]) > 20 &&
      abs(lm[12][0] - lm[16][0]) > 20 &&
      abs(lm[16][0] - lm[20][0]) > 15
    );

    // 색 변경
    let currentTime = millis();
    if (isVSign && currentTime - lastVSignTime > 1000) {
      drawingColor = color(random(255), random(255), random(255));
      lastVSignTime = currentTime;
    }

    // 하이파이브 상태에서 흔드는 모션 감지
    if (isHighFive) {
      let palmX = lm[9][0];
      if (prevPalmX !== null) {
        let move = abs(palmX - prevPalmX);
        if (move > 15) {
          waving = true;
          lastWaveTime = millis();
        }
      }
      prevPalmX = palmX;
    } else {
      waving = false;
    }

    if (isThumbsUp || isHighFive || okCondition) {
      isShowingText = true;
      drawing = [];

      push();
      resetMatrix();
      fill(255, 204, 0);
      textSize(48);
      textAlign(CENTER, CENTER);

      if (isThumbsUp) {
        text("최고예요 👍", width / 2, height / 2);
      } else if (isHighFive) {
        if (waving && millis() - lastWaveTime < 1000) {
          text("안녕~~ 👋", width / 2, height / 2 + 60);
        } else {
          text("하이파이브~ 🙌", width / 2, height / 2 + 60);
        }
      } else if (okCondition) {
        text("okay~ 👌", width / 2, height / 2 + 120);
      }
      pop();

      smoothedX = null;
      smoothedY = null;
      return;
    }

    // ✍️ 유령펜 효과
    if (!isShowingText) {
      let drawCondition = thumbIndexDist < 40;

      if (drawCondition) {
        let rawX = lm[8][0];
        let rawY = lm[8][1];

        let speed = 0;
        if (smoothedX !== null && smoothedY !== null) {
          speed = dist(smoothedX, smoothedY, rawX, rawY);
        }

        smoothedX = lerp(smoothedX ?? rawX, rawX, smoothingFactor);
        smoothedY = lerp(smoothedY ?? rawY, rawY, smoothingFactor);

        let alpha = map(speed, 0, 50, 255, 30);
        alpha = constrain(alpha, 30, 255);

        let ghostColor = color(
          red(drawingColor),
          green(drawingColor),
          blue(drawingColor),
          alpha
        );

        fill(255, 0, 0);
        noStroke();
        circle(smoothedX, smoothedY, 10);

        drawing.push({ x: smoothedX, y: smoothedY, color: ghostColor });
      }
    }
  }
}
