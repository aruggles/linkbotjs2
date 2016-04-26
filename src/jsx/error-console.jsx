"use strict";

// Required Modules.
var React = require('react');
var Events = require('../js/events.js');
var uiEvents = Events.uiEvents;

var ErrorConsole = React.createClass({
    componentWillMount: function() {
        var me = this;

        uiEvents.on(uiEvents.eventType.ADD_ERROR, function(error) {
            var errors = me.state.errors.slice();
            errors.unshift(error);
            me.setState({
                show: true,
                errors: errors
            });
        });
        uiEvents.on(uiEvents.eventType.HIDE_CONSOLE, function() {
            me.setState({
                show: false,
                errors: me.state.errors
            });
        });
    },
    handleClick: function(e) {
        e.stopPropagation();
    },
    close: function(e) {
        this.setState({
            show: false,
            errors: this.state.errors
        });
    },
    // Set the initial state synchronously
    getInitialState: function() {
        return {
            show: false,
            errors:[]
        };
    },
    render: function() {
        var divStyle = {display:'none'};
        var clzz = "ljs-modal ljs-fade";
        if (this.state.show) {
            divStyle = {display:'block'};
            clzz = "ljs-modal ljs-fade ljs-in";
        }
        var errorItems = this.state.errors.map(function(error, i) {
            var key = 'error-item' + i;
            return (
                <li data-id={i} key={key}>
                    {error}
                </li>
            );
        });
        return (
            <div>
                <div id="ljs-error-console" style={divStyle} className={clzz} ref="overlay" onClick={this.handleClick}>
                    <div className="ljs-modal-dialog">
                        <div className="ljs-modal-content">
                            <div className="ljs-modal-header">
                                <h4 className="ljs-modal-title">Error Log</h4>
                            </div>
                            <div className="ljs-modal-body">
                                <ul>
                                    {errorItems}
                                </ul>
                            </div>
                            <div className="ljs-modal-footer">
                                <button type="button" className="ljs-btn ljs-primary-btn" onClick={this.close}>Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
});

module.exports = ErrorConsole;