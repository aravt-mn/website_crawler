from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import Select
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.common.by import By

from PIL import Image
import pytesseract
from io import BytesIO
from time import sleep
import math
from datetime import datetime
import random
from termcolor import colored
import os
import re
import string

import configparser
# from lib.db import sql_execute, sql_insert

# from google.cloud import bigquery
import json
import psycopg2
from psycopg2 import Error

# --------------------------------------------------
# log function
# --------------------------------------------------
def logger(text):
    now = datetime.now()
    date_time = now.strftime("%m/%d/%Y, %H:%M:%S")
    if not os.path.exists("./logs") :
        os.mkdir("./logs")
    f = open("./logs/log_sciencenet.txt", "a+")
    f.write(date_time + '\t' + str(text) + '\n')
    f.close()
    return True


# --------------------------------------------------
# main
# --------------------------------------------------
if __name__ == '__main__':
    DIR_PATH = os.path.dirname(os.path.abspath(__file__))
    config = configparser.ConfigParser()
    config.read(os.path.join(DIR_PATH, '../config.ini'))
    db_config = (config["DEFAULT"]["_HOSTNAME"], config["DEFAULT"]["_DATABASE"], 
        config["DEFAULT"]["_USERNAME"], config["DEFAULT"]["_PASSWORD"], config["DEFAULT"]["_PORT"])

    # --------------------------------------------------
    try:
        connection = psycopg2.connect(user = config["DEFAULT"]["_USERNAME"],
                                    password = config["DEFAULT"]["_PASSWORD"],
                                    host = config["DEFAULT"]["_HOSTNAME"],
                                    port = config["DEFAULT"]["_PORT"],
                                    database = config["DEFAULT"]["_DATABASE"])

        cursor = connection.cursor()
        browser = config["DEFAULT"]["_BROWSER"]
# --------------------------------------------------
        # start process
        # --------------------------------------------------
        start = datetime.now()
        print('STARTED AT: ' + start.strftime("%m/%d/%Y, %H:%M:%S"))
        logger('CRAWLING START!')

        # --------------------------------------------------
        # launch browser
        # --------------------------------------------------
        options = Options()
        options.binary_location = browser
        # '/usr/bin/google-chrome'
        options.add_argument('--headless')
        options.add_argument('--window-size=1280,1024')

        browser = webdriver.Chrome('chromedriver', chrome_options=options)

        # --------------------------------------------------
        # master data
        # --------------------------------------------------
        url = "http://fund.sciencenet.cn/"
        sub_url = "http://fund.sciencenet.cn/project/"

        # --------------------------------------------------
        # bigquery connection
        # --------------------------------------------------
        # credentials_json = '/home/bayasaa/grant/tmp/da-astamuse.json'
        # os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = credentials_json
        # # set project, dataset, table
        # my_project = "da-astamuse-236702"
        # my_dataset = "0924_grant_nsfc"
        # my_table1 = "sciencenet_result_sample"
        # my_table2 = "sciencenet_report_sample"
        
        # bigquery_client = bigquery.Client(project = my_project)
        # dataset_ref = bigquery_client.dataset(my_dataset)
        # table_ref1 = dataset_ref.table(my_table1)
        # table1 = bigquery_client.get_table(table_ref1)
        # table_ref2 = dataset_ref.table(my_table2)
        # table2 = bigquery_client.get_table(table_ref2)

        # --------------------------------------------------
        # main loop
        # --------------------------------------------------
        server_id = 1
        # start_id = server_id*17000 - 16999
        
        maxid_query = """
            select max(project_url_id) project_url_id from grant_sites_crawled_info gsci where grant_sites_id = 128;
        """
        cursor.execute(maxid_query)
        record = cursor.fetchone()
        server_id = record[0] or 1

        start_id = server_id
        start_id = 1 if start_id - 17000 < 1 else start_id - 17000

        page_id = start_id

        sleep_time = 15
        while page_id < start_id + 34000:

            # --------------------------------------------------
            # start crawling
            # --------------------------------------------------
            try:

                # --------------------------------------------------
                # launch browser
                # --------------------------------------------------
                browser.get(sub_url + str(page_id))
                WebDriverWait(browser, 16).until(EC.presence_of_all_elements_located)

                v_ws = list()  # list for project table element
                v_wst = list()  # list for result table element

                if browser.find_elements_by_tag_name("h1"):
                    title = browser.find_elements_by_tag_name("h1")[0].text
                    print(title)

                    v_ws.append(page_id)
                    v_ws.append(title)

                    # テーブル1内容取得
                    tableElem = browser.find_element_by_xpath('//*[@id="v_nsfc"]/div/table')
                    trs = tableElem.find_elements(By.TAG_NAME, "tr")

                    # テーブル1内テキスト書き込み
                    for i in range(0, len(trs)):
                        tds = trs[i].find_elements(By.TAG_NAME, "td")
                        for j in range(0, len(tds)):
                            v_ws.extend(x.strip() for x in re.split(r'\s至\s', tds[j].text))

                    # テーブル2内容取得
                    tableElem = browser.find_element_by_xpath('//*[@id="t3"]/table[1]')
                    trs = tableElem.find_elements(By.TAG_NAME, "tr")

                    # テーブル2内テキスト書き込み
                    for i in range(0, len(trs)):
                        tds = trs[i].find_elements(By.TAG_NAME, "td")
                        for j in range(0, len(tds)):
                            v_ws.append(tds[j].text)

                    v_ws.append(sub_url + str(page_id))  # リンクを書き込み

                    json_rows = []

                    if len(v_ws) == 17:
                        # print('a')
                        project_url_id = int(v_ws[0])  or 'NULL'
                        subject = v_ws[1]  or 'NULL'
                        project_number = v_ws[2]  or 'NULL'
                        category = v_ws[3]  or 'NULL'
                        project_manager = v_ws[4]  or 'NULL'
                        position = v_ws[5]  or 'NULL'
                        organization = v_ws[6]  or 'NULL'
                        fund1 = v_ws[7]  or 'NULL'
                        fund = re.findall(r'\d+.\d+', fund1)[0]
                        try:
                            fund = str(float(fund) * 10000)
                        except ValueError:
                            fund = 'NULL'
                        project_category = v_ws[8]  or 'NULL'
                        start_year = v_ws[9][:4]  or 'NULL'
                        start_date = v_ws[9]  or 'NULL'
                        end_year = v_ws[10][:4]  or 'NULL'
                        end_date = v_ws[10]  or 'NULL'
                        date_st = datetime.strptime(start_date, '%Y 年 %m 月 %d 日')
                        date_ed = datetime.strptime(end_date, '%Y 年 %m 月 %d 日')
                        term_dt = date_ed.date() - date_st.date()
                        term_year = term_dt.days//(365.25)
                        term_month = (term_dt.days-term_year*365.25)//(365.25/12)
                        term_day = ((term_dt.days-term_year*365.25) - term_month*(365.25/12))
                        term = str(int(term_year)) + ' years ' + str(int(term_month)) + ' mons ' + str(int(math.ceil(term_day))) + ' days'
                        chinese_headings = v_ws[11] or 'NULL'
                        english_headings = v_ws[12] or 'NULL'
                        chinese_summary = v_ws[13] or 'NULL'
                        english_summary = v_ws[14] or 'NULL'
                        research_summary = v_ws[15]  or 'NULL'
                        project_url = v_ws[16]  or 'NULL'
                        date_crt = datetime.strftime(datetime.now(), '%Y-%m-%d %H:%M:%S')
                        # print('b')
                        json_rows.append({
                            'id': int(v_ws[0]),
                            'subject': v_ws[1],
                            'project_number': v_ws[2],
                            'category': v_ws[3],
                            'project_manager': v_ws[4],
                            'position': v_ws[5],
                            'organization': v_ws[6],
                            'fund': v_ws[7],
                            'project_category': v_ws[8],
                            'start_year': v_ws[9][:4],
                            'start_date': v_ws[9],
                            'end_year': v_ws[10][:4],
                            'end_date': v_ws[10],
                            'chinese_headings': v_ws[11],
                            'english_headings': v_ws[12],
                            'chinese_summary': v_ws[13],
                            'english_summary': v_ws[14],
                            'research_summary': v_ws[15],
                            'project_url': v_ws[16]
                            })

                        # print('term')
                        # print(date_crt)

                        # query = """
                        # insert into public.sciencenet_result_sample (
                        #     project_url_id,
                        #     subject,
                        #     project_number,
                        #     category,
                        #     project_manager,
                        #     position,
                        #     organization,
                        #     fund,
                        #     project_category,
                        #     start_year,
                        #     start_date,
                        #     end_year,
                        #     end_date,
                        #     chinese_headings,
                        #     english_headings,
                        #     chinese_summary,
                        #     english_summary,
                        #     research_summary,
                        #     project_url
                        # ) values (
                        #     {id},
                        #     '{subject}',
                        #     '{project_number}',
                        #     '{category}',
                        #     '{project_manager}',
                        #     '{position}',
                        #     '{organization}',
                        #     '{fund}',
                        #     '{project_category}',
                        #     '{start_year}',
                        #     '{start_date}',
                        #     '{end_year}',
                        #     '{end_date}',
                        #     '{chinese_headings}',
                        #     '{english_headings}',
                        #     '{chinese_summary}',
                        #     '{english_summary}',
                        #     '{research_summary}',
                        #     '{project_url}'
                        # )
                        # """.format(
                        #     id = id,
                        #     subject = subject,
                        #     project_number = project_number,
                        #     category = category,
                        #     project_manager = project_manager,
                        #     position = position,
                        #     organization = organization,
                        #     fund = fund,
                        #     project_category = project_category,
                        #     start_year = start_year,
                        #     start_date = start_date,
                        #     end_year = end_year,
                        #     end_date = end_date,
                        #     chinese_headings = chinese_headings,
                        #     english_headings = english_headings,
                        #     chinese_summary = chinese_summary,
                        #     english_summary = english_summary,
                        #     research_summary = research_summary,
                        #     project_url = project_url
                        # )
                        check_qry = """SELECT project_id FROM grant_crawled_new WHERE grant_sites_id = 128 and project_id = '{project_number}'""".format(project_number = project_number)
                        cursor.execute(check_qry)
                        check_res = cursor.fetchone()
                        
                        if check_res is None :
                            query = """
                            insert into public.grant_crawled_new (
                                grant_sites_id,
                                project_id,
                                project_id_original,
                                title,
                                title_en,
                                project_url,
                                keyword,
                                keyword_en,
                                "source",
                                researcher,
                                researcher_en,
                                institution,
                                country,
                                currency,
                                award_amount,
                                award_amount_usd,
                                funded_date,
                                start_date,
                                end_date,
                                project_term,
                                start_year,
                                end_year,
                                description,
                                description_raw,
                                description_en,
                                created_date,
                                updated_date,
                                crawled_date,
                                project_url_id,
                                "position"
                            ) values (
                                128,
                                %s,
                                %s,
                                %s,
                                NULL,
                                %s,
                                %s,
                                %s,
                                'Sciencenet',
                                %s,
                                NULL,
                                %s,
                                'CH',
                                'CNY',
                                %s,
                                NULL,
                                NULL,
                                %s,
                                %s,
                                %s,
                                %s,
                                %s,
                                NULL,
                                %s,
                                %s,
                                %s,
                                NULL,
                                %s,
                                %s,
                                %s
                            );
                            """
                            params = (
                                project_number,
                                project_number,
                                subject,
                                project_url,
                                "; ".join([category, project_category, chinese_headings]),
                                english_headings,
                                project_manager,
                                organization,
                                fund,
                                date_st,
                                date_ed,
                                term,
                                start_year,
                                end_year,
                                "; ".join([chinese_summary, research_summary]),
                                english_summary,
                                date_crt,
                                date_crt,
                                project_url_id,
                                position
                            )
                            # print (data)
                            cursor.execute(query, params)
                            connection.commit()
                        
                        #-------------------
                        # print('d')
                        # print(query)
                        
                    # if json_rows != []:
                        # print(json_rows)

                        # query="INSERT INTO kaken_grants(project_url, status) VALUES (%s, %s)"
                        # sql_insert(query, db_config, (url_g, 0))
                        # insert_json_result = bigquery_client.insert_rows_json(table1, json_rows)

                    # テーブル3内容取得
                    tableElem = browser.find_element_by_xpath('//*[@id="t3"]/table[2]')
                    trs = tableElem.find_elements(By.TAG_NAME, "tr")
                    # print('test1')
                    # print (trs)
                    if len(trs) > 1:
                        # テーブル3内テキスト書き込み
                        json_reports = []
                        for i in range(1, len(trs)):
                            tds = trs[i].find_elements(By.TAG_NAME, "td")
                            # print('test2 td')
                            # print(page_id)
                            # print(tds)
                            if len(tds) == 4:
                                project_id = page_id or 'NULL'
                                report_number = tds[0].text or 'NULL'
                                title = tds[1].text or 'NULL'
                                type = tds[2].text or 'NULL'
                                author = tds[3].text or 'NULL'
                                # print('test3')
                                json_reports.append({
                                    'project_id': page_id,
                                    'serial_number': tds[0].text,
                                    'title': tds[1].text,
                                    'type': tds[2].text,
                                    'author': tds[3].text
                                    })
                                check_qry = """SELECT project_id FROM public.sciencenet_report 
                                                WHERE project_id = %s and title = %s 
                                                """
                                cursor.execute(check_qry, (project_id, title) )
                                check_res = cursor.fetchone()

                                if check_res is None :
                                    report_qry = """
                                    insert into public.sciencenet_report (
                                        project_id,
                                        report_number,
                                        title,
                                        type,
                                        author
                                    ) values (
                                        %s,%s,%s,%s,%s
                                    )
                                    """
                                    params = (
                                        project_id,
                                        report_number,
                                        title,
                                        type,
                                        author
                                    )
                                    cursor.execute(report_qry, params)
                                    connection.commit()
                                # print(report_qry)

                        # print(json_reports)
                        # if json_reports != []:
                        #     print(json_reports)
                            # insert_json_result = bigquery_client.insert_rows_json(table2, json_reports)

                    logger(str(page_id) + '\t' + str(len(trs) - 1) + '\t' + title)
                    page_id = page_id + 1

                else:
                    body_text = browser.find_element_by_id('wrapper_body').text
                    print(colored(body_text, 'red') + colored(str(sleep_time), 'blue'))
                
                sleep(sleep_time)

            # --------------------------------------------------
            # error handling
            # --------------------------------------------------
            except Exception as e:
                print(e)
                logger(e)
                page_id = page_id + 1
                pass

        # --------------------------------------------------
        # end process
        # --------------------------------------------------
        browser.quit()
        ended = datetime.now()
        finish = ended - start
        print('FINISHED AT: ' + ended.strftime("%m/%d/%Y, %H:%M:%S"))
        print('Duration: ' + str(finish))
        logger('CRAWLING END!\t' + str(finish))
        
        # print("Table created successfully in PostgreSQL ")

    except (Exception, psycopg2.DatabaseError) as error :
        print ("DB error", error)
    finally:
        #closing database connection.
        if(connection):
            cursor.close()
            connection.close()
            print("PostgreSQL connection is closed")
    # --------------------------------------------------