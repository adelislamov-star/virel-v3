@echo off
cd /d C:\Virel
echo === Seeding Categories === > seed_all_result2.txt 2>&1
call node_modules\.bin\tsx.cmd src/scripts/seedCategories.ts >> seed_all_result2.txt 2>&1
echo === Seeding Category Content === >> seed_all_result2.txt 2>&1
call node_modules\.bin\tsx.cmd src/scripts/seedCategoryContent.ts >> seed_all_result2.txt 2>&1
echo === ALL DONE === >> seed_all_result2.txt 2>&1
