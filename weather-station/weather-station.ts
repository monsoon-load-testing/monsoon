import puppeteer from "puppeteer";
import fs from "fs";

/*
filename = 34f3n98-Load Main Page-134.json
{
    stepName: "Load Main Page",
    userId: "34f3n98",
    stepStartTime: 134,
    metrics: {
        responseTime: 900,
    }
}
*/

/*
/results
    - 34f3n98-Load Main Page-130.json
    - 34f3n98-Go To Page-130.json
*/

// OBSERVER - WEATHER_STATION:
//   - extract metrics
//   - save to directory on container FS

/*
PROPERTIES:
  browser: browser;
  page: page;
  userId: string;
  stepName
  stepStartTime
  metrics: {
    responseTime
  }
METHODS:
- 
- startStep(stepName: string): void
- endStep(stepName: string, delay?: int): void
- public endTest(): void
- private exportToJSON(): void
*/
type browser = puppeteer.Browser;
type page = puppeteer.Browser;

class WeatherStation {
  browser: browser;
  page: page;
  userId: string;
  constructor(browser: browser, page: page, userId: string) {
    this.browser = browser;
    this.page = page;
    this.userId = userId;
  }
}
