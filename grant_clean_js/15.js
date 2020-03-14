const cheerio = require('cheerio');


function getTitle(cheer) {
    try {
        if(cheer("h1").first().text().trim() == "")
            return null;
        return cheer("h1").first().text().trim();
        // return cheer.find("h1").text().trim()
    }
    catch(error) {
        return null;
    }
}
function getProjectId(url) {
    if (url == null || url == null || url == ""){
        return null;
    }
    // projectId = [u.trim() for u in url.split("/") if u.trim() != ""]
    var projectId = [];
    for(u of url.split("/")){
        // u.trim() != "" ? projectId.push(u.trim()) : u.trim();
        if(u.trim() != ""){
            projectId.push(u.trim());
        }
    }
    if (projectId.length > 0) {
        return projectId[projectId.length - 1];
    }

return null;
}

function getResearcher(cheer) {
    var candTr = [];
    try {
        cheer("tr").each(function(i, elem){
            candTr.push(cheer(this));
        });
        // cheer.find_all("tr")
    }
    catch(error) {
        console.log(error)
    return [null,null];
    }
    var researcher = null;
    var institution = null;
    for( tr of candTr ){
        // var text = tr.text().trim();
        var text_r = tr.text().trim();
        var html_r = tr.html();
        if (text_r.indexOf("研究代表者") != -1 ){     
            try {
                var r_cheer = cheerio.load(html_r)
                var span_r = r_cheer("span").text().trim();
                researcher = span_r;
            }
            catch(error) {
                // console.log(error)
            }
            if (researcher != null) {
                var researcherReg = new RegExp(researcher,"g");
                institution_r = text_r.replace(/研究代表者/g, "").replace(researcherReg, "").trim();
                var result = institution_r.split(",");
                institution = result[0].replace("&nbsp;", " ");
            }
            else {
                institution = text_r.replace(/研究代表者/g, "").replace(researcher, "").trim();
                var result = institution_r.split(",");
                institution = result[0].replace("&nbsp;", " ");
            }
            if (institution == "") {
                institution = null;
            }
        }
    }
    return [researcher, institution];
}

function getDescription(cheer) {
    var candTr = [];
    try {
        cheer("tr").each(function(i, elem){
            candTr.push(cheer(this));
        });
        // cheer.find_all("tr")
    }
    catch(error) {
    return null;
    }
    var description = null;

    for (tr of candTr) {
        var text = tr.text()
        if (text.indexOf("概要") != -1 ){
            description = text.replace(/概要/g, "")
        }
    }

    return description;
}
function getAwardAmount(cheer) {
    var candTr = [];
    try {
        cheer("tr").each(function(i, elem){
            candTr.push(cheer(this));
        });
        // cheer.find_all("tr")
    }
    catch(error) {
        return [null, null];
    }

    var awardAmount = null; 
    var currency =  "JPY";
    for (tr of candTr) {
        var text = tr.text()
        if (text.indexOf("合計額") != -1) {
            if (text.indexOf("円") != -1) {
                var currency = "JPY"
            }
            awardAmount = text.replace(/[^\d]/g,"").trim();
            //re.sub(r"[^\d]", "", text).trim()
            try {
                awardAmount = Math.round(parseFloat(awardAmount)*100)/100;
                //round(float(awardAmount), 2);
            }
            catch(error) {
                awardAmount = null;
            }
        }
    }
    return [awardAmount, currency];
}
function getStartEndYear(cheer) {
    var candTr = []
    try {
        cheer("tr").each(function(i, elem){
            candTr.push(cheer(this));
        });
    }
    catch(error) {
        console.log(error)
    return [null, null];
    }
    var startYear = null;
    var endYear = null;
    for( tr of candTr){
        var text_y = tr.text().trim();
        var html_y = tr.html();
        if (text_y.indexOf("研究期間 (年度)") != -1){
            try {
                var y_cheer = cheerio.load(html_y)
                var span_y = y_cheer("span.fiscal_year").text().trim();
                var regexString = /\b\d{4}\b/g;
                matchs = [];
                matchs = span_y.match(regexString);
                startYear = matchs[0]
                endYear = matchs[1]
            }
            catch(error) {
                console.log(error)
            }
        }
    }
    return [startYear, endYear];
}

function cleanHtml(html){
    return html.toString().replace(/\n|\t|\s+/g," ");
    //re.sub(r"\n|\t|\s+", " ", str(soup))
}


function parse(features) {
    var html = features['html'];
    if(html == null){
        return features;
    }
    html = cleanHtml(html);
    let cheer = cheerio.load(html, {decodeEntities : false});
        
    // features["title"]    = getTitle(cheer);
    features["project_id"] = getProjectId(features["project_url"]);
    var res = getResearcher(cheer);
    features["researcher"] = res[0];
    features["institution"] = res[1];
    features["description_raw"] = getDescription(cheer);
    var years = getStartEndYear(cheer);
    features["start_year"] = years[0];
    features["end_year"] = years[1];
    if( features["start_year"] != null && features["end_year"] !=null ) {
        features["project_term"] = parseInt(features["end_year"]) - parseInt(features["start_year"]) + 1 + " years"
    }else{
        features["project_term"] = null
    };
    var award = getAwardAmount(cheer);
    features["award_amount"] = award[0];
    features["currency"] = award[1];
    features["description"] = features["description_raw"];
    features["country"] = "JP";
    return features;
}
module.exports = {
    parse,
  };
