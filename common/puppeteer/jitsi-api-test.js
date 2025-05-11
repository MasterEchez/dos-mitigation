const puppeteer = require('puppeteer');
const path = require('path');

// clientName = clientName on jitsi
// clientVideoFilePath = file used to stream vid
// scenario = UB (unmitigated baseline), MB (mitigated baseline), UA (unmitigated attack), MA (mitigated attack)
// windowLength = length of pre-attack, during attack, post-attack windows in seconds
// expStartTime = linux time when experiment starts, used for starting record-frame.js script
const [ clientName, videoFilepath, minutes ] = process.argv.slice(2);
const recordFramesPath = "./puppeteer/record-frames.js";
const { PuppeteerScreenRecorder } = require("puppeteer-screen-recorder");

const fromNow = Date.now() + 1000 * 60 * Number(minutes);


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

async function openHTML(filePath) {
    
    const browser = await puppeteer.launch({
        acceptInsecureCerts: true,
        args: chromeArgs,
    });
    const page = await browser.newPage();
    const recorder = new PuppeteerScreenRecorder(page);
    await recorder.start("join-meeting.mp4");

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
        await iframe.type('#premeeting-name-input', clientName);
        await iframe.click('.primary');
        await iframe.waitForSelector('#largeVideo');
        await iframe.waitForFunction('document.querySelector("#largeVideo").readyState >= 2');


        await new Promise(resolve => setTimeout(resolve, 1000));

        while (Date.now() < fromNow) {
            console.log(Date().toString());
            try {
                const vars = await iframe.evaluate( () => {
                    const allVariables = [];
                    allVariables.push(['stats', APP.conference.getStats()]);
                    allVariables.push(['connection state', APP.conference._room.getConnectionState()]);
                    return allVariables;
                });
                vars.forEach(ele => console.log(ele[0], ele[1]));
            } catch (e) {
                console.log(e);
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // const vars = await iframe.evaluate( () => {
        //     const allVariables = [];
        //     allVariables.push(APP.conference.getStats());
        //     allVariables.push(APP.conference._room.getConnectionState());
        //     return allVariables;
        // });

        // vars.forEach(ele => console.log(ele));

    } catch (e) {
        console.log(e);
    } finally {
        await recorder.stop();
        await browser.close();
    }
}

openHTML('./puppeteer/jitsi-api-test.html');