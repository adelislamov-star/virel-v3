import os

# ????? ??? visibility ???????? ? UI — ????? ?????? ????? ?????
files_to_check = [
    r'C:\Virel\src\app\admin\models\new\page.tsx',
    r'C:\Virel\src\components\models\tabs\BasicInfoTab.tsx',
    r'C:\Virel\src\app\admin\models\[id]\page.tsx',
    r'C:\Virel\src\app\admin\models\page.tsx',
]

for f in files_to_check:
    with open(f, "r", encoding="utf-8") as fh:
        content = fh.read()
    remaining = [line for line in content.split("\n") if "visibility" in line.lower()]
    if remaining:
        print(f"\nSTILL HAS visibility: {f}")
        for l in remaining:
            print(f"  {l.strip()}")
    else:
        print(f"CLEAN: {f}")
