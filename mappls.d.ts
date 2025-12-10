declare global {
  interface Window {
    mappls: {
      Map: new (element: HTMLElement, options: any) => any;
      Marker: new (options: any) => any;
    };
  }
}

export {};
