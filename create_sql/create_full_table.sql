--1-----------------------------------------
-- Drop table

-- DROP TABLE public.grant_activity;

CREATE TABLE public.grant_activity (
	start_date timestamp NULL,
	end_date timestamp NULL,
	id serial NOT NULL,
	site_id int4 NULL
);

--2-----------------------------------------

-- Drop table

-- DROP TABLE public.grant_page_log;

CREATE TABLE public.grant_page_log (
	id serial primary key,
	param varchar NULL
);

--3-----------------------------------------

-- Drop table

-- DROP TABLE public.grant_sites;

CREATE TABLE public.grant_sites (
	id serial primary key,
	"name" varchar NULL,
	url varchar NULL,
	name_en varchar NULL,
	url_en varchar NULL,
	active bool NULL
);
--4-----------------------------------------

-- Drop table

-- DROP TABLE public.grant_sites_crawled_info;

CREATE TABLE public.grant_sites_crawled_info (
	id serial primary key,
	grant_sites_id int8 NULL,
	project_id varchar(200) NULL,
	project_id_original varchar(200) NULL,
	title varchar NULL,
	title_en varchar NULL,
	project_url varchar NULL,
	keyword varchar NULL,
	keyword_en varchar NULL,
	"source" varchar NULL,
	researcher varchar NULL,
	researcher_en varchar NULL,
	institution varchar NULL,
	country varchar NULL,
	currency varchar NULL,
	award_amount float8 NULL,
	award_amount_usd float8 NULL,
	funded_date date NULL,
	start_date timestamp NULL,
	project_term varchar NULL,
	start_year varchar NULL,
	end_year varchar NULL,
	description varchar NULL,
	description_raw varchar NULL,
	description_en varchar NULL,
	created_date timestamp NULL,
	updated_date timestamp NULL,
	crawled_date timestamp NULL,
	end_date timestamp NULL,
	researcher_cleaned varchar NULL,
	institution_cleaned varchar NULL,
	project_url_id int8 NULL,
	"position" varchar NULL
);
CREATE INDEX grant_sites_crawled_info_grant_sites_id_idx ON public.grant_sites_crawled_info USING btree (grant_sites_id);
CREATE INDEX grant_sites_crawled_info_id_idx ON public.grant_sites_crawled_info USING btree (id);

--5-----------------------------------------

-- Drop table

-- DROP TABLE public.grant_sites_query;

CREATE TABLE public.grant_sites_query (
	id serial primary key,
	site_id int4 NULL,
	url varchar NULL,
	request_type varchar NULL,
	response_type varchar NULL,
	block_name varchar NULL,
	detail_path varchar NULL,
	crawl_status int4 NULL DEFAULT 0,
	page_range varchar NULL,
	detail_request_type varchar NULL,
	detail_response_type varchar NULL,
	detail_path_type varchar NULL,
	post_param varchar NULL
);

--6-----------------------------------------

-- Drop table

-- DROP TABLE public.grant_sites_query_param;

CREATE TABLE public.grant_sites_query_param (
	id serial primary key,
	query_id int4 NULL,
	"type" varchar NULL,
	param text NULL,
	order_number int4 NULL
);

--7-----------------------------------------

-- Drop table

-- DROP TABLE public.grant_sites_query_parse_config;

CREATE TABLE public.grant_sites_query_parse_config (
	id serial primary key,
	query_id int4 NULL,
	project_id varchar NULL,
	project_id_original varchar NULL,
	title varchar NULL,
	title_en varchar NULL,
	project_url varchar NULL,
	keyword varchar NULL,
	keyword_en varchar NULL,
	"source" varchar NULL,
	researcher varchar NULL,
	researcher_en varchar NULL,
	institution varchar NULL,
	country varchar NULL,
	currency varchar NULL,
	award_amount varchar NULL,
	award_amount_usd varchar NULL,
	funded_date varchar NULL,
	start_date varchar NULL,
	project_term varchar NULL,
	start_year varchar NULL,
	end_year varchar NULL,
	description varchar NULL,
	description_raw varchar NULL,
	description_en varchar NULL,
	end_date varchar NULL
);

--8-----------------------------------------

-- Drop table

-- DROP TABLE public.kaken_grants;

CREATE TABLE public.kaken_grants (
	id serial primary key,
	project_id text NULL,
	title text NULL,
	project_url text NULL,
	status int4 NULL,
	entry_date timestamp NOT NULL DEFAULT now()
);

--9-----------------------------------------

-- Drop table

-- DROP TABLE public.kaken_report;

CREATE TABLE public.kaken_report (
	id serial primary key,
	project_id text NULL,
	"year" int4 NULL,
	"name" text NULL,
	report_url text NULL,
	"release" text NULL,
	status int4 NULL,
	pdf_url text NULL,
	pdf_path text NULL,
	entry_date timestamp NOT NULL DEFAULT now(),
	研究領域略称 text NULL,
	研究課題領域番号 text NULL,
	研究種目 text NULL,
	配分区分 text NULL,
	研究機関 text NULL,
	領域代表者 text NULL,
	研究期間年度 text NULL,
	評価記号 text NULL,
	研究代表者 text NULL,
	研究分担者 text NULL,
	キーワード text NULL,
	研究概要 text NULL,
	研究分野 text NULL,
	応募区分 text NULL,
	受入研究者 text NULL,
	外国人特別研究員 text NULL,
	研究領域 text NULL,
	現在までの達成度区分 text NULL,
	今後の研究の推進方策 text NULL,
	研究実績の概要 text NULL,
	現在までの達成度段落 text NULL,
	連携研究者 text NULL,
	研究成果の概要 text NULL,
	自由記述の分野 text NULL,
	審査区分 text NULL,
	研究協力者 text NULL,
	備考 text NULL,
	特別研究員 text NULL,
	次年度の研究費の使用計画 text NULL,
	次年度使用額が生じた理由 text NULL,
	次年度使用額の使用計画 text NULL,
	"企画・制作" text NULL,
	研究支援分担者 text NULL,
	審査結果の所見の概要 text NULL,
	研究支援代表者 text NULL
);

--10-----------------------------------------

-- Drop table

-- DROP TABLE public.sciencenet_report;

CREATE TABLE public.sciencenet_report (
	id serial primary key,
	project_id int8 NULL,
	report_number varchar NULL,
	title varchar NULL,
	"type" varchar NULL,
	author varchar NULL
);

--11-----------------------------------------

-- Drop table

-- DROP TABLE public.grant_sites_crawled_info;

CREATE TABLE public.grant_crawled_new (
	id serial primary key,
	grant_sites_id int8 NULL,
	project_id varchar(200) NULL,
	project_id_original varchar(200) NULL,
	title varchar NULL,
	title_en varchar NULL,
	project_url varchar NULL,
	keyword varchar NULL,
	keyword_en varchar NULL,
	"source" varchar NULL,
	researcher varchar NULL,
	researcher_en varchar NULL,
	institution varchar NULL,
	country varchar NULL,
	currency varchar NULL,
	award_amount float8 NULL,
	award_amount_usd float8 NULL,
	funded_date date NULL,
	start_date timestamp NULL,
	project_term varchar NULL,
	start_year varchar NULL,
	end_year varchar NULL,
	description varchar NULL,
	description_raw varchar NULL,
	description_en varchar NULL,
	created_date timestamp NULL,
	updated_date timestamp NULL,
	crawled_date timestamp NULL,
	end_date timestamp NULL,
	researcher_cleaned varchar NULL,
	institution_cleaned varchar NULL,
	project_url_id int8 NULL,
	"position" varchar NULL,
	html varchar NULL
);
CREATE INDEX grant_crawled_new_grant_sites_id_idx ON public.grant_crawled_new USING btree (grant_sites_id);
CREATE INDEX grant_crawled_new_id_idx ON public.grant_crawled_new USING btree (id);
