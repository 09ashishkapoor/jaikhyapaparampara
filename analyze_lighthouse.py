import json

with open('lighthouse-report.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print('LIGHTHOUSE AUDIT RESULTS')
print('=' * 50)
print()
print('SCORES:')
print('-' * 30)
for category in ['performance', 'accessibility', 'best-practices', 'seo']:
    if category in data['categories']:
        score = int(data['categories'][category]['score'] * 100)
        print(f'{category.upper():20} {score}/100')

print()
print('TOP FAILING AUDITS (Score = 0):')
print('-' * 30)

# Collect failing audits
failing = []
for audit_id, audit in data['audits'].items():
    if audit.get('score') == 0 and audit.get('scoreDisplayMode') not in ['notApplicable', 'informative']:
        failing.append({
            'title': audit.get('title'),
            'id': audit_id,
        })

# Show top failing audits
for i, audit in enumerate(failing[:20], 1):
    print(f'{i}. {audit["title"]}')

print()
print()
print('KEY PERFORMANCE METRICS:')
print('-' * 30)
metrics = {
    'first-contentful-paint': 'First Contentful Paint',
    'largest-contentful-paint': 'Largest Contentful Paint',
    'speed-index': 'Speed Index',
    'total-blocking-time': 'Total Blocking Time',
    'cumulative-layout-shift': 'Cumulative Layout Shift'
}

for key, label in metrics.items():
    if key in data['audits']:
        audit = data['audits'][key]
        value = audit.get('displayValue', 'N/A')
        print(f'{label:30} {value}')

