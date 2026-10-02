
import { test } from 'node:test';

import { getImagesService } from '../services/get-all-photos-service.ts';

test.it(" (test) getImagesService ", async () => {

    const result = await getImagesService(427)
    console.log(result)
})