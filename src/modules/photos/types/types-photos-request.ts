

export type NuvemshopPhotoResponse =
{
  id: number,
  product_id: number,
  src: string,
  position: number,
  alt: any[],
  height: number,
  width: number,
  thumbnails_generated: number,
  created_at: string,
  updated_at: string,
  store_media_uuid: null | string
}

export type typePayloadPostPhoto = {
	 src?:string // link da imagen
     attachment?:string //base64 da imagen
     filename:string
     position:number
}

