import os
import requests
import urllib.error
from bs4 import BeautifulSoup
from urllib.request import urlopen
from urllib.parse import urlparse, urljoin

# TODO download all pdfs from input url and store them to pdf folder 

urls = [
"http://www.dst.gov.in/whatsnew/prize-awards",
"https://www.fwo.be/en/news/results/research-projects-and-research-grants/page/1", 
"https://www.fwo.be/en/news/results/research-projects-and-research-grants/page/2"
]

HASH_URL = {
    "www.dst.gov.in" : "views-field views-field-title",
    "www.fwo.be" : "subitem clearfix" 
}

def get_html(url) :
    r = requests.get(url)
    html = r.content
    soup = BeautifulSoup(html, "lxml")
    return soup

def pdf_download(url) :
    pdf = requests.get(url, stream=True)
    parsed = urlparse(url)
    
    pdf_name = url.split("/")[-1]
    dir_path = os.getcwd()
    pdf_path = os.path.join(dir_path, "pdf", str(pdf_name))
    
    if not os.path.exists(pdf_path) :
        print(pdf_name)
        with open(pdf_path, "wb") as pdf_file :
            for row in pdf.iter_content(chunk_size=2000) :
                pdf_file.write(row)
    
    return parsed.netloc

def get_pdf_links(soup) :
    result = []
    for a in soup.find_all("a", href=True) :
        if a :
            if a["href"].endswith(".pdf") :
                result.append(a["href"]) 
    return result

def get_links(url) :
    soup = get_html(url)
    CLASS_ = HASH_URL[urlparse(url).netloc]

    links = soup.find_all(class_=CLASS_)
    result = []
    for link in links :
        a = link.find("a", href=True)
        if a :
            full_link = urljoin(url, a["href"])
            result.append(full_link)
            # print(full_link)
            
    return result

def download_all() :
    for url in urls :
        links = get_links(url)

        for link in links :
            soup = get_html(link)
            pdf_links = get_pdf_links(soup)
            if pdf_links :
                for plink in pdf_links :
                    full_pdf_link = urljoin(link, plink)
                    print(full_pdf_link)
                    pdf_download(full_pdf_link)
                print("----------------------------------------------------------------------")
        print("----------------------------------------------------------------------")
    return

# if __name__ == "__main__":
#     download_all()
    # for url in urls :
    #     get_links(url)
    #     print("----------------------------------------------------------------------")
    # print(get_html(urls[0]))