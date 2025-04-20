const puppeteer = require('puppeteer');
const path = require('path');

// clientName = clientName on jitsi
// clientVideoFilePath = file used to stream vid
// scenario = UB (unmitigated baseline), MB (mitigated baseline), UA (unmitigated attack), MA (mitigated attack)
// windowLength = length of pre-attack, during attack, post-attack windows in seconds
// expStartTime = linux time when experiment starts, used for starting record-frame.js script
const [ clientName, clientVideoFilePath, scenario,
    windowLength, expStartTime ] = process.argv.slice(2);
const windowLengthNum = Number(windowLength);
const expStartDateTime = new Date(expStartTime);
const recordFramesPath = "./puppeteer/record-frames.js";
const { PuppeteerScreenRecorder } = require("puppeteer-screen-recorder");


const chromeArgs = [
    // Disable sandboxing, gives an error on Linux
    '--no-sandbox',
    '--disable-setuid-sandbox',
    // Automatically give permission to use media devices
    '--use-fake-ui-for-media-stream',
    // test pattern
    '--use-fake-device-for-media-stream',
    // file for capture
    `--use-file-for-fake-video-capture=${clientVideoFilePath}`,
    //  You may need to play with these options to get proper input and output
    //'--alsa-output-device=plug:hw:0,1'
    '--alsa-input-device=plug:hw:0',
];

async function openHTML(filePath) {
    const browser = await puppeteer.launch({
        acceptInsecureCerts: true,
        args: chromeArgs,
    });
    const page = await browser.newPage();
    const recorder = new PuppeteerScreenRecorder(page);
    await recorder.start("join-meeting.mp4");

    // Construct the absolute file path
    const absolutePath = path.resolve(filePath);
    const fileURL = 'file://' + absolutePath;

    await page.goto(fileURL);
    
    await page.evaluate(() => {
        const domain = 's0';//'meet.jit.si';
        const options = {
            roomName: 'dos-miti',
            width: 700,
            height: 700,
            parentNode: document.querySelector('#meet'),
        };
        const api = new JitsiMeetExternalAPI(domain, options);
    });

    // await page.screenshot({ path: 'screenshot.png' }); // Optional: take a screenshot
    console.log(`Opened ${fileURL}`);
    console.log(await page.content());
    await new Promise(resolve => setTimeout(resolve, 1000));
    await recorder.stop();

    await browser.close();
}

openHTML('./puppeteer/jitsi-api-test.html');