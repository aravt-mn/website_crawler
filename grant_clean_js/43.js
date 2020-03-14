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

function getInstitution(institution) {
    institution = institution.split(" , ") 
    var result = [];
    institution.forEach(element => {
        if (element.trim() != "," && element.trim() != "") { 
        result.push(element.trim())}
    });
    let array = result;
    // let array = Array.from(new Set(result));
    if (array == undefined || array.length == 0) {
        return null
    };
    return array.join(";");
}

function getResearcher(researcher) {
    researcher = researcher.split(" , ") 
    var result = [];
    researcher.forEach(element => {
        if (element.trim() != "," && element.trim() != ""){
        result.push(element.trim())}
    });
    // let array = Array.from(new Set(result));
    let array = result;
    if (array == undefined || array.length == 0) {
        return null
    };
    return array.join(";");
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
    features["researcher"] = getResearcher(features["researcher"]);
    features["institution"] = getInstitution(features["institution"]);
    features["country"] = "EU";

    return features;
}

module.exports = {
    parse,
  };
