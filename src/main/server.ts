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
  const url = ctx.request.body?.url;

  const printer = store.get('printer') as string;
  ctx.response.type = 'json';
  if (printer) {
    // 随机生成文件名
    // eslint-disable-next-line no-use-before-define
    const filename = GenNonDuplicateID();
    try {
      await download(url, `files`, {
        filename,
      });
    } catch (error) {
      ctx.response.body = {
        success: false,
        code: -2,
        message: '下载失败',
        error,
      };
    }
    try {
      await print(`files\\${filename}`, { printer });
      ctx.response.body = {
        success: true,
        code: 0,
        message: '成功',
      };
    } catch (error: any) {
      ctx.response.body = {
        success: false,
        code: -1,
        message: '打印失败',
        error,
      };
    }
  } else {
    ctx.response.body = {
      success: false,
      code: -3,
      message: '未连接打印机',
    };
  }
});

/**
 * 下载并打印
 * @param url
 * @param printer
 */
async function downloadAndPrint(url: string, printer: string) {
  // 随机生成文件名
  // eslint-disable-next-line no-use-before-define
  const filename = GenNonDuplicateID();
  try {
    await download(url, `files`, {
      filename,
    });
  } catch (error) {
    // 下载失败
    return { url, code: -2 };
  }

  try {
    await print(`files\\${filename}`, { printer });
  } catch (error) {
    // 打印失败
    return { url, code: -1 };
  }

  return { url, code: 0 };
}

router.post('/printMulti', async (ctx: any) => {
  const urls = ctx.request.body?.url;

  const printer = store.get('printer') as string;
  ctx.response.type = 'json';
  if (printer) {
    const promises = urls.map((url: string) => downloadAndPrint(url, printer));
    const result = await Promise.all(promises);

    ctx.response.body = {
      success: true,
      code: 0,
      message: '成功',
      result,
    };
  } else {
    ctx.response.body = {
      success: false,
      code: -3,
      message: '未连接打印机',
    };
  }
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
