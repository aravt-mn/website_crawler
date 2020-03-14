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

def request(url):
    # url = parser.quote(url, safe=":?#[]!$&'()*+,;=/", encoding="utf-8")
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

def get_html(url) :
    html = request(url)
    soup = BeautifulSoup(html, "html.parser")
    del html
    return soup

def collect_urls() :
    page = "https://anr.fr/en/funded-projects-and-impact/funded-projects/?q=%20a&tx_solr%5Bpage%5D="

    links = []
    for index in range(1050) :
        url = page + str(index)
        html = get_html(url)
        for row in html.find_all("div", {"class" : "card"}) :
            a = row.find("a", href=True) 
            link = "https://anr.fr" + str(a["href"])
            print(link)
            links.append(link)
        # break
    # for link in links :
    #     print(link)

def clean_html(soup) :
    return re.sub(r"\n|\t|\s+", " ", str(soup))

def sub_process_db(row) :
    row["html"] = None
    
    try :
        row["html"] = clean_html(get_html(row["project_url"]))
    except :
        pass

    sql = """UPDATE tmp_anr_html SET html = %s WHERE id = %s"""
    sql_execute(sql, db_config, (row["html"], row["id"],))
    del row

def multi_process_db() :
    sql = """SELECT * FROM tmp_anr_html"""
    query_result = sql_execute(sql, db_config)

    grant_datas = []

    for row in query_result :
        features = {
            "id"              : row[0],
            "grant_sites_id"  : row[1],
            "project_url"     : row[2],
            "html"            : row[3],
        }
        if not features["html"] :
            grant_datas.append(features)

    print("total length of grant data : ", len(grant_datas))

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

    multi_process_db()
    # collect_urls()

    print("Total time : ", str(time.time() - start_time))
