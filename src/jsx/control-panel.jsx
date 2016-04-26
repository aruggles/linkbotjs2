"use strict";

// Required Modules.
var React = require('react');
var Events = require('../js/events.js');
var Widgets = require('./widgets.jsx');
var SliderWidget = Widgets.SliderWidget;
var KnobWidget = Widgets.KnobWidget;
var uiEvents = Events.uiEvents;
var robotEvents = Events.robotEvents;

var direction = [0, 0, 0];
var secondMotor = 2;
var knob1Timer = null;
var knob2Timer = null;
var syncKnobsWithMotors = false;

var ControlPanel = React.createClass({
    // Set the initial state synchronously
    getInitialState: function() {
        return {
            linkbot: null,
            title: 'NONE',
            m1Value: 50,
            m2Value: 50,
            freq: 440,
            wheel1: 0,
            wheel2: 0,
            x: 0.0,
            y: 0.0,
            z: 0.0,
            mag: 0.0
        };
    },
    componentWillMount: function() {
        var me = this;
        uiEvents.on(uiEvents.eventType.HIDE, function() {
            me.hideControlPanel();
        });
        uiEvents.on(uiEvents.eventType.HIDE_CONTROL_PANEL, function() {
            me.hideControlPanel();
        });
        uiEvents.on(uiEvents.eventType.SHOW_CONTROL_PANEL, function(linkbot) {
            me.showControlPanel(linkbot);
        });
    },
    componentDidUpdate: function() {

    },
    componentDidMount: function() {

        this.refs.overlay.style.display = 'none';
        this.refs.controlPanel.style.display = 'none';
    },
    hideControlPanel: function() {
        this.refs.overlay.style.display = 'none';
        this.refs.controlPanel.style.display = 'none';
        if (this.state.linkbot != null) {
            // Clean up here.
            this.state.linkbot.stop();
            this.state.linkbot.unregister(false);
        }
        this.setState({
            linkbot:null,
            title:'NONE',
            m1Value: this.state.m1Value,
            m2Value: this.state.m2Value,
            wheel1: this.state.wheel1,
            wheel2: this.state.wheel2,
            freq: this.state.freq,
            x: this.state.x,
            y: this.state.y,
            z: this.state.z,
            mag: this.state.mag
        });
    },
    showControlPanel: function(linkbot) {
        var me = this;
        if (this.state.linkbot !== null) {
            // Clean up here.
            this.state.linkbot.stop();
            // TODO blind call to unregister.  We should limit it to the handlers we registered.
            this.state.linkbot.unregister();
        }

        if (linkbot.status === "offline" || linkbot.status === "update") {
            uiEvents.trigger(uiEvents.eventType.HIDE_CONTROL_PANEL);
            return;
        }

        this.refs.overlay.style.display = 'block';
        this.refs.controlPanel.style.display = 'block';
        if (window.innerHeight <= 675) {
            this.refs.controlPanel.style.top = document.body.scrollTop + "px";
        } else if (document.body.scrollTop > 75) {
            this.refs.controlPanel.style.top = document.body.scrollTop + "px";
        } else {
            this.refs.controlPanel.style.top = 75 + "px";
        }
        direction = [0, 0, 0];
        secondMotor = 2;
        linkbot.getFormFactor().then(function(data) {
            if (linkbot.enums.FormFactor.I == data) {
                secondMotor = 2;
            } else if (linkbot.enums.FormFactor.L == data) {
                secondMotor = 1;
            }
        });

        this.setState({
            linkbot:linkbot,
            title:linkbot.id,
            m1Value: 50,
            m2Value: 50,
            wheel1: me.state.wheel1,
            wheel2: me.state.wheel2,
            freq: 440,
            x: 0.0,
            y: 0.0,
            z: 0.0,
            mag: 0.0
        }, function() {
            var linkbot = me.state.linkbot;
            linkbot.on('encoderEvent', function(encoder, angle) {
                if (encoder == 0) {
                    me.refs.knobJoint1.setMotorValue(encoder);
                    if (syncKnobsWithMotors) {
                        me.refs.knobJoint1.setValue(angle, false);
                    }
                } else if (encoder == 1) {
                    me.refs.knobJoint2.setMotorValue(angle);
                    if (syncKnobsWithMotors) {
                        me.refs.knobJoint2.setValue(angle, false);
                    }
                } else if (encoder == 3) {
                    me.refs.knobJoint2.setMotorValue(angle);
                    if (syncKnobsWithMotors) {
                        me.refs.knobJoint2.setValue(angle, false);
                    }
                }
            });
            linkbot.on('accelerometerEvent', function(x, y, z) {
                me.refs.xAxis.setValue(x);
                me.refs.yAxis.setValue(y);
                me.refs.zAxis.setValue(z);
                var mag = Math.sqrt((x * x)  + (y * y) + (z * z));
                me.refs.mag.setValue(mag);
                me.setState({
                    linkbot:me.state.linkbot,
                    title:me.state.title,
                    m1Value: me.state.m1Value,
                    m2Value: me.state.m2Value,
                    wheel1: me.state.wheel1,
                    wheel2: me.state.wheel2,
                    freq: me.state.freq,
                    x: x.toFixed(4),
                    y: y.toFixed(4),
                    z: z.toFixed(4),
                    mag: mag.toFixed(4)
                });
            });
            me.refs.buzzerFrequency.setValue(440);
            me.refs.speedJoint1.setValue(50);
            me.refs.speedJoint2.setValue(50);
        });
        linkbot.getSpeeds().then(function(data) {
            var d1 = Math.round(data[0]);
            var d2 = Math.round(data[secondMotor]);
            me.setState({
                linkbot:me.state.linkbot,
                title:me.state.title,
                m1Value: d1,
                m2Value: d2,
                wheel1: me.state.wheel1,
                wheel2: me.state.wheel2,
                freq: me.state.freq,
                x: me.state.x,
                y: me.state.y,
                z: me.state.z,
                mag: me.state.mag
            });
            me.refs.speedJoint1.setValue(d1);
            me.refs.speedJoint2.setValue(d2);
        });
    },
    knob1Changed: function(data) {
        syncKnobsWithMotors = false;
        var me = this;
        if (data.value > data.motorValue) {
            if (direction[0] !== 1) {
                this.state.linkbot.moveJointContinuous(0, 1);
                direction[0] = 1;
            }
        } else if (data.value < data.motorValue) {
            if (direction[0] !== -1) {
                this.state.linkbot.moveJointContinuous(0, -1);
                direction[0] = -1;
            }
        } else {
            if (direction[0] !== 0) {
                this.state.linkbot.moveJointContinuous(0, 0);
                direction[0] = 0;
            }
        }
        clearTimeout(knob1Timer);
        knob1Timer = setInterval(function() {
            me.state.linkbot.moveToOneMotor(0, me.refs.knobJoint1.getValue().value);
            direction[0] = 0;
        }, 100);
    },
    knob1MouseUp: function(data) {
        clearTimeout(knob1Timer);
        this.state.linkbot.moveToOneMotor(0, data.value);
        direction[0] = 0;
    },
    knob2Changed: function(data) {
        syncKnobsWithMotors = false;
        var me = this;
        if (data.value > data.motorValue) {
            if (direction[secondMotor] !== 1) {
                this.state.linkbot.moveJointContinuous(secondMotor, 1);
                direction[secondMotor] = 1;
            }
        } else if (data.value < data.motorValue) {
            if (direction[secondMotor] !== -1) {
                this.state.linkbot.moveJointContinuous(secondMotor, -1);
                direction[secondMotor] = -1;
            }
        } else {
            if (direction[secondMotor] !== 0) {
                this.state.linkbot.moveJointContinuous(secondMotor, 0);
                direction[secondMotor] = 0;
            }
        }
        clearTimeout(knob2Timer);
        knob2Timer = setInterval(function() {
            me.state.linkbot.moveToOneMotor(secondMotor, me.refs.knobJoint2.getValue().value);
            direction[secondMotor] = 0;
        }, 100);
    },
    knob2MouseUp: function(data) {
        clearTimeout(knob2Timer);
        this.state.linkbot.moveToOneMotor(secondMotor, data.value);
        direction[secondMotor] = 0;
    },
    motor1Up: function() {
        syncKnobsWithMotors = true;
        this.state.linkbot.moveJointContinuous(0, 1);
        direction[0] = 1;
    },
    motor1Stop: function() {
        syncKnobsWithMotors = true;
        this.state.linkbot.moveJointContinuous(0, 0);
        direction[0] = 0;
    },
    motor1Down: function() {
        syncKnobsWithMotors = true;
        this.state.linkbot.moveJointContinuous(0, -1);
        direction[0] = -1;
    },
    motor2Up: function() {
        syncKnobsWithMotors = true;
        this.state.linkbot.moveJointContinuous(secondMotor, 1);
        direction[secondMotor] = 1;
    },
    motor2Stop: function() {
        syncKnobsWithMotors = true;
        this.state.linkbot.moveJointContinuous(secondMotor, 0);
        direction[secondMotor] = 0;
    },
    motor2Down: function() {
        syncKnobsWithMotors = true;
        this.state.linkbot.moveJointContinuous(secondMotor, -1);
        direction[secondMotor] = -1;
    },
    motor1SpeedInput: function (e) {
        this.setState({
            linkbot:this.state.linkbot,
            title:this.state.title,
            m1Value: event.target.value,
            m2Value: this.state.m2Value,
            wheel1: this.state.wheel1,
            wheel2: this.state.wheel2,
            freq: this.state.freq,
            x: this.state.x,
            y: this.state.y,
            z: this.state.z,
            mag: this.state.mag
        });
        if (isNaN(parseInt(event.target.value))) {
            return;
        }
        if (event.target.value > 200 || event.target.value < 1) {
            return;
        }
        this.motor1Speed(event.target.value);
        this.refs.speedJoint1.setValue(event.target.value, false);
    },
    motor1Speed: function(value) {
        this.setState({
            linkbot:this.state.linkbot,
            title:this.state.title,
            m1Value: value,
            m2Value: this.state.m2Value,
            wheel1: this.state.wheel1,
            wheel2: this.state.wheel2,
            freq: this.state.freq,
            x: this.state.x,
            y: this.state.y,
            z: this.state.z,
            mag: this.state.mag
        });
        this.state.linkbot.speeds(value, this.state.m2Value, this.state.m2Value, 7);
    },
    motor2SpeedInput: function (e) {
        this.setState({
            linkbot:this.state.linkbot,
            title:this.state.title,
            m1Value: this.state.m2Value,
            m2Value: event.target.value,
            wheel1: this.state.wheel1,
            wheel2: this.state.wheel2,
            freq: this.state.freq,
            x: this.state.x,
            y: this.state.y,
            z: this.state.z,
            mag: this.state.mag
        });
        if (isNaN(parseInt(event.target.value))) {
            return;
        }
        if (event.target.value > 200 || event.target.value < 1) {
            return;
        }
        this.motor2Speed(event.target.value);
        this.refs.speedJoint2.setValue(event.target.value, false);
    },
    motor2Speed: function(value) {
        this.setState({
            linkbot:this.state.linkbot,
            title:this.state.title,
            m1Value: this.state.m1Value,
            m2Value: value,
            wheel1: this.state.wheel1,
            wheel2: this.state.wheel2,
            freq: this.state.freq,
            x: this.state.x,
            y: this.state.y,
            z: this.state.z,
            mag: this.state.mag
        });
        this.state.linkbot.speeds(this.state.m1Value, value, value, 7);
    },
    driveForward: function() {
        syncKnobsWithMotors = true;
        this.state.linkbot.moveForward();
        direction = [0, 0, 0];
    },
    driveDown: function() {
        syncKnobsWithMotors = true;
        this.state.linkbot.moveBackward();
        direction = [0, 0, 0];
    },
    driveLeft: function() {
        syncKnobsWithMotors = true;
        this.state.linkbot.moveLeft();
        direction = [0, 0, 0];
    },
    driveRight: function() {
        syncKnobsWithMotors = true;
        this.state.linkbot.moveRight();
        direction = [0, 0, 0];
    },
    driveZero: function() {
        syncKnobsWithMotors = true;
        this.state.linkbot.zero();
        direction = [0, 0, 0];
    },
    driveStop: function() {
        syncKnobsWithMotors = true;
        this.state.linkbot.stop();
        direction = [0, 0, 0];
    },
    frequencyInput: function(e) {
        this.setState({
            linkbot:this.state.linkbot,
            title:this.state.title,
            m1Value: this.state.m1Value,
            m2Value: this.state.m2Value,
            wheel1: this.state.wheel1,
            wheel2: this.state.wheel2,
            freq: event.target.value,
            x: this.state.x,
            y: this.state.y,
            z: this.state.z,
            mag: this.state.mag
        });
        if (isNaN(parseInt(event.target.value))) {
            return;
        }
        if (event.target.value > 1000 || event.target.value < 130) {
            return;
        }
        this.frequencyChanged(event.target.value);
        this.refs.buzzerFrequency.setValue(event.target.value, false);
    },
    frequencyChanged: function(value) {
        this.setState({
            linkbot:this.state.linkbot,
            title:this.state.title,
            m1Value: this.state.m1Value,
            m2Value: this.state.m2Value,
            wheel1: this.state.wheel1,
            wheel2: this.state.wheel2,
            freq: value,
            x: this.state.x,
            y: this.state.y,
            z: this.state.z,
            mag: this.state.mag
        });
    },
    beepButton: function() {
        var me = this;
        me.state.linkbot.setBuzzerFrequency(this.state.freq);
        setTimeout(function() { me.state.linkbot.setBuzzerFrequency(0); }, 250);
    },
    moveButtonPressed: function() {
        syncKnobsWithMotors = true;
        var v1, v2;
        v1 = parseInt(this.refs.knobJoint1.getInputValue());
        v2 = parseInt(this.refs.knobJoint2.getInputValue());
        if (isNaN(v1)) {
            v1 = this.state.wheel1;
        }
        if (isNaN(v2)) {
            v2 = this.state.wheel2;
        }
        this.state.linkbot.speeds(this.state.m1Value, this.state.m2Value, this.state.m2Value, 7);
        this.state.linkbot.moveTo(v1, v2, v2);
        this.refs.knobJoint1.unlock();
        this.refs.knobJoint2.unlock();
    },
    hideAll: function() {
        uiEvents.trigger(uiEvents.eventType.HIDE);
    },
    render: function() {
        return (
            <div>
                <div id="ljs-overlay" ref="overlay" onClick={this.hideAll} />
                <div id="ljs-control-panel" ref="controlPanel">
                    <div className="ljs-control-header">
                        <div className="ljs-control-title">
                            <h1>Linkbot {this.state.title}</h1>
                        </div>
                    </div>
                    <div className="ljs-row">
                        <div className="ljs-control-col">
                            <div className="ljs-control-poster">
                                <div className="ljs-btn-group">
                                    <KnobWidget value={0} ref="knobJoint1" hasChanged={this.knob1Changed} mouseUp={this.knob1MouseUp} mouseClicked={this.knob1MouseUp} />
                                </div>
                                <div className="ljs-btn-group">
                                    <KnobWidget value={0} ref="knobJoint2" hasChanged={this.knob2Changed} mouseUp={this.knob2MouseUp} mouseClicked={this.knob2MouseUp} />
                                </div>
                            </div>
                            <div className="ljs-control-poster">
                                <div className="ljs-btn-group">
                                    <SliderWidget min={1} max={200} width={100} value={50}  ref="speedJoint1" hasChanged={this.motor1Speed} />
                                    <p><input onChange={this.motor1SpeedInput} className="ljs-slider-input" type="number" min="1" max="200" step="1" value={this.state.m1Value} /> deg/sec</p>
                                </div>
                                <div className="ljs-btn-group ljs-second-slider">
                                    <SliderWidget min={1} max={200} width={100} value={50}  ref="speedJoint2" hasChanged={this.motor2Speed} />
                                    <p><input onChange={this.motor2SpeedInput} className="ljs-slider-input" type="number" min="1" max="200" step="1" value={this.state.m2Value} /> deg/sec</p>
                                </div>
                                <div>
                                    <button className="drive-control-btn-lg ljs-btn-zero" onClick={this.moveButtonPressed}>move</button>
                                </div>
                            </div>
                            <div className="ljs-control-poster">
                                <div className="ljs-btn-group">
                                    <button className="ljs-btn-up joint-control-btn" onClick={this.motor1Up}>joint 1 up</button>
                                    <button className="ljs-btn-stop joint-control-btn" onClick={this.motor1Stop}>joint 1 stop</button>
                                    <button className="ljs-btn-down joint-control-btn" onClick={this.motor1Down}>joint 1 down</button>
                                </div>
                                <div className="ljs-btn-group">
                                    <button className="ljs-btn-up joint-control-btn" onClick={this.motor2Up}>joint 2 up</button>
                                    <button className="ljs-btn-stop joint-control-btn" onClick={this.motor2Stop}>joint 2 stop</button>
                                    <button className="ljs-btn-down joint-control-btn" onClick={this.motor2Down}>joint 2 down</button>
                                </div>
                            </div>
                            <div className="ljs-control-poster">
                                <div>
                                    <button className="drive-control-btn-sm ljs-btn-up" onClick={this.driveForward}>up</button>
                                </div>
                                <div>
                                    <button className="drive-control-btn-sm ljs-btn-left" onClick={this.driveLeft}>left</button>
                                    <button className="drive-control-btn-sm ljs-btn-down" onClick={this.driveDown}>down</button>
                                    <button className="drive-control-btn-sm ljs-btn-right" onClick={this.driveRight}>right</button>
                                </div>
                                <div>
                                    <button className="drive-control-btn-lg ljs-btn-zero" onClick={this.driveZero}>zero</button>
                                </div>
                                <div>
                                    <button className="drive-control-btn-lg ljs-btn-stop" onClick={this.driveStop}>stop</button>
                                </div>
                            </div>
                        </div>
                        <div className="ljs-control-col">
                            <div className="ljs-control-poster">
                                <div className="ljs-buzzer">
                                    <input onChange={this.frequencyInput} className="ljs-slider-input" type="number" min="130" max="1000" step="1" value={this.state.freq} />
                                    <span className="ljs-margin-left">hz</span>
                                    <SliderWidget min={130} max={1000} value={440} width={165} ref="buzzerFrequency" hasChanged={this.frequencyChanged} />
                                </div>
                                <div className="ljs-btn-group" onClick={this.beepButton}>
                                    <span className="ljs-beep-btn">beep</span>
                                </div>
                            </div>
                            <div className="ljs-control-poster ljs-vertical-group">
                                <div>
                                    <SliderWidget min={-5} max={5} height={350} ref="xAxis" floatValue={true} vertical={true} enableMouse={false} />
                                    <p>x:<br /><span id="accel-xaxis-value">{this.state.x}</span></p>
                                </div>
                                <div>
                                    <SliderWidget  min={-5} max={5} height={350} ref="yAxis" floatValue={true} vertical={true} enableMouse={false} />
                                    <p>y:<br /><span id="accel-yaxis-value">{this.state.y}</span></p>
                                </div>
                                <div>
                                    <SliderWidget  min={-5} max={5} height={350} ref="zAxis" floatValue={true} vertical={true} enableMouse={false} />
                                    <p>z:<br /><span id="accel-zaxis-value">{this.state.z}</span></p>
                                </div>
                                <div>
                                    <SliderWidget  min={-5} max={5} height={350} ref="mag" floatValue={true} vertical={true} enableMouse={false} />
                                    <p>mag:<br /><span id="accel-mag-value">{this.state.mag}</span></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
});

module.exports = ControlPanel;