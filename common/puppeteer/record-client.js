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
        
        await page.click('.primary');
        await page.waitForSelector('#largeVideo', { timeout: 1000 });
        await page.waitForFunction('document.querySelector("#largeVideo").readyState >= 2');

        try {
            const outputPath = "canvasFrame.png"
            // Capture the frame as a buffer
            const dataUrl = await page.evaluate(() => {
                const videoElement = document.getElementById('largeVideo');
                // const rect = videoElement.getBoundingClientRect();
                const canvas = document.createElement('canvas');
                canvas.width = videoElement.videoWidth;
                canvas.height = videoElement.videoHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
                return canvas.toDataURL('image/png');
            });

            const base64String = dataUrl.split(',')[1];
            const buffer = Buffer.from(base64String, 'base64');

            fs.writeFile(outputPath, buffer);

            console.log(`Frame saved to ${outputPath}`);
        } catch (error) {
            console.error('Error saving frame:', error);
        }

        // await recorder.stop();
        // console.log(bodyHTML);
    } catch (e) {
        console.log(e);
    } finally {
        await browser.close();
    }
})();