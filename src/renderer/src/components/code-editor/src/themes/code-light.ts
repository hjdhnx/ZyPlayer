import * as monaco from 'monaco-editor';

monaco.editor.defineTheme('code-light', {
  base: 'vs',
  inherit: true,
  rules: [],
  colors: {
    focusBorder: '#00000000',
    'editor.background': '#e8e8e8',
    'editor.lineHighlightBorder': '#a6a6a64f',
  },
});
