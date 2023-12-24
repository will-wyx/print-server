import Koa from "koa";
// @ts-ignore
import Router from "@koa/router";
// import { koaBody } from 'koa-body';
import bodyParser from "koa-bodyparser";
// @ts-ignore
import download from "download";
// @ts-ignore
import { print } from "pdf-to-printer";
// @ts-ignore
import Store from "electron-store";
import fs from "fs";
import child_process from "child_process";

const store = new Store();

const koa = new Koa();
const router = new Router();

// 清空文件目录
// eslint-disable-next-line no-use-before-define
rmdir("files");

function rmdir(path: any) {
  if (fs.existsSync(path)) {
    const files = fs.readdirSync(path);
    files.forEach((file) => {
      const filename = `${path}/${file}`;
      fs.unlinkSync(filename);
    });
  }
}

router.get("/", (ctx: any) => {
  ctx.response.type = "json";
  ctx.response.body = {
    success: true,
    code: 0,
    message: "成功"
  };
});

router.post("/print", async (ctx: any) => {
  const url = ctx.request.body?.url;

  const printer = store.get("printer") as string;
  ctx.response.type = "json";
  if (printer) {
    // 随机生成文件名
    // eslint-disable-next-line no-use-before-define
    const filename = GenNonDuplicateID();
    try {
      await download(url, `files`, {
        filename
      });
    } catch (error) {
      ctx.response.body = {
        success: false,
        code: -2,
        message: "下载失败",
        error
      };
    }
    await waitPrinter(printer); // 等待打印机状态
    try {
      await print(`files\\${filename}`, { printer });
      ctx.response.body = {
        success: true,
        code: 0,
        message: "成功"
      };
    } catch (error: any) {
      ctx.response.body = {
        success: false,
        code: -1,
        message: "打印失败",
        error
      };
    }
  } else {
    ctx.response.body = {
      success: false,
      code: -3,
      message: "未连接打印机"
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
      filename
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

/**
 * 打印所有任务
 * @param urls
 * @param printer
 */
async function printAll(urls: string[], printer: string) {
  const data = [];
  for (let i = 0; i < urls.length; i++) {
    await waitPrinter(printer); // 等待打印机状态
    data.push(await downloadAndPrint(urls[i], printer));
  }
  return data;
}

/**
 * 检查打印机是否在可打印状态
 * @param printer
 */
function checkPrinterStatus(printer: string) {
  const stdout = child_process.execSync(`wmic printer where name="${printer}" get status`, { encoding: "utf-8" });
  return stdout.indexOf("Unknown") >= 0;
}

/**
 * 延迟
 * @param ms
 */
function delay(ms: number) {
  return new Promise(resolve =>
    setTimeout(() => resolve(true), ms)
  );
}

/**
 * 等待打印机状态恢复
 * @param printer
 */
async function waitPrinter(printer: string) {
  let status = false;
  do {
    status = checkPrinterStatus(printer);
    await delay(500);
  } while (!status);
}

router.post("/printMulti", async (ctx: any) => {
  const urls = ctx.request.body?.url;

  const printer = store.get("printer") as string;
  ctx.response.type = "json";
  if (printer) {
    const result = await printAll(urls, printer);

    ctx.response.body = {
      success: true,
      code: 0,
      message: "成功",
      result
    };
  } else {
    ctx.response.body = {
      success: false,
      code: -3,
      message: "未连接打印机"
    };
  }
});

function GenNonDuplicateID(): String {
  return Math.random().toString(36).substr(3);
}

koa
  .use(async (ctx, next) => {
    ctx.set("Access-Control-Allow-Origin", "*");
    ctx.set("Access-Control-Allow-Headers", "X-Requested-With,Content-Type");
    ctx.set("Access-Control-Allow-Methods", "OPTIONS, GET, PUT, POST, DELETE");
    await next();
  })
  // .use(koaBody())
  .use(bodyParser())
  .use(router.routes())
  .use(router.allowedMethods());

// koa.listen(38250);
//
export default koa;
