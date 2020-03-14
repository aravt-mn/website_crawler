#!/bin/bash
mydir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" > /dev/null && pwd )"
cd $mydir

source env/bin/activate
python3 grant_crawling-master/crawler_sciencenet.py

node comparison.js