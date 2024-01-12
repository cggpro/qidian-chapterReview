require("module-alias/register");
const { books, start, lock } = require("@/utils/fs").json;
const { processChapterReview, getCatalog } = require("@/utils");
const { generateCategory } = require("@/utils/fs");
const { logger, errorLogger } = require("@/utils/logger");
(async () => {
  for (const item of books) {
    // await sleep(1000);
    item.start ?? (item.start = start);
    if (!item.start) continue;
    const catalog = await getCatalog(item.book_id, item.start, item.total, lock, item.book_name);
    for (const chapter of catalog) {
      chapter.cN = `[${chapter.uuid}] ${chapter.cN}`;
      await processChapterReview(chapter.id, chapter.cN);
    }
  }
  await generateCategory();
})();

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
