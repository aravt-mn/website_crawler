#!/bin/bash
mydir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" > /dev/null && pwd )"
cd $mydir
node crawl.js continue