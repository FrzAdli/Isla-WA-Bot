const moment = require('moment');

async function getTime() {
    const currentTime = moment();

    const year = currentTime.year();
    const month = currentTime.format('MMMM');
    const date = currentTime.date();
    const day = currentTime.format('dddd');
    const hour = currentTime.hour();
    const minute = currentTime.minute();
    const second = currentTime.second();

    const total = `Year: ${year}, Month: ${month}, Date: ${date}, Day: ${day}, Hour: ${hour}, Minute: ${minute}, Second: ${second}`;
    return total;
}

module.exports = getTime;