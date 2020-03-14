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

def china_cleaner_local(row) :
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
        "country"           : "CN",
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

    if html == "NOT_FOUND" :
        # print("html not found")
        return features
    
    try :
        soup = BeautifulSoup(html, "html.parser")
    except :
        # print("Soup errors!")
        return features
    
    features["title"]    = get_title(soup)
    features["title_en"] = get_title_en(soup)
    features["project_id"]          = get_project_id(features["project_url"])
    features["project_id_original"] = features["project_id"]
    
    features["researcher"] = get_researcher(soup)
    features["institution"] = get_institution(soup)

    features["researcher_cleaned"], features["institution_cleaned"] = clear_researcher(get_researcher_cleaned(soup))
    features["researcher_en"] = features["researcher_cleaned"]
    features["institution_en"] = features["institution_cleaned"]

    features["keyword"], features["keyword_en"] = get_keywords(soup)

    features["description"], features["description_raw"] = get_description(soup)
    features["description_en"]                           = get_description_en(soup)
    # features["end_date"] = get_end_date(soup)
    # features["end_year"] = get_end_year(features["end_date"])

    return features

def get_title(soup) :
    try :
        return soup.find("span", {"id" : "chTitle"}).get_text().strip()
    except :
        return None
    return None

def get_title_en(soup) :
    try :
        return soup.find("span", {"id" : "enTitle"}).get_text().strip()
    except :
        return None
    return None

def minor_clean(text) :
    text = text.replace("【作者】", "").replace("【机构】", "").replace("；", ";")
    return ";".join([row.strip() for row in text.split(";") if row.strip() != ""])

def get_researcher(soup) :
    try :
        researcher_cand = soup.find("div", {"class" : "author"}).find_all("p")
    except :
        return None

    for row in researcher_cand :
        text = row.get_text().strip()
        if text.find("【作者】") != -1 :
            return minor_clean(text)

    return None

def get_institution(soup) :
    try :
        institution_cand = soup.find("div", {"class" : "author"}).find_all("p")
    except :
        return None

    for row in institution_cand :
        text = row.get_text().strip()
        if text.find("【机构】") != -1 :
            return minor_clean(text)
            
    return None

def get_researcher_cleaned(soup) :
    try :
        return soup.find("p", {"id" : "au_en"}).get_text().strip()
    except :
        return None
    return None

def clear_uniqode(text) :
    result = ""
    for t in text :
        ch = ord(t)
        if ch >= 0 and ch <= 256 :
            result += t 
        else :
            result += " "
    
    return result.strip()

def clear_researcher(researcher) :
    if researcher is None :
        return None, None

    researcher = re.sub(r"【Author】|\+|&|~", "", researcher)
    researcher = re.sub(r"\\\|", "-", researcher)
    researcher = re.sub(r"\\|\(|\)|\s\d\b|\,\d|\d\.|\b\d\s|et al", ";", researcher)
    researcher = re.sub(r"Department", ";Department", researcher)
    researcher = re.sub(r"College", ";College", researcher)
    researcher = re.sub(r"IBM", ";IBM", researcher)
    researcher = re.sub(r"LIU Gangersity", ";LIU Gangersity", researcher)
    researcher = re.sub(r"Key Laboratory", ";Key Laboratory", researcher)
    researcher = re.sub(r"Graduate School", ";Graduate School", researcher)
    # researcher = researcher.replace(u"0xEE", ";")

    researcher = [res.strip() for res in researcher.split(";") if res.strip() != ""]

    researcher_cand, institution_cand = [], []

    for row in researcher :
        if re.search(r"china|chinese|university|school|\bof\b|research|\bfor\b|co\.,ltd|central|center|management|college|station|institute|academy|beijing|state", row.lower()) :
            institution_cand.append(clear_uniqode(row))
        else :
            researcher_cand.append(clear_uniqode(row))
    
    researcher, institution = None, None
    if institution_cand :
        institution = ";".join(institution_cand)

    if researcher_cand :
        tmp = []
        for row in researcher_cand :
            for r in re.split(r"\d|\*|,", row) :
                r = re.sub(r"\band\b", "", r).strip()
                if len(r) < 3:
                    continue
                tmp.append(r)
        researcher = ";".join(tmp)

    if researcher :
        if researcher.find(";") == -1 :
            tmp = []
            researcher = researcher.split()
            for i in range(0, len(researcher), 2) :
                if i + 1 < len(researcher) :
                    tmp.append(" ".join([researcher[i], researcher[i + 1]]))
                else :
                    tmp.append(researcher[i])
            researcher = ";".join(tmp)

    return researcher, institution

def get_keywords(soup) :
    try :
        keyword_cand = soup.find_all("span", {"id" : "ChDivKeyWord"})
    except :
        return None, None

    keywords = [None, None]
    keyword_cand = keyword_cand[ : 2]
    
    for i in range(len(keyword_cand)) :
        keywords[i] = ";".join([key.strip() for key in keyword_cand[i].get_text().split("；")])

    return keywords[0], keywords[1]

def get_description(soup) :
    try :
        description = soup.find("span", {"id" : "ChDivSummary"}).get_text().strip()
    except :
        return None, None    
    
    return description, description

def get_description_en(soup) :
    try :
        description_en = soup.find("span", {"id" : "EnChDivSummary"}).get_text().strip()
    except :
        return None
    
    return description_en

# def get_end_date(soup) :
#     try :
#         end_date_cands = soup.find_all("li")
#     except :
#         return None

#     for row in end_date_cands :
#         text = row.get_text().strip()
#         text = " ".join(text.split())
#         if text.find("网络出版时间") != -1 :
#             text = text.replace("【网络出版时间】","").split()[0].strip()
#             try :
#                 datetime.datetime.strptime(text, "%Y-%m-%d")
#             except :
#                 return None
#             return text
#     return None

# def get_end_year(end_date) :
#     if end_date is None :
#         return None
#     if len(end_date) > 4 :
#         return end_date[ : 4]
#     return None

def get_project_id(project_url) :
    if project_url is None :
        return None
    if project_url.find("filename=") != -1 :
        return project_url.split("filename=")[-1].strip()
    return None

def multi_process_db() :
    start_time = time.time()

    sql = """SELECT id FROM tmp_china_html"""
    query_result = sql_execute(sql, db_config)

    iter = 100000
    hash_url = {}

    for i in range(0, len(query_result), iter) :
        sub_ids = query_result[i : i + iter]

        sql = f"""SELECT * FROM tmp_china_html WHERE id in ({','.join([str(row[0]) for row in sub_ids])})"""
        tmp_china_html = sql_execute(sql, db_config)
        sub_grant_datas = []

        for row in tmp_china_html :
            features = {
                "id"              : row[0],
                "grant_sites_id"  : row[1],
                "project_url"     : row[2],
                "html"            : row[3],
            }
            if features["project_url"] in hash_url :
                continue
            else :
                sub_grant_datas.append(features)
                hash_url[features["project_url"]] = 1
        
        del tmp_china_html

        p = Pool(processes=cpu_count())
        grant_datas = p.map(china_cleaner_local, sub_grant_datas)
        p.close()
        p.join()

        del sub_grant_datas
        sql = """INSERT INTO final_grant_sites_crawled_info_cleaned(
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
            if row["project_id"] is None :
                continue
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
        print(str(i), str(i + iter), str(time.time() - start_time))

        # break

if __name__ == "__main__":
    start_time = time.time()

    config = configparser.ConfigParser()
    config.read('.env')

    db_config = (config["DEFAULT"]["_HOSTNAME"], config["DEFAULT"]["_DATABASE"], config["DEFAULT"]["_USERNAME"], \
    config["DEFAULT"]["_PASSWORD"], config["DEFAULT"]["_PORT"])

    multi_process_db()

    print("Total time is : ", str(time.time() - start_time))