
import describe, { test } from 'node:test';

import { getImageOldSite } from '../services/get-photos-old-site-service.ts';

    test.it( " (test) getImageOldSite ",async ()=>{
        
            const result = await getImageOldSite(53565)
            console.log(result)
        })