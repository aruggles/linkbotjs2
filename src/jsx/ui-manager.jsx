
var React = require('react');
var ReactDOM = require('react-dom');
var NavigationMenu = require('./navigation-menu.jsx');
var HelpDialog = require('./help-dialog.jsx');
var ErrorConsole = require('./error-console.jsx');
var SpinnerOverlay = require('./spinner-overlay.jsx');
var RobotMenu = require('./robot-menu.jsx');
var ControlPanel = require('./control-panel.jsx');

module.exports.addUI = function() {
    // Create all the DOM containers for the react components.
    var controlPanelContainer = document.createElement('div');
    var robotMenuContainer = document.createElement('div');
    var navigationMenuContainer = document.createElement('div');
    var helpDialogContainer = document.createElement('div');
    var errorConsoleContainer = document.createElement('div');
    var spinnerOverlayContainer = document.createElement('div');
    // Add them to the document.
    document.body.appendChild(controlPanelContainer);
    document.body.appendChild(robotMenuContainer);
    document.body.appendChild(navigationMenuContainer);
    document.body.appendChild(helpDialogContainer);
    document.body.appendChild(errorConsoleContainer);
    document.body.appendChild(spinnerOverlayContainer);
    // Render the components.
    ReactDOM.render(<ControlPanel />, controlPanelContainer);
    ReactDOM.render(<RobotMenu></RobotMenu>, robotMenuContainer);
    ReactDOM.render(<NavigationMenu />, navigationMenuContainer);
    ReactDOM.render(<HelpDialog />, helpDialogContainer);
    ReactDOM.render(<ErrorConsole />, errorConsoleContainer);
    ReactDOM.render(<SpinnerOverlay />, spinnerOverlayContainer);
};