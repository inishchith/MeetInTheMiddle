var channelName = location.search.split('username=')[1]
if (!channelName) {
    alert("REDIRECTING... ")
    history.go(-1)
}

var RADIUS_SPAN = 1500,
    MAX_PLACES = 4;

var pubnub = PUBNUB.init({
    subscribe_key: "sub-c-51770412-03ab-11e9-849f-127435af060e",
    publish_key: "pub-c-8542b2da-c9ae-4278-9c4c-64996a357d0f",
    leave_on_unload: !0,
    ssl: "https:" === document.location.protocol
})

function debug(query) {
    console.log("[API-error] Restricted due to " + query)
}

function initMap() {
    var placesData = [];
    var i, map;

    var markerIcon = {
        url: './assets/icons/marker.png',
        scaledSize: new google.maps.Size(40, 40),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(20, 40)
    };

    var centroidIcon = {
        url: './assets/icons/centroid.png',
        scaledSize: new google.maps.Size(40, 40),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(20, 40)
    };

    function clearMap() {
        map = new google.maps.Map(
            document.getElementById('map'), {
                zoom: 3.3,
                mapTypeControl: false,
                styles: [{
                    "featureType": "administrative.country",
                    "elementType": "geometry",
                    "stylers": [{
                            "visibility": "simplified"
                        },
                        {
                            "hue": "#ff0000"
                        }
                    ]
                }],
                center: {
                    lat: 19.073,
                    lng: 72.899
                },
            });
    }

    clearMap();

    var nCords = 0,
        centroid = [],
        centroidMarker;

    var remove_people = document.getElementById('remove_people'),
        OpenBar = document.getElementById('Open'),
        CloseBar = document.getElementById('Close'),
        ResultBar = document.getElementById('ResultBar'),
        locationInput = document.getElementById('autocomplete-input'),
        autocomplete_one = new google.maps.places.Autocomplete(locationInput);

    var objLocation;
    google.maps.event.addListener(autocomplete_one, 'place_changed', function () {
        objLocation = autocomplete_one.getPlace();
    });

    var infowindow = new google.maps.InfoWindow({
        maxWidth: 200
    });


    function getCentroid(addPoint, centroidX, isNewPoint) {
        // nCords >= 2 ; else show markeds on self and no further rendering
        // render on addition [ cords.length ]

        if (nCords > 1) {

            if (isNewPoint) {
                centroid = {
                    lat: (centroidX.lat * (nCords - 1) + addPoint.lat) / nCords,
                    lng: (centroidX.lng * (nCords - 1) + addPoint.lng) / nCords
                };
            } else {
                centroid = {
                    lat: (centroidX.lat * (nCords + 1) - addPoint.lat) / nCords,
                    lng: (centroidX.lng * (nCords + 1) - addPoint.lng) / nCords
                };
            }

            // BIND PLACES AND DRAW BORDER
            centroidMarker = new google.maps.Marker({
                position: centroid,
                map: map,
                animation: google.maps.Animation.DROP,
                zIndex: Math.round(centroid.lat * -100000) << 5,
                labelContent: "YOUR MIDWAY",
                labelInBackground: false,
                fillColor: '#000000',
                icon: centroidIcon
            });

            google.maps.event.addListener(centroidMarker, 'click', function () {
                infowindow.setContent("<b>Hey,<b><br><hr><b>Your MidWay!</b>");
                infowindow.open(map, centroidMarker);
            });

            map.setZoom(13);
            map.setCenter(new google.maps.LatLng(centroid.lat, centroid.lng));

            var circle = new google.maps.Circle({
                strokeColor: '#FF0000',
                strokeOpacity: 0,
                fillColor: '#FF0000',
                fillOpacity: 0.25,
                map: map,
                center: new google.maps.LatLng(centroid.lat, centroid.lng),
                radius: RADIUS_SPAN
            });

        } else if (nCords == 1) {
            centroid = addPoint;
            console.log("ONLY SINGLE COORDINATE ");

        } else {
            console.log("NO COORDINATES ;( ");
        }
    }

    var geocoder = new google.maps.Geocoder;


    function reverse_geocoding(point, markerR, posI) {

        geocoder.geocode({
            'location': point
        }, function (results, status) {

            if (status === 'OK') {
                if (results[0]) {
                    google.maps.event.addListener(markerR, 'click', function () {

                        function toggleBounce() {
                            if (markerR.getAnimation() != null) {
                                markerR.setAnimation(null);
                            } else {
                                markerR.setAnimation(google.maps.Animation.BOUNCE);
                            }
                        }

                        toggleBounce();
                        infowindow.setContent("<b>" + placesData[posI].name + "</b> <br><br>" + results[0].formatted_address + "<hr>" + "<a href='http://www.google.com/maps/place/" + point.lat + "," + point.lng + "' target='_blank'> Get Direction > </a>");
                        infowindow.open(map, markerR);
                        setTimeout(toggleBounce, 1500);
                    });

                } else {
                    console.log('NO RESULT FOUND');
                }
            } else {
                debug(" Geocoder status:" + status);
            }
        });
    }


    function drawMarkers() {
        for (i = 0; i < nCords; i++) {

            var start = new google.maps.LatLng(placesData[i].cord.lat, placesData[i].cord.lng);

            var cord_marker = new google.maps.Marker({
                position: start,
                map: map,
                icon: markerIcon,
                animation: google.maps.Animation.DROP,
            });
            reverse_geocoding(placesData[i].cord, cord_marker, i);
        }
    }


    function showRoute() {

        var directionsDisplay;
        var directionsService = new google.maps.DirectionsService();

        function renderRoute(route) {
            directionsDisplay = new google.maps.DirectionsRenderer({
                preserveViewport: true
            });
            directionsDisplay.setDirections(route);
            directionsDisplay.setMap(map);
            directionsDisplay.setOptions({
                suppressMarkers: true
            });
        }

        for (i = 0; i < nCords; i++) {
            var start = new google.maps.LatLng(placesData[i].cord.lat, placesData[i].cord.lng);
            var end = new google.maps.LatLng(centroid.lat, centroid.lng);

            var request = {
                origin: start,
                destination: end,
                travelMode: google.maps.TravelMode.WALKING
            };

            directionsService.route(request, function (response, status) {
                if (status == google.maps.DirectionsStatus.OK) {
                    ;
                    renderRoute(response);
                } else {
                    console.log("Directions Request From " + start.toUrlValue(6) + " to " + end.toUrlValue(6) + " failed: " + status);
                    debug(" Directions Status:" + status);
                }
            });
        }
    }


    function addNearbyServices() {
        if (nCords < 1)
            return;
        var service = new google.maps.places.PlacesService(map);

        // For More: https://developers.google.com/places/supported_types
        types = [
            ['restaurant'],
            ['cafe'],
            ['shopping_mall'],
            ['movie_theater'],
            ['park'],
            ['bar']
        ];

        var icon;

        function createMarker(place) {
            var placeData = "<b>" + place.name + "</b><br><br>" + place.vicinity;

            if (place.photos != undefined) {
                placeData += "<hr> <img src='" + place.photos[0].getUrl({
                    'maxWidth': 200,
                    'maxHeight': 200
                }) + "' alt='results' />";
            }

            if (place.rating != undefined) {
                placeData += " <br> Rating : " + place.rating;
            }

            var placeLoc = place.geometry.location;

            icon = {
                url: place.icon,
                scaledSize: new google.maps.Size(30, 30),
            };

            var marker = new google.maps.Marker({
                position: placeLoc,
                map: map,
                icon: icon,
                animation: google.maps.Animation.DROP,
            });

            placeData += "<hr> <a href='http://www.google.com/maps/place/" + placeLoc.lat() + "," + placeLoc.lng() + "' target='_blank'> Get Direction > </a></b>";

            google.maps.event.addListener(marker, 'click', function () {
                infowindow.setContent(placeData);
                infowindow.open(map, marker);
            });

        }

        function callback(results, status) {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                for (i = 0; i < Math.min(MAX_PLACES, results.length); i++) {
                    createMarker(results[i]);
                }
            } else {
                debug(" PlacesServices status:" + status);
            }
        }

        for (i = 0; i < types.length; i++) {

            service.nearbySearch({
                location: centroid,
                radius: RADIUS_SPAN,
                type: types[i]
            }, callback);
        }
    }

    function updateView(addPoint, centroid, isNewPoint) {
        if (nCords > 1) {
            clearMap();
            getCentroid(addPoint, centroid, isNewPoint);
            showRoute();
            drawMarkers();
            infowindow.setContent("<b>Hey,<b><br><hr><b>Your MidWay!</b>");
            infowindow.open(map, centroidMarker);
            addNearbyServices();
            showPeople();
        } else {
            showPeople();
        }
    }

    function addPeople() {
        if (objLocation) {
            cord = {
                lat: objLocation.geometry.location.lat(),
                lng: objLocation.geometry.location.lng(),
            }

            nCords += 1;

            var obj = {
                id: nCords,
                cord: cord,
                name: objLocation.formatted_address
            };

            placesData.push(obj);

            if (nCords == 1) {

                var newMarker = new google.maps.Marker({
                    position: cord,
                    map: map,
                    animation: google.maps.Animation.DROP,
                });
                map.setCenter(new google.maps.LatLng(cord.lat, cord.lng));
                centroid = cord;

            } else {
                updateView(cord, centroid, true);
            }

            console.log("LOCATION ADDED !");
            objLocation = null;
        } else {
            alert("📍 Enter a valid location");
        }
        locationInput.value = "";
    }

    autocomplete_one.addListener('place_changed', e => {
        addPeople();
        publish({
            placeDetails: placesData,
            polCentroid: centroid
        });
    })
    document.getElementById("get-current-location").addEventListener("click",function() {
      if(navigator.geolocation)
      {

        navigator.geolocation.getCurrentPosition(function(position){
        var  pos={
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };

        geocoder.geocode({'location':pos},function(result,status){
          if(status==='OK'){
            objLocation=result[0];
            addPeople();
            publish({
                placeDetails: placesData,
                polCentroid: centroid
            });
          }
          else {
            console.log("Cannot get place with respect to current location.");
          }
        })
                });
      }
      else {
        window.alert("Cannot get current location.");
      }
    })
    remove_people.onclick = function () {
        nCords = 0;
        $('#remove-me').each(function(i, obj) {
            var entry = $(this).parent();;
            entry.remove();
        });
        placesData = [];

        clearMap();

        publish({
            placeDetails: placesData,
            polCentroid: centroid
        });

        location.reload();
    }

    CloseBar.onclick = function () {
        ResultBar.style.display = "none";
        CloseBar.style.display = "none";
        OpenBar.style.display = "";
    }

    OpenBar.onclick = function () {
        ResultBar.style.display = "";
        CloseBar.style.display = "";
        OpenBar.style.display = "none";
    }


    function showPeople() {
        var people = document.getElementById("online_people"),
            li;
        people.innerHTML = '';
        for (i = 0; i < nCords; i++) {
            li = document.createElement("li");

            var name = placesData[i].name;
            var len = placesData[i].name.length;

            if (len > 30) {
                name = name.substring(0, 30);
                name += " ..";
            }
            li.innerHTML = "<p> <i class='material-icons red-text inline-icon remove-me' id='remove-me' style='cursor:pointer'>cancel</i> &nbsp;<b>" + name + "</b>  </p>";

            $(document).on('click', "#remove-me", function (e) {

                var entry = $(this).parent();
                var placeName = entry.text().substring(8);
                entry.remove();

                placeName = placeName.substring(1, placeName.length - 2);

                for(var j = 0; j < placesData.length; j++) {
                    name = placesData[j].name;

                    if (name.length > 30) {
                        name = name.substring(0, 30);
                        name += " ..";
                    }

                    if (name === placeName) {
                        var sub_cord = placesData[j].cord;
                        placesData.splice(j, 1);
                        nCords -= 1;
                        updateView(sub_cord, centroid, false);
                        publish({
                            placeDetails: placesData,
                            polCentroid: centroid
                        });
                        break;
                    }
                }
                location.reload();
            });
            people.appendChild(li);
        }
    }

    infowindow.setContent("<b>Hey,<b><br><hr><b>Your MidWay!</b>");
    infowindow.open(map, centroidMarker);

    function publishedData(data) {
        if (!data) {
            console.log("NO DATA")
        }

        placesData = data.placeDetails;
        centroid = data.polCentroid;
        nCords = placesData.length;

        updateView(centroid, centroid, false);
    }


    pubnub.subscribe({
        channel: channelName,
        callback: publishedData,
        presence: function (m) {
            if (m.occupancy) {
                document.getElementById('unit').innerHTML = "<i class='material-icons'>person</i>";
            }
            document.getElementById('occupancy').textContent = m.occupancy;
            var p = document.getElementById('occupancy').parentNode;
            p.classList.add('anim');
            p.addEventListener('transitionend', function () {
                p.classList.remove('anim');
            }, false);
        }
    });

    function publish(data) {
        pubnub.publish({
            channel: channelName,
            message: data
        });
    }

    if (showHistory) {
        pubnub.history({
            channel: channelName,
            count: 1,
            callback: function (messages) {
                pubnub.each(messages[0], publishedData);
            }
        });
    }
}
