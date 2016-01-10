'use strict';

var SwiftCast = (function(window, document, cast, SomApi) {

    var castReceiverManager;
    var commandBus;

    var Commands = {
        START_TEST: "start_test",
    };

    function initApp() {
        cast.receiver.logger.setLevelValue(cast.receiver.LoggerLevel.DEBUG);
        castReceiverManager = cast.receiver.CastReceiverManager.getInstance();

        // handler for 'ready' event
        castReceiverManager.onReady = function(event) {
            console.log('Ready event: ' + event.data);
            castReceiverManager.setApplicationState("ready");
        };

        // handler for 'senderconnected'
        castReceiverManager.onSenderConnected = function(event) {
            console.log('Sender connected: ' + event.data);
            console.log(castReceiverManager.getSender(event.data).userAgent);
        };

        castReceiverManager.onSenderDisconnected = function(event) {
            console.log('Sender disconnected: ' + event.data);
            if (castReceiverManager.getSenders().length == 0) {
                // close the receiver app if no senders remain
                window.close();
            }
        };

        // create a custom CastMessageBus for receiving commands
        commandBus = castReceiverManager
            .getCastMessageBus('urn:x-cast:tk.luryus.swiftcast.command');
        // setup handlers for the command bus
        commandBus.onMessage = function(event) {
            console.log('Message [' + event.senderId + ']: ' + event.data);
            // display the message
            handleCommand(event.data);
        };

        // init the CastReceiverManager with a status message
        castReceiverManager.start({ statusText: "Application starting "});
        console.log('Receiver Manager started');

        _initSomApi();
    }

    function _initSomApi() {
        SomApi.account = 'SOM5692bfa86b017';
        SomApi.domainName = 'luryus.github.io';
        SomApi.config = {
            sustainTime: 5,
            userInfoEnabled: false,
        };
        SomApi.onTestCompleted = _onSpeedTestCompleted;
        SomApi.onError = _onSpeedTestError;
        SomApi.onProgress = _onSpeedTestProgress;
    }

    function handleCommand(cmd) {
        if (cmd === Commands.START_TEST) {
            SomApi.startTest();
            castReceiverManager.setApplicationState('testing');
        }
    }

    function _onSpeedTestCompleted(testResults) {
        console.log('Speed test completed', testResults);
        document.getElementById('results').innerHTML =
            'Completed: ' + JSON.stringify(testResults);
        castReceiverManager.setApplicationState('test_completed');
    }

    function _onSpeedTestError(testError) {
        console.log('Speed test error', testError);
        document.getElementById('results').innerHTML =
            'Error: ' + JSON.stringify(testError);
        castReceiverManager.setApplicationState('test_error');
    }

    function _onSpeedTestProgress(testProgress) {
        console.log('Speed test progress', testProgress);
        document.getElementById('results').innerHTML =
            'Progress: ' + JSON.stringify(testProgress);
        castReceiverManager.setApplicationState('test_progress');
    }

    return {
        initApp,
        handleCommand,
    };

})(window, document, cast, SomApi);

window.onload = SwiftCast.initApp;
