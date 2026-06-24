import API from './axios';

export const settingsApi = {
  get:         ()     => API.get('/settings'),
  update:      (data) => API.put('/settings', data),
  updateTheme: (data) => API.put('/settings', {
    themePreset:    data.themePreset,
    siteTheme:      data.siteTheme,
    colorPrimary:   data.colorPrimary,
    colorSecondary: data.colorSecondary,
    colorBg:        data.colorBg,
    colorCard:      data.colorCard,
    colorText:      data.colorText,
    colorBorder:    data.colorBorder,
    fontBody:       data.fontBody,
    fontDisplay:    data.fontDisplay,
    borderRadius:   data.borderRadius,
    buttonRadius:   data.buttonRadius,
  }),
};
