
import describe, { test } from 'node:test';
import { DowloadImage } from '../services/dowload-photo.ts';

import assert from 'node:assert';

    test.it( " dowload-image",async ()=>{
        const dowloadImage = new DowloadImage();
       const result = await dowloadImage.dowload("https://iili.io/qAdONTB.jpg");
        assert.ok(result, "O dowload falhou! ")
         assert.strictEqual(typeof result, 'string');
    })