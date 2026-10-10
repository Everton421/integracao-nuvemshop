import { type typePayloadPostPhoto } from "./types/types-photos-request.ts";

export  class PhotosMapping{
    mapp (position:number, filename:string, link?:string, base64?:string){
        let data: typePayloadPostPhoto={
            filename: filename,
            position:position,
        }
        if(link){
            data.src = link;
        }
        if(base64){
            data.attachment = base64;
        }
        return data;
    }
}