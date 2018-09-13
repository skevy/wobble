import { Spring } from "../../dist/module"


const COUNT = 50
const squares = []

const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')

canvas.style.width = canvas.style.height = '100%'
document.body.appendChild(canvas)
resizeCanvasToDisplaySize(canvas)


class Square {
  constructor(i) {
    this.i = i
    this.x = Math.random() * canvas.width
    this.y = Math.random() * canvas.height
    this.color = '#'+Math.random().toString(16).substr(2,6)
    this.springs = {
      x: new Spring({fromValue: this.x, raf: false}), // x
      y: new Spring({fromValue: this.y, raf: false})  // y
    }
    this.springs.x.onUpdate(s => this.x = s.currentValue)
    this.springs.y.onUpdate(s => this.y = s.currentValue)
  }
  setPosition(x, y) {
    this.springs.x.setValue(x);
    this.springs.y.setValue(y);
  }
  tick(now) {
    this.springs.x._advanceSpringToTime(now, true)
    this.springs.y._advanceSpringToTime(now, true)
    //this.springs.x._step()
    //this.springs.x._step()
  }
}

function resizeCanvasToDisplaySize(canvas) {
  let w = (canvas.clientWidth*devicePixelRatio) | 0
  let h = (canvas.clientHeight*devicePixelRatio) | 0
  if (canvas.width != w || canvas.height != h) {
    canvas.width = w
    canvas.height = h
  }
}

function draw() {
  const now = Date.now()
  resizeCanvasToDisplaySize(canvas)
  const width = canvas.width
  const height = canvas.height
  ctx.clearRect(0, 0, width, height)
  for(var i = 0; i < squares.length; i++) {
    const square = squares[i]
    square.tick(now)
    ctx.fillStyle = square.color
    ctx.fillRect(square.x, square.y, 50, 50)
  }
  requestAnimationFrame(draw)
}

setInterval(() => {
  randomize()
}, 100)

function randomize() {
  squares[Math.floor(squares.length*Math.random())]
    .setPosition(Math.random() * canvas.width, Math.random() * canvas.height)
}

for(var i = 0; i < COUNT; i++) {
  squares.push(new Square(i))
}

draw()

window.randomize = randomize
