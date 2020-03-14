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
        "country"           : "AT",
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
        soup = BeautifulSoup(html, "lxml")
    except :
        # print("Soup errors!")
        return features
    
    features["title"]               = get_title(soup)
    features["project_id"]          = get_project_id(soup)
    features["project_id_original"] = features["project_id"]

    features["researcher"]      = get_researcher(soup)
    features["researcher_en"]   = features["researcher"]
    features["institution"]     = get_institution(soup)

    features["start_date"], features["end_date"] = get_start_end_date(soup)
    features["start_year"] = get_start_year(features["start_date"])
    features["end_year"]   = get_start_year(features["end_date"])
    features["award_amount"], features["currency"] = get_award_amount(soup)
    features["keyword"] = get_keywords(soup)
    features["keyword_en"] = features["keyword"]

    return features

def get_title(soup) :
    try :
        return soup.find("h3").get_text().strip()
    except :
        return "NOT_FOUND"
    return "NOT_FOUND"

def get_project_id(soup) :
    try :
        cand_section = soup.find_all(["dt", "dd"])
    except :
        return "NOT_FOUND"
    
    project_id = "NOT_FOUND"
    for i in range(len(cand_section) - 1) :
        cur_tag  = cand_section[i]
        if i + 1 < len(cand_section) :
            next_tag = cand_section[i + 1]
        else :
            next_tag = None
        if cur_tag.get_text().strip() == "project number" and next_tag is not None:
            if cur_tag.name.startswith("dt") and next_tag.name.startswith("dd") :
                project_id = next_tag.get_text().strip()

    return project_id

def get_researcher(soup) :
    try :
        cand_section = soup.find_all(["dt", "dd"])
    except :
        return "NOT_FOUND"
    
    researcher = "NOT_FOUND"
    for i in range(len(cand_section) - 1) :
        cur_tag  = cand_section[i]
        if i + 1 < len(cand_section) :
            next_tag = cand_section[i + 1]
        else :
            next_tag = None
        if cur_tag.get_text().strip() == "project lead" and next_tag is not None:
            if cur_tag.name.startswith("dt") and next_tag.name.startswith("dd") :
                researcher = next_tag.get_text().strip()
                if researcher.startswith("eval(decodeURIComponent") :
                    tmp = unquote(unquote(researcher))
                    for t in tmp.split(";") :
                        if t.find("createTextNode") == -1 :
                            continue
                        researcher = t.split("'")[1].strip()
                    # print(researcher)

    if researcher == "":
        return "NOT_FOUND"
    return researcher

def get_institution(soup) :
    try :
        cand_section = soup.find_all(["dt", "dd"])
    except :
        return "NOT_FOUND"
    
    institution = []
    hash_tmp = {}
    for i in range(len(cand_section) - 1) :
        cur_tag  = cand_section[i]
        if i + 1 < len(cand_section) :
            next_tag = cand_section[i + 1]
        else :
            next_tag = None
        if cur_tag.get_text().strip() == "university / research place" and next_tag is not None:
            if cur_tag.name.startswith("dt") and next_tag.name.startswith("dd") :
                txt = next_tag.get_text().strip()
                if not txt in hash_tmp and txt != "":
                    institution.append(txt)
                    hash_tmp[txt] = 1
        if cur_tag.get_text().strip() == "institute" and next_tag is not None:
            if cur_tag.name.startswith("dt") and next_tag.name.startswith("dd") :
                txt = next_tag.get_text().strip()
                if not txt in hash_tmp and txt != "":
                    institution.append(txt)
                    hash_tmp[txt] = 1

    if not institution :
        return "NOT_FOUND"

    return ";".join(institution)

def get_keywords(soup) :
    try :
        cand_section = soup.find_all(["dt", "dd"])
    except :
        return "NOT_FOUND"
    
    keywords = "NOT_FOUND"
    for i in range(len(cand_section) - 1) :
        cur_tag  = cand_section[i]
        if i + 1 < len(cand_section) :
            next_tag = cand_section[i + 1]
        else :
            next_tag = None
        if cur_tag.get_text().strip() == "keywords" and next_tag is not None:
            if cur_tag.name.startswith("dt") and next_tag.name.startswith("dd") :
                keywords = ";".join([key for key in next_tag.get_text().strip().split(",")])

    if keywords == "" :
        return "NOT_FOUND"

    return keywords

def get_award_amount(soup) :
    try :
        cand_section = soup.find_all(["dt", "dd"])
    except :
        return None, "NOT_FOUND"
    
    award_amount = None
    currency = "NOT_FOUND"

    for i in range(len(cand_section) - 1) :
        cur_tag  = cand_section[i]
        if i + 1 < len(cand_section) :
            next_tag = cand_section[i + 1]
        else :
            next_tag = None
        if cur_tag.get_text().strip() == "grants awarded" and next_tag is not None:
            if cur_tag.name.startswith("dt") and next_tag.name.startswith("dd") :
                text = next_tag.get_text().strip()
                award_amount = re.sub(r"[^\d\.]", "", text).strip()
                try :
                    award_amount = round(float(award_amount), 2)
                except :
                    award_amount = None
                    pass
            if award_amount :
                currency = "EUR"
    return award_amount, currency

def get_start_end_date(soup) :
    try :
        cand_section = soup.find_all(["dt", "dd"])
    except :
        return None, None
    
    start_end_date = ""
    for i in range(len(cand_section) - 1) :
        cur_tag  = cand_section[i]
        if i + 1 < len(cand_section) :
            next_tag = cand_section[i + 1]
        else :
            next_tag = None
        if cur_tag.get_text().strip() == "lifetime" and next_tag is not None:
            if cur_tag.name.startswith("dt") and next_tag.name.startswith("dd") :
                start_end_date = next_tag.get_text().strip()
    
    regex_string = r"\b\d{4}/\d{2}/\d{2}\b"
    matchs = re.findall(regex_string, start_end_date)
    if matchs :
        for i in range(len(matchs)) :
            try :
                matchs[i] = datetime.datetime.strptime(matchs[i], "%Y/%m/%d")
            except :
                matchs[i] = None
                pass
    else :
        return None, None

    start_date, end_date = None, None
    # print(matchs)
    if len(matchs) == 1 :
        start_date = str(matchs[0])
    elif len(matchs) > 1 :
        start_date, end_date = str(matchs[0]), str(matchs[1])
    # print(start_date, end_date)
    return start_date, end_date

def get_start_year(start_date) :
    if start_date is None :
        return "NOT_FOUND"
    return start_date[ : 4]

def get_end_year(end_date) :
    if end_date is None :
        return "NOT_FOUND"
    return end_date[ : 4]

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

    multi_process_db(46)

    print("Total time is : ", str(time.time() - start_time))