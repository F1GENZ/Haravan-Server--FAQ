import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { HaravanAPIService } from 'src/haravan/haravan.api';

@Injectable()
export class MetafieldService {
  constructor(private readonly haravanAPI: HaravanAPIService) { }
  async getMetafields(token: string, type: string, namespace: string) {
    if (!token) throw new UnauthorizedException();
    if (!type) throw new BadRequestException("Type is required");
    if (!namespace) throw new BadRequestException("Namespace is required");


    console.log("Fetching metafields for type:", type, "and namespace:", namespace); 
    return await this.haravanAPI.getMetafields(token, type, namespace);
  }

  async createMetafields(token: string, values) {
    if (!token) throw new UnauthorizedException();
    return await this.haravanAPI.createMetafields(token, values);
  }
  async updateMetafields(token: string, values: { objectID: string, type: string, metafieldID: string, values: any }) {
    if (!token) throw new UnauthorizedException();
    return await this.haravanAPI.updateMetafields(token, values);
  }
}
