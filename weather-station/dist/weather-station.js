"use strict";
class WeatherStation {
    constructor(browser, page, userId) {
        this.browser = browser;
        this.page = page;
        this.userId = userId;
        this.stepName = "";
        this.stepStartTime = NaN;
        this.metrics = { responseTime: NaN };
        // this.markStart = { timeOrigin: NaN, relativeTimeStamp: NaN };
    }
    async startStep(stepName) {
        this.stepName = stepName;
        this.stepStartTime = await this.page.evaluate(() => {
            const relativeTimeStamp = window.performance.now();
            const timeOrigin = window.performance.timeOrigin;
            return timeOrigin + relativeTimeStamp;
        });
    }
    async endStep(stepName, delay) {
        const stepEndTime = await this.page.evaluate(() => {
            const relativeTimeStamp = window.performance.now();
            const timeOrigin = window.performance.timeOrigin;
            return timeOrigin + relativeTimeStamp;
        });
        this.metrics.responseTime = stepEndTime - this.stepStartTime;
        // use responseTime to format a data object and send it to local FS
    }
}
module.exports = WeatherStation;
