export interface TimeLapse {
  started: string;
  ended: string;
  duration: number;
}

export interface StandardResponse<T> {
  success: boolean;
  kindMessage: string;
  data?: T;
  httpCode: number;
  timeLapse: TimeLapse;
}

export class ApiResponse {
  static success<T>(
    data: T, 
    message: string = "Operación exitosa", 
    httpCode: number = 200,
    startTime: [number, number]
  ): StandardResponse<T> {
    const duration = this.getDurationInMilliseconds(startTime);
    const now = new Date().toISOString();

    return {
      success: true,
      kindMessage: message,
      data,
      httpCode,
      timeLapse: {
        started: new Date(Date.now() - duration).toISOString(),
        ended: now,
        duration: Math.round(duration * 100) / 100
      }
    };
  }

  static error(
    message: string, 
    httpCode: number = 500,
    startTime: [number, number]
  ): StandardResponse<null> {
    const duration = this.getDurationInMilliseconds(startTime);
    const now = new Date().toISOString();

    return {
      success: false,
      kindMessage: message,
      httpCode,
      timeLapse: {
        started: new Date(Date.now() - duration).toISOString(),
        ended: now,
        duration: Math.round(duration * 100) / 100
      }
    };
  }

  private static getDurationInMilliseconds(start: [number, number]): number {
    const hrtime = process.hrtime(start);
    return (hrtime[0] * 1000 + hrtime[1] / 1000000);
  }
}
