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
        await recorder.start(`join-and-log-start_${expStartDateTime}-window_${windowLengthNum}.mp4`.replace(/\s+/g, '').replace(/[()]/g, ''));
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
            // console.log("a");
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        while (Date.now() < expEndDateTime) {
            const time = Date.now();
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
        // console.log(logs[0]);
        // console.log(logs[logs.length-1]);
        // console.log(logs.length);

        // console.log(logs.filter( (value) => value.stats.transport !== undefined && value.stats.transport.length !== 0).length);
        const refinedLogs = logs.filter( (value) => value.stats.transport !== undefined && value.stats.transport.length !== 0)
            .map( (value) => {
                return {
                    timestamp: value.time,
                    jvb_rtt: value.stats.jvbRTT,
                    bandwidth_download: value.stats.bandwidth.download,
                    bandwidth_upload: value.stats.bandwidth.upload,
                    bitrate_download: value.stats.bitrate.download,
                    bitrate_upload: value.stats.bitrate.upload,
                    packetloss_total: value.stats.packetLoss.total,
                    packetloss_download: value.stats.packetLoss.download,
                    packetloss_upload: value.stats.packetLoss.upload
                }
            });

        // console.log(refinedLogs[0]);
        // console.log(refinedLogs[refinedLogs.length-1]);
        // console.log(refinedLogs.length);

        const headers = Object.keys(refinedLogs[0]);
        const csvRows = [];

        csvRows.push(headers.join(","));

        for (const row of refinedLogs) {
            const values = headers.map((header) => {
                const cellValue = row[header];
                return typeof cellValue === 'string' ? `"${cellValue.replace(/"/g, '""')}"` : cellValue;
            });
            csvRows.push(values.join(","));
        }
        const csvOutput = csvRows.join("\n");

        // console.log(csvOutput);

        const logDir = `/tmp/logs`;
        await fs.mkdir(logDir, {recursive: true});

        const logStatsPath = `${logDir}/jitsi.csv`;
        await fs.writeFile(logStatsPath, csvOutput);

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