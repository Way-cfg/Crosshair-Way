const { AutoUnpackNativesPlugin } = require('@electron-forge/plugin-auto-unpack-natives');

module.exports = {
  packagerConfig: {
    name: 'Crosshair Way',
    executableName: 'crosshair-way',
    asar: true,
    platform: ['win32'],
    arch: ['x64'],
    win32metadata: {
      CompanyName: 'Way-cfg',
      FileDescription: 'Crosshair Way - Premium Crosshair Overlay',
      ProductName: 'Crosshair Way',
      InternalName: 'crosshair-way'
    }
  },
  rebuildConfig: {},
  plugins: [
    new AutoUnpackNativesPlugin({})
  ],
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'CrosshairWay',
        authors: 'Way-cfg',
        description: 'Premium open-source crosshair overlay for Windows gamers',
        noMsi: false
      }
    },
    {
      name: '@electron-forge/maker-wix',
      config: {
        name: 'CrosshairWay',
        appUserModelId: 'Way-cfg.CrosshairWay',
        manufacturer: 'Way-cfg',
        description: 'Premium open-source crosshair overlay for Windows gamers',
        language: 1033
      }
    }
  ]
};
