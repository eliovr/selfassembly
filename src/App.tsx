import * as React from 'react';
import './App.css';

let _step = 3;
let _radius = 7;
let _waitInterval = 50;
let _stickyness = 1.0;

let _width = 1000;
let _height = 600;
let _intervalID: number;
let _idCounter = 0;

interface AppState {
  agents: Array<Agent>;
}

class App extends React.Component <{}, AppState> {
  constructor () {
    super();
    
    this.state = {
      agents: []
    };
  }

  initAgents(agentCount: number): Array<Agent> {
    let agents: Array<Agent> = [];
    let diameter = (_radius * 2);

    for (let i = 0; i < agentCount ; i++) {
      let x = Math.random() * _width + diameter;
      let y = Math.random() * _height + diameter;
      
      x = x > _width ? x - (diameter * 2) : x;
      y = y > _height ? y - (diameter * 2) : y;

      agents.push(new Agent(new Point(x, y)));
    }
    
    return agents;
  }

  act() {
    let agents = this.state.agents;
    let newAgents: Array<Agent> = [];

    for (let i = 0; i < agents.length; i++) {
      let a = agents[i];
      
      if (!a.isEmpty()) {
        a.act();

        for (let j = 0; j < agents.length; j++) {
          let b = agents[j];
          if (a.id !== b.id && a.collides(b)) {
            if (Math.random() < _stickyness) { 
              b.migrateTo(a);
            }
            break;
          }
        }
        
        newAgents.push(a);
      }
    }
    
    this.setState({agents: newAgents});
  }

  onStartPauseClicked() {
    let btn = (this.refs['btn-play'] as HTMLButtonElement);

    if (btn.innerText === 'Play') {
      btn.innerText = 'Pause';

      if (this.state.agents.length <= 0) {
        let count = +(this.refs['agent-count'] as HTMLInputElement).value;
        let agents = this.initAgents(count);
        this.setState({agents: agents});
      }
  
      _intervalID = window.setInterval(this.act.bind(this), _waitInterval);
    } else {
      btn.innerText = 'Play';
      window.clearInterval(_intervalID);
    }
  }

  onRefreshClicked() {
    let btn = (this.refs['btn-play'] as HTMLButtonElement);
    let count = +(this.refs['agent-count'] as HTMLInputElement).value;
    let agents = this.initAgents(count);

    window.clearInterval(_intervalID);
    btn.innerText = 'Play';
    this.setState({
      agents: agents
    });
  }

  onIntervalChanged(e: React.ChangeEvent<HTMLInputElement>) {
    let btn = (this.refs['btn-play'] as HTMLButtonElement);
    _waitInterval = +(e.target as HTMLInputElement).value;

    if (btn.innerText === 'Pause') {
      window.clearInterval(_intervalID);
      _intervalID = window.setInterval(this.act.bind(this), _waitInterval);
    }
  }

  onStepChanged(e: React.ChangeEvent<HTMLInputElement>) {
    _step = +(e.target as HTMLInputElement).value;
  }

  onRadiusChanged(e: React.ChangeEvent<HTMLInputElement>) {
    _radius = +(e.target as HTMLInputElement).value;
  }

  onStickynessChanged(e: React.ChangeEvent<HTMLInputElement>) {
    _stickyness = +(e.target as HTMLInputElement).value;
  }

  render() {
    let agents = this.state.agents.map(function (a: Agent, i: number) {
      return <ReactAgent key={i} agent={a} />;
    });

    return (
      <div className="App">
        <div className="App-header">
          <div className="row">
            <div className="col-lg-3">
              <div className="input-group">
                <span className="input-group-addon">Agents</span>
                <input ref="agent-count" type="number" className="form-control" defaultValue="100" />
                <span className="input-group-btn">
                  <button ref="btn-refresh" type="button" className="btn btn-secondary" onClick={this.onRefreshClicked.bind(this)}>
                    Refresh
                  </button>
                </span>
              </div>
            </div>
            <div className="col-lg-2">
              <div className="input-group">
                <span className="input-group-addon">Radius</span>
                <input type="number" className="form-control" min="2" max="20" defaultValue={_radius + ''} onChange={this.onRadiusChanged} />
              </div>
            </div>
            <div className="col-lg-2">
              <div className="input-group">
                <span className="input-group-addon">Step</span>
                <input type="number" className="form-control" min="1" max="100" defaultValue={_step + ''} onChange={this.onStepChanged} />
              </div>
            </div>
            <div className="col-lg-2">
              <div className="input-group">
                <span className="input-group-addon">Wait</span>
                <input ref="wait-interval" type="number" className="form-control" min="20" max="1000" step="5" defaultValue={_waitInterval + ''} onChange={this.onIntervalChanged.bind(this)} />
              </div>
            </div>
            <div className="col-lg-2">
              <div className="input-group">
                <span className="input-group-addon">Stickyness</span>
                <input type="number" className="form-control" min="0" max="1" step="0.1" defaultValue={_stickyness + ''} onChange={this.onStickynessChanged} />
              </div>
            </div>
            <div className="col-lg-1">
              <div className="btn-group" role="group" aria-label="Basic example">
                <button ref="btn-play" type="button" className="btn btn-info" onClick={this.onStartPauseClicked.bind(this)}>
                  Play
                </button>
                
              </div>
            </div>
          </div>
        </div>
        
        <svg width={_width} height={_height}>{agents}</svg>
      </div>
    );
  }
}

export default App;

interface ReactAgentProps {
  agent: Agent;
}

class ReactAgent extends React.Component <ReactAgentProps, {}> {
  render() {
    var circles: Array<JSX.Element> = new Array();
    this.props.agent.bodies.forEach(function (b: Point, i: number) {
      circles.push(<circle key={i} className="agent" cx={b.x} cy={b.y} r={_radius} />);
    });

    return <g>{circles}</g>;
  }
}

class Agent {
  id: number;
  bodies: Array<Point>;
  minxy: Point;
  maxxy: Point;
  moveWait: number;
  stickWait: number;

  constructor(p: Point) {
    this.bodies = new Array();
    this.bodies.push(p);
    this.id = _idCounter++;
    this.minxy = p.clone();
    this.maxxy = p.clone();
    this.moveWait = 0;
    this.stickWait = 1;
  }

  act() {
    this.moveWait++;

    if (!this.isEmpty() && this.moveWait >= this.bodies.length) {
      let self = this;
      let angle = Math.random();
      let minxy = self.minxy.clone();
      let maxxy = self.maxxy.clone();
      minxy.shift(angle);
      maxxy.shift(angle);

      if (minxy.x < 0 
        || maxxy.x > _width 
        || minxy.y < 0
        || maxxy.y > _height
      ) {
        return;
      }

      for (var i = 0; i < this.bodies.length; i++) {
        var p = this.bodies[i];
        p.shift(angle);
        self.minxy.x = Math.min(self.minxy.x, p.x);
        self.minxy.y = Math.min(self.minxy.y, p.y);
        self.maxxy.x = Math.max(self.maxxy.x, p.x);
        self.maxxy.y = Math.max(self.maxxy.y, p.y);
      }
      
      this.moveWait = 0;
    }
  }

  migrateTo(other: Agent) {
    while (this.bodies.length > 0) {
      other.bodies.push(this.bodies.pop() as Point);
    }
  }

  collides(other: Agent): boolean {
    return this.bodies.some((a: Point) => {
      return other.bodies.some((b: Point) => {
        return a.distance(b) <= _radius * 2;
      });
    });
  }

  isEmpty(): boolean {
    return this.bodies.length <= 0;
  }

  isSticky(): boolean {
    console.log('Sticky!');
    this.stickWait++;
    let stick = this.stickWait >= (1 / _stickyness);
    if (stick) { this.stickWait = 0; }
    return stick;
  }

  center(): Point {
    return new Point(
      this.maxxy.x - this.minxy.x, 
      this.maxxy.y - this.minxy.y);
  }

}

class Point {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  clone(): Point {
    return new Point(this.x, this.y);
  }

  shift(angle: number) {
    let rotation = Math.PI * 2 * angle;
    this.x += _step * Math.cos(rotation);
    this.y += _step * Math.sin(rotation);
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
}