import os
import sys
import csv
csv.field_size_limit(sys.maxsize)

def read_csv(file_path, field=[]) :
    datas = []
    with open(file_path, "r") as csv_file :
        reader = csv.DictReader(csv_file)
        for row in reader :
            if field == [] :
                datas.append(row)
            else :
                tmp = {}
                for column in field :
                    tmp[column] = row[column]
                datas.append(tmp)
    return datas

def read_tsv(file_path, field=[]) :
    datas = []
    with open(file_path, "r") as tsvfile:
        reader = csv.DictReader(tsvfile, dialect='excel-tab')
        for row in reader :
            datas.append(row)
            
    return datas

def write_to_csv(output_path, output_datas, field=[]) :
    if field == [] :
        raise Exception("Need list of field names!")
    with open(output_path, "w") as csv_file :
        writer = csv.DictWriter(csv_file, fieldnames=field)
        writer.writeheader()

        writer.writerows(output_datas)

def check_text(text) :
    if text is None :
        return True
    text = text.strip()
    if text in ["", "-1", "-2"] :
        return True
    return False

def append_to_csv(output_path, row, field=[]) :
    if field == [] :
        raise Exception("Need list of field names!")
    with open(output_path, "a") as csv_file :
        writer = csv.DictWriter(csv_file, fieldnames=field)
        writer.writerow(row)

def write_csv_head(output_path, field=[]) :
    if field == [] :
        raise Exception("Need list of field names!")
    with open(output_path, "w") as csv_file :
        writer = csv.DictWriter(csv_file, fieldnames=field)
        writer.writeheader()