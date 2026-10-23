# SEO action plan — jaikhyapaparampara.com

Audit date: 22 October 2026. Evidence and limitations: [FULL-AUDIT-REPORT.md](FULL-AUDIT-REPORT.md).

| Priority | Action | Verification |
|---|---|---|
| High | Segment GSC indexation and traffic for `/tags/` URLs. Review single-article tags first; consolidate redundant taxonomy or `noindex` only genuinely low-value pages, **after checking internal links and search traffic**. Update sitemap accordingly. | Compare indexed/eligible counts and clicks by URL group before/after; spot-inspect affected URLs. Do not mass-remove 2,248 tags from one sample. |
| Medium | Improve pages answering `bhadrakali`, `krishnananda agamavagisha`, and `batuka bhairava brahma kavacham` queries using the matching GSC query intent; add descriptive internal links where helpful. | Compare query/page clicks, impressions, CTR and positions after several weeks (GSC data lags). |
| Medium | Investigate homepage mobile lab LCP (6.8 s) and ~600 ms unused JavaScript opportunity; test key article templates too. The API key is now configured. | Rerun PSI mobile after changes; compare with CrUX origin LCP and CLS separately. INP field data was unavailable, so do not claim a full CWV pass. |
| Medium — Fixed | Paginated newest-first and A–Z article archives now have distinct meta descriptions. | Build and indexing tests pass; search snippets and performance still need time in GSC after deployment. |
| Low — Fixed | Gallery now has one H1. The lightbox image starts with `alt=""` while empty and receives the image caption as alt text when opened. | Indexing test confirms one H1 and populated lightbox alt text; manual screen-reader check remains. |
| Low | Check whether the old `www` sitemap should remain submitted; retain only current canonical sitemaps if not needed. | GSC sitemap list and canonical/redirect checks. |

The original audit changed no code or index directives. Subsequent fixes updated gallery markup and archive descriptions; index directives remain unchanged.
