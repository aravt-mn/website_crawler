const cheerio = require('cheerio');

function checkText(text) {
    if (text == null) 
        return null;
    if (["-1", "-2"].includes(text.toString().trim()))
        return null;
    return text;
}
function checkAwardAmount(awardAmount) {
    if (awardAmount == null) {
        return null;
    }
    if (awardAmount == -1) {
        return null;
    }
    return awardAmount;
}
function checkDate(dates) {
    if (dates == null) {
        return null;
    }
    return dates.toString();
}


function getYear(year) {
    if (year == null || year == ""){
        return null;
    }
    var regexString = /\b\d{4}\b/g
    var m = [];
    m = year.match(regexString);
    // m = re.findall(regex_string, year)
    if (m != null || m.length > 0)
        return m[0];
    return null;
}

function source2awardamount(text){
  text2 = '';
number = 0;
//   console.log('--------------start-----------------' + counter)
// counter ++;
//   console.log('1. main text:' + text);
text1 = text.match(/[\d\. ,]+/g)[0].trim();
if(!text1&&text.match(/[\d\. ,]+/g)[1]){
  text1 = text.match(/[\d\. ,]+/g)[1].trim();
  }
text_left = text.replace(text1, "");

// console.log('2. number cut: ' + text1);
// console.log('3. other half:' + text_left);

multiply = 1;
if(text_left.toLowerCase().indexOf("million")!= -1 ){
  multiply = 1000000;
  // console.log(multiply);
};
if(text_left.toLowerCase().indexOf("milion") != -1){
    multiply = 1000000;
}else{
  if(text_left.toLowerCase().indexOf("mil") != -1){
      multiply = 1000000;
  }else{
    if(text_left.toLowerCase().indexOf("mio") != -1){
      multiply = 1000000;
    }else{
      if(text_left.indexOf("M") != -1){
          multiply = 1000000;      
      }else{
        if(text_left.toLowerCase().indexOf("billion")!= -1 ){
          multiply = 1000000000;
          // console.log(multiply);
        }else{
          if(text_left.toLowerCase().indexOf("trillion")!= -1 ){
            multiply = 1000000000000;
            // console.log(multiply);
          }
        }
      }
    }
  }
}
//   console.log('4. multiplier: ' + multiply);

text2 = text1;
//clean space
if(text1.indexOf(" ") != -1) {
  // console.log((text1.match(/ /g)||[]).length);
  text2 = text1.replace(/ /g, "");
  // console.log(text2);
}
// clean dot /1.check there is 1 dot for float number 2. dot with ,/
if(text1.indexOf(".") != -1){
  // console.log((text1.match(/\./g)||[]).length);
  if((text1.match(/\./g)||[]).length > 1){
    text2 = text1.replace(/\./g, "");
    // console.log(text2);
  }else{
    // console.log(text1.indexOf("."));
    // console.log(text1.length);
    if(text1.length - text1.indexOf(".") == 4){
      text2 = text1.replace(/\./g, "");
    }else{
      if(text1.indexOf(",") != -1) {
        // console.log((text1.match(/ /g)||[]).length);
        text2 = text1.replace(/,/g, "");
        //console.log('test a');
      }
    }
    // console.log(text2);
  }
}
// console.log(text1);
// console.log(text2);
//clean ,
if(text2.indexOf(",") != -1) {
  if((text2.match(/,/g)||[]).length > 1){
    text2 = text2.replace(/,/g, "");
    // console.log(text2);
  }else{
    if(text2.length - text2.indexOf(",") == 4){
      text2 = text2.replace(/,/g, "");
    }else{
      text2 = text2.replace(/,/g, ".");
    }
    // console.log(text2);
  }
  // console.log((text1.match(/ /g)||[]).length);
  
}

//   console.log('5. cleaned number: '+ text2);
number = Number(text2);
//   console.log('6. converted number: ' + number);
//buh data deer shalgah
if(number > 1000000000000&&multiply!=1) {multiply = 1;}
//   console.log('7. last result: ' + number * multiply);
//   console.log("---------------end-----------------");
//   console.log("");
return number * multiply;
}

function getInstitution(cheer) {
  var candSection = [];
  try {
  cheer("td").each(function(i, elem){
  candSection.push(cheer(this));
  });
  // candSection = cheer.find_all(["dt", "dd"])
  }
  catch (error){
  return null;
  }
  var institution = null;
  for (let i=0; i < candSection.length - 1; i++){
  curTag = candSection[i];
  if (i + 1 < candSection.length ){
  nextTag = candSection[i + 1];
  }
  else {
  nextTag = null;
  }
  if (curTag.text().trim() == "Research hosting institution" && nextTag != null){
  if (curTag[0].tagName.startsWith("td") && nextTag[0].tagName.startsWith("td") ){
  institution = nextTag.text().trim();
  }
  }
  }
  return institution
 }

 function getDate(cheer) {
  var candSection = [];
  try {
  cheer("td").each(function(i, elem){
  candSection.push(cheer(this));
  });
  // candSection = cheer.find_all(["dt", "dd"])
  }
  catch (error){
  return null;
  }
  var institution = null;
  for (let i=0; i < candSection.length - 1; i++){
  curTag = candSection[i];
  if (i + 1 < candSection.length ){
  nextTag = candSection[i + 1];
  }
  else {
  nextTag = null;
  }
  if (curTag.text().trim() == "Project duration" && nextTag != null){
  if (curTag[0].tagName.startsWith("td") && nextTag[0].tagName.startsWith("td") ){
  institution = nextTag.text().trim();
  years = institution.split("-");
  return [years[0], years[1]];
}
  }
  }
  return institution
 }

function parse(features) {
    // console.log(features['source']);

    for( let [key, val] of Object.entries(features) ){
        if (["award_amount", "award_amount_usd"].includes(key) ){
            features[key] = checkAwardAmount(val);
        }
        else　if (["funded_date", "start_date", "end_date"].includes(key) ){
            features[key] = checkDate(val);
        }
        else {
            features[key] = checkText(val);
        }
    }
    features['country'] = 'VN';
    features['currency'] = 'VND';

    // features["start_year"] = getYear(features["start_year"]);
    // features["end_year"] = getYear(features["end_year"]);

    var source = features["source"];
    if(source){
    if(source.indexOf("Project’s budget")!= -1){
        text = source.split("Project’s budget")[1].trim();
        text1 = text.substring(0, 25);
        features["source"] = text1;
        // console.log(text1);
        features["award_amount"] = source2awardamount(text1);
        features["source"] = null;
    }else{
        features["source"] = null;
    }}else {source = null;}
    
  
  // institutions
  const $ = cheerio.load(features["dtl_html"]);
  features['institution'] = getInstitution($);

  dates = getDate($);
  // console.log(dates[0], dates[1]);
  features['start_year'] = parseInt(dates[0]);
  features['end_year'] = parseInt(dates[1]);

  if( features["start_year"] != null && features["end_year"] !=null ) {
    features["project_term"] = parseInt(features["end_year"]) - parseInt(features["start_year"]) + 1 + " years"
}else{
    features["project_term"] = null
};

    return features;
}

module.exports = {
    parse,
  };
