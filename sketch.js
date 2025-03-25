// ✋ Hand Gesture Drawing System with Detailed Comments
// 초보자를 위한 전체 설명 포함 코드

// 📹 웹캠과 손 추적 관련 전역 변수들
let video;                 // 웹캠 영상 객체
let handpose;              // ml5의 손 추적 모델
let predictions = [];      // 현재 감지된 손의 정보 (landmarks 포함)

// ✍️ 그림 그리기 관련
let drawing = [];          // 지금까지 그려진 점들의 배열 (좌표 + 색상)
let drawingColor;          // 현재 펜 색상
let lastVSignTime = 0;     // 마지막 브이(V) 제스처 시간 (색 변경 중복 방지용)

// 📌 텍스트 상태 관리
let isShowingText = false; // 텍스트가 출력 중인지 여부

// 🎯 그리기 포인터 보정 관련 변수
let smoothedX = null;      // 부드럽게 따라가는 X 좌표
let smoothedY = null;      // 부드럽게 따라가는 Y 좌표
let smoothingFactor = 0.2; // 보정 강도 (0.0~1.0)
let movementThreshold = 50;// 움직임 민감도

// 👋 손 흔들기 감지용 변수
let prevPalmX = null;      // 이전 프레임 손바닥 X 좌표
let waving = false;        // 손 흔들기 상태
let lastWaveTime = 0;      // 마지막 흔들림 시간

// 🧩 화면에 표시될 버튼 정의
let buttons = [
  { label: "okay~ 👌",     x: 20, y: 50,  w: 120, h: 40, gesture: "ok" },
  { label: "최고예요 👍", x: 20, y: 100,  w: 120, h: 40, gesture: "thumb" },
  { label: "하이파이브 🙌", x: 20, y: 150, w: 120, h: 40, gesture: "highfive" },
  { label: "지우기 🧼",     x: 20, y: 200, w: 120, h: 40, gesture: "clear" }
];

function setup() {
  createCanvas(640, 480);     // 캔버스 생성
  video = createCapture(VIDEO); // 웹캠 영상 켜기
  video.size(width, height);
  video.hide();               // 영상은 숨기고 캔버스에 그림으로 보여줌

  handpose = ml5.handpose(video, modelReady);  // 손 추적 모델 로딩
  handpose.on("predict", (results) => {
    predictions = results;   // 결과 저장
  });

  drawingColor = color(0);   // 기본 색은 검정색
}

function modelReady() {
  console.log("🤖 Handpose model loaded");
}

function draw() {
  // 영상 좌우반전 (거울처럼 보이게)
  translate(width, 0);
  scale(-1, 1);
  image(video, 0, 0, width, height);

  // 🔲 버튼 UI 그리기
  push();
  resetMatrix(); // 좌우반전 전 상태로 되돌림
  let hoveredBtn = null; // 손가락이 올려진 버튼 저장
  if (predictions.length > 0) {
    let lm = predictions[0].landmarks;
    let indexX = width - lm[8][0]; // 검지 X 좌표 (좌우 반전 보정)
    let indexY = lm[8][1];         // 검지 Y 좌표
    for (let btn of buttons) {
      if (indexX > btn.x && indexX < btn.x + btn.w &&
          indexY > btn.y && indexY < btn.y + btn.h) {
        hoveredBtn = btn;
      }
    }
  }

  for (let btn of buttons) {
    fill(btn === hoveredBtn ? color(200, 230, 255) : 240); // 호버 시 색 변경
    stroke(0);
    rect(btn.x, btn.y, btn.w, btn.h, 8);
    fill(0);
    noStroke();
    textSize(14);
    textAlign(CENTER, CENTER);
    text(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2);
  }
  pop();

  // 🖍️ 저장된 선 그리기
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

  isShowingText = false; // 매 프레임 텍스트 초기화

  if (predictions.length > 0) {
    let hand = predictions[0];
    let lm = hand.landmarks;

    // 버튼 클릭 처리
    let indexX = width - lm[8][0];
    let indexY = lm[8][1];
    for (let btn of buttons) {
      if (indexX > btn.x && indexX < btn.x + btn.w && indexY > btn.y && indexY < btn.y + btn.h) {
        if (btn.gesture === "clear") {
          drawing = [];
          return;
        }

        isShowingText = true;
        drawing = []; // 텍스트 모드일 땐 선 비움

        push();
        resetMatrix();
        fill(255, 204, 0);
        textSize(48);
        textAlign(CENTER, CENTER);
        if (btn.gesture === "ok")       text("okay~ 👌", width / 2, height / 2 + 120);
        if (btn.gesture === "thumb")    text("최고예요 👍", width / 2, height / 2);
        if (btn.gesture === "highfive") text("하이파이브~ 🙌", width / 2, height / 2 + 60);
        pop();

        smoothedX = null;
        smoothedY = null;
        return;
      }
    }

    // 손가락 거리 계산 (엄지와 검지)
    let thumbIndexDist = dist(lm[4][0], lm[4][1], lm[8][0], lm[8][1]);

    // 제스처 판별
    let isThumbsUp = (
      lm[4][1] < lm[3][1] &&
      lm[3][1] < lm[2][1] &&
      lm[4][1] < lm[8][1] - 20 &&
      lm[12][1] > lm[10][1] &&
      lm[16][1] > lm[14][1] &&
      lm[20][1] > lm[18][1] &&
      thumbIndexDist > 60 &&
      lm[8][1] > lm[5][1] + 10 &&
      lm[12][1] > lm[9][1] + 10 &&
      lm[16][1] > lm[13][1] + 10 &&
      lm[20][1] > lm[17][1] + 10
    );

    let okCondition = thumbIndexDist < 30 &&
                      lm[12][1] < lm[10][1] &&
                      lm[16][1] < lm[14][1] &&
                      lm[20][1] < lm[18][1];

    let isVSign = (
      lm[8][1] < lm[6][1] - 10 &&
      lm[12][1] < lm[10][1] - 10 &&
      lm[16][1] > lm[14][1] + 5 &&
      lm[20][1] > lm[18][1] + 5 &&
      dist(lm[8][0], lm[8][1], lm[12][0], lm[12][1]) > 40 &&
      lm[4][0] < lm[3][0]
    );

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

    // 브이 제스처 시 색상 랜덤 변경 (1초 간격 제한)
    if (isVSign && millis() - lastVSignTime > 1000) {
      drawingColor = color(random(255), random(255), random(255));
      lastVSignTime = millis();
    }

    // 하이파이브 상태에서 손 흔들기 감지
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

    // 제스처에 따른 텍스트 출력
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

    // ✍️ 유령펜 기능 (엄지+검지 붙고, 나머지 손가락 접을 때만 그림 그리기)
    let isThumbNearIndex = thumbIndexDist < 35;
    let isMiddleFolded = lm[12][1] > lm[10][1] + 10; // 중지
    let isRingFolded = lm[16][1] > lm[14][1] + 10; // 약지
    let isPinkyFolded = lm[20][1] > lm[18][1] + 10; // 새끼손가락

    // 위 조건들이 모두 참일 때만 그림이 그려짐
    let drawCondition =
      isThumbNearIndex &&
      isMiddleFolded &&
      isRingFolded &&
      isPinkyFolded;

    if (!isShowingText && drawCondition) {
      let rawX = lm[8][0];
      let rawY = lm[8][1];

      // 손이 얼마나 빨리 움직이는지 계산산
      let speed = 0;
      if (smoothedX !== null && smoothedY !== null) {
        speed = dist(smoothedX, smoothedY, rawX, rawY);
      }

      // 손가락이 부드럽게 움직이도록 보정
      smoothedX = lerp(smoothedX ?? rawX, rawX, smoothingFactor);
      smoothedY = lerp(smoothedY ?? rawY, rawY, smoothingFactor);

      // 움직임 속도에 따라 선의 투명도 설정정
      let alpha = map(speed, 0, 50, 255, 30);
      alpha = constrain(alpha, 30, 255);

      let ghostColor = color(
        red(drawingColor),
        green(drawingColor),
        blue(drawingColor),
        alpha
      );

      // 손가락 위치에 붉은 점 표시시
      fill(255, 0, 0);
      noStroke();
      circle(smoothedX, smoothedY, 10);

      drawing.push({ x: smoothedX, y: smoothedY, color: ghostColor });
    }
  }
}
