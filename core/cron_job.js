var CronJob = require('cron').CronJob;

new CronJob('0-60/5 * * * * *', function() {
  console.log(Date()+': You will see this message every 3 second');
}, null, true);


new CronJob('0-60/30 * * * * *', function() {
    console.log(Date()+': You will see this message every 30 second');
  }, null, true);