import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { HaravanAPIService } from 'src/haravan/haravan.api';

@Injectable()
export class MetafieldService {
  constructor(private readonly haravanAPI: HaravanAPIService) { }
  async getMetafields(token: string, type: string, namespace: string, objectid: string) {
    if (!token) throw new UnauthorizedException();
    if (!type) throw new BadRequestException("Type is required");
    if (!namespace) throw new BadRequestException("Namespace is required");
    if (!objectid) throw new BadRequestException("Object ID is required");
    return await this.haravanAPI.getMetafields(token, type, namespace, objectid);
  }

  async createMetafields(token: string, values) {
    if (!token) throw new UnauthorizedException();
    return await this.haravanAPI.createMetafields(token, values);
  }
  async updateMetafields(token: string, values) {
    if (!token) throw new UnauthorizedException();
    return await this.haravanAPI.updateMetafields(token, values);
  }

  async deleteMetafields(token: string, metafieldid: string) {
    if (!token) throw new UnauthorizedException();
    return await this.haravanAPI.deleteMetafields(token, metafieldid);
  }
}
