export  interface responseErrorIntelipost   {

          status : "error" | "ERROR",
   messages : [
    {
       type :  string ,
       text :  string ,
       key :  string 
    },
  ],
  
   time?: string ,
     timezone? :  string ,
     locale?:  string 
}