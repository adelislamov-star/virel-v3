@echo off
cd /d C:\Virel
del /q seed_prod_result.txt 2>nul

echo === Seeding Category Content (existing 10) === >> seed_prod_result.txt 2>&1
call node_modules\.bin\tsx.cmd src/scripts/seedCategoryContent.ts >> seed_prod_result.txt 2>&1

echo === Seeding Category Content Full (remaining) === >> seed_prod_result.txt 2>&1
call node_modules\.bin\tsx.cmd src/scripts/seedCategoryContentFull.ts >> seed_prod_result.txt 2>&1

echo === Seeding District Content Full (remaining) === >> seed_prod_result.txt 2>&1
call node_modules\.bin\tsx.cmd src/scripts/seedDistrictContentFull.ts >> seed_prod_result.txt 2>&1

echo === ALL DONE === >> seed_prod_result.txt 2>&1
