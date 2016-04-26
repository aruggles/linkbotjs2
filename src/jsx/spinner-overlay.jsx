"use strict";

// Required Modules.
var React = require('react');
var Events = require('../js/events.js');
var uiEvents = Events.uiEvents;

var SpinnerOverlay = React.createClass({
    componentWillMount: function() {
        var me = this;
        uiEvents.on(uiEvents.eventType.SHOW_FULL_SPINNER, function() {
            me.setState({
                show: true
            });
        });
        uiEvents.on(uiEvents.eventType.HIDE_FULL_SPINNER, function() {
            me.setState({
                show: false
            });
        });
    },
    handleClick: function(e) {
        e.stopPropagation();
    },
    // Set the initial state synchronously
    getInitialState: function() {
        return {
            show: false
        };
    },
    render: function() {
        var divStyle = {display:'none'};
        if (this.state.show) {
            divStyle = {display:'block'};
        }
        return (
            <div>
                <div id="ljs-overlay-full" style={divStyle} ref="overlay" onClick={this.handleClick}>
                    <div id="ljs-overlay-spinner"></div>
                </div>
            </div>
        );

    }
});

module.exports = SpinnerOverlay;