'use strict';

const puppeteer = require('puppeteer');
const process = require('process');
const fs = require('fs/promises');

// clientName = clientName on jitsi, videoFilePath = file used to stream vid
const [ clientName, videoFilepath ] = process.argv.slice(2);
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
        `--use-file-for-fake-video-capture=${videoFilepath}`,
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

        const recordFramesScript = await page.addScriptTag({path: './puppeteer/record-frames.js', id: scriptId});
        await new Promise(resolve => setTimeout(resolve, 8000)); // should use a flag saying it's done
        const [frames, timestamps, finishedRecording] = await recordFramesScript.evaluate(() => [frames, timestamps, finishedRecording]);
        console.log(finishedRecording);

        const writeFileMap = frames.map( async (base64String, index) => {
            const outputPath = `output/${(index+1).toString().padStart(3, '0')}.png`;
            const buffer = Buffer.from(base64String, 'base64');
            await fs.writeFile(outputPath, buffer);
            // console.log(`Frame written to ${outputPath}`);
        });

        await Promise.all(writeFileMap);
    } catch (e) {
        console.log(e);
    } finally {
        await browser.close();
    }
})();