import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'Workspace Reflow',
    description: 'Pin one live workspace region into a large, keyboard-first reading pane.',
    version: '1.0.0',
    permissions: ['activeTab', 'storage'],
    host_permissions: ['<all_urls>', 'https://api.sociobot.in/*'],
    action: {
      default_title: 'Open Workspace Reflow',
      default_icon: {
        '16': 'icon/16.png',
        '32': 'icon/32.png',
        '48': 'icon/48.png',
        '128': 'icon/128.png'
      }
    },
    icons: {
      '16': 'icon/16.png',
      '32': 'icon/32.png',
      '48': 'icon/48.png',
      '128': 'icon/128.png'
    },
    commands: {
      'toggle-reflow': {
        suggested_key: {
          default: 'Alt+Shift+R',
          mac: 'Alt+Shift+R'
        },
        description: 'Select a region to reflow'
      }
    }
  }
});
