import { ExtractedFlyerData, FlyerStoryboard, FlyerScene } from '../services/flyerAdService';

export interface RenderAssets {
  flyerImg?: HTMLImageElement | null;
  logoImg?: HTMLImageElement | null;
  peopleImgs?: HTMLImageElement[];
}

export interface RenderConfig {
  aspectRatio: '9:16' | '16:9' | '1:1';
  showCaptions?: boolean;
}

// Deterministic pseudo-random based on seed
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9999.123) * 10000;
  return x - Math.floor(x);
}

// Easing functions
export function easeOutCubic(t: number): number {
  const p = Math.max(0, Math.min(1, t));
  return 1 - Math.pow(1 - p, 3);
}

export function easeBackOut(t: number): number {
  const p = Math.max(0, Math.min(1, t));
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
}

export function easeInOutQuad(t: number): number {
  const p = Math.max(0, Math.min(1, t));
  return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
}

// Measure and draw wrapped / auto-shrinking text
export function drawTextShrink(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  baseSize: number,
  fontFamily: string = 'Poppins, Inter, sans-serif',
  weight: string = '700',
  color: string = '#FFFFFF',
  align: CanvasTextAlign = 'center'
): number {
  ctx.save();
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';

  let currentSize = baseSize;
  ctx.font = `${weight} ${currentSize}px ${fontFamily}`;
  let textWidth = ctx.measureText(text).width;

  while (textWidth > maxWidth && currentSize > 14) {
    currentSize -= 2;
    ctx.font = `${weight} ${currentSize}px ${fontFamily}`;
    textWidth = ctx.measureText(text).width;
  }

  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
  return currentSize;
}

// Vector Icon Drawer (No external fonts or emoji required)
export function drawVectorIcon(ctx: CanvasRenderingContext2D, icon: string, x: number, y: number, size: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, size * 0.1);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const r = size / 2;

  switch (icon) {
    case 'circle-check':
    case 'check':
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-r * 0.45, 0);
      ctx.lineTo(-r * 0.1, r * 0.35);
      ctx.lineTo(r * 0.45, -r * 0.35);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = Math.max(2.5, size * 0.14);
      ctx.stroke();
      break;

    case 'code':
      ctx.beginPath();
      ctx.moveTo(-r * 0.4, -r * 0.4);
      ctx.lineTo(-r * 0.8, 0);
      ctx.lineTo(-r * 0.4, r * 0.4);
      ctx.moveTo(r * 0.4, -r * 0.4);
      ctx.lineTo(r * 0.8, 0);
      ctx.lineTo(r * 0.4, r * 0.4);
      ctx.moveTo(r * 0.2, -r * 0.6);
      ctx.lineTo(-r * 0.2, r * 0.6);
      ctx.stroke();
      break;

    case 'phone':
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-r * 0.35, -r * 0.5, r * 0.7, r * 1.0);
      ctx.clearRect(-r * 0.25, -r * 0.35, r * 0.5, r * 0.6);
      break;

    case 'star':
    default:
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const outerAngle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const ox = Math.cos(outerAngle) * r;
        const oy = Math.sin(outerAngle) * r;
        if (i === 0) ctx.moveTo(ox, oy);
        else ctx.lineTo(ox, oy);
      }
      ctx.closePath();
      ctx.fill();
      break;
  }

  ctx.restore();
}

// ============================================================================
// MAIN DETERMINISTIC RENDER FUNCTION: renderFlyerFrame(t)
// ============================================================================

export function renderFlyerFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  t: number,
  data: ExtractedFlyerData,
  storyboard: FlyerStoryboard,
  assets: RenderAssets = {},
  config: RenderConfig = { aspectRatio: '9:16' }
) {
  ctx.save();
  ctx.clearRect(0, 0, width, height);

  // 1. BRAND-COLOUR DYNAMIC GRADIENT BACKGROUND
  const c1 = data.brandColors[0] || '#1E1B4B';
  const c2 = data.brandColors[1] || '#0F172A';
  const c3 = data.brandColors[2] || '#FF5500';

  const grad = ctx.createLinearGradient(0, 0, width * 0.8, height);
  grad.addColorStop(0, c1);
  grad.addColorStop(0.5, c2);
  grad.addColorStop(1, '#020617');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // 2. MOVING DIAGONAL LIGHT STREAKS
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.strokeStyle = c3;
  ctx.lineWidth = width * 0.15;
  for (let i = 0; i < 3; i++) {
    const offset = ((t * 80 + i * width * 0.4) % (width * 2)) - width;
    ctx.beginPath();
    ctx.moveTo(offset, 0);
    ctx.lineTo(offset + width * 0.8, height);
    ctx.stroke();
  }
  ctx.restore();

  // 3. RISING PARTICLES (Deterministic pseudo-random based on t)
  ctx.save();
  const particleCount = 28;
  for (let i = 0; i < particleCount; i++) {
    const pX = (seededRandom(i * 13) * width + Math.sin(t * 0.8 + i) * 30) % width;
    const speed = 40 + seededRandom(i * 7) * 60;
    const pY = height - ((t * speed + seededRandom(i * 29) * height) % height);
    const pRadius = 2 + seededRandom(i * 41) * 4;
    const pAlpha = 0.15 + Math.sin(t * 2 + i) * 0.1;

    ctx.beginPath();
    ctx.arc(pX, pY, pRadius, 0, Math.PI * 2);
    ctx.fillStyle = c3;
    ctx.globalAlpha = Math.max(0.05, pAlpha);
    ctx.fill();
  }
  ctx.restore();

  // 4. TOP SAFE AREA BRAND BAR
  const topBarY = height * 0.06;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 12;

  // Mini Brand Badge
  const badgeWidth = width * 0.75;
  const badgeHeight = height * 0.038;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, (width - badgeWidth) / 2, topBarY, badgeWidth, badgeHeight, badgeHeight / 2);
  ctx.fill();
  ctx.stroke();

  drawTextShrink(
    ctx,
    data.businessName.toUpperCase(),
    width / 2,
    topBarY + badgeHeight / 2,
    badgeWidth - 30,
    badgeHeight * 0.42,
    'Poppins, sans-serif',
    '800',
    '#FBBF24'
  );
  ctx.restore();

  // 5. FIND ACTIVE SCENE & SCENE TRANSITIONS
  const currentSceneIndex = storyboard.scenes.findIndex(s => t >= s.start && t < s.end);
  const activeScene = currentSceneIndex !== -1 ? storyboard.scenes[currentSceneIndex] : storyboard.scenes[storyboard.scenes.length - 1];

  if (!activeScene) {
    ctx.restore();
    return;
  }

  const sceneDuration = activeScene.end - activeScene.start;
  const sceneT = Math.max(0, t - activeScene.start);
  const enterProgress = Math.min(1, sceneT / 0.5); // 0.5s pop in
  const exitProgress = Math.max(0, Math.min(1, (sceneDuration - sceneT) / 0.4)); // 0.4s fade out
  const alpha = exitProgress;

  ctx.save();
  ctx.globalAlpha = alpha;

  // RENDER SPECIFIC SCENE TYPES
  switch (activeScene.type) {
    case 'hook':
      renderHookScene(ctx, width, height, sceneT, enterProgress, data);
      break;

    case 'title':
      renderTitleScene(ctx, width, height, sceneT, enterProgress, data);
      break;

    case 'items':
      renderItemsScene(ctx, width, height, sceneT, enterProgress, data, activeScene);
      break;

    case 'price':
      renderPriceScene(ctx, width, height, sceneT, enterProgress, data);
      break;

    case 'benefits':
      renderBenefitsScene(ctx, width, height, sceneT, enterProgress, data);
      break;

    case 'people':
      renderPeopleScene(ctx, width, height, sceneT, enterProgress, data, assets);
      break;

    case 'payment':
      renderPaymentScene(ctx, width, height, sceneT, enterProgress, data);
      break;

    case 'tagline':
    default:
      renderTaglineScene(ctx, width, height, sceneT, enterProgress, data);
      break;
  }

  ctx.restore();

  // 6. BOTTOM SAFE PROGRESS INDICATOR BAR
  const progress = Math.min(1, t / storyboard.totalDuration);
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.fillRect(0, height - 8, width, 8);
  ctx.fillStyle = '#FF5500';
  ctx.fillRect(0, height - 8, width * progress, 8);
  ctx.restore();

  ctx.restore();
}

// ============================================================================
// SCENE RENDERERS
// ============================================================================

function renderHookScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  sceneT: number,
  enter: number,
  data: ExtractedFlyerData
) {
  const scale = easeBackOut(enter);
  ctx.save();
  ctx.translate(width / 2, height * 0.45);
  ctx.scale(scale, scale);

  // Glow Halo
  const radGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, width * 0.45);
  radGrad.addColorStop(0, 'rgba(255, 85, 0, 0.35)');
  radGrad.addColorStop(1, 'rgba(255, 85, 0, 0)');
  ctx.fillStyle = radGrad;
  ctx.beginPath();
  ctx.arc(0, 0, width * 0.45, 0, Math.PI * 2);
  ctx.fill();

  // Pill Alert Tag
  ctx.fillStyle = '#FF5500';
  roundRect(ctx, -width * 0.25, -height * 0.14, width * 0.5, height * 0.035, 12);
  ctx.fill();
  drawTextShrink(ctx, '⚡ SPECIAL ANNOUNCEMENT', 0, -height * 0.122, width * 0.45, height * 0.018, 'Poppins, sans-serif', '900', '#FFFFFF');

  // Main Headline
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 20;
  drawTextShrink(
    ctx,
    data.headline || data.offer || 'Unlock Next-Level Growth',
    0,
    0,
    width * 0.88,
    height * 0.045,
    'Poppins, sans-serif',
    '900',
    '#FFFFFF'
  );

  // Subheadline
  if (data.subheadline) {
    drawTextShrink(
      ctx,
      data.subheadline,
      0,
      height * 0.09,
      width * 0.85,
      height * 0.024,
      'Inter, sans-serif',
      '600',
      '#FCD34D'
    );
  }

  ctx.restore();
}

function renderTitleScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  sceneT: number,
  enter: number,
  data: ExtractedFlyerData
) {
  const yOffset = (1 - easeOutCubic(enter)) * 80;
  ctx.save();
  ctx.translate(0, yOffset);

  // Hero Card Container
  const cardW = width * 0.88;
  const cardH = height * 0.46;
  const cardX = (width - cardW) / 2;
  const cardY = height * 0.28;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 3;
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 25;
  roundRect(ctx, cardX, cardY, cardW, cardH, 28);
  ctx.fill();
  ctx.stroke();

  // Gold accent bar
  ctx.fillStyle = '#F59E0B';
  roundRect(ctx, cardX + 30, cardY + 28, cardW - 60, 6, 3);
  ctx.fill();

  // Business Name
  drawTextShrink(
    ctx,
    data.businessName,
    width / 2,
    cardY + height * 0.08,
    cardW - 40,
    height * 0.038,
    'Poppins, sans-serif',
    '900',
    '#FFFFFF'
  );

  // Headline
  drawTextShrink(
    ctx,
    data.headline,
    width / 2,
    cardY + height * 0.16,
    cardW - 50,
    height * 0.028,
    'Inter, sans-serif',
    '700',
    '#FCD34D'
  );

  // Special Offer Ribbon
  if (data.offer) {
    const ribbonY = cardY + height * 0.26;
    ctx.fillStyle = '#FF5500';
    roundRect(ctx, cardX + 24, ribbonY, cardW - 48, height * 0.075, 18);
    ctx.fill();

    drawTextShrink(ctx, 'LIMITED OFFER:', width / 2, ribbonY + height * 0.024, cardW - 60, height * 0.016, 'Poppins, sans-serif', '800', '#FEF08A');
    drawTextShrink(ctx, data.offer, width / 2, ribbonY + height * 0.05, cardW - 60, height * 0.024, 'Poppins, sans-serif', '900', '#FFFFFF');
  }

  // Delivery Method / Location
  if (data.contact.address || data.tagline) {
    drawTextShrink(
      ctx,
      data.contact.address ? `📍 ${data.contact.address}` : data.tagline,
      width / 2,
      cardY + height * 0.39,
      cardW - 40,
      height * 0.018,
      'Inter, sans-serif',
      '500',
      '#94A3B8'
    );
  }

  ctx.restore();
}

function renderItemsScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  sceneT: number,
  enter: number,
  data: ExtractedFlyerData,
  scene: FlyerScene
) {
  // Title
  drawTextShrink(
    ctx,
    'FEATURED SERVICES & TRACKS',
    width / 2,
    height * 0.18,
    width * 0.85,
    height * 0.026,
    'Poppins, sans-serif',
    '900',
    '#F59E0B'
  );

  const items = data.items.slice(0, 4);
  const cardW = width * 0.88;
  const cardH = height * 0.12;
  const startY = height * 0.24;
  const gap = height * 0.02;

  items.forEach((item, idx) => {
    // Staggered pop-in based on item index
    const itemDelay = idx * 0.35;
    const itemEnter = Math.max(0, Math.min(1, (sceneT - itemDelay) / 0.4));
    if (itemEnter <= 0) return;

    const scale = easeBackOut(itemEnter);
    const cardY = startY + idx * (cardH + gap);

    ctx.save();
    ctx.translate(width / 2, cardY + cardH / 2);
    ctx.scale(scale, scale);

    // Card background
    ctx.fillStyle = idx === 0 ? 'rgba(30, 41, 59, 0.95)' : 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = idx === 0 ? '#FF5500' : 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 15;
    roundRect(ctx, -cardW / 2, -cardH / 2, cardW, cardH, 20);
    ctx.fill();
    ctx.stroke();

    // Icon Circle
    const iconR = cardH * 0.28;
    ctx.fillStyle = idx === 0 ? '#FF5500' : '#F59E0B';
    ctx.beginPath();
    ctx.arc(-cardW / 2 + cardH * 0.45, 0, iconR, 0, Math.PI * 2);
    ctx.fill();
    drawVectorIcon(ctx, item.icon || 'star', -cardW / 2 + cardH * 0.45, 0, iconR * 1.1, '#FFFFFF');

    // Item Name
    const textStartX = -cardW / 2 + cardH * 0.9;
    drawTextShrink(
      ctx,
      item.name,
      textStartX,
      item.tag ? -cardH * 0.15 : 0,
      cardW * 0.52,
      cardH * 0.26,
      'Poppins, sans-serif',
      '800',
      '#FFFFFF',
      'left'
    );

    // Tag badge
    if (item.tag) {
      drawTextShrink(
        ctx,
        `• ${item.tag}`,
        textStartX,
        cardH * 0.18,
        cardW * 0.5,
        cardH * 0.18,
        'Inter, sans-serif',
        '600',
        '#FBBF24',
        'left'
      );
    }

    // Price Pill
    if (item.price) {
      const priceText = `${data.currency}${item.price}`;
      const pillW = cardW * 0.32;
      const pillH = cardH * 0.44;
      const pillX = cardW / 2 - pillW - 16;
      ctx.fillStyle = 'rgba(255, 85, 0, 0.2)';
      ctx.strokeStyle = '#FF5500';
      ctx.lineWidth = 1.5;
      roundRect(ctx, pillX, -pillH / 2, pillW, pillH, pillH / 2);
      ctx.fill();
      ctx.stroke();

      drawTextShrink(
        ctx,
        priceText,
        pillX + pillW / 2,
        0,
        pillW - 10,
        pillH * 0.5,
        'Poppins, sans-serif',
        '900',
        '#FF5500'
      );
    }

    ctx.restore();
  });
}

function renderPriceScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  sceneT: number,
  enter: number,
  data: ExtractedFlyerData
) {
  const scale = easeBackOut(enter);
  ctx.save();
  ctx.translate(width / 2, height * 0.46);
  ctx.scale(scale, scale);

  // Big Price Badge Container
  const badgeSize = width * 0.85;
  const radGrad = ctx.createRadialGradient(0, 0, 20, 0, 0, badgeSize * 0.6);
  radGrad.addColorStop(0, 'rgba(245, 158, 11, 0.25)');
  radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = radGrad;
  ctx.beginPath();
  ctx.arc(0, 0, badgeSize * 0.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 4;
  ctx.shadowColor = '#F59E0B';
  ctx.shadowBlur = 30;
  roundRect(ctx, -badgeSize / 2, -badgeSize * 0.4, badgeSize, badgeSize * 0.8, 36);
  ctx.fill();
  ctx.stroke();

  // Header label
  drawTextShrink(ctx, 'TOTAL VALUE & PRICING', 0, -badgeSize * 0.25, badgeSize - 40, height * 0.024, 'Poppins, sans-serif', '800', '#FCD34D');

  // Main Animated Price Counter
  const primaryItem = data.items[0];
  const rawPriceStr = primaryItem ? primaryItem.price.replace(/[^0-9]/g, '') : '0';
  const targetNumber = parseInt(rawPriceStr, 10) || 50000;
  const countProgress = Math.min(1, sceneT / 1.0); // 1.0s count up
  const currentCount = Math.floor(targetNumber * easeOutCubic(countProgress));
  const formattedCount = currentCount.toLocaleString();

  drawTextShrink(
    ctx,
    `${data.currency}${formattedCount}`,
    0,
    -badgeSize * 0.02,
    badgeSize - 40,
    height * 0.065,
    'Poppins, sans-serif',
    '900',
    '#FFFFFF'
  );

  // Description / Offer Subtext
  drawTextShrink(
    ctx,
    primaryItem ? primaryItem.name : data.offer,
    0,
    badgeSize * 0.16,
    badgeSize - 50,
    height * 0.024,
    'Inter, sans-serif',
    '700',
    '#FF5500'
  );

  if (data.offer && primaryItem) {
    drawTextShrink(
      ctx,
      `🔥 ${data.offer}`,
      0,
      badgeSize * 0.28,
      badgeSize - 60,
      height * 0.02,
      'Inter, sans-serif',
      '600',
      '#94A3B8'
    );
  }

  ctx.restore();
}

function renderBenefitsScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  sceneT: number,
  enter: number,
  data: ExtractedFlyerData
) {
  drawTextShrink(
    ctx,
    'WHY CHOOSE US',
    width / 2,
    height * 0.2,
    width * 0.85,
    height * 0.032,
    'Poppins, sans-serif',
    '900',
    '#F59E0B'
  );

  const benefits = data.benefits.slice(0, 4);
  const cardW = width * 0.88;
  const cardH = height * 0.095;
  const startY = height * 0.28;
  const gap = height * 0.025;

  benefits.forEach((benefit, idx) => {
    const itemDelay = idx * 0.45;
    const itemEnter = Math.max(0, Math.min(1, (sceneT - itemDelay) / 0.4));
    if (itemEnter <= 0) return;

    const xOffset = (1 - easeBackOut(itemEnter)) * -80;
    const cardY = startY + idx * (cardH + gap);

    ctx.save();
    ctx.translate(xOffset, 0);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.lineWidth = 2;
    roundRect(ctx, (width - cardW) / 2, cardY, cardW, cardH, 20);
    ctx.fill();
    ctx.stroke();

    // Checkmark Icon
    drawVectorIcon(ctx, 'circle-check', (width - cardW) / 2 + cardH * 0.45, cardY + cardH / 2, cardH * 0.5, '#10B981');

    // Text
    drawTextShrink(
      ctx,
      benefit,
      (width - cardW) / 2 + cardH * 0.9,
      cardY + cardH / 2,
      cardW - cardH * 1.1,
      cardH * 0.32,
      'Inter, sans-serif',
      '700',
      '#FFFFFF',
      'left'
    );

    ctx.restore();
  });
}

function renderPeopleScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  sceneT: number,
  enter: number,
  data: ExtractedFlyerData,
  assets: RenderAssets
) {
  drawTextShrink(
    ctx,
    'FACILITATORS & SPEAKERS',
    width / 2,
    height * 0.2,
    width * 0.85,
    height * 0.03,
    'Poppins, sans-serif',
    '900',
    '#F59E0B'
  );

  const people = data.people.slice(0, 2);
  const cardW = width * 0.88;
  const cardH = height * 0.18;
  const startY = height * 0.28;
  const gap = height * 0.04;

  people.forEach((person, idx) => {
    const pEnter = Math.max(0, Math.min(1, (sceneT - idx * 0.4) / 0.4));
    if (pEnter <= 0) return;

    const cardY = startY + idx * (cardH + gap);
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.strokeStyle = '#FF5500';
    ctx.lineWidth = 2;
    roundRect(ctx, (width - cardW) / 2, cardY, cardW, cardH, 24);
    ctx.fill();
    ctx.stroke();

    // Photo Circle Avatar or Placeholder
    const avatarR = cardH * 0.35;
    const avatarX = (width - cardW) / 2 + cardH * 0.5;
    const avatarY = cardY + cardH / 2;

    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarR, 0, Math.PI * 2);
    ctx.clip();

    const personImg = assets.peopleImgs && assets.peopleImgs[idx];
    if (personImg) {
      ctx.drawImage(personImg, avatarX - avatarR, avatarY - avatarR, avatarR * 2, avatarR * 2);
    } else {
      ctx.fillStyle = '#334155';
      ctx.fill();
      drawVectorIcon(ctx, 'star', avatarX, avatarY, avatarR, '#94A3B8');
    }
    ctx.restore();

    // Ring around avatar
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarR, 0, Math.PI * 2);
    ctx.stroke();

    // Name & Role
    const textStartX = avatarX + avatarR + 24;
    drawTextShrink(
      ctx,
      person.name,
      textStartX,
      avatarY - cardH * 0.15,
      cardW - (avatarR * 2 + 60),
      cardH * 0.22,
      'Poppins, sans-serif',
      '800',
      '#FFFFFF',
      'left'
    );

    drawTextShrink(
      ctx,
      person.role,
      textStartX,
      avatarY + cardH * 0.15,
      cardW - (avatarR * 2 + 60),
      cardH * 0.16,
      'Inter, sans-serif',
      '600',
      '#FCD34D',
      'left'
    );

    ctx.restore();
  });
}

function renderPaymentScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  sceneT: number,
  enter: number,
  data: ExtractedFlyerData
) {
  // Title
  drawTextShrink(
    ctx,
    'OFFICIAL PAYMENT DETAILS',
    width / 2,
    height * 0.16,
    width * 0.85,
    height * 0.026,
    'Poppins, sans-serif',
    '900',
    '#F59E0B'
  );

  const cardW = width * 0.9;
  const cardH = height * 0.38;
  const cardX = (width - cardW) / 2;
  const cardY = height * 0.22;

  // Outer Bank Card
  ctx.save();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.96)';
  ctx.strokeStyle = '#10B981';
  ctx.lineWidth = 3;
  ctx.shadowColor = 'rgba(16, 185, 129, 0.3)';
  ctx.shadowBlur = 25;
  roundRect(ctx, cardX, cardY, cardW, cardH, 28);
  ctx.fill();
  ctx.stroke();

  // Bank Provider
  drawTextShrink(
    ctx,
    data.payment.provider || 'BANK TRANSFER',
    width / 2,
    cardY + height * 0.05,
    cardW - 40,
    height * 0.024,
    'Poppins, sans-serif',
    '800',
    '#34D399'
  );

  // Big Account Number
  const acctNum = data.payment.accountNumber || 'Check Flyer Notes';
  drawTextShrink(
    ctx,
    acctNum,
    width / 2,
    cardY + height * 0.14,
    cardW - 40,
    height * 0.052,
    'Poppins, monospace',
    '900',
    '#FFFFFF'
  );

  // Account Name
  drawTextShrink(
    ctx,
    data.payment.accountName ? `ACCOUNT NAME: ${data.payment.accountName}` : data.businessName,
    width / 2,
    cardY + height * 0.22,
    cardW - 50,
    height * 0.02,
    'Inter, sans-serif',
    '700',
    '#FCD34D'
  );

  // Instructions
  if (data.payment.instructions) {
    drawTextShrink(
      ctx,
      data.payment.instructions,
      width / 2,
      cardY + height * 0.3,
      cardW - 50,
      height * 0.018,
      'Inter, sans-serif',
      '500',
      '#94A3B8'
    );
  }
  ctx.restore();

  // PULSING CALL TO ACTION BUTTON (Per Core Rule 4: 1 + 0.05*sin(7*sceneT))
  const pulse = 1 + 0.05 * Math.sin(7 * sceneT);
  const btnW = width * 0.85;
  const btnH = height * 0.085;
  const btnX = (width - btnW) / 2;
  const btnY = height * 0.66;

  ctx.save();
  ctx.translate(width / 2, btnY + btnH / 2);
  ctx.scale(pulse, pulse);

  // Glow
  ctx.shadowColor = '#FF5500';
  ctx.shadowBlur = 30;

  const btnGrad = ctx.createLinearGradient(-btnW / 2, 0, btnW / 2, 0);
  btnGrad.addColorStop(0, '#FF5500');
  btnGrad.addColorStop(1, '#F59E0B');
  ctx.fillStyle = btnGrad;
  roundRect(ctx, -btnW / 2, -btnH / 2, btnW, btnH, 22);
  ctx.fill();

  drawTextShrink(
    ctx,
    data.cta.toUpperCase(),
    0,
    0,
    btnW - 30,
    btnH * 0.38,
    'Poppins, sans-serif',
    '900',
    '#FFFFFF'
  );
  ctx.restore();

  // Contact line below button
  if (data.contact.phone || data.contact.website) {
    const contactLine = [data.contact.phone ? `📞 ${data.contact.phone}` : '', data.contact.website ? `🌐 ${data.contact.website}` : '']
      .filter(Boolean)
      .join('  |  ');
    drawTextShrink(ctx, contactLine, width / 2, height * 0.8, width * 0.88, height * 0.02, 'Inter, sans-serif', '600', '#E2E8F0');
  }
}

function renderTaglineScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  sceneT: number,
  enter: number,
  data: ExtractedFlyerData
) {
  const scale = easeBackOut(enter);
  ctx.save();
  ctx.translate(width / 2, height * 0.44);
  ctx.scale(scale, scale);

  // Logo / Emblem circle
  ctx.fillStyle = '#FF5500';
  ctx.beginPath();
  ctx.arc(0, -height * 0.12, width * 0.12, 0, Math.PI * 2);
  ctx.fill();
  drawVectorIcon(ctx, 'star', 0, -height * 0.12, width * 0.12, '#FFFFFF');

  // Business Name
  drawTextShrink(
    ctx,
    data.businessName,
    0,
    height * 0.02,
    width * 0.85,
    height * 0.042,
    'Poppins, sans-serif',
    '900',
    '#FFFFFF'
  );

  // Tagline
  drawTextShrink(
    ctx,
    data.tagline || 'Leading Excellence In Every Step',
    0,
    height * 0.09,
    width * 0.85,
    height * 0.024,
    'Inter, sans-serif',
    '600',
    '#FCD34D'
  );

  // Contact details
  const contacts = [data.contact.phone, data.contact.website, data.contact.email].filter(Boolean);
  contacts.forEach((c, idx) => {
    drawTextShrink(
      ctx,
      c,
      0,
      height * 0.18 + idx * height * 0.038,
      width * 0.85,
      height * 0.02,
      'Inter, sans-serif',
      '500',
      '#CBD5E1'
    );
  });

  ctx.restore();
}

// Utility: Canvas rounded rect helper
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
) {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
