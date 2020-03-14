const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const request = require('request-promise');
const tool = require('./tool');

const getNestedObject = (nestedObj, pathArr) =>
  pathArr.reduce(
    (obj, key) => (obj && obj[key] !== undefined ? obj[key] : undefined),
    nestedObj,
  );

const url = 'https://projectdb.jst.go.jp/ja/grant/JST-PROJECT-17940390/';

const selector = '#listings-page > div.listing-footer > p > input[type="text"]';
async function main() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  try {
    await page.goto(url, {
      timeout: 30,
      waitUntil: 'networkidle0',
    });
  } catch (error) {
    tool.log(error);
  }


  // console.log(content);
  const $ = await cheerio.load(await page.content());

  console.log('cheerio: ', await $(selector).prop('tagName'));
  if (await $(selector).prop('tagName') === 'INPUT') {
    console.log(await $(selector).attr('value'));
  }
  if (await $(selector).prop('tagName') === 'P') {
    console.log(await $(selector).first().text());
  }
  await page.close();
  await browser.close();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testpup(browser, page) {
  for (let i = 1; i <= 10; i++) {
    let id = await browser.getId();
    while (id === -1 || !browser) {
      await sleep(3000);
      id = await browser.getId();
    }
    for (let tryCount = 0; tryCount < 3; tryCount += 1) {
      try {
        if (!page) {
          console.log('daa');
          page = await browser.newPage();
        }
        await page.goto(url);
        break;
      } catch (error) {
        counter = 0;
        // eslint-disable-next-line no-await-in-loop
        await sleep(3000);
      }
    }
    console.log(id);
  }
}

async function testpuppeteer() {
  console.log('test');
  const browser = await puppeteer.launch({
    headless: false,
  });
  browser.userCount = 0;
  browser.hasReset = 0;

  browser.on('disconnected', async () => {
    this.browser = await puppeteer.launch();
    console.log('browser crashed reset');
    this.browser.userCount = 0;
    this.browser.hasReset = 0;
  });

  browser.getId = async function () {
    if (this.userCount >= 40) {
      if (browser.hasReset === 1) return null;
      browser.hasReset = 1;
      browser.close();
      this.browser = await puppeteer.launch({
        headless: false,
      });
      browser.userCount = 0;
      browser.hasReset = 0;
      return null;
    }
    this.userCount++;
    return this.userCount;
  };
  const jobs = [];
  for (let i = 1; i <= 10; i++) {
    page = await browser.newPage();
    jobs.push(testpup(browser, page));
  }

  await Promise.all(jobs);
}
String.prototype.format = function () {
  let str = this.toString();
  if (arguments.length) {
    // eslint-disable-next-line
    const t = typeof arguments[0];
    // eslint-disable-next-line
    let args = arguments[0];
    if (t === 'string' || t === 'number')
    // eslint-disable-next-line
    {
      args = Array.prototype.slice.call(arguments);
    }

    // args ni array bol key=0,1,2..., object bol key ni property name-uud
    // eslint-disable-next-line
    for (key in args) {
      // eslint-disable-next-line
      str = str.replace(new RegExp(`\\{${key}\\}`, 'gi'), args[key]);
    }
  }
  return str;
};

async function postrequest() {
  list = [
    'dev_projects_all',
    'dev_projects',
    'dev_projects_ending_soon',
    'dev_projects_newest',
    'dev_projects_recently_successful',
  ];
  list1 = [
    'ART_CRAFT',
    'COMMUNITY_SOCIAL_GOOD',
    'DESIGN_FASHION',
    'ENVIRONMENTAL',
    'EVENTS',
    'FILM_VIDEO',
    'FOOD_DRINK',
    'MUSIC',
    'PERFORMANCE',
    'PUBLISHING_JOURNALISM',
    'RESEARCH',
    'TECHNOLOGY_GAMES',
    '',
  ];
  sum = 0;
  for (const type of list) {
    for (const cat of list1) {
      param = '{"requests":[{"indexName":"{0}","params":"query=&hitsPerPage=8&maxValuesPerFacet=20&page=0&highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&filters=(partnerKey%3APOZIBLE%20OR%20mirror%3AALL%20OR%20mirror%3APOZIBLE)%20AND%20startDate%20%3C%3D%201544847825&facets=%5B%22categoryKey%22%5D&tagFilters=&facetFilters=%5B%5B%22categoryKey%3A{1}%22%5D%5D"},{"indexName":"{0}","params":"query=&hitsPerPage=1&maxValuesPerFacet=20&page=0&highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&filters=(partnerKey%3APOZIBLE%20OR%20mirror%3AALL%20OR%20mirror%3APOZIBLE)%20AND%20startDate%20%3C%3D%201544847825&attributesToRetrieve=%5B%5D&attributesToHighlight=%5B%5D&attributesToSnippet=%5B%5D&tagFilters=&analytics=false&clickAnalytics=false&facets=categoryKey"}]}';
      param = param.format([type, cat]);
      response = await request.post({
        url: 'https://v83yvsz1xy-dsn.algolia.net/1/indexes/*/queries?x-algolia-agent=Algolia%20for%20vanilla%20JavaScript%203.30.0%3Breact-instantsearch%204.5.2%3BJS%20Helper%202.26.1&x-algolia-application-id=V83YVSZ1XY&x-algolia-api-key=2bd418d8358fb28e0a5b2fd60f33b2da',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
        },
        body: param,
      });

      count = getNestedObject(JSON.parse(response), ['results', '0', 'nbHits']);
      sum += count;
      console.log(count, type, cat);
    }
  }
  console.log('sum : ', sum);
}

async function postrequest1() {
  param = '{"requests":[{"indexName":"dev_projects_all","params":"query=&hitsPerPage=8&maxValuesPerFacet=20&page=124&highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&filters=(partnerKey%3APOZIBLE%20OR%20mirror%3AALL%20OR%20mirror%3APOZIBLE)&facets=%5B%22categoryKey%22%5D&tagFilters="}]}';
  response = await request.post({
    url: 'https://v83yvsz1xy-dsn.algolia.net/1/indexes/*/queries?x-algolia-agent=Algolia%20for%20vanilla%20JavaScript%203.30.0%3Breact-instantsearch%204.5.2%3BJS%20Helper%202.26.1&x-algolia-application-id=V83YVSZ1XY&x-algolia-api-key=2bd418d8358fb28e0a5b2fd60f33b2da',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: param,
  });

  count = getNestedObject(JSON.parse(response), ['results', '0', 'nbHits']);
  console.log(response);
}

async function testCNKI() {
  const browser = await puppeteer.launch({
    headless: false,
  });

  browser.on('targetcreated', async target => {
    if (target.url().includes('gb.oversea.cnki.net/kns55/popup')) {
      try {
        const p = await target.page();
        console.log(new Date());
        await sleep(20000);
        console.log(new Date());
        try {
          await p.evaluate(() => document.getElementById('ULSelected').innerHTML = '<li id="li_0001"><input type="checkbox" checked="true" onclick="removeSelected(this);" id="chb_0001" value="0001"><label id="lbl_0001" title="管理单位:国家自然科学基金" for="chb_0001">国家自然科学基金</label></li>');
        } catch (er) {
          console.log(er);
        }
        await sleep(3000);
        await p.click('#ibtOk');
      } catch (e) {
        console.log(e);
      }
    }
  });

  const page = await browser.newPage();
  await page.goto('http://gb.oversea.cnki.net/kns55/brief/result.aspx?dbPrefix=CJFD', {
    timeout: 180000,
    waitUntil: 'networkidle0',
  });
  await page.click('#\\31_5');
  await page.click('#\\36 81673live80054370 > div:nth-child(1) > img');
  // //*[@id="searchdiv"]/dd/dl/dd/a
  await sleep(3000);
  await page.click('#searchdiv > dd > dl > dd > a');
  await sleep(30000);

  await page.click('#btnSearch');
}

async function testProcess() {
  const list = [];
  for (let i = 0; i < 10; i += 1) {
    const lst = [];
    for (let j = 0; j <= i; j += 1) {
      lst.push(1);
    }
    list.push(lst);
  }

  let processIndex = 0;
  async function process() {
    while (processIndex < list.length) {
      const l = list[processIndex];
      processIndex += 1;
      for (let j = 0; j < l.length; j += 1) {
        await sleep(1000);
      }
      console.log('say hello ', l.length);
    }
  }

  const processs = [];
  for (let i = 0; i < 2; i += 1) {
    processs.push(process());
  }

  await Promise.all(processs);
}

// postrequest1();
// main();
// testpuppeteer();
// postrequest();

// testProcess();

// testCNKI();

console.log('DAVAADORJ');
