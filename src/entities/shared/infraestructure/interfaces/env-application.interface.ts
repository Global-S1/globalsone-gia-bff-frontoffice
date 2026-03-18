import { LANG } from "../../domain/services/lang.service";

type TPORT = string | number;

export interface IEnvApp {
  name: string;
  port: TPORT;
  defaultLang: LANG;
}
