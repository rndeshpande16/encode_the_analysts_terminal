import { chromium } from "playwright";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(
  resolve(__dirname, "encode-documentation.html"),
  "utf-8",
);

async function generate() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.pdf({
    path: resolve(__dirname, "Encode-Terminal-Documentation.pdf"),
    format: "A4",
    margin: { top: "0.6in", bottom: "0.6in", left: "0.65in", right: "0.65in" },
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: `<div style="font-size:8px;color:#666;width:100%;text-align:center;font-family:sans-serif;">Encode Terminal — Technical Documentation</div>`,
    footerTemplate: `<div style="font-size:8px;color:#666;width:100%;text-align:center;font-family:sans-serif;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>`,
  });
  await browser.close();
  console.log("PDF generated: docs/Encode-Terminal-Documentation.pdf");
}

generate().catch(console.error);
