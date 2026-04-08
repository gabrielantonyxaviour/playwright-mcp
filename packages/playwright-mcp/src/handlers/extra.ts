import { withSession } from "./shared.js";
import { resolveTarget } from "../snapshot.js";
import type { HandlerFn } from "./shared.js";
import * as os from "os";
import * as path from "path";

export const extraHandlers = new Map<string, HandlerFn>([
  [
    "browser_pdf_save",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (_session, page) => {
        // PDF generation only works in headless Chromium
        const browser = page.context().browser();
        if (!browser) {
          throw new Error("Browser reference lost.");
        }
        const browserType = browser.browserType().name();
        if (browserType !== "chromium") {
          throw new Error(
            `PDF generation only works in Chromium, current browser: ${browserType}.`,
          );
        }

        const filename =
          (args.filename as string) ||
          path.join(os.tmpdir(), `page-${Date.now()}.pdf`);
        await page.pdf({ path: filename });
        return `PDF saved to ${filename}.`;
      });
    },
  ],
  [
    "browser_run_code",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (session, page) => {
        const code = args.code as string;
        const AsyncFunction = Object.getPrototypeOf(
          async function () {},
        ).constructor;
        const fn = new AsyncFunction("page", "context", code);
        const result = await fn(page, session.context);
        if (result === undefined || result === null) return "undefined";
        return typeof result === "string"
          ? result
          : JSON.stringify(result, null, 2);
      });
    },
  ],
  [
    "browser_fill_form",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (session, page) => {
        const fields = args.fields as {
          ref?: number;
          selector?: string;
          value: string;
        }[];
        const results: string[] = [];
        for (const field of fields) {
          const target = resolveTarget(
            session,
            field.ref as number,
            field.selector as string,
          );
          const locator = page.locator(target);
          const tagName = await locator.evaluate((el: Element) =>
            el.tagName.toLowerCase(),
          );
          if (tagName === "select") {
            await locator.selectOption(field.value, { timeout: 10000 });
          } else {
            await locator.fill(field.value, { timeout: 10000 });
          }
          const label = field.ref !== undefined ? `[ref=${field.ref}]` : target;
          results.push(`${label} = "${field.value.slice(0, 30)}"`);
        }
        return `Filled ${fields.length} field(s): ${results.join(", ")}`;
      });
    },
  ],
  [
    "browser_generate_locator",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (session, page) => {
        const target = resolveTarget(
          session,
          args.ref as number,
          args.selector as string,
        );
        const info = await page.locator(target).evaluate((el: Element) => {
          const tag = el.tagName.toLowerCase();
          const id = el.id;
          const role = el.getAttribute("role");
          const ariaLabel = el.getAttribute("aria-label");
          const name = el instanceof HTMLInputElement ? el.name : undefined;
          const type = el instanceof HTMLInputElement ? el.type : undefined;
          const text = el.textContent?.trim().slice(0, 50) || undefined;
          const placeholder = el.getAttribute("placeholder");
          return { tag, id, role, ariaLabel, name, type, text, placeholder };
        });

        // Build best locator suggestion
        const suggestions: string[] = [];
        if (info.id) {
          suggestions.push(`page.locator('#${info.id}')`);
        }
        if (info.role && info.ariaLabel) {
          suggestions.push(
            `page.getByRole('${info.role}', { name: '${info.ariaLabel}' })`,
          );
        } else if (info.role && info.text) {
          suggestions.push(
            `page.getByRole('${info.role}', { name: '${info.text}' })`,
          );
        }
        if (info.placeholder) {
          suggestions.push(`page.getByPlaceholder('${info.placeholder}')`);
        }
        if (info.text && info.tag !== "input") {
          suggestions.push(`page.getByText('${info.text}')`);
        }
        if (info.name) {
          suggestions.push(`page.locator('[name="${info.name}"]')`);
        }

        return JSON.stringify(
          { element: info, suggestedLocators: suggestions },
          null,
          2,
        );
      });
    },
  ],
]);
