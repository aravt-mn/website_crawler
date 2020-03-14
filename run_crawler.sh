#!/bin/bash
mydir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" > /dev/null && pwd )"
cd $mydir

node update_param.js
echo "starting crawler on sites"
node crawl.js
echo "crawler on sites ended"

node comparison.js
