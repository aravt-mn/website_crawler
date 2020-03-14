import psycopg2
import os

def sql_execute(sql_cmd, db_config, params=""):
    _HOSTNAME, _DATABASE, _USERNAME, _PASSWORD, _PORT = db_config

    conn = psycopg2.connect(host=_HOSTNAME, user=_USERNAME,
                            password=_PASSWORD, database=_DATABASE, port=_PORT)
    cursor = conn.cursor()

    try:
        cursor.execute(sql_cmd, params)
        conn.commit()
        if (sql_cmd.startswith(('CREATE', 'SELECT', 'SHOW'))):
            return cursor.fetchall()
    except Exception as err:
        conn.rollback()
        print(err)
    finally:
        conn.close()


def sql_insert(sql_cmd, db_config, params=""):
    _HOSTNAME, _DATABASE, _USERNAME, _PASSWORD, _PORT = db_config
    conn = psycopg2.connect(host=_HOSTNAME, user=_USERNAME,
                            password=_PASSWORD, database=_DATABASE, port=_PORT)
    cursor = conn.cursor()

    try:
        cursor.execute(sql_cmd, params)
        conn.commit()
    except Exception as err:
        conn.rollback()
        print(err)
    if not (sql_cmd.startswith(('INSERT', 'UPDATE', 'DELETE'))):
        raise psycopg2.Error('Query error! It must be insert or update query.')
    last_row_id = cursor.lastrowid

    conn.close()

    return last_row_id


def sql_insert_many(sql_cmd, db_config, params):
    _HOSTNAME, _DATABASE, _USERNAME, _PASSWORD, _PORT = db_config
    conn = psycopg2.connect(host=_HOSTNAME, user=_USERNAME,
                            password=_PASSWORD, database=_DATABASE, port=_PORT)
    cursor = conn.cursor()

    try:
        cursor.executemany(sql_cmd, params)
        conn.commit()
    except Exception as err:
        conn.rollback()
        print(err)
    if not (sql_cmd.startswith(('INSERT', 'UPDATE'))):
        raise psycopg2.Error('Query error! It must be insert or update query.')
    last_row_id = cursor.lastrowid

    conn.close()

    return last_row_id


def sql_insert_return_id(sql_cmd, db_config, params):
    _HOSTNAME, _DATABASE, _USERNAME, _PASSWORD, _PORT = db_config
    conn = psycopg2.connect(host=_HOSTNAME, user=_USERNAME,
                            password=_PASSWORD, database=_DATABASE, port=_PORT)
    cursor = conn.cursor()

    try:
        cursor.execute(sql_cmd, params)
        conn.commit()
    except Exception as err:
        conn.rollback()
        print(err)
    if not (sql_cmd.startswith(('INSERT', 'UPDATE'))):
        raise psycopg2.Error('Query error! It must be insert or update query.')
    last_row_id = cursor.fetchone()[0]

    conn.close()

    return last_row_id
