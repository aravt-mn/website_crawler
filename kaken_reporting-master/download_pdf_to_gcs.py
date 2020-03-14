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
from google.cloud import storage

#log
from lib.write_log import write_error_log
import logging

from lib.db import sql_execute, sql_insert, sql_alter


DIR_PATH = os.path.dirname(os.path.abspath(__file__))
PDF_STORAGE = DIR_PATH + "/pdf/"

def main(db_config, bucket, base="https://kaken.nii.ac.jp"):
    write_error_log(DIR_PATH + "/log/download_pdf_to_gcs_error.log","error log", _mode="a")
    write_error_log(DIR_PATH + "/log/download_pdf_to_gcs_info.log","info log", _mode="a")
    logger_err = logging.getLogger("error log")
    logger_info = logging.getLogger("info log")

    while True:
        try:
            query = """SELECT project_id, pdf_url
            from kaken_reports
            where status = 0
            limit 1
            """
            try:
                result = sql_execute(query, db_config)
            except:
                logger_err.error("select project_id and pdf_url query error", exc_info=True)
            if len(result) == 0:
                logger_info.info("all pdf downloaded")
                time.sleep(10)
                continue

            project_id = result[0][0]
            pdf_url = result[0][1]
            if not pdf_url:
                query = """UPDATE kaken_reports
                SET status = %s
                where pdf_url = %s
                """
                sql_insert(query, db_config, (1, pdf_url))
                continue

            logger_info.info("start crawl url={0}".format(pdf_url))

            query = """UPDATE kaken_reports
            SET status = %s
            where pdf_url = %s
            """
            try:
                sql_insert(query, db_config, (2, pdf_url))
            except:
                logger_err.error("update kaken_reports status query error", exc_info=True)
                query = """UPDATE kaken_reports
                SET status = %s
                where pdf_url = %s
                """
                sql_insert(query, db_config, (-1, pdf_url))

            pdf_url_split = pdf_url.split("/")[-1]
            path = PDF_STORAGE + pdf_url_split
            try:
                logger_info.info("download pdf url={0}".format(pdf_url))
                urllib.request.urlretrieve(pdf_url, path)
            except:
                logger_err.error("pdf download error", exc_info=True)
                query = """UPDATE kaken_reports
                SET status = %s
                where pdf_url = %s
                """
                sql_insert(query, db_config, (-1, pdf_url))

            gcs_path = "kaken_reports_pdf/{0}/{1}".format(project_id, pdf_url_split)

            try:
                logger_info.info("upload pdf url={0}".format(pdf_url))
                blob = bucket.blob(gcs_path)
                blob.upload_from_filename(path)
            except:
                logger_err.error("pdf upload error", exc_info=True)
                query = """UPDATE kaken_reports
                SET status = %s
                where pdf_url = %s
                """
                sql_insert(query, db_config, (-1, pdf_url))
            # try:
            #     os.system("rm {0}".format(path))
            # except:
            #     logger_err.error("pdf remove error", exc_info=True)

            query = """UPDATE kaken_reports
            set pdf_path = %s,
            status = %s
            where pdf_url = %s
            """
            try:
                sql_insert(query, db_config, (gcs_path, 1, pdf_url))
            except:
                logger_err.error("update kaken_reports error", exc_info=True)
            time.sleep(1)

            logger_info.info("end crawl url={0}".format(pdf_url))
            #break
        except:
            logger_err.error("download_pdf_to_gcs error", exc_info=True)
            break


#====================================================================
# 実行
#====================================================================
if __name__ == '__main__':
    config = configparser.ConfigParser()
    config.read(DIR_PATH + '/config.ini')
    # _HOSTNAME = config["DEFAULT"]["_HOSTNAME"]
    # _DATABASE = config["DEFAULT"]["_DATABASE"]
    # _USERNAME = config["DEFAULT"]["_USERNAME"]
    # _PASSWORD =config["DEFAULT"]["_PASSWORD"]
    # _PORT = config["DEFAULT"]["_PORT"]
    db_config = (config["DEFAULT"]["_HOSTNAME"], config["DEFAULT"]["_DATABASE"], 
        config["DEFAULT"]["_USERNAME"], config["DEFAULT"]["_PASSWORD"], config["DEFAULT"]["_PORT"])

    storage_client = storage.Client.from_service_account_json(config["DEFAULT"]["_CREDENTIAL"])
    # storage_client = storage.Client()
    bucket_name = config["DEFAULT"]["_BUCKET_NAME"]
    bucket = storage_client.bucket(bucket_name)


    main(db_config=db_config, bucket=bucket)