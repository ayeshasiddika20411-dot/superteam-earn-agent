import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = process.env.SUPERTEAM_BASE_URL || 'https://superteam.fun';
const API_KEY = process.env.SUPERTEAM_API_KEY;

export interface Listing {
  id: string;
  title: string;
  slug: string;
  type: 'bounty' | 'project' | 'hackathon';
  rewardAmount?: number;
  token?: string;
  agentAccess?: 'AGENT_ALLOWED' | 'AGENT_ONLY';
  skills?: string[];
  description?: string;
  deadline?: string;
}

export class SuperteamClient {
  private static getHeaders() {
    if (!API_KEY) {
      throw new Error('SUPERTEAM_API_KEY is missing in .env! Run "npm run register" first.');
    }
    return {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    };
  }

  // লাইভ এজেন্ট-এলিজিবল বাউন্টি/প্রজেক্ট ফেচ করা
  static async getLiveListings(take = 20, type?: string): Promise<Listing[]> {
    let url = `${BASE_URL}/api/agents/listings/live?take=${take}`;
    if (type) url += `&type=${type}`;

    const res = await fetch(url, { headers: this.getHeaders() });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to fetch listings (${res.status}): ${err}`);
    }
    const data = await res.json();
    return Array.isArray(data) ? data : (data.listings || []);
  }

  // লিস্টিংয়ের বিস্তারিত বিবরণ সংগ্রহ করা
  static async getListingDetails(slug: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/agents/listings/details/${slug}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to fetch details for ${slug}`);
    return await res.json();
  }

  // সাবমিশন পাঠানো
  static async submitWork(payload: {
    listingId: string;
    link: string;
    otherInfo: string;
    telegram: string;
    eligibilityAnswers?: { question: string; answer: string }[];
  }) {
    const res = await fetch(`${BASE_URL}/api/agents/submissions/create`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Submission failed: ${err}`);
    }
    return await res.json();
  }
}
