var channelName = location.search.split('username=')[1]
if (!channelName) {
    alert("Du U Kno Da Wae REDIRECTING... :P")
    history.go(-1);
}

var pubnub = PUBNUB.init({
    subscribe_key: "sub-c-d0d6bc1a-fc90-11e8-80f1-b6259b5c8742",
    publish_key: "pub-c-c6dca816-1763-49ea-9c45-5edc5e368554",
    leave_on_unload: !0,
    ssl: "https:" === document.location.protocol
})

function initMap() {

    var peoplePlacesName = [];
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
                zoom: 8,
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
    // The marker, positioned at Uluru
    console.log("Map Rendered ");


    var groupCoordinates = [],
        n_cords = 0,
        centroid, centroidMarker, allMarkers = [];

    var RADIUS_SPAN = 1500,
        MAX_PLACES = 2;

    // DOM DEFNS ;
    var add_people = document.getElementById('add_people');
    var remove_people = document.getElementById('remove_people');
    var OpenBar = document.getElementById('Open');
    var CloseBar = document.getElementById('Close');
    var ResultBar = document.getElementById('ResultBar');


    var locationInput = document.getElementById('autocomplete-input');

    var autocomplete_one = new google.maps.places.Autocomplete(locationInput);

    var objLocation;
    google.maps.event.addListener(autocomplete_one, 'place_changed', function () {
        objLocation = autocomplete_one.getPlace();
        console.log(objLocation);
    });

    var infowindow = new google.maps.InfoWindow({
        maxWidth: 200
    });


    // GETTING CENTROID 
    function getCentroid() {
        // n_cords >= 2 ; else show markeds on self and no further rendering 
        // render on addition [ cords.length ] 


        if (n_cords > 1) {
            console.log("Getting Centroid..");
            console.log("DATA POINTS", groupCoordinates);

            var bounds = new google.maps.LatLngBounds();

            var polygonCoords = []

            for (i = 0; i < n_cords + 1; i++) {

                var latlngObj = new google.maps.LatLng(groupCoordinates[i % n_cords].lat, groupCoordinates[i % n_cords].lng);
                polygonCoords.push(latlngObj);
            }

            for (i = 0; i < n_cords + 1; i++) {
                bounds.extend(polygonCoords[i]);
            }

            centroid = {
                lat: bounds.getCenter().lat(),
                lng: bounds.getCenter().lng()
            };

            console.log("CENTROID : ", centroid);

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
            allMarkers.push(centroidMarker);

            google.maps.event.addListener(centroidMarker, 'click', function () {
                infowindow.setContent("<b>Hey,<b><br><hr><b>You're MidWay!</b>");
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

        } else if (n_cords == 1) {
            console.log("ONLY SINGLE COORDINATES ");

        } else {
            console.log("LESS COORDINATES ");
        }
    }

    var geocoder = new google.maps.Geocoder;


    // REVERSE GEOCODING
    function reverse_geocoding(point, markerR) {

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
                        console.log(results[0] + "INSIDE REVERSE GEOCODING ");
                        infowindow.setContent("<b>" + results[0].formatted_address + "<hr>" + "<a href='http://www.google.com/maps/place/" + point.lat + "," + point.lng + "' target='_blank'> Get Direction > </a></b>");
                        infowindow.open(map, markerR);
                        setTimeout(toggleBounce, 1500);
                    });

                } else {
                    window.alert('No results found');
                }
            } else {

                console.log('Geocoder failed due to: ' + status);

            }
        });
    }

    // DRAW MARKERS FOR MIDWAY & POINTS 
    function drawMarkers() {
        for (i = 0; i < n_cords; i++) {

            var start = new google.maps.LatLng(groupCoordinates[i].lat, groupCoordinates[i].lng);

            var cord_marker = new google.maps.Marker({
                position: start,
                map: map,
                icon: markerIcon,
                animation: google.maps.Animation.DROP,
            });

            reverse_geocoding(groupCoordinates[i], cord_marker);
            allMarkers.push(cord_marker);
        }
        // reverse_geocoding(centroid, centroidMarker);
    }

    // SHOW ROUTE
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

        for (i = 0; i < n_cords; i++) {
            var start = new google.maps.LatLng(groupCoordinates[i].lat, groupCoordinates[i].lng);
            var end = new google.maps.LatLng(centroid.lat, centroid.lng);

            var request = {
                origin: start,
                destination: end,
                travelMode: google.maps.TravelMode.WALKING
            };

            directionsService.route(request, function (response, status) {
                if (status == google.maps.DirectionsStatus.OK) {;
                    renderRoute(response);
                } else {
                    alert("Directions Request from " + start.toUrlValue(6) + " to " + end.toUrlValue(6) + " failed: " + status);
                }
            });
        }
    }

    // PLACES SEARCH 
    function addNearbyServices() {
        if (n_cords < 1)
            return;
        var service = new google.maps.places.PlacesService(map);

        types = [
            ['restaurant'],
            ['cafe'],
            ['shopping_mall'],
            ['movie_theater'],
            ['night_club'],
            ['park'],
            ['bar']
        ];

        var icon;

        function createMarker(place) {
            var placeData = "<b>" + place.name + "</b> <hr>";
            if (place.photos != undefined) {
                placeData += "<img src='" + place.photos[0].getUrl({
                    'maxWidth': 200,
                    'maxHeight': 200
                }) + "' />";
            }

            if (place.rating != undefined) {
                placeData += " Rating : " + place.rating + "<hr>";
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

            placeData += place.vicinity + "<hr>" + "<a href='http://www.google.com/maps/place/" + placeLoc.lat() + "," + placeLoc.lng() + "' target='_blank'> Get Direction > </a></b>";

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

    function updateView() {
        if (n_cords > 1) {
            clearMap();
            getCentroid();
            showRoute();
            drawMarkers();
            infowindow.setContent("<b>Hey,<b><br><hr><b>You're MidWay!</b>");
            infowindow.open(map, centroidMarker);
            addNearbyServices();
            showPeople();
        }
    }

    function addPeople() {
        if (objLocation.formatted_address) {
            console.log(objLocation.formatted_address, objLocation);

            cord = {
                lat: objLocation.geometry.location.lat(),
                lng: objLocation.geometry.location.lng(),
            }
            console.log(cord);
            peoplePlacesName.push(objLocation.formatted_address);
            groupCoordinates.push(cord);
            n_cords += 1;

            if (n_cords == 1) {

                var newMarker = new google.maps.Marker({
                    position: cord,
                    map: map,
                    animation: google.maps.Animation.DROP,
                });

                allMarkers.push(newMarker);
                map.setCenter(new google.maps.LatLng(cord.lat, cord.lng));
            } else {
                clearMap();
                updateView();
            }

            console.log("ADDED");
        }
        locationInput.value = "";
    }


    // ADDED PERSON 
    add_people.onclick = function () {
        addPeople();

        // PUBLISH DATA
        publish({
            n_points: n_cords,
            points: groupCoordinates,
            placeNames: peoplePlacesName
        });
    }

    // REMOVE ALL 
    remove_people.onclick = function () {
        n_cords = 0;
        groupCoordinates = [];
        peoplePlacesName = []

        // PUBLISH DATA
        publish({
            n_points: n_cords,
            points: groupCoordinates,
            placeNames: peoplePlacesName
        });
        clearMap();
        location.reload();
    }

    // CLOSE BAR
    CloseBar.onclick = function () {
        ResultBar.style.display = "none";
        CloseBar.style.display = "none";
        OpenBar.style.display = "";
    }

    //OPEN BAR
    OpenBar.onclick = function () {
        ResultBar.style.display = "";
        CloseBar.style.display = "";
        OpenBar.style.display = "none";
    }


    function showPeople() {
        var people = document.getElementById("online_people"),
            li;
        people.innerHTML = '';
        console.log(groupCoordinates);
        for (i = 0; i < n_cords; i++) {
            li = document.createElement("li");
            var name = peoplePlacesName[i]
            var len = peoplePlacesName[i].length;
            if (len > 30) {
                name = name.substring(0, 30);
                name += " ..";
            }
            li.innerHTML = "<p> <i class='material-icons green-text inline-icon'>adjust</i>" + name + "  </p>"
            people.appendChild(li);
        }
    }

    infowindow.setContent("<b>Hey,<b><br><hr><b>You're MidWay!</b>");
    infowindow.open(map, centroidMarker);

    function publishedData(data) {
        if (!data) {
            console.log("NO DATA")
        }
        console.log(data);
        n_cords = data.n_points;
        groupCoordinates = data.points;
        peoplePlacesName = data.placeNames
        updateView();
    }

    /* PUBNUB */
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