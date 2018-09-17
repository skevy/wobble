'use strict'

import { Spring } from "../../dist/module"


class Square {
  constructor(i, x, y) {
    this.i = i
    this.x = x
    this.y = y
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

class Renderer {
  constructor() {

    const COUNT = 1000
    const canvas = document.createElement('canvas')
    const squares = []

    canvas.style.width = canvas.style.height = '100%'
    document.body.appendChild(canvas)
    resizeCanvasToDisplaySize(canvas)

    for(var i = 0; i < COUNT; i++) {
      squares.push(new Square(i, Math.random() * canvas.width, Math.random() * canvas.height))
    }

    this.squares = squares
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')

  }

  draw = () => {
    const now = Date.now()
    const {canvas, squares, ctx} = this

    resizeCanvasToDisplaySize(canvas)

    const {width, height} = canvas

    ctx.clearRect(0, 0, width, height)

    const index = Math.floor(squares.length*Math.random())
    squares[index].setPosition(Math.random() * canvas.width, Math.random() * canvas.height)

    for(var i = 0; i < squares.length; i++) {
      const square = squares[i]
      square.tick(now)
      ctx.fillStyle = square.color
      ctx.fillRect(square.x, square.y, 10, 10)
    }

    requestAnimationFrame(this.draw)
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

const renderer = new Renderer()
renderer.draw()
