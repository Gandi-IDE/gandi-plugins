export interface Contact {
  name: string;
  avatar: string;
  desc?: string;
  generator?: (text: string) => Promise<string>;
  type?: Type;
  duration?: number;
}

export enum Type {
  MUSIC = "MUSIC",
  IMAGE = "IMAGE",
}
