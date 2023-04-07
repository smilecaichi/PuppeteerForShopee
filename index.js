const puppeteer = require('puppeteer');

const fs = require('fs');
const axios = require('axios')
const FormData = require('form-data'); // npm install --save form-data

require('dotenv').config();

const webhook_url = process.env.webhook_url;
const oauthToken = process.env.oauthToken;

const loginKey = process.env.USER_ID;
const password = process.env.USER_PW;

(async () => {
  let date_time = new Date();

  // get current date
  // adjust 0 before single digit date
  let date = ('0' + date_time.getDate()).slice(-2);

  // get current month
  let month = ('0' + (date_time.getMonth() + 1)).slice(-2);

  // get current year
  let year = date_time.getFullYear();

  // get current hours
  let hours = ('0' + date_time.getHours()).slice(-2);

  // get current minutes
  let minutes = ('0' + date_time.getMinutes()).slice(-2);

  // get current seconds
  let seconds = ('0' + date_time.getSeconds()).slice(-2);

  // prints date & time in YYYY-MM-DD HH:MM:SS format
  let dt = year + '_' + month + '_' + date + '_' + hours + '_' + minutes + '_' + seconds;

  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: null
  });
  const page = await browser.newPage();
  await page.goto('https://shopee.tw/buyer/login?from=https%3A%2F%2Fshopee.tw%2Fuser%2Fcoin&next=https%3A%2F%2Fshopee.tw%2Fshopee-coins');

  await page.type('input[name=loginKey]', loginKey);
  await new Promise(r => setTimeout(r, 1000));

  await page.type('input[name=password]', password);
  await new Promise(r => setTimeout(r, 1000));

  await page.click('xpath//html/body/div[1]/div/div[2]/div/div/div/div[2]/form/div/div[2]/button');

  await page.waitForNavigation();

  //使用連結驗證
  try {
    const path = '/html/body/div[1]/div/div[2]/div/div/div/div[1]/div/div[2]/div/button/div[2]'
    await page.waitForXPath(path);
    let [el] = await page.$x(path);
    const names = await page.evaluate(name => name.innerText, el);
    if (names === '使用連結驗證') {
      await page.click('xpath//html/body/div[1]/div/div[2]/div/div/div/div[1]/div/div[2]/div/button');
    }

    await new Promise(r => setTimeout(r, 60000));

    await page.screenshot({ path: filePath });

    await browser.close();
  } catch (e) {

  }

  //領取蝦幣
  await page.click('xpath//html/body/div[1]/div/div[2]/div/main/section[1]/div[1]/div/section/div[2]/button');
  await new Promise(r => setTimeout(r, 3000));

  const fileName = 'shopee_' + dt + '.png';
  const filePath = 'pic/' + fileName;
  await page.screenshot({ path: filePath });

  let [el] = await page.$x('/html/body/div[1]/div/div[2]/div/main/section[1]/div[1]/div/section/a/p')
  const text = await page.evaluate(name => name.innerText, el)

  /*
  const data = new URLSearchParams();
  data.append('message', '訊息 from Node.js');
  data.append('imageFile', './shopee.png');
  */

  const form = new FormData();
  form.append('message', '\n蝦皮_' + dt + '\n蝦幣獎勵 ' + text);
  form.append('imageFile', fs.createReadStream(filePath));

  axios.post(webhook_url, form, {
    headers: {
      'content-type': 'application/x-www-form-urlencoded;charset=utf-8',
      'Authorization': 'Bearer ' + oauthToken
    }
  }).then(res => {
    console.log(`statusCode: ${res.status}`)
    //console.log(res)
  }).catch(error => {
    console.error(error)
  });

  await browser.close();
})();