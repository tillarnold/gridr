let raf = require('raf')

let Gridr = require('../index.js').Gridr
require('insert-css')(`
#c{
  outline:#000 solid 1px;
  height:45vmin;
  width:90vmin;
}
body,html{
  height:100vh;
}

body{
  display:flex;
  align-items:center;
  justify-content:center;
}`)

document.body.innerHTML =
  '<canvas id="c" height="1000px" width="2000px"></canvas><button id="toggle">toggle</button>'

let g = Gridr.createDefaultConfig(document.getElementById('c'), 50, 50)

let img = new Image()
img.src = "http://lorempixel.com/400/200/nature/1"

img.onload = () => {
  g.on('mousedown', function(e) {
    g.set(e.x, e.y, {
      img
    })
  })

  g.setViewpoint({ width: 20
                 , height: 10
                 , x: 10
                 , y: 5
                 })

  g.set(5, 6, {
    color: 'red'
  })
  g.set(0, 6, {
    color: 'blue'
  })
  g.set(2, 0, {
    color: 'orange'
  })

  g.set(10, 3, {
    color: 'orange'
  })
  g.set(10, 7, {
    color: 'orange'
  })
  g.set(10, 8, {
    color: 'red'
  })
  g.set(19, 4, {
    color: 'red'
  })

  g.set(20, 13, {
    color: 'blue'
  })
  g.set(19, 13, {
    color: 'blue'
  })
  g.set(18, 13, {
    color: 'blue'
  })
  g.set(17, 13, {
    color: 'blue'
  })
  g.set(16, 13, {
    color: 'blue'
  })
  g.set(15, 13, {
    color: 'blue'
  })
  g.set(14, 13, {
    color: 'blue'
  })
  g.set(13, 13, {
    color: 'blue'
  })
  g.set(12, 13, {
    color: 'blue'
  })
  g.set(11, 13, {
    color: 'blue'
  })
  g.set(10, 13, {
    color: 'blue'
  })
  g.set(9, 13, {
    color: 'blue'
  })
  g.draw()


  let move = 0.1


  let step = function step() {
    if (g._viewpoint.x >= 18) {
      move = -0.1
    }

    if (g._viewpoint.x <= 1) {
      move = 0.1
    }

    g.setViewpoint({
      x: g._viewpoint.x + move
    })
  }


  let drawStep = function drawStep() {
    g.draw()
    raf(drawStep)
  }

  drawStep()

  let inter = setInterval(step, 10)

  let running = true
  document.getElementById('toggle').addEventListener('click', function() {
    if (running) {
      window.clearInterval(inter)
      running = false
    } else {
      inter = setInterval(step, 10)
      running = true
    }
  })
}
