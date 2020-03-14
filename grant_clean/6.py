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

import random
import ssl
import urllib.request as urllib
import urllib.parse as parser

agent_file = open(os.getcwd() + '/user-agent.txt', 'r')
agent_list = agent_file.read().split('\n')
agent_file.read()

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def request(url):
    url = parser.quote(url, safe=":?#[]!$&'()*+,;=/", encoding="utf-8")
    random_agent = agent_list[random.randint(0, len(agent_list)-1)]

    req = urllib.Request(
        url,
        headers={
            'User-Agent': random_agent
        }
    )

    f = urllib.urlopen(req, context=ctx, timeout=10)
    # print(f.getcode(), url)

    return f.read().decode()

def get_html(url, tag="", class_id="", class_id_name="") :
    html = request(url)
    soup = BeautifulSoup(html, "html.parser")
    del html
    
    try :
        if tag == "" and class_id == "" and class_id_name == "" :
            return soup
        else :
            soup = soup.find(tag, {class_id : class_id_name})
    except :
        return "NOT_FOUND"

    return soup

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
        "country"           : "FR",
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
    
    if features["project_url"].find("ProjetIA") != -1 :
        features["title"]    = get_title(soup)
        features["title_en"] = features["title"]

        features["project_id"]          = get_project_id(features["project_url"])
        features["project_id_original"] = features["project_id"]

        features["award_amount"], features["currency"] = get_award_amount_new(soup)
        features["researcher"], features["institution"] = get_researcher_new(soup)

        features["start_date"], features["end_date"] = get_date_new(soup)

        features["description"]  = get_description(soup)
        features["description_raw"] = features["description"]
        features["description_en"] = features["description"]

        features["start_year"] = get_end_year(features["start_date"])
        features["end_year"] = get_end_year(features["end_date"])
    else :
        features["title"]    = get_title(soup)
        features["title_en"] = features["title"]

        features["project_id"]          = get_project_id(features["project_url"])
        features["project_id_original"] = features["project_id"]
        
        features["institution"] = get_institution(soup)
        features["institution_en"] = features["institution"]

        features["award_amount"], features["currency"]  = get_award_amount(soup)
        features["start_date"], features["end_date"] = get_date(soup)

        features["description"]  = get_description(soup)
        features["description_raw"] = features["description"]
        features["description_en"] = features["description"]

        features["start_year"] = get_end_year(features["start_date"])
        features["end_year"] = get_end_year(features["end_date"])

    return features

def get_researcher_new(soup) :
    try :
        soup = soup.find("section", {"class" : "block"}).find("p")
    except :
        return None, None

    researcher, institution = None, None
    soup = BeautifulSoup(str(soup).replace("<br/>", ";"), "html.parser")
    
    for row in soup.get_text().split(";") :
        if row.strip() == "" :
            continue
        cand = row.split(":")
        if len(cand) == 2 :
            if cand[0].strip() == "RST" :
                researcher = cand[1].strip()
            elif cand[0].strip() == "Etablissement Coordinateur" :
                institution = cand[1].strip()
    
    return researcher, institution

def get_title(soup) :
    try :
        return soup.find("section", {"class" : "content-style"}).find("h1").get_text().strip()
    except :
        return None
    return None

def get_institution(soup) :
    try :
        institution_cand = soup.find_all("section", {"class" : "block block-info"})
    except :
        return None
    # print(institution_cand)
    try :
        for row in institution_cand :
            if row.find("h2").get_text().strip() == "Partner" :
                institution = row.find("div", {"class" : "block__content"}).find("p").get_text()
                institution = ";".join([ins.strip() for ins in institution.split("\n") if ins.strip() != ""])
                return institution
    except : 
        return None
    return None

def get_description(soup) :
    try :
        description = soup.find("section", {"class" : "content-style"})
    except :
        return None
    [s.extract() for s in description.find_all("section")]
    [s.extract() for s in description.find_all("h1")]
    [s.extract() for s in description.find_all("div", {"class" : "categories"})]

    return description.get_text().strip()

def get_award_amount(soup) :
    try :
        cands = soup.find_all("section", {"class" : "block block-info"})
    except :
        return None, None

    try :
        for row in cands :
            if row.find("h2").get_text().strip() == "Partner" :
                strongs = row.find_all("strong")
                for strong in strongs :
                    if strong.get_text().find("ANR") != -1 :
                        currency = "EUR" if strong.find("euros") != -1 else None
                        award_amount = re.sub(r"[^\d\.]", "", strong.get_text())
                        try :
                            award_amount = float(award_amount)
                        except :
                            return None, None
                        return award_amount, currency
    except : 
        return None, None
    return None, None

def get_award_amount_new(soup) :
    try :
        soup = soup.find("section", {"class" : "block"})
    except :
        return None, None

    try :
        strongs = soup.find_all("strong")
        for strong in strongs :
            if strong.get_text().find("ANR") != -1 :
                currency = "EUR" if strong.find("euros") != -1 else None
                award_amount = re.sub(r"[^\d\.]", "", strong.get_text())
                try :
                    award_amount = float(award_amount)
                except :
                    return None, None
                return award_amount, currency
    except : 
        return None, None
    return None, None

def get_date_new(soup) :
    try :
        soup = soup.find("section", {"class" : "block"})
    except :
        return None, None
    
    try :
        strongs = soup.find_all("strong")
        for strong in strongs :
            if strong.get_text().find("Investissement") != -1 :
                text = strong.get_text().strip()
                text = text.split("période de")[-1]
                cal = {
                    "janvier" : "January",
                    "février" : "February",
                    "mars" : "March",
                    "avril" : "April",
                    "mai" : "May",
                    "juin" : "June",
                    "juillet" : "July",
                    "aout" : "August",
                    "septembre" : "September",
                    "octobre" : "October",
                    "novembre" : "November",
                    "décembre" : "December",
                }
                tmp = []
                for row in text.split() :
                    if row.lower().strip() in cal :
                        tmp.append(cal[row.lower().strip()])
                    else :
                        tmp.append(row)
                text = " ".join(tmp)
                text = [t.strip() for t in text.split("à")]
                if len(text) > 1 :
                    if text[0] == "" :
                        return None, None
                    text[0] = datetime.datetime.strptime(text[0], "%B %Y").date()
                    text[1] = datetime.datetime.strptime(text[1], "%B %Y").date()
                    return str(text[0]), str(text[1])
    except : 
        return None, None
    return None, None

def get_date(soup) :
    try :
        cands = soup.find_all("section", {"class" : "block block-info"})
    except :
        return None, None
    
    try :
        for row in cands :
            if row.find("h2").get_text().strip() == "Partner" :
                strongs = row.find_all("strong")
                for strong in strongs :
                    if strong.get_text().find("project") != -1 :
                        text = strong.get_text().strip()
                        text = text.split(":")[-1]
                        text = [t.strip() for t in text.split("-")]
                        if len(text) > 1 :
                            if text[0] == "" :
                                return None, None
                            text[0] = datetime.datetime.strptime(text[0], "%B %Y").date()
                            tmp = text[0]
                            pos = text[1].find(" Months")
                            
                            if pos != -1 :
                                year_save = int(int(text[1][: pos]) / 12)
                                month_save = int(int(text[1][: pos]) % 12)
                                
                                year_save = tmp.year + year_save + int((tmp.month + month_save - 1) / 12)
                                month_save = (month_save + tmp.month) % 12
                                if month_save == 0 :
                                    month_save = 12

                                # text[1] = tmp.replace(year=tmp.year + int(int(text[1][:2])/12), month=tmp.month + int(int(text[1][:2]) % 12))
                                text[1] = tmp.replace(year=year_save, month=month_save)
                                
                                return str(text[0]), str(text[1])
    except : 
        return None, None
    return None, None

def get_end_year(end_date) :
    if end_date is None :
        return None
    if len(end_date) > 4 :
        return end_date[ : 4]
    return None

def get_project_id(project_url) :
    if project_url is None :
        return None
    if project_url.find("-") != -1 :
        return project_url[project_url.find("-") + 1 :].strip()
    return None

def multi_process_db() :
    start_time = time.time()

    sql = """SELECT * FROM tmp_anr_html WHERE html is not null"""
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
    sql = """INSERT INTO tmp_anr_info(
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
    #     "grant_sites_id" : 6,
    #     "project_url" : "https://anr.fr/Project-ANR-13-BIME-0005"
    # }
    # with open("./tmp/test.html") as f :
    #     row["html"] = f.read()

    # tmp = cleaner(row)

    # for key, val in tmp.items() :
    #     print(key, val)

    print("Total time is : ", str(time.time() - start_time))