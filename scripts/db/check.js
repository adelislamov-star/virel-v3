const {PrismaClient}=require('@prisma/client');
const p=new PrismaClient();
p.("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name")
.then(r=>{r.forEach(x=>process.stdout.write(x.table_name+'\n'));return p.();})
.catch(e=>{process.stderr.write(e.message);return p.();});
