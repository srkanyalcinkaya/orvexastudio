declare module "postcodesio-client" {
  type LookupResult = {
    admin_district?: string;
    admin_county?: string;
    region?: string;
    country?: string;
  };

  export default class PostcodesIO {
    constructor(hostURL?: string, opts?: unknown);
    lookupPostcode(postcode: string): Promise<LookupResult | null>;
  }
}
