import Koa from 'koa';
// @ts-ignore
import Router from '@koa/router';
// import { koaBody } from 'koa-body';
import bodyParser from 'koa-bodyparser';
// @ts-ignore
import download from 'download';
// @ts-ignore
import { print } from 'pdf-to-printer';
// @ts-ignore
import Store from 'electron-store';
import fs from 'fs';
import child_process from 'child_process';
import logger from './logger';

const store = new Store();

const koa = new Koa();
const router = new Router();

// 清空文件目录
// eslint-disable-next-line no-use-before-define
rmdir('files');

function rmdir(path: any) {
  if (fs.existsSync(path)) {
    const files = fs.readdirSync(path);
    files.forEach((file) => {
      const filename = `${path}/${file}`;
      fs.unlinkSync(filename);
    });
  }
}

router.get('/', (ctx: any) => {
  ctx.response.type = 'json';
  ctx.response.body = {
    success: true,
    code: 0,
    message: '成功',
  };
});

router.post('/print', async (ctx: any) => {
  const reqId = GenNonDuplicateID();
  const url = ctx.request.body?.url;
  logger.info(`/print [req] [${reqId}] ${url}`);

  const printer = store.get('printer') as string;
  ctx.response.type = 'json';
  let res = {};
  if (printer) {
    // 随机生成文件名
    // eslint-disable-next-line no-use-before-define
    const filename = GenNonDuplicateID();
    try {
      logger.info(`下载中... ${url}`);
      await download(url, `files`, {
        filename,
      });
    } catch (error) {
      res = {
        success: false,
        code: -2,
        message: '下载失败',
        error,
      };
      ctx.response.body = res;
    }
    await waitPrinter(printer); // 等待打印机状态
    try {
      logger.info('开始打印...');
      await print(`files\\${filename}`, { printer });
      res = {
        success: true,
        code: 0,
        message: '成功',
      };
      ctx.response.body = res;
    } catch (error: any) {
      res = {
        success: false,
        code: -1,
        message: '打印失败',
        error,
      };
      ctx.response.body = res;
    }
  } else {
    res = {
      success: false,
      code: -3,
      message: '未连接打印机',
    };
    ctx.response.body = res;
  }
  logger.info(`/print [res] [${reqId}] ${JSON.stringify(res)}`);
});

/**
 * 下载并打印
 * @param url
 * @param printer
 * @param index
 */
async function downloadAndPrint(url: string, printer: string, index: number) {
  logger.info(`打印开始 [${index}] ${url}`);
  // 随机生成文件名
  // eslint-disable-next-line no-use-before-define
  const filename = GenNonDuplicateID();
  try {
    logger.info(`下载中... [${index}]`);
    await download(url, `files`, {
      filename,
    });
  } catch (error) {
    // 下载失败
    logger.info(`下载失败 [${index}]`);
    return { url, code: -2 };
  }
  logger.info(`下载完成 [${index}]`);

  try {
    logger.info(`打印中... [${index}]`);
    await print(`files\\${filename}`, { printer });
  } catch (error) {
    // 打印失败
    logger.info(`打印失败 [${index}]`);
    return { url, code: -1 };
  }

  logger.info(`打印完成 [${index}]`);
  return { url, code: 0 };
}

/**
 * 打印所有任务
 * @param urls
 * @param printer
 */
async function printAll(urls: string[], printer: string) {
  logger.info(`批量打印 ${JSON.stringify({ total: urls.length, urls })}`);
  const data = [];
  for (let i = 0; i < urls.length; i++) {
    await waitPrinter(printer); // 等待打印机状态
    data.push(await downloadAndPrint(urls[i], printer, i));
  }
  logger.info(`批量打印完成`);
  return data;
}

/**
 * 检查打印机是否在可打印状态
 * @param printer
 */
function checkPrinterStatus(printer: string) {
  const printerState = child_process.execSync(
    `wmic printer where name="${printer}" get WorkOffline, PrinterState`,
    { encoding: 'utf-8' }
  );
  return printerState.indexOf('0             FALSE') >= 0;
}

/**
 * 延迟
 * @param ms
 */
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(() => resolve(true), ms));
}

/**
 * 等待打印机状态恢复
 * @param printer
 */
async function waitPrinter(printer: string) {
  logger.info('等待打印队列...');
  let status = false;
  do {
    status = checkPrinterStatus(printer);
    await delay(500);
  } while (!status);
  logger.info('打印队列已清空');
}

router.post('/printMulti', async (ctx: any) => {
  const reqId = GenNonDuplicateID();
  const urls = ctx.request.body?.url;
  logger.info(`/printMulti [req] [${reqId}] ${urls}`);

  const printer = store.get('printer') as string;
  ctx.response.type = 'json';
  let res = {};
  if (printer) {
    const result = await printAll(urls, printer);

    res = {
      success: true,
      code: 0,
      message: '成功',
      result,
    };
    ctx.response.body = res;
  } else {
    res = {
      success: false,
      code: -3,
      message: '未连接打印机',
    };
    ctx.response.body = res;
  }
  logger.info(`/printMulti [res] [${reqId}] ${JSON.stringify(res)}`);
});

function GenNonDuplicateID(): String {
  return Math.random().toString(36).substr(3);
}

koa
  .use(async (ctx, next) => {
    ctx.set('Access-Control-Allow-Origin', '*');
    ctx.set('Access-Control-Allow-Headers', 'X-Requested-With,Content-Type');
    ctx.set('Access-Control-Allow-Methods', 'OPTIONS, GET, PUT, POST, DELETE');
    await next();
  })
  // .use(koaBody())
  .use(bodyParser())
  .use(router.routes())
  .use(router.allowedMethods());

// koa.listen(38250);
//
export default koa;
