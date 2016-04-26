"use strict";

// Required Modules.
var React = require('react');
var Events = require('../js/events.js');
var util = require('../js/util.js');
var uiEvents = Events.uiEvents;
var robotEvents = Events.robotEvents;
var RobotManager = require('../js/robot-manager.js');

// TODO this should not be a global to the module.
var placeholder = document.createElement("li");
placeholder.className = "placeholder";

var RobotListItem = React.createClass({
    propTypes: {
        linkbot: React.PropTypes.object.isRequired
    },
    componentWillMount: function() {
        var me = this;
        uiEvents.on(uiEvents.eventType.HIDE, function() {
            me.hideMenu();
        }, this.props.linkbot.id);
        uiEvents.on(uiEvents.eventType.HIDE_SLIDER, function(arg) {
            me.hideMenu(arg);
        }, this.props.linkbot.id);
        robotEvents.on(robotEvents.eventType.CHANGED, me.handleLinkbotChanged);
        me.props.linkbot.getHexColor().then(function(value) {
            me.setState({color:'#' + value});
        });
    },
    componentWillUnmount: function() {
        uiEvents.off(uiEvents.eventType.HIDE, function() {}, this.props.linkbot.id);
        uiEvents.off(uiEvents.eventType.HIDE_SLIDER, function() {}, this.props.linkbot.id);
        robotEvents.off(robotEvents.eventType.CHANGED, this.handleLinkbotChanged);
    },
    getInitialState: function() {
        return {
            color: '#606060'
        };
    },
    handleLinkbotChanged: function(id) {
        var me = this;
        if (me.props.linkbot.id === id) {
            me.props.linkbot.getHexColor().then(function (value) {
                me.setState({color: '#' + value});
            });
        }
    },
    hideMenu: function() {
        var args = Array.apply([], arguments);
        if (args.length !== 1 || args[0] !== this.props.linkbot.id) {
            this.refs.slideElement.className = 'ljs-slide-element';
        }
    },
    handleSlide: function(e) {
        e.preventDefault();
        var slider = this.refs.slideElement;
        if (/ljs-slide-open/.test(slider.className)) {
            // Close Slider.
            slider.className = 'ljs-slide-element';
            uiEvents.trigger(uiEvents.eventType.HIDE_CONTROL_PANEL);
        } else {
            // Open Slider.
            uiEvents.trigger(uiEvents.eventType.HIDE_SLIDER, this.props.linkbot.id);
            slider.className = 'ljs-slide-element ljs-slide-open';
            uiEvents.trigger(uiEvents.eventType.SHOW_CONTROL_PANEL, this.props.linkbot);
        }
    },
    handleColorChange: function(e) {
        e.stopPropagation();
        var value = util.hexToRgb(e.target.value);
        this.props.linkbot.color(value.red, value.green, value.blue);
        e.target.blur();
    },
    handleBeep: function(e) {
        var me = this;
        e.stopPropagation();
        if (me.props.linkbot.status == "offline") {
            uiEvents.trigger(uiEvents.eventType.SHOW_FULL_SPINNER);
            me.props.linkbot.connect(util.uri).then(function() {
                uiEvents.trigger(uiEvents.eventType.HIDE_FULL_SPINNER);
            }, function(err) {
                console.log(err);
            });
        } else if (me.props.linkbot.status == "update") {
            uiEvents.trigger(uiEvents.eventType.SHOW_FULL_SPINNER);
            setTimeout(function() {
                // TODO add firmware update.
                //linkbotLib.startFirmwareUpdate();
                uiEvents.trigger(uiEvents.eventType.HIDE_FULL_SPINNER);
            }, 500);
        } else {
            me.props.linkbot.buzzerFrequency(500);
            setTimeout(function () {
                me.props.linkbot.buzzerFrequency(0);
            }, 250);
        }
    },
    handleTrash: function(e) {
        e.stopPropagation();
        RobotManager.removeRobot(this.props.linkbot.id);
        uiEvents.trigger(uiEvents.eventType.HIDE_CONTROL_PANEL);
    },
    render: function() {
        var style = {
            backgroundColor: this.state.color
        };
        var buttonClass = "ljs-beep-btn";
        var buttonName = "beep";
        var statusLbl = this.props.linkbot.status;
        if (this.props.linkbot.status === 'offline') {
            buttonClass = "ljs-connect-btn";
            buttonName = "connect";
        } else if (this.props.linkbot.status === 'update') {
            buttonClass = "ljs-update-btn";
            buttonName = "update";
            if (this.props.linkbot.version && this.props.linkbot.version != null) {
                statusLbl = "offline [" + this.props.linkbot.version.toString() + "]";
            } else {
                statusLbl = "offline";
            }
        }


        return (
            <li {...this.props} style={style}>
                <input type="color" className="ljs-color-btn" onInput={this.handleColorChange} onChange={this.handleColorChange} value={this.state.color} />
                <span className="ljs-color-btn-title">color</span>
                <span className="ljs-remove-btn" onClick={this.handleTrash}>trash</span>
                <div className="ljs-slide-element" ref="slideElement" onClick={this.handleSlide}>
                    <span className="ljs-robot-name">Linkbot {this.props.linkbot.id}</span>
                    <span className={buttonClass} onClick={this.handleBeep}>{buttonName}</span>
                    <br />
                    <span>{statusLbl}</span>

                </div>
            </li>
        );

    }

});

var AddRobotForm = React.createClass({
    handleAddRobot: function(e) {
        e.preventDefault();
        var input = this.refs.robotInput;
        if (input.value && input.value.length == 4) {
            RobotManager.addRobot(input.value);
            input.value = '';
        }
    },
    handleRefresh: function(e) {
        e.preventDefault();
        RobotManager.refresh();
    },
    render:function() {
        return (
            <div id="ljs-add-robot-form">
                <form>
                    <label htmlFor="ljs-add-input" id="ljs-add-input-label" className="sr-only">Linkbot ID</label>
                    <input name="robotId" id="ljs-add-input" type="text" placeholder="Linkbot ID" ref="robotInput" />
                    <button onClick={this.handleAddRobot} className="ljs-btn">Add</button>
                </form>
            </div>
        );
    }

});


var RobotList = React.createClass({
    componentWillMount: function() {
        var me = this;
        robotEvents.on(robotEvents.eventType.ADDED, function() {
            me.setState({robots: RobotManager.getRobots()});
        });
        robotEvents.on(robotEvents.eventType.REMOVED, function() {
            me.setState({robots: RobotManager.getRobots()});
        });
    },
    // Set the initial state synchronously
    getInitialState: function() {
        return {
            robots: RobotManager.getRobots()
        };
    },
    dragStart: function(e) {
        this.dragged = e.currentTarget;
        while (this.dragged.nodeName != 'LI') {
            this.dragged = target.parentNode;
        }
        e.dataTransfer.effectAllowed = 'move';

        // Firefox requires dataTransfer data to be set
        e.dataTransfer.setData("text/html", e.currentTarget);
    },
    dragEnd: function() {
        this.dragged.style.display = "";
        try {
            this.dragged.parentNode.removeChild(placeholder);
        } catch(err) {
            // If not a child of the parent node.
        }

        // Update data
        var from = Number(this.dragged.dataset.id);
        var to = Number(this.over.dataset.id);
        if(from < to) to--;
        if(this.nodePlacement == "after") to++;
        RobotManager.moveRobot(from, to);
    },
    dragOver: function(e) {
        e.preventDefault();
        this.dragged.style.display = "none";
        var target = e.target;
        if (target.nodeName == 'OL') {
            return;
        }
        while (target.nodeName != 'LI') {
            target = target.parentNode;
        }
        if(target.className == "placeholder") return;
        this.over = target;
        // Inside the dragOver method
        var pos = util.getPosition(this.over);
        var relY = e.clientY - pos.y;
        var height = this.over.offsetHeight / 2;
        var parent = target.parentNode;
        if(relY > height) {
            this.nodePlacement = "after";
            parent.insertBefore(placeholder, target.nextElementSibling);
        }
        else if(relY < height) {
            this.nodePlacement = "before";
            parent.insertBefore(placeholder, target);
        }
    },
    render:function() {
        var me = this;
        var robotListItems = this.state.robots.map(function(robot, i) {
            return <RobotListItem data-id={i} key={robot.id} linkbot={robot} draggable="true" onDragEnd={me.dragEnd} onDragStart={me.dragStart} />;
        });
        return (
            <ol onDragOver={this.dragOver}>
                {robotListItems}
            </ol>
        );

    }

});

var RobotManagerMenu = React.createClass({
    handleResize: function() {
        this.refs.container.style.height = '';
        this.refs.container.style.height = (document.body.scrollHeight - 75) + "px";
    },
    onScroll: function() {
        var documentHeight = document.body.scrollHeight - 75;
        var myHeight = this.refs.container.scrollHeight;
        if (documentHeight != myHeight) {
            this.refs.container.style.height = '';
            this.refs.container.style.height = (document.body.scrollHeight - 75) + "px";
        }
    },
    componentWillMount: function() {
        var me = this;
        uiEvents.on(uiEvents.eventType.HIDE, function() {
            me.hideMenu();
        });
        uiEvents.on(uiEvents.eventType.HIDE_MENU, function() {
            me.hideMenu();
        });
        uiEvents.on(uiEvents.eventType.SHOW_MENU, function() {
            me.showMenu();
            RobotManager.refresh();
        });
        uiEvents.on(uiEvents.eventType.SHOW_DONGLE_UPDATE, function(data) {
            // Eventually we can use the data passed in to set the message.
            me.refs.dongleUpdate.className = 'ljs-dongle-firmware';
        });
        uiEvents.on(uiEvents.eventType.HIDE_DONGLE_UPDATE, function() {
            me.refs.dongleUpdate.className = 'ljs-dongle-firmware ljs-hidden';
        });
        window.addEventListener('resize', this.handleResize);
        window.addEventListener('scroll', this.onScroll);
    },
    componentWillUnmount: function() {
        window.removeEventListener('resize', this.handleResize);
        window.removeEventListener('scroll', this.onScroll);
    },
    hideMenu: function() {
        this.refs.slideBtn.className = 'ljs-handlebtn ljs-handlebtn-right';
        this.refs.container.className = '';
        util.removeClass(document.body, 'ljs-body-open');
        //document.body.style.marginLeft = '';
        this.refs.container.style.height = '';
        this.refs.container.style.height = (document.body.scrollHeight - 75) + "px";
    },
    showMenu: function() {
        this.refs.slideBtn.className = 'ljs-handlebtn ljs-handlebtn-left';
        this.refs.container.className = 'ljs-open';
        util.addClass(document.body, 'ljs-body-open');
        //document.body.style.marginLeft = '300px';
        this.refs.container.style.height = '';
        this.refs.container.style.height = (document.body.scrollHeight - 75) + "px";
    },
    handleSlide: function(e) {
        e.preventDefault();
        var btn = this.refs.slideBtn;
        if ( /ljs-handlebtn-left/.test(btn.className) ) {
            // Menu is Open.
            uiEvents.trigger(uiEvents.eventType.HIDE);
        } else {
            // Menu is Closed.
            uiEvents.trigger(uiEvents.eventType.SHOW_MENU);
        }
    },
    handleFirmwareUpdate: function(e) {
        var me = this;
        e.preventDefault();
        uiEvents.trigger(uiEvents.eventType.SHOW_FULL_SPINNER);
        setTimeout(function() {
            // TODO add firmware update.
            //linkbotLib.startFirmwareUpdate();
            uiEvents.trigger(uiEvents.eventType.HIDE_FULL_SPINNER);
            me.refs.dongleUpdate.className = 'ljs-dongle-firmware ljs-hidden';
        }, 500);
    },
    render: function() {
        var style = { height: (document.body.scrollHeight - 75) + "px"};
        return (
            <div id="ljs-left-menu-container" style={style} ref="container">
                <div className="ljs-handle-wrapper">
                    <div className="ljs-handle">
                        <span onClick={this.handleSlide} className="ljs-handlebtn ljs-handlebtn-right" ref="slideBtn"></span>
                    </div>
                </div>
                <div className="ljs-content">
                    <AddRobotForm />
                    <div className="ljs-dongle-firmware ljs-hidden" ref="dongleUpdate">
                        <span className="button" onClick={this.handleFirmwareUpdate}></span>
                        <p>Update Needed</p>
                    </div>
                    <RobotList />
                </div>
            </div>
        );
    }
});

module.exports = RobotManagerMenu;