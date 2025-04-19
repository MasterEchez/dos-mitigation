const puppeteer = require('puppeteer');
const path = require('path');

async function openHTML(filePath) {
    const browser = await puppeteer.launch({
        acceptInsecureCerts: true,
    });
    const page = await browser.newPage();

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

    await page.screenshot({ path: 'screenshot.png' }); // Optional: take a screenshot
    console.log(`Opened ${fileURL}`);

    await browser.close();
}

openHTML('./puppeteer/jitsi-api-test.html');