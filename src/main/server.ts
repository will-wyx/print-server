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
  if (printer) {
    await download(url, 'files', {
      filename: 'temp.pdf',
    });
    ctx.response.type = 'json';
    try {
      await print(`files\\temp.pdf`, { printer });
      ctx.response.body = {
        success: true,
        code: 1,
        message: '成功',
      };
    } catch (e: any) {
      ctx.response.body = {
        success: false,
        code: -1,
        message: '打印失败',
      };
    }
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
