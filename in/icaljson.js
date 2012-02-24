var fs = require('fs')
  , _ = require('underscore');
// Load string helper functions
_.str = require('underscore.string');
_.mixin(_.str.exports());

/*
 * This file contains data parser, that parses your calendar data to the following structure:
 * [
 *   {  "sdate": {Date} starting date and time
 *    , "edate": {Date} ending date and time
 *    ,  "href": {String} url to display: 'http://www.assembly.org/summer11/come-to-party/entry-setup'
 *    ,  "text": {String} summary of the event: 'LOL Compo'
 *    , "place": {String} location of the event: 'Main Stage'
 *    ,  "type": {Array} categories: ['CompoGame', 'Major', 'Event'] },
 *   { ... },
 *   And so on.
 * ]
 */

/* Once parsing is done, export the data like this:
module.export = function (config, cb) { cb(data); };
*/

// Here's an example for iCalendar data converted to json:
function parseJSON(config, cb) {

  function parseDate(d) {
    //typical RFC date-time format
    var comps = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/.exec(d);
    if (comps !== null) {
      if (comps[7] == 'Z'){ // GMT
        return new Date(Date.UTC(
          comps[1],
          parseInt(comps[2])-1,
          comps[3],
          comps[4],
          comps[5],
          comps[6]
        ));
      } else {
        return new Date(
          comps[1],
          parseInt(comps[2])-1,
          comps[3],
          comps[4],
          comps[5],
          comps[6]
        );
      }
    } else {
      cb(new Error('Failed to parse Date: ' + d));
    }
  }

  function parseCalData(e) {
    return {
        "sdate": parseDate(e.DTSTART)
      , "edate": parseDate(e.DTEND)
      ,  "href": e.URL.length > 5 ? e.URL : ''
      ,  "text": e.SUMMARY
      , "place": e.LOCATION
      ,  "type": _.camelize(e.CATEGORIES)
    };
  }

  // Parse JSON
  try {
    var rawData = JSON.parse(fs.readFileSync(config.file, 'utf8'));
  } catch (e) {
    console.error('Failed to parse JSONified vCalendar data!');
    cb(e); return;
  }

  // No errors
  cb(null, rawData['VCALENDAR']['VEVENT'].map(parseCalData));
}


module.exports = parseJSON;
