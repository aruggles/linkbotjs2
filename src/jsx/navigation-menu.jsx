"use strict";

// Required Modules.
var React = require('react');
var NavigationManager = require('../js/navigation-manager.js');
var Events = require('../js/events.js');

var NavigationMenu = React.createClass({
    componentWillMount: function() {
        var me = this;
        Events.uiEvents.on(Events.uiEvents.eventType.NAVIGATION_CHANGED, function() {
            me.setState({
                items: NavigationManager.getNavigationItems(),
                title: NavigationManager.getNavigationTitle()
            });
        });
    },
    // Set the initial state synchronously
    getInitialState: function() {
        return {
            items: NavigationManager.getNavigationItems(),
            title: NavigationManager.getNavigationTitle()
        };
    },
    openHelp: function() {
        Events.uiEvents.trigger(Events.uiEvents.eventType.SHOW_HELP);
    },
    render: function() {
        var title = this.state.title;
        var navItems = this.state.items.map(function(item, i) {
            var key = "nav-item" + i;
            return (
                <li data-id={i} key={key}>
                    <a href={item.url}>{item.title}</a>
                </li>
            );
        });
        return (
            <div id="ljs-top-navigation">
                <h1 className="ljs-logo"><a href="/index.html">Linkbot Labs</a></h1>
                <div className="ljs-top-nav-info">
                    <ul id="ljs-top-nav-breadcrumbs" className="ljs-top-nav-breadcrumbs">
                        {navItems}
                    </ul>
                    <h1 id="ljs-top-nav-title" className="ljs-top-nav-title">{title}</h1>
                </div>
                <div className="ljs-top-nav-help">
                    <a className="ljs-top-nav-help-link" onClick={this.openHelp}></a>
                </div>
            </div>
        );
    }
});

module.exports = NavigationMenu;