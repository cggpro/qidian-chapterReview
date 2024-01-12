from bs4 import BeautifulSoup
import requests

# 将所有URL放入一个列表
urls = [
    "https://www.qidian.com/rank/yuepiao/",
    "https://www.qidian.com/rank/yuepiao/year2024-month01-page2/",
    "https://www.qidian.com/rank/yuepiao/year2024-month01-page3/",
    "https://www.qidian.com/rank/yuepiao/year2024-month01-page4/",
    "https://www.qidian.com/rank/yuepiao/year2024-month01-page5/",
]

with open('books.yaml', 'w', encoding='utf-8') as f:
    for url in urls:
        response = requests.get(url)
        data = response.text
        soup = BeautifulSoup(data, 'html.parser')

        book_h2_tags = soup.find_all('h2')
        for h2_tag in book_h2_tags:
            a_tag = h2_tag.find('a', attrs={'data-bid': True})
            if a_tag:
                book_id = a_tag.get('data-bid')
                book_name = a_tag.text.strip()

                f.write("- book_id: '{}' #书籍 id，必填\n".format(book_id))
                f.write("  book_name: {} #书籍名称，选填\n".format(book_name))
                f.write("  start: 10 #自定义爬取最新章节数, 必填\n\n")