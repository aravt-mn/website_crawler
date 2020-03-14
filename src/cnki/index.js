const request = require('request-promise');
const cheerio = require('cheerio');
const tool = require('./tool');

// eslint-disable-next-line no-extend-native
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

async function getListParamCombination(query, params) {
  let listRet = null;
  try {
    if (query.post_param == null) return [query.post_param];
    if (params == null) return [query.post_param];
    const listParams = params.map(param => param.paramList);
    const combinationQuerys = tool.cartesian(listParams);
    listRet = combinationQuerys.map(l => query.post_param.format(l));
    if (listRet.length < 1) return [query.post_param];
  } catch (error) {
    tool.log(error);
  }
  return listRet;
}

async function getListQueryCombination(query, params) {
  let listRet = null;
  try {
    if (params == null) return [query.url];
    const listParams = params.map(param => param.paramList);
    const combinationQuerys = tool.cartesian(listParams);
    listRet = combinationQuerys.map(l => query.url.format(l));
    if (listRet.length < 1) return [query.url];
  } catch (error) {
    tool.log(error);
  }
  return listRet;
}

async function crawl(browser, query, params, startDate) {
  try {
    let listPage = null;
    // post request
    const listParamCombinations = await getListParamCombination(query, params);

    // get request
    const listUrlCombinations = await getListQueryCombination(query, params);

    // conbinations
    let combinations = null;
    if (query.request_type.toUpperCase() === 'CNKI'.toUpperCase()) combinations = listUrlCombinations;
    if (query.request_type === 'POST') combinations = listParamCombinations;

    // start page number "1-23" -> 1
    const startPageNumber = tool.getStartPageNumber(query.page_range);

    // end page number when "1-23" -> 23 whe "1-*" -> Infinity
    const endPageNumber = tool.getEndPageNumber(query.page_range);


    const parseConfig = await tool.getParseConfig(query.id);

    // foreach all url combination
    // eslint-disable-next-line
    for (const comb of combinations) {
      // foreach all pagination
      for (
        let pageNum = startPageNumber; pageNum <= endPageNumber && pageNum < 1000000; pageNum += 1
      ) {
        try {
          // eslint-disable-next-line
          let url = query.url;

          // if request type is GET
          if (query.request_type.toUpperCase() === 'CNKI'.toUpperCase()) {
            url = comb.format({
              page: pageNum,
            });

            // eslint-disable-next-line no-await-in-loop
            if (await tool.isInLog(url)) {
              tool.log('already crawled url: ', url);
              // eslint-disable-next-line
              continue;
            }
            tool.log('url case: ', url);
          }

          // if request type is POST
          if (query.request_type === 'POST') {
            url = url.format({
              page: pageNum,
            });

            // eslint-disable-next-line no-await-in-loop
            if (await tool.isInLog(comb)) {
              tool.log('already crawled url: ', comb);
              // eslint-disable-next-line
              continue;
            }

            tool.log('param case: ', comb);
          }

          // Request
          let response = null;
          let browserJobId = null;

          // GET Request
          if (query.request_type.toUpperCase() === 'CNKI'.toUpperCase()) {
            // eslint-disable-next-line no-await-in-loop
            browserJobId = browser.getJobId();
            while (browser.getId() === '-1') {
              if (browserJobId) {
                browser.setRemoveJobById(browserJobId);
                browserJobId = null;
              }
              // eslint-disable-next-line no-await-in-loop
              await tool.sleep(3000);
              listPage = null;
              tool.log('LIST WAITING MAIN PROCESS * ', query.site_id);
            }
            if (browserJobId === null) {
              browserJobId = browser.getJobId();
            }

            // send get request
            for (let tryCount = 0; tryCount < 5; tryCount += 1) {
              try {
                // browser counter ++
                if (!listPage) {
                  // eslint-disable-next-line no-await-in-loop
                  listPage = await browser.getBrowser().newPage();
                }
                // access to projects list
                // eslint-disable-next-line no-await-in-loop
                await listPage.goto(url, {
                  timeout: 180000,
                  waitUntil: 'networkidle0',
                });

                // get projects list html
                if (query.response_type === 'HTML') {
                  // eslint-disable-next-line no-await-in-loop
                  response = await listPage.content();
                }

                // Browser-аар хандахад ирсэн JSON html > body > pre дотор string хэлбэрээр ирдэг
                if (query.response_type === 'JSON') {
                  // eslint-disable-next-line no-await-in-loop
                  response = await listPage.$eval('pre', el => el.textContent);
                }
                browser.setRemoveJobById(browserJobId);
                // when get html success then break loop
                // eslint-disable-next-line no-await-in-loop
                break;
              } catch (error) {
                browser.setRemoveJobById(browserJobId);
                try {
                  // eslint-disable-next-line no-await-in-loop
                  if (listPage) await listPage.close();
                } catch (e) {
                  tool.log(e);
                }
                tool.log('retry');
                // eslint-disable-next-line no-await-in-loop
                await tool.sleep(5000);
                listPage = null;
              }
            }
          }

          // POST Request
          if (query.request_type === 'POST') {
            // send post request
            // eslint-disable-next-line no-await-in-loop
            response = await request.post({
              url,
              headers: {
                'content-type': 'application/x-www-form-urlencoded',
              },
              body: comb,
            });
          }
          if (response) {
            // Response
            let blocks = null;
            let $ = null;

            // Response Type JSON
            if (query.response_type === 'JSON') {
              // get blocks from json
              blocks = tool.getNestedObject(
                JSON.parse(response),
                query.block_name.split('.'),
              );
            }

            // Response Type HTML
            if (query.response_type === 'HTML') {
              // create cheerio
              // eslint-disable-next-line no-await-in-loop
              $ = await cheerio.load(response, {
                normalizeWhitespace: true,
                xmlMode: true,
              });

              if (!response.includes('国家自然科学基金')) {
                console.log('NOT PROJECT');
                continue;
              }

              // get blocks from cheerio
              // eslint-disable-next-line no-await-in-loop
              blocks = await $(query.block_name);
            }
            // tbody > tr:nth-child(1) > td
            // Get DTL
            if (!blocks || blocks.length === 0) {
              // eslint-disable-next-line
              continue;
            }

            for (let j = 0; j < blocks.length; j += 1) {
              let block = blocks[j];
              let link = null;
              if (query.response_type === 'HTML') {
                block = cheerio.load(response);

                if (!query.detail_path || query.detail_path.split('::')[0].trim() === '') {
                  if (query.detail_path === null) {
                    link = url;
                  } else {
                    link = $(blocks[j]).attr('href');
                  }
                }
              }


              try {
                // get crawl info
                // eslint-disable-next-line no-await-in-loop
                listPage = await tool.crawlInfo(
                  query,
                  url,
                  browser,
                  listPage,
                  block,
                  parseConfig,
                  startDate,
                  link,
                );
              } catch (error) {
                tool.log('unpossible error: ', error);
              }
            }


            if (query.request_type === 'GET') {
              // eslint-disable-next-line no-await-in-loop
              await tool.setLog(url);
            }

            if (query.request_type === 'POST') {
              // eslint-disable-next-line no-await-in-loop
              await tool.setLog(comb);
            }

            try {
              // eslint-disable-next-line no-await-in-loop
              await listPage.close();
            } catch (error) {
              console.log('tab reset error: ', error);
            }
            listPage = null;
          }
        } catch (error) {
          tool.log('error: ', error);
        }
      }
      tool.log(endPageNumber);
    }
  } catch (error) {
    tool.log(error);
  }
  tool.log('Query Crawl finished');
}

module.exports = {
  crawl,
};
