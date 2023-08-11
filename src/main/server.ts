import Koa from 'koa';
// @ts-ignore
import Router from '@koa/router';
import { koaBody } from 'koa-body';
// @ts-ignore
import download from 'download';
// @ts-ignore
import { print } from 'pdf-to-printer';
// @ts-ignore
import Store from 'electron-store';

const store = new Store();

const koa = new Koa();
const router = new Router();

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
  .use(koaBody())
  .use(router.routes())
  .use(router.allowedMethods());

// koa.listen(38250);
//
export default koa;
