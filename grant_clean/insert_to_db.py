import re
import os
import csv
import sys
import ssl
import time
import random
import datetime

import configparser
from db import sql_execute, sql_insert, sql_insert_many

from tools import write_csv_head, append_to_csv, read_csv, read_tsv
csv.field_size_limit(sys.maxsize)
db_config = ()

if __name__ == "__main__":
    start_time = time.time()

    config = configparser.ConfigParser()

    config.read('.env')

    db_config = (config["DEFAULT"]["_HOSTNAME"], config["DEFAULT"]["_DATABASE"], config["DEFAULT"]["_USERNAME"], \
    config["DEFAULT"]["_PASSWORD"], config["DEFAULT"]["_PORT"])

    columns = ["project_id", "project_id_original", "title", "researcher", "institution", "award_amount"]
    datas = read_csv("./csv/97_2018.csv")
    # multi_process_db(78)
    
    input_datas = []
    for row in datas :
        features = {
            # "id"                : row["id"],
            "grant_sites_id"    : 97,
            "project_id"        : "NOT_FOUND",
            "project_id_original" : "NOT_FOUND",
            "title"             : "NOT_FOUND",
            "title_en"          : "NOT_FOUND",
            "project_url"       : "NOT_FOUND",
            "keyword"           : "NOT_FOUND",
            "keyword_en"        : "NOT_FOUND",
            "source"            : "NOT_FOUND",
            "researcher"        : "NOT_FOUND",
            "researcher_en"     : "NOT_FOUND",
            "researcher_cleaned" : "NOT_FOUND",
            "institution"       : "NOT_FOUND",
            "institution_cleaned" : "NOT_FOUND",
            "country"           : "MX",
            "currency"          : "NOT_FOUND",
            "award_amount"      : None,
            "award_amount_usd"  : None,
            "funded_date"       : None,
            "start_year"        : "NOT_FOUND",
            "end_year"          : "NOT_FOUND",
            "start_date"        : None,
            "end_date"          : None,
            "project_term"      : "NOT_FOUND",
            "description"       : "NOT_FOUND",
            "description_raw"   : "NOT_FOUND",
            "description_en"    : "NOT_FOUND",    
        }
        for key, val in row.items() :
            if key == "\ufeffproject_id_original" :
                continue
            features[key] = val
        features["researcher_cleaned"] = features["researcher"]
        features["institution_cleaned"] = features["institution"]

        tuple_data = tuple(val for key, val in features.items())
        
        input_datas.append(tuple_data)

    sql = """INSERT INTO grant_sites_crawled_info_cleaned(
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
        crawled_date)
        VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s, now(),now(),now() )"""
        
    sql_insert_many(sql, db_config, input_datas)


    print("Total time : ", str(time.time() - start_time))

