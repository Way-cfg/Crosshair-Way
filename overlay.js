let state = {
  crosshairMode: 'generator',
  shape: 'cross',
  color: '#ff6600',
  size: 30,
  thickness: 3,
  gap: 6,
  opacity: 0.8,
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
  const { shape, color, size, thickness, gap, opacity } = state;
  const half = size / 2;
  const strokeW = thickness;
  const gapVal = gap;
  const viewSize = size + strokeW * 2 + gapVal * 2;

  let paths = '';

  switch (shape) {
    case 'dot': {
      const r = Math.max(size / 4, strokeW);
      paths = `<circle cx="${viewSize / 2}" cy="${viewSize / 2}" r="${r}" fill="${color}" opacity="${opacity}"/>`;
      break;
    }
    case 'cross': {
      const c = viewSize / 2;
      const arm = half;
      paths = `
        <rect x="${c - strokeW / 2}" y="${c - arm - gapVal}" width="${strokeW}" height="${arm * 2}" fill="${color}" opacity="${opacity}" rx="${strokeW / 2}"/>
        <rect x="${c - arm - gapVal}" y="${c - strokeW / 2}" width="${arm * 2}" height="${strokeW}" fill="${color}" opacity="${opacity}" rx="${strokeW / 2}"/>
      `;
      break;
    }
    case 'circle': {
      const c = viewSize / 2;
      const radius = half - gapVal;
      paths = `
        <circle cx="${c}" cy="${c}" r="${radius}" fill="none" stroke="${color}" stroke-width="${strokeW}" opacity="${opacity}" />
        <circle cx="${c}" cy="${c}" r="${Math.max(strokeW / 2, 1.5)}" fill="${color}" opacity="${opacity}" />
      `;
      break;
    }
    case 'tshape': {
      const c = viewSize / 2;
      const arm = half;
      paths = `
        <rect x="${c - arm - gapVal}" y="${c - strokeW / 2}" width="${arm * 2 + gapVal * 2}" height="${strokeW}" fill="${color}" opacity="${opacity}" rx="${strokeW / 2}"/>
        <rect x="${c - strokeW / 2}" y="${c - arm - gapVal}" width="${strokeW}" height="${arm}" fill="${color}" opacity="${opacity}" rx="${strokeW / 2}"/>
      `;
      break;
    }
    default: {
      const c = viewSize / 2;
      const arm = half;
      paths = `
        <rect x="${c - strokeW / 2}" y="${c - arm - gapVal}" width="${strokeW}" height="${arm * 2}" fill="${color}" opacity="${opacity}" rx="${strokeW / 2}"/>
        <rect x="${c - arm - gapVal}" y="${c - strokeW / 2}" width="${arm * 2}" height="${strokeW}" fill="${color}" opacity="${opacity}" rx="${strokeW / 2}"/>
      `;
    }
  }

  return `<svg width="${viewSize}" height="${viewSize}" viewBox="0 0 ${viewSize} ${viewSize}" xmlns="http://www.w3.org/2000/svg">${paths}</svg>`;
}

init();

document.addEventListener('contextmenu', (e) => e.preventDefault());
