module.exports = {
  millisecond: 1,
  second: 1000 * this.millisecond,
  minute: 60 * this.minute,
  hour: 60 * this.minute,
  day: 24 * this.hour,
  week: 7 * this.day,
  month: 31 * this.day,
  year: 365 * this.day
}
