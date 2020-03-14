const cheerio = require('cheerio');

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


function parse(features) {

    // for( let [key, val] of Object.entries(features) ){
    //     if (["award_amount", "award_amount_usd"].includes(key) ){
    //         features[key] = checkAwardAmount(val);
    //     }
    //     else　if (["funded_date", "start_date", "end_date"].includes(key) ){
    //         features[key] = checkDate(val);
    //     }
    //     else {
    //         features[key] = checkText(val);
    //     }
    // }


    // console.log('html: ', features['html']);
    const $ = cheerio.load('<table>' + features["html"] + '</table>');
    const td1=$('table').find('tr:nth-child(1) > td:nth-child(1)').first().text().replace(/&nbsp;/g, '').trim();
    const td2=$('table').find('tr:nth-child(1) > td:nth-child(2)').first().text().replace(/&nbsp;/g, '').trim();
    const td3=$('table').find('tr:nth-child(1) > td:nth-child(3)').first().text().replace(/&nbsp;/g, '').trim();
    const td4=$('table').find('tr:nth-child(1) > td:nth-child(4)').first().text().replace(/&nbsp;/g, '').trim();
    const td5=$('table').find('tr:nth-child(1) > td:nth-child(5)').first().text().replace(/&nbsp;/g, '').trim();
    const td6=$('table').find('tr:nth-child(1) > td:nth-child(6)').first().text().replace(/&nbsp;/g, '').trim();
    const td7=$('table').find('tr:nth-child(1) > td:nth-child(7)').first().text().replace(/&nbsp;/g, '').trim();

    switch(features['project_url']){
        case 'https://royalsociety.org.nz/what-we-do/funds-and-opportunities/marsden/awarded-grants/marsden-grants-awarded-2016/':
            features['title'] = td1;
            features['title_en'] = features['title'];
            features['project_id'] = td2;
            features['project_id_original'] = td2;
            features['researcher'] = td3;
            features['researcher_en'] = td3;
            features['institution'] = td4;

            try{
                features['award_amount'] = parseInt(td6.replace(/\$/g, '').trim().replace(/,/g, ''));
                if(isNaN(features['award_amount'])){features['award_amount'] = null;}
            }catch(err){
                console.log(err);
            }
            features['award_amount_usd'] = features['award_amount'];
            break;

        case 'https://royalsociety.org.nz/what-we-do/funds-and-opportunities/new-zealand-ecohydraulics-trust-travel-award/recipients/':
            features['start_year'] = td1;
            features['researcher'] = td2;
            features['researcher_en'] = td2;
            features['institution'] = td3;
            features['title'] = td4;
            features['title_en'] = features['title'];
            try{
                features['award_amount'] = parseInt(td5.replace(/\$/g, '').trim().replace(/,/g, ''));
                if(isNaN(features['award_amount'])){features['award_amount'] = null;}
            }catch(err){
                console.log(err);
            }
            features['award_amount_usd'] = features['award_amount'];
            break;

            default:
            // case 'https://royalsociety.org.nz/what-we-do/funds-and-opportunities/catalyst-fund/catalyst-leaders/recipients/recipients-january-2016/':
            // case 'https://royalsociety.org.nz/what-we-do/funds-and-opportunities/catalyst-fund/catalyst-leaders/recipients/recipients-april-2016/':
            // case 'https://royalsociety.org.nz/what-we-do/funds-and-opportunities/catalyst-fund/catalyst-leaders/recipients/recipients-july-2016/':
            if(td6){
                if(td6.match(/,/g)){
                    features['researcher'] = td1 + ';' + td6.split(',')[0].trim();
                    features['researcher_en'] = features['researcher'];

                    features['institution'] = td2 + ';' + td6.split(',')[1].trim();
                }else{
                    if(td6.match(/\(.*?\)/g)){
                        features['researcher'] = td1 + ';' + td6.replace(/\(.*?\)/g, '').trim();
                        features['researcher_en'] = features['researcher'];
                        
                        features['institution'] = td2 + ';' + td6.match(/\(.*?\)/g)[0].replace(/\(/g, '').replace(/\)/g, '').trim();
                    }else{
                        features['researcher'] = td1 + ';' + td6;
                        features['researcher_en'] = features['researcher'];

                        features['institution'] = td2;
                    }
                    
                }
                
                features['title'] = td3;
                features['title_en'] = features['title'];
                features['project_term'] = td5 + ' months';

                try{
                    features['award_amount'] = parseInt(td4.replace(/\$/g, '').trim().replace(/,/g, ''));
                    if(isNaN(features['award_amount'])){features['award_amount'] = null;}
                }catch(err){
                    console.log(err);
                }
                features['award_amount_usd'] = features['award_amount'];
            }else{
                if(td5){
                    features['researcher'] = td1 + ';' + td4;
                    features['institution'] = td2 + ';' + td5;
                    features['title'] = td3;
                    features['title_en'] = features['title'];
                }else{
                    features['researcher'] = td1;
                    features['researcher_en'] = features['researcher'];
                    features['institution'] = td2;
                    features['title'] = td3;
                    features['title_en'] = features['title'];
                }
            }
            if(td3.toLowerCase() == 'project title'){
                features['title'] = null;
                features['title_en'] = null;
                features['researcher'] = null;
                features['researcher_en'] = null;
                features['institution'] = null;
                features['award_amount'] = null;
                features['award_amount_usd'] = null;
                features['project_term'] = null;
            }
            // break;
        // default:
        //     console.log(features['project_url']);
    };


    features["country"] = "NZ";
    features["currency"] = "USD";

    return features;
}
module.exports = {
    parse,
  };


