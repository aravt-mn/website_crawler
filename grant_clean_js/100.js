const cheerio = require('cheerio');

function getResearcher(cheer) {
    var spans = [];
    try {
        cheer("span.name, span.value").each(function(i, elem){
            spans.push(cheer(this));
        });
    }
    catch(error) {
        return [null, null];
    }
    var researcher = [];
    var institution = [];
    //(i in range(0, len(spans) if len(spans) % 2 == 0 else len(spans) - 1, 2) ) 
    var len = spans.length%2 == 0 ? spans.length : spans.length-1;
    for(let i = 0; i <  len; i+=2){ 
        var curSpan = spans[i];
        var nextSpan = spans[i + 1];
        if(curSpan) {
            var curText = curSpan.text().replace(/­/g, "");
        }else {
            continue;
        }
        // if(curText.indexOf("Antragsteller") != -1||curText.indexOf('An­trag­stel­le­rin­nen') != -1 || curText.indexOf('An­trag­stel­ler') != -1 || curText.indexOf('Teil­pro­jekt­lei­te­rin­nen / Teil­pro­jekt­lei­ter') != -1 || curText.indexOf('Teil­pro­jekt­lei­ter') != -1 ) {
        if(curText.indexOf("Antragsteller") != -1 || curText.indexOf('Teil­pro­jekt­lei­ter') != -1 ) {
            try {
                cheer = cheer.load(nextSpan.html());
                cheer("a").each(function(i,elem){
                    researcher.push(cheer(this).text().trim());
                });
                // for (row in nextSpan.find_all("a")) {
                //     researcher.append(row.get_text().strip())
                // }
            }
            catch(error) {

            }
            // [s.extract() for s in nextSpan.find_all("a")]
            nextSpan = cheer.load(nextSpan.html());
            nextSpan("a").each(function(i, elem){
                nextSpan(this).remove();
            });

            tmpSpan = nextSpan.html().replace(/<br\/>/g, ";");
            cheer = cheer.load(tmpSpan);
            try {
                for(row of cheer.text().split(";") ){
                    if (row.trim() != "" ){
                        institution.push(row.trim());
                    }
                }
            }
            catch(error) {}
        }
        regexString = /Teilprojektleiter|Leiter|Wis­sen­schaft­le­rin­nen|Sprecher/g
        //re.search(regexString, curText) {}
        // curText = curText.replace(/­/g, "")

        if (curText.search(regexString) != -1) {
            try {
                cheer = cheer.load(nextSpan.html())
                cheer("a").each(function(i, elem){
                    researcher.push(cheer(this).text().trim());
                });
                // for(row in nextSpan.find_all("a")) {
                //     researcher.append(row.get_text().strip())
                // }
            }
            catch(error) {}
                
        }
        if (curText.search("Institution") != -1) {
            try {
                cheer = cheer.load(nextSpan.html());
                cheer("a").each(function(i, elem){
                    institution.push(cheer(this).text().trim());
                });
                // for row in nextSpan.find_all("a") {}
                //     institution.append(row.get_text().strip())
            }
            catch(error) {
            }
        }
    }
    if(researcher.length > 0){
        researcher = researcher.join(";");
    }
    else{
        researcher = null;
    }
    if(institution.length > 0){
        institution = institution.join(";");
    }
    else{
        institution = null;
    }
    return [researcher, institution];
}

function cleanHtml(html){
    return html.toString().replace(/\n|\t|\s+/g," ");
    //re.sub(r"\n|\t|\s+", " ", str(soup))
}


function getTitle(cheer) {
    try {
        if(cheer("div.details").find("h3").text().trim() == "")
            return null;
        return cheer("div.details").find("h3").text().trim();
        // return cheer.find("div", {"class" {} "details"}).find("h3").get_text().strip()
    }
    catch(error) {
        return null;
    }
}
function getDescription(cheer) {
    try {
        if(cheer("div#projekttext").text().trim() == "")
            return null;
        return cheer("div#projekttext").text().trim();
        // return cheer.find("div", {"id" {} "projekttext"}).get_text().strip()
    }
    catch(error) {
        return null;
    }
}

function getEndYear(cheer) {
    var spans = [];
    try {
        cheer("span.name, span.value").each(async function(i, elem){
            spans.push(cheer(this));
        })
    }
    catch(error) {
        return [null,null];
    }
    var startYear = null;
    var endYear = null;
    for(let i = 0; i < spans.length-1; i++){ 
        curSpan = spans[i];
        nextSpan = spans[i + 1];
        if (curSpan.text().trim() == "F&#xF6;rderung" || curSpan.text().trim() == "Förderung") {
            text = nextSpan.text();
            regexString = /\b\d{4}\b/g;
            var m = text.match(regexString);
            //m = re.findall(regexString, text)
            if (m != null) {
                if (m.length == 2) {
                    startYear = Math.min(m[0], m[1]);
                    endYear = Math.max(m[0], m[1]);
                }
                else if( m.length == 1 ){
                    startYear = m[0];
                }
            }
        }
    }
    return [startYear, endYear];   
}

function getProjectId(projectUrl) {
    if (projectUrl == null) {
        return null
    }
    var projectId = projectUrl.split("/")[projectUrl.split("/").length-1].trim();

    try {
        var pid = parseInt(projectId);
    }
    catch(error) {
        return null;
    }
    return projectId;
}

async function parse(features) {
    var html = features['dtl_html'];

    if(html == null){
        return features;
    }
    html = cleanHtml(html);
    var cheer = cheerio.load(html, {decodeEntities: false});
    features["title"]    = getTitle(cheer);
    features["title_en"] = features["title"];

    features["project_id"]          = getProjectId(features["project_url"]);
    features["project_id_original"] = features["project_id"];
    var res = getResearcher(cheer);
    features["researcher"] = res[0];
    features["institution"] = res[1];

    features["description"]  = getDescription(cheer);
    features["description_raw"] = features["description"];
    let years = getEndYear(cheer);
    features["start_year"] = years[0];
    features["end_year"] = years[1];
    features['country'] = 'DE';
    features['currency'] = 'EUR';
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
