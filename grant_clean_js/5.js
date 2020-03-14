const moment = require('moment');
const cheerio = require('cheerio');


function checkText(text) {
    if (text == null) {
        return null;
    }
    if (["-1", "-2"].includes(text.toString().trim())) {
        return null;
    }
    return text;
}

function checkAwardAmount(awardAmount) {
    if (awardAmount == null ){
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
    if (getDate(dates) == null) {
        return null;
    }
    return (getDate(dates)).toString();
}

function getDate(dates) {
    try {
        dates = moment(dates).format("YYYY-MM-DD");
        // dates = datetime.datetime.strptime(str(dates), "%Y-%m-%d %H{%M{%S").date()
    }
    catch(error) {
        dates = null;
    }
    return dates;
}

function getYear(dates) {
    if (dates == null) {
        return null;
    }
    return dates.substr(0,4);
    // return dates[ { 4]
}

function getProjectId(url) {
    var pos = url.indexOf("A");
    if (pos == -1 ){
        return null;
    }
    else {
        return url.substring(pos);  //[pos {]
    }
    return null;
}

function getInstitution(institution) {
    var pos = institution.indexOf("(");
    if (pos == -1 ){
        return null;
    }
    else {
        return institution.substring(pos);  //[pos {]
    }
    return null;
}

function DateParser(text){
    // if(!prj_term) {return null;}
    // var date = new Date(moment(prj_term, "MMMM YYYY").format('YYYY-MM-DD'));
    // console.log('----------');
    // console.log(date);
    // return null;

    function diff_months(dt2, dt1){
        // var diff =(dt2.getTime() - dt1.getTime()) / 1000;
        //  diff /= (60 * 60 * 24 * 7 * 4);
        // return Math.abs(Math.round(diff));
        var months = (dt2.getFullYear() - dt1.getFullYear()) * 12
        months += dt2.getMonth() - dt1.getMonth();
        return months;
    }

    if(text){
        if(text.indexOf("-") != -1){
            text1 = text.split('-')[0].trim();
            text2 = text.split('-')[1].trim();
            // console.log('Opt1: ' + text1 + ' | ' + text2);
            var date_st = new Date(moment(text1, "MMMM YYYY").format('YYYY-MM-DD'));
            // console.log(date_st);
            var date_ed = new Date(moment(text1, "MMMM YYYY").add(text2.match(/\d+/g)[0], 'months').format('YYYY-MM-DD'));
            // console.log(date_ed);
            var term = diff_months(date_ed, date_st).toString() + ' months';
            // console.log(term);
        }else{
            text1 = text.split('à')[0].trim();
            text2 = text.split('à')[1].trim();
            // console.log('Opt2: ' + text1 + ' | ' + text2);
            var date_st = new Date(moment(text1, "MMMM YYYY", 'fr',true).format('YYYY-MM-DD'));
            // console.log(date_st);
            var date_ed = new Date(moment(text2, "MMMM YYYY", 'fr',true).format('YYYY-MM-DD'));
            // console.log(date_ed);
            var term = diff_months(date_ed, date_st).toString() + ' months';
            // console.log(term);
        }
        return [date_st, date_ed, term];
    }else{
        return null;
    }


}

function getResearcherNew(cheer) {
    try {
        cheer = cheer("div.block__content").find("p").html();
    }
    catch(error) {
        return [null, null];
    }

    var researcher = null;
    var institution = null;
    cheer = cheerio.load(cheer.toString().replace(/<br>|<br\/>/g, ";"));

    for (row of cheer.text().split(";")) {
        if (row.trim() == "" ){
            continue;
        }
        var cand = row.split(":");
        if (cand.length == 2 ){
            if (cand[0].trim() == "RST") {
                researcher = cand[1].trim();
            }
            else if(cand[0].trim() == "Etablissement Coordinateur") {
                institution = cand[1].trim();
            }
        }
    }
    return [researcher, institution];
}

function getDescription(cheer) {
    var description;
    try {
        description = cheer("div.card-body").first();
    }
    catch(error) {
        return null;
    }
    if(description.text().trim() == "") {
        return null;
    }

    return description.text().trim();
}

// function parse(features){
    
//     for (let [key, val] of Object.entries(features) ){
//         if (["site_id",].includes(key)) {
//             features[key] = val;
//         }
//         else if (key in ["award_amount", "award_amount_usd"]) {
//             features[key] = checkAwardAmount(val);
//         }
//         else if (["funded_date", "start_date", "end_date"].includes(key) ){
//             features[key] = checkDate(val);
//         }
//         else {
//             features[key] = checkText(val);
//         }
//     }
//     features["country"] = "FR";
//     features["start_year"] = getYear(features["start_date"]);
//     features["end_year"] = getYear(features["end_date"]);
//     features["project_id"] = getProjectId(features["project_url"]);
//     features["project_id_original"] = getProjectId(features["project_url"]);
//     features["institution"] = getInstitution(features["institution"])

//     if (features["award_amount"] != null) {
//         features["currency"] = "EUR";
//     }
//     // console.log('=======================');
//     // console.log(features["project_term"]);
//     var result = DateParser(features["project_term"]);
//     if(result){
//         // console.log(result[0]);
//         // console.log(result[1]);
//         // console.log(result[2]);
//         features["start_date"] = result[0];
//         features["end_date"] = result[1];
//         features["project_term"] = result[2];
//         features["start_year"] = result[0].getFullYear();
//         features["end_year"] = result[1].getFullYear();
//     }
//     return features;
// }


function cleanHtml(html){
    return html.toString().replace(/\n|\t|\s+/g," ");
    //re.sub(r"\n|\t|\s+", " ", str(cheer))
}


function parse(features){

    for (let [key, val] of Object.entries(features) ){
        if (["site_id",].includes(key)) {
            features[key] = val;
        }
        else if (key in ["award_amount", "award_amount_usd"]) {
            features[key] = checkAwardAmount(val);
        }
        else if (["funded_date", "start_date", "end_date"].includes(key) ){
            features[key] = checkDate(val);
        }
        else {
            features[key] = checkText(val);
        }
    }
    var html = features['dtl_html'];
    if(html == null){
        return features;
    }
    html = cleanHtml(html);
    let cheer = cheerio.load(html, {decodeEntities : false});
    if (features["project_url"].indexOf("ProjetIA") != -1) {

        features["project_id"]          = getProjectId(features["project_url"]);
        features["project_id_original"] = getProjectId(features["project_url"]);
        if (features["award_amount"] != null) {
            features["currency"] = "EUR";
        };    
        var res = getResearcherNew(cheer);
        features["researcher"] =res[0];
        features["institution"] = res[1];

        var result = DateParser(features["project_term"]);
        if(result){
            // console.log(result[0]);
            // console.log(result[1]);
            // console.log(result[2]);
            features["start_date"] = result[0];
            features["end_date"] = result[1];
            features["project_term"] = result[2];
            features["start_year"] = result[0].getFullYear();
            features["end_year"] = result[1].getFullYear();

            features["description"]  = getDescription(cheer)
            features["description_raw"] = features["description"];
            // features["description_en"] = features["description"];
        }
        features["country"] = "FR"
        return features;
    

    }
    else {
        features["project_id"]          = getProjectId(features["project_url"]);
        features["project_id_original"] = getProjectId(features["project_url"]);
        
        features["institution"] = getInstitution(features["institution"])
        features["institution_en"] = getInstitution(features["institution"])
        if (features["award_amount"] != null) {
            features["currency"] = "EUR";
        };
    

        var result = DateParser(features["project_term"]);
        if(result){
            // console.log(result[0]);
            // console.log(result[1]);
            // console.log(result[2]);
            features["start_date"] = result[0];
            features["end_date"] = result[1];
            features["project_term"] = result[2];
            features["start_year"] = result[0].getFullYear();
            features["end_year"] = result[1].getFullYear();
        
    }
    features["country"] = "FR";
    return features;
}};

module.exports = {
    parse
  };