const cheerio = require('cheerio');

function checkText(text) {

    if (text == null)
        return null;
    if (["-1", "-2", ""].includes(text.toString().trim())) 
        return null;
    return text;
}

function getInstitution(institution) {
    institution = institution.split(/\s,\s|\s\s\s,|,\s\s\s/)
    var result = [];
    institution.forEach(element => {
        if (element.trim() != "," && element.trim() != "") { 
        result.push(element.trim())}
    });
    let array = Array.from(new Set(result));
    if (array == undefined || array.length == 0) {
        return null
    };
    return array.join(";");
}

function getResearcher(researcher) {
    researcher = researcher.split(/\s,\s|\s\s\s,|,\s\s\s/)
    var result = [];
    researcher.forEach(element => {
        if (element.trim() != "," && element.trim() != ""){
        result.push(element.trim())}
    });
    let array = Array.from(new Set(result));
    if (array == undefined || array.length == 0) {
        return null
    };
    return array.join(";");
}

function checkAwardAmount(awardAmount) {
    if(awardAmount == null) 
        return null;
    if (awardAmount == -1)
        return null;
    return awardAmount
}
function checkDate(dates) {
    if (dates == null) 
        return null;
    if(getDate(dates) == null)
        return null;
    return getDate(dates);
}
function getDate(dates) {
    try {
        dates = dates.toString();
        dates = new Date(dates);
        dates = dates.getFullYear().toString()+"-"+(dates.getMonth()+1).toString()+"-"+dates.getDate().toString();
        //dates = datetime.datetime.strptime(str(dates), "%Y-%m-%d %H{}%M{}%S").date();
    }
    catch(error) {
        return null;
    }
    return dates;
}
function getYear(dates) {
    if (dates == null)
        return null;
    else if(dates.length == 0){
        return null;       
    }
    return dates.substr(0,4);
}

function parse(features)
{
    for (let [key, val] of Object.entries(features)) {
        if (["award_amount", "award_amount_usd"].includes(key)) {
            features[key] = checkAwardAmount(val);
        }
        else if (["funded_date", "start_date", "end_date"].includes(key)) {
            features[key] = checkDate(val);
        }
        else {
            features[key] = checkText(val);
        }
    }
    features["institution"] = getInstitution(features["institution"]);
    features["researcher"] = getResearcher(features["researcher"]);
    features["country"] = "CH";
    features["start_year"] = getYear(features["start_date"]);
    features["end_year"] = getYear(features["end_date"]);
    features["currency"] = "CHF";
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
