const recordTime = 5000;
const frames = [];
const timestamps = [];
let counter = 0;
const startTime = Date.now();
let finishedRecording = false;

const intervalID = setInterval(() => {
    counter += 1;
    timestamps.push(Date.now());
    try {
        // Capture the frame as a buffer
        const videoElement = document.getElementById('largeVideo');
        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        const base64String = dataUrl.split(',')[1];
        frames.push(base64String);

        // console.log(`Frame added to frames`);
    } catch (error) {
        frames.push('-1');
        // console.error('Error saving frame:', error);
    }

    if (Date.now() - startTime >=  recordTime) {
        clearInterval(intervalID);
        finishedRecording = true;
        // some flag?
    }
}, 1000 / 30 /* 30 fps video for jitsi */);