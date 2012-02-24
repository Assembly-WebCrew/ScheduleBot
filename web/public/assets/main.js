$(function init() {
  if (!$.fn.details.support) { $('html').addClass('no-details'); }

  // Switch to relative date representation
  $('details').each(function times(i, e) {
    var $e = $('summary time', e),
     sdate = $e.attr('datetime'),
     diff;
    // start date
    //$e.html(moment($e.attr('datetime')).calendar());
    // duration in hours
    $e = $('li time', e);
    diff = moment($e.attr('datetime')).diff(sdate, 'hours', true);
    $e.html(diff.toFixed(1) + ' hours');
    
    
  });

   $('details').details();
});