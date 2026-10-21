import { expect, test } from "@playwright/test";
import { appPath } from "./paths";

type Probe = {
  contexts: number;
  loops: { duration: number; rms: number }[];
  resumes: number;
};
async function probe(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    const state: Probe = { contexts: 0, loops: [], resumes: 0 };
    (window as unknown as { audioProbe: Probe }).audioProbe = state;
    const Native = window.AudioContext;
    window.AudioContext = class extends Native {
      constructor(options?: AudioContextOptions) {
        super(options);
        state.contexts++;
      }
      override resume() {
        state.resumes++;
        return super.resume();
      }
      override createBufferSource() {
        const source = super.createBufferSource(),
          start = source.start.bind(source);
        source.start = ((
          ...args: Parameters<AudioBufferSourceNode["start"]>
        ) => {
          if (source.loop && source.buffer) {
            const samples = source.buffer.getChannelData(0);
            let sum = 0;
            for (let i = 0; i < samples.length; i += 100)
              sum += samples[i] ** 2;
            state.loops.push({
              duration: source.buffer.duration,
              rms: Math.sqrt(sum / Math.ceil(samples.length / 100)),
            });
          }
          start(...args);
        }) as typeof source.start;
        return source;
      }
    };
  });
}
for (const [route, label, duration] of [
  ["anniversaire", "Commencer ma surprise", 41],
  ["mariage", "Commencer notre histoire", 53],
  ["evenement", "Accepter la mission", 34],
] as const) {
  test(`Musique réelle ${route} : geste, décodage et mute indépendant`, async ({
    page,
  }) => {
    await probe(page);
    const requests: string[] = [];
    page.on("request", (r) => {
      if (r.url().endsWith(".mp3")) requests.push(r.url());
    });
    await page.goto(appPath(`/demo/${route}/`));
    await expect(page.locator("astro-island").first()).not.toHaveAttribute(
      "ssr",
    );
    expect(requests).toHaveLength(0);
    expect(
      await page.evaluate(
        () => (window as unknown as { audioProbe: Probe }).audioProbe.contexts,
      ),
    ).toBe(0);
    await page.getByRole("button", { name: label, exact: true }).click();
    const world = page.locator(".experience-shell");
    await expect(world).toHaveAttribute("data-audio-status", "playing");
    const state = await page.evaluate(
      () => (window as unknown as { audioProbe: Probe }).audioProbe,
    );
    expect(state.contexts).toBe(1);
    expect(state.loops).toHaveLength(1);
    expect(state.loops[0].duration).toBeGreaterThan(duration);
    expect(state.loops[0].rms).toBeGreaterThan(0.025);
    expect(requests).toHaveLength(1);
    expect(requests[0]).toContain(appPath("/audio/"));
    await page.getByLabel("Régler les volumes", { exact: true }).click();
    await page.getByRole("slider", { name: "Musique", exact: true }).focus();
    await page.keyboard.press("Home");
    await expect(
      page.getByRole("slider", { name: "Effets sonores", exact: true }),
    ).toHaveValue("0.65");
    await page.getByLabel("Régler les volumes", { exact: true }).click();
    await page
      .getByRole("button", { name: "Désactiver le son", exact: true })
      .click();
    await expect(world).toHaveAttribute("data-audio-status", "muted");
    await page
      .getByRole("button", { name: "Recommencer l’expérience", exact: true })
      .click();
    await page.getByRole("button", { name: label, exact: true }).click();
    await expect(world).toHaveAttribute("data-audio-status", "muted");
    await page.reload();
    await expect(page.locator("astro-island").first()).not.toHaveAttribute(
      "ssr",
    );
    await page.getByRole("button", { name: label, exact: true }).click();
    await expect(world).toHaveAttribute("data-audio-status", "muted");
  });
}

test("Un refus audio laisse le jeu avancer et propose une reprise explicite", async ({
  page,
}) => {
  await page.addInitScript(() => {
    let refused = false;
    const resume = AudioContext.prototype.resume;
    AudioContext.prototype.resume = function () {
      if (!refused) {
        refused = true;
        return Promise.reject(
          new DOMException("Consent required", "NotAllowedError"),
        );
      }
      return resume.call(this);
    };
  });
  await page.goto(appPath("/demo/anniversaire/"));
  await page.getByRole("button", { name: "Commencer ma surprise" }).click();
  await expect(page.locator(".experience-count")).toHaveText("02 / 06");
  await expect(page.locator(".experience-shell")).toHaveAttribute(
    "data-audio-status",
    "blocked",
  );
  await page
    .getByRole("button", { name: "Éclater le ballon 1", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Réessayer le son ♫", exact: true })
    .click();
  await expect(page.locator(".experience-shell")).toHaveAttribute(
    "data-audio-status",
    "playing",
  );
});

test("Une musique indisponible garde le jeu et les effets disponibles", async ({
  page,
}) => {
  await page.route("**/audio/*.mp3", (route) =>
    route.fulfill({ status: 503, body: "Temporarily unavailable" }),
  );
  await page.goto(appPath("/demo/mariage/"));
  await page.getByRole("button", { name: "Commencer notre histoire" }).click();
  await expect(page.locator(".experience-shell")).toHaveAttribute(
    "data-audio-status",
    "effects-only",
  );
  await expect(
    page.getByText("Musique indisponible · effets actifs.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Découvrir le souvenir 1/ }).click();
  await expect(
    page.getByRole("heading", { name: "Ce premier café", exact: true }),
  ).toBeVisible();
  await page.unroute("**/audio/*.mp3");
  await page
    .getByRole("button", { name: "Réessayer la musique ♫", exact: true })
    .click();
  await expect(page.locator(".experience-shell")).toHaveAttribute(
    "data-audio-status",
    "playing",
  );
});
