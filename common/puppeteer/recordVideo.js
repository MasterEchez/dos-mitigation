const videoElement = document.getElementById('largeVideo');
const canvas = document.createElement('canvas');
canvas.width = videoElement.videoWidth;
canvas.height = videoElement.videoHeight;
const ctx = canvas.getContext('2d');
ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
const dataUrl = canvas.toDataURL('image/png');

const base64String = dataUrl.split(',')[1];
// frames.push(base64String);

// const outputPath = `output/${(index+1).toString().padStart(3, '0')}.png`;
// const buffer = Buffer.from(base64String, 'base64');

const frames = [base64String];
// set something to true when done

// const recordTime = 5000;
// const frames = [];
// const timestamps = [];
// let counter = 0;

// let intervalID = setInterval(async () => {
//     try {
//         counter += 1;
//         // Capture the frame as a buffer
//         timestamps.push(Date.now());
//         const dataUrl = await page.evaluate(() => {
//             const videoElement = document.getElementById('largeVideo');
//             // const rect = videoElement.getBoundingClientRect();
//             const canvas = document.createElement('canvas');
//             canvas.width = videoElement.videoWidth;
//             canvas.height = videoElement.videoHeight;
//             const ctx = canvas.getContext('2d');
//             ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
//             return canvas.toDataURL('image/png');
//         });

//         const base64String = dataUrl.split(',')[1];
//         frames.push(base64String);

//         // console.log(`Frame added to frames`);
//     } catch (error) {
//         console.error('Error saving frame:', error);
//     }
// }, 1000 / 30 /* 30 fps video for jitsi */);


// await new Promise(resolve => setTimeout(resolve, recordTime));
// clearInterval(intervalID);