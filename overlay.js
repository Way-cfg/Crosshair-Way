let state = {
  crosshairMode: 'generator',
  shape: 'cross',
  color: '#ff6600',
  size: 30,
  thickness: 3,
  gap: 6,
  opacity: 0.8,
  outlineEnabled: false,
  outlineThickness: 1,
  outlineColor: '#000000',
  imageSize: 60,
  customImagePath: ''
};

const generatorEl = document.getElementById('crosshair-generator');
const imageEl = document.getElementById('crosshair-image');

window.crosshairAPI.onUpdateCrosshair((data) => {
  state = { ...state, ...data };
  render();
});

async function init() {
  const savedState = await window.crosshairAPI.getCrosshairState();
  state = { ...state, ...savedState };
  render();
}

function render() {
  if (state.crosshairMode === 'image' && state.customImagePath) {
    generatorEl.style.display = 'none';
    imageEl.style.display = 'block';
    imageEl.src = state.customImagePath + '?t=' + Date.now();
    const imgSize = state.imageSize || 60;
    imageEl.style.width = imgSize + 'px';
    imageEl.style.height = imgSize + 'px';
    imageEl.style.opacity = state.opacity;
  } else {
    generatorEl.style.display = 'flex';
    imageEl.style.display = 'none';
    generatorEl.innerHTML = generateSVG();
  }
}

function generateSVG() {
  const { shape, color, size, thickness, gap, opacity, outlineEnabled, outlineThickness: olT, outlineColor: olC } = state;
  const half = size / 2;
  const strokeW = thickness;
  const gapVal = gap;
  const padding = strokeW + (outlineEnabled ? olT * 2 : 0);
  const viewSize = size + strokeW * 2 + gapVal * 2 + (outlineEnabled ? olT * 4 : 0);

  let fillPaths = '';
  let outlinePaths = '';

  switch (shape) {
    case 'dot': {
      const r = Math.max(size / 4, strokeW);
      fillPaths = `<circle cx="${viewSize / 2}" cy="${viewSize / 2}" r="${r}" fill="${color}" opacity="${opacity}"/>`;
      if (outlineEnabled) {
        outlinePaths = `<circle cx="${viewSize / 2}" cy="${viewSize / 2}" r="${r}" fill="none" stroke="${olC}" stroke-width="${olT}" opacity="${opacity}"/>`;
      }
      break;
    }
    case 'cross': {
      const c = viewSize / 2;
      const arm = half;
      const x1 = c - strokeW / 2;
      const y1 = c - arm - gapVal;
      const w1 = strokeW;
      const h1 = arm * 2;
      const x2 = c - arm - gapVal;
      const y2 = c - strokeW / 2;
      const w2 = arm * 2;
      const h2 = strokeW;
      fillPaths = `
        <rect x="${x1}" y="${y1}" width="${w1}" height="${h1}" fill="${color}" opacity="${opacity}" rx="${strokeW / 2}"/>
        <rect x="${x2}" y="${y2}" width="${w2}" height="${h2}" fill="${color}" opacity="${opacity}" rx="${strokeW / 2}"/>
      `;
      if (outlineEnabled) {
        outlinePaths = `
          <rect x="${x1}" y="${y1}" width="${w1}" height="${h1}" fill="none" stroke="${olC}" stroke-width="${olT}" opacity="${opacity}" rx="${strokeW / 2}"/>
          <rect x="${x2}" y="${y2}" width="${w2}" height="${h2}" fill="none" stroke="${olC}" stroke-width="${olT}" opacity="${opacity}" rx="${strokeW / 2}"/>
        `;
      }
      break;
    }
    case 'circle': {
      const c = viewSize / 2;
      const radius = half - gapVal;
      fillPaths = `
        <circle cx="${c}" cy="${c}" r="${radius}" fill="none" stroke="${color}" stroke-width="${strokeW}" opacity="${opacity}" />
        <circle cx="${c}" cy="${c}" r="${Math.max(strokeW / 2, 1.5)}" fill="${color}" opacity="${opacity}" />
      `;
      if (outlineEnabled) {
        outlinePaths = `
          <circle cx="${c}" cy="${c}" r="${radius}" fill="none" stroke="${olC}" stroke-width="${strokeW + olT * 2}" opacity="${opacity}" />
          <circle cx="${c}" cy="${c}" r="${Math.max(strokeW / 2, 1.5)}" fill="none" stroke="${olC}" stroke-width="${olT}" opacity="${opacity}" />
        `;
      }
      break;
    }
    case 'tshape': {
      const c = viewSize / 2;
      const arm = half;
      const x1 = c - arm - gapVal;
      const y1 = c - strokeW / 2;
      const w1 = arm * 2 + gapVal * 2;
      const h1 = strokeW;
      const x2 = c - strokeW / 2;
      const y2 = c - arm - gapVal;
      const w2 = strokeW;
      const h2 = arm;
      fillPaths = `
        <rect x="${x1}" y="${y1}" width="${w1}" height="${h1}" fill="${color}" opacity="${opacity}" rx="${strokeW / 2}"/>
        <rect x="${x2}" y="${y2}" width="${w2}" height="${h2}" fill="${color}" opacity="${opacity}" rx="${strokeW / 2}"/>
      `;
      if (outlineEnabled) {
        outlinePaths = `
          <rect x="${x1}" y="${y1}" width="${w1}" height="${h1}" fill="none" stroke="${olC}" stroke-width="${olT}" opacity="${opacity}" rx="${strokeW / 2}"/>
          <rect x="${x2}" y="${y2}" width="${w2}" height="${h2}" fill="none" stroke="${olC}" stroke-width="${olT}" opacity="${opacity}" rx="${strokeW / 2}"/>
        `;
      }
      break;
    }
    default: {
      const c = viewSize / 2;
      const arm = half;
      const x1 = c - strokeW / 2;
      const y1 = c - arm - gapVal;
      const w1 = strokeW;
      const h1 = arm * 2;
      const x2 = c - arm - gapVal;
      const y2 = c - strokeW / 2;
      const w2 = arm * 2;
      const h2 = strokeW;
      fillPaths = `
        <rect x="${x1}" y="${y1}" width="${w1}" height="${h1}" fill="${color}" opacity="${opacity}" rx="${strokeW / 2}"/>
        <rect x="${x2}" y="${y2}" width="${w2}" height="${h2}" fill="${color}" opacity="${opacity}" rx="${strokeW / 2}"/>
      `;
      if (outlineEnabled) {
        outlinePaths = `
          <rect x="${x1}" y="${y1}" width="${w1}" height="${h1}" fill="none" stroke="${olC}" stroke-width="${olT}" opacity="${opacity}" rx="${strokeW / 2}"/>
          <rect x="${x2}" y="${y2}" width="${w2}" height="${h2}" fill="none" stroke="${olC}" stroke-width="${olT}" opacity="${opacity}" rx="${strokeW / 2}"/>
        `;
      }
    }
  }

  return `<svg width="${viewSize}" height="${viewSize}" viewBox="0 0 ${viewSize} ${viewSize}" xmlns="http://www.w3.org/2000/svg">${outlinePaths}${fillPaths}</svg>`;
}

init();

document.addEventListener('contextmenu', (e) => e.preventDefault());
