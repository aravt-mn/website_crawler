const request = require('request-promise');
const cheerio = require('cheerio');
const tool = require('../../tool');
const Entities = require('html-entities').XmlEntities;

const entities = new Entities();

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
    if (query.post_param == null) return [];
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

async function main(browser, query, params, startDate) {
  try {
    let listPage = null;

    // get request
    const listUrlCombinations = await getListQueryCombination(query, params);

    // conbinations
    const combinations = listUrlCombinations;

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
        let pageNum = startPageNumber; pageNum <= endPageNumber && pageNum < 10000; pageNum += 1
      ) {
        try {
          // eslint-disable-next-line
          let url = query.url;

          // if request type is GET

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

          // Request
          let response = null;
          let browserJobId = null;

          // GET Request

          browserJobId = browser.getJobId();
          // eslint-disable-next-line no-await-in-loop
          let id = browser.getId();
          while (id === -1) {
            browser.setRemoveJobById(browserJobId);
            // eslint-disable-next-line no-await-in-loop
            await tool.sleep(3000);
            id = browser.getId();
            listPage = null;
            tool.log('WAITING MAIN PROCESS * ', query.site_id);
          }
          browser.setRemoveJobById(browserJobId);

          browserJobId = browser.getJobId();
          // send get request
          for (let tryCount = 0; tryCount < 3; tryCount += 1) {
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
              // when get html success then break loop
              // eslint-disable-next-line no-await-in-loop
              break;
            } catch (error) {
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

          browser.setRemoveJobById(browserJobId);


          if (response) {
            // Response
            let blocks = null;
            let $ = null;

            // Response Type HTML

            // create cheerio
            // eslint-disable-next-line no-await-in-loop
            $ = await cheerio.load(response, {
              normalizeWhitespace: true,
              xmlMode: true,
            });


            // get blocks from cheerio
            // eslint-disable-next-line no-await-in-loop
            const mainContent = cheerio.load(await $('#contents').html());
            // eslint-disable-next-line no-await-in-loop
            const tagList = await mainContent('h3, table');
            blocks = [];
            let tmpHtml = '';
            let hasHtml = false;
            for (let tagNum = 0; tagNum <= tagList.length; tagNum += 1) {
              try {
                const tagName = mainContent(tagList[tagNum]).prop('tagName');
                if (tagName === 'H3') {
                  hasHtml = true;
                  tmpHtml = `<h3>${mainContent(tagList[tagNum]).html()}</h3>`;
                }
                if (tagName === 'TABLE') {
                  if (hasHtml) {
                    tmpHtml += `${mainContent(tagList[tagNum]).html()}`.replace('tbody', 'table');
                    hasHtml = false;
                    blocks.push(tmpHtml);
                  }
                }
              } catch (error) {}
            }

            // tbody > tr:nth-child(1) > td
            // Get DTL
            if (!blocks || blocks.length === 0) {
              // eslint-disable-next-line
              continue;
            }

            for (let j = 0; j < blocks.length; j += 1) {
              // eslint-disable-next-line no-await-in-loop
              let title = '';
              let researcher = '';
              let institute = '';
              let text = '';
              // eslint-disable-next-line no-await-in-loop
              const block = await cheerio.load(blocks[j].replace('caption', 'h1').replace('caption', 'h1'));
              // eslint-disable-next-line no-await-in-loop
              title += await block('h3').first().text();
              // eslint-disable-next-line no-await-in-loop
              title += await block('table tr td').first().text();
              // eslint-disable-next-line no-await-in-loop
              text += await block('h1').first().text();
              // eslint-disable-next-line
              institute = text.split(' ')[0];
              for (let k = 1; k < text.split(' ').length; k += 1) {
                researcher += text.split(' ')[k];
              }
              console.log(title);
              // eslint-disable-next-line no-await-in-loop
              await tool.insertCrawledInfo(
                query.site_id,
                null,
                null,
                title,
                null,
                url,
                null,
                null,
                null,
                researcher,
                null,
                institute,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                new Date(),
              );
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

module.exports = main;
