let settings = {};

document.addEventListener('DOMContentLoaded', async () => {
  settings = await window.crosshairAPI.getSettings();
  applySettingsToUI();
  setupEventListeners();
  loadMonitors();
});

function applySettingsToUI() {
  setValue('sizeSlider', settings.size);
  setText('sizeValue', settings.size + 'px');
  setValue('thicknessSlider', settings.thickness);
  setText('thicknessValue', settings.thickness + 'px');
  setValue('gapSlider', settings.gap);
  setText('gapValue', settings.gap + 'px');
  setValue('opacitySlider', Math.round(settings.opacity * 100));
  setText('opacityValue', Math.round(settings.opacity * 100) + '%');
  setValue('colorPicker', settings.color);
  setValue('colorHex', settings.color);
  setValue('offsetXSlider', settings.offsetX);
  setText('offsetXValue', settings.offsetX + 'px');
  setValue('offsetYSlider', settings.offsetY);
  setText('offsetYValue', settings.offsetY + 'px');
  setValue('imageSizeSlider', 60);
  setText('imageSizeValue', '60px');

  document.getElementById('visibilityToggle').checked = settings.visible;

  const modeBtn = document.querySelector(`.mode-btn[data-mode="${settings.crosshairMode}"]`);
  if (modeBtn) {
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    modeBtn.classList.add('active');
  }
  toggleCrosshairMode(settings.crosshairMode);

  const shapeBtn = document.querySelector(`.shape-btn[data-shape="${settings.shape}"]`);
  if (shapeBtn) {
    document.querySelectorAll('.shape-btn').forEach(b => b.classList.remove('active'));
    shapeBtn.classList.add('active');
  }

  if (settings.customImagePath) {
    document.getElementById('imagePathDisplay').textContent = settings.customImagePath;
  }

  document.getElementById('autoStartToggle').checked = settings.autoStart || false;

  const hotkey = settings.hotkey || 'Control+Shift+H';
  document.getElementById('hotkeyBindBtn').textContent = hotkey.replace(/\+/g, ' + ');

  document.getElementById('outlineToggle').checked = settings.outlineEnabled || false;
  setValue('outlineThicknessSlider', settings.outlineThickness || 1);
  setText('outlineThicknessValue', (settings.outlineThickness || 1) + 'px');
  setValue('outlineColorPicker', settings.outlineColor || '#000000');
  setValue('outlineColorHex', settings.outlineColor || '#000000');
  toggleOutlineControls(settings.outlineEnabled || false);
}

function setValue(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function setupEventListeners() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      item.classList.add('active');
      document.getElementById('tab-' + item.dataset.tab).classList.add('active');
    });
  });

  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      toggleCrosshairMode(btn.dataset.mode);
      window.crosshairAPI.updateSetting('crosshairMode', btn.dataset.mode);
    });
  });

  document.querySelectorAll('.shape-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.shape-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const shape = btn.dataset.shape;
      window.crosshairAPI.updateSetting('shape', shape);
    });
  });

  document.getElementById('visibilityToggle').addEventListener('change', (e) => {
    window.crosshairAPI.toggleOverlay();
  });

  const sliderUpdates = [
    { id: 'sizeSlider', key: 'size', suffix: 'px', displayId: 'sizeValue' },
    { id: 'thicknessSlider', key: 'thickness', suffix: 'px', displayId: 'thicknessValue' },
    { id: 'gapSlider', key: 'gap', suffix: 'px', displayId: 'gapValue' },
    { id: 'offsetXSlider', key: 'offsetX', suffix: 'px', displayId: 'offsetXValue' },
    { id: 'offsetYSlider', key: 'offsetY', suffix: 'px', displayId: 'offsetYValue' },
    { id: 'imageSizeSlider', key: 'imageSize', suffix: 'px', displayId: 'imageSizeValue' },
    { id: 'outlineThicknessSlider', key: 'outlineThickness', suffix: 'px', displayId: 'outlineThicknessValue' },
    {
      id: 'opacitySlider', key: 'opacity', suffix: '%', displayId: 'opacityValue',
      transform: (v) => v / 100
    }
  ];

  sliderUpdates.forEach(({ id, key, suffix, displayId, transform }) => {
    const slider = document.getElementById(id);
    if (!slider) return;
    slider.addEventListener('input', () => {
      let val = parseFloat(slider.value);
      setText(displayId, val + suffix);
      const saveVal = transform ? transform(val) : val;
      window.crosshairAPI.updateSetting(key, saveVal);
    });
  });

  document.getElementById('colorPicker').addEventListener('input', (e) => {
    const color = e.target.value;
    document.getElementById('colorHex').value = color;
    window.crosshairAPI.updateSetting('color', color);
  });

  document.getElementById('colorHex').addEventListener('change', (e) => {
    let color = e.target.value.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(color)) {
      document.getElementById('colorPicker').value = color;
      window.crosshairAPI.updateSetting('color', color);
    }
  });

  document.getElementById('monitorSelect').addEventListener('change', (e) => {
    window.crosshairAPI.updateSetting('monitorIndex', parseInt(e.target.value));
  });

  document.getElementById('pickImageBtn').addEventListener('click', async () => {
    const filePath = await window.crosshairAPI.pickImage();
    if (filePath) {
      document.getElementById('imagePathDisplay').textContent = filePath;
      window.crosshairAPI.updateSetting('customImagePath', filePath);
    }
  });

  document.getElementById('resetPositionBtn').addEventListener('click', () => {
    setValue('offsetXSlider', 0);
    setValue('offsetYSlider', 0);
    setText('offsetXValue', '0px');
    setText('offsetYValue', '0px');
    window.crosshairAPI.updateSetting('offsetX', 0);
    window.crosshairAPI.updateSetting('offsetY', 0);
  });

  document.getElementById('autoStartToggle').addEventListener('change', (e) => {
    window.crosshairAPI.updateSetting('autoStart', e.target.checked);
  });

  setupHotkeyBinding();

  document.getElementById('outlineToggle').addEventListener('change', (e) => {
    toggleOutlineControls(e.target.checked);
    window.crosshairAPI.updateSetting('outlineEnabled', e.target.checked);
  });

  document.getElementById('outlineColorPicker').addEventListener('input', (e) => {
    const color = e.target.value;
    document.getElementById('outlineColorHex').value = color;
    window.crosshairAPI.updateSetting('outlineColor', color);
  });

  document.getElementById('outlineColorHex').addEventListener('change', (e) => {
    let color = e.target.value.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(color)) {
      document.getElementById('outlineColorPicker').value = color;
      window.crosshairAPI.updateSetting('outlineColor', color);
    }
  });

  document.getElementById('githubProfileBtn').addEventListener('click', () => {
    window.crosshairAPI.openExternal('https://github.com/Way-cfg');
  });

  document.getElementById('exportCodeBtn').addEventListener('click', exportCode);
  document.getElementById('importCodeBtn').addEventListener('click', importCode);
  document.getElementById('importCodeInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') importCode();
  });
}

function toggleCrosshairMode(mode) {
  document.getElementById('generator-controls').classList.toggle('hidden', mode !== 'generator');
  document.getElementById('image-controls').classList.toggle('hidden', mode !== 'image');
}

function toggleOutlineControls(enabled) {
  const el = document.getElementById('outline-controls');
  if (el) el.style.display = enabled ? 'flex' : 'none';
}

async function loadMonitors() {
  const monitors = await window.crosshairAPI.getMonitors();
  const select = document.getElementById('monitorSelect');
  select.innerHTML = '';
  monitors.forEach((m) => {
    const opt = document.createElement('option');
    opt.value = m.index;
    opt.textContent = `${m.name} (${m.bounds.width}x${m.bounds.height})`;
    if (m.index === (settings.monitorIndex || 0)) {
      opt.selected = true;
    }
    select.appendChild(opt);
  });
}

function generateCode() {
  const s = settings;
  const colorHex = s.color.replace('#', '');
  const outlineColorHex = (s.outlineColor || '#000000').replace('#', '');
  const opacityPct = Math.round((s.opacity || 1) * 100);
  const outline = s.outlineEnabled ? 1 : 0;
  const thick = s.outlineThickness || 1;
  return `WAY-${s.shape}-${s.size}-${colorHex}-${s.thickness}-${s.gap}-${opacityPct}-${outline}-${thick}-${outlineColorHex}`;
}

function parseCode(code) {
  const parts = code.trim().split('-');
  if (parts.length !== 10 || parts[0] !== 'WAY') return null;
  const [_, shape, size, colorHex, thickness, gap, opacity, outlineOn, outlineThick, outlineColorHex] = parts;
  const validShapes = ['cross', 'dot', 'circle', 'tshape'];
  if (!validShapes.includes(shape)) return null;
  const sizeNum = parseInt(size);
  if (isNaN(sizeNum) || sizeNum < 10 || sizeNum > 100) return null;
  if (!/^[0-9a-fA-F]{6}$/.test(colorHex)) return null;
  const thickNum = parseInt(thickness);
  if (isNaN(thickNum) || thickNum < 1 || thickNum > 12) return null;
  const gapNum = parseInt(gap);
  if (isNaN(gapNum) || gapNum < 0 || gapNum > 30) return null;
  const opacityNum = parseInt(opacity);
  if (isNaN(opacityNum) || opacityNum < 5 || opacityNum > 100) return null;
  const outlineNum = parseInt(outlineOn);
  if (outlineNum !== 0 && outlineNum !== 1) return null;
  const oThickNum = parseInt(outlineThick);
  if (isNaN(oThickNum) || oThickNum < 1 || oThickNum > 5) return null;
  if (!/^[0-9a-fA-F]{6}$/.test(outlineColorHex)) return null;
  return {
    shape, size: sizeNum, thickness: thickNum, gap: gapNum,
    opacity: opacityNum / 100, color: '#' + colorHex,
    outlineEnabled: outlineNum === 1, outlineThickness: oThickNum,
    outlineColor: '#' + outlineColorHex
  };
}

async function exportCode() {
  const code = generateCode();
  try {
    await navigator.clipboard.writeText(code);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = code;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
  const fb = document.getElementById('exportFeedback');
  fb.textContent = 'Copied!';
  fb.classList.remove('hidden');
  fb.classList.add('visible');
  setTimeout(() => {
    fb.classList.remove('visible');
    fb.classList.add('hidden');
  }, 1800);
}

async function importCode() {
  const input = document.getElementById('importCodeInput');
  const code = input.value.trim();
  if (!code) return;
  const parsed = parseCode(code);
  if (!parsed) {
    input.classList.add('error');
    setTimeout(() => input.classList.remove('error'), 800);
    return;
  }
  input.value = '';
  Object.assign(settings, parsed);
  applySettingsToUI();

  const shapeBtn = document.querySelector(`.shape-btn[data-shape="${parsed.shape}"]`);
  if (shapeBtn) shapeBtn.click();

  ['sizeSlider', 'thicknessSlider', 'gapSlider', 'opacitySlider', 'outlineThicknessSlider'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.dispatchEvent(new Event('input', { bubbles: true }));
  });

  ['colorPicker', 'outlineColorPicker'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.dispatchEvent(new Event('input', { bubbles: true }));
  });

  ['colorHex', 'outlineColorHex'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.dispatchEvent(new Event('change', { bubbles: true }));
  });

  const ot = document.getElementById('outlineToggle');
  if (ot) ot.dispatchEvent(new Event('change', { bubbles: true }));

  await window.crosshairAPI.forceOverlaySync();

  const fb = document.getElementById('exportFeedback');
  fb.textContent = 'Imported!';
  fb.classList.remove('hidden');
  fb.classList.add('visible');
  setTimeout(() => {
    fb.classList.remove('visible');
    fb.classList.add('hidden');
  }, 1800);
}

function formatHotkey(accel) {
  return accel.replace(/\+/g, ' + ');
}

function setupHotkeyBinding() {
  const btn = document.getElementById('hotkeyBindBtn');
  let listening = false;

  function startListening() {
    listening = true;
    btn.classList.add('listening');
    btn.textContent = 'Press keys to bind...';
  }

  function stopListening() {
    listening = false;
    btn.classList.remove('listening');
  }

  btn.addEventListener('click', startListening);

  document.addEventListener('keydown', async (e) => {
    if (!listening) return;
    e.preventDefault();
    e.stopPropagation();

    if (e.key === 'Escape') {
      stopListening();
      btn.textContent = formatHotkey(settings.hotkey || 'Control+Shift+H');
      return;
    }

    const parts = [];
    if (e.ctrlKey) parts.push('Control');
    if (e.altKey) parts.push('Alt');
    if (e.shiftKey) parts.push('Shift');
    if (e.metaKey) parts.push('Super');

    const ignored = ['Control', 'Alt', 'Shift', 'Meta'];
    if (ignored.includes(e.key)) return;

    let mainKey = e.key;
    if (mainKey === ' ') mainKey = 'Space';
    if (mainKey.length === 1 && mainKey >= 'a' && mainKey <= 'z') {
      mainKey = mainKey.toUpperCase();
    }
    parts.push(mainKey);

    const accel = parts.join('+');
    if (parts.length < 2) return;

    stopListening();
    btn.textContent = formatHotkey(accel);
    window.crosshairAPI.setHotkey(accel);
  });
}
