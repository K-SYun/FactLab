/// <reference types="@ckeditor/ckeditor5-react" />
declare module '@ckeditor/ckeditor5-build-classic' {
    const ClassicEditor: any;   // ← any로 타입 에러 회피
    export = ClassicEditor;
  }