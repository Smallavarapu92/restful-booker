var x2js = new X2JS(),
    payloadFlag,
    indexFlag;

$( document ).ready(function() {
  payloadFlag = $('#payloadFlag').val();
  indexFlag = $('#indexFlag').val();

  if($('#editFlag').val() === 'partial'){
    $('#editModal input, #editModal select').change(function(){
      partialEditBooking($(this).val(), $(this).attr('id'), $('#editBookingId').val())
    })
  }

  currentPage = parseInt(getUrlVars()['page'])

  $('#editModal').modal({ show: false})
  $('#prev a').attr('href', '/?page=' + (currentPage - 1));
  $('#next a').attr('href', '/?page=' + (currentPage + 1));

  if(getUrlVars()['page'] === '1' || indexFlag != 'page'){
    $('#prev').css('visibility', 'hidden')
  }

  $('.datepicker').datepicker({
    dateFormat: 'yy-mm-dd'
  });

  $('.editDatepicker').datepicker({
    dateFormat: 'yy-mm-dd'
  });

  populateBookings();
});

var populateBookings = function(){
  var path;

  if(indexFlag === 'page'){
    path = '/booking?page=' + getUrlVars()['page'];
  } else {
    path = '/booking';
  }

  $.get(path, function(data) {
      var payload,
          limit,
          count = 0;

      switch (payloadFlag) {
        case 'json':
          payload = data;
          limit = payload.length - 1;
          break;
        case 'xml':
          payload = x2js.xml_str2json(data)['bookings']['booking'];
          limit = payload.length - 1;
          break;
        case 'form':
          payload = form2Json(data);
          limit = Object.keys(payload).length - 1;
          break;
      }

      if(limit < 9 || indexFlag != 'page'){
        $('#next').css('visibility', 'hidden');
      }

      (getBooking = function(){
        var bookingid = payload[count].id;

        $.get('/booking/' + bookingid, function(booking){
          if(payloadFlag === "xml") booking = x2js.xml_str2json(booking).booking;
          if(payloadFlag === "form") booking = form2Json(booking);

          $('#bookings')
            .append('<div class="row" id=' + bookingid + '><div class="col-md-2"><p>' + booking.firstname + '</p></div><div class="col-md-2"><p>' + booking.lastname + '</p></div><div class="col-md-1"><p>' + booking.totalprice + '</p></div><div class="col-md-1"><p>' + booking.depositpaid + '</p></div><div class="col-md-1"><p>' + booking.dob + '</p></div><div class="col-md-2"><p>' + booking.bookingdates.checkin + '</p></div><div class="col-md-2"><p>' + booking.bookingdates.checkout +
                    '</p></div><div class="col-md-1"><input type="button" value="Edit" onclick="showEditBooking(' + bookingid + ')" /> <input type="button" onclick="deleteBooking(' + bookingid + ')" value="Delete"/></div></div>');
        });

        if(count < limit){
          count += 1;
          getBooking();
        }
      })()
  });
};

var getRandomInt = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

var createBooking = function(){
  var requestDetails = {},
      booking = {
        "firstname": $('#createFirstname').val(),
        "lastname": $('#createLastname').val(),
        "totalprice": $('#createTotalprice').val(),
        "depositpaid": $('#createDepositpaid').val(),
        "dob": $('#createAge').val(),
        "bookingdates": {
            "checkin": $('#createCheckin').val(),
            "checkout": $('#createCheckout').val()
        },
      };

  if(payloadFlag == "json"){
    requestDetails.contentType = "application/json";
    requestDetails.payload = JSON.stringify(booking);
  } else if(payloadFlag == "xml"){
    requestDetails.contentType = "text/xml";
    requestDetails.payload = '<booking>' + x2js.json2xml_str(booking) + '</booking>';
  } else if(payloadFlag == "form"){
    requestDetails.contentType = "application/x-www-form-urlencoded";
    requestDetails.payload = $.param(booking);
  }

  $.ajax({
    url: '/booking',
    type: 'POST',
    data: requestDetails.payload,
    contentType: requestDetails.contentType,
    success: function(data){
      if(payloadFlag === "xml") data = x2js.xml_str2json(data)['created-booking'];
      if(payloadFlag === "form") data = form2Json(data);

      $('.input').val('');
        $('#bookings')
          .append('<div class="row" id=' + data.bookingid + '><div class="col-md-2"><p>' + data.booking.firstname + '</p></div><div class="col-md-2"><p>' + data.booking.lastname + '</p></div><div class="col-md-1"><p>' + data.booking.totalprice + '</p></div><div class="col-md-1"><p>' + data.booking.depositpaid + '</p></div><div class="col-md-1"><p>' + data.booking.dob + '</p></div><div class="col-md-2"><p>' + data.booking.bookingdates.checkin +
                  '</p></div><div class="col-md-2"><p>' + data.booking.bookingdates.checkout + '</p></div><div class="col-md-1"><input type="button" onclick="showEditBooking(' + data.bookingid + ')" value="Edit" /> <input type="button" onclick="deleteBooking(' + data.bookingid + ')" value="Delete"/></div></div>');
    },
    statusCode: {
      400: function() {
        alert( "Person is too young to book" );
      }
    }
  })
}

var deleteBooking = function(id){
  $.ajax({
    url: '/booking/' + id,
    type: 'DELETE',
    headers: {
        authorization: 'Basic YWRtaW46cGFzc3dvcmQxMjM='
    },
    success: function(data){
      location.reload();
    }
  })
}

var showEditBooking = function(id){
  $('#editModal').modal({'show' : true});

  $.get('/booking/' + id, function(booking){
    if(payloadFlag === "xml") booking = x2js.xml_str2json(booking).booking;
    if(payloadFlag === "form") booking = form2Json(booking);

    $('#editBookingId').val(id);
    $('#editFirstname').val(booking.firstname);
    $('#editLastname').val(booking.lastname);
    $('#editTotalprice').val(booking.totalprice);
    $('#editDepositpaid option[value=' + booking.depositpaid + ']').attr('selected', true);

    var dobField = $('#editAge');

    switch (dobField.attr('type')) {
      case 'checkbox':
        dobField.attr("checked", booking.dob);
        break;
      default:
        dobField.val(booking.dob);
        break;
    }

    $('#editCheckin').val(booking.bookingdates.checkin);
    $('#editCheckout').val(booking.bookingdates.checkout);
  });
}

var editBooking = function(){
  var requestDetails = {},
      booking = {
        "firstname": $('#editFirstname').val(),
        "lastname": $('#editLastname').val(),
        "totalprice": $('#editTotalprice').val(),
        "depositpaid": $('#editDepositpaid').val(),
        "dob": $('#editAge').val(),
        "bookingdates": {
            "checkin": $('#editCheckin').val(),
            "checkout": $('#editCheckout').val()
        },
      },
      bookingId = $('#editBookingId').val();

  if(payloadFlag == "json"){
    requestDetails.contentType = "application/json";
    requestDetails.payload = JSON.stringify(booking);
  } else if(payloadFlag == "xml"){
    requestDetails.contentType = "text/xml";
    requestDetails.payload = '<booking>' + x2js.json2xml_str(booking) + '</booking>';
  } else if(payloadFlag == "form"){
    requestDetails.contentType = "application/x-www-form-urlencoded";
    requestDetails.payload = $.param(booking);
  }

  $.ajax({
    url: '/booking/' + bookingId,
    type: 'PUT',
    data: requestDetails.payload,
    contentType: requestDetails.contentType,
    success: function(data){
      $('#editStatus').text('Booking updated');
    },
    error: function(){
      $('#editStatus').text('Booking could not be updated');
    }
  })
};

var partialEditBooking = function(value, item, bookingId){
  var requestDetails = {},
      booking = {
        "dob": $('#editAge').val(),
      };

  var itemName = item.replace('edit','').toLowerCase();

  if(itemName == 'checkin' || itemName == 'checkout'){
      booking['bookingdates'] = {
          'checkin': $('#editCheckin').val(),
          'checkout': $('#editCheckout').val()
      }
  } else {
      booking[itemName] = value;
  }

  if(payloadFlag == "json"){
    requestDetails.contentType = "application/json";
    requestDetails.payload = JSON.stringify(booking);
  } else if(payloadFlag == "xml"){
    requestDetails.contentType = "text/xml";
    requestDetails.payload = '<booking>' + x2js.json2xml_str(booking) + '</booking>';
  } else if(payloadFlag == "form"){
    requestDetails.contentType = "application/x-www-form-urlencoded";
    requestDetails.payload = $.param(booking);
  }

  $.ajax({
    url: '/booking/' + bookingId,
    type: 'PUT',
    data: requestDetails.payload,
    contentType: requestDetails.contentType,
    success: function(data){
      $('#editStatus').text('Booking updated');
    },
    error: function(){
      $('#editStatus').text('Booking could not be updated');
    }
  })
};

var refreshPage = function(){
  location.reload();
}

function getUrlVars()
{
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}
