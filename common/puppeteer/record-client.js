'use strict';

const puppeteer = require('puppeteer');
const process = require('process');
const fs = require('fs/promises');

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

(async () => {
    // https://community.jitsi.org/t/option-to-stream-video-on-headless-linux-server-without-headless-mode-web-browser-technic/119279
    // https://code.saghul.net/2017/09/streaming-a-webcam-to-a-jitsi-meet-room/
    // https://gist.github.com/dtony/5ecbff663f6da3ff2aa67dda63422ad2
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
    const browser = await puppeteer.launch({
        acceptInsecureCerts: true,
        args: chromeArgs,
    });
    try {
        const meetArgs = [
            // Disable receiving of video
            // 'config.channelLastN=0',
            // Unmute our audio
            'config.startWithAudioMuted=true',
            // Unmute video
            'config.startWithVideoMuted=false',
            // Don't use simulcast to save resources on the sender (our) side
            // 'config.disableSimulcast=true',
            // Disable P2P mode due to a bug in Jitsi Meet
            'config.p2p.enabled=false',
            // Disable prejoin page
            // 'config.prejoinPageEnabled=false'
            // Disable self view (will also get rid of main video)
            // 'config.disableSelfView=true',
            'config.doNotFlipLocalVideo=true',
        ];

        let bodyHTML;
        const page = await browser.newPage();
        // const recorder = new PuppeteerScreenRecorder(page);
        // await recorder.start("join-meeting.mp4");

        await page.goto(`https://s0/dos-miti#${meetArgs.join('&')}`);
        await page.type('#premeeting-name-input', clientName);
        // await page.exposeFunction('writeFile', async (outputPath, buffer) => {
        //     return fs.writeFile(outputPath, buffer);
        // });
        
        await page.click('.primary');
        await page.waitForSelector('#largeVideo', { timeout: 1000 });
        await page.waitForFunction('document.querySelector("#largeVideo").readyState >= 2');

        const scriptId = 'recordFrameScript';

        // await page.evaluate( (expStartTime, windowLength) => {
        //     const expStart = document.createElement('div', {id: "expStart"});
        //     expStart.innerText = expStartTime;
        //     const winLength = document.createElement('div', {id: "windowLength"});
        //     winLength.innerText = windowLength;
        // }, expStartTime, windowLength);

        let content = `const recordTime = ${windowLengthNum} * 3 * 1000 + 100;\n`;
            // + `const expStartDateTime = new Date("${expStartTime}");\n`;
        content += await fs.readFile(recordFramesPath, 'utf8');
        // console.log(content);
        while (new Date() < expStartDateTime) {
            await new Promise((resolve) => setTimeout(resolve, 20)); // Check every 20 ms
        }
        const recordFramesScript = await page.addScriptTag({content, id: scriptId});
        // console.log("script injected");

        const endTime = new Date(expStartDateTime.getTime() + 1000 * windowLengthNum * 3 + 10000); // before, during, after, plus buffer
        while (new Date() < endTime) {
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Check every second
            // console.log("waiting");
        }
        console.log("reached end of time period");
        const [frames, timestamps, finishedRecording] = await recordFramesScript.evaluate(() => [frames, timestamps, finishedRecording]);
        console.log(finishedRecording);
        console.log(`num timestamps: ${timestamps.length}, num frames: ${frames.length}`);
        // frames.map((frame) => console.log(frame));

        const outputFramesDir = `output/${scenario}/frames`;
        const outputTimestampsDir = `output/${scenario}/timestamps`;
        await fs.mkdir(outputFramesDir, {recursive: true});
        await fs.mkdir(outputTimestampsDir, {recursive: true});

        const writeFilesMap = frames.map( async (dataUrl, index) => {
            // write frames to directory
            const outputFramesPath = `${outputFramesDir}/${(index+1).toString().padStart(3, '0')}.png`;
            const base64String = dataUrl.split(',')[1];
            const buffer = Buffer.from(base64String, 'base64');
            await fs.writeFile(outputFramesPath, buffer);

            // write timestamps (distance from start of experiment time in ms) to directory
            const outputTimestampsPath = `${outputTimestampsDir}/${(index+1).toString().padStart(3, '0')}.txt`;
            const time = new Date(timestamps[index]);
            const diff = `${timestamps[index] - expStartDateTime}`;
            console.log(`start: ${expStartDateTime}, index: ${index}, time: ${time}, diff: ${diff}`);
            await fs.writeFile(outputTimestampsPath, diff);

            // console.log(`Frame written to ${outputPath}`);
        });

        await Promise.all(writeFilesMap);
    } catch (e) {
        console.log(e);
    } finally {
        await browser.close();
    }
})();