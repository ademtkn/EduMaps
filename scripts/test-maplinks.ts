import assert from "node:assert/strict";
import { cleanLink, distanceMeters, parseMapLink, serviceOf } from "../src/lib/map-links";
import { resolveMapLink } from "../src/lib/map-links-resolve";

let passed = 0;
async function check(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    passed += 1;
    console.log(`  ✔ ${name}`);
  } catch (error) {
    console.error(`  ✘ ${name}\n    ${(error as Error).message}`);
    process.exitCode = 1;
  }
}
const near = (a: number | undefined, b: number) => assert.ok(a !== undefined && Math.abs(a - b) < 1e-6, `${a} is not ${b}`);
const coords = (service: "google" | "twogis", url: string) => {
  const r = parseMapLink(service, url);
  assert.ok(r.ok, r.ok ? "" : r.error);
  return r.coords;
};

async function main() {
  console.log("Map links");
  const place = "https://www.google.com/maps/place/Asylkech+Girls+School/@42.8628,74.6155,17z/data=!3m1!4b1!4m6!3m5!1s0x389eb7e0f1bd1de1:0x1!8m2!3d42.862851!4d74.6173213!16s%2Fg%2F11abc?entry=ttu";
  await check("Google place link: the pin wins over the middle of the map", () => {
    const c = coords("google", place)!;
    near(c.lat, 42.862851);
    near(c.lng, 74.6173213);
  });
  await check("Google link with only the map position falls back to it", () => {
    const c = coords("google", "https://www.google.com/maps/@42.8746,74.5698,15z")!;
    near(c.lat, 42.8746);
    near(c.lng, 74.5698);
  });
  await check("Google search, q= and destination= links", () => {
    for (const u of ["https://www.google.com/maps/search/?api=1&query=42.87%2C74.59", "https://maps.google.com/?q=42.87,74.59", "https://www.google.com/maps/dir/?api=1&destination=42.87,74.59"]) {
      const c = coords("google", u)!;
      near(c.lat, 42.87);
      near(c.lng, 74.59);
    }
  });
  await check("2GIS puts longitude first: m=lng,lat/zoom", () => {
    const c = coords("twogis", "https://2gis.kg/bishkek/firm/70000001012345678?m=74.617321%2C42.862851%2F17.5")!;
    near(c.lat, 42.862851);
    near(c.lng, 74.617321);
  });
  await check("a link pasted without https:// and with stray spaces or invisible characters is understood", () => {
    const c = coords("twogis", "​ 2gis.kg/bishkek?m=74.6%2C42.8%2F16 ".trim())!;
    near(c.lat, 42.8);
    near(c.lng, 74.6);
    assert.equal(cleanLink("http://2gis.kg/x"), "https://2gis.kg/x");
  });
  await check("swapped or foreign coordinates are not accepted", () => {
    assert.equal(coords("twogis", "https://2gis.kg/bishkek?m=42.8%2C74.6%2F16"), null);
    assert.equal(coords("google", "https://www.google.com/maps/@48.85,2.35,15z"), null);
  });
  await check("short links are recognised and carry no coordinates yet", () => {
    for (const [service, u] of [["google", "https://maps.app.goo.gl/AbCdEf123"], ["twogis", "https://go.2gis.com/abc123"]] as const) {
      const r = parseMapLink(service, u);
      assert.ok(r.ok && r.short && r.coords === null);
    }
  });
  await check("a link to the wrong service, a look-alike host or a bad scheme is refused with a clear message", () => {
    const wrong = parseMapLink("google", "https://2gis.kg/bishkek?m=74.6%2C42.8%2F16");
    assert.ok(!wrong.ok && /2GIS field|2GIS link/.test(wrong.error) && /2GIS/.test(wrong.error));
    for (const u of ["https://www.google.com.evil.example/maps/@42.8,74.6,15z", "https://evilgoogle.com/maps", "https://google.com@evil.example/maps", "javascript:alert(1)", "ftp://google.com/maps", "https://example.com", "not a link", "", "https://www.google.com/maps spaced"]) {
      assert.equal(parseMapLink("google", u).ok, false, u);
    }
    assert.equal(serviceOf("https://maps.google.com/?q=1,1")?.service, "google");
    assert.equal(parseMapLink("google", `https://www.google.com/maps/${"a".repeat(600)}`).ok, false);
  });
  await check("distance between two points", () => {
    const d = distanceMeters({ lat: 42.862851, lng: 74.617321 }, { lat: 42.863851, lng: 74.617321 });
    assert.ok(d > 100 && d < 120, String(d));
    assert.equal(Math.round(distanceMeters({ lat: 42.8, lng: 74.6 }, { lat: 42.8, lng: 74.6 })), 0);
  });

  console.log("Following short links");
  const redirect = (map: Record<string, { status: number; location?: string }>) => async (url: string) => {
    const hit = map[url];
    if (!hit) throw new Error(`unexpected request to ${url}`);
    return { status: hit.status, headers: { get: (n: string) => (n.toLowerCase() === "location" ? hit.location ?? null : null) } };
  };
  await check("a Google short link is followed to the place and its pin is read", async () => {
    const r = await resolveMapLink("google", "https://maps.app.goo.gl/AbCdEf123", redirect({ "https://maps.app.goo.gl/AbCdEf123": { status: 302, location: place } }));
    assert.ok(r.ok && r.short && r.url === "https://maps.app.goo.gl/AbCdEf123");
    near(r.coords?.lat, 42.862851);
  });
  await check("a redirect through Google's consent page still gives the coordinates", async () => {
    const consent = `https://consent.google.com/m?continue=${encodeURIComponent(place)}&gl=DE`;
    const r = await resolveMapLink("google", "https://maps.app.goo.gl/x", redirect({ "https://maps.app.goo.gl/x": { status: 302, location: consent } }));
    assert.ok(r.ok);
    near(r.coords?.lng, 74.6173213);
  });
  await check("a 2GIS short link is followed to the firm page", async () => {
    const r = await resolveMapLink("twogis", "https://go.2gis.com/abc", redirect({ "https://go.2gis.com/abc": { status: 301, location: "https://2gis.kg/bishkek/firm/1?m=74.6%2C42.8%2F17" } }));
    assert.ok(r.ok);
    near(r.coords?.lat, 42.8);
  });
  await check("a redirect to any other site is never requested", async () => {
    const requested: string[] = [];
    const r = await resolveMapLink("google", "https://maps.app.goo.gl/evil", async (url) => {
      requested.push(url);
      return { status: 302, headers: { get: () => "http://169.254.169.254/latest/meta-data" } };
    });
    assert.deepEqual(requested, ["https://maps.app.goo.gl/evil"]);
    assert.ok(r.ok && r.coords === null);
  });
  await check("an endless redirect loop stops, and a network failure still keeps the link", async () => {
    let calls = 0;
    const loop = await resolveMapLink("google", "https://maps.app.goo.gl/loop", async () => {
      calls += 1;
      return { status: 302, headers: { get: () => "https://maps.app.goo.gl/loop" } };
    });
    assert.ok(loop.ok && loop.coords === null && calls <= 5);
    const down = await resolveMapLink("twogis", "https://go.2gis.com/down", async () => { throw new Error("offline"); });
    assert.ok(down.ok && down.coords === null && down.url === "https://go.2gis.com/down");
  });

  if (process.exitCode) process.exit(1);
  console.log(`\nAll map link checks passed (${passed})`);
}
main();
