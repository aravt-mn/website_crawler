# Grant Crawler Batch System

This is Grant crawler's batch system

## Installation

Use the python package manager [pip](https://pip.pypa.io/en/stable/) and node package manager [npm](https://www.npmjs.com/) to install 


### Prepare python environment
```sh
cd grant
virtualenv -p python3.6 env
source env/bin/activate
pip install -r requirement.txt
```

### Prepare javascript environment
```sh
cd grant
npm install
```

## Configuration

### Database
Create database with name "grant_sites"
Run SQL queries to import database scheme and grant configs.


```sh
cd create_sql

create_full_table.sql
grant_sites.sql
grant_sites_query.sql
grant_sites_query_parse_config.sql
grant_sites_query_param.sql
```


### Database config for Javascript
Create file with name ".env" for javascript codes
```sh
cd grant
touch .env
```

Open .env file and copy below config
```sh
PGHOST='104.155.226.158'
PGUSER='postgres'
PGDATABASE='grant_sites'
PGPASSWORD='*******'
PGPORT=5432
MAX_TAB_COUNT=5
```

### Database config for Python 
Create file with name "config.ini" for python codes
```sh
cd grant
touch config.ini
```

Open config.ini file and copy below config
```sh
[DEFAULT]
_HOSTNAME = 104.155.226.158
_DATABASE = grant_sites
_USERNAME = postgres
_PASSWORD = *******
_PORT = 5432
_BROWSER = /usr/bin/chromium-browser
```

## To start crawler

### Grant sites 
```sh
source run_crawler.sh
```

### Kaken sites
```sh
source run_kaken.sh
```

### Sciencenet sites 
```sh
source run_sciencenet.sh
```