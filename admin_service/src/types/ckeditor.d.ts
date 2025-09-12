/// <reference types="@ckeditor/ckeditor5-react" />
declare module '@ckeditor/ckeditor5-build-classic' {
  const ClassicEditor: any;   // ← any로 타입 에러 회피
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

  export class CKEditor extends Component<CKEditorProps> { }
}