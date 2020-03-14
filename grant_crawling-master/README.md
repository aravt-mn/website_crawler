-- run commands
touch log_snfc.txt
> log_snfc.txt
screen -S nsfc
python3 crawler_nsfc.py
touch log_sciencenet.txt		
> log_sciencenet.txt
screen -S nsfc
python3 crawler_sciencenet.py