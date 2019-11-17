import * as React from 'react';
import './App.css';

let _intervalID: number;
let _idCounter = 0;

interface AppState {
  agents: Array<Agent>;
  running: boolean;
}

interface AppProps {
  width: number;
  height: number;
}

class App extends React.Component<AppProps, AppState> {
  inputAgents: HTMLInputElement | null;
  buttonPlay: HTMLButtonElement | null;

  agentsCount: number = 400;
  step: number = 3;
  radius: number = 4;
  stickyness: number = 1.0;
  speed: number = 50;
  agentType: string = 'particle';

  constructor() {
    super();

    this.state = {
      agents: [],
      running: false
    };
  }

  componentDidMount() {
    this.setState({ agents: this.initAgents() });
  }

  initAgents(): Array<Agent> {
    let p = this.props;
    let agents: Array<Agent> = [];
    let diameter = (this.radius * 2);

    for (let i = 0; i < this.agentsCount; i++) {
      let x = Math.random() * p.width + diameter;
      let y = Math.random() * p.height + diameter;

      x = x > p.width ? x - (diameter * 2) : x;
      y = y > p.height ? y - (diameter * 2) : y;

      agents.push(new Agent(new Point(x, y, this.radius), this.agentType));
    }

    return agents;
  }

  act() {
    let agents = this.state.agents;
    let newAgents: Array<Agent> = [];
    let p = this.props;
    let checkCoallision = Math.random() < this.stickyness;

    for (let k = 0; k < this.speed; k++) {
      for (let i = 0; i < agents.length; i++) {
        let a = agents[i];
  
        if (!a.isEmpty()) {
          a.act(p.width, p.height, this.step);
          if (k === this.speed - 1) { newAgents.push(a); }
          
          if (checkCoallision) {
            for (let j = i + 1; j < agents.length; j++) {
              let b = agents[j];
              if (a.collides(b)) {
                a.merge(b);
              }
            }
          }
        }
      }
    }

    this.setState({ agents: newAgents });
  }

  onStartPauseClicked() {
    let running = !this.state.running;
    if (running) {
      _intervalID = window.setInterval(() => this.act(), 100);
    } else {
      window.clearInterval(_intervalID);
    }
    this.setState({ running: running });
  }

  onRefreshClicked() {
    this.setState({
      agents: this.initAgents()
    });
  }

  onSimulationTypeChanged(e: React.ChangeEvent<HTMLSelectElement>) {
    this.agentType = (e.target as HTMLSelectElement).value;
    this.setState({
      agents: this.initAgents()
    });
  }

  onAgentsChanged(e: React.ChangeEvent<HTMLInputElement>) {
    this.agentsCount = +(e.target as HTMLInputElement).value;
  }

  onSpeedChanged(e: React.ChangeEvent<HTMLInputElement>) {
    this.speed = +(e.target as HTMLInputElement).value;
  }

  onStepChanged(e: React.ChangeEvent<HTMLInputElement>) {
    this.step = +(e.target as HTMLInputElement).value;
  }

  onRadiusChanged(e: React.ChangeEvent<HTMLInputElement>) {
    this.radius = +(e.target as HTMLInputElement).value;
  }

  onStickynessChanged(e: React.ChangeEvent<HTMLInputElement>) {
    this.stickyness = +(e.target as HTMLInputElement).value;
  }

  render() {
    let playButtonText = this.state.running ? 'Pause' : 'Play';
    let agents = this.state.agents;
    let agentElems: Array<JSX.Element> = new Array();

    for (let i = 0; i < agents.length; i++) {
      let a = agents[i];
      agentElems[i] = a.toJSX();
    }

    return (
      <div className="App">
        <div className="App-header container">
          <div className="row">
            <div className="col-lg-2">
              <select className="browser-default custom-select mb-3" onChange={e => this.onSimulationTypeChanged(e)}>
                <option value="particle">Particles</option>
                <option value="droplet">Droplets</option>
              </select>

              <div className="input-group input-group-sm mb-3">
                <div className="input-group-prepend">
                  <span className="input-group-text" id="inputGroup-sizing-sm">Agents</span>
                </div>
                <input ref={i => this.inputAgents = i} type="number" className="form-control" defaultValue={this.agentsCount + ''} onChange={e => this.onAgentsChanged(e)}/>
              </div>
              <div className="input-group input-group-sm mb-3">
                <div className="input-group-prepend">
                  <span className="input-group-text" id="inputGroup-sizing-sm">Radius</span>
                </div>
                <input type="number" className="form-control" min="2" max="20" defaultValue={this.radius + ''} onChange={e => this.onRadiusChanged(e)} />
              </div>

              <div className="btn-group form-group">
                <button type="button" className="btn btn-secondary" onClick={_ => this.onRefreshClicked()}>
                  Refresh
                </button>
                <button type="button" ref={b => this.buttonPlay = b} className="btn btn-info" onClick={_ => this.onStartPauseClicked()}>
                  {playButtonText}
                </button>
              </div>
              
              <div className="input-group input-group-sm mb-3">
                <div className="input-group-prepend">
                  <span className="input-group-text" id="inputGroup-sizing-sm">Step</span>
                </div>
                <input type="number" className="form-control" min="1" max="100" defaultValue={this.step + ''} onChange={e => this.onStepChanged(e)} />
              </div>
              <div className="input-group input-group-sm mb-3">
                <div className="input-group-prepend">
                  <span className="input-group-text" id="inputGroup-sizing-sm">Speed</span>
                </div>
                <input type="number" className="form-control" min="1" max="100" step="1" defaultValue={this.speed + ''} onChange={e => this.onSpeedChanged(e)} />
              </div>
              <div className="input-group input-group-sm mb-3">
                <div className="input-group-prepend">
                  <span className="input-group-text" id="inputGroup-sizing-sm">Stickyness</span>
                </div>
                <input type="number" className="form-control" min="0" max="1" step="0.1" defaultValue={this.stickyness + ''} onChange={e => this.onStickynessChanged(e)} />
              </div>
            </div>

            <div className="col-lg-10">
              <svg width={this.props.width} height={this.props.height}>{agentElems}</svg>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default App;

class Agent {
  id: number;
  agentType: string;
  body: Point;
  bodies: Array<Point>;
  minxy: Point;
  maxxy: Point;
  moveWait: number;
  stickWait: number;

  constructor(p: Point, typ: string) {
    this.body = p;
    this.bodies = new Array();
    this.bodies.push(p);
    this.id = _idCounter++;
    this.minxy = p.clone();
    this.maxxy = p.clone();
    this.moveWait = 0;
    this.stickWait = 1;
    this.agentType = typ;
  }

  act(width: number, height: number, step: number) {
    if (this.agentType === 'particle') {
      this.moveWait++;

      if (!this.isEmpty() && this.moveWait >= this.bodies.length) {
        this.moveWait = 0;
        let self = this;
        let angle = Math.random();
        let minxy = self.minxy.clone();
        let maxxy = self.maxxy.clone();
        minxy.move(angle, step);
        maxxy.move(angle, step);

        if (minxy.x < 0
          || maxxy.x > width
          || minxy.y < 0
          || maxxy.y > height
        ) {
          angle += 0.5;
          if (angle > 1) { angle -= 1; }
        }

        for (var i = 0; i < this.bodies.length; i++) {
          var p = this.bodies[i];
          p.move(angle, step);
          self.minxy.x = Math.min(self.minxy.x, p.x);
          self.minxy.y = Math.min(self.minxy.y, p.y);
          self.maxxy.x = Math.max(self.maxxy.x, p.x);
          self.maxxy.y = Math.max(self.maxxy.y, p.y);
        }
      }
    } else {
      this.moveWait += 2;

      if (!this.isEmpty() && this.moveWait >= this.body.radius) {
        this.moveWait = 0;
        let angle = Math.random();
        let b = this.body;
        b.move(angle, step);
        if (b.x < 0 || b.x > width || b.y < 0 || b.y > height ) {
          angle += 0.5;
          if (angle > 1) { angle -= 1; }
          b.move(angle, step);
        }
      }
    } 
  }

  isWaiting(): boolean {
    return this.moveWait < this.bodies.length;
  }

  merge(other: Agent) {
    if (this.agentType === 'particle') {
      while (other.bodies.length > 0) {
        this.bodies.push(other.bodies.pop() as Point);
      }
    } else {
      this.body.radius += other.body.radius * .5;
      other.body.radius = 0;
    }
  }

  collides(other: Agent): boolean {
    if (this.agentType === 'particle') {
      for (let i = 0; i < this.bodies.length; i++) {
        let a = this.bodies[i];
        for (let j = 0; j < other.bodies.length; j++) {
          let b = other.bodies[j];
          if (a.distance(b) <= a.radius + b.radius) {
            return true;
          }
        }
      }
    } else {
      let a = this.body;
      let b = other.body;
      return a.distance(b) <= a.radius + b.radius;
    }
    return false;
  }

  isEmpty(): boolean {
    if (this.agentType === 'particle') { 
      return this.bodies.length <= 0; 
    } else {
      return this.body.radius === 0;
    }
  }

  isSticky(stickyness: number): boolean {
    this.stickWait++;
    let stick = this.stickWait >= (1 / stickyness);
    if (stick) { this.stickWait = 0; }
    return stick;
  }

  center(): Point {
    return new Point(
      this.maxxy.x - this.minxy.x,
      this.maxxy.y - this.minxy.y, 0);
  }

  toJSX(): JSX.Element {
    if (this.agentType === 'particle') {
      let circles: Array<JSX.Element> = new Array();
      for (let j = 0; j < this.bodies.length; j++) {
        let b = this.bodies[j];
        circles[j] = <circle ref={e => b.elem = e} key={j} className="agent" cx={b.x} cy={b.y} r={b.radius} />;
      }
      return <g>{circles}</g>;
    } else {
      let b = this.body;
      return <circle ref={e => b.elem = e} key={this.id} className="agent" cx={b.x} cy={b.y} r={b.radius} />;
    }
  }
}

class Point {
  x: number;
  y: number;
  radius: number;
  elem: SVGCircleElement | null;

  constructor(x: number, y: number, radius: number) {
    this.x = x;
    this.y = y;
    this.radius = radius;
  }

  clone(): Point {
    return new Point(this.x, this.y, this.radius);
  }

  move(angle: number, step: number) {
    let rotation = Math.PI * 2 * angle;
    let x = this.x + step * Math.cos(rotation);
    let y = this.y + step * Math.sin(rotation);
    this.moveTo(x, y);
  }

  moveTo(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  distance(p: Point): number {
    let dx = Math.pow(this.x - p.x, 2);
    let dy = Math.pow(this.y - p.y, 2);
    return Math.sqrt(dx + dy);
  }

  angle(b: Point, c: Point): number {
    let a = this;
    let ab = a.distance(b);
    let ac = a.distance(c);
    let bc = b.distance(c);
    return Math.acos((ab * ab + ac * ac - bc * bc) / (2 * ab * ac));
  }

  moveAwayFrom(p: Point) {
    // let dx = p.x - this.x;
    // let dy = p.y - this.y;
    // let mag = Math.sqrt( Math.pow(dx, 2) + Math.pow(dy, 2));
    // let x = this.x - dx * _step / mag
    // let y = this.y - dy * _step / mag
    // this.moveTo(x, y)
  }
}