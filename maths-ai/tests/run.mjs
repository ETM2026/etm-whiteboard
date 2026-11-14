import {spawnSync} from 'node:child_process';
for(const file of ['auth.test.mjs','maths-core.test.mjs','tutor-budget.test.mjs','tutor-vision.test.mjs','worker.test.mjs','dad-test.test.mjs','tutor-client.test.mjs']){const r=spawnSync(process.execPath,['--experimental-strip-types','tests/'+file],{stdio:'inherit'});if(r.status!==0)process.exit(r.status||1);}

