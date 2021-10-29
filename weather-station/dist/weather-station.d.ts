import * as puppeteer from "puppeteer";
declare type browser = puppeteer.Browser;
declare type page = puppeteer.Page;
declare class WeatherStation {
    browser: browser;
    page: page;
    userId: string;
    stepName: string;
    stepStartTime: number;
    metrics: {
        responseTime: number;
    };
    constructor(browser: browser, page: page, userId: string);
    startStep(stepName: string): Promise<void>;
    endStep(stepName: string, delay?: number): Promise<void>;
}
export = WeatherStation;
