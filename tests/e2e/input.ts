import type { Page } from "@playwright/test";
export type Point = { x: number; y: number };

/** Trusted browser input. WebKit's public touchscreen API exposes taps only;
 * continuous WebKit checks therefore use its native mouse input, never fake DOM
 * pointer events. Chromium mobile uses trusted CDP touch with time for frames.
 */
export async function contact(page: Page, point: Point, mobile: boolean) {
  let last=point;
  const touch =
    mobile && page.context().browser()?.browserType().name() === "chromium";
  const session = touch ? await page.context().newCDPSession(page) : null;
  const sample = (point: Point) => ({
    ...point,
    id: 1,
    radiusX: 2,
    radiusY: 2,
    force: 0.6,
  });
  if (session)
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [sample(point)],
    });
  else {
    await page.evaluate(()=>document.addEventListener('pointerdown',event=>{
      (window as Window&{gestureTestPointer?:number}).gestureTestPointer=event.pointerId;
    },{once:true,capture:true}));
    await page.mouse.move(point.x, point.y);
    await page.mouse.down();
  }
  await page.waitForTimeout(25);
  return {
    async move(point: Point) {
      last=point;
      if (session)
        await session.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [sample(point)],
        });
      else await page.mouse.move(point.x, point.y);
      await page.waitForTimeout(25);
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => resolve()),
          ),
      );
    },
    async end(cancel = false) {
      if (session) {
        await session.send("Input.dispatchTouchEvent", {
          type: cancel ? "touchCancel" : "touchEnd",
          touchPoints: [],
        });
        await session.detach();
      } else if (cancel) {
        // Releasing real capture makes the browser emit lostpointercapture.
        // Headless tab switches do not reliably change visibility or focus.
        await page.evaluate(()=>{
          const id=(window as Window&{gestureTestPointer?:number}).gestureTestPointer;
          if(id===undefined)return;
          const owner=Array.from(document.querySelectorAll('.gesture-surface, .gesture-surface *, .proposal-weave-board')).find(node=>node.hasPointerCapture(id));
          owner?.releasePointerCapture(id);
        });
        await page.mouse.move(last.x+1,last.y);
        await page.mouse.up();
      } else await page.mouse.up();
    },
  };
}
export async function stroke(
  page: Page,
  points: Point[],
  mobile: boolean,
  hold = 0,
  cancel = false,
) {
  const input = await contact(page, points[0], mobile);
  if (hold) await page.waitForTimeout(hold);
  for (const point of points.slice(1)) await input.move(point);
  await input.end(cancel);
}
