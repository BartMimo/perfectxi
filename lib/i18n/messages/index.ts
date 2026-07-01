import type { Locale, MessageDict } from "../core";
import { commonMessages } from "./common";
import { startMessages } from "./start";
import { mijnSpelerMessages } from "./mijnSpeler";
import { careerMessages } from "./career";
import { challengeMessages } from "./challenge";
import { draftMessages } from "./draft";
import { ranglijstMessages } from "./ranglijst";
import { profielMessages } from "./profiel";
import { resultMessages } from "./result";
import { onlineCarriereMessages } from "./onlineCarriere";
import { positionMessages } from "./position";
import { achievementMessages } from "./achievement";

const NAMESPACES: MessageDict[] = [commonMessages, startMessages, mijnSpelerMessages, careerMessages, challengeMessages, draftMessages, ranglijstMessages, profielMessages, resultMessages, onlineCarriereMessages, positionMessages, achievementMessages];

function merge(dicts: MessageDict[]): Record<Locale, Record<string, string>> {
  const result: Record<Locale, Record<string, string>> = { nl: {}, en: {}, fr: {}, de: {}, es: {} };
  for (const dict of dicts) {
    for (const locale of Object.keys(dict) as Locale[]) {
      Object.assign(result[locale], dict[locale]);
    }
  }
  return result;
}

export const messages = merge(NAMESPACES);
