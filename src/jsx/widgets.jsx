"use strict";

// Required Modules.
var React = require('react');

var util = require('../js/util.js');

// Slider Widget
var SliderWidget = React.createClass({
    propTypes: {
        hasChanged: React.PropTypes.func,
        max: React.PropTypes.number,
        min: React.PropTypes.number,
        height: React.PropTypes.number,
        width: React.PropTypes.number,
        value: React.PropTypes.number,
        vertical: React.PropTypes.bool,
        floatValue: React.PropTypes.bool,
        enableMouse: React.PropTypes.bool
    },
    getDefaultProps: function() {
        return {
            min: 0,
            max: 100,
            height: -1,
            width: -1,
            value: 0,
            floatValue: false,
            vertical: false,
            enableMouse: true,
            hasChanged: function() {}
        };
    },
    getInitialState: function() {
        var value = this.props.value;
        if (value < this.props.min) {
            value = this.props.min;
        } else if (value > this.props.max) {
            value = this.props.max;
        }
        return {
            value: value,
            mouseDown: false
        };
    },
    componentDidMount: function() {
        var percent = (this.state.value - this.props.min) / (this.props.max - this.props.min),
            handleElement = this.refs.handle;
        if (this.props.vertical) {
            handleElement.style.top = (100 - Math.round(percent * 100)) + '%';
        } else {
            handleElement.style.left = Math.round(percent * 100) + '%';
        }
    },
    componentDidUpdate: function (props, state) {
        if (this.state.mouseDown && !state.mouseDown) {
            document.addEventListener('mousemove', this.handleMouseMove);
            document.addEventListener('mouseup', this.handleMouseUp);
        } else if (!this.state.mouseDown && state.mouseDown) {
            document.removeEventListener('mousemove', this.handleMouseMove);
            document.removeEventListener('mouseup', this.handleMouseUp);
        }
    },
    setValue: function(val, callChanged) {
        var value, _callChanged;
        if (this.props.floatValue) {
            value = parseFloat(val);
        } else {
            value = parseInt(val);
        }
        if (isNaN(value)) {
            return;
        }
        if (typeof(callChanged) == "undefined") {
            _callChanged = true;
        } else {
            _callChanged = callChanged;
        }
        if (this.state.value !== value) {
            this.setState({value: value, mouseDown: this.state.mouseDown});
            if (_callChanged) {
                this.props.hasChanged(value);
            }
            var percent = (value - this.props.min) / (this.props.max - this.props.min),
                handleElement = this.refs.handle;
            if (this.props.vertical) {
                handleElement.style.top = (100 - Math.round(percent * 100)) + '%';
            } else {
                handleElement.style.left = Math.round(percent * 100) + '%';
            }
        }
    },
    handleMouseDown: function(e) {
        if (this.props.enableMouse) {
            e.preventDefault();
            this.setState({value: this.state.value, mouseDown: true});
        }
    },
    handleMouseUp: function(e) {
        if (this.props.enableMouse) {
            e.preventDefault();
            this.setState({value: this.state.value, mouseDown: false});
        }
    },
    handleMouseMove: function(e) {
        if (this.props.enableMouse) {
            if (this.state.mouseDown) {
                this.handleMouseEvent(e);
            }
        }
    },
    handleMouseEvent: function(e) {
        var x, y, percent, tempValue, position, sliderElement, handleElement;
        if (!this.props.enableMouse) {
            return;
        }
        e.preventDefault();
        x = e.clientX || e.pageX;
        y = e.clientY || e.pageY;
        sliderElement = this.refs.slider;
        handleElement = this.refs.handle;
        position = util.getPosition(sliderElement);
        if (this.props.vertical) {
            percent = (y - position.y) / sliderElement.offsetHeight;
            tempValue = (percent * (this.props.max - this.props.min)) + this.props.min;
            if (tempValue > this.props.max) {
                tempValue = this.props.max;

                handleElement.style.top = '0%';
            } else if (tempValue < this.props.min) {
                tempValue = this.props.min;
                handleElement.style.top = '100%';
            } else {
                handleElement.style.top = (100 - (percent * 100)) + '%';
                if (!this.props.floatValue) {
                    tempValue = Math.round(tempValue);
                }
            }
        } else {
            percent = (x - position.x) / sliderElement.offsetWidth;
            tempValue = (percent * (this.props.max - this.props.min)) + this.props.min;
            if (tempValue > this.props.max) {
                tempValue = this.props.max;
                handleElement.style.left = '100%';
            } else if (tempValue < this.props.min) {
                tempValue = this.props.min;
                handleElement.style.left = '0%';
            } else {
                handleElement.style.left = (percent * 100) + '%';
                if (!this.props.floatValue) {
                    tempValue = Math.round(tempValue);
                }
            }

        }
        if (this.state.value !== tempValue) {
            this.setState({value: tempValue, mouseDown: this.state.mouseDown});
            this.props.hasChanged(tempValue);
        }
    },
    render: function() {
        var style;
        if (this.props.vertical) {
            style = {height:'100%'};
            if (this.props.height > 0) {
                style.height = this.props.height + 'px';
            }
        } else {
            style = {width:'100%'};
            if (this.props.width > 0) {
                style.width = this.props.width + 'px';
            }
        }
        var className = "ljs-slider", classNameHandle="ljs-slider-handle";
        if (this.props.vertical) {
            className = "ljs-vslider";
            classNameHandle="ljs-vslider-handle";
        }
        return (
            <div className={className} style={style} ref="slider"
                 onClick={this.handleMouseEvent}
                 onMouseMove={this.handleMouseMove}
                 onMouseDown={this.handleMouseDown}
                 onMouseUp={this.handleMouseUp}>
                <span className={classNameHandle} ref="handle"></span>
            </div>
        )
    }

});

// Knob Widget
var KnobWidget = React.createClass({
    propTypes: {
        hasChanged: React.PropTypes.func,
        mouseClicked: React.PropTypes.func,
        mouseUp: React.PropTypes.func,
        value: React.PropTypes.number,
        motorValue: React.PropTypes.number
    },
    getDefaultProps: function() {
        return {
            value: 0,
            motorValue: 0,
            hasChanged: function() {},
            mouseUp: function() {},
            mouseClicked: function() {}
        };
    },
    componentDidMount: function() {
        var imgElement = this.refs.knobImg;
        imgElement.style.transform = "rotate(" + this.state.degValue + "deg)";
        imgElement.style.webkitTransform  = "rotate(" + this.state.degValue + "deg)";
    },
    componentDidUpdate: function (props, state) {
        if (this.state.mouseDown && !state.mouseDown) {
            document.addEventListener('mousemove', this.handleMouseMove);
            document.addEventListener('mouseup', this.handleMouseUp);
        } else if (!this.state.mouseDown && state.mouseDown) {
            document.removeEventListener('mousemove', this.handleMouseMove);
            document.removeEventListener('mouseup', this.handleMouseUp);
        }
    },
    getInitialState: function() {
        return {
            value: this.props.value,
            motorValue: 0,
            display: this.props.value + '\xB0',
            degValue: (this.props.value % 360),
            mouseDown: false,
            locked: false,
            changed: false
        };
    },
    unlock: function() {
        this.setState({display:this.state.degValue + '\xB0',
            value:this.state.value,
            motorValue: this.state.motorValue,
            degValue:this.state.degValue,
            mouseDown:this.state.mouseDown,
            locked:false,
            changed:false});
    },
    setMotorValue: function(value) {
        var degValue = parseInt(value), dispDeg = 0, motorElement = null;
        if (isNaN(degValue)) {
            return;
        }
        degValue = degValue % 360;
        while (degValue < 0) {
            degValue = 360 + degValue;
        }
        dispDeg = 360 - degValue;
        motorElement = this.refs.knobGhost;
        motorElement.style.transform = "rotate(" + dispDeg + "deg)";
        motorElement.style.webkitTransform  = "rotate(" + dispDeg + "deg)";
        this.setState({display:this.state.degValue + '\xB0',
            value:this.state.value,
            motorValue: value,
            degValue:this.state.degValue,
            mouseDown:this.state.mouseDown,
            locked:false,
            changed:false});
    },
    setValue: function(value, callChanged) {
        var degValue, val, _callChanged, dispDeg;
        if (this.state.mouseDown) {
            return; // Set Value does not function when the mouse is down.
        }
        degValue = parseInt(value);
        if (isNaN(degValue)) {
            return;
        }
        if (typeof(callChanged) == "undefined") {
            _callChanged = true;
        } else {
            _callChanged = callChanged;
        }
        val = degValue;
        degValue = degValue % 360;
        while (degValue < 0) {
            degValue = 360 + degValue;
        }
        dispDeg = 360 - degValue;
        if (this.state.locked || this.state.changed) {
            this.setState({display:this.state.display,
                value:val, degValue:degValue,
                motorValue: this.state.motorValue,
                mouseDown:this.state.mouseDown,
                locked:this.state.locked,
                changed:this.state.changed});

        } else {
            this.setState({display:degValue + '\xB0',
                value:val, degValue:degValue,
                motorValue: this.state.motorValue,
                mouseDown:this.state.mouseDown,
                locked:this.state.locked,
                changed:this.state.changed});
        }
        var imgElement = this.refs.knobImg;
        imgElement.style.transform = "rotate(" + dispDeg + "deg)";
        imgElement.style.webkitTransform  = "rotate(" + dispDeg + "deg)";
        if (_callChanged) {
            this.props.hasChanged({value: value, degValue: degValue, motorValue: this.state.motorValue});
        }
    },
    getValue: function() {
        return {value: this.state.value, degValue: this.state.degValue, motorValue: this.state.motorValue};
    },
    getInputValue: function() {
        return this.state.display;
    },
    handleInputChange: function(e) {
        e.preventDefault();
        //var inputElement = this.refs.knobInput;
        //this.setValue(inputElement.value);
        if (!this.state.changed) {
            this.setState({
                display: event.target.value,
                value: this.state.value,
                motorValue: this.state.motorValue,
                degValue: this.state.degValue,
                mouseDown: this.state.mouseDown,
                locked: true,
                changed: true
            });
        } else {
            this.setState({display:event.target.value,
                value:this.state.value,
                motorValue: this.state.motorValue,
                degValue:this.state.degValue,
                mouseDown:this.state.mouseDown,
                locked:this.state.locked,
                changed:this.state.changed});
        }
    },
    handleInputClick: function(e) {
        e.preventDefault();
        var inputElement = this.refs.knobInput;
        //inputElement.setSelectionRange(0, inputElement.value.length - 1);
        inputElement.select();

    },
    handleOnFocus: function(e) {
        if (this.state.changed) {
            this.setState({
                display: this.state.display,
                value: this.state.value,
                motorValue: this.state.motorValue,
                degValue: this.state.degValue,
                mouseDown: this.state.mouseDown,
                locked: true,
                changed: this.state.changed
            });
        } else {
            this.setState({
                display: this.state.value,
                value: this.state.value,
                motorValue: this.state.motorValue,
                degValue: this.state.degValue,
                mouseDown: this.state.mouseDown,
                locked: true,
                changed: this.state.changed
            });
        }
    },
    handleOnBlur: function(e) {
        if (!this.state.changed) {
            this.setState({display:this.state.degValue + '\xB0',
                value:this.state.value,
                motorValue: this.state.motorValue,
                degValue:this.state.degValue,
                mouseDown:this.state.mouseDown,
                locked:false,
                changed:this.state.changed});
        } else {
            this.setState({display:this.state.display,
                value:this.state.value,
                motorValue: this.state.motorValue,
                degValue:this.state.degValue,
                mouseDown:this.state.mouseDown,
                locked:this.state.locked,
                changed:this.state.changed});
        }
    },
    handleMouseDown: function(e) {
        if (e.target.tagName == 'INPUT') {
            return;
        }
        e.preventDefault();
        this.setState({display:this.state.degValue+ '\xB0',
            value:this.state.value,
            motorValue: this.state.motorValue,
            degValue:this.state.degValue,
            mouseDown:true,
            locked:this.state.locked,
            changed:this.state.changed});
    },
    handleMouseUp: function(e) {
        if (e.target.tagName == 'INPUT') {
            return;
        }
        e.preventDefault();
        this.setState({display:this.state.degValue + '\xB0',
            value:this.state.value,
            motorValue: this.state.motorValue,
            degValue:this.state.degValue,
            mouseDown:false,
            locked:this.state.locked,
            changed:this.state.changed});
        this.props.mouseUp({event: e, value: this.state.value, degValue: this.state.degValue, motorValue: this.state.motorValue});
    },
    handleMouseMove: function(e) {
        if (this.state.mouseDown) {
            this.handleClick(e);
        }
    },
    handleClick: function(e) {
        var x, y, ydiff, xdiff, deg, position, box, center, originalDeg, pos, neg, wrapper, value, dispDeg;
        if (e.target.tagName == 'INPUT') {
            return;
        }
        e.preventDefault();
        x = e.clientX || e.pageX;
        y = e.clientY || e.pageY;
        originalDeg = this.state.degValue;
        value = this.state.value;
        wrapper = this.refs.wrapper;
        position = util.getPosition(wrapper);
        box = [position.x, position.y, wrapper.offsetWidth, wrapper.offsetHeight];
        center = { x:(box[0] + (box[2] / 2)),
            y:(box[1] + (box[3] / 2))};
        xdiff = center.x - x;
        ydiff = center.y - y;
        deg = ((Math.atan2(ydiff,xdiff) * util.rad2deg) + 270) % 360;
        deg = Math.round(deg);
        dispDeg = deg;
        deg = 360 - deg;
        if (originalDeg >= deg) {
            neg = originalDeg - deg;
            pos = 360 - originalDeg + deg;
        } else {
            pos = deg - originalDeg;
            neg = originalDeg + 360 - deg;
        }
        if (pos <= neg) {
            value += pos;
        } else {
            value -= neg;
        }
        var imgElement = this.refs.knobImg;
        imgElement.style.transform = "rotate(" + dispDeg + "deg)";
        imgElement.style.webkitTransform  = "rotate(" + dispDeg + "deg)";
        if (this.state.locked) {
            var inputElement = this.refs.knobInput;
            inputElement.blur();
        }
        this.setState({display:deg+ '\xB0',
            value:value,
            motorValue: this.state.motorValue,
            degValue:deg,
            mouseDown:this.state.mouseDown,
            locked:false,
            changed:false});
        if (this.state.mouseDown) {
            this.props.hasChanged({value: value, degValue: deg, motorValue: this.state.motorValue});
        } else {
            this.props.mouseClicked({value: value, degValue: deg, motorValue: this.state.motorValue});
        }
    },
    render: function() {
        var inputClass = "ljs-knob";
        if (this.state.changed) {
            inputClass += " ljs-knob-locked";

        }
        return (
            <div {...this.props} className="ljs-knob-container" ref="wrapper"
                                 onClick={this.handleClick}
                                 onMouseMove={this.handleMouseMove}
                                 onMouseDown={this.handleMouseDown}
                                 onMouseUp={this.handleMouseUp}>
                <div className="ljs-knob-ghost" ref="knobGhost"></div>
                <img width="100%" src="" draggable="false" ref="knobImg" />
                <input className={inputClass} value={this.state.display} ref="knobInput"
                       onClick={this.handleInputClick}
                       onChange={this.handleInputChange}
                       onFocus={this.handleOnFocus}
                       onBlur={this.handleOnBlur} />
            </div>
        );
    }
});

// Exports.
module.exports.KnobWidget = KnobWidget;
module.exports.SliderWidget = SliderWidget;