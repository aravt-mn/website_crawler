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

#log
from lib.write_log import write_error_log
import logging

from lib.db import sql_execute, sql_insert, sql_alter


DIR_PATH = os.path.dirname(os.path.abspath(__file__))

def main(db_config, base="https://kaken.nii.ac.jp"):
    if not os.path.exists("./logs") :
        os.mkdir("./logs")
    write_error_log("./logs/find_reporting_pdf_error.log","error log", _mode="a")
    write_error_log("./logs/find_reporting_pdf_info.log","info log", _mode="a")
    logger_err = logging.getLogger("error log")
    logger_info = logging.getLogger("info log")
    print('START')
    while True:
        try:
            # get project yrl
            query = """SELECT project_url
            from kaken_grants
            where status = 0
            limit 1
            """
            try:
                url = sql_execute(query, db_config)
            except:
                logger_err.error("select project_url query error", exc_info=True)
                time.sleep(10)
                continue
            if len(url) == 0:
                logger_info.info("all report crawled")
                time.sleep(10) # 本番ではcontinue
                continue

            url = url[0][0]
            logger_info.info("start crawl url={0}".format(url))

            # Change kanken grant status
            query = """UPDATE kaken_grants
            SET status = %s
            where project_url = %s
            """
            try:
                sql_insert(query, db_config, (2, url))
            except:
                logger_err.error("update status query error", exc_info=True)

            # Download HTML
            try:
                top_html = requests.get(url).text
            except:
                logger_err.error("crawler error", exc_info=True)
                query = """UPDATE kaken_grants
                SET status = %s
                where project_url = %s
                """
                sql_insert(query, db_config, (-1, url))

            # Load soup
            try:
                soup = BeautifulSoup(top_html, "html.parser")
                
                title = soup.h1.string
                
                ID = url.split("/")[-2]
                ID = ID.replace("KAKENHI-", "")
            except:
                logger_err.error("id title parse error", exc_info=True)
            
            # set title
            query = """UPDATE kaken_grants
            SET project_id = %s,
            title = %s,
            status = %s
            where project_url = %s
            """
            try:
                sql_insert(query, db_config, (ID, title, 2, url))
            except:
                logger_err.error("update kaken_grants query error", exc_info=True)
                query = """UPDATE kaken_grants
                SET status = %s
                where project_url = %s
                """
                sql_insert(query, db_config, (-1, url))
            
            # find another kaken grant
            try:
                report = soup.find_all(href=re.compile("/report/"))
                report = set(report)
                
                report_list = []
                for link in report:
                    href = link.get('href')
                    url_1 = urljoin(base, href)
                    report_list.append(url_1)

                report_list = set(report_list)
            except:
                logger_err.error("get report_list error", exc_info=True)
                query = """UPDATE kaken_grants
                SET status = %s
                where project_url = %s
                """
                sql_insert(query, db_config, (-1, url))
            
            # save_dir = ID
            # if save_dir not in os.listdir("./"):
            #     os.mkdir(save_dir)
                
            time.sleep(1)
            
            # download html
            for download_HTML in report_list:
                logger_info.info("parse url={0}".format(url))
                try:
                    html = requests.get(download_HTML).text
                except:
                    logger_err.error("report crawler error", exc_info=True)
                    continue

                # load soup
                soup_report = BeautifulSoup(html, "html.parser")
                try:
                    a = soup_report.find("h2")
                    a = a.string
                    a = a.replace(" ", "")
                    a = a.replace("年度", "")
                    a = a.replace("\xa0", "")
                    name = re.sub(r'([0-9]+)', "", a)
                    year = a.rstrip(name)
                except:
                    logger_err.error("parse name and year error", exc_info=True)
                    name = "-1"
                    year = "-1"
                try:
                    release = soup_report.find("p", class_="pull-right").text
                    release = release.replace("\xa0", "")
                    release = release[4:14]
                except:
                    logger_err.error("parse release error", exc_info=True)
                    release = "-1"

                if len(year) == 0:
                    year = year.replace("", "0000")

                try:
                    pdf = soup_report.find(href=re.compile("/file/"))
                    if pdf:
                        href_p = pdf.get('href')
                        url_p = urljoin(base, href_p)
                    else:
                        url_p = ""
                except:
                    logger_err.error("get pdf error", exc_info=True)
                    url_p = ""

                #insert kaken
                try:
                    query = """SELECT report_url 
                        from kaken_report 
                        where report_url = %s
                        """
                    l_url = sql_execute(query, db_config, (download_HTML,))
                    if len(l_url) > 0:
                        query="UPDATE kaken_report SET project_id = %s, year = %s, name = %s, release = %s, pdf_url = %s, status = %s WHERE report_url = %s"
                        sql_insert(query, db_config, (ID, year, name, release, url_p, 0, download_HTML))
                        print("dufflicated report url --> ", download_HTML)
                    else:
                        query = """INSERT INTO kaken_report(project_id, year, name, report_url, release, pdf_url, status) VALUES (%s, %s, %s, %s, %s, %s, %s)"""
                        sql_insert(query, db_config, (ID, year, name, download_HTML, release, url_p, 0))
                except:
                    logger_err.error("insert kaken_report query error", exc_info=True)

                a_list = []
                b_list = []
                for row_a, row_b in zip(soup_report.find_all("th"), soup_report.find_all("td")):
                    try:
                        a = row_a.string
                        a = a.replace("/", "")
                        a = a.replace(" (", "")
                        a = a.replace(")", "")
                        a_list.append(a)
                        query = "ALTER TABLE kaken_report ADD %s text" 
                        sql_alter(query, db_config, (a, ))
             
                        b = row_b.text
                        b = b.strip()
                        b = b.replace("          ", "|")
                        b = b.replace("\xa0", "")
                        b = b.replace("\n", "")
                        b_list.append(b)
                    except:
                        logger_err.error("get paramater kaken_report error", exc_info=True)
                try:
                    para = " = %s, ".join(a_list)
                    value = tuple(b_list) + (download_HTML,)
                    query = "UPDATE kaken_report SET {} = %s WHERE report_url = %s;".format(para)
                    sql_insert(query, db_config, value)
                except:
                    logger_err.error("update kaken_report query error", exc_info=True)
                time.sleep(1)

            query = """UPDATE kaken_grants
            SET status = %s
            where  project_url = %s
            """
            try:
                sql_insert(query, db_config, (1, url))
            except:
                logger_err.error("update kaken_grants query error", exc_info=True)
                query = """UPDATE kaken_grant
                SET status = %s
                where project_url = %s
                """
                sql_insert(query, db_config, (-1, url))

            logger_info.info("end crawl url={0}".format(url))
        except:
            logger_err.error("find_reporting_pdf error", exc_info=True)
            break

#====================================================================
# 実行
#====================================================================
if __name__ == '__main__':

    config = configparser.ConfigParser()
    config.read(os.path.join(DIR_PATH, '../config.ini'))
    
    db_config = (config["DEFAULT"]["_HOSTNAME"], config["DEFAULT"]["_DATABASE"], 
        config["DEFAULT"]["_USERNAME"], config["DEFAULT"]["_PASSWORD"], config["DEFAULT"]["_PORT"])

    main(db_config=db_config)
