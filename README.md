Schedulebot for Assembly Organizing
===================================

Pushes updates from schedule to Twitter (or any output module) with Node. At the moment it digests
iCalendar files formatted in JSON. (Example:
[Assembly Summer 2011](http://ical2json.pb.io/www.assembly.org/summer11/program/schedule/assembly-summer-2011-all.ics))

Stuff to think about (todo)
---------------------------
  * Logging
  * Unit tests
  * [Features to consider](https://jjudin.iki.fi/~barro/assembly-schedule-features.txt)

Installation:
-------------
  1. Install [Node.js](http://nodejs.org/)
  2. Clone this repo: `git clone git://github.com/tuhoojabotti/ScheduleBot.git`
  3. Install depencies (should not be needed): `npm install -f`.
  4. Configure *all the things* and choose which output modules to keep in `./out/`
  5. Select/Write a to parser your preferred input format
  6. `npm start` or `node core.js`