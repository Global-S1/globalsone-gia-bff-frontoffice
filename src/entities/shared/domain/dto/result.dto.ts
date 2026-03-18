import {
  IDBDataItemRequired,
  IDBDataItemsRequired,
} from "../interfaces/db-response.interface";

export interface IResult<T = unknown> {
  success: boolean;
  data?: T;
  kindMessage?: string;
}

export class Result {
  public static Success<T>(data: T, kindMessage: string = "") {
    const result: IResult<T> = {
      success: true,
      data,
      kindMessage,
    };

    return result;
  }

  public static Failure<T>(kindMessage: string, data?: T) {
    const result: IResult<T> = {
      success: false,
      data,
      kindMessage,
    };

    return result;
  }

  public static Item<T>(data: T) {
    const result: IDBDataItemRequired<T> = {
      item: data,
    };

    return result;
  }

  public static Items<T>(data: T[]) {
    const result: IDBDataItemsRequired<T> = {
      items: data,
    };

    return result;
  }
}
