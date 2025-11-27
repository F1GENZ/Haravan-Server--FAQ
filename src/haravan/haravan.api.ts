import { BadRequestException } from '@nestjs/common/exceptions';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import axios from 'axios';
import { console } from 'inspector';

@Injectable()
export class HaravanAPIService {
  constructor(private readonly configService: ConfigService) { }

  async subscribeWebhook(access_token) {
    const subscribeHook = await axios.post("https://webhook.haravan.com/api/subscribe", {}, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`
      }
    });
    if (!subscribeHook.data) throw new BadRequestException("Failed to subscribe to webhooks");
    return "Webhook subscribed successfully";
  }

  async unsubscribeWebhook(access_token) {
    const unsubscribeHook = await axios.post("https://webhook.haravan.com/api/unsubscribe", {}, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`
      }
    });
    if (!unsubscribeHook.data) throw new BadRequestException("Failed to unsubscribe from webhooks");
    return "Webhook unsubscribed successfully";
  }

  async getScriptTags(access_token) {
    const response = await axios.get("https://apis.haravan.com/web/script_tags.json?src=" + this.configService.get('HRV_URL_SCRIPT_TAGS'), {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });
    if (!response.data || !response.data.script_tags) throw new BadRequestException("Failed to fetch script tags");
    return response.data.script_tags[0];
  }

  async importScriptTags(access_token) {
    const existingTags = await this.getScriptTags(access_token);
    if (existingTags && existingTags.id) {
      return existingTags; // Script tag already exists, no need to create a new one
    } else {
      const response = await axios.post("https://apis.haravan.com/web/script_tags.json", {
        script_tag: {
          event: "onload",
          src: this.configService.get('HRV_URL_SCRIPT_TAGS'),
        },
      }, {
        headers: { 'Authorization': `Bearer ${access_token}` }
      });
      if (!response.data || !response.data.script_tag) throw new BadRequestException("Failed to create script tag");
      return response.data.script_tag;
    }
  }

  async deleteScriptTags(access_token, script_tag_id) {
    const response = await axios.delete(`https://apis.haravan.com/web/script_tags/${script_tag_id}.json`, {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });
    if (!response.data) throw new BadRequestException("Failed to delete script tag");
    return "Script tag deleted successfully";
  }

  async getRates() {
    const responseRates = await axios.get("https://openexchangerates.org/api/latest.json?app_id=7256385e23e346c09a23d7fce419a954");
    if (!responseRates.data || !responseRates.data.rates) throw new BadRequestException("Failed to fetch exchange rates");
    return responseRates.data.rates;
  }

  async importMetafieldsRates(access_token) {
    const rates = await this.getRates();
    const responseMetafields = await axios.post("https://apis.haravan.com/com/metafields.json", {
      metafields: {
        namespace: "currency",
        key: "rates",
        value: JSON.stringify(rates),
        value_type: "json"
      }
    }, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!responseMetafields.data) throw new BadRequestException("Failed to import metafields");
    return true;
  }

  async getMetafields(token: string, type: string, namespace: string, objectid: string) {
    if (!token) throw new BadRequestException("Token is required");
    if (!type) throw new BadRequestException("Type is required");
    if (!namespace) throw new BadRequestException("Namespace is required");
    if (!objectid) throw new BadRequestException("Object ID is required");

    let queryString = "";
    switch (type) {
      case "shop":
        queryString = `https://apis.haravan.com/com/metafields.json?owner_resource=shop&namespace=store.faqs.data`;
        break;
      default:
        queryString = `https://apis.haravan.com/com/metafields.json?owner_id=${objectid}&namespace=store.faqs.data`;
        break;
    }

    const response = await axios.get(
      queryString,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    if (!response.data || !response.data.metafields) throw new BadRequestException("Failed to fetch metafields");
    return response.data.metafields;
  }

  async createMetafields(token: string, values) {
    if (!token) throw new BadRequestException("Token is required");
    const { type, objectid } = values;
    const metafield = {
      namespace: "store.faqs.data",
      key: values.key,
      value: JSON.stringify(values),
      value_type: "json"
    };
    let queryString = "";
    switch (values.type) {
      case "shop":
        queryString = `https://apis.haravan.com/com/metafields.json?owner_resource=shop`;
        break;
      default:
        queryString = `https://apis.haravan.com/com/${type}/${objectid}/metafields.json`;
        break;
    }
    const response = await axios.post(
      queryString,
      { metafield: metafield },
      { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );
    if (!response.data || !response.data.metafield) throw new BadRequestException("Failed to create metafield");
    return response.data.metafield;
  }

  async updateMetafields(token: string, values) {
    if (!token) throw new BadRequestException("Token is required");
    const { type, objectid, metafieldid } = values;
    const metafield = {
      value: JSON.stringify(values),
      value_type: 'json',
    }
    const response = await axios.put(
      `https://apis.haravan.com/com/metafields/${metafieldid}.json`,
      { metafield: metafield },
      { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );

    if (!response.data || !response.data.metafield) throw new BadRequestException("Failed to update metafield");
    return response.data.metafield;
  }

  async deleteMetafields(token: string, metafieldid: string) {
    if (!token) throw new BadRequestException("Token is required");
    const response = await axios.delete(`https://apis.haravan.com/com/metafields/${metafieldid}.json`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.data) throw new BadRequestException("Failed to delete metafield");
    return response.data;
  }

  async searchProducts(token: string, query: string, limit: number = 10) {
    if (!token) throw new BadRequestException("Token is required");
    if (!query || query.trim() === '') {
      return { products: [] };
    }

    const searchQuery = encodeURIComponent(query.trim());
    const url = `https://apis.haravan.com/com/products.json?query=${searchQuery}&limit=${limit}&fields=id,title,handle,images,variants`;
    
    try {
      const response = await axios.get(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.data || !response.data.products) {
        return { products: [] };
      }
      
      // Format products for easier use
      const products = response.data.products.map((product: any) => ({
        id: product.id,
        title: product.title,
        handle: product.handle,
        image: product.images && product.images.length > 0 ? product.images[0].src : null,
        price: product.variants && product.variants.length > 0 ? product.variants[0].price : null,
      }));
      
      return { products };
    } catch (error) {
      console.error('Error searching products:', error);
      return { products: [] };
    }
  }
}