const cheerio = require('cheerio');

function getTitle(cheer) {
    try {
        if(cheer.root().find("h3").text().trim()=="")
            return null;
        return cheer.root().find("h3").text().trim();
        // return soup.find("h3").text().trim()
    }
    catch (error) {
        return null;
    }
    return null;
}

function getProjectId(cheer) {
    var candSection = [];
    try {
        cheer("dt, dd").each(function(i, elem){
            candSection.push(cheer(this));
        });
        // candSection = cheer.find_all(["dt", "dd"])
    }
    catch (error){
        return null;
    }
    
    var projectId = null;
    for (let i=0; i < candSection.length - 1; i++){
        curTag  = candSection[i];
        if (i + 1 < candSection.length) {
            nextTag = candSection[i + 1];
        }
        else {
            nextTag = null;
        }
        if (curTag.text().trim() == "project number" && nextTag != null){
            if (curTag[0].tagName.startsWith("dt") && nextTag[0].tagName.startsWith("dd")) {
                projectId = nextTag.text().trim();
            }
        }   
    }
    return projectId;
}
function getResearcher(cheer) {
    var candSection = [];
    try {
        cheer("dt, dd").each(function(i, elem){
            candSection.push(cheer(this));
        });
        // candSection = cheer.find_all(["dt", "dd"])
    }
    catch (error){
        return null;
    }
    var researcher = null;
    for (let i=0; i < candSection.length - 1; i++){
        curTag  = candSection[i];
        if (i + 1 < candSection.length ){
            nextTag = candSection[i + 1];
        }
        else {
            nextTag = null;
        }
        if ((curTag.text().trim() == "project lead" && nextTag != null)||(curTag.text().trim() == "Autor" && nextTag != null)){
            if (curTag[0].tagName.startsWith("dt") && nextTag[0].tagName.startsWith("dd") ){
                researcher = nextTag.text().trim();
                if (researcher.startsWith("eval(decodeURIComponent")) {
                    var tmp = decodeURI(decodeURI(researcher));//unquote(unquote(researcher));
                    for (t of tmp.split(";")) {
                        if (t.search("createTextNode") == -1) {
                            continue;
                        }
                        researcher = t.split("'")[1].trim();
                    }
                }
            }
        }
    }
    if (researcher == ""){
        return null;
    }
    return researcher;
}

function getInstitution(cheer) {
    var candSection = [];
    try {
        cheer("dt, dd").each(function(i, elem){
            candSection.push(cheer(this));
        });
        // candSection = cheer.find_all(["dt", "dd"])
    }
    catch (error){
        return null;
    }
    var institution = [];
    var hash_tmp = {};
    for (let i=0; i<candSection.length - 1;i++ ){
        curTag  = candSection[i];
        if (i + 1 < candSection.length) {
            nextTag = candSection[i + 1];
        }
        else {
            nextTag = null;
        }
        if (curTag.text().trim() == "university / research place" && nextTag != null){
            if (curTag[0].tagName.startsWith("dt") && nextTag[0].tagName.startsWith("dd")) {
                var txt = nextTag.text().trim();
                if (!(txt in hash_tmp) && txt != ""){
                    institution.push(txt);
                    hash_tmp[txt] = 1;
                }
            }
        }
        if (curTag.text().trim() == "institute" && nextTag != null){
            if (curTag[0].tagName.startsWith("dt") && nextTag[0].tagName.startsWith("dd")) {
                var txt = nextTag.text().trim();
                if (!(txt in hash_tmp) && txt != ""){
                    institution.push(txt);
                    hash_tmp[txt] = 1;
                }
            }
        }
    }
    if (institution.length == 0) {
        return null;
    }

    return institution.join(";");
}

function getKeywords(cheer) {
    var candSection = [];
    try {
        cheer("dt, dd").each(function(i, elem){
            candSection.push(cheer(this));
        });
        // candSection = cheer.find_all(["dt", "dd"])
    }
    catch (error){
        return null;
    }
    var keywords = null;
    for (let i=0; i < candSection.length - 1; i++) {
        curTag  = candSection[i];
        if (i + 1 < candSection.length){
            nextTag = candSection[i + 1];
        }
        else {
            nextTag = null;
        }
        if (curTag.text().trim() == "keywords" && nextTag != null){
            if (curTag[0].tagName.startsWith("dt") && nextTag[0].tagName.startsWith("dd")) {
                
                keywords = nextTag.text().trim().split(",").join(";");
                //";".join([key for key in nextTag.text().trim().split(",")])
            }
        }
    }

    if (keywords == "" ){
        return null;
    }

    return keywords;
}

function getAwardAmount(cheer) {
    var candSection = [];
    try {
        cheer("dt, dd").each(function(i, elem){
            candSection.push(cheer(this));
        });
        // candSection = cheer.find_all(["dt", "dd"])
    }
    catch (error){
        return [null,null];
    }
    var awardAmount = null;
    var currency = null;

    for (let i = 0; i< candSection.length - 1;i++) {
        curTag  = candSection[i];
        if (i + 1 < candSection.length ){
            nextTag = candSection[i + 1];
        }
        else {
            nextTag = null;
        }
        if (curTag.text().trim() == "grants awarded" && nextTag != null){
            if (curTag[0].tagName.startsWith("dt") && nextTag[0].tagName.startsWith("dd")) {
                var text = nextTag.text().trim();
                awardAmount = text.replace(/[^\d\.]/g, "").trim();
                try {
                    awardAmount = Math.round(parseFloat(awardAmount)*100)/100;
                    // round(float(awardAmount), 2)
                }
                catch(error) {
                    awardAmount = null;
                }
            }
            if (awardAmount != null) {
                    currency = "EUR"
            }
        }
    }
    return [awardAmount, currency];
}
// function getStartEndDate(cheer) {
//     var candSection = [];
//     try {
//         cheer("dt, dd").each(function(i, elem){
//             candSection.push(cheer(this));
//         });
//         // candSection = cheer.find_all(["dt", "dd"])
//     }
//     catch (error){
//         return [null, null];
//     }
//     var startEndDate = "";
//     for (let i = 0; i < candSection.length - 1; i++) {
//         curTag  = candSection[i];
//         if (i + 1 < candSection.length ){
//             nextTag = candSection[i + 1];
//         }
//         else {
//             nextTag = null;
//         }
//         if (curTag.text().trim() == "lifetime" && nextTag != null){
//             if (curTag[0].tagName.startsWith("dt") && nextTag[0].tagName.startsWith("dd")) {
//                 startEndDate = nextTag.text().trim();
//             }
//         }
//     }
    
//     var regexString = /\b\d{4}\/\d{2}\/\d{2}\b/g;
//     matchs = [];
//     matchs = startEndDate.match(regexString); // findall(regex, str);
//     if(matchs != null)
//     if (matchs.length > 0) {
//         for (let i=0; i < matchs.length; i++) {
//             try {
                
//                 let dateSplitted = matchs[i].split("/");
//                 // let toDate = new Date(dateSplitted[0],(parseInt(dateSplitted[1])-1).toString(),dateSplitted[2]);
//                 // TODO
//                 let toDate = new Date((parseInt(dateSplitted[0])+1).toString(),(parseInt(dateSplitted[1])-1).toString(),dateSplitted[2]);
//                 // matchs[i] = datetime.datetime.strptime(matchs[i], "%Y/%m/%d")
//                 matchs[i] = toDate.toISOString().substr(0,10).replace(/-/g,"/");
//             }
//             catch(error) {
//                 matchs[i] = null;
//             }
//         }
//     }
//     else {
//         return [null, null];
//     }
//     var startDate = null;
//     var endDate = null;
//     if(matchs != null)
//     if (matchs.length == 1) {
//         startDate = matchs[0];
//     }
//     else if(matchs.length > 1) {
//         startDate = matchs[0];
//         endDate = matchs[1];
//     }
//     return [startDate, endDate];
// }

function getStartEndDate(cheer) {
    var candSection = [];
    try {
        cheer("dt, dd").each(function(i, elem){
            candSection.push(cheer(this));
        });
        // candSection = cheer.find_all(["dt", "dd"])
    }
    catch (error){
        return [null, null];
    }
    var startEndDate = "";
    for (let i = 0; i < candSection.length - 1; i++) {
        curTag  = candSection[i];
        if (i + 1 < candSection.length ){
            nextTag = candSection[i + 1];
        }
        else {
            nextTag = null;
        }
        if (curTag.text().trim() == "lifetime" && nextTag != null){
            if (curTag[0].tagName.startsWith("dt") && nextTag[0].tagName.startsWith("dd")) {
                startEndDate = nextTag.text().trim();
            }
        }
    }
    var regexString = /\b\d{4}\/\d{2}\/\d{2}\b/g;
    matchs = [];
    matchs = startEndDate.match(regexString); // findall(regex, str);
    if(matchs != null)
    if (matchs.length > 0) {
        for (let i=0; i < matchs.length; i++) {
            try {
                
                let dateSplitted = matchs[i].split("/");
                let toDate = new Date((dateSplitted[0]).toString(),((parseInt(dateSplitted[1]))-1).toString(),((parseInt(dateSplitted[2]))+1).toString());
                matchs[i] = toDate.toISOString().substr(0,10).replace(/-/g,"/");
            }
            catch(error) {
                matchs[i] = null;
            }
        }
    }
    else {
        return [null, null];
    }
    var startDate = null;
    var endDate = null;
    if(matchs != null)
    if (matchs.length == 1) {
        startDate = matchs[0];
    }
    else if(matchs.length > 1) {
        startDate = matchs[0];
        endDate = matchs[1];
    }
    return [startDate, endDate];
}

function getStartYear(startDate) {
    if (startDate == null) {
        return null;
    }
    else if (startDate.length == 0)
         {
        return null;
    }
    return startDate.substr(0,4);
    // return startDate[ : 4]
}

function getEndYear(endDate) {
    if( endDate == null ){
        return null;
    }
    else if(endDate.length == 0){
        return null;
    }
    return endDate.substr(0,4);
    // return endDate[ : 4]
}

function cleanHtml(html){
    return html.toString().replace(/\n|\t|\s+/g," ");
    //re.sub(r"\n|\t|\s+", " ", str(soup))
}


async function parse(features){
    // var html = features['html']
    var html = features['dtl_html'];
    if(html == null){
        return features;
    }
    html = cleanHtml(html);
    let cheer = cheerio.load(html, {decodeEntities : false});
    
    // features["title"]               = getTitle(cheer);
    // features["project_id"]          = getProjectId(cheer);
    features["project_id_original"] = features["project_id"];

    // features["researcher"]      = getResearcher(cheer);
    // features["researcher_en"]   = features["researcher"];
    features["institution"]     = getInstitution(cheer);
    var dates = getStartEndDate(cheer);
    features["start_date"] = dates[0];
    features["end_date"] = dates[1];
    features["start_year"] = getStartYear(features["start_date"]);
    features["end_year"]   = getStartYear(features["end_date"]);
    var award = getAwardAmount(cheer);
    features["award_amount"] = award[0];
    // features["currency"] = award[1];
    features["keyword"] = getKeywords(cheer);
    features["keyword_en"] = features["keyword"];
    features["country"] = "DE";
    features["currency"] = "EUR"
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
