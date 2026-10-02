
import { test } from 'node:test';

import { getImageOldSite } from '../services/get-photos-old-site-service.ts';
import { getImagePostgres } from '../services/get-link-photos-postgres-service.ts';

test.it(" (test) getImagePostgres ", async () => {

    const result = await getImagePostgres(427)
    console.log(result)
})