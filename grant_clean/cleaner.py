import os
import csv
import configparser
from datetime import datetime
from db import sql_execute, sql_insert

db_config = ()

def insert_to_table(row) :
    sql = """INSERT into tmp_other_info_new
                    (
                        id,
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
                        researcher_cleaned,
                        institution,
                        institution_en,
                        institution_cleaned,
                        country,
                        currency,
                        award_amount,
                        award_amount_usd,
                        funded_date,
                        start_year,
                        end_year,
                        start_date,
                        end_date,
                        project_term,
                        description,
                        description_raw,
                        description_en,
                        created_date,
                        updated_date,
                        crawled_date
                    ) values(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s )"""
    sql_insert(sql, db_config, row)

def clean(row) :
    if row == "NOT_FOUND" :
        return None
    return row

if __name__ == "__main__":

    config = configparser.ConfigParser()

    config.read('.env')
        
    db_config = (config["DEFAULT"]["_HOSTNAME"], config["DEFAULT"]["_DATABASE"], config["DEFAULT"]["_USERNAME"], \
    config["DEFAULT"]["_PASSWORD"], config["DEFAULT"]["_PORT"])

    sql = """SELECT id,
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
                    researcher_cleaned,
                    institution,
                    institution_cleaned,
                    country,
                    currency,
                    award_amount,
                    award_amount_usd,
                    funded_date,
                    start_year,
                    end_year,
                    start_date,
                    end_date,
                    project_term,
                    description,
                    description_raw,
                    description_en,
                    created_date,
                    updated_date,
                    crawled_date FROM grant_sites_crawled_info_cleaned
                    WHERE grant_sites_id not in (102, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130)"""
    query_result = sql_execute(sql, db_config)

    columns = ["id", "grant_sites_id", "project_id", "project_id_original", "title", "title_en", "project_url", "keyword", "keyword_en", "source", "researcher", "researcher_en", "researcher_cleaned", "institution", "institution_cleaned", "country", "currency", "award_amount", "award_amount_usd", "funded_date", "start_year", "end_year", "start_date", "end_date", "project_term", "description", "description_raw", "description_en", "created_date", "updated_date", "crawled_date"]
    
    for row in query_result :
        features = {}
        tmp = None
        for i in range(len(columns)) :
            features[columns[i]] = clean(row[i])
            if i == 13 :
                tmp = row[i]
        features["institution_en"] = clean(tmp)
        
        insert_to_table((
            features["id"],
            features["grant_sites_id"],
            features["project_id"],
            features["project_id_original"],
            features["title"],
            features["title_en"],
            features["project_url"],
            features["keyword"],
            features["keyword_en"],
            features["source"],
            features["researcher"],
            features["researcher_en"],
            features["researcher_cleaned"],
            features["institution"],
            features["institution_en"],
            features["institution_cleaned"],
            features["country"],
            features["currency"],
            features["award_amount"],
            features["award_amount_usd"],
            features["funded_date"],
            features["start_year"],
            features["end_year"],
            features["start_date"],
            features["end_date"],
            features["project_term"],
            features["description"],
            features["description_raw"],
            features["description_en"],
            features["created_date"],
            features["updated_date"],
            features["crawled_date"],
            ))
        # break
