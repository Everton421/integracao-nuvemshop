
import { test } from 'node:test';
import { DowloadImage } from '../services/dowload-photo.ts';
import { CompareHash } from '../utils/compare-hash.ts';


test.it(" ( test ) ComparePhotos  photo1 != photo2 ", async () => {

       const dowloadImage = new DowloadImage();
         const phto1 = await dowloadImage.dowload("https://iili.io/qAdOiTN.jpg");
         const phto2 = await dowloadImage.dowload("https://iili.io/qAdOD4s.jpg");
    if( phto1 && phto2){
    const comparePhotos= new  CompareHash();
        const resultCompare = comparePhotos.compare(phto1 , phto2);
        console.log(resultCompare);
    }
})


test.it(" ( test ) ComparePhotos  photo1 == photo2 ", async () => {

       const dowloadImage = new DowloadImage();
         const phto1 = await dowloadImage.dowload("https://iili.io/qAdOiTN.jpg");
         const phto2 = await dowloadImage.dowload("https://iili.io/qAdOiTN.jpg");
    if( phto1 && phto2){
    const comparePhotos= new  CompareHash();
        const resultCompare = comparePhotos.compare(phto1 , phto2);
        console.log(resultCompare);
    }
})