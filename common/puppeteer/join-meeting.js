'use strict';

const puppeteer = require('puppeteer');
const process = require('process');
const [ clientName ] = process.argv.slice(2);
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
        '--use-file-for-fake-video-capture=./bigbuckbunny.mjpeg',
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
        ];

        const page = await browser.newPage();

        await page.goto(`https://s0/dos-miti#${meetArgs.join('&')}`);
        let bodyHTML = await page.evaluate(() => document.body.innerHTML);
        await page.type('#premeeting-name-input', clientName);
        // await page.screenshot({path: 'meeting.png', fullPage: true});
        
        // console.log(bodyHTML);
        
        await Promise.all([
            page.click('.primary'),
            new Promise(resolve => setTimeout(resolve, 2000)),
        ]);
        
        await page.evaluate(() => {
            document.getElementById("remoteVideos").style.display = "none";
            document.querySelector('[aria-label="Jitsi Meet Logo, links to  Homepage"]').style.display = "none";
        });
        await new Promise(resolve => setTimeout(resolve, 5000));
        await page.screenshot({path: 'in-meeting.png', fullPage: true});
        // bodyHTML = await page.evaluate(() => document.body.innerHTML);
        // console.log(bodyHTML);
    } catch (e) {
        console.log(e);
    } finally {
        await browser.close();
    }
})();