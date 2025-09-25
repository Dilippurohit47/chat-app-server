const mockStore = new Map<string, string>(); 
 export const mockRedisStore = {
    get: async (k: string) => mockStore.get(k),
    set: async (k: string, v: string) => {
      mockStore.set(k, v);
      return "OK";
    },
    publish: async (ch: string, msg: string) =>
      console.log(`[MockPub] ${ch}: ${msg}`), 
    subscribe: async (ch: string, cb: (msg: string) => void) =>
      console.log(`[MockSub] ${ch}`),
    on: () => {}, 
    connect: async () => {}, 
    quit: async () => {}, 
  }; 