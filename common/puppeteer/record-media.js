// next 2 lines will be added in record-client.js
// const recordTime = windowLengthNum * 3 * 1000 + 100;
// const expStartDateTime = new Date("${expStartTime}");
let finishedRecording = false;
const startTime = Date.now();
let blob;

// while (new Date() < expStartDateTime) {
//     await new Promise((resolve) => setTimeout(resolve, 20)); // Check every 100ms
// }

const videoElement = document.getElementById('largeVideo');
const stream = videoElement.captureStream();

const recorder = new MediaRecorder(stream);
const data = [];
const recorderstate1 = recorder.state;
let recorderstate3;

recorder.onstop = () => {
    blob = new Blob(data, { type: 'video/webm' });
    finishedRecording = true;
    recorderstate3 = recorder.state;
};

recorder.ondataavailable = (event) => data.push(event.data);
recorder.start();
const recorderstate2 = recorder.state;

setTimeout(() => {
    recorder.stop();
}, recordTime);