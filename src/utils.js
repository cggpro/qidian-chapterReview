const Path = require("path");
const got = require("@/utils/got");
const { outputPaths, githubRepository } = require("@/utils/config").value;
const { writeFile } = require("@/utils/fs");
const { logger, errorLogger } = require("@/utils/logger");
const { log } = require("console");
let path;
let bookId;
let csrfToken;
let headers;

// const processChapterReview = async (chapterId, chapterName) => {
//   const reviewSummary = await getReviewSummary(chapterId);
//   const out = await Promise.all(
//     reviewSummary.map(async (item) => {
//       const chapterReviewUrl = "https://vipreader.qidian.com/ajax/chapterReview/reviewList";
//       const paramsList = {
//         bookId,
//         page: 1,
//         type: 2,
//         chapterId,
//         _csrfToken: csrfToken,
//         pageSize: item.reviewNum,
//         segmentId: item.segmentId,
//       };
//       let response;
//       try {
//         response = await got(chapterReviewUrl, { searchParams: new URLSearchParams(paramsList) }, { headers });
//         const { data: { list } } = JSON.parse(response.body);
//         const content = list.map((item) => `>--- ${item.content.trim()}<br>\n`);
//         const quoteContent = [
//           `\n[${item.segmentId}] ${list[0].quoteContent.trim()}\n`,
//         ];
       
//         return [...quoteContent, ...content];
//       } catch (err) {
//         console.log('错误章节: ', chapterName);
//         console.log('错误消息: ', err.message);
//         console.log('错误栈: ', err.stack);
//         const msg = `---bookId: ${bookId} chapterName: ${chapterName}\n---response: ${response ? response.body : 'Response is undefined'}\n`;
//         errorLogger.info(`${err} \n ${msg}`);
//         return `\n[${item.segmentId}] invalid list\n`;
//       }
//     })
//   );
//   writeFile(path, out, chapterName);
// };

const processChapterReview = async (chapterId, chapterName) => {
  const reviewSummary = await getReviewSummary(chapterId);

  const totalReviewNum = reviewSummary.reduce((sum, item) => sum + item.reviewNum, 0);
  const outputArray = [`Chapter ${chapterId} (${chapterName}): Total Reviews - ${totalReviewNum}\n`];

  // await sleep(1000); // 等待一秒
  await writeFile(path, outputArray, chapterName);
};








const retryRequest = async (url, options, maxAttempts = 3, delay = 1000) => {
  let attempts = 0;
  while (attempts < maxAttempts) {
    try {
      const response = await got(url, options);
      return response;
    } catch (err) {
      attempts++;
      console.log(`Attempt #${attempts} failed: ${err.message}`);
      if (attempts >= maxAttempts) {
        throw err;
      }
      await sleep(delay);
    }
  }
};
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
const getReviewSummary = async (chapterId) => {
  const reviewSummaryUrl = `https://read.qidian.com/ajax/chapterReview/reviewSummary?_csrfToken=${csrfToken}&bookId=${bookId}&chapterId=${chapterId}`;
  const reviewSummary = await retryRequest(reviewSummaryUrl, { headers }).then(
    (res) => res.data.data.list
  );
  
  reviewSummary.sort((a, b) => a.segmentId - b.segmentId);
  return reviewSummary.filter((e) => e.reviewNum !== 0);
};








const getCatalog = async (bid, start, total, lock,orbookName) => {
  await assignmentGlobalVariables(bid,orbookName);
  const categoryUrl = `https://m.qidian.com/majax/book/category?bookId=${bookId}&_csrfToken=${csrfToken}`;
  const { data } = await got(categoryUrl, { headers })
  const { data : {bookName, vs} } = data
  logger.info(
    `${bookName}  (${process.env.DOWNSTREAM_BRANCH || "local"
    }/${bookId}) \n================================`
  );
  return getSlicesCatalog(vs, start, total, lock);
};

const getSlicesCatalog = (vs, start, total, lock) => {
  let catalogList = [];
  for (const { cs } of vs) {
    catalogList.push(...cs);
  }
  if (lock) {
    logger.info("仅抓取付费章！");
    catalogList = catalogList.filter((e) => e.sS !== 1);
  }
  if (total || start > catalogList.length) {
    start = catalogList.length;
  }
  const githubActionsLimit = 10;
  if (process.env.GITHUB_REPOSITORY !== githubRepository && start > githubActionsLimit) {
    start = githubActionsLimit;
    logger.info(`触发 demo 限制，重置 start 为 ${start}`);
  }
  logger.info(`抓取${start === catalogList.length ? "全部，共" : "最新"} ${start} 章`);
  return catalogList.slice(-start);
};

// const getReviewSummary = async (chapterId) => {
//   const reviewSummaryUrl = `https://read.qidian.com/ajax/chapterReview/reviewSummary?_csrfToken=${csrfToken}&bookId=${bookId}&chapterId=${chapterId}`;
//   const reviewSummary = await got(reviewSummaryUrl, { headers }).then(
//     (res) => res.data.data.list
//   );
  
//   reviewSummary.sort((a, b) => a.segmentId - b.segmentId);
//   return reviewSummary.filter((e) => e.reviewNum !== 0);
// };

const assignmentGlobalVariables = async (bid,orbookName) => {
  bookId = bid;
  bookInfo =  `${bid}_${orbookName}`;
  if (typeof (csrfToken) === "undefined") {
    csrfToken = await fetchCsrfToken();
  }
  headers = {
    Cookie: `_csrfToken=${csrfToken}`,
  };
  path = Path.resolve(__dirname, `../${outputPaths}/${bookInfo}`);
};
// 获取 csrfToken
const fetchCsrfToken = async () => {
  await sleep(300);
  return await got(`https://m.qidian.com/book/${bookId}/catalog`).then(
    (res) => res.headers["set-cookie"].join("").match(/_csrfToken=(\S*);/)[1]
  );
};
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  processChapterReview,
  getCatalog,
};
