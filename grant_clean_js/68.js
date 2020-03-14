const cheerio = require('cheerio');

function getTitle(cheer) {
    try {
        if(cheer("h1.readcontent").first().text().trim() == "")
            return null;
        return cheer("h1.readcontent").first().text().trim();
        // return soup.find("h1", {"class" { "readcontent"}).get_text().trim()
    }
    catch {
        return null;
    }
}

function getProjectId(cheer) {
    var candSection = [];
    try {
        candSection = cheer("div.section.emphasize").children();
        // .each(function(i, elem){
        //     candSection.push(cheer(this));
        // });
        
        // candSection = soup.find("div", {"class" { "section emphasize"}).find_all()
    }
    catch {
        return null;
    }
    var projectId = null;
    // for (i in range(len(candSection) - 1)) {
     for(let i=0; i<candSection.length-1; i++){
        var curTag  = candSection[i]
        if (i + 1 < candSection.length) {
            var nextTag = candSection[i + 1];
        }
        else {
            var nextTag = null;
        }
        if (curTag.children[0].data.toString().trim() == "Project number" && nextTag != null){
            // if (curTag.name.startswith("h") && nextTag.name.startswith("p")) {
            if(curTag.name.startsWith("h") && nextTag.name.startsWith("p")) {
                projectId = nextTag.children[0].data.toString().trim();
            }
        }
    
    }
    return projectId;
}

function getResearcher(cheer) {
    var candSection = [];
    try {
        candSection = cheer("div.section.emphasize").children();
        // .each(function(i, elem){
        //     candSection.push(cheer(this));
        // });
        // candSection = soup.find("div", {"class" { "section emphasize"}).find_all()
    }
    catch {
        return null;
    }
    var researcher = [];
    for (let i=0; i < candSection.length - 1; i++) {
        var curTag  = candSection[i];
        if (i + 1 < candSection.length) {
            var nextTag = candSection[i + 1];
        }
        else {
            nextTag = null;
        }
        if (curTag.children[0].data.toString().trim() == "Main applicant" && nextTag != null){
            if (curTag.name.startsWith("h") && nextTag.name.startsWith("p")) {
                researcher.push(nextTag.children[0].data.toString().trim());
            }
        }
        if (curTag.children[0].data.toString().trim() == "Team members" && nextTag != null){
            if (curTag.name.startsWith("h") && nextTag.name.startsWith("p")) {
                for( res of nextTag.children[0].data.toString().trim().split(",")){
                    researcher.push(res.trim());
                }
            }
        }
    }
    if (researcher.length == 0) {
        return null;
    }
    return researcher.join(";");
    // return ";".join(researcher);
}

function getInstitution(cheer) {
    var candSection = [];
    try {
        candSection = cheer("div.section.emphasize").children();
        // .each(function(i, elem){
        //     candSection.push(cheer(this));
        // });
        // candSection = soup.find("div", {"class" { "section emphasize"}).find_all()
    }
    catch {
        return null;
    }
    var institution = null;
    for (let i=0; i<candSection.length - 1; i++){
        var curTag  = candSection[i];
        if (i + 1 < candSection.length ){
            var nextTag = candSection[i + 1];
        }
        else {
            var nextTag = null;
        }
        if (curTag.children[0].data.toString().trim() == "Affiliated with" && nextTag != null){
            if (curTag.name.startsWith("h") && nextTag.name.startsWith("p")) {
                institution = nextTag.children[0].data.toString().trim();
            }
        }
    }
     
    if (institution == "") {
        return null;
    }

    return institution;
}
function getDescription(cheer) {
    var description = [];
    try {
        cheer("div.readcontent").find("p").each(function(i, elem){
            description.push(cheer(this).text());
        });
        // description_cand = soup.find("div", {"class" { "readcontent"})
    }
    catch {
        return null;
    }
    // var description = [];

    // try {
    //     description = description_cand.find_all("p")
    // catch {
    //     pass

    if (description.length > 0) {
        let tmpDesc = [];
        for(desc of description){
            tmpDesc.push(desc.toString().trim());
        }
        description = tmpDesc.join("\n").trim();
        //description = "\n".join([desc.get_text().trim() for desc in description]).trim()
    }
    else {
        return null;
    }
    if (description == "") {
        return null;
    }
    return description;
}
function getDescriptionRaw(cheer) {
    var descriptionRaw = null;
    try {
        descriptionRaw = cheer("div.readcontent").first().text().trim();
        // description_raw_cand = soup.find("div", {"class" { "readcontent"})
    }
    catch {
        return null;
    }

    if (descriptionRaw == "") {
        return null;
    }
    return descriptionRaw;
}

function getStartEndDate(cheer) {
    var candSection = [];
    try {
        candSection = cheer("div.section.emphasize").children();
        // .each(function(i, elem){
        //     candSection.push(cheer(this));
        // });
        // // candSection = soup.find("div", {"class" { "section emphasize"}).find_all()
    }
    catch {
        return [null, null];
    }
    
    var startEndDate = ""
    for (let i=0; i < candSection.length - 1;i++) {
        var curTag  = candSection[i];
        if (i + 1 < candSection.length ){
         var nextTag = candSection[i + 1];
        }
        else {
            var nextTag = null;
        }
        if (curTag.children[0].data.toString().trim() == "Duration" && nextTag != null){
            if (curTag.name.startsWith("h") && nextTag.name.startsWith("p")) {
                startEndDate = nextTag.children[0].data.toString().trim();
            }
        }
    }
    
    var regexString = /\b\d{2}\/\d{2}\/\d{4}\b/g;
    var matchs = [];
    matchs = startEndDate.match(regexString);
    // matchs = re.findall(regexString, startEndDate)
    if(matchs != null)
    if (matchs.length > 0) {
        for (let i=0; i<matchs.length;i++) {
            try {
                var dateSplitted = matchs[i].split("/");
                var toDate = new Date(dateSplitted[2],(parseInt(dateSplitted[1])-1).toString(),(parseInt(dateSplitted[0])+1).toString());
                // matchs[i] = datetime.datetime.strptime(matchs[i], "%d/%m/%Y"):
                matchs[i] = toDate.toISOString().substring(0,10).replace(/-/g,"/");
            }
            catch {
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
    if (startDate == null) 
        return null;
    else if(startDate.length == 0 )
        return null;
    return startDate.substr(0,4)
    // return startDate[ : 4];
    
}
function getEndYear(endDate) {
    if (endDate.length == 0 || endDate == null) 
        return null;
    return endDate.substr(0,4);
    // return endDate[ : 4]
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
    var cheer = cheerio.load(html, {decodeEntities: false});
    
    features["title"]               = getTitle(cheer);
    features["project_id"]          = getProjectId(cheer);
    features["project_id_original"] = features["project_id"];

    features["researcher"]      = getResearcher(cheer);
    features["researcher_en"]   = features["researcher"];
    features["institution"]     = getInstitution(cheer);

    features["description_en"]  = getDescription(cheer);
    features["description"]     = features["description_en"];
    features["description_raw"] = getDescriptionRaw(cheer);
    var dates = getStartEndDate(cheer);
    features["start_date"] = dates[0];
    features["end_date"] = dates[1];
    features["start_year"] = getStartYear(features["start_date"]);
    features["end_year"]   = getStartYear(features["end_date"]);
    features["country"] = "NL";

    if( features["start_year"] != null && features["end_year"] !=null ) {
        features["project_term"] = parseInt(features["end_year"]) - parseInt(features["start_year"]) + 1 + " years"
    }else{
        features["project_term"] = null
    };
    

    return features

}

module.exports = {
    parse,
  };
