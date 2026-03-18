export const enum LANG {
  ES = "es",
  EN = "en",
}

export interface ILangLoader {
  load(lang: LANG): Record<string, unknown>;
}

export type LangProviderFn = (
  key: string,
  args?: Record<string, unknown>,
  lang?: LANG
) => string;

export class LangService {
  constructor(
    private readonly loader: ILangLoader,
    private readonly lang: LANG
  ) {}

  __(key: string, args?: Record<string, unknown>): string {
    const data = this.loader.load(this.lang);
    const template = this.resolve(data, key);
    return args ? this.interpolate(template, args) : template;
  }

  private resolve(data: Record<string, unknown>, key: string): string {
    const properties = key.split(".");
    const value = properties.reduce(
      (obj, prop) => (obj as Record<string, unknown>)?.[prop],
      data as unknown
    );

    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      return String(value);
    }

    if (typeof value === "object") return JSON.stringify(value);

    return `[Missing translation for key: ${key}]`;
  }

  private interpolate(template: string, args: Record<string, unknown>): string {
    return Object.entries(args).reduce(
      (text, [key, val]) => text.replaceAll(`{{${key}}}`, String(val)),
      template
    );
  }
}

let provider: LangProviderFn = () => "[Lang not initialized]";

export const translate = (
  key: string,
  args?: Record<string, unknown>,
  lang?: LANG
): string => {
  return provider(key, args, lang);
};

export const setLangProvider = (fn: LangProviderFn) => {
  provider = fn;
};
