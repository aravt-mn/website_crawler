const cheerio = require('cheerio');
const moment = require('moment');
function getResearcherNew(cheer) {
    try {
        if(cheer("section.block").find("p").text().trim()== "")
        return [null, null];
        cheer = cheer("section.block").find("p").html();
    }
    catch(error) {
        return [null, null];
    }

    var researcher = null;
    var institution = null;
    cheer = cheerio.load(cheer.toString().replace(/<br\/>/g, ";"));

    for (row of cheer.text().split(";")) {
        if (row.trim() == "" ){
            continue;
        }
        var cand = row.split(":");
        if (cand.length == 2 ){
            if (cand[0].trim() == "RST") {
                researcher = cand[1].trim();
            }
            else if(cand[0].trim() == "Etablissement Coordinateur") {
                institution = cand[1].trim();
            }
        }
    }
    return [researcher, institution];
}
    

function getTitle(cheer) {
    try {
        if(cheer("section.content-style").find("h1").text().trim() == "")
            return null;
        return cheer("section.content-style").find("h1").text().trim();
        // return cheer.find("section", {"class" { "content-style"}).find("h1").text().trim();
    }
    catch(error) {
        return null;
    }
    return null;
}

function getInstitution(cheer) {
    var institutionCand = [];
    try {
        cheer("section.block.block-info").each(function(i, elem){
            institutionCand.push(cheer(this));
        });
         //cheer.find_all("section", {"class" { "block block-info"})
    }
    catch(error) {
        return null;
    }

    try {
        for (row of institutionCand) {
            if (row("h2").first().text().trim() == "Partner") {
                var institution = row("div.block__content").find("p").text();
                let tmpInst = [];
                for(ins of institution.split("\n")){
                    if(ins.trim() != ""){
                        tmpInst.push(ins.trim());
                    }
                }
                institution = tmpInst.join(";");
                //institution = ";".join([ins.trim() for ins of institution.split("\n") if ins.trim() != ""])
                return institution;
            }
        }
    }
    catch(error) { 
        return null;
    }
    return null;
}

function getDescription(cheer) {
    var description;
    try {
        if(description = cheer("section.content-style").first().text().trim() == "")
            return null;
        description = cheer("section.content-style").first();
    }
    catch(error) {
        return null;
    }
    description("section").each(function(i, elem){
        description(this).remove();
    });
    description("h1").each(function(i, elem){
        description(this).remove();
    });
    description("div.categories").each(function(i, elem){
        description(this).remove();
    });
    // [s.extract() for s of description.find_all("section")]
    // [s.extract() for s of description.find_all("h1")]
    // [s.extract() for s of description.find_all("div", {"class" { "categories"})]

    return description.text().trim();
}
function getAwardAmount(cheer) {
    var cands = [];
    try {
        cheer("section.block.block-info").each(function(i, elem){
            cands.push(cheer(this));
        });
        // cands = cheer.find_all("section", {"class" { "block block-info"})
    }
    catch(error) {
        return [null, null];
    }

    try {
        for (row of cands) {
            if (row("h2").first().text().trim() == "Partner") {
                var strongs = [];
                row("strong").each(function(i,elem){
                    strongs.push(row(this));
                })
                // row.find_all("strong")
                for (strong of strongs) {
                    if (strong.text().indexOf("ANR") != -1) {
                        var currency =  strong.indexOf("euros") != -1 ? "EUR" : null;
                        //"EUR" if strong.find("euros") != -1 else null
                        var awardAmount = strong.text().replace(/[^\d\.]/g,"");
                        //re.sub(r"[^\d\.]", "", strong.text())
                        try {
                            awardAmount = parseFloat(awardAmount);
                        }
                        catch(error) {
                            return [null, null];
                        }
                        return awardAmount, currency
                    }
                }
            }
        }
    }
    catch(error) { 
        return [null, null];
    }
    return [null, null];
}

function getAwardAmountNew(cheer) {
    try {
        if(cheer("section.block").first().text().trim() == "")
            return [null, null];
        cheer = cheer("section.block").first();
        //cheer.find("section", {"class" { "block"})
    }
    catch(error) {
        return [null, null];
    }

    try {
        var strongs = [];
        cheer("strong").each(function(i,elem){
            strongs.push(cheer(this));
        });
        // cheer.find_all("strong")
        for (strong of strongs) {
            if (strong.text().indexOf("ANR") != -1) {
                var currency = strong.text().indexOf("euros") != -1 ? "EUR" : null;
                //"EUR" if strong.find("euros") != -1 else null
                var awardAmount = strong.text().replace(/[^\d\.]/,"");
                //re.sub(r"[^\d\.]", "", strong.text())
                try {
                    awardAmount = parseFloat(awardAmount);
                }
                catch(error) {
                    return [null, null];
                }
                return [awardAmount, currency];
            }
        }
    }
    catch(error) { 
        return [null, null];
    }
    return [null, null];
}

function getDateNew(cheer) {
    try {
        if(cheer("section.block").first().text().trim() == "")
            return  [null, null];
        cheer = cheer("section.block").first();
    }
    catch(error) {
        return [null, null];
    }

    try {
        // strongs = cheer.find_all("strong")
        var strongs = [];
        cheer("strong").each(function(i,elem){
            strongs.push(cheer(this));
        });
        for (strong of strongs) {
            if (strong.text().indexOf("Investissement") != -1 ){
                var text = strong.text().trim();
                text = text.split("période de")[text.split("période de").length-1]; //[-1]
                var cal = {
                    "janvier" : "January",
                    "février" : "February",
                    "mars" : "March",
                    "avril" : "April",
                    "mai" : "May",
                    "juin" : "June",
                    "juillet" : "July",
                    "aout" : "August",
                    "septembre" : "September",
                    "octobre" : "October",
                    "novembre" : "November",
                    "décembre" : "December",
                };
                var tmp = [];
                for (row of text.split(" ")) {
                    if (row.toLowerCase().trim() in cal) {
                        tmp.push(cal[row.lower().trim()]);
                    }
                    else {
                        tmp.push(row);
                    }
                }
                var text = tmp.join(" ");//" ".join(tmp)
                //text = [t.trim() for t of text.split("à")]
                let txt = [];
                for(t of text.split("à")){
                    txt.push(t.trim());
                }
                if (txt.length > 1) {
                    if (txt[0] == "") {
                        return [null, null];
                    }
                    var d = txt[0].split(" ");
                    txt[0] = moment().year(d[1]).month(d[0]).format("YYYY-MM-DD");
                    //datetime.datetime.strptime(txt[0], "%B %Y").date()
                    d = txt[1].split(" ");
                    txt[1] = moment().year(d[1]).month(d[0]).format("YYYY-MM-DD");
                    //datetime.datetime.strptime(txt[1], "%B %Y").date()
                    return [(txt[0]).toString(), (txt[1]).toString()];
                }
            }
        }
    }
    catch(error) { 
        return [null, null];
    }
    return [null, null];
}

function getDate(cheer) {
    var cands = [];
    try {
        cands = cheer("section.block.block-info").each(function(i, elem){
            cands.push(cheer(this));
        });
        //cheer.find_all("section", {"class" { "block block-info"})
    }
    catch(error) {
        return [null, null];
    }

    try {
        for (row of cands ){
            if (row("h2").first().text().trim() == "Partner" ){
                // strongs = row.find_all("strong")
                var strongs = [];
                row("strong").each(function(i,elem){
                    strongs.push(row(this));
                });
                for (strong of strongs) {
                    if (strong.text().indexOf("project") != -1 ){
                        var text = strong.text().trim();
                        text = text.split(":")[text.split(":").length-1];
                        // text = [t.trim() for t of text.split("-")]
                        var txt = [];
                        for(t of text.split("-")){
                            txt.push(t.trim());
                        }
                        if (txt.length > 1) {
                            if (txt[0] == "") {
                                return [null, null];
                            }
                            var d = txt[0].split(" ");
                            txt[0] = moment().year(d[1]).month(d[0]);//.format("YYYY-MM-DD");
                            // txt[0] = datetime.datetime.strptime(text[0], "%B %Y").date()
                            var tmp = txt[0];
                            var pos = txt[1].indexOf(" Months");
                            
                            if (pos != -1 ){
                                var year_save =  parseInt(parseInt(txt[1].substr(0,pos)) / 12);//int(int(txt[1][{ pos]) / 12)
                                var month_save = parseInt(parseInt(txt[1].substr(0,pos)) % 12)//int(int(txt[1][{ pos]) % 12)
                                var year_save = parseInt(tmp.year()) + year_save + parseInt((parseInt(tmp.month()) + 1 + month_save - 1) / 12)
                                month_save = (month_save + tmp.month() + 1) % 12
                                if (month_save == 0) {
                                    month_save = 12;
                                    tmp = tmp.format("YYYY-MM-DD").toString().replace(d[1],year_save.toString()).replace(tmp.toString().substr(5,2),month_save.toString);                                    
                                        // txt[1] = tmp.replace(year=year_save, month=month_save)
                                    txt[1] = tmp;
                                }
                                return [(txt[0]).toString(), (txt[1]).toString()];
                            }
                        }
                    }
                }
            }
        }
    }
    catch(error) { 
        return [null, null];
    }
    return [null, null];
}


function getEndYear(endDate) {
    if (endDate == null || endDate.length == 0) {
        return null;
    }
    if (endDate.length > 4) {
        return endDate.substr(0,4);
        // return endDate[ : 4]
    }
    return null;
}

function getProjectId(projectUrl) {
    if (projectUrl == null) {
        return null;
    }
    if (projectUrl.indexOf("-") != -1 ){
        return projectUrl.toString().substr(projectUrl.indexOf("-")+1).trim();  //[projectUrl.find("-") + 1 :].trim()
    }
    return null;
}
    


function cleanHtml(html){
    return html.toString().replace(/\n|\t|\s+/g," ");
    //re.sub(r"\n|\t|\s+", " ", str(cheer))
}


async function parse(features){
    var html = features['html'];
    if(html == null){
        return features;
    }
    html = cleanHtml(html);
    let cheer = cheerio.load(html, {decodeEntities : false});
    if (features["project_url"].indexOf("ProjetIA") != -1) {
        features["title"]    = getTitle(cheer);
        features["title_en"] = features["title"];

        features["project_id"]          = getProjectId(features["project_url"]);
        features["project_id_original"] = features["project_id"];
        var award = getAwardAmountNew(cheer);
        features["award_amount"] = award[0];
        features["currency"] = award[1];
        var res = getResearcherNew(cheer);
        features["researcher"] =res[0];
        features["institution"] = res[1];
        var dates = getDateNew(cheer);
        features["start_date"] = dates[0];
        features["end_date"] = dates[1];

        features["description"]  = getDescription(cheer)
        features["description_raw"] = features["description"];
        features["description_en"] = features["description"];

        features["start_year"] = getEndYear(features["start_date"]);
        features["end_year"] = getEndYear(features["end_date"]);
    }
    else {
        features["title"]    = getTitle(cheer);
        features["title_en"] = features["title"];

        features["project_id"]          = getProjectId(features["project_url"]);
        features["project_id_original"] = features["project_id"];
        
        features["institution"] = getInstitution(cheer);
        features["institution_en"] = features["institution"];
        var awards = getAwardAmount(cheer);
        features["award_amount"] = awards[0];
        features["currency"]  = awards[1];
        var date = getDate(cheer);
        features["start_date"] = date[0];
        features["end_date"] = date[1];

        features["description"]  = getDescription(cheer);
        features["description_raw"] = features["description"];
        features["description_en"] = features["description"];

        features["start_year"] = getEndYear(features["start_date"]);
        features["end_year"] = getEndYear(features["end_date"]);
    }
    return features;
}

module.exports = {
    parse,
  };
