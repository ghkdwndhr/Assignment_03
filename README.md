# 🚀 Assignment_03: Hand Gesture Interactive System
🎬 [**시연 영상 바로가기 클릭!**](https://youtu.be/PVgp8ka9wCk?si=FIdV_Obq2eix7vOm)

---

## 🧠 개요  
이번 과제는 p5.js와 ml5.js를 활용하여 웹캠에서 손 동작을 인식하고,  
다양한 반응을 인터랙티브하게 표현하는 제스처 기반 반응 시스템을 구현한 프로젝트입니다.  
손 제스처에 따라 텍스트가 화면에 나타나며, 유령펜 스타일의 그림 그리기, 색상 변경, 지우기 기능까지 모두 포함되어 있습니다.

---

## 🛠️ 주요 기능

### ✅ 텍스트 반응 (화면 버튼 or 손 제스처)
- **👍 최고예요**  
  - 엄지손가락만 위로 펴고 나머지는 접으면 텍스트 `"최고예요 👍"` 출력
- **🙌 하이파이브**  
  - 다섯 손가락을 모두 쫙 펴면 `"하이파이브~ 🙌"` 출력
- **👋 안녕~~**  
  - 하이파이브 상태에서 손을 좌우로 흔들면 `"안녕~~ 👋"` 텍스트 출력  
  - 움직임이 멈추면 텍스트는 자동으로 사라짐
- **👌 okay~**  
  - 엄지와 검지를 붙이고 나머지 손가락은 펴면 `"okay~ 👌"` 텍스트 출력
- **👆 화면 버튼을 검지로 가리키면 해당 텍스트 출력**  
  - 화면 좌측 상단의 버튼(최고예요, 하이파이브, okay, 지우기)을 검지로 가리키면 같은 반응 출력

---

### 🖌️ 그림 그리기 (오른손 제스처)
- **엄지 + 검지 붙이면**: 그림 그리기 모드 진입
- **그림은 부드럽게 이어지며, 손의 속도에 따라 투명도 자동 조절됨**
  - 빠르게 움직이면 선이 흐릿해지고
  - 천천히 움직이면 선이 진하게 그려짐    

---

### 🎨 색상 변경 (브이 제스처)
- ✌️ 브이(V) 제스처를 하면 펜 색상이 랜덤으로 변경됨  
  - 검지와 중지를 확실히 펴고, 나머지는 접으며 손가락 간격 유지

---

### 🧼 지우기 기능
- **화면 좌측 상단의 지우기 버튼을 검지로 가리키면 전체 그림 삭제**

---

## 💻 소프트웨어 구성

### p5.js (JavaScript)
- 웹캠 영상 입력 처리
- 캔버스 기반 UI, 터치 없이 손가락 제스처만으로 조작
- 색상 랜덤화, 텍스트 출력, 드로잉 처리 등 사용자 인터랙션 중심 구현

### ml5.js (Handpose)
- 21개 손 랜드마크 좌표 추적
- 손가락 간 거리 및 상대 위치로 다양한 제스처 식별
- 조건 기반 텍스트 트리거 및 인터랙션 판단

---

## 🖼️ UI 인터페이스
- 좌측 상단 버튼 4개:
  - `"okay~ 👌"`  
  - `"최고예요 👍"`  
  - `"하이파이브~ 🙌"`  
  - `"지우기 🧼"`
- 검지로 해당 버튼을 가리키면 텍스트가 화면에 표시됨
- 별도 마우스 클릭 없이 손 제스처로 UI 컨트롤 가능

---

## 🚀 실행 방법
1. 웹캠 사용 권한 허용
2. `index.html`에서 p5.js + ml5.js 스크립트 포함
3. 브라우저에서 코드 실행 (`Live Server` 권장)
4. 손 제스처 또는 화면 버튼 조작으로 기능 사용
5. Manycam 또는 OBS Virtual Camera를 통해 Zoom 등 화상 플랫폼에 연동 가능

---

## 🧠 제스처 인식 알고리즘 요약
- 엄지, 검지, 중지 등 21개 손 랜드마크의 상대 위치 비교
- 손가락 접힘 여부 판단: 관절들의 Y 좌표 비교
- 제스처 간 구분: 거리 계산 + 방향 조건 조합

－－－

## ⚠️ 주의사항
- `index.html`에 아래 스크립트 포함 필수

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.10.0/p5.js"></script>
<script src="https://unpkg.com/ml5@1/dist/ml5.min.js"></script>
```

- 좌우 반전이 적용되므로 제스처 방향(엄지 위치 등)을 인식 조건에 맞게 확인할 것
- 손가락을 확실히 구분되도록 펼치면 인식률 향상

---
