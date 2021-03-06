INSERT INTO public.grant_sites
(id, "name", url, name_en, url_en, active)
VALUES(1, 'eventective', 'https://www.eventective.com/', 'eventective', 'https://www.eventective.com/', true);

INSERT INTO public.grant_sites_query (id,site_id,url,request_type,response_type,block_name,detail_path,crawl_status,page_range,detail_request_type,detail_response_type,detail_path_type,post_param) VALUES 
(1,1,'https://www.eventective.com/{0}/{1}/?p={2}','GET','HTML','#ListView > div','a',0,'1-1','GET','HTML',NULL,NULL)
;

INSERT INTO public.grant_sites_query_param (id,query_id,"type",param,order_number) VALUES 
(1,1,'list','{"list": [ "stamford-ct", "norwalk-ct", "danbury-ct", "hartford-ct", "new-haven-ct", "mystic-ct", "wilmington-de", "newark-de", "rehoboth-beach-de", "dover-de", "lewes-de", "middletown-de", "miami-fl", "orlando-fl", "tampa-fl", "jacksonville-fl", "miami-beach-fl", "fort-lauderdale-fl", "atlanta-ga", "savannah-ga", "augusta-ga", "marietta-ga", "alpharetta-ga", "duluth-ga", "honolulu-hi", "lahaina-hi", "kihei-hi", "kailua-kona-hi", "kaneohe-hi", "kamuela-hi", "des-moines-ia", "cedar-rapids-ia", "west-des-moines-ia", "dubuque-ia", "iowa-city-ia", "ames-ia", "boise-id", "coeur-d-alene-id", "meridian-id", "nampa-id", "garden-city-id", "idaho-falls-id", "chicago-il", "peoria-il", "rockford-il", "springfield-il", "bloomington-il", "rosemont-il", "indianapolis-in", "fort-wayne-in", "evansville-in", "bloomington-in", "south-bend-in", "carmel-in", "wichita-ks", "overland-park-ks", "lawrence-ks", "topeka-ks", "manhattan-ks", "olathe-ks", "louisville-ky", "lexington-ky", "bowling-green-ky", "covington-ky", "frankfort-ky", "newport-ky", "new-orleans-la", "baton-rouge-la", "lafayette-la", "shreveport-la", "metairie-la", "mandeville-la", "boston-ma", "cambridge-ma", "worcester-ma", "lenox-ma", "plymouth-ma", "waltham-ma", "fargo-nd", "bismarck-nd", "grand-forks-nd", "mandan-nd", "jamestown-nd", "minot-nd", "baltimore-md", "annapolis-md", "ocean-city-md", "bethesda-md", "frederick-md", "columbia-md", "portland-me", "bangor-me", "kennebunkport-me", "bar-harbor-me", "scarborough-me", "camden-me", "toronto-on", "ottawa-on", "mississauga-on", "niagara-falls-on", "london-on", "north-york-on", "grand-rapids-mi", "detroit-mi", "ann-arbor-mi", "traverse-city-mi", "lansing-mi", "kalamazoo-mi", "minneapolis-mn", "saint-paul-mn", "duluth-mn", "rochester-mn", "saint-cloud-mn", "mankato-mn", "charlottetown-pe", "summerside-pe", "breadalbane-pe", "cardigan-pe", "cornwall-pe", "green-gables-pe", "saint-louis-mo", "kansas-city-mo", "springfield-mo", "saint-charles-mo", "columbia-mo", "branson-mo", "jackson-ms", "gulfport-ms", "biloxi-ms", "hattiesburg-ms", "oxford-ms", "tupelo-ms", "montreal-qc", "quebec-qc", "laval-qc", "gatineau-qc", "dorval-qc", "la-malbaie-qc", "missoula-mt", "billings-mt", "bozeman-mt", "great-falls-mt", "kalispell-mt", "west-yellowstone-mt", "charlotte-nc", "raleigh-nc", "asheville-nc", "durham-nc", "wilmington-nc", "greensboro-nc", "saskatoon-sk", "regina-sk", "moose-jaw-sk", "prince-albert-sk", "melfort-sk", "north-battleford-sk", "carcross-yt", "marsh-lake-yt", "tagish-yt", "teslin-yt", "omaha-ne", "lincoln-ne", "kearney-ne", "la-vista-ne", "bellevue-ne", "nebraska-city-ne", "portsmouth-nh", "manchester-nh", "laconia-nh", "concord-nh", "dover-nh", "nashua-nh", "jersey-city-nj", "hoboken-nj", "atlantic-city-nj", "newark-nj", "cape-may-nj", "trenton-nj", "albuquerque-nm", "santa-fe-nm", "las-cruces-nm", "taos-nm", "ruidoso-nm", "farmington-nm", "las-vegas-nv", "reno-nv", "henderson-nv", "carson-city-nv", "sparks-nv", "stateline-nv", "new-york-ny", "brooklyn-ny", "buffalo-ny", "rochester-ny", "albany-ny", "syracuse-ny", "columbus-oh", "cincinnati-oh", "cleveland-oh", "dayton-oh", "akron-oh", "toledo-oh", "oklahoma-city-ok", "tulsa-ok", "norman-ok", "broken-arrow-ok", "edmond-ok", "ardmore-ok", "portland-or", "eugene-or", "salem-or", "bend-or", "medford-or", "grants-pass-or", "philadelphia-pa", "pittsburgh-pa", "lancaster-pa", "harrisburg-pa", "reading-pa", "bethlehem-pa", "providence-ri", "newport-ri", "warwick-ri", "middletown-ri", "westerly-ri", "pawtucket-ri", "charleston-sc", "columbia-sc", "greenville-sc", "myrtle-beach-sc", "hilton-head-island-sc", "mount-pleasant-sc", "anchorage-ak", "fairbanks-ak", "homer-ak", "seward-ak", "soldotna-ak", "juneau-ak", "birmingham-al", "mobile-al", "huntsville-al", "montgomery-al", "dothan-al", "tuscaloosa-al", "little-rock-ar", "eureka-springs-ar", "fayetteville-ar", "bentonville-ar", "hot-springs-national-park-ar", "fort-smith-ar", "phoenix-az", "tucson-az", "scottsdale-az", "mesa-az", "chandler-az", "tempe-az", "san-francisco-ca", "los-angeles-ca", "san-diego-ca", "san-jose-ca", "sacramento-ca", "santa-barbara-ca", "denver-co", "colorado-springs-co", "fort-collins-co", "englewood-co", "estes-park-co", "boulder-co", "sioux-falls-sd", "rapid-city-sd", "deadwood-sd", "spearfish-sd", "hill-city-sd", "lead-sd", "nashville-tn", "memphis-tn", "knoxville-tn", "chattanooga-tn", "gatlinburg-tn", "franklin-tn", "san-antonio-tx", "houston-tx", "dallas-tx", "austin-tx", "fort-worth-tx", "el-paso-tx", "salt-lake-city-ut", "park-city-ut", "ogden-ut", "provo-ut", "sandy-ut", "moab-ut", "richmond-va", "virginia-beach-va", "charlottesville-va", "arlington-va", "alexandria-va", "roanoke-va", "burlington-vt", "stowe-vt", "waitsfield-vt", "brattleboro-vt", "killington-vt", "woodstock-vt", "seattle-wa", "spokane-wa", "tacoma-wa", "bellingham-wa", "bellevue-wa", "vancouver-wa", "milwaukee-wi", "madison-wi", "green-bay-wi", "appleton-wi", "wisconsin-dells-wi", "eau-claire-wi", "charleston-wv", "morgantown-wv", "wheeling-wv", "huntington-wv", "bridgeport-wv", "shepherdstown-wv", "jackson-wy", "laramie-wy", "casper-wy", "cheyenne-wy", "teton-village-wy", "moran-wy", "calgary-ab", "edmonton-ab", "canmore-ab", "banff-ab", "lethbridge-ab", "grande-prairie-ab", "vancouver-bc", "victoria-bc", "kelowna-bc", "surrey-bc", "kamloops-bc", "richmond-bc", "winnipeg-mb", "brandon-mb", "st-andrews-mb", "steinbach-mb", "beausejour-mb", "falcon-beach-mb", "moncton-nb", "saint-john-nb", "fredericton-nb", "st-andrews-nb", "sackville-nb", "sussex-nb", "st-john-s-nl", "corner-brook-nl", "gander-nl", "mount-pearl-nl", "conception-bay-south-nl", "grand-falls-windsor-nl", "halifax-ns", "dartmouth-ns", "sydney-ns", "annapolis-royal-ns", "bedford-ns", "digby-ns" ]}',0)
,(2,1,'list','{"list": ["party-event-venues", "wedding-venues", "meeting-venues"]}',1)
,(3,1,'range','1-10',2)
;

INSERT INTO public.grant_sites_query_parse_config (id,query_id,project_id,project_id_original,title,title_en,project_url,keyword,keyword_en,"source",researcher,researcher_en,institution,country,currency,award_amount,award_amount_usd,funded_date,start_date,project_term,start_year,end_year,description,description_raw,description_en,end_date) VALUES 
(1,1,'2;#detail-page > div:nth-child(2) > div > div.row.hidden-xs > div > h1','2;#detail-page > div:nth-child(2) > div > div.row.hidden-xs > div > div:nth-child(3) > ol > li:nth-child(3) > a','2;#detail-page > div:nth-child(2) > div > div.row.hidden-xs > div > div.h4.eve-address-nav.eve-hover-pointer',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2;#detail-page > div:nth-child(2) > div > div:nth-child(4) > div > div',NULL,NULL,NULL)
;




-------------------------------------------
create table main_data as 
(
select 
	id, 
	project_id as name, 
	project_id_original as website, 
	title as address, 
	project_url as url, 
	keyword as capacity, 
	source as venue_type, 
	description, 
	description_raw as desc1,
	institution as desc2,
	description_en as price_range,
	researcher as phone,
	researcher_en  as email,
	award_amount as check_email_mark,
	crawled_date
from grant_crawled_new_important1 g1
union all
select 
	id, 
	project_id as name, 
	project_id_original as website, 
	title as address, 
	project_url as url, 
	keyword as capacity, 
	source as venue_type, 
	description, 
	description_raw as desc1,
	institution as desc2,
	description_en as price_range,
	researcher as phone,
	researcher_en  as email,
	award_amount as check_email_mark,
	crawled_date
from grant_crawled_new_missing g2
)
