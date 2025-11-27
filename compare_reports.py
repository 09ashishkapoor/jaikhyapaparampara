import json
import os

def analyze_report(filename):
    """Analyze a Lighthouse report"""
    with open(filename, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    scores = {}
    for category in ['performance', 'accessibility', 'best-practices', 'seo']:
        if category in data['categories']:
            scores[category] = int(data['categories'][category]['score'] * 100)
    
    # Get performance metrics
    metrics = {}
    for key in ['first-contentful-paint', 'largest-contentful-paint', 'speed-index', 'total-blocking-time', 'cumulative-layout-shift']:
        if key in data['audits']:
            metrics[key] = data['audits'][key].get('displayValue', 'N/A')
    
    return scores, metrics

# Compare both reports
print("LIGHTHOUSE AUDIT COMPARISON")
print("=" * 60)

files = {
    'Before Optimization': 'lighthouse-report.json',
    'After Optimization': 'lighthouse-report-after.json'
}

results = {}
for label, filename in files.items():
    if os.path.exists(filename):
        scores, metrics = analyze_report(filename)
        results[label] = (scores, metrics)
        print(f"\n{label} ({filename})")
        print("-" * 60)
        print("SCORES:")
        for cat, score in scores.items():
            print(f"  {cat.upper():20} {score}/100")
        print("\nMETRICS:")
        print(f"  First Contentful Paint:  {metrics.get('first-contentful-paint')}")
        print(f"  Largest Contentful Paint: {metrics.get('largest-contentful-paint')}")
        print(f"  Speed Index:             {metrics.get('speed-index')}")
        print(f"  Total Blocking Time:     {metrics.get('total-blocking-time')}")
        print(f"  Cumulative Layout Shift: {metrics.get('cumulative-layout-shift')}")

# Show improvements
if len(results) == 2:
    print("\n" + "=" * 60)
    print("IMPROVEMENTS")
    print("=" * 60)
    
    before_scores, before_metrics = list(results.values())[0]
    after_scores, after_metrics = list(results.values())[1]
    
    perf_before = before_scores.get('performance', 0)
    perf_after = after_scores.get('performance', 0)
    
    print(f"\nPerformance Score:")
    print(f"  Before: {perf_before}/100")
    print(f"  After:  {perf_after}/100")
    print(f"  Change: {perf_after - perf_before:+d} points ({((perf_after - perf_before) / perf_before * 100 if perf_before > 0 else 0):+.1f}%)")

