### Setup

- install brew and python3.6

Install pdf parser tools
- mac
```sh
brew install poppler
pip install request
```

- ubuntu
```sh
sudo apt-get install -y poppler-utils
```

```sh
pip install beautifulsoup4==4.6.3
pip install bs4==0.0.1
pip install lxml
```

- If you need to have nss first in your PATH run:
```sh
  echo 'export PATH="/usr/local/opt/nss/bin:$PATH"' >> ~/.bash_profile
```

For compilers to find nss you may need to set:
```sh
  export LDFLAGS="-L/usr/local/opt/nss/lib"
  export CPPFLAGS="-I/usr/local/opt/nss/include"
```

For pkg-config to find nss you may need to set:
```sh
  export PKG_CONFIG_PATH="/usr/local/opt/nss/lib/pkgconfig"
```

Database config. Create "config.ini" file. 
```sh
[DEFAULT]
_HOSTNAME = 127.0.0.1
_DATABASE = grant_sites
_USERNAME = postgres
_PASSWORD = db pass
_PORT = 5432
```

### How to run

- Download all pdf files.
```sh
cd pdf_parser
python main.py -d true
```

- Parse single pdf.
```sh
cd pdf_parser
python main.py -d false -p pdf_name.pdf
```

In "csv" folder, there is clean results of all pdf that parsed by manual and script.
- To import csvs to Production database 
```sh
cd pdf_parser
python import_csv.py
```


echo "starting crawler on sites"

node crawl.js sites 15
node crawl.js sites 25
node crawl.js sites 27
node crawl.js sites 34
node crawl.js sites 39
node crawl.js sites 43
node crawl.js sites 45
node crawl.js sites 46
node crawl.js sites 47
node crawl.js sites 49
node crawl.js sites 52
node crawl.js sites 53
node crawl.js sites 68
node crawl.js sites 69
node crawl.js sites 73
node crawl.js sites 77
node crawl.js sites 78
node crawl.js sites 83
node crawl.js sites 84
node crawl.js sites 85
node crawl.js sites 97
node crawl.js sites 100
node crawl.js sites 101
# echo "crawler on sites ended"
# cd grant_crawling-master
# echo "starting sciencenet crawler"
# python crawler_sciencenet.py
# echo "sciencenet crawler ended"
# cd ..
# cd kaken_reporting-master
# echo "starting kaken report crawler"
# echo "finding reporting url"
# python find_reporting_url.py 1990 2019
# echo "finding reporting pdf"
# python find_reporting_pdf.py 
# echo "downloading pdf"
# python download_pdf_to_gcs.py
# echo "kaken reporting crawler ended"