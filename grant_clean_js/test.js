// require('dotenv').config();
const regex = new RegExp();
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const request = require('request-promise');
const utf8 = require('utf8');

let urls = `http://bayareataxinc.com;
http://kiacarnival.com.au;
http://www.hudforeclosures.ws;
http://www.fluoro2therapeutics.com/; 
http://www.balkonfilms.com;
http://www.fitness-freak.com/;
http://www.cardable.co.uk;
http://liamalexanderphoto.com;
http://www.fuzion.ie/;
http://www.masaccounts.co.uk;
http://www.unicorninterglobal.com;
https://thesoundgaarden.com/;
http://rapidflowtech.com/;
http://www.ibuddy.life/;
http://getpipar.com/;
https://consolety.com;
https://jmcsocial.com;
http://www.poplarnetwork.com;
http://www.epsauctions.com;
http://www.management3.com;
http://www.wowevents.com/;
http://www.rvuuz.com;
http://stylereply.com;
http://www.tekclasses.com/;
https://www.accuvein.com/;
http://www.sylleta.com/;
https://shipsy.in/;
http://e-go-mobile.com/en/;
http://www.zonproducts.com/;
http://iotamotion.com/;
http://www.dataclassification.com;
https://dowridgecapital.com/shant-atikian;
http://fordtransitsydney.com.au;
http://www.bohemiatouch.eu;
https://carnegieconcierge.com;
https://thetechpie.com/2018/04/sennheiser-hd-598cs-review.html;
http://www.minionlabs.tech/;
http://www.yottamark.com/;
http://www.kibbi.io/;
http://www.neurogeneticpharmaceuticals.com;
http://projectlibre.org/;
http://www.dontbetinvest.com/;
http://www.pharmaxp.com;
http://www.swisshausbakery.com;
http://www.masstracktech.com;
http://www.railsjobs.co.uk;
http://www.tswind.com/;
http://roadstar.ai/;
http://www.missionmode.com;
http://www.broadcastwear.com/;
http://www.crazymikesapps.com;
https://www.appbubo.com;
http://fortamus.com;
http://www.supercheapstorage.com.au;
https://coinium.app;
http://www.guruexpresstakeaway.co.uk/;
http://seomanchester.site;
http://www.lerentech.com;
http://www.hidnseek.com;
https://pristinesearch.com;
http://www.xvisiotech.com`;

const urlList = urls.split(";");
async function test(urlList){

const browser = await puppeteer.launch();
const page = await browser.newPage();
for(url of urlList){
  try{
  await page.goto(url,
      {
        timeout: 30000,
        waitUntil: 'networkidle0'
      });
      let html = await page.content();
      console.log("=====================");
      console.log(url);
      console.log("=====================");
    } 
    catch(error){
      console.log('=== URL === '+url);
      console.error(error);
    }
}
}
test(urlList);
// // eslint-disable-next-line no-unused-vars
// const convert = (from, to) => str => Buffer.from(str, from).toString(to);


// async function getHtml(url, tag = '', classId = '', classIdName = '') {
//   const response = await request.get(url);
//   let $ = await cheerio.load(response, { decodeEntities: false });

//   try {
//     if (tag === '' && classId === '' && classIdName === '') {
//       return $.html();
//     }

//     if (classId.toLowerCase() == 'class') {
//       let classNames = [];
//       let selectorStr = '';
//       if (classIdName.indexOf('.') > 0) {
//         classNames = classIdName.split('.');
//       } else if (classIdName.indexOf(' ') > 0) {
//         classNames = classIdName.split(' ');
//       } else {
//         classNames.push(classIdName);
//       }
//       selectorStr = classNames.join('.');
//       // var list = [];
//       // $(tag+'.'+selectorStr).each(function(i,elem){
//       //     list.push($(this).html());
//       // });//.find("a").each(function(i, elem){
//       //     console.log(list);
//       $("div#pagebodypad").each(function (i, elem) {
//         $(this).find("pas").text().trim() == "" ? console.log("aa") : console.log("bb");
//       });
//     } else if (classId.toLowerCase() == 'id') {
//       console.log($(`${tag}#${classIdName}`));
//     }

//     // listAuthors = [];

//     //     listAuthors.push(($(this)).html());
//     // });
//     // console.log(listAuthors);
//     // each(function(i, elem){
//     // console.log("elementuud: "+$(this).find("a").html());
//     // });//soup.find(tag,classIdName); //, {classId : classIdName});
//     // $1 = cheerio.load($,{ decodeEntities: false });
//     // $2 = $1("tr");
//     // console.log($2.html());
//   } catch (error) {
//     console.log(`error: ${error}`);
//     return null;
//   }
//   return $.html();
// }
// const tt = getHtml('http://news.gogo.mn', 'div', 'class', 'news-thumb');

// // tt.then(function(result) {
// //    console.log(result) // "Some User token"
// // })
// function cleanHtml(html) {
//   html = html.replace(/(\r\n|\n|\r|\s)/gm, ' ');
// }
