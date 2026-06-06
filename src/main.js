import { initUI, refreshAnalytics, triggerFullRender } from './ui.js';
import { initAuth } from './auth.js';
import { initUserState, resetState } from './state.js';

// Boot the application
document.addEventListener('DOMContentLoaded', () => {
  initUI();
  
  initAuth(async (user) => {
    if (user) {
      // User logged in, fetch their data
      await initUserState(user.uid);
      triggerFullRender();
    } else {
      // User logged out, clear data
      resetState();
      triggerFullRender();
    }
  });
});
