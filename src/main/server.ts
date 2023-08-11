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

const store = new Store();

const koa = new Koa();
const router = new Router();

router.get('/', (ctx: any) => {
  ctx.response.type = 'json';
  ctx.response.body = {
    success: true,
    code: 1,
    message: '成功',
  };
});

router.post('/print', async (ctx: any) => {
  const url = ctx.request.body?.url;

  const printer = store.get('printer') as string;
  ctx.response.type = 'json';
  if (printer) {
    try {
      await download(url, 'files', {
        filename: 'temp.pdf',
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
      await print(`files\\temp.pdf`, { printer });
      ctx.response.body = {
        success: true,
        code: 1,
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
