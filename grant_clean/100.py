# cnki parser
import re
import os
import csv
import time
import datetime
import configparser
from bs4 import BeautifulSoup
from multiprocessing import Pool, cpu_count

from db import sql_execute, sql_insert, sql_insert_many
from tools import write_to_csv

def cleaner(row) :
    features = {
        "id"                : row["id"],
        "grant_sites_id"    : row["grant_sites_id"],
        "project_id"        : None,
        "project_id_original" : None,
        "title"             : None,
        "title_en"          : None,
        "project_url"       : row["project_url"],
        "keyword"           : None,
        "keyword_en"        : None,
        "source"            : None,
        "researcher"        : None,
        "researcher_en"     : None,
        "researcher_cleaned" : None,
        "institution"       : None,
        "institution_en"       : None,
        "institution_cleaned" : None,
        "country"           : "DE",
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
    html = row["html"]
    del row

    if not html :
        # print("html not found")
        return features
    
    try :
        soup = BeautifulSoup(html, "html.parser")
    except :
        # print("Soup errors!")
        return features
    
    features["title"]    = get_title(soup)
    features["title_en"] = features["title"]

    features["project_id"]          = get_project_id(features["project_url"])
    features["project_id_original"] = features["project_id"]
    
    features["researcher"], features["institution"] = get_researcher(soup)

    features["description"]  = get_description(soup)
    features["description_raw"] = features["description"]

    features["start_year"], features["end_year"] = get_end_year(soup)

    return features

def get_researcher(soup) :
    try :
        spans = soup.find_all("span", {"class" : ["name", "value"]})
    except :
        return None, None

    researcher, institution = [], []
    for i in range(0, len(spans) if len(spans) % 2 == 0 else len(spans) - 1, 2) :
        cur_span = spans[i]
        next_span = spans[i + 1]

        cur_text = cur_span.get_text().replace("­", "")
        if cur_text.find("Antragsteller") != -1 :
            try :
                for row in next_span.find_all("a") :
                    researcher.append(row.get_text().strip())
            except :
                pass
            [s.extract() for s in next_span.find_all("a")]
            next_span = str(next_span).replace("<br/>", ";")
            soup = BeautifulSoup(next_span, "html.parser")
            try :
                for row in soup.get_text().split(";") :
                    if row.strip() != "" :
                        institution.append(row.strip())
            except :
                pass
        regex_string = r"Teilprojektleiter|Leiter|Wis­sen­schaft­le­rin­nen|Sprecher"
        if re.search(regex_string, cur_text) :
            try :
                for row in next_span.find_all("a") :
                    researcher.append(row.get_text().strip())
            except :
                pass

        if cur_text.find("Institution") != -1 :
            try :
                for row in next_span.find_all("a") :
                    institution.append(row.get_text().strip())
            except :
                pass
    researcher = ";".join(researcher) if researcher else None
    institution = ";".join(institution) if institution else None

    return researcher, institution

def get_title(soup) :
    try :
        return soup.find("div", {"class" : "details"}).find("h3").get_text().strip()
    except :
        return None
    return None

def get_description(soup) :
    try :
        return soup.find("div", {"id" : "projekttext"}).get_text().strip()
    except :
        return None
    return None

def get_end_year(soup) :
    try :
        spans = soup.find_all("span", {"class" : ["name", "value"]})
    except :
        return None
    start_year, end_year = None, None
    for i in range(0, len(spans) if len(spans) % 2 == 0 else len(spans) - 1, 2) :
        cur_span = spans[i]
        next_span = spans[i + 1]

        if cur_span.get_text().strip() == "Förderung" :
            text = next_span.get_text()
            regex_string = r"\b\d{4}\b"
            m = re.findall(regex_string, text)
            if m :
                if len(m) == 2 :
                    start_year = min(m[0], m[1])
                    end_year = max(m[0], m[1])
                elif len(m) == 1 :
                    start_year = m[0]

    return start_year, end_year

def get_project_id(project_url) :
    if project_url is None :
        return None
    project_id = project_url.split("/")[-1].strip()

    try :
        int(project_id)
    except :
        return None
    return project_id

def multi_process_db() :
    sql = """SELECT * FROM tmp_dfg_html WHERE html is not null"""
    query_result = sql_execute(sql, db_config)

    sub_grant_datas = []

    for row in query_result :
        features = {
            "id"              : row[0],
            "grant_sites_id"  : row[1],
            "project_url"     : row[2],
            "html"            : row[3],
        }
        sub_grant_datas.append(features)

    p = Pool(processes=cpu_count())
    grant_datas = p.map(cleaner, sub_grant_datas)
    p.close()
    p.join()

    del sub_grant_datas
    sql = """INSERT INTO tmp_dfg_info(
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
        crawled_date)
        VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s, now(),now(),now() )"""
    
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
            row["researcher_cleaned"],
            row["institution"],
            row["institution_en"],
            row["institution_cleaned"],
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

if __name__ == "__main__":
    start_time = time.time()

    config = configparser.ConfigParser()
    config.read('.env')

    db_config = (config["DEFAULT"]["_HOSTNAME"], config["DEFAULT"]["_DATABASE"], config["DEFAULT"]["_USERNAME"], \
    config["DEFAULT"]["_PASSWORD"], config["DEFAULT"]["_PORT"])

    multi_process_db()

    # row = {
    #     "id" : 1,
    #     "grant_sites_id" : 100,
    #     "project_url" : "http://gepris.dfg.de/gepris/projekt/73376775"
    # }
    # with open("./tmp/test.html") as f :
    #     row["html"] = f.read()

    # tmp = cleaner(row)

    # for key, val in tmp.items() :
    #     print(key, val)

    print("Total time is : ", str(time.time() - start_time))