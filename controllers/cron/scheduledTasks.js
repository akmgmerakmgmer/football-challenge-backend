const cron = require('node-cron');
const cronController = require('../cronController.min.js');
const systemController = require('../systemController.min.js');

// 1. Daily at 11:59:00 PM
function scheduleDailyRankings() {
    cron.schedule('00 59 23 * * *', () => {
        cronController.get_rankings('daily');
    });
}

// 2. Weekly on Saturday at 11:59:10 PM
function scheduleWeeklyRankings() {
    cron.schedule('10 59 23 * * 5', () => {
        cronController.get_rankings('weekly');
    });
}

// 3. Monthly on the last day of the month at 11:59:20 PM
function scheduleMonthlyRankings() {
    cron.schedule('40 59 23 * * *', () => {
        const now = new Date();
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

        if (now.getDate() === lastDay) {
            cronController.get_rankings('monthly');
            systemController.changeSystemInfo();
        }
    });
}

// 4. Yearly on January 1st at 11:59:30 PM
function scheduleYearlyRankings() {
    cron.schedule('30 59 23 1 1 *', () => {
        cronController.get_rankings('yearly');
    });
}

function initializeScheduledTasks() {
    scheduleDailyRankings();
    scheduleWeeklyRankings();
    scheduleMonthlyRankings();
    scheduleYearlyRankings();
}

module.exports = {
    initializeScheduledTasks
}; 