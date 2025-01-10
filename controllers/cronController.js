const User = require("../models/userModel");

const getCurrentDay = () => {
    let today = new Date();
    function addLeadingZero(num) {
        return num < 10 ? `0${num}` : num;
    }
    let day = addLeadingZero(today.getDate());
    let month = addLeadingZero(today.getMonth() + 1); // Months are zero-based
    let year = today.getFullYear();
    return `${year}-${month}-${day}`;
}

const getCurrentYear = () => {
    let today = new Date();
    let year = today.getFullYear();
    console.log(year)
    return parseInt(year);
}

const getCurrentMonth = () => {
    let today = new Date();
    let month = addLeadingZero(today.getMonth() + 1)
    console.log(month)
    return parseInt(month);
}

function getLastSaturday(currentDate) {
    // Get the current day of the week (0 for Sunday, 1 for Monday, ..., 6 for Saturday)
    const currentDayOfWeek = currentDate.getDay();

    // Calculate the difference in days to get to the last Saturday
    const daysToLastSaturday = currentDayOfWeek === 6 ? 0 : currentDayOfWeek + 1;

    // Subtract the difference from the current date to get the last Saturday
    const lastSaturday = new Date(currentDate);
    lastSaturday.setDate(currentDate.getDate() - daysToLastSaturday);

    // Convert the date to 'YYYY-MM-DD' format using moment.js
    return moment(lastSaturday).format('YYYY-MM-DD');
}
const sortUsers = (searchTime) => {
    if (searchTime === 'daily') return { "user_points.dailyPoints.points": -1 }
    if (searchTime === 'weekly') return { "user_points.weeklyPoints.points": -1 }
    if (searchTime === 'monthly') return { "user_points.monthlyPoints.points": -1 }
    if (searchTime === 'yearly') return { "user_points.yearlyPoints.points": -1 }
}
const unwindUsers = (searchTime) => {
    if (searchTime === 'daily') return "$user_points.dailyPoints"
    if (searchTime === 'weekly') return "$user_points.weeklyPoints"
    if (searchTime === 'monthly') return "$user_points.monthlyPoints"
    if (searchTime === 'yearly') return "$user_points.yearlyPoints"
}
const matchFilters = (searchTime) => {
    const match = { $and: [{ $or: [{ username: { $regex: '', $options: "i" } }] }] }
    if (searchTime === 'daily') match.$and.push({ "user_points.dailyPoints.day": getCurrentDay() })
    else if (searchTime === 'weekly') match.$and.push({ "user_points.weeklyPoints.weekDate": getLastSaturday(new Date()) })
    else if (searchTime === 'monthly') match.$and.push({ "user_points.monthlyPoints.year": getCurrentYear(), "user_points.monthlyPoints.month": getCurrentMonth() })

    else if (searchTime === 'yearly') match.$and.push({ "user_points.yearlyPoints.year": getCurrentYear() })
    return match
}

const getPrizes = (searchTime) => {
    const dailyPrizes = [1000, 750, 500, 300, 200]
    const weeklyPrizes = [3000, 1500, 1000, 500, 250]
    const monthlyPrizes = [10000, 5000, 2500, 1500, 1000]
    const yearlyPrizes = [50000, 30000, 10000, 5000, 2500]
    return searchTime === 'daily' ? dailyPrizes : searchTime === 'weekly' ? weeklyPrizes : searchTime === 'monthly' ? monthlyPrizes : yearlyPrizes
}

const get_rankings = (searchTime) => {

    User.aggregate([
        {
            $match: matchFilters(searchTime)
        },
        // Unwind the weeklyPoints array to get individual documents for each element
        { $unwind: unwindUsers(searchTime) },
        {
            $match: matchFilters(searchTime)
        },
        // Sort by the last index of weeklyPoints
        { $sort: sortUsers(searchTime) },
        { $limit: 5 }
    ]).then(async (sortedUsers) => {
        for (let i in sortedUsers) {
            const currentUserPrize = {
                "prizeType": "coins",
                "coins": getPrizes(searchTime)[i],
                "searchTime": searchTime
            }
            await User.findByIdAndUpdate({ _id: sortedUsers[i]._id.toString() }, { $push: { prizes: currentUserPrize } }).then(res => { })
        }
        console.log(searchTime === 'daily' ? 'DailyCronCalled' : searchTime === 'weekly' ? 'WeeklyCronCalled' : searchTime === 'monthly' ? 'MonthlyCronCalled' : 'YealyCronCalled')
    }).catch((err) => {
        console.log(err)
    });
}

module.exports = { get_rankings }