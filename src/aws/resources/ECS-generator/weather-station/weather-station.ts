import * as puppeteer from "puppeteer";
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
  markStart: {timeStamp, timeOrigin}
  markEnd: {same}
METHODS:
- 
- startStep(stepName: string): void
- endStep(stepName: string, delay?: int): void
- public endTest(): void
- private exportToJSON(): void
=============
startStep and endStep
- window.performance.mark()
- window.performance.measure()
- window.performance.timeOrigin
EXAMPLE SPA:
mark1: t=220ms, tOrigin = 10000
mark2: t=530ms, tOrigin = 10000
measure = 530 - 220 = 310ms
EXAMPLE different pages:
mark1: t=220ms, tOrigin= 10,000ms
mark2: t=65ms, tOrigin= 10,900ms
measure = t2 - t1 = (10900 + 65) - (10000 + 220) = 745ms
*/
type browser = puppeteer.Browser;
type page = puppeteer.Page;

class WeatherStation {
  browser: browser;
  page: page;
  userId: string;
  stepName: string;
  stepStartTime: number;
  metrics: {
    responseTime: number;
  };
  constructor(browser: browser, page: page, userId: string) {
    this.browser = browser;
    this.page = page;
    this.userId = userId;
    this.stepName = "";
    this.stepStartTime = NaN;
    this.metrics = { responseTime: NaN };
  }
  public async startStep(stepName: string) {
    this.stepName = stepName;

    this.stepStartTime = Math.round(
      await this.page.evaluate(() => {
        const relativeTimeStamp = window.performance.now();
        const timeOrigin = window.performance.timeOrigin;
        return timeOrigin + relativeTimeStamp;
      })
    );
  }
  public async endStep(stepName: string, delay: number = 0) {
    const stepEndTime = Math.round(
      await this.page.evaluate(() => {
        const relativeTimeStamp = window.performance.now();
        const timeOrigin = window.performance.timeOrigin;
        return timeOrigin + relativeTimeStamp;
      })
    );

    this.metrics.responseTime = stepEndTime - this.stepStartTime;
    this.writePointToFS();
    this.resetObserver();
    if (delay) {
      this.sleep(delay);
    }
  }

  private resetObserver() {
    this.stepName = "";
    this.stepStartTime = NaN;
    this.metrics = { responseTime: NaN };
  }

  private writePointToFS() {
    const json = JSON.stringify({
      userId: this.userId,
      stepStartTime: this.stepStartTime,
      metrics: {
        responseTime: this.metrics.responseTime,
      },
    });

    const fileName = `${this.userId}-${this.stepName}-${this.stepStartTime}.json`;
    const directoryName = "../load-generation/results";
    if (!fs.existsSync(directoryName)) {
      fs.mkdirSync(directoryName);
    }
    fs.writeFile(`${directoryName}/${fileName}`, json, (err) => {
      if (err) throw err;
      console.log(`${fileName} has been saved`);
    });
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public endTest() {}
}

export = WeatherStation;
