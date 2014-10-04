var raf = require('raf');

var Gridr = require('../index.js').Gridr;
require('insert-css')('#c{outline:#000 solid 1px;height:45vmin;width:90vmin;}body,html{height:100vh}body{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:box;display:flex;-webkit-box-align:center;-o-box-align:center;-ms-flex-align:center;-webkit-align-items:center;align-items:center;-webkit-box-pack:center;-o-box-pack:center;-ms-flex-pack:center;-webkit-justify-content:center;justify-content:center}');

document.body.innerHTML =
  '<canvas id="c" height="1000px" width="2000px"></canvas><button id="toggle">toggle</button>';

var g = Gridr.createDefaultConfig(document.getElementById("c"), 50, 50);

g.on('mousedown', function(e) {
  g.set(e.x, e.y, {
    color: 'purple'
  });
});

g.setViewpoint({
  width: 20,
  height: 10,
  x: 10,
  y: 5
});

g.set(5, 6, {
  color: 'red'
});
g.set(0, 6, {
  color: 'blue'
});
g.set(2, 0, {
  color: 'orange'
});

g.set(10, 3, {
  color: 'orange'
});
g.set(10, 7, {
  color: 'orange'
});
g.set(10, 8, {
  color: 'red'
});
g.set(19, 4, {
  color: 'red'
});

g.set(20, 13, {
  color: 'blue'
});
g.set(19, 13, {
  color: 'blue'
});
g.set(18, 13, {
  color: 'blue'
});
g.set(17, 13, {
  color: 'blue'
});
g.set(16, 13, {
  color: 'blue'
});
g.set(15, 13, {
  color: 'blue'
});
g.set(14, 13, {
  color: 'blue'
});
g.set(13, 13, {
  color: 'blue'
});
g.set(12, 13, {
  color: 'blue'
});
g.set(11, 13, {
  color: 'blue'
});
g.set(10, 13, {
  color: 'blue'
});
g.set(9, 13, {
  color: 'blue'
});
g.draw();


var move = 0.1;


function step() {
  if (g._viewpoint.x >= 18) {
    move = -0.1;
  }

  if (g._viewpoint.x <= 1) {
    move = 0.1;
  }

  g.setViewpoint({
    x: g._viewpoint.x + move
  });
}


function drawStep() {
  g.draw();
  raf(drawStep);
}

drawStep();

var inter = setInterval(step, 10);

var running = true;
document.getElementById('toggle').addEventListener('click', function() {
  if (running) {
    window.clearInterval(inter);
    running = false;
  } else {
    inter = setInterval(step, 10);
    running = true;
  }
});
