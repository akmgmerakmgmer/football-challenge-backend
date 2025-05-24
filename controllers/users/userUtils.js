const moment = require('moment');

// Date helpers
const getCurrentDate = () => moment().format('YYYY-MM-DD');

const getLastSaturday = (currentDate) => {
    const currentDayOfWeek = currentDate.getDay();
    const daysToLastSaturday = currentDayOfWeek === 6 ? 0 : currentDayOfWeek + 1;
    const lastSaturday = new Date(currentDate);
    lastSaturday.setDate(currentDate.getDate() - daysToLastSaturday);
    return moment(lastSaturday).format('YYYY-MM-DD');
};

const getSaturdayBeforeLast = (currentDate) => {
    const lastSaturday = getLastSaturday(currentDate);
    const lastSaturdayDate = new Date(lastSaturday);
    const saturdayBeforeLast = new Date(lastSaturdayDate);
    saturdayBeforeLast.setDate(lastSaturdayDate.getDate() - 7);
    return moment(saturdayBeforeLast).format('YYYY-MM-DD');
};

const numberOfDaysToPlayerLastSaturday = (playerLastSaturday) => {
    const currentDate = moment(new Date(), 'YYYY-MM-DD');
    const playerDate = moment(playerLastSaturday, 'YYYY-MM-DD');
    return currentDate.diff(playerDate, 'days');
};

const getCurrentDay = () => {
    const today = new Date();
    const addLeadingZero = num => (num < 10 ? `0${num}` : num);
    const day = addLeadingZero(today.getDate());
    const month = addLeadingZero(today.getMonth() + 1);
    const year = today.getFullYear();
    return `${year}-${month}-${day}`;
};

const calculatePercentage = (total_results) => {
    const total_games = total_results.wins + total_results.loses + total_results.draws;
    return `${Math.round((total_results.wins / total_games) * 100)}%`;
};

module.exports = {
    getCurrentDate,
    getLastSaturday,
    getSaturdayBeforeLast,
    numberOfDaysToPlayerLastSaturday,
    getCurrentDay,
    calculatePercentage
}; 