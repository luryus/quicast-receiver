'use strict';

var Quicast = (function(window, document, cast, SomApi) {

    var _castReceiverManager;
    var _commandBus;
    var _idleTimer;

    var resultsDiv, readyTextDiv,
        latencyDiv, testServerDiv, speedTitlesDiv,
        errorDiv, errorMsgDiv;

    var downProgressBar, upProgressBar, downLabel, upLabel, downPass, upPass;

    var _testCompleted = false;
    var _currentPass = 0;

    var Commands = {
        START_TEST: "start_test"
    };

    var ApplicationState = {
        READY: "Ready",
        TESTING: "Testing",
        COMPLETED: "Test completed",
        ERROR: "Test error"
    };

    function _initApp() {
        //cast.receiver.logger.setLevelValue(cast.receiver.LoggerLevel.DEBUG);
        _castReceiverManager = cast.receiver.CastReceiverManager.getInstance();

        // handler for 'ready' event
        _castReceiverManager.onReady = function(event) {
            console.log('Ready event: ' + event.data);
            _setAppState(ApplicationState.READY);
        };

        // handler for 'senderconnected'
        _castReceiverManager.onSenderConnected = function(event) {
            console.log('Sender connected: ' + event.data);
            console.log(_castReceiverManager.getSender(event.data).userAgent);
        };

        _castReceiverManager.onSenderDisconnected = function(event) {
            console.log('Sender disconnected: ' + event.data);
            if (_castReceiverManager.getSenders().length === 0) {
                // close the receiver app if no senders remain
                window.close();
            }
        };

        // create a custom CastMessageBus for receiving commands
        _commandBus = _castReceiverManager
            .getCastMessageBus('urn:x-cast:tk.luryus.quicast.command');
        // setup handlers for the command bus
        _commandBus.onMessage = function(event) {
            console.log('Message [' + event.senderId + ']: ' + event.data);
            // display the message
            _handleCommand(event.data);
        };

        // init the CastReceiverManager with a status message
        _castReceiverManager.start({ statusText: "Application starting"});
        console.log('Receiver Manager started');

        _initSomApi();
        _findElements();
    }

    function _setAppState(state) {
        _castReceiverManager.setApplicationState(state);
        _resetIdleTimer();
    }

    function _resetIdleTimer() {
        clearTimeout(_idleTimer);
        _idleTimer = setTimeout(function() {
            _castReceiverManager.stop();
        }, 1000 * 60 * 5); // 5 minutes
    }

    function _findElements() {
        readyTextDiv = document.getElementById('ready-text');
        resultsDiv = document.getElementById('results');
        latencyDiv = document.getElementById('latency');
        testServerDiv = document.getElementById('test-server');
        speedTitlesDiv = document.getElementById('speed-titles');

        downProgressBar = document.getElementById('download-progress');
        upProgressBar = document.getElementById('upload-progress');
        downLabel = document.getElementById('download-label');
        upLabel = document.getElementById('upload-label');
        downPass = document.getElementById('download-pass');
        upPass = document.getElementById('upload-pass');

        errorDiv = document.getElementById('error');
        errorMsgDiv = document.getElementById('error-msg');
    }

    function _initSomApi() {
        SomApi.account = 'SOM5692bfa86b017';
        SomApi.domainName = 'luryus.github.io';
        SomApi.config.sustainTime = 3;
        SomApi.config.userInfoEnabled = false;
        SomApi.config.progress.verbose = true;

        SomApi.onTestCompleted = _onSpeedTestCompleted;
        SomApi.onError = _onSpeedTestError;
        SomApi.onProgress = _onSpeedTestProgress;
    }

    function _handleCommand(cmd) {
        if (cmd === Commands.START_TEST) {
            _startTesting();
        }
    }

    function _startTesting() {
        _testCompleted = false;
        console.log('Now starting testing (cake?)');
        SomApi.startTest();

        _setAppState(ApplicationState.TESTING);

        downLabel.innerHTML = '-';
        downProgressBar.setAttribute('data-progress', 0);
        upLabel.innerHTML = '-';
        upProgressBar.setAttribute('data-progress', 0);
        readyTextDiv.classList.add('hidden');
        speedTitlesDiv.classList.remove('hidden');
        resultsDiv.classList.remove('hidden');
        latencyDiv.classList.add('hidden');
        testServerDiv.classList.add('hidden');
        errorDiv.classList.add('hidden');
    }

    function _onSpeedTestCompleted(testResults) {
        _testCompleted = true;
        console.log('Speed test completed', testResults);
        latencyDiv.innerHTML = 'Latency: ' + testResults.latency + ' ms';
        testServerDiv.innerHTML = 'Test server: ' + testResults.testServer;
        downProgressBar.setAttribute(
                            'data-progress', '100');
        downLabel.innerHTML = testResults.download + '<br>Mbps';
        downPass.innerHTML = '';
        upProgressBar.setAttribute(
                            'data-progress', '100');
        upLabel.innerHTML = testResults.upload + '<br>Mbps';
        upPass.innerHTML = '';
        latencyDiv.classList.remove('hidden');
        testServerDiv.classList.remove('hidden');

        _setAppState(ApplicationState.COMPLETED);
    }

    function _onSpeedTestError(testError) {
        _testCompleted = true;
        console.log('Speed test error', testError);
        errorMsgDiv.innerHTML = testError.message;
        resultsDiv.classList.add('hidden');
        speedTitlesDiv.classList.add('hidden');
        errorDiv.classList.remove('hidden');
        _setAppState(ApplicationState.ERROR);
    }

    function _onSpeedTestProgress(testProgress) {
        // dont want to even see the latency progress
        if (testProgress.type === 'latency') {
            return;
        }

        console.log('Speed test progress', testProgress);
        if (!_testCompleted) {
            if (testProgress.type === 'download') {
                if (testProgress.pass !== _currentPass) {
                    downPass.innerHTML = 'Pass ' + testProgress.pass;
                    _currentPass = testProgress.pass;
                }

                downProgressBar.setAttribute(
                    'data-progress', testProgress.percentDone);
                downLabel.innerHTML =
                    testProgress.currentSpeed + '<br>Mbps';
            } else if (testProgress.type === 'upload') {
                if (testProgress.pass !== _currentPass) {
                    upPass.innerHTML = 'Pass ' + testProgress.pass;
                    _currentPass = testProgress.pass;
                }

                upProgressBar.setAttribute(
                    'data-progress', testProgress.percentDone);
                upLabel.innerHTML = testProgress.currentSpeed + '<br>Mbps';
            }
        }
    }

    return {
        initApp: _initApp,
        startTesting: _startTesting
    };

})(window, document, cast, SomApi);

window.onload = Quicast.initApp;
