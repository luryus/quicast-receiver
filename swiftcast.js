let SwiftCast = ((window, cast) => {

    let castReceiverManager;
    let commandBus;

    function initApp() {
        cast.receiver.logger.setLevelValue(0);
        castReceiverManager = cast.receiver.CastReceiverManager.getInstance();

        // handler for 'ready' event
        castReceiverManager.onReady = function(event) {
            console.log('Ready event: ' + event.data);
            window.castReceiverManager.setApplicationState("Application ready");
        };

        // handler for 'senderconnected'
        castReceiverManager.onSenderConnected = function(event) {
            console.log('Sender connected: ' + event.data);
            console.log(castReceiverManager.getSender(event.data).userAgent);
        };

        castReceiverManager.onSenderDisconnected = function(event) {
            console.log('Sender disconnected: ' + event.data);
            if (window.castReceiverManager.getSenders().length == 0) {
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
            displayMessage(event.data);
        };

        // init the CastReceiverManager with a status message
        castReceiverManager.start({ statusText: "Application starting "});
        console.log('Receiver Manager started');
    }

    function displayMessage(message) {
        console.log('Displaying message: ' + message);
        document.getElementById('message').innerHTML = message;
    }

    return {
        initApp,
        displayMessage,
    };
})(window, cast);

window.onload = SwiftCast.initApp;
