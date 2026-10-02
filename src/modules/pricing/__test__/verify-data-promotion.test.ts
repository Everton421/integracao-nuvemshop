import { VerifyDatePromotion } from "../utils/verify-date-promotion.ts"
import describe, { test }  from 'node:test';
import assert from 'node:assert';

describe("(test) verifyDatePromotion ", ()=>{

    test.it("(test) verify  ", ()=>{
        const verifyDatePromotion = new VerifyDatePromotion();
         const result= verifyDatePromotion.verify('2026-05-07','2025-05-17' );
         assert.strictEqual(result, false)
    })

})