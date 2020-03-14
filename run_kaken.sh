#!/bin/bash
mydir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" > /dev/null && pwd )"
cd $mydir

source env/bin/activate
python3 kaken_reporting-master/find_reporting_url.py
python3 kaken_reporting-master/find_reporting_pdf.py