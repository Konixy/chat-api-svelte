import { PassportLocalDocument } from "mongoose";

export interface APIAdmin extends PassportLocalDocument {
  email: string;
  password: string;
}

export interface APIGame {
  _id: string;
  name: string;
  release: string;
  releaseDate: string;
  lastUpdate: string;
  lastUpdateDate: string;
  description?: string;
  tutorial?: string;
  bgUrl?: string;
  coverUrl?: string;
  videoId?: string;
  crackDlLink?: string;
  crackDlSize?: string;
  crackDlLinkType?: string;
  isOnline?: string;
  additionalLinks?: AdditionnalLink[];
}

interface AdditionnalLink {
  _id: string;
  name: string;
  link: string;
  linkType: "rar" | "torrent";
}
