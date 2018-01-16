import * as React from "react";
import * as ReactDOM from "react-dom";

import { Spring } from "wobble";

// @ts-ignore
import * as images from "./*.jpg";

const INITIAL_X = 250;
const INITIAL_Y = 300;

interface IBall {
  x: number;
  y: number;
}

interface IBallSpring {
  x: Spring;
  y: Spring;
}

class ChatHeads extends React.Component {
  public balls: IBall[] = Array(6)
    .fill([])
    .map(() => ({ x: INITIAL_X, y: INITIAL_Y }));

  public springs: IBallSpring[] = [];

  public componentDidMount() {
    window.addEventListener("mousemove", this.handleMouseMove);
    window.addEventListener("touchmove", this.handleTouchMove);
    this.createFollowerSprings();
    this.springs[0].x.start();
    this.springs[0].y.start();
  }

  public render() {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          background: "#EEE"
        }}
      >
        {this.balls.map(({ x, y }, i) => (
          <div
            key={i}
            style={{
              borderRadius: 99,
              backgroundColor: "white",
              width: 50,
              height: 50,
              border: "3px solid white",
              position: "absolute",
              backgroundSize: 50,
              backgroundImage: `url('${images[i]}')`,
              transform: `translate3d(${x - 25}px, ${y - 25}px, 0)`,
              zIndex: this.balls.length - i
            }}
          />
        ))}
      </div>
    );
  }

  public createFollowerSprings() {
    const springConfig = {
      stiffness: 120,
      damping: 14,
      mass: 1
    };
    // Follower springs
    for (let i = 0; i < this.balls.length - 1; i++) {
      const x = new Spring({
        ...springConfig,
        fromValue: 0,
        toValue: INITIAL_X
      }).onUpdate(s => this.onSpringUpdate(i, "x", s));
      const y = new Spring({
        ...springConfig,
        fromValue: 0,
        toValue: INITIAL_Y
      }).onUpdate(s => this.onSpringUpdate(i, "y", s));
      this.springs.push({ x, y });
    }
  }

  public onSpringUpdate = (i: number, dim: "x" | "y", s: Spring) => {
    const val = s.currentValue;
    this.balls[i + 1][dim] = val;
    if (i < this.balls.length - 2) {
      this.springs[i + 1][dim]
        .updateConfig({
          toValue: val
        })
        .start();
    }
    this.forceUpdate();
  };

  public handleMouseMove = ({
    pageX: x,
    pageY: y
  }: {
    pageX: number;
    pageY: number;
  }) => {
    this.balls[0].x = x;
    this.balls[0].y = y;
    this.springs[0].x
      .updateConfig({
        toValue: x
      })
      .start();
    this.springs[0].y
      .updateConfig({
        toValue: y
      })
      .start();
  };

  public handleTouchMove = ({ touches }: TouchEvent) => {
    this.handleMouseMove(touches[0]);
  };
}

ReactDOM.render(<ChatHeads />, document.getElementById("app"));
