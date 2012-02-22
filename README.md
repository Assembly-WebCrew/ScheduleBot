Schedulebot for Assembly Organizing
===================================

Pushes updates from schedules to Twitter (or any output module) with Node. At the moment it digests
iCalendar files formatted in JSON. (Example:
[Assembly Summer 2011](http://ical2json.pb.io/www.assembly.org/summer11/program/schedule/assembly-summer-2011-all.ics))

Stuff to think about
--------------------
  * Web UI for logs and manual publishing

Useful links:
-------------
  * [Features to consider](https://jjudin.iki.fi/~barro/assembly-schedule-features.txt)
  * [node Twitter module](https://github.com/AvianFlu/ntwitter)

Installation:
-------------
  1. Install [Node.js](http://nodejs.org/)
  2. Clone this repo: `git clone git://github.com/tuhoojabotti/ScheduleBot.git`
  3. Install depencies (if needed): `npm install -f` (Force is due to some modules marked to require old Node.)
  4. Configure *all the things* and choose which output modules to keep in `./out/`
  5. Write `parser.js` to parse your preferred input format
  6. `npm start`
  7. Profit.