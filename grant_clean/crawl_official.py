import re
import os
import csv
import sys
import ssl
import time
import random
from multiprocessing import Pool, cpu_count
from bs4 import BeautifulSoup, NavigableString, Comment

import configparser
from datetime import datetime
from db import sql_execute, sql_insert

import urllib.request as urllib
import urllib.parse as parser

from tools import write_csv_head, append_to_csv, read_csv, read_tsv

csv.field_size_limit(sys.maxsize)

agent_file = open(os.getcwd() + '/user-agent.txt', 'r')
agent_list = agent_file.read().split('\n')
agent_file.read()

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

db_config = ()
db_option = "insert"

global_option = {
    15 : {
        "tag" : "div",
        "class_id" : "class",
        "class_id_name" : "summary-area"
    },
    68 : {
        "tag" : "div",
        "class_id" : "id",
        "class_id_name" : "main"
    },
    46 : {
        "tag" : "article",
        "class_id" : "class",
        "class_id_name" : "single-project"
    },
}

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

def clean_html(soup) :
    return re.sub(r"\n|\t|\s+", " ", str(soup))

def sub_process_db(row) :
    row["html"] = "NOT_FOUND"
    global global_option
    tag             = global_option[row["grant_sites_id"]]["tag"]
    class_id        = global_option[row["grant_sites_id"]]["class_id"]
    class_id_name   = global_option[row["grant_sites_id"]]["class_id_name"]
    
    try :
        if row["grant_sites_id"] == 46 :
            row["html"] = clean_html(get_html(row["project_url"].replace("details", ""), tag, class_id, class_id_name))
            tmp_html = clean_html(get_html(row["project_url"]))
            row["html"] = row["html"].replace("</article>", tmp_html)
        else :
            row["html"] = clean_html(get_html(row["project_url"], tag, class_id, class_id_name))
    except :
        pass

    sql = """INSERT into tmp_other_html
                    (
                        id,
                        grant_sites_id,
                        project_url,
                        html
                    ) values(%s,%s,%s,%s)"""
    sql_insert(sql, db_config, (row["id"], row["grant_sites_id"], row["project_url"], row["html"]))
    del row

def multi_process_db(grant_site_id) :
    sql = """SELECT id, grant_sites_id, project_url FROM tmp_other_html WHERE grant_sites_id = %s"""
    query_result = sql_execute(sql, db_config, (grant_site_id,))

    print(str(grant_site_id),  " url length, tmp_other_html: ", len(query_result))
    
    url_hash = {}

    for row in query_result :
        url_hash[str(row[2]).strip()] = 1

    # ----------- INSERT -----------
    grant_datas = []

    sql = """SELECT id, grant_sites_id, project_url FROM grant_sites_crawled_info WHERE grant_sites_id = %s"""
    query_result = sql_execute(sql, db_config, (grant_site_id,))

    print(str(grant_site_id),  " url length, grant_sites_crawled_info : ", len(query_result))

    for row in query_result :
        tmp_row = {
            "id" : row[0],
            "grant_sites_id" : row[1],
            "project_url" : str(row[2]).strip()
        }

        if tmp_row["project_url"].find("https") == -1 and tmp_row["project_url"].find("http") != -1 :
            tmp_row["project_url"] = tmp_row["project_url"].replace("http", "https")

        if tmp_row["project_url"] not in url_hash :
            grant_datas.append(tmp_row)

    print("Not inserted datas : ", len(grant_datas))

    # index = 0
    # for row in grant_datas :
    #     sub_process_db(row)
    #     print(index)
    #     index += 1
    #     if index == 10 :
    #         break

    p = Pool(processes=cpu_count())
    p.map(sub_process_db, grant_datas)
    p.close()
    p.join()

if __name__ == "__main__":
    start_time = time.time()

    config = configparser.ConfigParser()

    config.read('.env')

    db_config = (config["DEFAULT"]["_HOSTNAME"], config["DEFAULT"]["_DATABASE"], config["DEFAULT"]["_USERNAME"], \
    config["DEFAULT"]["_PASSWORD"], config["DEFAULT"]["_PORT"])

    multi_process_db(46)
    
    print("Total time : ", str(time.time() - start_time))

# grant_sites_id : 15  [div class = summary-area]
