'use strict';

const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        acceptInsecureCerts: true,
    });
    const page = await browser.newPage();

    await page.goto('https://s0');
    let bodyHTML = await page.evaluate(() => document.body.innerHTML);
    // console.log(bodyHTML);
    await page.type('#enter_room_field', 'dos-miti');

    await page.click('#enter_room_button');

    // await page.waitForNavigation();

    console.log('New Page URL:', page.url());

    await page.screenshot({path: 'meeting.png', fullPage: true});

    await browser.close();
})();