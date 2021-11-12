import * as puppeteer from "puppeteer";
import fs from "fs";

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

    const timeout = 10_000;
    const scriptPromise = new Promise((resolve, reject) => {
        script().then((data) => resolve("passed")).catch((err) => reject(err))
      }
    )
    const timeoutPromise = new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error(`Failed to retrieve data after ${timeout} milliseconds`))
      }, timeout)
    });
    try {
      const resolvedValue = await Promise.race([scriptPromise, timeoutPromise]);
      await this.endStep(delay)
    } catch (err: any) {
      await this.endStep(delay, err)
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
