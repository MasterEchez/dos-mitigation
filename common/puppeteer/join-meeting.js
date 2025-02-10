'use strict';

const puppeteer = require('puppeteer');
const process = require('process');
const [ clientName ] = process.argv.slice(2);

(async () => {
    const browser = await puppeteer.launch({
        acceptInsecureCerts: true,
    });
    const page = await browser.newPage();

    await page.goto('https://s0');
    let bodyHTML = await page.evaluate(() => document.body.innerHTML);
    await page.screenshot({path: 'home.png', fullPage: true});
    // console.log(bodyHTML);
    await page.type('#enter_room_field', 'dos-miti');

    await Promise.all([
        page.waitForNavigation(),
        page.click('#enter_room_button'),
    ]);

    console.log('New Page URL:', page.url());

    bodyHTML = await page.evaluate(() => document.body.innerHTML);
    await page.type('#premeeting-name-input', clientName);
    await page.screenshot({path: 'meeting.png', fullPage: true});
    // console.log(bodyHTML);
    
    await Promise.all([
        page.click('.primary'),
        new Promise(resolve => setTimeout(resolve, 3000)),
    ]);
    bodyHTML = await page.evaluate(() => document.body.innerHTML);
    await page.screenshot({path: 'in-meeting.png', fullPage: true});
    console.log(bodyHTML);

    await browser.close();
})();