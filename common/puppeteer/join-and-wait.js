'use strict';

const puppeteer = require('puppeteer');
const process = require('process');
const [ clientName, videoFilepath, minutes ] = process.argv.slice(2);
const { PuppeteerScreenRecorder } = require("puppeteer-screen-recorder");

const fromNow = Date.now() + 1000 * 60 * Number(minutes);

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
        const recorder = new PuppeteerScreenRecorder(page);
        // await recorder.start("join-meeting.mp4");

        await page.goto(`https://s0/dos-miti#${meetArgs.join('&')}`);
        // bodyHTML = await page.evaluate(() => document.body.innerHTML);
        await page.type('#premeeting-name-input', clientName);
        // await page.screenshot({path: 'meeting.png', fullPage: true});
        
        // console.log(bodyHTML);
        
        await Promise.all([
            page.click('.primary'),
            new Promise(resolve => setTimeout(resolve, 2000)),
        ]);

        // while (Date.now() < fromNow) {
        //     console.log(Date().toString());
        //     try {
        //         const vars = await page.evaluate( () => {
        //             const allVariables = [];
        //             allVariables.push(['stats', APP.conference.getStats()]);
        //             allVariables.push(['connection state', APP.conference._room.getConnectionState()]);
        //             return allVariables;
        //         });
        //         vars.forEach(ele => console.log(ele[0], ele[1]));
        //     } catch (e) {
        //         console.log(e);
        //     }
        //     await new Promise(resolve => setTimeout(resolve, 1000));
        // }
        await new Promise(resolve => setTimeout(resolve, 1000 * 60 * Number(minutes)));
        
        // await recorder.stop();
        // await page.screenshot({path: 'in-meeting.png', fullPage: true});
        // bodyHTML = await page.evaluate(() => document.body.innerHTML);
        // console.log(bodyHTML);
    } catch (e) {
        console.log(e);
    } finally {
        await browser.close();
    }
})();