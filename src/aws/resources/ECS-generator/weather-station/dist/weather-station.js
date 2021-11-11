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
        this.metrics = { responseTime: NaN, passed: false };
    }
    async startStep(stepName) {
        this.stepName = stepName;
        this.stepStartTime = Math.round(await this.page.evaluate(() => {
            const relativeTimeStamp = window.performance.now();
            const timeOrigin = window.performance.timeOrigin;
            return timeOrigin + relativeTimeStamp;
        }));
    }
    async endStep(delay, error) {
        if (!error) {
            const stepEndTime = Math.round(await this.page.evaluate(() => {
                const relativeTimeStamp = window.performance.now();
                const timeOrigin = window.performance.timeOrigin;
                return timeOrigin + relativeTimeStamp;
            }));
            this.metrics.responseTime = stepEndTime - this.stepStartTime;
            this.metrics.passed = true;
        }
        else {
            this.metrics.responseTime = null;
            this.metrics.passed = false;
        }
        this.writePointToFS();
        this.resetMeasures();
        if (delay) {
            if (typeof delay === 'number') {
                await this.sleep(delay);
            }
            else {
                await this.sleep(Math.random() * (delay[1] - delay[0]) + delay[0]);
            }
        }
    }
    async measure(stepName, script, delay = 0) {
        await this.startStep(stepName);
        let timeoutId;
        try {
            timeoutId = setTimeout(() => new Error("Step took too long to complete. Max 10s"), 10000);
            await script();
            clearTimeout(timeoutId);
            timeoutId = undefined;
            await this.endStep(delay);
        }
        catch (error) {
            await this.endStep(delay, error);
            if (timeoutId !== undefined)
                clearTimeout(timeoutId);
        }
    }
    resetMeasures() {
        this.stepName = "";
        this.stepStartTime = NaN;
        this.metrics = { responseTime: NaN, passed: false };
    }
    writePointToFS() {
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
        if (!fs_1.default.existsSync(directoryName)) {
            fs_1.default.mkdirSync(directoryName);
        }
        fs_1.default.writeFile(`${directoryName}/${fileName}`, json, (err) => {
            if (err)
                throw err;
            console.log(`${fileName} has been saved`);
        });
    }
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
module.exports = WeatherStation;
