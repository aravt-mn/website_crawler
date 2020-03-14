const cheerio = require('cheerio');
const moment = require('moment');


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
    features["country"] = "EE";
    features["currency"] = "EUR"

    if (features["award_amount"])
        features["currency"] = "EUR";

    // console.log("html: ", features["html"]);
    const $ = cheerio.load('<table>' + features["html"] + '</table>');
    const td1=$('table').find('tr:nth-child(1) > td:nth-child(1)').first().text().replace(/&nbsp;/g, '').trim();
    const td2=$('table').find('tr:nth-child(1) > td:nth-child(2)').first().text().replace(/&nbsp;/g, '').trim();
    const td3=$('table').find('tr:nth-child(1) > td:nth-child(3)').first().text().replace(/&nbsp;/g, '').trim();
    const td4=$('table').find('tr:nth-child(1) > td:nth-child(4)').first().text().replace(/&nbsp;/g, '').trim();
    const td5=$('table').find('tr:nth-child(1) > td:nth-child(5)').first().text().replace(/&nbsp;/g, '').trim();
    const td6=$('table').find('tr:nth-child(1) > td:nth-child(6)').first().text().replace(/&nbsp;/g, '').trim();
    const td7=$('table').find('tr:nth-child(1) > td:nth-child(7)').first().text().replace(/&nbsp;/g, '').trim();

    // console.log("cheerio: ",td);

    switch(features["project_url"]){
        case 'https://www.etag.ee/en/funding/research-funding/personal-research-funding/new-call-2017/results-call-2017/':
            features['project_id'] = td1;
            features['researcher'] = td2 + ' ' + td3;
            features['researcher_en'] = features['researcher'];
            features['title'] = td4;
            features['title_en'] = features['title'];
            features['institution'] = td5;

            //title row
            if(features['project_id'] == 'PUT no') {
                features['project_id'] = null;
                features['researcher'] = null;
                features['researcher_en'] = null;
                features['title'] = null;
                features['title_en'] = null;
                features['institution'] = null;
            }
            break;
        case 'https://www.etag.ee/en/funding/mobility-funding/mobilitas-pluss/mobilitas-pluss-post-doctoral-researcher-grant/documents-and-results-2016/':
            // console.log('td1: ', td1);
            // console.log('td2: ', td2);
            // console.log('td3: ', td3);
            // console.log('td4: ', td4);
            features['researcher'] = td1.replace(/\d+./g, '').trim();
            features['researcher_en'] = features['researcher'];
            features['title'] = td3;
            features['title_en'] = features['title'];
            try{
                features['award_amount'] = parseFloat(td4.replace(/ /g, '').replace(',', '.'));
                if(isNaN(features['award_amount'])){features['award_amount'] = null;}
            }catch(err){
                console.log(err);
            }

            // ontsgoi nuhtsul
            if(td1&&td3==''){
                features['project_id'] = null;
                features['researcher'] = null;
                features['researcher_en'] = null;
                features['title'] = null;
                features['title_en'] = null;
                features['institution'] = td1;
            }
            //title row
            if(features['researcher'] == 'Postdoctoral researcher') {
                features['project_id'] = null;
                features['researcher'] = null;
                features['researcher_en'] = null;
                features['title'] = null;
                features['title_en'] = null;
                features['institution'] = null;
            }
            // console.log('researcher: ', features['researcher']);
            // console.log('title: ', features['title']);
            // console.log('inst: ', features['institution']);
            // console.log('money: ', features['award_amount']);
            break;
        case 'https://www.etag.ee/en/funding/research-funding/personal-research-funding/call-2018/results-of-call-2018/':
            features['researcher'] = td1 + ' ' + td2;
            features['researcher_en'] = features['researcher'];
            features['title'] = td3;
            features['title_en'] = features['title'];
            features['institution'] = td4;

            if(features['researcher'] == 'First name Surname') {
                features['project_id'] = null;
                features['researcher'] = null;
                features['researcher_en'] = null;
                features['title'] = null;
                features['title_en'] = null;
                features['institution'] = null;
            }
            break;
        case 'https://www.etag.ee/en/funding/research-funding/personal-research-funding/previous-calls/call-2012/':
        case 'https://www.etag.ee/en/funding/research-funding/personal-research-funding/previous-calls/call-2013/':
            // features['project_id'] = td1;
            features['researcher'] = td2 + ' ' + td3;
            features['researcher_en'] = features['researcher'];
            features['title'] = td4;
            features['title_en'] = features['title'];
            features['institution'] = td5;
            if(td2=='Principal Investigator') {
                features['project_id'] = null;
                features['researcher'] = null;
                features['researcher_en'] = null;
                features['title'] = null;
                features['title_en'] = null;
                features['institution'] = null;
            }
            if(td1&&!td2){
                // console.log('gotcha');
                features['project_id'] = null;
                features['researcher'] = null;
                features['researcher_en'] = null;
                features['title'] = null;
                features['title_en'] = null;
                features['institution'] = null;
            }
            break;
        case 'https://www.etag.ee/en/funding/research-funding/institutional-research-funding/iut-call-2014/':
            features['project_id'] = td1;
            features['researcher'] = td2;
            features['researcher_en'] = features['researcher'];
            features['title'] = td3;
            features['title_en'] = features['title'];
            features['institution'] = td4;

            if(td1 == 'Topic') {
                features['project_id'] = null;
                features['researcher'] = null;
                features['researcher_en'] = null;
                features['title'] = null;
                features['title_en'] = null;
                features['institution'] = null;
            }
            if(!td1&&td3){
                // console.log('gotcha');
                features['project_id'] = null;
                features['researcher'] = null;
                features['researcher_en'] = null;
                features['title'] = null;
                features['title_en'] = null;
                features['institution'] = null;
            }
            break;
        case 'https://www.etag.ee/en/funding/research-funding/institutional-research-funding/call-2013/':

            if(td1 && td4){
                features['project_id'] = td2;
                features['researcher'] = td3;
                features['researcher_en'] = features['researcher'];
                features['title'] = td4;
                features['title_en'] = features['title'];
                features['institution'] = td5;

                if(td3 == 'Principal Investigator') {
                    features['project_id'] = null;
                    features['researcher'] = null;
                    features['researcher_en'] = null;
                    features['title'] = null;
                    features['title_en'] = null;
                    features['institution'] = null;
            }
            }else{
                features['project_id'] = null;
                features['researcher'] = null;
                features['researcher_en'] = null;
                features['title'] = null;
                features['title_en'] = null;
                features['institution'] = null;
            }
            break;
        case 'https://www.etag.ee/en/funding/research-funding/institutional-research-funding/call-2012/':
            // features['project_id'] = td1;
            features['researcher'] = td2;
            features['researcher_en'] = features['researcher'];
            features['title'] = td4;
            features['title_en'] = features['title'];
            features['institution'] = td3;

            if(td2 == 'Principal Investigator') {
                features['project_id'] = null;
                features['researcher'] = null;
                features['researcher_en'] = null;
                features['title'] = null;
                features['title_en'] = null;
                features['institution'] = null;
            }
            if(td2&&!td3){
                features['project_id'] = null;
                features['researcher'] = null;
                features['researcher_en'] = null;
                features['title'] = null;
                features['title_en'] = null;
                features['institution'] = null;
            }
            break;
        case 'https://www.etag.ee/en/funding/mobility-funding/mobilitas-pluss/returning-researcher-grant/documants-and-results-2016/':
                //university name dara clean hiihdee comparison.js dotor zasdag baidlaar uurchilluu. 2020-01-15 Khangai
                // console.log('td1: ',td1);
                // console.log('td2: ',td2);
                // console.log('td3: ',td3);
                // console.log('td4: ',td4);

                if(td4){
                    // console.log('a standart config');
                    features['project_id'] = td1;
                    features['researcher'] = td2;
                    features['researcher_en'] = features['researcher'];
                    features['title'] = td3;
                    features['title_en'] = features['title'];
                    try{
                        features['award_amount'] = parseFloat(td4.replace(/ /g, '').replace(',', '.'));
                        if(isNaN(features['award_amount'])){features['award_amount'] = null;}
                    }catch(err){
                        console.log(err);
                    }
        
                    if(td2 == 'Returning researcher') {
                        features['project_id'] = null;
                        features['researcher'] = null;
                        features['researcher_en'] = null;
                        features['title'] = null;
                        features['title_en'] = null;
                        features['institution'] = null;
                        features['award_amount'] = null;
                    }
                    // console.log('id:',features['project_id']);
                    // console.log('researcher: ', features['researcher']);
                    // console.log('title: ', features['title']);
                    // console.log('institution: ', features['institution']);
                    // console.log('award amount: ', features['award_amount']);
                }else{
                    if(td3){
                        if(td2){
                            // console.log('b ontsgoi tohirgoo husnegt');
                            if(td1.indexOf('.')!=-1){
                                var td11 = td1.split('.')[0].trim();
                                var td12 = td1.split('.')[1].trim();
                                features['project_id'] = td11;
                                features['researcher'] = td12;
                                features['researcher_en'] = features['researcher'];
                                features['title'] = td2;
                                features['title_en'] = features['title'];
                            }
                            
                            try{
                                features['award_amount'] = parseFloat(td3.replace(/ /g, '').replace(',', '.'));
                                if(isNaN(features['award_amount'])){features['award_amount'] = null;}
                            }catch(err){
                                console.log(err);
                            }
                        }else{
                            // console.log('c ontsgoi tohirgoo husnegtiin surguuli');
                            features['institution'] = td1;
                            try{
                                features['award_amount'] = parseFloat(td3.replace(/ /g, '').replace(',', '.'));
                                if(isNaN(features['award_amount'])){features['award_amount'] = null;}
                            }catch(err){
                                console.log(err);
                            }
                        }

                        if(td1 == 'Returning researcher') {
                            // console.log('');
                            features['project_id'] = null;
                            features['researcher'] = null;
                            features['researcher_en'] = null;
                            features['title'] = null;
                            features['title_en'] = null;
                            features['institution'] = null;
                            features['award_amount'] = null;
                        }
                    }else{
                        // console.log('d');
                        features['institution'] = td1;
                    }
                    // console.log('id:',features['project_id']);
                    // console.log('researcher: ', features['researcher']);
                    // console.log('title: ', features['title']);
                    // console.log('institution: ', features['institution']);
                    // console.log('award amount: ', features['award_amount']);
                }
                features['project_id'] = null;
                break;
            case 'https://www.etag.ee/en/funding/mobility-funding/mobilitas-pluss/top-researcher-grant/results/':
                features['researcher'] = td1;
                features['researcher_en'] = features['researcher'];
                features['title'] = td2;
                features['title_en'] = features['title'];
                features['institution'] = td3;
                try{
                    features['award_amount'] = parseFloat(td4.replace(/ /g, '').replace(',', '.'));
                    if(isNaN(features['award_amount'])){features['award_amount'] = null;}
                }catch(err){
                    console.log(err);
                }
    
                if(td2 == 'Name of the Project') {
                    features['project_id'] = null;
                    features['researcher'] = null;
                    features['researcher_en'] = null;
                    features['title'] = null;
                    features['title_en'] = null;
                    features['institution'] = null;
                }
                break;
            case 'https://www.etag.ee/en/funding/programmes/closed-programmes/mobilitas/postdoctoral-researcher/grant-holders-postdoctors/':
                features['project_id'] = td2;
                features['researcher'] = td3;
                features['researcher_en'] = features['researcher'];
                
                features['institution']='';
                switch(td4.trim()){
                    case 'TÜ':	features['institution'] = 'University of Tartu'; break;
                    case 'TTÜ':	features['institution'] = 'Tallinn University of Technology'; break;
                    case 'TLÜ':	features['institution'] = 'Tallinn University'; break;
                    case 'EMÜ':	features['institution'] = 'Estonian University of Life Sciences'; break;
                    case 'KBFI':	features['institution'] = 'National Institute of Chemical Physics and Biophysics'; break;
                    case 'KIRMUS':	features['institution'] = 'Estonian Literary Museum'; break;
                    default: 
                        features['institution'] = td4;
                        console.log(td4);
                }

                features['keyword'] = '';
                var kw = td6.split(','), i;
                for( i = 0;i<kw.length;i++){
                    switch(kw[i].trim()){
                        case 'KE':	
                            if (i == 0) {features['keyword'] = 'Environment and biosciences';}else{features['keyword']= features['keyword'] + '; Environment and biosciences';}
                            break;
                        case 'ÜK':
                            if (i == 0) {features['keyword'] = 'Culture and society';}else{features['keyword']= features['keyword'] + '; Culture and society';}
                            break;	
                        case 'TU':	
                            if (i == 0) {features['keyword'] = 'Health';}else{features['keyword']= features['keyword'] + '; Health';}
                            break;
                        case 'LT':	
                            if (i == 0) {features['keyword'] = 'Natural Sciences and Engineering';}else{features['keyword']= features['keyword'] + '; Natural Sciences and Engineering';}
                            break;
                        default:
                            features['keyword'] = td6;
                    }
                }

                features['title'] = td7;
                features['title_en'] = features['title'];

                if(td2 == 'Grant nr/No'
                    ||td2 == 'TÜ'  
                    ||td2 == 'TTÜ'
                    ||td2 == 'TLÜ'
                    ||td2 == 'EMÜ'
                    ||td2 == 'KBFI'
                    ||td2 == 'KIRMUS'
                    ||td2 == 'KE'
                    ||td2 == 'ÜK'
                    ||td2 == 'TU'
                    ||td2 == 'LT'
                    ) 
                {
                    features['project_id'] = null;
                    features['researcher'] = null;
                    features['researcher_en'] = null;
                    features['title'] = null;
                    features['title_en'] = null;
                    features['institution'] = null;
                    features['keyword'] = null;
                }
                break;
            case 'https://www.etag.ee/en/funding/programmes/closed-programmes/mobilitas/top-researcher/grant-holders/':
                features['project_id'] = td2;
                features['researcher'] = td3;
                features['researcher_en'] = features['researcher'];
                
                // console.log('TLU: ',td4);
                switch(td4){
                    case 'TÜ':	features['institution'] = 'University of Tartu'; break;
                    case 'TTÜ':	features['institution'] = 'Tallinn University of Technology'; break;
                    case 'TLÜ':	features['institution'] = 'Tallinn University'; break;
                    // case 'EMÜ':	features['institution'] = 'Estonian University of Life Sciences'; break;
                    case 'KBFI':	features['institution'] = 'National Institute of Chemical Physics and Biophysics'; break;
                    // case 'KIRMUS':	features['institution'] = 'Estonian Literary Museum'; break;
                    default: 
                        features['institution'] = td4;
                }

                features['keyword'] = '';
                switch(td5){
                    case 'IKT':	
                        features['keyword'] = 'information and communication technology';
                        break;
                    case 'MT':	
                        features['keyword'] = 'material technology';
                        break;
                    case 'BT':
                        features['keyword'] = 'biotechnology';
                        break;	
                    case 'E':	
                        features['keyword'] = 'energy';
                        break;
                    case 'KKT':	
                        features['keyword'] = 'environmental technology';
                        break;
                    case 'T':	
                        features['keyword'] = 'health';
                        break;
                    default:
                        features['keyword'] = td5;
                }

                features['title'] = td6;
                features['title_en'] = features['title'];

                if(td2 == 'Grant nr/No'
                    ||td2 == 'TÜ'  
                    ||td2 == 'TTÜ'
                    ||td2 == 'TLÜ'
                    ||td2 == 'KBFI'
                    ||td2 == 'IKT'
                    ||td2 == 'MT'
                    ||td2 == 'BT'
                    ||td2 == 'E'
                    ||td2 == 'KKT'
                    ||td2 == 'T'
                    ) 
                {
                    features['project_id'] = null;
                    features['researcher'] = null;
                    features['researcher_en'] = null;
                    features['title'] = null;
                    features['title_en'] = null;
                    features['institution'] = null;
                    features['keyword'] = null;
                }
                break;

            case 'https://www.etag.ee/en/funding/programmes/closed-programmes/eeanorway-grants/':
                features['project_id'] = td1;
                features['keyword'] = td2;
                features['researcher'] = td3;
                features['researcher_en'] = features['researcher'];
                features['institution'] = td4;
                features['title'] = td6;
                features['title_en'] = features['title'];

                try{
                    features['award_amount'] = parseFloat(td7.replace(/ /g, '').replace(',', '.'));
                    if(isNaN(features['award_amount'])){features['award_amount'] = null;}
                }catch(err){
                    console.log(err);
                }

                if(td2 == 'Research area') {
                    features['project_id'] = null;
                    features['researcher'] = null;
                    features['researcher_en'] = null;
                    features['title'] = null;
                    features['title_en'] = null;
                    features['institution'] = null;
                    features['award_amount'] = null;
                }
                break;
            case 'https://www.etag.ee/en/funding/programmes/closed-programmes/eeanorway-grants/eeanorway-grants-2004-2009/':
                features['researcher'] = td1;
                features['researcher_en'] = features['researcher'];
                features['institution'] = td2;
                features['title'] = td3;
                features['title_en'] = features['title'];
                
                if(td4 != 'Start'){
                    features['start_date'] = moment(td4, "DD.MM.YYYY").format('YYYY-MM-DD');
                    features['end_date'] = moment(td5, "DD.MM.YYYY").format('YYYY-MM-DD');
                    features['start_year'] = moment(td4, "DD.MM.YYYY").format('YYYY');
                    features['end_year'] = moment(td5, "DD.MM.YYYY").format('YYYY');
                    // features['project_term'] = moment(td5, "DD.MM.YYYY") - moment(td4, "DD.MM.YYYY");
                    var date2 = moment(td5, "DD.MM.YYYY");
                    var date1 = moment(td4, "DD.MM.YYYY");
                    var years = date2.diff(date1, 'year');
                    date1.add(years, 'years');
                    var months = date2.diff(date1, 'months');
                    date1.add(months, 'months');
                    var days = date2.diff(date1, 'days');
                    // console.log(years + ' years ' + months + ' months ' + days + ' days');
                    features['project_term'] = years + ' years ' + months + ' months ' + days + ' days';
                }
                
                if(td2 == 'Institution') {
                    // features['project_id'] = null;
                    features['researcher'] = null;
                    features['researcher_en'] = null;
                    features['title'] = null;
                    features['title_en'] = null;
                    features['institution'] = null;
                    // features['award_amount'] = null;
                    features['start_date'] = null;
                    features['end_date'] = null;
                    features['start_year'] = null;
                    features['end_year'] = null;
                    features['project_term'] = null;
                }
                break;
            case 'https://www.etag.ee/en/funding/programmes/closed-programmes/ermos/marie-curie-fellows/':
                features['project_id'] = td1;
                features['researcher'] = td2;
                features['researcher_en'] = features['researcher'];
                features['title'] = td3;
                break;
        default:
    }

    return features;
}
module.exports = {
    parse,
  };
