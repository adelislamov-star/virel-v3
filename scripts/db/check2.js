const {PrismaClient}=require('@prisma/client');
const p=new PrismaClient();
p.service.findMany({select:{slug:true}})
.then(r=>{require('fs').writeFileSync('C:/Virel/tmp_services.json', JSON.stringify(r));return p.();})
.catch(e=>{require('fs').writeFileSync('C:/Virel/tmp_services.json', e.message);return p.();});
