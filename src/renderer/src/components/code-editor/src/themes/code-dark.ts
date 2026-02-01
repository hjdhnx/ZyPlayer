import * as monaco from 'monaco-editor';

monaco.editor.defineTheme('code-dark', {
  base: 'vs-dark',
  inherit: true,
  rules: [],
  colors: {
    focusBorder: '#00000000',
    'editor.background': '#393939',
    'editor.lineHighlightBorder': '#4b4b4b9f',
  },
});
