const {
  Pool,
} = require('pg');
const moment = require('moment');
const urlparser = require('url');
const cheerio = require('cheerio');
require('dotenv').config();
const log4js = require('log4js');
const html2json = require('html2json').html2json;
const Entities = require('html-entities').XmlEntities;
const LanguageDetect = require('languagedetect');

const entities = new Entities();

let logName = 'log';
const LngDetector = new LanguageDetect();

async function checkContent(content) {
  try {
    const lngs = LngDetector.detect(content);
    let lan;
    if (lngs.length > 0) {
      if (lngs[0].length > 0) {
        [[lan]] = lngs;
      }
    }

    return lan || 'not-detected';
  } catch (error) {
    return 'error';
  }
}

async function isEnglishText(text) {
  return 'english' == (await checkContent(text))
}

log4js.configure({
  appenders: {
    cheese: {
      type: 'file',
      filename: './data/logs/info.log',
    },
  },
  categories: {
    default: {
      appenders: ['cheese'],
      level: 'error',
    },
  },
});

let logger = log4js.getLogger();
logger.level = 'info';
logger.filename = './data/logs/info.log';

function setLogName(name) {
  logName = name;

  log4js.configure({
    appenders: {
      cheese: {
        type: 'file',
        filename: `./data/logs/${logName}.log`,
      },
    },
    categories: {
      default: {
        appenders: ['cheese'],
        level: 'error',
      },
    },
  });
  logger = log4js.getLogger();
  logger.level = 'info';
  logger.filename = `./data/logs/${logName}.log`;
}

let pool = null;

function log(message, ...optionalParams) {
  logger.info(message, optionalParams);
  console.log(message, optionalParams);
}

function createConnection() {
  if (!pool) pool = new Pool();
  return pool;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function closeConnections() {
  if (!pool) return;
  try {
    await pool.end();
    pool = null;
  } catch (e) {
    log(e);
  }
}

async function runQuery({
  connection,
  query,
  params = [],
}) {
  return connection.query(query, params);
}

async function getLastActivity() {
  const connection = createConnection();
  let query = 'SELECT a.* FROM grant_activity a WHERE a.end_date IS NULL AND (a.site_id IS NULL or a.site_id = 0) ORDER BY a.start_date DESC LIMIT 1';

  const activitys = (await runQuery({
    connection,
    query,
  })).rows;

  log(activitys);

  if (activitys.length > 0 && activitys[0].end_date === null) {
    return activitys[0];
  }

  query = 'INSERT INTO grant_activity(start_date) VALUES($1)';
  await runQuery({
    connection,
    query,
    params: [new Date()],
  });
  // eslint-disable-next-line no-return-await
  return await getLastActivity();
}

async function getLastSiteActivity(siteId, beginDate) {
  const connection = createConnection();
  let query = 'SELECT * FROM grant_activity a WHERE a.start_date >= $1 AND a.site_id = $2';
  const activitys = (await runQuery({
    connection,
    query,
    params: [beginDate, siteId],
  })).rows;

  if (activitys.length > 0) return activitys[0];

  query = 'INSERT INTO grant_activity(start_date, site_id) VALUES($1, $2)';
  await runQuery({
    connection,
    query,
    params: [new Date(), siteId],
  });
  // eslint-disable-next-line no-return-await
  return await getLastSiteActivity(siteId, beginDate);
}

async function createActivity() {
  const connection = createConnection();
  const query = 'INSERT INTO grant_activity(start_date) VALUES($1)';
  await runQuery({
    connection,
    query,
    params: [new Date()],
  });
  // eslint-disable-next-line no-return-await
  return await getLastActivity();
}

async function setEndDateLastActivity(id) {
  const connection = createConnection();
  const query = 'UPDATE grant_activity SET end_date = $1 WHERE id = $2';
  await runQuery({
    connection,
    query,
    params: [new Date(), id],
  });
}

async function getConfiguredSites(sitesIds) {
  const connection = createConnection();
  // get not crawled sites
  const query = `SELECT a.* FROM grant_sites a 
        INNER JOIN grant_sites_query b ON a.id = b.site_id 
        WHERE b.crawl_status = 0 AND a.id IN (${sitesIds.join(',')}) 
        GROUP BY a.id, a.name, a.url, a.name_en, a.url_en, a.active `;

  const companyList = (await runQuery({
    connection,
    query,
  })).rows;
  return companyList;
}

async function getSiteQuery(siteId) {
  const connection = createConnection();
  // get not crawled query
  const query = `SELECT a.* FROM grant_sites_query a 
        WHERE a.site_id = $1 AND a.crawl_status = 0`;
  const companyList = (await runQuery({
    connection,
    query,
    params: [siteId],
  })).rows;
  return companyList;
}

async function getQueryParams(queryId) {
  const connection = createConnection();
  // get query params
  const query = 'SELECT a.* FROM grant_sites_query_param a WHERE a.query_id = $1 ORDER BY order_number ASC';
  const companyList = (await runQuery({
    connection,
    query,
    params: [queryId],
  })).rows;
  return companyList;
}

async function getParseConfig(queryId) {
  const connection = createConnection();

  // get query  crawl config
  const query = 'SELECT a.* FROM grant_sites_query_parse_config a WHERE a.query_id = $1';
  const parseConfigs = (await runQuery({
    connection,
    query,
    params: [queryId],
  })).rows;
  return parseConfigs[0];
}

async function clearLog() {
  const connection = createConnection();
  const query = 'truncate grant_page_log';
  await runQuery({
    connection,
    query,
  });
}

async function setLog(param) {
  const connection = createConnection();
  const query = 'INSERT INTO grant_page_log(param) VALUES($1)';
  await runQuery({
    connection,
    query,
    params: [param],
  });
}

async function isInLog(param) {
  const connection = createConnection();
  // get not crawled sites
  const query = 'SELECT id FROM grant_page_log WHERE param = $1 LIMIT 1';
  const listLogs = (await runQuery({
    connection,
    query,
    params: [param],
  })).rows;
  if (listLogs && listLogs.length > 0) return true;
  return false;
}

async function getSitesIds() {
  const connection = createConnection();
  // get not crawled sites
  const query = 'SELECT id FROM grant_sites WHERE active = true';
  const sitesIds = [];
  const sites = (await runQuery({
    connection,
    query,
  })).rows;

  for (let i = 0; i < sites.length; i += 1) {
    sitesIds.push(sites[i].id);
  }
  return sitesIds;
}

async function insertCrawledInfo(
  grantSitesId,
  projectId,
  projectIdOriginal,
  title,
  titleEn,
  projectUrl,
  keyword,
  keywordEn,
  source,
  researcher,
  researcherEn,
  institution,
  country,
  currency,
  awardAmount,
  awardAmountUsd,
  fundedDate,
  startDate,
  projectTerm,
  startYear,
  endYear,
  description,
  descriptionRaw,
  descriptionEn,
  endDate,
  crawl_date,
  html

) {

  // let titleEn_tmp = titleEn;
  // if (!(await isEnglishText(titleEn))) {
  //   titleEn_tmp = null;
  // }

  // let keywordEn_tmp = keywordEn;
  // if (!(await isEnglishText(keywordEn))) {
  //   keywordEn_tmp = null;
  // }

  // let researcherEn_tmp = researcherEn;
  // if (!(await isEnglishText(researcherEn))) {
  //   researcherEn_tmp = null;
  // }

  // let descriptionEn_tmp = descriptionEn;
  // if (!(await isEnglishText(descriptionEn))) {
  //   descriptionEn_tmp = null;
  // }
  
  // create connection
  const connection = createConnection();
  // crawled info to site info
  const query = `INSERT INTO grant_crawled_new(
    grant_sites_id, 
    project_id,
    project_id_original,
    title,
    title_en,
    project_url,
    keyword,
    keyword_en,
    source,
    researcher,
    researcher_en,
    institution,
    country,
    currency,
    award_amount,
    award_amount_usd,
    funded_date,
    start_date,
    project_term,
    start_year,
    end_year,
    description,
    description_raw,
    description_en,
    end_date,
    crawled_date,
    html
  )
    VALUES(
        $1, 
        $2, 
        $3, 
        $4, 
        $5, 
        $6, 
        $7, 
        $8, 
        $9, 
        $10, 
        $11, 
        $12, 
        $13, 
        $14, 
        $15, 
        $16, 
        $17, 
        $18, 
        $19, 
        $20, 
        $21, 
        $22, 
        $23, 
        $24, 
        $25, 
        $26, 
        $27
        ) RETURNING id`;
  var results = await runQuery({
    connection,
    query,
    params: [
      grantSitesId,
      projectId,
      projectIdOriginal,
      title,
      titleEn,
      projectUrl,
      keyword,
      keywordEn,
      source,
      researcher,
      researcherEn,
      institution,
      country,
      currency,
      awardAmount,
      awardAmountUsd,
      fundedDate,
      startDate,
      projectTerm,
      startYear,
      endYear,
      description,
      descriptionRaw,
      descriptionEn,
      endDate,
      new Date(),
      html,
    ],
  });
  return results.rows[0]['id'];
}




function extractQueryParam(queryParam) {
  if (queryParam.type === 'range') {
    const params = queryParam.param.split('-');
    // eslint-disable-next-line no-param-reassign
    queryParam.paramList = [];
    // eslint-disable-next-line radix
    for (let i = parseInt(params[0]); i <= parseInt(params[1]); i += 1) {
      queryParam.paramList.push(i);
    }
  }
  if (queryParam.type === 'list') {
    const json = JSON.parse(queryParam.param);
    // eslint-disable-next-line no-param-reassign
    queryParam.paramList = json.list;
  }
}

const getNestedObject = (nestedObj, pathArr) =>
  pathArr.reduce(
    (obj, key) => (obj && obj[key] !== undefined ? obj[key] : undefined),
    nestedObj,
  );

function cartesian(arrs) {
  // arrs = array of array
  if (!arrs || arrs.length === 0) return arrs;
  const result = [];
  const [arr, ...tail] = arrs;
  const ps = cartesian(tail);
  if (!arr) return result;
  arr.forEach(e => {
    if (ps && ps.length) {
      ps.forEach(p => {
        result.push([e, ...p]);
      });
    } else result.push([e]);
  });
  return result;
}

function cartesian2(xss) {
  const end = xss.length - 1;
  const result = [];

  function expandProduct(product, idx) {
    const xs = xss[idx];
    const last = idx === end;
    for (let i = 0; i < xs.length; i += 1) {
      const copy = product.slice();
      copy.push(xs[i]);
      if (last) {
        result.push(copy);
      } else {
        expandProduct(copy, idx + 1);
      }
    }
  }
  if (xss.length) {
    expandProduct([], 0);
  } else {
    result.push([]);
  }
  return result;
}

function getStartPageNumber(pageRange) {
  if (!pageRange) return 1;
  return parseInt(pageRange.split('-')[0], 10);
}

function getEndPageNumber(pageRange) {
  if (!pageRange) return 1;
  if (pageRange.split('-')[1] === '*') return Infinity;
  return parseInt(pageRange.split('-')[1], 10);
}

/*
const template = '/{0}/?country={1}&type={2}&lang={3}&page={page}';
const pageTemplate = formatString(template, ['art', 'FR', 't1', 'en']);

Ингэж нэг нэгээр нь өгж дуудсан ч болно.
const pageTemplate = formatString(template, 'art', 'FR', 't1', 'en');

Объект өгвөл property  нэрийг нь олж утгаар нь сольно
const result = formatString(pageTemplate, { page: 12 });
result === '/art/?country=FR&type=t1&lang=en&page=12'
*/

function formatString(str, ...values) {
  let formatedStr = str;
  if (values.length) {
    const t = typeof values[0];
    const args = t === 'string' || t === 'number'
      ? Array.prototype.slice.call(values)
      : values[0];

    // if args === array key = 0,1,2..., if args === object key = object
    // eslint-disable-next-line no-restricted-syntax, guard-for-in
    for (const key in args) {
      formatedStr = formatedStr.replace(
        new RegExp(`\\{${key}\\}`, 'gi'),
        args[key],
      );
    }
  }
  return formatedStr;
}

async function isCrawledUrl(dtlLink, startDate) {
  const connection = createConnection();
  // get query params
  const query = 'SELECT a.* FROM grant_crawled_new a WHERE a.project_url = $1 AND a.crawled_date > $2 LIMIT 1';
  const infos = (await runQuery({
    connection,
    query,
    params: [dtlLink, startDate],
  })).rows;
  if (infos.length > 0) return true;
  return false;
}

function removeNewLine(text) {
  if (text) return text.replace(/(\r\n\t|\n|\r\t)/gm, ' ');
  return text;
}

function LCS(a, b) {
  const m = a.length;

  const n = b.length;

  const C = [];

  let i;

  let j;

  for (i = 0; i <= m; i += 1) C.push([0]);
  for (j = 0; j < n; j += 1) C[0].push(0);
  for (i = 0; i < m; i += 1) {
    for (j = 0; j < n; j += 1) {
      C[i + 1][j + 1] = a[i] === b[j] ? C[i][j] + 1 : Math.max(C[i + 1][j], C[i][j + 1]);
    }
  }

  const result = (function bt(i, j) {
    if (i * j === 0) {
      return '';
    }
    if (a[i - 1] === b[j - 1]) {
      return bt(i - 1, j - 1) + a[i - 1];
    }
    return C[i][j - 1] > C[i - 1][j] ? bt(i, j - 1) : bt(i - 1, j);
  }(m, n));

  const resLen = result.length;
  const totMaxLen = Math.max(a.length, b.length);

  return resLen / totMaxLen;
}

// return only numbers
function getNumber(text) {
  if (!text) {
    return null;
  }

  let result = '';
  let hasDot = false;
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === '0' || text[i] === '1' || text[i] === '2' || text[i] === '3' || text[i] === '4' || text[i] === '5' || text[i] === '6' || text[i] === '7' || text[i] === '8' || text[i] === '9') {
      result += text[i];
    }
    if (text[i] === '.') {
      if (!hasDot) {
        result += text[i];
        hasDot = true;
      }
    }
  }

  if (result && result.length > 0) {
    return result;
  }
  return null;
}

// return currency from text $ ₮ ...
function getCurrency(text) {
  if (!text) {
    return null;
  }

  const regex = /[\$\xA2-\xA5\u058F\u060B\u09F2\u09F3\u09FB\u0AF1\u0BF9\u0E3F\u17DB\u20A0-\u20BD\uA838\uFDFC\uFE69\uFF04\uFFE0\uFFE1\uFFE5\uFFE6]|euro|VND|NOK|SEK|VNĐ/g;

  const m = regex.exec(text);

  if (m && m[0]) {
    return m[0];
  }
  return null;
}

// parse date
function getDateRegex(text, rules, type, units) {
  if (!text || text.length === 0) {
    return null;
  }

  let result = null;
  log(text);
  if (type === 'date') {
    log('Parsing: =>  ', text, rules);
    result = new Date(moment(text, rules).format('YYYY-MM-DD'));
    result = result.toString() === 'Invalid Date' ? null : result;
    log('Parsed: => ', result);
  } else {
    let unit = '';
    let unitScore = 0;

    units.map(x => {
      const score = LCS(x, text);
      if (score > unitScore) {
        unitScore = score;
        unit = x;
      }
    });

    const value = parseInt(getNumber(text), 10);

    // log('unit: ', unit, 'value', value);

    if (type === 'add') {
      result = new Date(
        moment()
          .add(value, unit)
          .format('YYYY-MM-DD'),
      );
    } else {
      result = new Date(
        moment()
          .subtract(value, unit)
          .format('YYYY-MM-DD'),
      );
    }
    log('SubDate: => ', result);
  }

  return result;
}

// implement rule from database
function getHandleRule(text, regex) {
  text = text.replace(/(\r\n\t|\n|\r\t)/gm, "  "); 

  if (!text || !regex) {
    return null;
  }
  const reg = new RegExp(`${regex}`, 'g');
  const m = reg.exec(text);
  
  if (m && m[1]) {
    return m[1];
  }
  return null;
}

function getkNumber(val) {
  if (!val) {
    return null;
  }
  let result = 0;
  val = val.toString();

  // convert "Xk" "Xm" to number
  if (/\d[kmbt]\b/gm.test(val)) {
    val = val.replace(',', '.');

    const b = val.split(' ');

    b.forEach(x => {
      if (typeof parseFloat(x) === 'number' && !isNaN(parseFloat(x))) {
        result = x.trim().toLowerCase();
      }
    });

    const multiplier = result.substr(-1).toLowerCase();

    if (multiplier === 'k') {
      return parseFloat(result) * 1000;
    }
    if (multiplier === 'm') {
      return parseFloat(result) * 1000000;
    }
    if (multiplier === 'b') {
      return parseFloat(result) * 1000000000;
    }
    if (multiplier === 't') {
      return parseFloat(result) * 1000000000000;
    }
    return getNumber(val);
  }
  if (val.toLowerCase().includes('milion') || val.toLowerCase().includes('million') || val.toLowerCase().includes('milions') || val.toLowerCase().includes('millions')) {
    return getNumber(val) * 1000000;
  }
  if (val.toLowerCase().includes('bilion') || val.toLowerCase().includes('billion') || val.toLowerCase().includes('bilions') || val.toLowerCase().includes('billions')) {
    return getNumber(val) * 1000000;
  }
  return getNumber(val);
}

// default value of features
// TO-DO
function cleanAutoRule(text, featureName) {
  if (!text) {
    return null;
  }

  if (featureName === 'currency') {
    return getCurrency(text);
  }
  if (
    featureName === 'award_amount'
    || featureName === 'award_amount_usd'
  ) {
    return parseInt(getkNumber(text), 10);
  }

  if (
    featureName === 'project_id'
    || featureName === 'project_id_original'
    || featureName === 'title'
    || featureName === 'title_en'
    || featureName === 'keyword'
    || featureName === 'keyword_en'
    || featureName === 'source'
    || featureName === 'researcher'
    || featureName === 'researcher_en'
    || featureName === 'institution'
    || featureName === 'country'
    || featureName === 'project_term'
    || featureName === 'description'
    || featureName === 'description_raw'
    || featureName === 'description_en'
  ) {
    text = text.toString();
    text = text.replace(/\r?\n?/g, '');
    text = text.trim();
  }

  return text;
}

function cleanFeature(text, featureName, regex) {
  if (regex) {
    if (
      featureName === 'start_date'
      || featureName === 'end_date'
      || featureName === 'funde_date'
    ) {
      const dateConfig = JSON.parse(regex);
      return getDateRegex(
        text,
        dateConfig.rules,
        dateConfig.type,
        dateConfig.units,
      );
    }
    return cleanAutoRule(getHandleRule(text, regex), featureName);
  }
  return cleanAutoRule(text, featureName);
}

function getTextFromCheerio(cheerioBlock, path) {
  let ret;
  try {
    const tagName = cheerioBlock(path).prop('tagName');
    if (tagName === 'INPUT') {
      ret = cheerioBlock(path).attr('value');
      return ret;
    }
  } catch (error) {
    log('undefined tagName');
  }
  ret = cheerioBlock(path).first().text();
  return ret;
}

function getBlockFromCheerio(cheerioBlock, path) {
  let ret;
  try {
    const tagName = cheerioBlock(path).prop('tagName');
    if (tagName === 'INPUT') {
      ret = cheerioBlock(path).attr('value');
      return ret;
    }
  } catch (error) {
    log('undefined tagName');
  }
  ret = cheerioBlock(path).first().html();
  return ret;
}

function parseElement(query, path, block, dtl, featureName) {
  if (!path) return null;
  try {
    let ret = null;
    const listPath = path.split('||');
    let pathIndex = 0;
    while ((ret === null || ret === '-1') && pathIndex < listPath.length) {
      const values = listPath[pathIndex].split(';');

      if (values[0] === '1') {
        if (query.response_type === 'JSON') {
          ret = getNestedObject(block, values[1].split('.'));
        }
        if (query.response_type === 'HTML') {
          ret = getTextFromCheerio(block, values[1]);
        }
      }
      if (values[0] === '2') {
        ret = getTextFromCheerio(dtl, values[1]);
      }

      if (values[0] === '3') {
        // SUM
        ret = '-1';
        if (values[1].split('::type::').length > 1) {
          if (values[1].split('::type::')[1] === 'json') {
            block(values[1].split('::type::')[0]).each(function (i, elem) {
              // eslint-disable-next-line
              if (ret === '-1') ret = '';
              else ret += ', ';

              // eslint-disable-next-line
              ret += block(this).html();
            });
            const json = html2json(ret);

            ret = entities.decode(JSON.stringify(json).toString());
          }
        } else {
          block(values[1]).each(function (i, elem) {
            // eslint-disable-next-line
            if (ret === '-1') ret = '';
            else ret += ', ';

            // eslint-disable-next-line
            ret += block(this).text();
          });
        }
      }

      if (values[0] === '4') {
        // SUM
        ret = '-1';
        if (values[1].split('::type::').length > 1) {
          if (values[1].split('::type::')[1] === 'json') {
            dtl(values[1].split('::type::')[0]).each(function (i, elem) {
              // eslint-disable-next-line
              if (ret === '-1') ret = '';
              else ret += ', ';

              // eslint-disable-next-line
              ret += dtl(this).html();
            });
            const json = html2json(ret);

            ret = entities.decode(JSON.stringify(json).toString());
          }
        } else {
          dtl(values[1]).each(function (i, elem) {
            // eslint-disable-next-line
            if (ret === '-1') ret = '';
            else ret += ', ';

            // eslint-disable-next-line
            ret += dtl(this).text();
          });
        }
        // ret = `${values[1].split('::type::').length}`;
      }

      if (values[0] === '10') {
        if (query.response_type === 'JSON') {
          ret = getNestedObject(block, values[1].split('.'));
        }
        if (query.response_type === 'HTML') {
          ret = getBlockFromCheerio(block, values[1]);
        }
      }

      const handleReg = values[2] ? values[2] : null;
      ret = cleanFeature(ret, featureName, handleReg);


      if (
        featureName === 'start_date'
        || featureName === 'end_date'
        || featureName === 'funde_date'
      ) {
        if (ret === '-1') {
          ret = null;
          // log('WARNING ============>', featureName, ret, typeof ret);
        }
      }
      pathIndex += 1;
    }

    return ret;
  } catch (error) {
    log(error);
    return null;
  }
}

async function updateCrawledInfo(
  grantSitesId,
  projectId,
  projectIdOriginal,
  title,
  titleEn,
  projectUrl,
  keyword,
  keywordEn,
  source,
  researcher,
  researcherEn,
  institution,
  country,
  currency,
  awardAmount,
  awardAmountUsd,
  fundedDate,
  startDate,
  projectTerm,
  startYear,
  endYear,
  description,
  descriptionRaw,
  descriptionEn,
  endDate,
  id,
) {

  let titleEn_tmp = titleEn;
  if (!(await isEnglishText(titleEn))) {
    titleEn_tmp = null;
  }

  let keywordEn_tmp = keywordEn;
  if (!(await isEnglishText(keywordEn))) {
    keywordEn_tmp = null;
  }

  let researcherEn_tmp = researcherEn;
  if (!(await isEnglishText(researcherEn))) {
    researcherEn_tmp = null;
  }

  let descriptionEn_tmp = descriptionEn;
  if (!(await isEnglishText(descriptionEn))) {
    descriptionEn_tmp = null;
  }

  // create connection
  const connection = createConnection();
  // crawled info to site info
  const query = `update grant_crawled_new set
    grant_sites_id = $1, 
    project_id = $2,
    project_id_original = $3,
    title = $4,
    title_en = $5,
    project_url = $6,
    keyword = $7,
    keyword_en = $8,
    source = $9,
    researcher = $10,
    researcher_en = $11,
    institution = $12,
    country = $13,
    currency = $14,
    award_amount = $15,
    award_amount_usd = $16,
    funded_date = $17,
    start_date = $18,
    project_term = $19,
    start_year = $20,
    end_year = $21,
    description = $22,
    description_raw = $23,
    description_en = $24,
    end_date = $25,
    crawled_date = $26
    where id = $27`;
  await runQuery({
    connection,
    query,
    params: [
      grantSitesId,
      projectId,
      projectIdOriginal,
      title,
      titleEn_tmp,
      projectUrl,
      keyword,
      keywordEn_tmp,
      source,
      researcher,
      researcherEn_tmp,
      institution,
      country,
      currency,
      awardAmount,
      awardAmountUsd,
      fundedDate,
      startDate,
      projectTerm,
      startYear,
      endYear,
      description,
      descriptionRaw,
      descriptionEn_tmp,
      endDate,
      new Date(),
      id,
    ],
  });
}



async function reClean(datas){
  let parser = require('./grant_clean_js/'+datas['site_id']);
  let ret = null;

  ret = await parser.parse(datas);
  return ret;
}


function getDtlUrl(Url, link) {
  let dtlLink = null;
  if (Url && link) {
    const url = Url.trim();
    dtlLink = link.trim();
    try {
      if (dtlLink.startsWith('//')) {
        return `http:${dtlLink}`;
      }
      if (dtlLink[0] === '/') {
        return (
          (dtlLink.startsWith('https://') ? 'https://' : 'http://')
          + urlparser.parse(url).hostname
          + dtlLink
        );
      }
    } catch (error) {
      log('url dtl error:', error);
    }
  }
  return dtlLink;
}

async function crawlInfo(
  query,
  url,
  browser,
  browserPage,
  block,
  parseConfig,
  startDate,
  link,
  block_html,
) {
  // console.log('html: ',block_html);
  let dtlPage = browserPage;
  try {
    let dtlLink = null;
    if (link) {
      dtlLink = link;
    } else {
      if (query.response_type === 'HTML') {
        // get dtl_link from block
        dtlLink = block(
          query.detail_path.split('::').length > 1
            ? query.detail_path.split('::')[0]
            : query.detail_path,
        )
          .first()
          .attr('href');
      }
      if (query.response_type === 'JSON') {
        dtlLink = getNestedObject(
          block,
          (query.detail_path.split('::').length > 1
            ? query.detail_path.split('::')[0]
            : query.detail_path
          ).split('.'),
        );
      }
    }

    let dtlUrl = '';
    if (query.detail_path) {
      if (query.detail_path.split('::').length > 1) {
        dtlUrl = `${query.detail_path.split('::')[1]}${dtlLink}`;
        if (query.detail_path.split('::').length > 2) {
          dtlUrl += query.detail_path.split('::')[2];
        }
      } else {
        dtlUrl = await getDtlUrl(url, dtlLink);
      }
    } else {
      dtlUrl = dtlLink;
    }

    // is crawled link
    if (await isCrawledUrl(dtlUrl, startDate) && query.detail_path) {
      log('crawled_url: ', dtlUrl);
      return dtlPage;
    }

    log('dtl link: ', dtlUrl);
    let browserJobId = null;
    // eslint-disable-next-line no-await-in-loop
    browserJobId = browser.getJobId();
    while (browser.getId() === -1) {
      browser.setRemoveJobById(browserJobId);
      browserJobId = null;
      // eslint-disable-next-line no-await-in-loop
      await sleep(3000);
      dtlPage = null;
      log('DTL WAITING MAIN PROCESS * ', query.site_id);
    }
    if (browserJobId === null) {
      browserJobId = browser.getJobId();
    }

    // let dtlHtml
    let dtlHtml = '';

    for (let tryCount = 0; tryCount < 5; tryCount += 1) {
      try {
        if (!dtlPage) {
          // eslint-disable-next-line no-await-in-loop
          dtlPage = await browser.getBrowser().newPage();
        }
        // new tab to dtl_lint
        if (dtlUrl) {
          // eslint-disable-next-line no-await-in-loop
          await dtlPage.goto(dtlUrl, {
            timeout: 30000,
            waitUntil: 'networkidle0',  
          },);
          let passLoadingSc = "Just a moment...";
          try{
            let elem = await dtlPage.$("html > head > title ");
            let text = await (await elem.getProperty('textContent')).jsonValue();
            if(text == passLoadingSc){
              await dtlPage.waitForNavigation();
            }
          }catch(err){

          }
          // eslint-disable-next-line no-await-in-loop
          dtlHtml = await dtlPage.content();

        }
        browser.setRemoveJobById(browserJobId);
        // eslint-disable-next-line no-await-in-loop
        break;
      } catch (error) {
        browser.setRemoveJobById(browserJobId);
        try {
          // eslint-disable-next-line no-await-in-loop
          await dtlPage.close();
        } catch (e) {
          console.log(error);
        }
        log('dtl error', query.site_id);
        // eslint-disable-next-line no-await-in-loop
        await sleep(5000);
        dtlPage = null;
      }
    }
    
    // cheerio of dtl_link
    const dtlCheerio = await cheerio.load(dtlHtml);
    const projectId = await parseElement(query, parseConfig.project_id, block, dtlCheerio, 'project_id');
    const projectIdOriginal = await parseElement(query, parseConfig.project_id_original, block, dtlCheerio, 'project_id_original');
    const title = await parseElement(query, parseConfig.title, block, dtlCheerio, 'title');
    const titleEn = await parseElement(query, parseConfig.title_en, block, dtlCheerio, 'title_en');
    // const projectUrl = await parseElement(query, parseConfig.category, block, dtlCheerio, 'category');
    const keyword = await parseElement(query, parseConfig.keyword, block, dtlCheerio, 'keyword');
    const keywordEn = await parseElement(query, parseConfig.keyword_en, block, dtlCheerio, 'keyword_en');
    const source = await parseElement(query, parseConfig.source, block, dtlCheerio, 'source');
    const researcher = await parseElement(query, parseConfig.researcher, block, dtlCheerio, 'researcher');
    const researcherEn = await parseElement(query, parseConfig.researcher_en, block, dtlCheerio, 'researcher_en');
    const institution = await parseElement(query, parseConfig.institution, block, dtlCheerio, 'institution');
    const country = await parseElement(query, parseConfig.country, block, dtlCheerio, 'country');
    const currency = await parseElement(query, parseConfig.currency, block, dtlCheerio, 'currency');
    const awardAmount = await parseElement(query, parseConfig.award_amount, block, dtlCheerio, 'award_amount');
    const awardAmountUsd = await parseElement(query, parseConfig.award_amount_usd, block, dtlCheerio, 'award_amount_usd');
    const fundedDate = await parseElement(query, parseConfig.funded_date, block, dtlCheerio, 'funded_date');
    const startsDate = await parseElement(query, parseConfig.start_date, block, dtlCheerio, 'start_date');
    const endDate = await parseElement(query, parseConfig.end_date, block, dtlCheerio, 'end_date');
    const projectTerm = await parseElement(query, parseConfig.project_term, block, dtlCheerio, 'project_term');
    const startYear = await parseElement(query, parseConfig.start_year, block, dtlCheerio, 'start_year');
    const endYear = await parseElement(query, parseConfig.end_year, block, dtlCheerio, 'end_year');
    const description = await parseElement(query, parseConfig.description, block, dtlCheerio, 'description');
    const descriptionRaw = await parseElement(query, parseConfig.description_raw, block, dtlCheerio, 'description_raw');
    const descriptionEn = await parseElement(query, parseConfig.description_en, block, dtlCheerio, 'description_en');
    const projectUrl = dtlUrl;
    const html = block_html;

   
      var insertedId = await insertCrawledInfo(
        query.site_id,
        projectId,
        projectIdOriginal,
        title,
        titleEn,
        projectUrl,
        keyword,
        keywordEn,
        source,
        researcher,
        researcherEn,
        institution,
        country,
        currency,
        awardAmount,
        awardAmountUsd,
        fundedDate,
        startsDate,
        projectTerm,
        startYear,
        endYear,
        description,
        descriptionRaw,
        descriptionEn,
        endDate,
        new Date(),
        html
      );
        
    const datas = {
      'site_id':query.site_id,
      'project_id':projectId,
      'project_id_original':projectIdOriginal,
      'title':title,
        'title_en':titleEn,
        'project_url':projectUrl,
        'keyword':keyword,
        'keyword_en':keywordEn,
        'source':source,
        'researcher':researcher,
        'researcher_en':researcherEn,
        'institution':institution,
        'country':country,
        'currency':currency,
        'award_amount':awardAmount,
        'award_amount_usd':awardAmountUsd,
        'funded_date':fundedDate,
        'start_date':startsDate,
        'project_term':projectTerm,
        'start_year':startYear,
        'end_year':endYear,
        'description':description,
        'description_raw':descriptionRaw,
        'description_en':descriptionEn,
        'end_date':endDate,
        'html': html,
        'dtl_html': dtlHtml,
      };
        
      
      let htmlPath = './data';
      var fs = require('fs')
      if (!fs.existsSync(htmlPath)) {
        fs.mkdirSync(htmlPath);
        }
        let filePath = htmlPath+'/html_'+insertedId.toString()+'.html';
      fs.writeFile(filePath, dtlHtml, function(err) {
          if(err) {
              console.log(err);
          } else {
              console.log("The file was saved!");
          }
      }); 
      const cleanedDatas = await reClean(datas);
      await updateCrawledInfo(
        query.site_id,
        cleanedDatas['project_id'],
        cleanedDatas['project_id_original'],
        cleanedDatas['title'],
        cleanedDatas['title_en'],
        cleanedDatas['project_url'],
        cleanedDatas['keyword'],
        cleanedDatas['keyword_en'],
        cleanedDatas['source'],
        cleanedDatas['researcher'],
        cleanedDatas['researcher_en'],
        cleanedDatas['institution'],
        cleanedDatas['country'],
        cleanedDatas['currency'],
        cleanedDatas['award_amount'],
        cleanedDatas['award_amount_usd'],
        cleanedDatas['funded_date'],
        cleanedDatas['start_date'],
        cleanedDatas['project_term'],
        cleanedDatas['start_year'],
        cleanedDatas['end_year'],
        cleanedDatas['description'],
        cleanedDatas['description_raw'],
        cleanedDatas['description_en'],
        cleanedDatas['end_date'],
        insertedId,
      );


    return dtlPage;
  } catch (error) {
    log('getInfo: ', error);
    return null;
  }
}

module.exports = {
  getConfiguredSites,
  getSiteQuery,
  getQueryParams,
  extractQueryParam,
  cartesian,
  getStartPageNumber,
  getEndPageNumber,
  getParseConfig,
  insertCrawledInfo,
  formatString,
  getNestedObject,
  removeNewLine,
  cartesian2,
  isCrawledUrl,
  getLastActivity,
  createActivity,
  setEndDateLastActivity,
  closeConnections,
  sleep,
  parseElement,
  getDtlUrl,
  crawlInfo,
  setLog,
  isInLog,
  clearLog,
  getLastSiteActivity,
  getSitesIds,
  log,
  setLogName,
};
