

(function() {
    var vertoHandle, vertoCallbacks, currentCall;

    var memberMute = function() {
        // Normally audio mute/unmute.
        currentCall.dtmf("0");
        // Normally video mute/unmute.
        currentCall.dtmf("*0");
    };

    var sendConferenceChat = function(message) {
        // The second argument is a message type, completely arbitrary, can be used
        // classify different kinds of messages.
        vertoConf.sendChat(message, "message");
    };

    var bandwidthTestData;
    var testBandwidth = function() {
        // Translates to 256KB.
        var bytesToSendAndReceive = 1024 * 256;
        vertoHandle.rpcClient.speedTest(bytesToSendAndReceive, function(event, data) {
            // These values are in kilobits/sec.
            var upBand = Math.ceil(data.upKPS);
            var downBand = Math.ceil(data.downKPS);
            console.log('[BANDWIDTH TEST] Up: ' + upBand + ', Down: ' + downBand);
            // Store the results for later.
            bandwidthTestData = data;
        });
    };

    $.verto.init({}, bootstrap);

    function onDialogState(d) {
        console.debug('onDialogState', d);
        switch (d.state.name) {
            case "trying":
                console.log("Call trying: ");
                break;
            case "ringing": {
                alert('Someone is calling you, answer!');
                console.log("Call ringing: ");
            };break;
            case "answering":
                console.log("Call answering: ");
                break;
            case "active":
                console.log("Call active: ");
                break;
            case "hangup":
                console.log("Call ended with cause: " + d.cause);
                break;
            case "destroy":
                console.log("Call destroy: ");
                break;
        }
    }


    function hangupCall() {
        currentCall.hangup();
    };

    function answerCall() {
        currentCall.answer();
    };

    function muteCall() {
        currentCall.mute("off");
    };

    function unmuteCall() {
        currentCall.mute("on");
    };

    function muteUnmuteCall() {
        currentCall.mute("toggle");
    };

    function holdCall() {
        currentCall.hold();
    };

    function unholdCall() {
        currentCall.unhold();
    };

    function transferCall() {
        var destinationNumber = prompt("Insert transfer destination number");
        if(destinationNumber) {
            currentCall.transfer(destinationNumber);
        }
    };

    function makeCall() {
        console.log('11111');
        // Sets the parameters for the video stream that will be sent to the
        // videoconference.
        // Hint: Use the upKPS result from a bandwidth test to determine the video
        // resolution to send!
        vertoHandle.videoParams({
            // Dimensions of the video feed to send.
            minWidth: 320,
            minHeight: 240,
            maxWidth: 640,
            maxHeight: 480,
            // The minimum frame rate of the client camera, Verto will fail if it's
            // less than this.
            minFrameRate: 15,
            // The maximum frame rate to send from the camera.
            vertoBestFrameRate: 30,
        });
        testBandwidth();
        currentCall = vertoHandle.newCall({
            // outgoingBandwidth: bandwidthTestData.upKPS,
            // incomingBandwidth: bandwidthTestData.downKPS,
            // Extension to dial.
            // Enable video support.
            useVideo: true,
            // Mirror local user's webcam.
            mirrorInput: true,
            tag: "video-container",
            destination_number: '1004',
            caller_id_name: 'Test Guy',
            caller_id_number: '1001',
            outgoingBandwidth: 'default',
            incomingBandwidth: 'default',
            // Enable stereo audio.
            useStereo: true,
            // You can pass any application/call specific variables here, and they will
            // be available as a dialplan variable, prefixed with 'verto_dvar_'.
            userVariables: {
                // Shows up as a 'verto_dvar_email' dialplan variable.
                email: 'test@test.com'
            },
            // Use a dedicated outbound encoder for this user's video.
            // NOTE: This is generally only needed if the user has some kind of
            // non-standard video setup, and is not recommended to use, as it
            // dramatically increases the CPU usage for the conference.
            dedEnc: false,
            // Example of setting the devices per-call.
            //useMic: 'any',
            //useSpeak: 'any',
        });
    };


    function bootstrap(status) {
        // Create a new verto instance:
        // This step performs a user login to FreeSWITCH via secure websocket.
        // The user must be properly configured in the FreeSWITCH user directory.
        // Receives call state messages from FreeSWITCH.

        vertoHandle = new jQuery.verto({
            login: '1001@149.56.20.86',
            passwd: '1234',
            // As configured in verto.conf.xml on the server.
            socketUrl: 'ws:149.56.20.86:8081',
            // TODO: Where is this file, on the server? What is the base path?
            ringFile: 'sounds/bell_ring2.wav',
            // STUN/TURN server config, more than one is allowed.
            // Instead of an array of objects, you can also pass a Boolean value,
            // false disables STUN, true uses the default Google STUN servers.
            iceServers: [
                {
                    url: 'stun:stun.l.google.com:19302',
                },
            ],
            // These can be set per-call as well as per-login.
            deviceParams: {
                useMic: 'any',
                useSpeak: 'any',
            },
            // Optional Id of the HTML audio/video tag to be used for playing video/audio.
            // This can even be a function which will return an element id. (Use this as
            // function to create unique element for every new call specially when dealing
            // with multiple calls simultaneously to avoid conflicts between streams.
            // In this case, once call is finished, newly generated element will be
            // destroyed automatically)
            tag: "video-container",
            // Below are some more advanced configuration parameters.
            // Google Chrome specific adjustments/filters for audio.
            // Official documentation is scant, best to try them out and see!
            audioParams: {
             googEchoCancellation: true,
             googAutoGainControl: true,
             googNoiseSuppression: true,
             googHighpassFilter: true,
             googTypingNoiseDetection: true,
             googEchoCancellation2: false,
             googAutoGainControl2: false,
            },
            // Internal session ID used by Verto to track the call, eg. for call
            // recovery. A random one will be generated if none is provided, and,
            // it can be useful to provide a custom ID to store and reference for
            // other purposes.
            //sessid: sessid,
        }, vertoCallbacks);

        document.getElementById("make-call").addEventListener("click", makeCall);
        document.getElementById("hang-up-call").addEventListener("click", hangupCall);
        document.getElementById("answer-call").addEventListener("click", answerCall);
        document.getElementById("mute-call").addEventListener("click", muteCall);
        document.getElementById("unmute-call").addEventListener("click", unmuteCall);
        document.getElementById("mute-unmute-call").addEventListener("click", muteUnmuteCall);
        document.getElementById("hold-call").addEventListener("click", holdCall);
        document.getElementById("unhold-call").addEventListener("click", unholdCall);
        document.getElementById("transfer-call").addEventListener("click", transferCall);
    };

    vertoCallbacks = {
        onWSLogin: onWSLogin,
        onDialogState: onDialogState,
        onMessage: onMessage,
        onWSClose: onWSClose
    };
    // This translates to the following conference API command:
// conference [conference id] [command] [id] [value]
    var sendCommand = function (command, id, value) {
        vertoObj.rpcClient.call("verto.broadcast", {
            "eventChannel": vertoConf.params.laData.modChannel,
            "data": {
                "application": "conf-control",
                "command": command,
                "id": id,
                "value": value
            }
        });
    }

    // Some examples of using the above sendCommand() function.
    var toggleAudioMute = function(conferenceUserId, arg) {
        sendCommand('tmute', conferenceUserId, arg);
    }
    var toggleVideoMute = function(conferenceUserId, arg) {
        sendCommand('tvmute', conferenceUserId, arg);
    }
    var videoLayout = function(layoutId) {
        sendCommand("vid-layout", null, layoutId);
    }

    /*
    * Setting up and subscribing to the live array.
    */
    var vertoConf, liveArray;
    var initLiveArray = function(verto, dialog, data) {
        // Set up addtional configuration specific to the call.
        vertoConf = new $.verto.conf(verto, {
            dialog: dialog,
            hasVid: true,
            laData: data.pvtData,
            // For subscribing to published chat messages.
            chatCallback: function(verto, eventObj) {
                var from = eventObj.data.fromDisplay || eventObj.data.from || 'Unknown';
                var message = eventObj.data.message || '';
            },
        });
        var config = {
            subParams: {
                callID: dialog ? dialog.callID : null
            },
        };
        // Set up the live array, using the live array data received from FreeSWITCH.
        liveArray = new $.verto.liveArray(vertoObj, data.pvtData.laChannel, data.pvtData.laName, config);
        // Subscribe to live array changes.
        liveArray.onChange = function(liveArrayObj, args) {
            console.log("Call UUID is: " + args.key);
            console.log("Call data is: ", args.data);
            try {
                switch (args.action) {

                    // Initial list of existing conference users.
                    case "bootObj":
                        break;

                    // New user joined conference.
                    case "add":
                        break;

                    // User left conference.
                    case "del":
                        break;

                    // Existing user's state changed (mute/unmute, talking, floor, etc)
                    case "modify":
                        break;

                }
            } catch (err) {
                console.error("ERROR: " + err);
            }
        };
        // Called if the live array throws an error.
        liveArray.onErr = function (obj, args) {
            console.error("Error: ", obj, args);
        };
    }
// Receives conference-related messages from FreeSWITCH.
// Note that it's possible to write server-side modules to send customized
// messages via this callback.
    function onMessage(verto, dialog, message, data) {
        switch (message) {
            case $.verto.enum.message.pvtEvent:
                if (data.pvtData) {
                    switch (data.pvtData.action) {
                        // This client has joined the live array for the conference.
                        case "conference-liveArray-join":
                            // With the initial live array data from the server, you can
                            // configure/subscribe to the live array.
                            initLiveArray(verto, dialog, data);
                            break;
                        // This client has left the live array for the conference.
                        case "conference-liveArray-part":
                            // Some kind of client-side wrapup...
                            break;
                    }
                }
                break;
            // TODO: Needs doc.
            case $.verto.enum.message.info:
                break;
            // TODO: Needs doc.
            case $.verto.enum.message.display:
                break;
            case $.verto.enum.message.clientReady:
                // 1.8.x+
                // Fired when the server has finished re-attaching any active sessions.
                // data.reattached_sessions contains an array of session IDs for all
                // sessions that were re-attached.
                break;
        }
    }

    function onWSLogin(verto, success) {
        console.log('onWSLogin', success);
        console.log('onWSLogin verto', verto);
    };

    function onWSClose(verto, success) {
        console.log('onWSClose', success);
    };
})();