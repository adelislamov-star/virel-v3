import os, re

ROOT = r'C:\Virel\src'

# ??? ??????: (??????, ?????)
REPLACEMENTS = [
    # status ????????
    ("status: 'published'", "status: 'active'"),
    ('status: "published"', 'status: "active"'),
    ("status !== 'published'", "status !== 'active'"),
    ("status === 'published'", "status === 'active'"),
    ("model.status !== 'published'", "model.status !== 'active'"),
    ("{ status: 'published' }", "{ status: 'active' }"),

    # visibility ???? ?????
    (", visibility: 'public'", ""),
    ("visibility: 'public',", ""),
    ("visibility: 'public'", ""),
    ("visibility: 'private'", ""),
    ("visibility: body.basicInfo.visibility,", ""),
    ("visibility: body.visibility || 'public',", ""),
    ("visibility: asDraft ? 'private' : form.visibility,", ""),
    ("visibility: form.visibility,", ""),
    ("visibility: model.visibility || 'public',", ""),

    # state machine ?????? ??????? -> ?????
    ("| 'published'", "| 'active'"),
    ("| 'hidden'", "| 'vacation'"),
    ("| 'review'", ""),
    ("review: ['published', 'draft']", "draft: ['active']"),
    ("hidden: ['published', 'archived']", "vacation: ['active', 'draft']"),
    ("published: 'Published'", "active: 'Active'"),

    # status route enum
    ("z.enum(['draft', 'review', 'published', 'hidden', 'archived'])", "z.enum(['draft', 'active', 'vacation', 'archived'])"),
    ("z.enum(['draft', 'review', 'published', 'archived'])", "z.enum(['draft', 'active', 'vacation', 'archived'])"),

    # constants
    ("{ value: 'published', label: 'Active' }", "{ value: 'active', label: 'Active' }"),
    ("{ value: 'hidden', label: 'Hidden' }", "{ value: 'vacation', label: 'Vacation' }"),
    ("{ value: 'review', label: 'Under Review' }", ""),

    # analytics ???????
    ("activeCount = list.filter((m) => m.status === 'published'", "activeCount = list.filter((m) => m.status === 'active'"),

    # admin models page mapping
    ("case 'Active': return 'published'", "case 'Active': return 'active'"),

    # quick-upload
    ("status: 'published',", "status: 'draft',"),
]

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content
    for old, new in REPLACEMENTS:
        content = content.replace(old, new)
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

fixed = []
skipped = []

for dirpath, dirnames, filenames in os.walk(ROOT):
    # ?????????? node_modules ? .next
    dirnames[:] = [d for d in dirnames if d not in ['node_modules', '.next', '.git']]
    for filename in filenames:
        if filename.endswith(('.ts', '.tsx')):
            filepath = os.path.join(dirpath, filename)
            if process_file(filepath):
                fixed.append(filepath.replace(ROOT, ''))
            else:
                skipped.append(filepath.replace(ROOT, ''))

print(f'\nFIXED ({len(fixed)} files):')
for f in fixed:
    print(' ', f)

print(f'\nNO CHANGES ({len(skipped)} files)')
