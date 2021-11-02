"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const fs_1 = __importDefault(require("fs"));
class WeatherStation {
    constructor(browser, page, userId) {
        this.browser = browser;
        this.page = page;
        this.userId = userId;
        this.stepName = "";
        this.stepStartTime = NaN;
        this.metrics = { responseTime: NaN };
    }
    async startStep(stepName) {
        this.stepName = stepName;
        this.stepStartTime = Math.round(await this.page.evaluate(() => {
            const relativeTimeStamp = window.performance.now();
            const timeOrigin = window.performance.timeOrigin;
            return timeOrigin + relativeTimeStamp;
        }));
    }
    async endStep(stepName, delay = 0) {
        const stepEndTime = Math.round(await this.page.evaluate(() => {
            const relativeTimeStamp = window.performance.now();
            const timeOrigin = window.performance.timeOrigin;
            return timeOrigin + relativeTimeStamp;
        }));
        this.metrics.responseTime = stepEndTime - this.stepStartTime;
        this.writePointToFS();
        this.resetObserver();
        if (delay) {
            this.sleep(delay);
        }
    }
    resetObserver() {
        this.stepName = "";
        this.stepStartTime = NaN;
        this.metrics = { responseTime: NaN };
    }
    writePointToFS() {
        const json = JSON.stringify({
            userId: this.userId,
            stepStartTime: this.stepStartTime,
            metrics: {
                responseTime: this.metrics.responseTime,
            },
        });
        const fileName = `${this.userId}-${this.stepName}-${this.stepStartTime}.json`;
        const directoryName = "../results";
        if (!fs_1.default.existsSync(directoryName)) {
            fs_1.default.mkdirSync(directoryName);
        }
        fs_1.default.writeFile(`../results/${fileName}`, json, (err) => {
            if (err)
                throw err;
            console.log(`${fileName} has been saved`);
        });
    }
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    endTest() { }
}
module.exports = WeatherStation;
