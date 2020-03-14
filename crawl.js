const puppeteer = require('puppeteer');
const crawler = require('./crawl_by_query');
const tool = require('./tool');
const jaxa = require('./src/jaxa');
const snf = require('./src/snf');
const csnki = require('./src/cnki2');
require('dotenv').config();


class Browser {
  // let browser;
  // let count;
  // let hasReset;
  constructor(browser) {
    this.count = 0;
    this.hasReset = 0;
    this.browserJobs = [];
    this.browser = browser;
  }

  setBrowser(browser) {
    this.browser = browser;
  }

  getBrowser() {
    return this.browser;
  }

  async resetBrowser() {
    try {
      let undoneJobsCount = 1;
      let waitCount = 0;
      while (undoneJobsCount > 0 && waitCount < 60) {
        // eslint-disable-next-line no-await-in-loop
        await tool.sleep(1000);
        waitCount += 1;
        undoneJobsCount = 0;
        for (let i = 0; i < this.browserJobs.length; i += 1) {
          undoneJobsCount += this.browserJobs[i];
        }
        tool.log('waiting other process', undoneJobsCount);
      }
      try {
        await this.browser.close();
      } catch (error) {
        tool.log('testtestest');
      }

      this.browser = await puppeteer.launch();
      // {
      //   headless: false,
      // }
      this.browser.on('disconnected', () => {
        this.count = 1000;
        this.hasReset = 1;
        tool.log('Browser Crushed');
      });
      this.count = 0;
      this.hasReset = 0;
      this.browserJobs = [];
      tool.log('Reset Browser');
    } catch (error) {
      tool.log(error);
    }
  }

  getId() {
    if (this.count > 100) {
      if (this.hasReset === 1) return -1;
      this.hasReset = 1;
      this.resetBrowser();
      return -1;
    }
    this.count += 1;
    return this.count;
  }

  getJobId() {
    if (!this.browserJobs) this.browserJobs = [];
    const id = this.browserJobs.length;
    this.browserJobs[id] = 1;
    return id;
  }

  setRemoveJobById(id) {
    if (id === null) return;
    if (!this.browserJobs) this.browserJobs = [];
    if (id < this.browserJobs.length) this.browserJobs[id] = 0;
  }
}

async function getCrawlByQuery(browser, query, startDate) {
  const paramList = await tool.getQueryParams(query.id);
  paramList.forEach(element => {
    tool.extractQueryParam(element);
  });
  if (query.request_type.toUpperCase() === 'GET'.toUpperCase()) {
    await crawler.crawl(browser, query, paramList, startDate);
  }
  if (query.request_type.toUpperCase() === 'POST'.toUpperCase()) {
    await crawler.crawl(browser, query, paramList, startDate);
  }

  if (query.request_type.toUpperCase() === 'JAXA'.toUpperCase()) {
    await jaxa(browser, query, paramList, startDate);
  }

  if (query.request_type.toUpperCase() === 'SNF'.toUpperCase()) {
    await snf.crawl(browser, query, paramList, startDate);
  }

  if (query.request_type.toUpperCase() === 'CNKI'.toUpperCase()) {
    await csnki.crawl(browser, query, paramList, startDate);
  }
}

async function crawlSite(browser, siteId, startDate) {
  try {
    await tool.log(`start site id : ${siteId}`);
    const activity = await tool.getLastSiteActivity(siteId, startDate);
    // Crawl хийгээд дуусцан сайт байвал алгасах
    if (activity.end_date && activity.end_date > activity.start_date) return;
    const queryList = await tool.getSiteQuery(siteId);
    for (let i = 0; i < queryList.length; i += 1) {
      // crawl by query
      // eslint-disable-next-line no-await-in-loop
      await getCrawlByQuery(browser, queryList[i], startDate);
    }
    await tool.setEndDateLastActivity(activity.id);
    await tool.log(`completed site id : ${siteId}`);
  } catch (error) {
    tool.log(error);
  }
}

async function crawl() {
  if (!process.env.MAX_TAB_COUNT) {
    console.log('MAX_TAB_COUNT config not found!');
    return;
  }
  // continue - crawl-daad avtsan baigaa projectuudaa
  // algasaad shineer nemegdsen bolon hamgiin suuld zogsson hesegees urgeljlene
  // start - shineer bugdiig n crawldaj ehelne
  let processType = 'start';
  // eslint-disable-next-line
  if (process.argv && process.argv.length && process.argv.length > 2) processType = process.argv[2];

  // id nuud tohiruulsan companies deer ajillah
  let hasCom = false;
  let siteIds = [];
  for (let i = 0; i < process.argv.length; i += 1) {
    const argument = process.argv[i];
    if (hasCom) {
      // eslint-disable-next-line
      siteIds.push(argument);
    }
    if (argument === 'sites') hasCom = true;
  }

  if (siteIds.length < 1) {
    siteIds = await tool.getSitesIds();
  }

  let activity;
  switch (processType) {
    case 'continue':
      {
        activity = await tool.getLastActivity();
        break;
      }
    default:
      {
        activity = await tool.createActivity();
        await tool.clearLog();
      }
  }

  tool.setLogName(activity.start_date.toISOString());

  const siteList = await tool.getConfiguredSites(siteIds);

  // browser
  const chronium = await puppeteer.launch();
  // {
  //   headless: false,
  // }
  const browser = await new Browser(chronium);

  const jobs = [];
  console.log('TEST: ', siteList);
  let processIndex = 0;
  async function subProcess(b, a) {
    while (processIndex < siteList.length) {
      const site = siteList[processIndex];
      processIndex += 1;
      // eslint-disable-next-line no-await-in-loop
      await crawlSite(b, site.id, a.start_date);
    }
  }

  for (let i = 0; i < process.env.MAX_TAB_COUNT; i += 1) {
    let id = browser.getId();
    while (id === -1) {
      // eslint-disable-next-line no-await-in-loop
      await tool.sleep(20000);
      id = browser.getId();
    }
    jobs.push(subProcess(browser, activity));
  }
  try {
    await Promise.all(jobs);
  } catch (error) {
    tool.log('eroooor ');
  }
  tool.log('finished');

  await tool.setEndDateLastActivity(activity.id);
  tool.log('closed connection');
  await tool.closeConnections();
  tool.log('browser closed');
  await browser.browser.close();
}

crawl();
