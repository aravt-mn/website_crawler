# coding:utf-8

import requests
from bs4 import BeautifulSoup
import re
from urllib.parse import urljoin
import time
import os
import urllib
import psycopg2
import warnings
import sys
import configparser
import datetime

from lib.db import sql_execute, sql_insert

DIR_PATH = os.path.dirname(os.path.abspath(__file__))

def main(start, end, db_config, base="https://kaken.nii.ac.jp"):
    if start < 1964:
        warnings.warn("start min is 1964", Warning)
        start = 1964
    
    # now = datetime.datetime.now()
    # if end > now.year:
    #     warnings.warn("end max is now.year", Warning)
    #     end = now.year
    # _HOSTNAME, _DATABASE, _USERNAME, _PASSWORD, _PORT = db_config

    # conn = psycopg2.connect(host=_HOSTNAME, user=_USERNAME,
    #                         password=_PASSWORD, database=_DATABASE, port=_PORT)
    # cur = conn.cursor()

    # grant_url_list = []
    for s1_s2 in range(start, end+1):
        print(s1_s2)
        url_a = "https://kaken.nii.ac.jp/ja/search/?o1=1&s1={}&s2={}&rw=500".format(s1_s2,s1_s2)
        for st in range(1, 50000, 500):
            url_b = "&st={}".format(st)
            url_search = url_a + url_b
            print('url -->> ', url_search)
            search = requests.get(url_search).text
            soup = BeautifulSoup(search, "html.parser")
            grant_url = soup.find_all(href=re.compile("/ja/grant/"))
            
            time.sleep(3)
            
            # count_get_url = []
            
            for link in grant_url:
                href_g = link.get('href')
                print('dtl url => ', href_g)
                url_g = urljoin(base, href_g)
                
                query = """SELECT project_url 
                        from kaken_grants 
                        where project_url = %s
                        """
                l_url = sql_execute(query, db_config, (url_g,))
                if len(l_url) > 0:
                    query="UPDATE kaken_grants SET status = %s WHERE project_url = %s"
                    sql_insert(query, db_config, (0, url_g))
                    print("dufflicated url --> ", url_g)
                    continue
                
                query="INSERT INTO kaken_grants(project_url, status) VALUES (%s, %s)"
                sql_insert(query, db_config, (url_g, 0))
                
            if len(grant_url) < 500:
                break
            #break

#====================================================================
# 実行
#====================================================================
if __name__ == '__main__':
    # python3 find_reporting_url.py 2018 2019
    now = datetime.datetime.now().year
    # _START = int(sys.argv[1])
    # _END = int(sys.argv[2])
    _START = now - 2
    _END = now
    print("find reporting url:{0} to {1}".format(_START, _END))

    config = configparser.ConfigParser()
    config.read(os.path.join(DIR_PATH, '../config.ini'))
    
    db_config = (config["DEFAULT"]["_HOSTNAME"], config["DEFAULT"]["_DATABASE"], 
        config["DEFAULT"]["_USERNAME"], config["DEFAULT"]["_PASSWORD"], config["DEFAULT"]["_PORT"])


    main(start=_START, end=_END, db_config=db_config)


        # #1年分のTopURL
        # if len(grant_url_list) >=10:
        #     break