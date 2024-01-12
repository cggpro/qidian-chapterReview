import pandas as pd

# 读取Excel文件
data = pd.read_excel("books_reviews.xlsx", header=None)
data.columns = ['BookID', 'BookName', 'ZS', 'ZW']

# 确保ZS和ZW列是整数类型
data['ZS'] = pd.to_numeric(data['ZS'], errors='coerce').fillna(0).astype(int)
data['ZW'] = pd.to_numeric(data['ZW'], errors='coerce').fillna(0).astype(int)

# ZS评分函数
def score_zs(zs):
    return zs // 100

# ZW评分函数，ZW单位是万字
def score_zw(zw):
    if zw < 100:
        return 1
    elif zw < 200:
        return 3
    elif zw < 300:
        return 4
    elif zw < 400:
        return 5
    elif zw < 500:
        return 6
    elif zw < 600:
        return 7
    elif zw < 700:
        return 8
    elif zw < 800:
        return 9
    elif zw < 900:
        return 10
    elif zw < 1000:
        return 11
    elif zw < 2000:
        return 12
    elif zw < 3000:
        return 13
    else:
        return 0

# 计算分数
data['ZS_score'] = data['ZS'].apply(score_zs)
data['ZW_score'] = data['ZW'].apply(score_zw)
data['Total_Score'] = data['ZS_score'] + data['ZW_score']

# 保存结果到Excel文件
data.to_excel("books_reviews.xlsx", index=False)