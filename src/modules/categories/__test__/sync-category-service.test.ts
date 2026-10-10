 import test from 'node:test'
import { seed } from '../../../database/seed.ts'
import { CategoryServiceFactory } from '../category-service-factory.ts'
import { delay } from '../../../shared/utils/delay.ts';
 
 
 test('mapeia grupo sem parent', async  () => {
     //const payload = MappingCategoryToPost.mappCategory(categoria())


     await seed();
  
       const createCategoryService = CategoryServiceFactory.createCategoryService();
  
          
      try {
        
          const categrories = [2 , 6 , 12 , 15 ];

          const subcategories  = [
            21,
            22,
            59,
            179,
            208,
            210,
            216,
            222,
            223,
            224,
            227,
            240,
            262,
            264,
            300,
            307,
            308,
            309,
            310,
            324,
            326,
            327,
            328,
            329,
            331,
            334,
            335,
            336,
            352,
            353,
            354,
            355,
            356,
            357,
            360,
            374,
            379,
            383,
            387,
            394,
            400,
            458,
            486,
            487,
            488,
            489,
            504,
            536,
            545,
            579,
            590 
          ];

             console.log(`[!] Enviando ${categrories.length} categorias`)

          for(const category of categrories ){
            await delay(1000)
             const resultDataCreateCategory = await createCategoryService.syncCategory( category  );
             console.log(resultDataCreateCategory)
          }

             console.log(`[!] Enviando ${categrories.length} subcategorias`)
          for(const subCategory of subcategories ){
            await delay(1000)
            const resultDataCreateCategory = await createCategoryService.syncSubCategory( subCategory  )
             console.log(resultDataCreateCategory)
          }


        
    } catch (error) {
        console.log(error)
      }
  

 })
  
