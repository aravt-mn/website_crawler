# Kaken_Reporting
## 環境
- ubuntu18.04
- python3.6

## 導入手順
python3.6のインストール
```bash
sudo apt install -y python3-pip
sudo pip3 install virtualenv
virtualenv -p python3.6 env
source env/bin/activate
```

必要ライブラリのインストール
```bash
sudo apt install -y libpq-dev
pip install -r requirement.txt
```
config.iniの設定
```
[DEFAULT]
_HOSTNAME = *******
_DATABASE = *******
_USERNAME = *******
_PASSWORD = *******
_PORT = *******
_BUCKET_NAME =*******
```
