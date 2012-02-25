$(function init() {
  if (!$.fn.details.support) { $('html').addClass('no-details'); }

  // Switch to relative date representation.
  $('details').each(function times(i, e) {
    var $e, diff, sdate;

    // Duration in hours
    $e = $('summary time', e)
    sdate = $e.attr('datetime');
    $e = $('li time', e);
    diff = moment($e.attr('datetime')).diff(sdate, 'hours', true);
    $e.html(diff.toFixed(1) + ' hours');

    // Shorten links
    $e = $('li a', e);
    $e.html(shorturl($e.html()));

  });

   $('details').details();
});

// Helpful little function, thanks to jhh!
function shorturl(url) {return url.length > 32 ? url.replace(/^([^:]+:\/\/[^\/]+).*(\/[^\/?]+)(\?.*)?$/, "$1/...$2") : url;}