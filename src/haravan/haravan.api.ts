import { BadRequestException } from '@nestjs/common/exceptions';
import { Injectable } from '@nestjs/common';
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

  async getMetafields(token: string, type: string, namespace: string) {   
    if (!token) throw new BadRequestException("Token is required");
    if (!type) throw new BadRequestException("Type is required");
    if (!namespace) throw new BadRequestException("Namespace is required");

    const response = await axios.get(`https://apis.haravan.com/com/metafields.json?owner_resource=${type}&namespace=${namespace}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.data || !response.data.metafields) throw new BadRequestException("Failed to fetch metafields");
    return response.data.metafields;
  }

  async createMetafields(token: string, values) {
    if (!token) throw new BadRequestException("Token is required");
    const response = await axios.post(`https://apis.haravan.com/com/metafields.json?owner_resource=${values.type}`, {
      metafield: {
        namespace: "store.faqs.data",
        key: 'Chính sách đổi trảzzz',
        value: JSON.stringify(values),
        value_type: "json"
      }
    }, {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    });
    
    if (!response.data || !response.data.metafield) throw new BadRequestException("Failed to create metafield");
    return response.data.metafield;
  }

  async updateMetafields(token: string, values: { objectID: string, type: string, metafieldID: string, values: any }) {
    if (!token) throw new BadRequestException("Token is required");
    
    const response = await axios.put(`https://apis.haravan.com/com/metafields/${values.type}/${values.objectID}.json`, {
      metafield: {
        id: values.metafieldID,
        value: values.values,
        value_type: "json"
      }
    }, {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    });
    
    if (!response.data || !response.data.metafield) throw new BadRequestException("Failed to update metafield");
    return response.data.metafield;
  }
}