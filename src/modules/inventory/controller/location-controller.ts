import { type Request, type Response } from "express";
import { GetLocation } from "./service/get-location-service.ts";
import { LocaisIntegration } from "./repository/locais-integration-repository.ts";

type Locations =
    {
        locations: {
            edges: [
                {
                    node: {
                        id: string,
                        name: string,
                        address: {
                            formatted: [
                                string
                            ]
                        }
                    }
                }
            ]
        }
    }

export class LocationController {

    async getAll(req: Request, res: Response) {
        const getLocation = new GetLocation();
        const locaisIntegration = new LocaisIntegration();

        const result = await getLocation.getAllLocation();
        if (result?.sucess === false) {
            return res.status(400).json(result.message)

        }
        return res.status(200).json(result?.message)

    }
}