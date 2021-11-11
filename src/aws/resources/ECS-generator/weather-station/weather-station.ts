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
type script = () => Promise<void>
type delay = number | [number, number];

class WeatherStation {
  browser: browser;
  page: page;
  userId: string;
  stepName: string;
  stepStartTime: number;
  metrics: {
    responseTime: number | null;
    passed: boolean;
  };
  constructor(browser: browser, page: page, userId: string) {
    this.browser = browser;
    this.page = page;
    this.userId = userId;
    this.stepName = "";
    this.stepStartTime = NaN;
    this.metrics = { responseTime: NaN, passed: false };
  }
  private async startStep(stepName: string) {
    this.stepName = stepName;

    this.stepStartTime = Math.round(
      await this.page.evaluate(() => {
        const relativeTimeStamp = window.performance.now();
        const timeOrigin = window.performance.timeOrigin;
        return timeOrigin + relativeTimeStamp;
      })
    );
  }
  private async endStep(delay: delay, error?: Error) {
    if (!error) {
      const stepEndTime = Math.round(
        await this.page.evaluate(() => {
          const relativeTimeStamp = window.performance.now();
          const timeOrigin = window.performance.timeOrigin;
          return timeOrigin + relativeTimeStamp;
        })
      );
  
      this.metrics.responseTime = stepEndTime - this.stepStartTime;
      this.metrics.passed = true;
    } else {
      this.metrics.responseTime = null;
      this.metrics.passed = false;
    }
    
    this.writePointToFS();
    this.resetMeasures();
    if (delay) {
      if (typeof delay === 'number') {
        await this.sleep(delay);
      } else {
        await this.sleep(Math.random()*(delay[1] - delay[0]) + delay[0])
      }
    }
  }

  public async measure(stepName: string, script: script, delay: delay = 0) {
    await this.startStep(stepName);
    try {
      await script();
      await this.endStep(delay)
    } catch (error: any) {
      await this.endStep(delay, error)
    }
  }

  private resetMeasures() {
    this.stepName = "";
    this.stepStartTime = NaN;
    this.metrics = { responseTime: NaN, passed: false };
  }

  private writePointToFS() {
    const json = JSON.stringify({
      userId: this.userId,
      stepStartTime: this.stepStartTime,
      metrics: {
        responseTime: this.metrics.responseTime,
        passed: this.metrics.passed
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

}

export = WeatherStation;
