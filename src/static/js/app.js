// Audio setup
const beepSound = new Audio('static/assets/beep.mp3');
let beepInterval;

// Global variables
let peerConnection = null;
let dataChannel = null;
let timerInterval = null;
let seconds = 0;
let isConnected = false;

// DOM elements
const ringBox = document.getElementById('ringBox');
const callButton = document.getElementById('callButton');
const endCallBtn = document.getElementById('endCallBtn');
const callStatus = document.querySelector('.call-status');
const timer = document.querySelector('.timer');

// Initialize timer display
timer.style.display = 'none';

async function startCall() {
    ringBox.style.display = 'block';
    callStatus.textContent = 'Ringing...';
    startBeeping();
    await initOpenAIRealtime();
}

function startBeeping() {
    beepSound.play();
    beepInterval = setInterval(() => {
        beepSound.play();
    }, 3000);
}

function stopBeeping() {
    clearInterval(beepInterval);
}

const fns = {
    changeBackgroundColor: ({ color1, color2 }) => {
        const ringBox = document.getElementById('ringBox');
        ringBox.style.background = `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`;
        return { success: true, color1, color2 };
    },
    sendEmail: async ({  message }) => {
        try {
            sendEmail(message);
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};

async function initOpenAIRealtime() {
    try {
        const tokenResponse = await fetch("session");
        const data = await tokenResponse.json();
        const EPHEMERAL_KEY = data.client_secret.value;

        peerConnection = new RTCPeerConnection();
        
        // Add connection state change listener
        peerConnection.onconnectionstatechange = (event) => {
            console.log("Connection state:", peerConnection.connectionState);
            if (peerConnection.connectionState === 'connected') {
                stopBeeping();
                isConnected = true;
                callStatus.textContent = 'Connected';
                timer.style.display = 'block'; // Ensure timer is visible
                startTimer();
                endCallBtn.style.display = 'block';
            }
        };

        // Setup audio
        const audioElement = document.createElement("audio");
        audioElement.autoplay = true;
        peerConnection.ontrack = event => {
            audioElement.srcObject = event.streams[0];
        };

        const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        peerConnection.addTrack(mediaStream.getTracks()[0]);

        // Create data channel after peerConnection is initialized
        dataChannel = peerConnection.createDataChannel('response');

        // Configure data channel functions
        function configureData() {
            console.log('Configuring data channel');
            const event = {
                type: 'session.update',
                session: {
                    modalities: ['text', 'audio'],
                    tools: [
                        {
                            type: 'function',
                            name: 'changeBackgroundColor',
                            description: 'Changes the background gradient of the calling interface',
                            parameters: {
                                type: 'object',
                                properties: {
                                    color1: { type: 'string', description: 'First gradient color (hex or color name)' },
                                    color2: { type: 'string', description: 'Second gradient color (hex or color name)' }
                                },
                                required: ['color1', 'color2']
                            }
                        },
                        {
                            type: 'function',
                            name: 'sendEmail',
                            description: 'Sends an email to specified recipient',
                            parameters: {
                                type: 'object',
                                properties: {
                                    
                                    
                                    message: { 
                                        type: 'string', 
                                        description: 'Email body content' 
                                    }
                                },
                                required: ['message']
                            }
                        }
                        // ...existing tools...
                    ]
                }
            };
            dataChannel.send(JSON.stringify(event));
        }

        // Add event listeners after data channel is created
        dataChannel.addEventListener('open', () => {
            console.log('Data channel opened');
            configureData();
        });

        dataChannel.addEventListener('message', async (ev) => {
            try {
                const msg = JSON.parse(ev.data);
                console.log(msg);
                if (msg.type === 'response.function_call_arguments.done') {
                    const fn = fns[msg.name];
                    if (fn !== undefined) {
                        console.log(`Calling function ${msg.name} with arguments:`, msg.arguments);
                        const args = JSON.parse(msg.arguments);
                        const result = await fn(args);
                        
                        const event = {
                            type: 'conversation.item.create',
                            item: {
                                type: 'function_call_output',
                                call_id: msg.call_id,
                                output: JSON.stringify(result)
                            }
                        };
                        dataChannel.send(JSON.stringify(event));
                    }
                }
            } catch (error) {
                console.error('Error handling message:', error);
            }
        });

        // Create and send offer
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        const apiUrl = "https://api.openai.com/v1/realtime";
        const model = "gpt-4o-realtime-preview-2024-12-17";
        
        const sdpResponse = await fetch(`${apiUrl}?model=${model}`, {
            method: "POST",
            body: offer.sdp,
            headers: {
                Authorization: `Bearer ${EPHEMERAL_KEY}`,
                "Content-Type": "application/sdp"
            },
        });

        const answer = {
            type: "answer",
            sdp: await sdpResponse.text(),
        };
        await peerConnection.setRemoteDescription(answer);

    } catch (error) {
        console.error("Error:", error);
        endCall();
    }
}


function startTimer() {
    seconds = 0;
    timer.style.display = 'block'; // Make timer visible
    timerInterval = setInterval(() => {
        seconds++;
        timer.textContent = formatTime(seconds);
    }, 1000);
}

function formatTime(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function formatCallSummary(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    let summary = 'Call Duration: ';
    if (hours > 0) summary += `${hours}h `;
    if (minutes > 0) summary += `${minutes}m `;
    summary += `${remainingSeconds}s`;
    
    return summary;
}

function endCall() {
    stopBeeping();
    stopTimer();
    
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    
    const ringBox = document.getElementById('ringBox');
    const callButton = document.getElementById('callButton');
    
    if (isConnected) {
        const summary = formatCallSummary(seconds);
        callStatus.textContent = summary;
        endCallBtn.style.display = 'none';
        
        // Show summary for 3 seconds then reset UI
        setTimeout(() => {
            ringBox.style.display = 'none';
            callButton.style.display = 'block';
            callStatus.textContent = 'Ready to call';
        }, 3000);
    }
    
    isConnected = false;
    socket = null;
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    seconds = 0;
}

callButton.addEventListener('click', startCall);
endCallBtn.addEventListener('click', endCall);

async function sendEmail(message) {
    const loader = document.querySelector('.loader');
    loader.style.display = 'block';

    try {
        const response = await fetch('/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });

        if (response.ok) {
            showNotification('Email sent successfully!', 'success');
        } else {
            showNotification('Failed to send email', 'error');
        }
    } catch (error) {
        showNotification('Error sending email', 'error');
    } finally {
        loader.style.display = 'none';
    }
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}
