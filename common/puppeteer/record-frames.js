// next 2 lines will be added in record-client.js
// const recordTime = windowLengthNum * 3 * 1000 + 100;
// const expStartDateTime = new Date("${expStartTime}");
const frames = [];
const timestamps = [];
const startTime = Date.now();
let finishedRecording = false;

// while (new Date() < expStartDateTime) {
//     await new Promise((resolve) => setTimeout(resolve, 20)); // Check every 100ms
// }

const videoElement = document.getElementById('largeVideo');
const [height, width] = [videoElement.videoWidth, videoElement.videoHeight];

const intervalID = setInterval(() => {
    timestamps.push(Date.now());
    try {
        // Capture the frame as a buffer
        const canvas = document.createElement('canvas', {width, height});
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoElement, 0, 0, width, height);
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