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

function clearResIns(text) {
    var str = [];
    // text = ";".join([t.strip() for t in str(text).split("\n") if t.strip() != ""])
    for(t of text.toString().split("\n")){
        if(t.trim() != ""){
            str.push(t.trim());
        }
    }
    text = str.join(";");
    if (text == "") {
        return null;
    }
    return text;
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
    
    features["country"] = "IN";
    features["researcher"] = clearResIns(features["researcher"]);
    features["institution"] = clearResIns(features["institution"]);

    return features;
}

module.exports = {
    parse,
  };
