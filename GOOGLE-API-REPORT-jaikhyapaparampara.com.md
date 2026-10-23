# Google PageSpeed & Core Web Vitals — jaikhyapaparampara.com

Measured 22 October 2026, ~22:24 UTC. URL: https://jaikhyapaparampara.com/

| Metric | Mobile Lighthouse lab | Desktop Lighthouse lab | CrUX field (origin, all devices) |
|---|---:|---:|---:|
| Performance score | 65/100 | 93/100 | — |
| LCP | 6.8 s — Poor | 1.3 s — Good | 1.286 s p75 — Good |
| CLS | 0.125 — Needs improvement | 0.026 — Good | 0.00 p75 — Good |
| INP | Not available in lab | Not available in lab | Not returned |
| FCP | 2.9 s | 0.7 s | 1.217 s p75 — Good |
| TBT (lab only) | 30 ms | 140 ms | — |

CrUX collection window: **23 September–20 October 2026**. The CrUX query for the homepage uses **origin-level** data aggregated across all device types. PSI also returned mobile **URL-level CLS p75 0.04 (Good)**, while mobile LCP was only available at origin level in PSI. Because INP is absent, a complete Core Web Vitals pass/fail verdict is **not possible**. Lighthouse is a point-in-time synthetic test, not field data. Mobile lab LCP warrants investigation despite good aggregated field LCP; mobile Lighthouse estimated ~600 ms savings from reducing unused JavaScript. Accessibility 100, best practices 92 and SEO 100 in both lab runs.

Full sampled audit: [FULL-AUDIT-REPORT.md](FULL-AUDIT-REPORT.md). No production code changed.
