"use strict";

// Required Modules.
var React = require('react');
var Events = require('../js/events.js');
var uiEvents = Events.uiEvents;

var HelpDialog = React.createClass({
    componentWillMount: function() {
        var me = this;

        uiEvents.on(uiEvents.eventType.SHOW_HELP, function() {
            me.setState({
                show: true
            });
        });
        uiEvents.on(uiEvents.eventType.HIDE_HELP, function() {
            me.setState({
                show: false
            });
        });
    },
    handleFirmware: function(e) {
        e.stopPropagation();
        this.setState({
            show: false
        });
        uiEvents.trigger(uiEvents.eventType.SHOW_FULL_SPINNER);
        setTimeout(function() {
            // TODO add ability to start firmware updater.
            //linkbotLib.startFirmwareUpdate();
            uiEvents.trigger(uiEvents.eventType.HIDE_FULL_SPINNER);
        }, 500);
    },
    handleClick: function(e) {
        e.stopPropagation();
    },
    close: function(e) {
        this.setState({
            show: false
        });
    },
    // Set the initial state synchronously
    getInitialState: function() {
        return {
            show: false
        };
    },
    render: function() {
        var divStyle = {display:'none'};
        var clzz = "ljs-modal ljs-fade";
        if (this.state.show) {
            divStyle = {display:'block'};
            clzz = "ljs-modal ljs-fade ljs-in";
        }
        return (
            <div>
                <div id="ljs-error-console" style={divStyle} className={clzz} ref="overlay" onClick={this.handleClick}>
                    <div className="ljs-modal-dialog">
                        <div className="ljs-modal-content">
                            <div className="ljs-modal-header">
                                <h4 className="ljs-modal-title">Help</h4>
                            </div>
                            <div className="ljs-modal-body">
                                <ul>
                                    <li><a href="http://wiki.linkbotlabs.com/wiki/Troubleshooting">FAQ / Wiki</a></li>
                                    <li><a href="http://www.barobo.com/forums/forum/troubleshootinghelp/">Help / Forums</a></li>
                                    <li><a href="https://docs.google.com/forms/d/1rnqRu8XBHxDqLS257afRNH8nUycVUAbLaD7iOP4EyMg/viewform?usp=send_form">Bug Report</a></li>
                                    <li><a href="javascript:;" onClick={this.handleFirmware}>Start Firmware Updater</a></li>
                                    <li><a href="http://dev.linkbotlabs.com">Linkbot Labs Development Site</a></li>
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
module.exports = HelpDialog;