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
    return dates;
}
function cleanHtml(html){
    return html.toString().replace(/\n|\t|\s+/g," ");
    //re.sub(r"\n|\t|\s+", " ", str(soup))
}

function parse(features) {

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

    var html = features['dtl_html'];
    html = cleanHtml(html);
    var cheer = cheerio.load(html, {decodeEntities: false});
    var p = cheer('article div.content p');
    var tag_st = cheer('article div.content p strong');
    var tag_st1 = '<strong>' + tag_st.html() + '</strong>';
    var p1 = p.html().replace(tag_st1, '');
    // console.log('main text', p1);
    var p2 = p1.split('<br>');
    if(features['project_url'] == 'http://www.aka.fi/en/strategic-research-funding/programmes-and-projects/health-welfare-and-lifestyles/promowork/'){
    // console.log('------------anhaar------------');
    };
    // console.log('len: ', p2[0].length);
    if(p2[0]) {
        if(p2[0].length == 1){
            // console.log('a');
            features['researcher'] = p2[1].replace('<span>', '').trim().replace('</span>', '').trim();
            features['researcher_en'] = features['researcher'];
            // console.log(p2[0]);
            if(p2[2]) {features['institution'] = p2[2].replace('<span>', '').trim().replace('</span>', '').trim();}else{features['institution'] = null;}
        }else{
            // console.log('b');
            features['researcher'] = p2[0].replace('<span>', '').trim().replace('</span>', '').trim();
            features['researcher_en'] = features['researcher'];
            // console.log(p2[0]);
            if(p2[1]) {features['institution'] = p2[1].replace('<span>', '').trim().replace('</span>', '').trim();}else{features['institution'] = null;}
        }
    }else{
        // console.log('c');
        features['researcher'] = p2[1].replace('<span>', '').trim().replace('</span>', '').trim();
        features['researcher_en'] = features['researcher'];
        // console.log(p2[0]);
        if(p2[2]) {features['institution'] = p2[2].replace('<span>', '').trim().replace('</span>', '').trim();}else{features['institution'] = null;}
    }
    // console.log('researcher: ',features['researcher']);
    // console.log('institution: ',features['institution']);
    features["country"] = "FI";
    features['currency'] = 'EUR';
    return features;
}
module.exports = {
    parse,
  };
