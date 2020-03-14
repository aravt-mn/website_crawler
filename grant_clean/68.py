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
        "country"           : "NL",
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
    
    features["title"]               = get_title(soup)
    features["project_id"]          = get_project_id(soup)
    features["project_id_original"] = features["project_id"]

    features["researcher"]      = get_researcher(soup)
    features["researcher_en"]   = features["researcher"]
    features["institution"]     = get_institution(soup)

    features["description_en"]  = get_description(soup)
    features["description"]     = features["description_en"]
    features["description_raw"] = get_description_raw(soup)

    features["start_date"], features["end_date"] = get_start_end_date(soup)
    features["start_year"] = get_start_year(features["start_date"])
    features["end_year"]   = get_start_year(features["end_date"])

    return features

def get_title(soup) :
    try :
        return soup.find("h1", {"class" : "readcontent"}).get_text().strip()
    except :
        return "NOT_FOUND"
    return "NOT_FOUND"

def get_project_id(soup) :
    try :
        cand_section = soup.find("div", {"class" : "section emphasize"}).find_all()
    except :
        return "NOT_FOUND"
    
    project_id = "NOT_FOUND"
    for i in range(len(cand_section) - 1) :
        cur_tag  = cand_section[i]
        if i + 1 < len(cand_section) :
            next_tag = cand_section[i + 1]
        else :
            next_tag = None
        if cur_tag.get_text().strip() == "Project number" and next_tag is not None:
            if cur_tag.name.startswith("h") and next_tag.name.startswith("p") :
                project_id = next_tag.get_text().strip()

    return project_id

def get_researcher(soup) :
    try :
        cand_section = soup.find("div", {"class" : "section emphasize"}).find_all()
    except :
        return "NOT_FOUND"
    
    researcher = []
    for i in range(len(cand_section) - 1) :
        cur_tag  = cand_section[i]
        if i + 1 < len(cand_section) :
            next_tag = cand_section[i + 1]
        else :
            next_tag = None
        if cur_tag.get_text().strip() == "Main applicant" and next_tag is not None:
            if cur_tag.name.startswith("h") and next_tag.name.startswith("p") :
                researcher.append(next_tag.get_text().strip())
        if cur_tag.get_text().strip() == "Team members" and next_tag is not None:
            if cur_tag.name.startswith("h") and next_tag.name.startswith("p") :
                for res in next_tag.get_text().strip().split(",") :
                    researcher.append(res.strip())
    if not researcher :
        return "NOT_FOUND"
    return ";".join(researcher)

def get_institution(soup) :
    try :
        cand_section = soup.find("div", {"class" : "section emphasize"}).find_all()
    except :
        return "NOT_FOUND"
    
    institution = "NOT_FOUND"
    for i in range(len(cand_section) - 1) :
        cur_tag  = cand_section[i]
        if i + 1 < len(cand_section) :
            next_tag = cand_section[i + 1]
        else :
            next_tag = None
        if cur_tag.get_text().strip() == "Affiliated with" and next_tag is not None:
            if cur_tag.name.startswith("h") and next_tag.name.startswith("p") :
                institution = next_tag.get_text().strip()
     
    if institution == "" :
        return "NOT_FOUND"

    return institution

def get_description(soup) :
    try :
        description_cand = soup.find("div", {"class" : "readcontent"})
    except :
        return "NOT_FOUND"
    description = []

    try :
        description = description_cand.find_all("p")
    except :
        pass

    if description :
        description = "\n".join([desc.get_text().strip() for desc in description]).strip()
    else :
        return "NOT_FOUND"
    if description == "" :
        return "NOT_FOUND"
    return description

def get_description_raw(soup) :
    try :
        description_raw_cand = soup.find("div", {"class" : "readcontent"})
    except :
        return "NOT_FOUND"
    description_raw = "NOT_FOUND"

    try :
        description_raw = description_raw_cand.get_text().strip()
    except :
        pass

    if description_raw == "" :
        return "NOT_FOUND"
    return description_raw

def get_start_end_date(soup) :
    try :
        cand_section = soup.find("div", {"class" : "section emphasize"}).find_all()
    except :
        return None, None
    
    start_end_date = ""
    for i in range(len(cand_section) - 1) :
        cur_tag  = cand_section[i]
        if i + 1 < len(cand_section) :
            next_tag = cand_section[i + 1]
        else :
            next_tag = None
        if cur_tag.get_text().strip() == "Duration" and next_tag is not None:
            if cur_tag.name.startswith("h") and next_tag.name.startswith("p") :
                start_end_date = next_tag.get_text().strip()
    
    regex_string = r"\b\d{2}/\d{2}/\d{4}\b"
    matchs = re.findall(regex_string, start_end_date)
    if matchs :
        for i in range(len(matchs)) :
            try :
                matchs[i] = datetime.datetime.strptime(matchs[i], "%d/%m/%Y")
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

    multi_process_db(68)

    print("Total time is : ", str(time.time() - start_time))