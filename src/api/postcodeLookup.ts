interface PostcodeApiResponse {
  status: number;
  result: {
    postcode: string;
    latitude: number;
    longitude: number;
    admin_district: string;
    admin_county: string;
    country: string;
    region: string;
  };
}

export interface PostcodeData {
  postcode: string;
  latitude: number;
  longitude: number;
  area: string;
  district: string;
}

export async function checkPostcodeExists(postcode: string): Promise<boolean> {
  const formatted = postcode.replace(/\s/g, '');
  try {
    const res = await fetch(`https://api.postcodes.io/postcodes/${formatted}`);
    if (!res.ok) return false;
    const data = await res.json();
    return data.status === 200;
  } catch (err) {
    console.error('Postcode lookup failed:', err);
    return false;
  }
}

export async function getPostcodeData(postcode: string): Promise<PostcodeData | null> {
  const formatted = postcode.replace(/\s/g, '');
  try {
    const res = await fetch(`https://api.postcodes.io/postcodes/${formatted}`);
    if (!res.ok) return null;
    const data: PostcodeApiResponse = await res.json();
    
    if (data.status === 200) {
      return {
        postcode: data.result.postcode,
        latitude: data.result.latitude,
        longitude: data.result.longitude,
        area: data.result.admin_county || data.result.region,
        district: data.result.admin_district
      };
    }
    return null;
  } catch (err) {
    console.error('Postcode data lookup failed:', err);
    return null;
  }
} 