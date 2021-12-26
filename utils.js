const fs = require("fs");
const got = require("got");
let path;
let bookId;
let csrfToken;

const ProcessChapterReview = async (chapterId, chapterName) => {
  const reviewSummary = await getReviewSummary(chapterId);
  const out = await Promise.all(
    reviewSummary.map(async (item) => {
      //const pageSize = item.reviewNum > 100 ? 100 : item.reviewNum;
      const pageSize = item.reviewNum;
      const chapterReviewUrl = `https://vipreader.qidian.com/ajax/chapterReview/reviewList?_csrfToken=${csrfToken}&bookId=${bookId}&chapterId=${chapterId}&segmentId=${item.segmentId}&type=2&page=1&pageSize=${item.pageSize}`;
      const response = await got(chapterReviewUrl);
      const { list } = JSON.parse(response.body).data;
      try {
        const content = list.map((item) => `>--- ${item.content.trim()}<br>\n`);
        const quoteContent = [
          `\n[${item.segmentId}] ${list[0].quoteContent.trim()}\n`,
        ];
        return [...quoteContent, ...content];
      } catch (err) {
        const msg = `---response: ${response.body}\n---chapterReviewUrl: ${chapterReviewUrl}`;
        console.log(err);
        console.log(msg);
        return `\n[${item.segmentId}] invalid list\n`;
      }
    })
  );
  createBookDir();
  writeFile(out, chapterName);
};

const getNewList = async (bid, start) => {
  await assignmentGlobalVariables(bid);
  const categoryUrl = `https://m.qidian.com/majax/book/category?_csrfToken=${csrfToken}&bookId=${bookId}`;
  const data = await got(categoryUrl).then((res) => JSON.parse(res.body).data);
  const { bookName } = data;
  console.log(
    `\n${bookName}  (${process.env.DOWNSTREAM_BRANCH || "local"
    }/${bookId}) \n================================`
  );
  let list = [];
  data.vs.forEach((e) => (list = [...list, ...e.cs]));
  start = start > list.length ? list.length : start;
  console.log(`抓取最新 ${start} 章`);
  const newList = list.slice(-start);
  return newList;
};

const getReviewSummary = async (chapterId) => {
  const reviewSummaryUrl = `https://read.qidian.com/ajax/chapterReview/reviewSummary?_csrfToken=${csrfToken}&bookId=${bookId}&chapterId=${chapterId}`;
  const reviewSummary = await got(reviewSummaryUrl).then(
    (res) => JSON.parse(res.body).data.list
  );
  reviewSummary.sort((a, b) => a.segmentId - b.segmentId);
  return reviewSummary.filter((e) => e.reviewNum !== 0);
};

const assignmentGlobalVariables = async (bid) => {
  bookId = bid;
  csrfToken = await fetchCsrfToken();
  path = `./output/${bookId}`;
};

const fetchCsrfToken = async () => {
  const response = await got(`https://m.qidian.com/book/${bookId}/catalog`);
  const _csrfToken = response.headers["set-cookie"]
    .join("")
    .match(/_csrfToken=(\S*);/)[1];
  return _csrfToken;
};

const createBookDir = () => {
  fs.access(path, (err) => {
    if (err) {
      fs.mkdir(path, { recursive: true }, (err) => {
        if (err) throw err;
      });
    }
  });
};

const writeFile = (out, chapterName) => {
  fs.writeFile(
    `${path}/${chapterName}.md`,
    out.join("").replace(/,/g, ""),
    { flag: "w" },
    (err) => {
      console.log(
        err ? `${chapterName} 写入失败！` : `${chapterName} 写入成功！`
      );
    }
  );
};

module.exports = {
  ProcessChapterReview,
  getNewList,
};
