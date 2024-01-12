import os
import re
import pandas as pd

# 目标目录路径
output_dir = "../output"

def count_reviews_in_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.readlines()
        total_reviews = 0
        for line in content:
            match = re.search(r"Total Reviews - (\d+)", line)
            if match:
                total_reviews += int(match.group(1))
        return total_reviews

def iterate_files(directory):
    book_reviews = []
    for root, dirs, files in os.walk(directory):
        for book_dir in dirs:
            book_path = os.path.join(root, book_dir)
            book_reviews_count = 0
            for file in os.listdir(book_path):
                if file.endswith('.md'):
                    file_reviews_count = count_reviews_in_file(os.path.join(book_path, file))
                    book_reviews_count += file_reviews_count
            book_info = book_dir.split('_')
            print(book_info)
            book_reviews.append({'BookID': book_info[0],'BookName': book_info[1], 'Total Reviews': book_reviews_count})
    
    df = pd.DataFrame(book_reviews)
    df.to_excel('books_reviews.xlsx', index=False)

if __name__ == "__main__":
    iterate_files(output_dir)