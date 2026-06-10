let settings = {};
let isZoomConfiguring = false;

document.addEventListener('DOMContentLoaded', async () => {
  settings = await window.crosshairAPI.getSettings();
  applySettingsToUI();
  setupEventListeners();
  loadMonitors();
  loadProfileDropdown();
  loadZoomUI();
});

function saveSetting(key, val) {
  if (isZoomConfiguring) {
    return window.crosshairAPI.updateZoomSetting(key, val);
  }
  return window.crosshairAPI.updateSetting(key, val);
}

function applySettingsToUI() {
  applySlider('sizeSlider', 'sizeValue', Number(settings.size), 'px');
  applySlider('thicknessSlider', 'thicknessValue', Number(settings.thickness), 'px');
  applySlider('gapSlider', 'gapValue', Number(settings.gap), 'px');
  applySlider('opacitySlider', 'opacityValue', Math.round(Number(settings.opacity) * 100), '%');
  setValue('colorPicker', settings.color);
  setValue('colorHex', settings.color);
  setValue('offsetXSlider', settings.offsetX);
  setText('offsetXValue', settings.offsetX + 'px');
  setValue('offsetYSlider', settings.offsetY);
  setText('offsetYValue', settings.offsetY + 'px');
  applySlider('imageSizeSlider', 'imageSizeValue', Number(settings.imageSize) || 60, 'px');

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
  applySlider('outlineThicknessSlider', 'outlineThicknessValue', Number(settings.outlineThickness) || 1, 'px');
  setValue('outlineColorPicker', settings.outlineColor || '#000000');
  setValue('outlineColorHex', settings.outlineColor || '#000000');
  toggleOutlineControls(settings.outlineEnabled || false);
}

function setValue(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

function applySlider(id, displayId, raw, suffix) {
  const el = document.getElementById(id);
  if (!el) return;
  const val = Number(raw);
  el.value = val;
  setText(displayId, val + suffix);
  requestAnimationFrame(() => updateSliderFill(el));
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function setupEventListeners() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      if (isZoomConfiguring && item.dataset.tab !== 'crosshair') {
        isZoomConfiguring = false;
        const btn = document.getElementById('zoomConfigBtn');
        btn.classList.remove('active');
        btn.textContent = 'Configure Zoom Crosshair Style';
        document.querySelector('.zoom-card').classList.remove('configuring');
        window.crosshairAPI.forceOverlaySync();
      }
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
      saveSetting('crosshairMode', btn.dataset.mode);
    });
  });

  document.querySelectorAll('.shape-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.shape-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const shape = btn.dataset.shape;
      saveSetting('shape', shape);
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
      updateSliderFill(slider);
      const saveVal = transform ? transform(val) : val;
      saveSetting(key, saveVal);
    });
  });

  document.getElementById('colorPicker').addEventListener('input', (e) => {
    const color = e.target.value;
    document.getElementById('colorHex').value = color;
    saveSetting('color', color);
  });

  document.getElementById('colorHex').addEventListener('change', (e) => {
    let color = e.target.value.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(color)) {
      document.getElementById('colorPicker').value = color;
      saveSetting('color', color);
    }
  });

  document.getElementById('monitorSelect').addEventListener('change', (e) => {
    saveSetting('monitorIndex', parseInt(e.target.value));
  });

  document.getElementById('pickImageBtn').addEventListener('click', async () => {
    const filePath = await window.crosshairAPI.pickImage();
    if (filePath) {
      document.getElementById('imagePathDisplay').textContent = filePath;
      saveSetting('customImagePath', filePath);
    }
  });

  document.getElementById('resetPositionBtn').addEventListener('click', () => {
    setValue('offsetXSlider', 0);
    setValue('offsetYSlider', 0);
    setText('offsetXValue', '0px');
    setText('offsetYValue', '0px');
    saveSetting('offsetX', 0);
    saveSetting('offsetY', 0);
  });

  document.getElementById('autoStartToggle').addEventListener('change', (e) => {
    saveSetting('autoStart', e.target.checked);
  });

  setupHotkeyBinding();

  document.getElementById('outlineToggle').addEventListener('change', (e) => {
    toggleOutlineControls(e.target.checked);
    saveSetting('outlineEnabled', e.target.checked);
  });

  document.getElementById('outlineColorPicker').addEventListener('input', (e) => {
    const color = e.target.value;
    document.getElementById('outlineColorHex').value = color;
    saveSetting('outlineColor', color);
  });

  document.getElementById('outlineColorHex').addEventListener('change', (e) => {
    let color = e.target.value.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(color)) {
      document.getElementById('outlineColorPicker').value = color;
      saveSetting('outlineColor', color);
    }
  });

  document.getElementById('githubProfileBtn').addEventListener('click', () => {
    window.crosshairAPI.openExternal('https://github.com/Way-cfg');
  });

  document.getElementById('profileSelect').addEventListener('change', async (e) => {
    const name = e.target.value;
    if (!name) return;
    await switchProfile(name);
  });

  document.getElementById('saveProfileBtn').addEventListener('click', async () => {
    const input = document.getElementById('profileNameInput');
    const name = input.value.trim();
    if (!name) return;
    const profileData = readCurrentSettings();
    await window.crosshairAPI.saveProfile(name, profileData);
    input.value = '';
    await loadProfileDropdown();
  });

  document.getElementById('deleteProfileBtn').addEventListener('click', async () => {
    const select = document.getElementById('profileSelect');
    const name = select.value;
    if (name === 'Default') return;
    await window.crosshairAPI.deleteProfile(name);
    await loadProfileDropdown();
    await switchProfile('Default');
  });

  document.getElementById('zoomModeToggle').addEventListener('change', async (e) => {
    await window.crosshairAPI.updateSetting('zoomModeEnabled', e.target.checked);
    settings.zoomModeEnabled = e.target.checked;
  });

  document.getElementById('zoomTriggerType').addEventListener('change', async (e) => {
    await window.crosshairAPI.updateSetting('zoomTriggerType', e.target.value);
  });

  document.getElementById('zoomTriggerType').addEventListener('change', async (e) => {
    await window.crosshairAPI.updateSetting('zoomTriggerType', e.target.value);
  });

  document.getElementById('zoomMouseSelect').addEventListener('change', async (e) => {
    await window.crosshairAPI.updateSetting('zoomKeybind', e.target.value);
  });

  document.getElementById('zoomConfigBtn').addEventListener('click', toggleZoomConfig);
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

async function loadProfileDropdown() {
  const data = await window.crosshairAPI.getProfiles();
  const select = document.getElementById('profileSelect');
  const currentVal = select.value;
  select.innerHTML = '';
  Object.keys(data.profiles).forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    if (name === data.activeProfile) opt.selected = true;
    select.appendChild(opt);
  });
  document.getElementById('deleteProfileBtn').disabled = (data.activeProfile === 'Default');
}

function readCurrentSettings() {
  return {
    crosshairMode: document.querySelector('.mode-btn.active')?.dataset.mode || 'generator',
    shape: document.querySelector('.shape-btn.active')?.dataset.shape || 'cross',
    color: document.getElementById('colorPicker').value,
    size: Number(document.getElementById('sizeSlider').value),
    thickness: Number(document.getElementById('thicknessSlider').value),
    gap: Number(document.getElementById('gapSlider').value),
    opacity: Number(document.getElementById('opacitySlider').value) / 100,
    offsetX: Number(document.getElementById('offsetXSlider').value),
    offsetY: Number(document.getElementById('offsetYSlider').value),
    customImagePath: (document.getElementById('imagePathDisplay').textContent !== 'No image selected')
      ? document.getElementById('imagePathDisplay').textContent : '',
    outlineEnabled: document.getElementById('outlineToggle').checked,
    outlineThickness: Number(document.getElementById('outlineThicknessSlider').value),
    outlineColor: document.getElementById('outlineColorPicker').value,
    imageSize: Number(document.getElementById('imageSizeSlider').value)
  };
}

async function switchProfile(name) {
  const success = await window.crosshairAPI.loadProfile(name);
  if (!success) return;
  settings = await window.crosshairAPI.getSettings();
  applySettingsToUI();
  document.getElementById('deleteProfileBtn').disabled = (name === 'Default');
}

function loadZoomUI() {
  document.getElementById('zoomModeToggle').checked = settings.zoomModeEnabled || false;
  document.getElementById('zoomTriggerType').value = settings.zoomTriggerType || 'hold';
  document.getElementById('zoomMouseSelect').value = settings.zoomKeybind || 'Mouse2';
}

async function toggleZoomConfig() {
  isZoomConfiguring = !isZoomConfiguring;
  const btn = document.getElementById('zoomConfigBtn');
  const card = document.querySelector('.zoom-card');
  if (isZoomConfiguring) {
    btn.classList.add('active');
    btn.textContent = 'Exit Zoom Config';
    card.classList.add('configuring');
    const zoomSettings = await window.crosshairAPI.getZoomSettings();
    applyZoomSettingsToUI(zoomSettings);
  } else {
    btn.classList.remove('active');
    btn.textContent = 'Configure Zoom Crosshair Style';
    card.classList.remove('configuring');
    settings = await window.crosshairAPI.getSettings();
    applySettingsToUI();
    window.crosshairAPI.forceOverlaySync();
  }
}

function applyZoomSettingsToUI(zs) {
  applySlider('sizeSlider', 'sizeValue', Number(zs.size), 'px');
  applySlider('thicknessSlider', 'thicknessValue', Number(zs.thickness), 'px');
  applySlider('gapSlider', 'gapValue', Number(zs.gap), 'px');
  applySlider('opacitySlider', 'opacityValue', Math.round(Number(zs.opacity) * 100), '%');
  setValue('colorPicker', zs.color);
  setValue('colorHex', zs.color);
  applySlider('imageSizeSlider', 'imageSizeValue', Number(zs.imageSize) || 60, 'px');

  const modeBtn = document.querySelector(`.mode-btn[data-mode="${zs.crosshairMode}"]`);
  if (modeBtn) {
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    modeBtn.classList.add('active');
  }
  toggleCrosshairMode(zs.crosshairMode);

  const shapeBtn = document.querySelector(`.shape-btn[data-shape="${zs.shape}"]`);
  if (shapeBtn) {
    document.querySelectorAll('.shape-btn').forEach(b => b.classList.remove('active'));
    shapeBtn.classList.add('active');
  }

  if (zs.customImagePath) {
    document.getElementById('imagePathDisplay').textContent = zs.customImagePath;
  } else {
    document.getElementById('imagePathDisplay').textContent = 'No image selected';
  }

  document.getElementById('outlineToggle').checked = zs.outlineEnabled || false;
  applySlider('outlineThicknessSlider', 'outlineThicknessValue', Number(zs.outlineThickness) || 1, 'px');
  setValue('outlineColorPicker', zs.outlineColor || '#000000');
  setValue('outlineColorHex', zs.outlineColor || '#000000');
  toggleOutlineControls(zs.outlineEnabled || false);
}

function updateSliderFill(el) {
  const min = parseFloat(el.min) || 0;
  const max = parseFloat(el.max) || 100;
  const val = parseFloat(el.value) || 0;
  const pct = ((val - min) / (max - min)) * 100;
  el.style.background = `linear-gradient(to right, var(--accent) 0%, var(--accent) ${pct}%, var(--bg-tertiary) ${pct}%, var(--bg-tertiary) 100%)`;
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


