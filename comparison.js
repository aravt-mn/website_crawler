const {
  Pool,
} = require('pg');
require('dotenv').config();

let pool = null;

function createConnection() {
  if (!pool) pool = new Pool();
  return pool;
}

async function closeConnections() {
  if (!pool) return;
  try {
    await pool.end();
    pool = null;
  } catch (e) {
    log(e);
  }
}

async function runQuery({
  connection,
  query,
  params = [],
}) {
  return connection.query(query, params);
}

async function getQueryParams(query) {
  const connection = createConnection();
  // get query params
//   const query = 'SELECT 1+3 sum;';
  const result = (await runQuery({
    connection,
    query,
    params: [],
  })).rows;
  return result;
}

// site 39 clean
site52Query = `
delete
from grant_crawled_new gcn
where 
	grant_sites_id = 39
	and project_id is null 
	and title is null
	and researcher is null
	and institution is null
  and description is null;
`;

// console.log(insertQuery)
results = getQueryParams(site52Query);

results.then(function(result){
  console.log(result)
})
console.log('site 39 clean nulls done.')


// site 52 clean
site52Query = `
delete
from grant_crawled_new gcn
where grant_sites_id = 52
  and (
    (project_id is null or project_id = '') and (title is null or title = '') 
    and (researcher is null or researcher = '') 
    and (institution is null or institution = '') 
    and award_amount is null
    )
`;

// console.log(insertQuery)
results = getQueryParams(site52Query);

results.then(function(results){
  console.log(results)
})
console.log('site 52 clean nulls done.')


// site 52 set university
site52Query = `
update grant_crawled_new set institution = aa.inst1
from (
	select 
	(
	select institution
	from 
		(select id, institution, crawled_date, project_url
		from grant_crawled_new gcn 
		where project_url in ('https://www.etag.ee/en/funding/mobility-funding/mobilitas-pluss/mobilitas-pluss-post-doctoral-researcher-grant/documents-and-results-2016/'
								, 'https://www.etag.ee/en/funding/mobility-funding/mobilitas-pluss/returning-researcher-grant/documants-and-results-2016/')
				and grant_sites_id = 52
				and institution is not null 
				and researcher is null
				and title is null
			)a 
			where gcn.id > a.id
				and gcn.project_url = a.project_url
			order by a.id desc
			limit 1
		) inst1, gcn.* 
	from grant_crawled_new gcn 
	where project_url in ('https://www.etag.ee/en/funding/mobility-funding/mobilitas-pluss/mobilitas-pluss-post-doctoral-researcher-grant/documents-and-results-2016/'
								, 'https://www.etag.ee/en/funding/mobility-funding/mobilitas-pluss/returning-researcher-grant/documants-and-results-2016/')
		and grant_sites_id = 52
		and (title is not null or researcher is not null)
		and institution is null
	--and id = 3393
) aa
where grant_crawled_new.id = aa.id;
`;

// console.log(insertQuery)
results = getQueryParams(site52Query);

results.then(function(results){
  console.log(results)
})
console.log('site 52 set university.')



// site 52 clean university
site52Query = `
delete
from grant_crawled_new gcn 
where project_url in ('https://www.etag.ee/en/funding/mobility-funding/mobilitas-pluss/mobilitas-pluss-post-doctoral-researcher-grant/documents-and-results-2016/'
						, 'https://www.etag.ee/en/funding/mobility-funding/mobilitas-pluss/returning-researcher-grant/documants-and-results-2016/')
		and grant_sites_id = 52
		and institution is not null 
		and researcher is null
    and title is null;
`;

// console.log(insertQuery)
results = getQueryParams(site52Query);

results.then(function(results){
  console.log(results)
})
console.log('site 52 clean university.')

//site 68 clean
site68Query = `
delete
from grant_crawled_new gcn 
where 
  (html like '<div id="main"> <div id="content-wrapper"> <div id="content-header"> <h1>Not Found</h1> </div> <div id="content-primary"> <div class="hst-container"> </div><!-- RSPEAK_START --> <div id="xp1" class="rs_skip rs_preserve"/> <div class="readcontent"> Not Found</div> <!-- RSPEAK_STOP --> <div class="hst-container"> </div></div> <div id="content-secondary"> <div class="hst-container"> </div> <div class="hst-container"> </div></div><div id="content-tertiary"> <div class="hst-container"> <div class="hst-container-item"> <div id="toolbox"> <div class="tool mail">%' 
  or html = '<div id="main"> <h1>Our apologies</h1> <p>This website is unavailable at the moment. We are working on a solution to make the website available again as soon as possible.</p> <p>We kindly request that you check back shortly to resume your activity. Our sincere apologies for the inconvenience.</p> <h1>Onze excuses</h1> <p>Deze website is momenteel niet beschikbaar. Wij werken aan een oplossing om de website zo snel mogelijk weer beschikbaar te maken.</p> <p>Wij verzoeken u vriendelijk om deze website later opnieuw te bezoeken. Onze welgemeende excuses voor het ongemak.</p> </div>'
  )
  and grant_sites_id=68;
`;

// console.log(insertQuery)
results = getQueryParams(site68Query);

results.then(function(result){
  console.log(result)
})
console.log('site68 clean not found done.')


//insert new found data

insertQuery = `
with cte as (
	select 
		g1.id
	from grant_crawled_new g1
		inner join grant_sites_crawled_info g2
			on g1.grant_sites_id = g2.grant_sites_id
				and (
          (g1.project_id = g2.project_id and g1.project_id is not null)
          or (g1.title = g2.title and g1.title is not null) 
          or (g1.grant_sites_id not in (39, 43, 45, 46, 52, 69, 73, 78) and g1.project_url = g2.project_url and g1.project_url is not null)
				)
	)
insert into grant_sites_crawled_info
	(grant_sites_id,
	project_id,
	project_id_original,
	title,
	title_en,
	project_url,
	keyword,
	keyword_en,
	source,
	researcher,
	researcher_en,
	institution,
	country,
	currency,
	award_amount,
	award_amount_usd,
	funded_date,
	start_date,
	project_term,
	start_year,
	end_year,
	description,
	description_raw,
	description_en,
	created_date,
	updated_date,
	crawled_date,
	end_date,
	researcher_cleaned,
	institution_cleaned,
	project_url_id,
	position) 
select
  grant_sites_id,
  project_id,
  project_id_original,
  title,
  title_en,
  project_url,
  keyword,
  keyword_en,
  source,
  researcher,
  researcher_en,
  institution,
  country,
  currency,
  award_amount,
  award_amount_usd,
  funded_date,
  start_date,
  project_term,
  start_year,
  end_year,
  description,
  description_raw,
  description_en,
  created_date,
  updated_date,
  crawled_date,
  end_date,
  researcher_cleaned,
  institution_cleaned,
  project_url_id,
  position
from grant_crawled_new g1
where id not in (select id from cte)
;
`;

// console.log(insertQuery)
results = getQueryParams(insertQuery);

results.then(function(result){
  console.log(result)
})
console.log('insert done.')

//update old data

updateQuery = `
update 
  grant_sites_crawled_info
set
  project_url = t2.project_url,
  keyword = t2.keyword,
  keyword_en = t2.keyword_en,
  source = t2.source,
  researcher = t2.researcher,
  researcher_en = t2.researcher_en,
  institution = t2.institution,
  country = t2.country,
  currency = t2.currency,
  award_amount = t2.award_amount,
  award_amount_usd = t2.award_amount_usd,
  funded_date = t2.funded_date,
  start_date = t2.start_date, 
  project_term = t2.project_term,
  start_year = t2.start_year,
  end_year = t2.end_year,
  description = t2.description,
  description_raw = t2.description_raw,
  description_en = t2.description_en,
  created_date = t2.created_date,
  updated_date = t2.updated_date,
  end_date = t2.end_date,
  project_url_id = t2.project_url_id,
  position = t2.position
 from grant_sites_crawled_info t1
 inner join 
  (
select 
  -- count(*) as cnt
  id_1 as id,
  grant_sites_id,
  project_id,
  project_id_original,
  title, 
  title_en,
  project_url,
  case 
    when (keyword is NULL or keyword = null) and (keyword_1 is not NULL or keyword_1 <> null) then keyword_1
    when (keyword is NULL or keyword = null) and (keyword_1 is NULL or keyword_1 = null) then NULL
    when keyword <> keyword_1 then keyword
    else keyword
  end as keyword,
  case 
    when (keyword_en is NULL or keyword_en = null) and (keyword_en_1 is not NULL or keyword_en_1 <> null) then keyword_en_1
    when (keyword_en is NULL or keyword_en = null) and (keyword_en_1 is NULL or keyword_en_1 = null) then NULL
    when keyword_en <> keyword_en_1 then keyword_en
    else keyword_en
  end as keyword_en,
  case 
    when (source is NULL or source = null) and (source_1 is not NULL or source_1 <> null) then source_1
    when (source is NULL or source = null) and (source_1 is NULL or source_1 = null) then NULL
    when source <> source_1 then source
    else source
  end as source,
  case 
    when (researcher is NULL or researcher = null) and (researcher_1 is not NULL or researcher_1 <> null) then researcher_1
    when (researcher is NULL or researcher = null) and (researcher_1 is NULL or researcher_1 = null) then NULL
    when researcher <> researcher_1 then researcher
    else researcher
  end as researcher,
  case 
    when (researcher_en is NULL or researcher_en = null) and (researcher_en_1 is not NULL or researcher_en_1 <> null) then researcher_en_1
    when (researcher_en is NULL or researcher_en = null) and (researcher_en_1 is NULL or researcher_en_1 = null) then NULL
    when researcher_en <> researcher_en_1 then researcher_en
    else researcher_en
  end as researcher_en,
  case 
    when (institution is NULL or institution = null) and (institution_1 is not NULL or institution_1 <> null) then institution_1
    when (institution is NULL or institution = null) and (institution_1 is NULL or institution_1 = null) then NULL
    when institution <> institution_1 then institution
    else institution
  end as institution,
  case 
    when (country is NULL or country = null) and (country_1 is not NULL or country_1 <> null) then country_1
    when (country is NULL or country = null) and (country_1 is NULL or country_1 = null) then NULL
    when country <> country_1 then country
    else country
  end as country,
  case 
    when (currency is NULL or currency = null) and (currency_1 is not NULL or currency_1 <> null) then currency_1
    when (currency is NULL or currency = null) and (currency_1 is NULL or currency_1 = null) then NULL
    when currency <> currency_1 then currency
    else currency
  end as currency,
  case 
    when (award_amount is NULL) and (award_amount_1 is not NULL) then award_amount_1
    when (award_amount is NULL) and (award_amount_1 is NULL) then NULL
    when award_amount <> award_amount_1 then award_amount
    else award_amount
  end as award_amount,
  case 
    when (award_amount_usd is NULL) and (award_amount_usd_1 is not NULL) then award_amount_usd_1
    when (award_amount_usd is NULL) and (award_amount_usd_1 is NULL) then NULL
    when award_amount_usd <> award_amount_usd_1 then award_amount_usd
    else award_amount_usd
  end as award_amount_usd,
  case 
    when (funded_date is NULL) and (funded_date_1 is not NULL) then funded_date_1
    when (funded_date is NULL) and (funded_date_1 is NULL) then NULL
    when funded_date <> funded_date_1 then funded_date
    else funded_date
  end as funded_date,
  case 
    when (start_date is NULL) and (start_date_1 is not NULL) then start_date_1
    when (start_date is NULL) and (start_date_1 is NULL) then NULL
    when start_date <> start_date_1 then start_date
    else start_date
  end as start_date,
  case 
    when (project_term is NULL) and (project_term_1 is not NULL) then project_term_1
    when (project_term is NULL) and (project_term_1 is NULL) then NULL
    when project_term <> project_term_1 then project_term
    else project_term
  end as project_term,
  case 
    when (start_year is NULL) and (start_year_1 is not NULL) then start_year_1
    when (start_year is NULL) and (start_year_1 is NULL) then NULL
    when start_year <> start_year_1 then start_year
    else start_year
  end as start_year,
  case 
    when (end_year is NULL) and (end_year_1 is not NULL) then end_year_1
    when (end_year is NULL) and (end_year_1 is NULL) then NULL
    when end_year <> end_year_1 then end_year
    else end_year
  end as end_year,
  description,
  description_raw,
  description_en,
  created_date_1 as created_date,
  now() as updated_date,
  created_date as crawled_date,
  case 
    when (end_date is NULL) and (end_date_1 is not NULL) then end_date_1
    when (end_date is NULL) and (end_date_1 is NULL) then NULL
    when end_date <> end_date_1 then end_date
    else end_date
  end as end_date,
  researcher_cleaned_1 as researcher_cleaned,
  institution_cleaned_1 as institution_cleaned,
  project_url_id,
  position
from 
(
select 
  g1.id,
  g1.grant_sites_id,
  g1.project_id,
  g1.project_id_original,
  g1.title,
  g1.title_en,
  g1.project_url,
  g1.keyword,
  g1.keyword_en,
  g1.source,
  g1.researcher,
  g1.researcher_en,
  g1.institution,
  g1.country,
  g1.currency,
  g1.award_amount,
  g1.award_amount_usd,
  g1.funded_date,
  g1.start_date,
  g1.project_term,
  g1.start_year,
  g1.end_year,
  g1.description,
  g1.description_raw,
  g1.description_en,
  g1.created_date,
  g1.updated_date,
  g1.crawled_date,
  g1.end_date,
  g1.researcher_cleaned,
  g1.institution_cleaned,
  g1.project_url_id,
  g1.position,
  g2.id as id_1,
  g2.grant_sites_id as grant_sites_id_1,
  g2.project_id as project_id_1,
  g2.project_id_original as project_id_original_1,
  g2.title as title_1,
  g2.title_en as title_en_1,
  g2.project_url as project_url_1,
  g2.keyword as keyword_1,
  g2.keyword_en as keyword_en_1,
  g2.source as source_1,
  g2.researcher as researcher_1,
  g2.researcher_en as researcher_en_1,
  g2.institution as institution_1,
  g2.country as country_1,
  g2.currency as currency_1,
  g2.award_amount as award_amount_1,
  g2.award_amount_usd as award_amount_usd_1,
  g2.funded_date as funded_date_1,
  g2.start_date as start_date_1,
  g2.project_term as project_term_1,
  g2.start_year as start_year_1,
  g2.end_year as end_year_1,
  g2.description as description_1,
  g2.description_raw as description_raw_1,
  g2.description_en as description_en_1,
  g2.created_date as created_date_1,
  g2.updated_date as updated_date_1,
  g2.crawled_date as crawled_date_1,
  g2.end_date as end_date_1,
  g2.researcher_cleaned as researcher_cleaned_1,
  g2.institution_cleaned as institution_cleaned_1,
  g2.project_url_id as project_url_id_1,
  g2.position as position_1
from grant_crawled_new g1
  inner join grant_sites_crawled_info g2
    on g1.grant_sites_id = g2.grant_sites_id 
      and (
      (g1.project_id = g2.project_id and g1.project_id is not null)
      or (g1.title = g2.title and g1.title is not null) 
      or (g1.grant_sites_id not in (39, 43, 45, 46, 52, 69, 73, 78) and g1.project_url = g2.project_url and g1.project_url is not null)
      )
) as a
) t2 on t1.id = t2.id
where grant_sites_crawled_info.id = t2.id
;
--1255 found update
`;

// console.log(updateQuery)
results1 = getQueryParams(updateQuery);
results1.then(function(result){
	console.log(result)
  })


console.log('update done.')