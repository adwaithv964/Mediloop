declare module 'crypto-js' {
  export interface CipherHelper {
    encrypt(message: string, key: string): any;
    decrypt(ciphertext: any, key: string): any;
  }

  export const AES: CipherHelper;

  export namespace enc {
    const Utf8: any;
  }
}
