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
        await iframe.type('#premeeting-name-input', clientName);
        await iframe.click('.primary');

        while (Date.now() < expStartDateTime) {
            // console.log("a");
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        const logs = await iframe.evaluate( async (expEndTimeStamp) => {
            const pc = APP.conference._room.jvbJingleSession.peerconnection;
            const interval = 500; // .5 seconds
            let lastStats = {};
            const statsHistory = [];

            const collectStats = async () => {
                const now = Date.now();
                const reportPromise = pc.getStats();
                const jitsiStats = APP.conference.getStats();
                const report = await reportPromise;
                const stats = { 
                    timestamp: now,
                    jitsi_jvb_rtt: jitsiStats.jvbRTT,
                    jitsi_bandwidth_download: jitsiStats.bandwidth.download,
                    jitsi_bandwidth_upload: jitsiStats.bandwidth.upload,
                    jitsi_bitrate_download: jitsiStats.bitrate.download,
                    jitsi_bitrate_upload: jitsiStats.bitrate.upload,
                    jitsi_packetloss_total: jitsiStats.packetLoss.total,
                    jitsi_packetloss_download: jitsiStats.packetLoss.download,
                    jitsi_packetloss_upload: jitsiStats.packetLoss.upload,
                };
                report.forEach(stat => {
                    if (
                        (stat.type === "inbound-rtp" || stat.type === "outbound-rtp") &&
                        stat.kind === "video" &&
                        stat.framesPerSecond !== undefined
                    ) {
                        const direction = stat.type === 'inbound-rtp' ? 'download' : 'upload';
                        const id = stat.id;
                        
                        const bytesKey = `${id}_bytes`;
                        const timeKey = `${id}_time`;

                        const bytes = stat.bytesReceived || stat.bytesSent || 0;
                        const lastBytes = lastStats[bytesKey] || bytes;
                        const lastTime = lastStats[timeKey] || now;

                        const deltaTimeSec = (now - lastTime) / 1000;
                        const deltaBytes = bytes - lastBytes;
                        const bitrateKbps = deltaTimeSec > 0 ? (deltaBytes * 8) / deltaTimeSec / 1000 : 0;
                        
                        [["bitrateKbps", bitrateKbps],
                        ["framesPerSecond", stat.framesPerSecond],
                        ["packetsSent", stat.packetsSent],
                        ["packetsReceived", stat.packetsReceived],
                        ["packetsLost", stat.packetsLost],
                        ["bytes", bytes]].map((pair) => {
                            stats[`rtc_${pair[0]}_${direction}`] = pair[1];
                        });

                        // stats[`rtc_stat_${direction}`] = {
                        //     bitrateKbps,
                        //     framesPerSecond: stat.framesPerSecond,
                        //     packetsSent: stat.packetsSent,
                        //     packetsReceived: stat.packetsReceived,
                        //     packetsLost: stat.packetsLost,
                        //     bytes
                        // };

                        // update lastStats
                        lastStats[bytesKey] = bytes;
                        lastStats[timeKey] = now;
                    }
                });
                statsHistory.push(stats);
            };

            const statsInterval = setInterval(collectStats, interval);

            while (Date.now() < expEndTimeStamp) {
                console.log(Date().toString());
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            
            clearInterval(statsInterval);
            return statsHistory;
        }, expEndDateTime.getTime());

        // console.log(logs);
        // console.log(logs[0]);
        // console.log(logs[logs.length-1]);
        // console.log(logs.length);

        // console.log(logs.filter( (value) => value.stats.transport !== undefined && value.stats.transport.length !== 0).length);
        const refinedLogs = logs;
        // logs.filter( (value) => value.stats.transport !== undefined && value.stats.transport.length !== 0)
        //     .map( (value) => {
        //         return {
        //             timestamp: value.time,
        //             jvb_rtt: value.stats.jvbRTT,
        //             bandwidth_download: value.stats.bandwidth.download,
        //             bandwidth_upload: value.stats.bandwidth.upload,
        //             bitrate_download: value.stats.bitrate.download,
        //             bitrate_upload: value.stats.bitrate.upload,
        //             packetloss_total: value.stats.packetLoss.total,
        //             packetloss_download: value.stats.packetLoss.download,
        //             packetloss_upload: value.stats.packetLoss.upload
        //         }
        //     });

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