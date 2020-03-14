import os
import re
import sys
import time
import getopt
import configparser
from multiprocessing import Pool, cpu_count

from lib.xml_parser import generate_xml, read_xml, init_folders, xml_to_table
from lib.pdf_downloader import download_all

if __name__ == "__main__":
    try:
        opts, _ = getopt.getopt(sys.argv[1:], "p:d:", ["p=","d="])

    except getopt.GetoptError:
        sys.exit(2)
    
    pdf_name = "test2.pdf"
    download = "true"

    if opts:
        for opt, arg in opts:
            if opt in ("-p", "--pdf"):
                pdf_name = str(arg)
            elif opt in ("-d", "--download") :
                download = str(arg)

    config = configparser.ConfigParser()
    
    config.read('config.ini')
        
    db_config = (config["DEFAULT"]["_HOSTNAME"], config["DEFAULT"]["_DATABASE"], config["DEFAULT"]["_USERNAME"], \
    config["DEFAULT"]["_PASSWORD"], config["DEFAULT"]["_PORT"])
    
    init_folders()

    if download == "true" :
        download_all()

    xml_name = generate_xml(pdf_name)

    soup = read_xml(xml_name)

    xml_to_table(soup)

