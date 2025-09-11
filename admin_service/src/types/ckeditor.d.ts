declare module '@ckeditor/ckeditor5-build-classic' {
  const ClassicEditor: any;
  export = ClassicEditor;
}

declare module '@ckeditor/ckeditor5-react' {
  import { Component } from 'react';

  interface Editor {
    getData(): string;
    setData(data: string): void;
  }

  interface CKEditorProps {
    editor: any;
    data?: string;
    config?: any;
    onChange?: (event: any, editor: Editor) => void;
    onReady?: (editor: Editor) => void;
    onFocus?: (event: any, editor: Editor) => void;
    onBlur?: (event: any, editor: Editor) => void;
  }

  export class CKEditor extends Component<CKEditorProps> {}
}