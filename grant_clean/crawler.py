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

input_field  = ["id","grant_sites_id","project_url"]
output_field = ["id","grant_sites_id","project_url","html"]

db_config = ()
db_option = "insert"

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

def get_html(url) :
    html = request(url)
    soup = BeautifulSoup(html, "html.parser")

    del html

    soup = soup.find("div", {"id" : "main"})

    if len(soup.find_all("div")) > 0 :
        soup = soup.find_all("div")[0]

    return soup

def clean_html(soup) :
    return re.sub(r"\n|\t|\s+", " ", str(soup))

def sub_process(row) :
    row["html"] = "NOT_FOUND"
    try :
        row["html"] = clean_html(get_html(row["project_url"]))
    except :
        pass
    
    tmp = []
    for key, val in row.items() :
        tmp.append(val)

    print("\t".join(tmp))
    
    del tmp
    del row
    return None

def multi_process_file() :
    tmp_data = read_tsv("./china_all.csv")
    tmp_hash = {}

    for row in tmp_data :
        if row["html"] != "NOT_FOUND" :
            tmp_hash[row["id"]] = 1
    del tmp_data

    grant_datas = []

    tmp_data = read_csv("./china.csv", field=input_field)
    for row in tmp_data :
        if row["id"] in tmp_hash :
            continue
        grant_datas.append(row)
    del tmp_data
    del tmp_hash

    # print("\t".join(output_field))

    iter = 100000

    for i in range(0, len(grant_datas), iter) :
        sub_grant_datas = grant_datas[i : i + iter]

        p = Pool(processes=cpu_count())
        p.map(sub_process, sub_grant_datas)
        p.close()
        p.join()

        del sub_grant_datas


def sub_process_db(row) :
    row["html"] = "NOT_FOUND"
    try :
        row["html"] = clean_html(get_html(row["project_url"]))
    except :
        pass
    global db_option

    if db_option == "insert" :
        sql = """INSERT into tmp_china_html
                        (
                            id,
                            grant_sites_id,
                            project_url,
                            html
                        ) values(%s,%s,%s,%s)"""
        sql_insert(sql, db_config, (row["id"], row["grant_sites_id"], row["project_url"], row["html"]))
    elif db_option == "update" :
        sql = """UPDATE tmp_china_html SET html = %s WHERE id = %s"""
        sql_insert(sql, db_config, (row["html"], row["id"]))

def multi_process_db() :
    sql = """SELECT id FROM tmp_china_html"""
    query_result = sql_execute(sql, db_config)

    print("tmp_china_html len : ", len(query_result))
    html_id_hash = {}

    for row in query_result :
        html_id_hash[row[0]] = 1

    # ----------- INSERT -----------
    grant_datas = []

    sql = """SELECT * FROM tmp_china_urls"""
    query_result = sql_execute(sql, db_config)

    print("tmp_china_urls len : ", len(query_result))

    for row in query_result :
        tmp_row = {
            "id" : row[0],
            "grant_sites_id" : row[1],
            "project_url" : row[2]
        }
        if row[0] not in html_id_hash :
            grant_datas.append(tmp_row)

    print("Not inserted datas : ", len(grant_datas))
    p = Pool(processes=cpu_count())
    p.map(sub_process_db, grant_datas)
    p.close()
    p.join()

    # ----------- UPDATE -----------
    sql = """SELECT * FROM tmp_china_html WHERE html = 'NOT_FOUND'"""
    query_result = sql_execute(sql, db_config)
    
    grant_datas = []

    for row in query_result :
        tmp_row = {
            "id" : row[0],
            "grant_sites_id" : row[1],
            "project_url" : row[2]
        }
        grant_datas.append(tmp_row)
    
    print("To update datas : ", len(grant_datas))
    
    global db_option
    db_option = "update"
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
    # multi_process_file()

    print("Total time : ", str(time.time() - start_time))


