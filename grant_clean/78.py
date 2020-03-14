# cnki parser
import re
import os
import csv
import time
import datetime
import configparser
from tools import read_tsv
from bs4 import BeautifulSoup
from urllib.parse import unquote
from multiprocessing import Pool, cpu_count

from db import sql_execute, sql_insert, sql_insert_many
from tools import write_to_csv

def check_text(text) :
    if text is None :
        return "NOT_FOUND"
    if text.strip() in ["-1", "-2"] :
        return "NOT_FOUND"
    return text

def check_award_amount(award_amount) :
    if award_amount is None :
        return None
    if award_amount == -1 :
        return None
    return award_amount

def check_date(dates) :
    if dates is None :
        return None
    if get_date(dates) is None :
        return None
    return str(get_date(dates))

def get_date(dates) :
    try :
        dates = datetime.datetime.strptime(str(dates), "%Y-%m-%d %H:%M:%S").date()
    except :
        dates = None
        pass
    return dates

def get_year(dates) :
    if dates is None :
        return "NOT_FOUND"
    return dates[ : 4]

def clean_row(row) :
    features = {}

    for key, val in row.items() :
        if key in ["id", "grant_sites_id"] :
            features[key] = val
        elif key in ["award_amount", "award_amount_usd"] :
            features[key] = check_award_amount(val)
        elif key in ["funded_date", "start_date", "end_date"] :
            features[key] = check_date(val)
        else :
            features[key] = check_text(val)
    features["country"] = "SE"
    features["start_year"] = get_year(features["start_date"])
    features["end_year"] = get_year(features["end_date"])

    if features["award_amount"] :
        features["currency"] = "SEK"

    return features

def multi_process_db(grant_sites_id) :
    start_time = time.time()

    sql = """SELECT project_url FROM tmp_other_info WHERE grant_sites_id = %s"""
    query_result = sql_execute(sql, db_config, (grant_sites_id, ))

    hash_url = {}

    for row in query_result :
        hash_url[str(row[0]).strip()] = 1

    sub_grant_datas = []
    
    sql = """SELECT 
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
            institution,
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
            description_en 
            FROM grant_sites_crawled_info WHERE grant_sites_id = %s"""
    query_result = sql_execute(sql, db_config, (grant_sites_id, ))

    columns = ["id", "grant_sites_id", "project_id", "project_id_original", "title", "title_en", "project_url", "keyword", "keyword_en", "source", "researcher", "researcher_en", "institution", "country", "currency", "award_amount", "award_amount_usd", "funded_date", "start_year", "end_year", "start_date", "end_date", "project_term", "description", "description_raw", "description_en"]
    for row in query_result :
        features = {}
        for i in range(len(columns)) :
            features[columns[i]] = row[i]
        
        features["project_url"] = str(features["project_url"]).strip()

        if features["project_url"] not in hash_url :
            sub_grant_datas.append(features)
            hash_url[features["project_url"]] = 1

    p = Pool(processes=cpu_count())
    grant_datas = p.map(clean_row, sub_grant_datas)
    p.close()
    p.join()

    sql = """INSERT INTO tmp_other_info(
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
        institution,
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
        crawled_date)
        VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s, now(),now(),now() )"""
    
    input_datas = []
    
    for row in grant_datas :
        input_datas.append((
            int(row["id"]),
            int(row["grant_sites_id"]),
            row["project_id"],
            row["project_id_original"],
            row["title"],
            row["title_en"],
            row["project_url"],
            row["keyword"],
            row["keyword_en"],
            row["source"],
            row["researcher"],
            row["researcher_en"],
            row["institution"],
            row["country"],
            row["currency"],
            row["award_amount"],
            row["award_amount_usd"],
            row["funded_date"],
            row["start_year"],
            row["end_year"],
            row["start_date"],
            row["end_date"],
            row["project_term"],
            row["description"],
            row["description_raw"],
            row["description_en"]
        ))

    sql_insert_many(sql, db_config, input_datas)
    print(str(time.time() - start_time))

if __name__ == "__main__":
    start_time = time.time()

    config = configparser.ConfigParser()
    config.read('.env')

    db_config = (config["DEFAULT"]["_HOSTNAME"], config["DEFAULT"]["_DATABASE"], config["DEFAULT"]["_USERNAME"], \
    config["DEFAULT"]["_PASSWORD"], config["DEFAULT"]["_PORT"])

    multi_process_db(78)

    print("Total time is : ", str(time.time() - start_time))