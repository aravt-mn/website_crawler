const cheerio = require('cheerio');
const request = require('request-promise');


function cleanHtml(html){
    return html.toString().replace(/\n|\t|\s+/g," ");
    //re.sub(r"\n|\t|\s+", " ", str(soup))
}

function getTitle(html) {
    try {
        
        if(html.root().find("span#chTitle").text().trim() == "")
        {
            return null;
        }
        return html("span#chTitle").text().trim();//find("span", {"id" : "chTitle"}).get_text().trim();
    }
    catch(error){
        return null;
    }
}

function getTitleEn(html) {
    try {
        if(html.root().find("span#enTitle").text().trim() == "")
        {
            return null;
        }
        return html("span#enTitle").text().trim();//.find("span", {"id" : "enTitle"}).get_text().trim();
    }
    catch(error) {
        return null;
    }
}
function minorClean(text) {
    text = text.replace(/【作者】/g, "").replace(/【机构】/g, "").replace("；", ";");
    var str = "";
    for(s of text.split(';')){
        if(s.trim() != ""){
            str += s+";"; 
        }
    }
    return str;
    // return ";".join([row.trim() for row in text.split(";") if row.trim() != ""]);
}
function getResearcher(html){
    try {
        if(html.root().find("div.author").text().trim() == "")
        {
            return null;
        }
        researcherCand = [];
        html("div.author").find("p").each(function(i,elem){
            researcherCand.push(html(this).text());
        });//.find("div", {"class" : "author"}).find_all("p")
    }
    catch(error) {
        return null;
    }
    for (row of researcherCand) {
        text = row.trim();
        if (text.indexOf("【作者】") != -1 ){
            return minorClean(text);
        }
    }
    return null;
}
function getInstitution(html) {
    try {
        if(html.root().find("div.author").text().trim() == "")
        {
            return null;
        }
        institutionCand = [];
        html("div.author").find("p").each(function(i,elem){
            institutionCand.push(html(this).text());
        });//find("div", {"class" : "author"}).find_all("p");
    }
    catch(error) {
        return null;
    }
    for(row of institutionCand) {
        text = row.trim();
        if (text.indexOf("【机构】") != -1) {
            return minorClean(text);
        }   
    }
    return null;
}
function getResearcherCleaned(html) {
    try {
        if(html.root().find("p#au_en").text().trim() == ""){
            return null;
        }
        return html("p#au_en").text().trim();
    }
    catch(error) {
        return null;
    }
    return null;
}
function clearUniqode(text) {
    result = ""
    for (let i = 0; i < text.length; i++) {
        ch = text.charCodeAt(i);
        if (ch >= 0 && ch <= 256){
            result += ch; 
        }
        else {
            result += " ";
        }
    }
    return result.trim();
}


function clearResearcher(researcher) {
    if (researcher == null || researcher == "") {
        return [null, null];
    }
    researcher = researcher.replace(/【Author】|\+|&|~/g ,"");//re.sub(r"【Author】|\+|&|~", "", researcher)
    researcher = researcher.replace(/\\\|/g,"-");//re.sub(r"\\\|", "-", researcher)
    researcher = researcher.replace(/\\|\(|\)|\s\d\b|\,\d|\d\.|\b\d\s|et al/g,";");//re.sub(r"\\|\(|\)|\s\d\b|\,\d|\d\.|\b\d\s|et al", ";", researcher)
    researcher = researcher.replace(/Department/g, ";Department");//re.sub(r"Department", ";Department", researcher)
    researcher = researcher.replace(/College/g, ";College");//.sub(r"College", ";College", researcher)
    researcher = researcher.replace(/IBM/g, ";IBM");//re.sub(r"IBM", ";IBM", researcher)
    researcher = researcher.replace(/LIU Gangersity/g, ";LIU Gangersity");//re.sub(r"LIU Gangersity", ";LIU Gangersity", researcher)
    researcher = researcher.replace(/Key Laboratory/g, ";Key Laboratory");//re.sub(r"Key Laboratory", ";Key Laboratory", researcher)
    researcher = researcher.replace(/Graduate School/g, ";Graduate School");//re.sub(r"Graduate School", ";Graduate School", researcher)
    
    //researcher = [res.strip() for res in researcher.split(";") if res.strip() != ""]
    let tmpRes = [];
    for(res of researcher.split(";")){
        if(res.trim() == ""){
            tmpRes.push(res.trim());
        }
    }
    researcher = researcher.split(";").map(function(i){
        if(i.trim() != ""){
            return i.trim();
        }
    });
    var researcherCand = [];
    var institutionCand = [];
    for(row of tmpRes){
        if (row.toLowerCase().search(/china|chinese|university|school|\bof\b|research|\bfor\b|co\.,ltd|central|center|management|college|station|institute|academy|beijing|state/g) != -1){
            //re.search(r"china|chinese|university|school|\bof\b|research|\bfor\b|co\.,ltd|central|center|management|college|station|institute|academy|beijing|state", row.lower()) :
            institutionCand.push(clearUniqode(row));
        }else {
            researcherCand.push(clearUniqode(row));
        }       
    }
        
    
    var researcher = null;
    var institution = null;
    if (institutionCand.length > 0) {
        institution = institutionCand.join(";");
    }
        

    if (researcherCand.length > 0) {
        let tmp = []
        for (row of researcherCand) {
            for (r of row.split(/\d|\*|,/g, row)){
                r = r.replace(/\band\b/g,"").trim();//sub(r"\band\b", "", r).strip()
                if (r.length < 3)
                    continue;
                tmp.push(r);
            }
        }
        researcher = tmp.join(";");
    }
    if (researcher != null) {

        if (researcher.indexOf(";") == -1) {
            let tmp = [];
            researcher = researcher.split(" ");
            for(let i = 0; i<researcher.length; i+=2) {
                if (i + 1 < researcher.length)
                    tmp.push([researcher[i], researcher[i + 1]].join(" "));
                else
                    tmp.push(researcher[i]);
            }
            researcher = tmp.join(";");  
        }
    }

    return [researcher, institution];
}


function getKeywords(cheer){
    var keywordCand = [];
    try {
        if(cheer.root().find("span#ChDivKeyWord").text().trim() == ""){
            return [null,null];
        }
        cheer("span#ChDivKeyWord").each(function(i,elem){
            keywordCand.push(cheer(this).text());
        });
        // soup.find_all("span", {"id" : "ChDivKeyWord"})
        
    }
    catch(error) {
        return [null,null];
    }

    var keywords = [null, null];
    if(keywordCand.length>1)
        keywordCand = [keywordCand[0],keywordCand[1]];//keywordCand[ : 2]
    else if(keywordCand.length==1)
        {}
    
    for(let i=0; i < keywordCand.length; i++) {
        let tmpKey = [];
        for(key of keywordCand[i].split("；")){
            tmpKey.push(key.trim());
        }
        keywords[i] = tmpKey.join(";");
        //keywords[i] = ";".join([key.strip() for key in keywordCand[i].get_text().split("；")])
    }
        
    return keywords;
    //return keywords[0], keywords[1]
}
function getDescription(cheer) {

    var description = "";
    try {
        description = cheer("span#ChDivSummary").text().trim();
        //soup.find("span", {"id" : "ChDivSummary"}).get_text().strip()
    }
    catch(error) {
        return [null, null]; 
    }
    return [description, description];
}

function getDescriptionEn(cheer) {
    var descriptionEn = "";
    try {
        descriptionEn = cheer("span#EnChDivSummary").text().trim();
        //soup.find("span", {"id" : "EnChDivSummary"}).get_text().strip()
    }
    catch(error) {
        return null;
    }
    return descriptionEn;
}

function getProjectId(projectUrl) {
    if (projectUrl == null)
        return null;
    if (projectUrl.indexOf("filename=") != -1)
        return projectUrl.split("filename=")[projectUrl.split("filename=").length-1].trim();
        //return projectUrl.split("filename=")[-1].strip()
    return null;
}


async function parse(features){
    var html = features['html'];
    if(html == null){
        return features;
    }
    html = cleanHtml(html);
    let cheer = cheerio.load(html, {decodeEntities : false});
    features["title"]    = getTitle(cheer);
    features["title_en"] = getTitleEn(cheer);
    features["project_id"]          = getProjectId(features["project_url"]);
    features["project_id_original"] = features["project_id"];

    features["researcher"] = getResearcher(cheer);
    features["institution"] = getInstitution(cheer);
    let research = clearResearcher(getResearcherCleaned(cheer));
    features["researcher_cleaned"] = research[0];
    features["institution_cleaned"] = research[1];
    features["researcher_en"] = features["researcher_cleaned"];
    features["institution_en"] = features["institution_cleaned"];

    let keyword = getKeywords(cheer);
    features["keyword"] = keyword[0];
    features["keyword_en"] = keyword[1];
    let desc = getDescription(cheer);
    features["description"] = desc[0];
    features["description_raw"] = desc[1];
    features["description_en"]                           = getDescriptionEn(cheer);

    return features;
}

module.exports = {
    parse,
  };
