import os
import csv
import configparser
from datetime import datetime
from lib.db import sql_execute, sql_insert

CSV = [{"csv" : "25_dst_gov_in.csv", "id" : 25}, {"csv" : "47_fwo_be.csv", "id" : 47}, {"csv" : "97_conacyt_gob_mx.csv", "id" : 97}, {"csv" : "grant_site_52_output.csv", "id" : 52}]

db_config = ()
encode_prob = {"√Ä" : "À", "√Å" : "Á", "√Ç" : "Â", "√É" : "Ã", "√Ñ" : "Ä", "√Ö" : "Å", "√Ü" : "Æ", "√á" : "Ç", "√à" : "È", "√â" : "É", "√ä" : "Ê", "√ã" : "Ë", "√å" : "Ì", "√ç" : "Í", "√é" : "Î", "√è" : "Ï", "√ê" : "Ð", "√ë" : "Ñ", "√í" : "Ò", "√ì" : "Ó", "√î" : "Ô", "√ï" : "Õ", "√ñ" : "Ö", "√ó" : "×", "√ò" : "Ø", "√ô" : "Ù", "√ö" : "Ú", "√õ" : "Û", "√ú" : "Ü", "√ù" : "Ý", "√û" : "Þ", "√ü" : "ß", "√†" : "à", "√°" : "á", "√¢" : "â", "√£" : "ã", "√§" : "ä", "√•" : "å", "√¶" : "æ", "√ß" : "ç", "√®" : "è", "√©" : "é", "√™" : "ê", "√´" : "ë", "√¨" : "ì", "√≠" : "í", "√Æ" : "î", "√Ø" : "ï", "√∞" : "ð", "√±" : "ñ", "√≤" : "ò", "√≥" : "ó", "√¥" : "ô", "√µ" : "õ", "√∂" : "ö", "√∑" : "÷", "√∏" : "ø", "√π" : "ù", "√∫" : "ú", "√ª" : "û", "√º" : "ü", "√Ω" : "ý", "√æþ" : "þ", "√ø" : "ÿ"}

def csv_reader(row) :
    filename = row["csv"]
    idx = row["id"]
    dir_path = os.getcwd()
    csv_path = os.path.join(dir_path, "csv", filename)

    with open(csv_path, "r") as csv_file :
        reader = csv.DictReader(csv_file)

        sql = """DELETE FROM grant_crawled_new WHERE grant_sites_id = %s"""
        sql_execute(sql, db_config, [idx])

        sql = """INSERT into grant_crawled_new
                    (
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
                        updated_date
                    ) values(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,now(),now() )"""

        index = 1
        check = {}
        for row in reader :
            try :
                a = check[str(row)]
                continue
            except KeyError :
                check[str(row)] = 1
            
            print(index)
            index += 1

            features  = {"project_id" : None, "project_id_original" : None, "title" : None, "title_en" : None, "project_url" : None, "keyword" : None, "keyword_en" : None, "source" : None, "researcher" : None, "researcher_en" : None, "institutation" : None, "country" : None, "currency" : None, "award_amount" : None, "award_amount_usd" : None, "funded_date" : None, "start_date" : None, "end_date" : None, "project_term" : None, "start_year" : None, "end_year" : None, "description" : None, "description_raw" : None, "description_en" : None}
            
            for key, value in row.items() :
                if key in ["created_date", "updated_date"] :
                    continue
                value = value.strip()
                if value == "" :
                    continue
                
                for k, v in encode_prob.items() :
                    while (True) :
                        if value.find(k) == -1 :
                            break
                        value = value.replace(k, v)

                if key in ["start_date", "end_date", "funded_date"] :
                    try :
                        features[key] = datetime.strptime(value, '%d/%m/%Y')
                    except ValueError : 
                        try :
                            features[key] = datetime.strptime(value, '%d/%m/%y')
                        except ValueError:
                            try :
                                features[key] = datetime.strptime(value, '%m/%d/%y')
                            except ValueError :
                                try :
                                    features[key] = datetime.strptime(value, '%m/%d/%Y')
                                except ValueError :
                                    pass
                            except :
                                pass
                        except :
                            pass
                    except :
                        pass
                    continue
                features[key.replace("\ufeff", "")] = value

            result = []
            result.append(idx)
            for key, value in features.items() :
                result.append(value)
            sql_insert(sql, db_config, result)


if __name__ == "__main__":
    config = configparser.ConfigParser()

    config.read('config.ini')
        
    db_config = (config["DEFAULT"]["_HOSTNAME"], config["DEFAULT"]["_DATABASE"], config["DEFAULT"]["_USERNAME"], \
    config["DEFAULT"]["_PASSWORD"], config["DEFAULT"]["_PORT"])

    for row in CSV :
        csv_reader(row)

    # csv_reader(CSV[3])
