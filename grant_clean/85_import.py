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

def get_date(dates) :
    try :
        dates = datetime.datetime.strptime(str(dates), "%Y-%m-%d %H:%M:%S").date()
    except :
        dates = None
        pass
    return dates

def get_year(dates) :
    if dates is None :
        return None
    return dates[ : 4]

def clean_row(row) :
    features = {
        "grant_sites_id"    : 85,
        "project_id"        : None,
        "project_id_original" : None,
        "title"             : None,
        "title_en"          : None,
        "project_url"       : None,
        "keyword"           : None,
        "keyword_en"        : None,
        "source"            : None,
        "researcher"        : None,
        "researcher_en"     : None,
        "researcher_cleaned" : None,
        "institution"       : None,
        "institution_en"       : None,
        "institution_cleaned" : None,
        "country"           : None,
        "currency"          : None,
        "award_amount"      : None,
        "award_amount_usd"  : None,
        "funded_date"       : None,
        "start_year"        : None,
        "end_year"          : None,
        "start_date"        : None,
        "end_date"          : None,
        "project_term"      : None,
        "description"       : None,
        "description_raw"   : None,
        "description_en"    : None,    
    }

    for key, val in row.items() :
        features[key] = val

    features["country"] = "JP"
    features["start_date"] = get_date(row["start_date"])
    features["start_year"] = get_year(str(features["start_date"]))

    return features


def multi_process_db() :
    start_time = time.time()

    datas = []
    with open("./csv/85_new.csv", "r") as csv_file :
        reader = csv.DictReader(csv_file)
        for row in reader :
            datas.append(row)
    
    sub_grant_datas = []

    columns = ["title", "researcher", "institution", "start_date", "project_url"]
    for row in datas :
        features = {}
        for col in columns :
            tmp = col
            if tmp == "title" :
                tmp = '\ufefftitle'
            features[col] = row[tmp]
            
        sub_grant_datas.append(features)

    print(sub_grant_datas[0])

    p = Pool(processes=cpu_count())
    grant_datas = p.map(clean_row, sub_grant_datas)
    p.close()
    p.join()

    sql = """INSERT INTO tmp_bmwf_info(
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
        VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s, now(),now(),now() )"""
    
    input_datas = []
    
    for row in grant_datas :
        input_datas.append((
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

    multi_process_db()

    print("Total time is : ", str(time.time() - start_time))