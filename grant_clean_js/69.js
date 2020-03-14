// # cnki parser


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


function checkCurrency(currency) {
    if (["euro", "€"].includes(currency)) {
        return "EUR";
    }
    return "NOK";
}
function getStartYear(startYear) {
    startYear = startYear.toString();
    if (startYear == null) {
        return null;
    }
    var regexString = /\b\d{4}\b/g;
    var m = startYear.match(regexString);
    //m = re.findall(regexString, startYear)
    if (m != null || m.length > 0) 
        return m[0];
    return null;
}

function getEndYear(endYear) {
    endYear = endYear.toString();
    if (endYear == null) {
        return null;
    }
    var regexString = /\b\d{4}\b/g;
    var m = endYear.match(regexString);
    // m = re.findall(regexString, endYear)
    if (m != null || m.length > 0) 
        return m[m.length - 1];
    return null;
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

    features["country"] = "NO";
    features["start_date"] = null;
    features["end_date"] = null;
    features["currency"] = checkCurrency(features["currency"]);

    features["start_year"] = getStartYear(features["start_year"]);
    features["end_year"] = getEndYear(features["end_year"]);
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
