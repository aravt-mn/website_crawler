const cheerio = require('cheerio');

function parse(features) {
    const $ = cheerio.load('<html><body>' + features["html"] + '</body></html>');

    // console.log($.text());

    var candTr = [];
    // console.log($('.listingdetails').text());

    try {
        $('.listingdetails').each(function(i, elem){
            candTr.push($(this).text());
        });
    }
    catch(error) {
        return [null, null];
    }

    // console.log(candTr);
    for (txt of candTr){
        // console.log(txt);
        if(txt.match(/Capacity:/g)){
            // console.log(txt.replace(/Capacity:/g, '').trim())
            features['keyword'] = txt.replace(/Capacity:/g, '').trim();
        }
    }

    // console.log($('.listingdetails.clearfix').attr('title'));
    features['source'] = $('.listingdetails.clearfix').attr('title');
    return features;
}

module.exports = {
    parse,
};

// function parse(features) {
//     const $ = cheerio.load('<html><body>' + features["html"] + '</body></html>');
    
//     var list = []
    
//     // console.log($('body > div > ul').html())

//     $('body > div > ul').find('a').each(function(){
//         var href = $(this).attr('href')
//         // console.log(href)
//         list.push(href)
//     })
//     features['description'] = list.join(';')

//     if(!features['description']) {console.log('----------------------------------------error')} 
//     // $('body > div > div').find('a').each(function(){
//     //     var href = $(this).attr('href');
//     //     console.log(href)
//     // });

//     // body > div > ul > li > a > i > strong
//     // body > div > ul > i > li > a > i > strong
//     // body > div > ul > i > i > li > a > i > strong


//     // body > div > ul > i > i > i > i > i > li > a > i > strong

//     return features;
// }

// module.exports = {
//     parse,
// };