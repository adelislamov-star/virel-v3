@echo off
cd /d C:\Virel
echo === Seeding Category Content === >> seed_all_result.txt 2>&1
call node_modules\.bin\tsx.cmd src/scripts/seedCategoryContent.ts >> seed_all_result.txt 2>&1
echo === Seeding District Content === >> seed_all_result.txt 2>&1
call node_modules\.bin\tsx.cmd src/scripts/seedDistrictContent.ts >> seed_all_result.txt 2>&1
echo === Seeding Blog Posts === >> seed_all_result.txt 2>&1
call node_modules\.bin\tsx.cmd src/scripts/seedBlogPosts.ts >> seed_all_result.txt 2>&1
echo === ALL DONE === >> seed_all_result.txt 2>&1
