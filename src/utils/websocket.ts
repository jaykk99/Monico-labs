class WebSocketClient {
  private url: string;
  private ws: WebSocket;

  constructor(url: string) {
    this.url = url;
    this.ws = new WebSocket(url);
    this.ws.onopen = () => {
      console.log('WebSocket connection established');
    };
  }

  public onmessage = (callback: (event: MessageEvent) => void) => {
    this.ws.onmessage = callback;
  };

  public onerror = (callback: (event: Event) => void) => {
    this.ws.onerror = callback;
  };

  public onclose = (callback: () => void) => {
    this.ws.onclose = callback;
  };

  public send = (message: string) => {
    this.ws.send(message);
  };

  public close = () => {
    this.ws.close();
  };

  static isConnected = (url: string): boolean => {
    const ws = new WebSocket(url);
    ws.onopen = () => {
      ws.close();
      return true;
    };
    ws.onerror = () => {
      return false;
    };
    return false;
  };
}

export default WebSocketClient;
