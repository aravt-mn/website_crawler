# cnki parser
import re
import os
import csv
import time
import datetime
import configparser
from tools import read_tsv
from bs4 import BeautifulSoup
from multiprocessing import Pool, cpu_count

from db import sql_execute, sql_insert, sql_insert_many
from tools import write_to_csv

def clean_row(row) :
    features = {
        "id"                : row["id"],
        "grant_sites_id"    : row["grant_sites_id"],
        "project_id"        : "NOT_FOUND",
        "project_id_original" : "NOT_FOUND",
        "title"             : "NOT_FOUND",
        "title_en"          : "NOT_FOUND",
        "project_url"       : row["project_url"],
        "keyword"           : "NOT_FOUND",
        "keyword_en"        : "NOT_FOUND",
        "source"            : "NOT_FOUND",
        "researcher"        : "NOT_FOUND",
        "researcher_en"     : "NOT_FOUND",
        "institution"       : "NOT_FOUND",
        "country"           : "JP",
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
    html = row["html"]
    del row

    if html == "NOT_FOUND" :
        # print("html not found")
        return features
    
    try :
        soup = BeautifulSoup(html, "html.parser")
    except :
        # print("Soup errors!")
        return features
    
    features["title"]    = get_title(soup)
    features["project_id"] = get_project_id(features["project_url"])
    features["researcher"], features["institution"] = get_researcher(soup)
    features["description_raw"] = get_description(soup)
    features["start_year"], features["end_year"] = get_start_end_year(soup)
    features["award_amount"], features["currency"] = get_award_amount(soup)

    return features

def get_title(soup) :
    try :
        return soup.find("h1").get_text().strip()
    except :
        return "NOT_FOUND"
    return "NOT_FOUND"

def get_project_id(url) :
    if url == "NOT_FOUND" or url is None:
        return "NOT_FOUND"
    
    project_id = [u.strip() for u in url.split("/") if u.strip() != ""]
    if project_id :
        return project_id[len(project_id) - 1]

    return "NOT_FOUND"

def get_researcher(soup) :
    try :
        cand_tr = soup.find_all("tr")
    except :
        return "NOT_FOUND"
    
    researcher, institution = "NOT_FOUND", "NOT_FOUND"
    for tr in cand_tr :
        text = tr.get_text().strip()
        if text.find("研究責任者") != -1 :
            try :
                researcher = tr.find("a").get_text().strip()
            except :
                pass
            if researcher != "NOT_FOUND" :
                institution = text.replace("研究責任者", "").replace(researcher, "").strip()
            else :
                institution = text.replace("研究責任者", "").strip()
            if institution == "" :
                institution = "NOT_FOUND"
    return researcher, institution

def get_description(soup) :
    try :
        cand_tr = soup.find_all("tr")
    except :
        return "NOT_FOUND"
    description = "NOT_FOUND"

    for tr in cand_tr :
        text = tr.get_text()
        if text.find("概要") != -1 :
            description = text.replace("概要", "")

    return description

def get_award_amount(soup) :
    try :
        cand_tr = soup.find_all("tr")
    except :
        return None, "NOT_FOUND"

    award_amount, currency = None, "NOT_FOUND"
    for tr in cand_tr :
        text = tr.get_text()
        if text.find("合計額") != -1 :
            if text.find("円") != -1 :
                currency = "JPY"
            award_amount = re.sub(r"[^\d]", "", text).strip()
            try :
                award_amount = round(float(award_amount), 2)
            except :
                award_amount = None
                pass
    return award_amount, currency

def get_start_end_year(soup) :
    try :
        start_end_year = soup.find("span", {"class" : "fiscal_year"}).get_text().strip()
    except :
        return "NOT_FOUND", "NOT_FOUND"
    start_end_year = re.sub(r"[^\d]", " ", start_end_year)
    regex_string = r"\b\d{4}\b"
    m = re.findall(regex_string, start_end_year)
    if m :
        if len(m) == 1 :
            return m[0], "NOT_FOUND"
        elif len(m) > 1 :
            if m[0] <= m[1] :
                return m[0], m[1]
            else :
                return m[1], m[0]
    return "NOT_FOUND", "NOT_FOUND"

def multi_process_db(grant_sites_id) :
    start_time = time.time()

    sql = """SELECT id, grant_sites_id, project_url FROM tmp_other_info WHERE grant_sites_id = %s"""
    query_result = sql_execute(sql, db_config, (grant_sites_id, ))

    hash_url = {}

    for row in query_result :
        hash_url[str(row[2]).strip()] = 1

    sub_grant_datas = []
    
    sql = """SELECT id, grant_sites_id, project_url, html FROM tmp_other_html WHERE grant_sites_id = %s"""
    query_result = sql_execute(sql, db_config, (grant_sites_id, ))

    for row in query_result :
        features = {
            "id"              : row[0],
            "grant_sites_id"  : row[1],
            "project_url"     : str(row[2]).strip(),
            "html"            : row[3],
        }
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

    multi_process_db(15)

    print("Total time is : ", str(time.time() - start_time))