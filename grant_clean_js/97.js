// # cnki parser


function checkText(text) {
  if (text == null) {
    return null;
  }
  if (['-1', '-2'].includes(text.toString().trim())) {
    return null;
  }
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
function parse(features) {

    for (let [key, val] of Object.entries(features) ){
        if (["award_amount", "award_amount_usd"].includes(key)) {
            features[key] = checkAwardAmount(val);
        }
        else if (key in ["funded_date", "start_date", "end_date"] ){
            features[key] = checkDate(val);
        }
        else {
            features[key] = checkText(val);
        }
      }
    features["country"] = "MX";
    features["description_raw"] = features["description"];
    return features;
}


module.exports = {
  parse,
};
