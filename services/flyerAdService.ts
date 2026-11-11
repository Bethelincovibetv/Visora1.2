import { GoogleGenAI, Type } from '@google/genai';

export interface FlyerItem {
  name: string;
  price: string;
  icon?: string;
  tag?: string;
}

export interface FlyerPerson {
  name: string;
  role: string;
  photoUrl?: string;
  box2d?: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-1000 normalized
}

export interface FlyerPayment {
  provider: string;
  accountNumber: string;
  accountName: string;
  instructions?: string;
}

export interface FlyerContact {
  phone: string;
  website: string;
  email: string;
  address: string;
}

export interface ExtractedFlyerData {
  businessName: string;
  tagline: string;
  headline: string;
  subheadline: string;
  offer: string;
  currency: string;
  items: FlyerItem[];
  benefits: string[];
  people: FlyerPerson[];
  payment: FlyerPayment;
  contact: FlyerContact;
  cta: string;
  brandColors: string[]; // hex codes
  notes: string[]; // fields unreadable or missing
  logoBox2d?: [number, number, number, number];
}

export interface FlyerSceneElement {
  type: 'text' | 'card' | 'badge' | 'benefit' | 'person' | 'payment' | 'cta' | 'logo' | 'image';
  text?: string;
  subtext?: string;
  price?: string;
  icon?: string;
  imageUrl?: string;
  x?: number;
  y?: number;
  scale?: number;
  animation?: 'pop' | 'slide-up' | 'slide-right' | 'fade' | 'pulse';
}

export interface FlyerScene {
  id: string;
  title: string;
  start: number;
  end: number;
  type: 'hook' | 'title' | 'items' | 'price' | 'benefits' | 'people' | 'payment' | 'tagline';
  elements: FlyerSceneElement[];
  entranceAnimation: 'pop' | 'slide' | 'fade' | 'zoom';
  sfxCues: Array<{ time: number; type: 'whoosh' | 'pop' | 'ding' | 'riser' | 'impact' | 'tick' | 'shimmer' }>;
  musicMood: 'mysterious' | 'hopeful' | 'triumphant' | 'energetic' | 'corporate';
}

export interface FlyerStoryboard {
  totalDuration: number;
  aspectRatio: '9:16' | '16:9' | '1:1';
  scenes: FlyerScene[];
  scriptVoiceover: string;
}

export interface FlyerAdPreset {
  id: string;
  name: string;
  category: string;
  description: string;
  data: ExtractedFlyerData;
}

// ============================================================================
// SAMPLE PRESETS (FOR 1-CLICK INSTANT TESTING WITHOUT UPLOADING)
// ============================================================================

export const FLYER_AD_PRESETS: FlyerAdPreset[] = [
  {
    id: 'preset_tech_bootcamp',
    name: 'DevLaunch Nigeria 2026 Bootcamp',
    category: 'Education & Tech',
    description: 'Tech coding flyer with ₦ currency, course tracks, instructors & bank transfer',
    data: {
      businessName: 'DevLaunch Academy',
      tagline: 'Code Your Future, Lead the Tech Wave',
      headline: 'Full-Stack AI & Web3 Accelerator 2026',
      subheadline: '8 Weeks Intensive Hands-On Training with Top Silicon Valley & Lagos Engineers',
      offer: 'Early Bird 40% Off + Free Laptop for Top 3 Students',
      currency: '₦',
      items: [
        { name: 'Full-Stack React & Node.js', price: '120,000', icon: 'code', tag: 'High Demand' },
        { name: 'AI Engineering & LLM APIs', price: '150,000', icon: 'brain', tag: 'Trending' },
        { name: 'Mobile App Dev (React Native)', price: '110,000', icon: 'mobile', tag: 'Popular' },
        { name: 'Cloud & DevOps Architecture', price: '135,000', icon: 'cloud', tag: 'Certification' }
      ],
      benefits: [
        'Guaranteed Internship Placement',
        'Direct 1-on-1 Mentorship from Senior Engineers',
        'Official Globally Verified Certificate',
        'Access to Exclusive Tech Job Board'
      ],
      people: [
        { name: 'Dr. Chidi Okafor', role: 'Ex-Google Senior Staff Engineer' },
        { name: 'Amara Adeleke', role: 'Head of AI at PayFlow' }
      ],
      payment: {
        provider: 'Zenith Bank',
        accountNumber: '1018892341',
        accountName: 'DevLaunch Technologies Ltd',
        instructions: 'Send proof of payment on WhatsApp to confirm registration slot'
      },
      contact: {
        phone: '+234 803 456 7890',
        website: 'www.devlaunch.africa',
        email: 'admissions@devlaunch.africa',
        address: '14 Admiralty Way, Lekki Phase 1, Lagos'
      },
      cta: 'Register Today — Slots Limited to 30!',
      brandColors: ['#FF5500', '#1E1B4B', '#FFD700', '#0F172A'],
      notes: []
    }
  },
  {
    id: 'preset_real_estate',
    name: 'Eko Atlantic Luxury Haven',
    category: 'Real Estate',
    description: 'Luxury waterfront apartments with flexible payment plans & verified title',
    data: {
      businessName: 'HavenGate Realty',
      tagline: 'Where Opulence Meets the Horizon',
      headline: 'Ultra-Luxury 3-Bedroom Oceanfront Penthouses',
      subheadline: 'Prime Waterfront Living with Smart Home Automation & Private Marina',
      offer: 'Zero Interest 24-Month Installment Plan',
      currency: '₦',
      items: [
        { name: 'Executive 2-Bed Suite', price: '85,000,000', icon: 'building', tag: 'Few Units' },
        { name: 'Royal 3-Bed Ocean View', price: '140,000,000', icon: 'house-chimney', tag: 'Best Seller' },
        { name: 'Skyline Penthouse + Pool', price: '260,000,000', icon: 'gem', tag: 'Ultra Luxury' }
      ],
      benefits: [
        'Governor\'s Consent & C of O Fully Verified',
        '24/7 Clean Solar + Gas Power Backup',
        'Infinity Sky Pool & Helipad Access',
        'Projected 28% Annual Rental Yield'
      ],
      people: [
        { name: 'Babatunde Alabi', role: 'Principal Real Estate Partner' }
      ],
      payment: {
        provider: 'Access Bank',
        accountNumber: '0044918233',
        accountName: 'HavenGate Realty Global Ltd',
        instructions: 'Pay 20% initial deposit to lock current off-plan price'
      },
      contact: {
        phone: '+234 701 988 2345',
        website: 'www.havengate.ng',
        email: 'sales@havengate.ng',
        address: 'Plot 8, Ocean Boulevard, Eko Atlantic, Lagos'
      },
      cta: 'Book a VIP Site Inspection Now',
      brandColors: ['#0A2540', '#D4AF37', '#00D4B2', '#061325'],
      notes: []
    }
  },
  {
    id: 'preset_fashion_sale',
    name: 'Zuri Couture Grand Flash Sale',
    category: 'Fashion & E-Commerce',
    description: 'Fashion boutique with designer fabrics, shoes, bags and express delivery',
    data: {
      businessName: 'Zuri Couture',
      tagline: 'Authentic African Elegance Redefined',
      headline: 'Grand 72-Hour Flash Sale: 50% Off Everything',
      subheadline: 'Handcrafted Ready-to-Wear Aso-Eki, Agbada & Modern Silk Collections',
      offer: 'Buy 2 Outfits, Get 1 Matching Handbag Free',
      currency: '₦',
      items: [
        { name: 'Embroidered Royal Agbada Set', price: '45,000', icon: 'shirt', tag: '50% OFF' },
        { name: 'Silk Infinity Maxi Dress', price: '28,000', icon: 'vest', tag: 'Hot' },
        { name: 'Handwoven Leather Clutches', price: '18,500', icon: 'bag-shopping', tag: 'Limited' }
      ],
      benefits: [
        'Premium Grade 100% Breathable Fabrics',
        'Same-Day Delivery Nationwide in Nigeria',
        'Hassle-Free 7-Day Size Exchange',
        'Free Gift Packaging on Every Order'
      ],
      people: [
        { name: 'Zainab Bello', role: 'Creative Director & Founder' }
      ],
      payment: {
        provider: 'Kuda Microfinance Bank',
        accountNumber: '2001948812',
        accountName: 'Zuri Couture Studio',
        instructions: 'Add order name as transfer description'
      },
      contact: {
        phone: '+234 812 777 9900',
        website: 'www.zuricouture.shop',
        email: 'hello@zuricouture.shop',
        address: '22 Allen Avenue, Ikeja, Lagos'
      },
      cta: 'Order on WhatsApp — Sale Ends Sunday!',
      brandColors: ['#E11D48', '#FFB703', '#4C0519', '#1C1917'],
      notes: []
    }
  }
];

// ============================================================================
// GEMINI VISION FLYER EXTRACTION
// ============================================================================

export async function extractFlyerWithGemini(
  imageBase64: string,
  mimeType: string = 'image/jpeg',
  apiKey?: string
): Promise<ExtractedFlyerData> {
  const activeKey =
    apiKey && !apiKey.includes('AIzaSyCBO1PRv5h9aQAB3rWb')
      ? apiKey
      : process.env.GEMINI_API_KEY || process.env.API_KEY || '';

  if (!activeKey) {
    throw new Error('Please provide a valid Gemini API key in your profile or environment.');
  }

  const ai = new GoogleGenAI({ apiKey: activeKey });

  const prompt = `You are "Flyer-to-Video Ad Studio" expert vision model.
Analyze this flyer, poster, or business advertisement image thoroughly.
Extract all exact factual information into structured JSON.

CRITICAL RULES:
1. Never invent facts. Copy prices, business names, phone numbers, email, addresses, bank accounts, and people names EXACTLY as printed.
2. If any field or text is blurred, blacked out, cut off, or missing from the flyer, omit it and document it in the "notes" array.
3. Determine currency symbol (₦, $, £, €, etc.) and extract exact numbers for prices.
4. Extract 2 to 4 dominant brand hex colors visible on the flyer.
5. If people's faces or logos are visible, estimate their 2D bounding box normalized 0-1000 as [ymin, xmin, ymax, xmax].

Output strictly valid JSON matching this schema:
{
  "businessName": "Name of the business or organization",
  "tagline": "Brand tagline or slogan",
  "headline": "Main bold headline of the ad",
  "subheadline": "Secondary subtitle or supporting text",
  "offer": "Discount, promo, or special deal statement",
  "currency": "Currency symbol e.g. ₦ or $",
  "items": [
    { "name": "Item/Course/Service name", "price": "120,000", "icon": "code/tag", "tag": "Badge text if any" }
  ],
  "benefits": [
    "Key benefit or reason to choose them 1",
    "Key benefit 2"
  ],
  "people": [
    { "name": "Person name", "role": "Their role or title" }
  ],
  "payment": {
    "provider": "Bank or payment gateway e.g. Zenith Bank",
    "accountNumber": "Exact account number digits",
    "accountName": "Exact account name on flyer",
    "instructions": "Any payment notes e.g. send receipt to WhatsApp"
  },
  "contact": {
    "phone": "Phone number(s)",
    "website": "Web address",
    "email": "Email address",
    "address": "Physical location/address"
  },
  "cta": "Call to action text e.g. Register Today!",
  "brandColors": ["#FF5500", "#1E1B4B", "#FFD700"],
  "notes": ["List of any fields that were blurred, cut off, or missing"]
}`;

  const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: cleanBase64,
                mimeType: mimeType
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1
      }
    });

    const responseText = response.text || '{}';
    const parsed = JSON.parse(responseText) as ExtractedFlyerData;

    // Sanitize defaults
    if (!parsed.brandColors || parsed.brandColors.length === 0) {
      parsed.brandColors = ['#FF5500', '#0F172A', '#FBBF24'];
    }
    if (!parsed.currency) parsed.currency = '₦';
    if (!parsed.items) parsed.items = [];
    if (!parsed.benefits) parsed.benefits = [];
    if (!parsed.people) parsed.people = [];
    if (!parsed.notes) parsed.notes = [];

    return parsed;
  } catch (err: any) {
    console.error('Gemini vision extraction error:', err);
    throw new Error(
      `Failed to extract flyer data with Gemini: ${err.message || 'Check image format and API key'}`
    );
  }
}

// ============================================================================
// STORYBOARD GENERATION
// ============================================================================

export function buildStoryboardFromData(
  data: ExtractedFlyerData,
  targetDurationSec: number = 35,
  aspectRatio: '9:16' | '16:9' | '1:1' = '9:16'
): FlyerStoryboard {
  const scenes: FlyerScene[] = [];
  let currentTime = 0;

  // 1. Hook Scene (0 - 3.5s)
  const hookDuration = 3.5;
  scenes.push({
    id: 'scene_1_hook',
    title: 'Hook & Audience Callout',
    start: currentTime,
    end: currentTime + hookDuration,
    type: 'hook',
    elements: [
      {
        type: 'text',
        text: data.headline || data.offer || 'Are You Ready for Something Bigger?',
        subtext: data.businessName,
        animation: 'pop'
      }
    ],
    entranceAnimation: 'pop',
    sfxCues: [
      { time: 0.1, type: 'whoosh' },
      { time: 0.8, type: 'impact' }
    ],
    musicMood: 'mysterious'
  });
  currentTime += hookDuration;

  // 2. Title & Offer Scene (3.5 - 7.5s)
  const titleDuration = 4.0;
  scenes.push({
    id: 'scene_2_title',
    title: 'Title, Offer & Delivery',
    start: currentTime,
    end: currentTime + titleDuration,
    type: 'title',
    elements: [
      { type: 'text', text: data.businessName, animation: 'slide-up' },
      { type: 'text', text: data.subheadline || data.headline, animation: 'fade' },
      { type: 'badge', text: data.offer || 'Exclusive Limited Offer', animation: 'pop' }
    ],
    entranceAnimation: 'slide',
    sfxCues: [
      { time: 0.1, type: 'whoosh' },
      { time: 1.5, type: 'shimmer' }
    ],
    musicMood: 'hopeful'
  });
  currentTime += titleDuration;

  // 3. Items / Courses Stack Scene (approx 1.8s per item or packaged)
  if (data.items && data.items.length > 0) {
    const itemsDuration = Math.min(8.0, Math.max(4.0, data.items.length * 1.8));
    scenes.push({
      id: 'scene_3_items',
      title: 'Featured Services & Packages',
      start: currentTime,
      end: currentTime + itemsDuration,
      type: 'items',
      elements: data.items.map((item, idx) => ({
        type: 'card',
        text: item.name,
        price: item.price ? `${data.currency}${item.price}` : '',
        tag: item.tag || `Package 0${idx + 1}`,
        icon: item.icon || 'star',
        animation: 'pop'
      })),
      entranceAnimation: 'pop',
      sfxCues: [
        { time: 0.2, type: 'pop' },
        { time: 1.5, type: 'pop' },
        { time: 3.0, type: 'pop' }
      ],
      musicMood: 'hopeful'
    });
    currentTime += itemsDuration;
  }

  // 4. Price Badge & Value Reveal (approx 3.5s)
  const priceItem = data.items && data.items.length > 0 ? data.items[0] : null;
  if (priceItem || data.offer) {
    const priceDuration = 3.5;
    scenes.push({
      id: 'scene_4_price',
      title: 'Price Badge & Value Counter',
      start: currentTime,
      end: currentTime + priceDuration,
      type: 'price',
      elements: [
        { type: 'text', text: 'INVESTMENT & VALUE', animation: 'slide-up' },
        {
          type: 'badge',
          text: priceItem?.name || data.offer,
          price: priceItem ? `${data.currency}${priceItem.price}` : data.offer,
          animation: 'pop'
        }
      ],
      entranceAnimation: 'zoom',
      sfxCues: [
        { time: 0.1, type: 'riser' },
        { time: 1.0, type: 'impact' },
        { time: 1.5, type: 'tick' }
      ],
      musicMood: 'triumphant'
    });
    currentTime += priceDuration;
  }

  // 5. Why Choose Us (Benefits Ticks ~3.5s)
  if (data.benefits && data.benefits.length > 0) {
    const benefitsDuration = Math.min(5.0, Math.max(3.5, data.benefits.length * 0.9));
    scenes.push({
      id: 'scene_5_benefits',
      title: 'Why Choose Us (Key Benefits)',
      start: currentTime,
      end: currentTime + benefitsDuration,
      type: 'benefits',
      elements: data.benefits.slice(0, 4).map((b, idx) => ({
        type: 'benefit',
        text: b,
        icon: 'circle-check',
        animation: 'slide-right'
      })),
      entranceAnimation: 'slide',
      sfxCues: [
        { time: 0.2, type: 'ding' },
        { time: 1.0, type: 'ding' },
        { time: 1.8, type: 'ding' }
      ],
      musicMood: 'hopeful'
    });
    currentTime += benefitsDuration;
  }

  // 6. People / Team Scene (if present, ~3.0s)
  if (data.people && data.people.length > 0) {
    const peopleDuration = 3.2;
    scenes.push({
      id: 'scene_6_people',
      title: 'Leadership & Facilitators',
      start: currentTime,
      end: currentTime + peopleDuration,
      type: 'people',
      elements: data.people.slice(0, 2).map((p) => ({
        type: 'person',
        text: p.name,
        subtext: p.role,
        animation: 'pop'
      })),
      entranceAnimation: 'pop',
      sfxCues: [
        { time: 0.1, type: 'whoosh' },
        { time: 0.6, type: 'pop' }
      ],
      musicMood: 'hopeful'
    });
    currentTime += peopleDuration;
  }

  // 7. Payment Details + Pulsing Call to Action (MANDATORY: AT LEAST 4.0s per Core Rule 4)
  const paymentDuration = 4.5;
  scenes.push({
    id: 'scene_7_payment',
    title: 'Payment Details & Pulsing CTA',
    start: currentTime,
    end: currentTime + paymentDuration,
    type: 'payment',
    elements: [
      {
        type: 'payment',
        text: data.payment.accountNumber
          ? `${data.payment.provider || 'Bank'} — ${data.payment.accountNumber}`
          : 'Direct Bank Transfer',
        subtext: data.payment.accountName || data.businessName,
        animation: 'pop'
      },
      {
        type: 'cta',
        text: data.cta || 'Enroll Now — Limited Slots!',
        subtext: data.contact.phone || data.contact.website,
        animation: 'pulse'
      }
    ],
    entranceAnimation: 'pop',
    sfxCues: [
      { time: 0.1, type: 'impact' },
      { time: 0.8, type: 'ding' },
      { time: 2.0, type: 'tick' }
    ],
    musicMood: 'energetic'
  });
  currentTime += paymentDuration;

  // 8. Tagline & Contact End Card (3.5s)
  const endDuration = 3.5;
  scenes.push({
    id: 'scene_8_tagline',
    title: 'Official Tagline & Contact End Card',
    start: currentTime,
    end: currentTime + endDuration,
    type: 'tagline',
    elements: [
      { type: 'text', text: data.businessName, animation: 'slide-up' },
      { type: 'text', text: data.tagline || 'Leading Excellence Every Day', animation: 'fade' },
      {
        type: 'text',
        text: `${data.contact.phone ? '📞 ' + data.contact.phone : ''} ${data.contact.website ? '🌐 ' + data.contact.website : ''}`,
        animation: 'fade'
      }
    ],
    entranceAnimation: 'fade',
    sfxCues: [
      { time: 0.1, type: 'shimmer' }
    ],
    musicMood: 'triumphant'
  });
  currentTime += endDuration;

  // Build Voiceover Script from verified facts ONLY (Core Rule 1)
  const voScript = `Attention! ${data.headline || data.businessName}. ${data.subheadline || data.offer || ''} Featuring ${data.items.map(i => i.name).slice(0, 3).join(', ')}. ${data.benefits.length > 0 ? 'Enjoy ' + data.benefits[0] + '.' : ''} ${data.payment.accountNumber ? 'Payment via ' + data.payment.provider + ', account number ' + data.payment.accountNumber + '.' : ''} ${data.cta || 'Get started now!'} Call ${data.contact.phone || 'us today'}.`;

  return {
    totalDuration: Math.round(currentTime * 10) / 10,
    aspectRatio,
    scenes,
    scriptVoiceover: voScript
  };
}

// ============================================================================
// QUALITY CHECK INSPECTOR
// ============================================================================

export interface QualityCheckIssue {
  severity: 'pass' | 'warning' | 'error';
  category: 'text' | 'price' | 'payment' | 'timing' | 'audio';
  message: string;
}

export function runQualityCheck(data: ExtractedFlyerData, storyboard: FlyerStoryboard): QualityCheckIssue[] {
  const issues: QualityCheckIssue[] = [];

  // Check 1: Payment screen timing (Core Rule 4)
  const paymentScene = storyboard.scenes.find(s => s.type === 'payment');
  if (paymentScene) {
    const dur = paymentScene.end - paymentScene.start;
    if (dur >= 4.0) {
      issues.push({
        severity: 'pass',
        category: 'timing',
        message: `Payment & CTA screen displays for ${dur.toFixed(1)}s (exceeds 4.0s minimum requirement).`
      });
    } else {
      issues.push({
        severity: 'error',
        category: 'timing',
        message: `Payment screen is only ${dur.toFixed(1)}s. Must be at least 4.0s.`
      });
    }
  }

  // Check 2: Payment data verification (Core Rule 1)
  if (data.payment.accountNumber) {
    issues.push({
      severity: 'pass',
      category: 'payment',
      message: `Account details verified: ${data.payment.provider} — ${data.payment.accountNumber} (${data.payment.accountName || 'Account Holder'}).`
    });
  } else {
    issues.push({
      severity: 'warning',
      category: 'payment',
      message: 'No bank account number found on flyer. Payment slide will show website or direct call CTA.'
    });
  }

  // Check 3: Contact information
  if (data.contact.phone || data.contact.website || data.contact.email) {
    issues.push({
      severity: 'pass',
      category: 'text',
      message: `Direct contact channels verified: ${[data.contact.phone, data.contact.website, data.contact.email].filter(Boolean).join(' | ')}.`
    });
  } else {
    issues.push({
      severity: 'warning',
      category: 'text',
      message: 'No direct phone or website detected. Consider adding contact details in the confirmation form.'
    });
  }

  // Check 4: Prices
  if (data.items.length > 0 && data.items.some(i => i.price)) {
    issues.push({
      severity: 'pass',
      category: 'price',
      message: `Extracted ${data.items.length} items with exact ${data.currency} pricing.`
    });
  } else {
    issues.push({
      severity: 'warning',
      category: 'price',
      message: 'No specific price tags found on flyer. Video will emphasize the special promotional offer.'
    });
  }

  // Check 5: Total timeline length
  if (storyboard.totalDuration >= 20 && storyboard.totalDuration <= 45) {
    issues.push({
      severity: 'pass',
      category: 'timing',
      message: `Ad length calibrated to ${storyboard.totalDuration}s (optimal short-form video ad duration).`
    });
  }

  return issues;
}
