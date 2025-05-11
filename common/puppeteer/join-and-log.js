const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs/promises');

// clientName = clientName on jitsi
// videoFilePath = file used to stream vid
// session = name of session, for logging purposes
// scenario = UB (unmitigated baseline), MB (mitigated baseline), UA (unmitigated attack), MA (mitigated attack)
// windowLength = length of pre-attack, during attack, post-attack windows in seconds
// expStartTime = linux time when experiment starts, used for starting log process
// record = record video (0 or 1 for no or yes)
const [ clientName, videoFilePath,
    windowLength, expStartTime, record ] = process.argv.slice(2);
const { PuppeteerScreenRecorder } = require("puppeteer-screen-recorder");

// console.log(`clientName: ${clientName}`);
// console.log(`videoFilePath: ${videoFilePath}`);
// console.log(`session: ${session}`);
// console.log(`scenario: ${scenario}`);
// console.log(`windowLength: ${windowLength}`);
// console.log(`expStartTime: ${expStartTime}`);
// console.log(`record: ${record}`);

const windowLengthNum = Number(windowLength);
const expStartDateTime = new Date(expStartTime);
const expEndDateTime = new Date(expStartDateTime.getTime() + 1000 * 3 * Number(windowLengthNum) + 3000); // + 3 extra seconds;
const recordBool = Number(record) === 1;

// console.log(`windowLengthNum: ${windowLengthNum}`);
// console.log(`expStartDateTime: ${expStartDateTime}`);
// console.log(`expEndDateTime: ${expEndDateTime}`);
// console.log(`recordBool: ${recordBool}`);

const chromeArgs = [
    // Disable sandboxing, gives an error on Linux
    '--no-sandbox',
    '--disable-setuid-sandbox',
    // Automatically give permission to use media devices
    '--use-fake-ui-for-media-stream',
    // test pattern
    '--use-fake-device-for-media-stream',
    // file for capture
    `--use-file-for-fake-video-capture=${videoFilePath}`,
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
    
    let recorder;
    if (recordBool) {
        recorder = new PuppeteerScreenRecorder(page);
        await recorder.start("join-meeting.mp4");
    }

    try {
        // Construct the absolute file path
        const absolutePath = path.resolve(filePath);
        const fileURL = 'file://' + absolutePath;

        await page.goto(fileURL);

        const iframeElement = await page.$('iframe');
        const iframe = await iframeElement.contentFrame();
        // const html = await iframe.evaluate(() => {
        //     return document.body.innerHTML;
        // });
        // console.log(html);
        const logs = [];
        await iframe.type('#premeeting-name-input', clientName);
        await iframe.click('.primary');

        while (Date.now() < expStartDateTime) {
            console.log("a");
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        while (Date.now() < expEndDateTime) {
            const time = Date().now();
            // console.log(time);
            try {
                stats = await iframe.evaluate(  () => {
                    return APP.conference.getStats();
                });
                logs.push({time, stats});
            } catch (e) {
                console.log(e);
            }
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // console.log(logs);
        console.log(logs[0]);
        console.log(logs[logs.length-1]);
        console.log(logs.length);

        // logs.filter( (value) => value.stats.)

        const logDir = `/tmp/logs`;
        await fs.mkdir(logDir, {recursive: true});

        // const writeLogsPromise = logs.map( async (dataUrl, index) => {
            // // write frames to directory
            // const outputFramesPath = `${logDir}/${(index+1).toString().padStart(3, '0')}.png`;
            // const base64String = dataUrl.split(',')[1];
            // const buffer = Buffer.from(base64String, 'base64');
            // await fs.writeFile(outputFramesPath, buffer);

            // // write timestamps (distance from start of experiment time in ms) to directory
            // const outputTimestampsPath = `${outputTimestampsDir}/${(index+1).toString().padStart(3, '0')}.txt`;
            // const time = new Date(timestamps[index]);
            // const diff = `${timestamps[index] - expStartDateTime}`;
            // console.log(`start: ${expStartDateTime}, index: ${index}, time: ${time}, diff: ${diff}`);
            // await fs.writeFile(outputTimestampsPath, diff);

            // console.log(`Frame written to ${outputPath}`);
        // });

        // await Promise.all(writeLogsPromise);

    } catch (e) {
        console.log(e);
    } finally {
        if (recordBool) {
            await recorder.stop();
        }
        await browser.close();
    }
}

openHTML('./puppeteer/jitsi-log-page.html');