import os
import math
import subprocess
from operator import itemgetter
from bs4 import BeautifulSoup, NavigableString, Comment

def make_folder(folder_path) :
    if not os.path.exists(folder_path) :
        os.mkdir(folder_path)

def init_folders() :
    _pdf, _xml = "pdf", "xml"
    dir_path = os.getcwd()
    make_folder(os.path.join(dir_path, _pdf))
    make_folder(os.path.join(dir_path, _xml))

def generate_xml(pdf_name) :
    dir_path = os.getcwd()
    pdf_path = os.path.join(dir_path, "pdf", pdf_name)
    
    if os.path.exists(pdf_path) and pdf_path.endswith(".pdf") :
        # read pdf file by pdftohtml
        xml_path = os.path.join(dir_path, "xml", pdf_name.replace(".pdf", ".xml"))
        subprocess.check_output(["pdftohtml", "-i", "-c", "-hidden", "-xml", pdf_path, xml_path])
    else :
        raise Exception("PDF file not found!!!")

    return pdf_name.replace(".pdf", ".xml")

def read_xml(xml_name) :
    dir_path = os.getcwd()
    xml_path = os.path.join(dir_path, "xml", xml_name)

    if os.path.exists(xml_path) and xml_path.endswith(".xml") :
        # read xml file then converts by bs4 return soup
        with open(xml_path, "r") as xml_file:
            soup = BeautifulSoup(xml_file, "lxml")
            
            return soup
    else :
        raise Exception("XML file not found!!!")

    return None

def is_name(text) :
    for t in text.split() :
        if not t[0].isupper() :
            return False
    if len(text.split()) > 3:
        return False

    return True

def get_currency(text) :
    text = text.strip().replace(".", "")
    comma = text.find(",")
    if comma != -1 :
        text = text[: comma]

    return int(text)

def xml_to_table(xml) :
    if xml is None :
        return None
    
    table = []
    # pages
    for page in xml.find_all("page") :
        # print(str(page))
        _, _, _, page_width = get_coordinate(page)
        
        min_left = 100000000
        for _text in page.find_all("text") :
            text = str(_text.get_text()).strip()
            
            if text != "" or len(text) > 1:
                top, left, height, width = get_coordinate(_text)

                if any(x is None for x in [top, left, height, width]) :
                    print("No coordiantes...")
                    continue
                min_left = min(min_left, left)

        page_width = page_width - min_left
        # print("------- min left   --------------", min_left)
        # print("======= page width ==============", page_width)
        for _text in page.find_all("text") :
            text = str(_text.get_text()).strip()

            if len(text) == 1 :
                continue

            if text != "" :
                top, left, height, width = get_coordinate(_text)

                if any(x is None for x in [top, left, height, width]) :
                    print("No coordiantes...")
                    continue

                # TODO combine _text to cell by coordinates
                # left = left - min_left
                table.append([top, left, height, width, text])
                # print(top, left, height, width, text)

    result, tmp = [], []
    for i in  range(len(table)) :
        now = table[i]
        
        if now[1] in [212.0, 213.0, 214.0] and i < len(table) - 1 :
            if table[i + 1][1] in [436.0, 438.0] :
                result.append(tmp)
                tmp = []
        tmp.append(now)

    result.append(tmp)

    # print("--------------------------------------------")
    for res in result :
        human, project, start_date, end_date, currency, institute, desc,  fund = "", "", "","", "", "", "", 0
        for row in res :
            if row[1] in [212.0, 213.0, 214.0] and is_name(row[4]):
                human += row[4].strip() + " "
            elif row[1] in [212.0, 213.0, 214.0] :
                desc += row[4].strip() + " "
            if row[1] in [436.0, 438.0] :
                project = row[4].strip()
            
            if row[1] in [584.0, 585.0, 586.0] : 
                a = row[4].replace("- ", "").split()
                start_date = a[0].strip()
                end_date = a[1].strip()

            # if row[1] == 652.0 and row[3] == 92.0 : 
            #     start_date = row[4].replace("-", "").strip()
            # if row[1] == 652.0 and row[3] == 83.0 : 
            #     end_date = row[4].strip()

            if row[1] in [789.0, 790.0] :
                institute += row[4].strip() + " "
            # if row[1] == 992.0 :
            #     fund += get_currency(row[4])
            if row[1] in [949.0, 948.0, 947.0, 956.0, 944.0, 957.0, 958]  :
                a = row[4].split()
                # currency = row[4].strip()
                fund += get_currency(a[0])
                currency = a[1].strip()
        print(human, "\t", project, "\t", start_date, "\t",end_date, "\t",currency, "\t",institute,"\t", desc,"\t", fund )
        # print("\t".join([human, project, start_date, end_date, currency, institute, desc, fund]))
    # print(len(result))

    # index = 1
    # result, tmp = [], []
    # for row in table :
    #     text = row[4]
    #     if str(index) == str(text).strip() :
    #         index += 1
    #         if index == 23 or index == 27 or index == 166:
    #             index += 1
    #         result.append(tmp)
    #         tmp = []
    #     tmp.append(row)
    # result.append(tmp)

    # for row in result :
    #     title, p1, p2 = "", "", ""
    #     f, p = False, False
    #     for r in row :
    #         if r[1] in [50.0, 61.0, 46.0] : 
    #             title += r[4] + " "
    #         if r[1] in [240.0, 251.0, 236.0] and f == False :
    #             p1 = r[4]
    #             f = True
    #         if r[1] in [517.0, 513.0, 528.0] and p == False:
    #             p2 = r[4]
    #             p = True
    #     # print(row[0], title, p1, p2)
    #     human = p1.strip() + " " + p2.strip()
    #     print(title, "\t", human)
    # table = sorted(table, key=itemgetter(0))

    for i in range(len(table) - 1) :
        top, left, height, width, text = table[i]
        top_next, left_next, height_next, width_next, text_next = table[i + 1]
        # print(top, left, height, width, text)
        # print(top_next, left_next, height_next, width_next, text_next)
        if is_mergeble((top, left, height, width, text), (top_next, left_next, height_next, width_next, text_next)) :
            table[i + 1][4] = text + " " + table[i + 1][4]
            table[i][4] = ""

            # print("----------------------------------------")            
            # print(top, left, height, width, text)
            # print(top_next, left_next, height_next, width_next, text_next)

    # for top, left, height, width, text in table :
    #     if text == "" : continue
    #     print(top, left, height, width, text)

    answer = []
    tmp = []
    max_len = -1
    for i in range(len(table) - 1) :
        top, left, height, width, text = table[i]
        top_next, left_next, height_next, width_next, text_next = table[i + 1]
        if text == "" : continue
        tmp.append([top, left, height, width, text])
        
        print(top, left, height, width, text)
        
        if left_next < left or (left_next == left and math.fabs(top_next - top) >= 10): 
            print(str(len(tmp)), "==============================================")            
            answer.append(tmp)
            max_len = max(max_len, len(tmp))
            tmp = []

    if len(table) > 0 :
        answer.append([table[len(table) - 1]])

    # for ans in answer :
    #     # print(len(ans))
    #     if len(ans) >= max_len - 1 :
    #         # print(ans)
    #         if (len(ans) == max_len - 1) :
    #             print("", end="\t")
    #         for a in ans :
    #             print(a[4], end="\t")
    #         print("")

    # for i in range(len(answer)) :
    #     ans = answer[i]
    #     # print(len(ans))
    #     if len(ans) >= max_len - 1 :
    #         # print(ans)
    #         if (len(ans) == max_len - 1) :
    #             print("", end="\t")
    #         for a in ans :
    #             print(a[4], end="\t")
    #         if i + 1 < len(answer) and len(answer[i + 1]) == 1 :
    #             print(answer[i + 1][0][4], end="\t")
    #         print("")

    return table

def is_mergeble(first, second) :
    if math.fabs((first[1] + first[3] / 2) - (second[1] + second[3] / 2)) < 20 and math.fabs(first[0] + first[2] - second[0]) <= 10 and first[0] < second[0] :
        return True
    if first[1] == second[1] and math.fabs(first[0] + first[2] - second[0]) <= 10:
        return True

    # if first[1] == second[1] and math.fabs(first[0] + first[2] - second[0]) <= 10 and (first[1] + first[3] < width / 2 and second[1] + second[3] < width / 2 ):
    #     return True

    # if math.fabs(first[0] + first[2] - second[0]) <= 10:
    #     return True
    return False

def merge_row(first, second) :

    return first

def get_coordinate(soup) :
    try :
        top     = float(soup.get("top"))
        left    = float(soup.get("left"))
        height  = float(soup.get("height"))
        width   = float(soup.get("width"))
    except :
        return None, None, None, None

    return top, left, height, width


def get_feature(table, keyword) :
    # TODO get information from table by using keyword
    return


def format_text(text, type) :
    # TODO clean text to correct format. (date, currency etc.)
    return 