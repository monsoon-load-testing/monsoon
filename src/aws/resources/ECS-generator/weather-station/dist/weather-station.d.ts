import * as puppeteer from "puppeteer";
declare type browser = puppeteer.Browser;
declare type page = puppeteer.Page;
declare type script = () => Promise<void>;
declare type delay = number | [number, number];
declare class WeatherStation {
    browser: browser;
    page: page;
    userId: string;
    stepName: string;
    stepStartTime: number;
    metrics: {
        responseTime: number | null;
        passed: boolean;
    };
    static timeout: number;
    constructor(browser: browser, page: page, userId: string);
    private startStep;
    private endStep;
    measure(stepName: string, script: script, delay?: delay): Promise<void>;
    private resetMeasures;
    private writePointToFS;
    private sleep;
}
export = WeatherStation;
