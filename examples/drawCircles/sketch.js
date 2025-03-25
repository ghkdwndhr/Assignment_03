  const maxCircles = 20;
  let   circles = [];

  function setup() {
    createCanvas(windowWidth, windowHeight);
    noStroke();
    background(220);
    frameRate(20);
  }

  function draw() {
    background(220);
    circles.push({ x: mouseX, y: mouseY, 
      size: 20+int(random(100)),
      r: int(random(255)), 
      g: int(random(255)), 
      b: int(random(255)) });

    if (circles.length > maxCircles) {
      circles.shift();
    }

    const alphaDelta = 200 / maxCircles;
    let alpha = 200 - circles.length * alphaDelta
    for (let circle of circles) {
      fill(circle.r, circle.g, circle.b, alpha);
      alpha += alphaDelta;
      ellipse(circle.x, circle.y, circle.size);
    }
  }

  function mousePressed() {
    circles = [];
    background(220);
  }

