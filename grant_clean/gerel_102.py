# cnki parser
import re
import os
import csv
import time
import configparser
from bs4 import BeautifulSoup
from multiprocessing import Pool, cpu_count

from db import sql_execute, sql_insert
from tools import write_to_csv, write_csv_head, append_to_csv

db_config = ()

def sub_process(row) :
    features = {
        "id"                : row[0],
        "grant_sites_id"    : row[1],
        "project_url"       : row[2],
        "researcher_raw"    : "NOT_FOUND",
        "institution_raw"   : "NOT_FOUND",
    }
    html = row[3]

    if html == "NOT_FOUND" :
        # print("html not found")
        append_to_csv("./res_ins_raw.csv", features, field=["id", "grant_sites_id", "project_url", "researcher_raw", "institution_raw"])
        return True
    
    try :
        soup = BeautifulSoup(html, "html.parser")
    except :
        print("Soup errors!")
        append_to_csv("./res_ins_raw.csv", features, field=["id", "grant_sites_id", "project_url", "researcher_raw", "institution_raw"])
        return True
    
    features["researcher_raw"], features["institution_raw"] = get_researcher(soup)

    append_to_csv("./res_ins_raw.csv", features, field=["id", "grant_sites_id", "project_url", "researcher_raw", "institution_raw"])
    return True

def get_researcher(soup) :
    try :
        cands = soup.find_all("p")
    except :
        return "NOT_FOUND", "NOT_FOUND"
    
    researcher_raw, institution_raw = "NOT_FOUND", "NOT_FOUND"
    for p in cands :
        text = p.get_text().strip()
        if text.find("【作者】") != -1 :
            researcher_raw = text.replace("【作者】", "").strip()
        
        if text.find("【机构】") != -1 :
            institution_raw = text.replace("【机构】", "").strip()

    return researcher_raw, institution_raw

def multi_process_db() :
    start_time = time.time()

    write_csv_head("./res_ins_raw.csv", field=["id", "grant_sites_id", "project_url", "researcher_raw", "institution_raw"])

    sql = """SELECT id FROM tmp_china_html"""
    query_result = sql_execute(sql, db_config)

    iter = 100000

    for i in range(0, len(query_result), iter) :
        sub_ids = query_result[i : i + iter]

        sql = f"""SELECT * FROM tmp_china_html WHERE id in ({','.join([str(row[0]) for row in sub_ids])})"""
        sub_grant_datas = sql_execute(sql, db_config)

        p = Pool(processes=cpu_count())
        p.map(sub_process, sub_grant_datas)
        p.close()
        p.join()

        del sub_grant_datas

        print(str(i), str(i + iter), str(time.time() - start_time))

if __name__ == "__main__":
    start_time = time.time()

    config = configparser.ConfigParser()

    config.read('.env')

    db_config = (config["DEFAULT"]["_HOSTNAME"], config["DEFAULT"]["_DATABASE"], config["DEFAULT"]["_USERNAME"], \
    config["DEFAULT"]["_PASSWORD"], config["DEFAULT"]["_PORT"])

    multi_process_db()

    print("Total time : ", str(time.time() - start_time))