var ClickEventHandler = function(map) {
	this.map = map;
	this.placesService = new google.maps.places.PlacesService(map);
	this.map.addListener('click', this.handleClick.bind(this));
};

ClickEventHandler.prototype.handleClick = function(event) {
	document.getElementById('pac-input').blur();
	if (event.placeId) {
		// Calling e.stop() on the event prevents the default info window from showing.
		// If you call stop here when there is no placeId you will prevent some other map click event handlers from receiving the event.
		event.stop();
		this.getPlaceInformation(event.placeId);
	}
	else {
		getAddress(resolveLatLng(event.latLng));
	}
};

ClickEventHandler.prototype.getPlaceInformation = function(placeId) {
	var me = this;
	this.placesService.getDetails({placeId: placeId}, function(place, status) {
		if (status === 'OK') {
			poiPlace = place;
			address = place.formatted_address;
			refreshAddress();
		}
	});
};
firebase.initializeApp(FIREBASE_CONFIG);
var database = firebase.database();
var refCityCenter = database.ref('CityCenter');
var geoFire = new GeoFire(refCityCenter);
function showIncompatibleBrowserMessage() {
	document.getElementById('incompatible_browser_message').classList.remove('hide');
}

function hideIncompatibleBrowserMessage() {
	document.getElementById('incompatible_browser_message').classList.add('hide');
	showNotification("This browser is not unsupported");
}
function showNotification(message) {
	notification_bottom.innerText = message;
	notification_bottom.classList.remove('hide');
	if(typeof notification_timer != 'undefined' && notification_timer != null)
		clearTimeout(notification_timer);
	notification_timer = setTimeout(function(){
		notification_bottom.innerText = '';
		notification_bottom.classList.add('hide');
	}, 2500);
}
if(typeof initLoad !== 'undefined')
	initLoad();
// var latLng_p;
// var address;
// var gpId;

function getAddress(latLng) {
	var geocoder = new google.maps.Geocoder;
	geocoder.geocode({'location': latLng}, function(results, status) {
			latLng_p = latLng;
			if (status === 'OK') {
				if (results[0]) {
					address = results[0].formatted_address;
					gpId = results[0].place_id;
					refreshAddress();
					if(pendingFillForm) {
						getAddressCity(results)
						pendingFillForm = null;
					}
				} else {
					console.log('No geoCoding results found');
				}
			} else {
				console.log('Geocoder failed due to: ' + status);
			}
		});
}

function getAddressCity(address_components) {
	var found_city_i;
	var found_group_i;
	var found_country_i;
	for(var i = address_components.length-1; i >= 0; i--) {
		if(address_components[i].types.includes('locality')) {
			found_city_i = i;
			break;
		} else if (address_components[i].types.includes('administrative_area_level_1')) {
			found_group_i = i;
			found_city_i = i;
		} else if (address_components[i].types.includes('administrative_area_level_2')) {
			found_city_i = i;
		} else if ( found_city_i == null && (address_components[i].types.includes('sublocality') || address_components[i].types.includes('sublocality_level_1')) ) {
			found_city_i = i;
		} else if (address_components[i].types.includes('country')) {
			found_country_i = i;
		}
	}
	var gp_id;
	var city_lat;
	var city_lng;
	var city_name;
	var city_accent;
	if(found_city_i != null) {
		gp_id = address_components[found_city_i].place_id;
		city_lat = address_components[found_city_i].geometry['location']['lat']();
		city_lng = address_components[found_city_i].geometry['location']['lng']();
		city_name = address_components[found_city_i].address_components[0].short_name;
		city_accent = address_components[found_city_i].address_components[0].long_name;
	}
	var group = found_group_i != null? address_components[found_group_i].address_components[0].long_name : null;
	var country = found_country_i != null? address_components[found_country_i].address_components[0].long_name : null;
	fillForm(gp_id, city_lat, city_lng, city_name, city_accent, group, country);
}

function toggleAddress() {
	if(address_text.classList.value == 'hide')
		showAddress();
	else
		hideAddress();
}

function showAddress() {
	address_text_content.innerText = address;
	address_text.classList.remove('hide');
}

function hideAddress() {
	address_text_content.innerText = '';
	address_text.classList.add('hide');
}

function clearAddress() {
	address = '';
	gpId = '';
	address_text_content.innerText = '';
}

function refreshAddress() {
	if(!address_text.classList.contains('hide')) {
		address_text_content.innerText = address;
	}
}

function copyAddress() {
	copyNodeText(address_text_content);
}

function setAddress(a, g) {
	address = a;
	gpId = g;
	refreshAddress();
}
function showRestrictedBlock() {
	console_block.classList.add('hide');
	restrict_block.classList.remove('hide');
}

function showConsloeBlock() {
	restrict_block.classList.add('hide');	
	console_block.classList.remove('hide');
	if(map_processed)
		initialize();
	else
		auth_processed = true;
}
var data
// var data_index;
var idLoader;
var prev_entry;

function queryPendingList() {
	beginLoader();
	var list = database.ref('CityRequest').orderByChild('processed').equalTo(false).on('value', function(snapshot) {
		if(data != null)
			prev_entry = data[data_index];
		data = [];
		var target_index;
		snapshot.forEach(function(child) {
			var entry = child.val();
			entry['id'] = child.key;
			data.push(entry);
			if(target_index == null && target_id != null)
				if(child.key == target_id)
					target_index = data.length-1;
		});
		data_count.innerText = data.length;
		if(idLoader != null)
			endLoader('authenticated');
		else if(idLoader == -1)
			showConsoleBlock();
		if(prev_entry == null || data_index >= data.length || JSON.stringify(prev_entry) != JSON.stringify(data[data_index])) {
			if(target_id == null)
				data_index = 0;
			else {
				if(target_index == null) {
					data_index = 0;
					showNotification("Target already processed");
				}
				else
					data_index = target_index;
				target_id = null;
			}
			updateList();
		}
	})
}

function process_entry(key) {
	var ref = database.ref('CityRequest/'+key);
	var updates = {};
	updates['processed'] = 'true';
	ref.update(updates);
}

function submit_city(gp_id, lat, lng, name, accent, group, country, callback) {
	var refCityDetail = database.ref('CityDetail').push();
	refCityDetail.set({
		'gp_id': gp_id,
		'name': name,
		'name_id': name.toLocaleLowerCase(),
		'accent': accent == null? name : accent,
		'group': group,
		'country': country
	});
	geoFire.set(refCityDetail.key, [lat, lng]).then( function() {
			if(typeof callback == 'function')
				callback();
		}, function(error) {
	  	console.log("Error: " + error);
		}
	);
}
function hideDetails() {
	address_details.classList.add('hide');
}

function showDetails() {
	address_details.classList.remove('hide');
}
function focus_(pos, bounds) {

	map.panTo(pos);
	city_lat.value = pos.lat();
	city_lng.value = pos.lng();
	var posBounds = getSpanBounds(pos.lat(), pos.lng());
	if(typeof accuCircle === 'undefined') {
		accuCircle = new google.maps.Rectangle({
			strokeColor: '#69B7CF',
			strokeOpacity: 10,
			strokeWeight: 1,
			fillColor: '#69B7CF',
			fillOpacity: 0.5,
			map: map,
			//center: pos,
			bounds: posBounds,
			clickable: false
		});
	}
	else {
		accuCircle.setBounds(posBounds);
	}

	if(typeof marker === 'undefined') {
		marker = new google.maps.Marker({
			position: pos,
			map: map,
			title: 'Hello World!'
		});
	}
	else {
		marker.setPosition(pos);
	}

	if(marker.getMap() == null)
		marker.setMap(map);

	if(typeof bounds !== 'undefined') {
		map.fitBounds(bounds, 26);
		var offsetY = 0.06;
		if(map.getBounds() != null) {
			var span = map.getBounds().toSpan(); // a latLng - # of deg map span
			var newCenter = {
				lat: pos.lat + span.lat()*offsetY,
				lng: pos.lng
			};

			map.panTo(newCenter);
		}
	}
	else if (typeof accuCircle !== 'undefined')
		//map.setZoom(15);
		accuCircle.setOptions({'fillOpacity': 0.10});

}

function focus(position) {
	focus_(position);
	pendingFillForm = true;
	getAddress(resolveLatLng(position));
}
function fillForm(gpid, lat, lng, city, accent, group, country) {
	city_gpid.value = gpid;
	city_lat.value = lat;
	city_lng.value = lng;
	city_name.value = city;
	city_accent.value = accent;
	city_group.value = group;
	city_country.value = country;
}

function clearForm() {
	city_gpid.value = '';
	city_lat.value = '';
	city_lng.value = '';
	city_country.value = '';
	city_group.value = '';
	city_name.value = '';
	city_accent.value = '';
}
function nextRow() {
	if(data_index+1 < data.length) {
		data_index++;
		updateList();
	}
}

function deleteRow() {
}

function previousRow() {
	if(data_index == 0) {
		if(data.length > 0) {
			data_index = data.length-1;
			updateList();
		}
	}
	else {
		data_index--;
		updateList();
	}
}

function setTargetIndex() {
	var param = window.location.hash.substr(1);
	if(param.length > 0)
		target_id = param;
}

function updateList() {
	if(data.length > 0) {
		view_data_index.innerText = data_index+1;
		var entry = data[data_index];
		data_gp_id.innerText = entry.gp_id;
		data_lat.innerText = entry.lat_lng.lat
		data_lng.innerText = entry.lat_lng.lng;
		setAddress(entry.address, entry.gp_id);
		data_time.innerText = formatDate(new Date(entry.time));
		location_request_list.classList.remove('invisible');
		syncMarkEntry(entry.lat_lng);
	}
	else {
		location_request_list.classList.add('invisible');
		clearAddress();
	}
	clearForm();
}
function beginLoader() {
	idLoader = setTimeout(function(){ endLoader('unauthenticated'); }, 2500);
}

function endLoader(status) {
	clearTimeout(idLoader);
	idLoader = -1;
	if(status == 'authenticated')
		showConsloeBlock();
	else if('unauthenticated')
		showRestrictedBlock();
}
var entryMarker;
// var markers;
var accuCircle;
var pendingFillForm;

function initialize() {
	var input = document.getElementById('pac-input');
	var searchBox = new google.maps.places.SearchBox(input);
	map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

	// Bias the SearchBox results towards current map's viewport.
	map.addListener('bounds_changed', function() {
		searchBox.setBounds(map.getBounds());
	});

	// Listen for the event fired when the user selects a prediction and retrieve
	// more details for that place.
	searchBox.addListener('places_changed', function() {
		var places = searchBox.getPlaces();

		if (places.length == 0) {
			return;
		}

		clearMap();

		// For each place, get the icon, name and location.
		var bounds = new google.maps.LatLngBounds();
		if(places.length == 0) {
		}
		else if(places.length == 1) {
			focus(places[0].geometry.location);
		}
		else {
			places.forEach(function(place) {
				if (!place.geometry) {
					console.log("Returned place contains no geometry");
					return;
				}
				var icon = {
					url: place.icon,
					size: new google.maps.Size(71, 71),
					origin: new google.maps.Point(0, 0),
					anchor: new google.maps.Point(17, 34),
					scaledSize: new google.maps.Size(25, 25)
				};

				// Create a marker for each place.
				var resultMarker = new google.maps.Marker({
					map: map,
					icon: icon,
					title: place.name,
					position: place.geometry.location
				});
				resultMarker.addListener('click', function() {
				 	focus(this.getPosition());
				});
				markers.push(resultMarker);

				if (place.geometry.viewport) {
					// Only geocodes have viewport.
					bounds.union(place.geometry.viewport);
				} else {
					bounds.extend(place.geometry.location);
				}
			});
			map.fitBounds(bounds);
		}
	});

	map.addListener('click', function(event) {
		document.getElementById('pac-input').blur();
		clearAddress();
		focus(event.latLng);
		//encode(resolveLatLng(event.latLng));
	});
	var clickHandler = new ClickEventHandler(map);
}

function clearMap() {
	// Clear out the old markers.
	markers.forEach(function(marker) {
		marker.setMap(null);
	});
	markers = [];
}

function reverseGeoCode(latLng) {
	var geocoder = new google.maps.Geocoder();
	geocoder.geocode({
		//'address': address
		'location': {latLng}
		}, function(results, status) {
			if (status == google.maps.GeocoderStatus.OK) {
				var Lat = results[0].geometry.location.lat();
				var Lng = results[0].geometry.location.lng();
				city_lat.innerText = Lat;
				city_lng.innerText = Lng;
				map.setCenter(results[0].geometry.location);
			} else {
				console.log("Geocode error: "+status);
				showNotification("Oops something got wrong!");
			}
		}
	);
}

var entryMarker;
function showEntryMarker(location) {
	if(entryMarker != null)
		entryMarker.setMap();
	var icon = {
		url: 'https://maps.gstatic.com/mapfiles/mobile/mobileimgs2.png',
		size: new google.maps.Size(22, 22),
		origin: new google.maps.Point(0, 18),
		anchor: new google.maps.Point(11, 11),
	};
	entryMarker = new google.maps.Marker({
		map: map,
		icon: icon,
		//title: place.name,
		position: location
	});
	google.maps.event.addListener(entryMarker, 'click', function() {clearForm();});
}

// const N;
// const A;
// const B;
// const E_SQ;
// const DEG_RAD;

function lat_span_half(lat) {
	var lat_r = DEG_RAD*lat;
	var x = Math.sqrt(1-E_SQ*Math.sin(lat_r)*Math.sin(lat_r));
	return Math.abs((x*x*x)/(DEG_RAD*A*(1-E_SQ)));
}

function lng_span_half(lat) {
	var lat_r = DEG_RAD*lat;
	return Math.abs(Math.sqrt(1-E_SQ*Math.sin(lat_r)*Math.sin(lat_r))/(DEG_RAD*A*Math.cos(lat_r)));
}

function getSpanBounds(lat, lng) {
	var lat_span = lat_span_half(lat)*N;
	var lng_span = lng_span_half(lat)*N;
	return {
		'north': lat+lat_span,
		'south': lat-lat_span,
		'east': lng+lng_span,
		'west': lng-lng_span
	};
}

function resolveLatLng(latLng) {
	return {'lat':latLng.lat(), 'lng':latLng.lng()};
}
function postMap() {
	if(!pendingEntry_lat_lng)
	syncMarkEntry(pendingEntry_lat_lng);
}
var upload_data_index = 0;
var upload_data_rows;

var upload_on = false;
var upload_completed_id = "in_tiruttangal";

function upload_data () {
	var file = document.getElementById('file_input').files[0];
	if(file != null) {
		var reader = new FileReader();
		reader.onload = function(e) {
			upload_data_rows = e.target.result.split("\n");
			while(!upload_on)
				upload_entry();
			upload_entry();
		}
		reader.readAsText(file);
	}
}

function upload_entry() {
	if (upload_data_index < upload_data_rows.length) {
		var cells = unquote(upload_data_rows[upload_data_index]).split('\",\"');
		if (cells.length > 1) {
			var gp_id = null;
			var lat = parseFloat(unquote(cells[3]));
			var lng = parseFloat(unquote(cells[4]));
			var name = unquote(cells[1]);
			var accent = unquote(cells[2]);
			if(accent.length == 0 || accent.localeCompare(name) == 0)
				accent = null;
			var group = null;
			var country_iso = unquote(cells[0]);
			if(upload_on)
				submit_city(gp_id, lat, lng, name, accent, group, country_iso, upload_entry);
			else {
				if(upload_completed_id == country_iso+'_'+name)
					upload_on = true;
			}
		}
		upload_data_index++;
	}
	else
		console.log("Upload completed");
}
function formatNumber(number) {
	WIDTH = 2;
	if (String(number).length < WIDTH)
		return ' '+number;
	else
		return number;
}

function formatDate(date) {
	var monthNames = [
		"Jan", "Feb", "Mar",
		"Apr", "May", "Jun", "Jul",
		"Aug", "Sep", "Oct",
		"Nov", "Dec"
	];

	var day = date.getDate();
	var monthIndex = date.getMonth();
	var hour = date.getHours();
	var minute = date.getMinutes();
	return monthNames[monthIndex] + ' ' + formatNumber(day) + ' ' + formatNumber(hour) + ':' + formatNumber(minute);
}

function unquote(str) {
	return str.replace(/^"(.*)"$/, '$1');
}
// var auth_processed;
// var map_processed;
var target_id;
// var pendingEntry_lat_lng;

function initLoad () {
	if(!initLoadDone && document.readyState === 'interactive') {
		initApp();
		setupControls();
		setTargetIndex();
		initLoadDone = true;
	}
};

function initApp() {
	firebase.auth().getRedirectResult().then(function(result) {
		if (result.credential) {
			// This gives you a Google Access Token. You can use it to access the Google API.
			//var token = result.credential.accessToken;
			queryPendingList();
		}
		else if (firebase.auth().currentUser) {
			// User already signed in.
			// Update your UI, hide the sign in button.
			queryPendingList();
		} else {
			showRestrictedBlock();
			// No user signed in, update your UI, show the sign in button.
			var provider = new firebase.auth.GoogleAuthProvider();
			firebase.auth().signInWithRedirect(provider);
		}
		var user = result.user;
	}).catch(function(error) {
		var errorCode = error.code;
		var errorMessage = error.message;
		// The email of the user's account used.
		var email = error.email;
		// The firebase.auth.AuthCredential type that was used.
		var credential = error.credential;
		// ...
	});
}

function initMap() {
	if(auth_processed)
		initialize();
	else
		map_processed = true;
}

function setupControls() {

	view_data_index.addEventListener('click', function(e) {
		showDetails();
	});

	details_close.addEventListener('click', function(e) {
		hideDetails();
	});

	data_previous.addEventListener('click', function(e) {
		previousRow();
	});

	data_reject.addEventListener('click', function(e) {
		process_entry(data[data_index].id);
		deleteRow();
//		updateRow();
	});

	data_next.addEventListener('click', function(e) {
		nextRow();
	});

	data_process_checkbox.addEventListener('change', function() {
		if(this.checked) {
			var entry = data[data_index];
			syncMarkEntry(entry.lat_lng);
		}
		else {

		}
	});

	submit_city_button.addEventListener('click', function() {
		if(city_lat.value != '' && city_lng.value != '')
			if(city_submit_panel.checkValidity()) {
				submit_city (
					city_gpid.value,
					parseFloat(city_lat.value),
					parseFloat(city_lng.value),
					city_name.value.trim(),
					city_accent.value.trim(),
					city_group.value.trim(),
					city_country.value.trim()
				);
				if(data_process_checkbox.checked)
					process_entry(data[data_index].id);
				showNotification("Request submitted");
				clearForm();
			}
			else
				showNotification("Check form data");
		else
			showNotification("Did you not select a search result?");
	});

}
/*!
 * updatemybrowser.org JavaScript Library v1
 * http://updatemybrowser.org/
 *
 * Copyright 2015, Joram van den Boezem
 * Licensed under the GPL Version 3 license.
 * http://www.gnu.org/licenses/gpl.html
 * 
 */
;

UMB = function () {

    var hasInit = false;
    var hasLoaded = false;
    var config = {};

    /*
     * Recursively merge properties of two objects
     */
    function mergeRecursive(obj1, obj2, lvl) {
        var lvl = lvl || 0;
        for (var p in obj1) {
            try {
                if (obj2[p].constructor == Object) {
                    obj1[p] = mergeRecursive(obj1[p], obj2[p], lvl + 1);
                } else {
                    obj1[p] = obj2[p];
                }
            } catch (e) {
            }
        }
        return obj1;
    }

    var init = function () {
        if (hasInit) {
            return;
        }
        hasInit = true;

        UMB.Detect.init();

        var _umb = window._umb || {};
        config = {
            require: {
                chrome: UMB.Browsers['chrome'].minimum,
                firefox: UMB.Browsers['firefox'].minimum,
                ie: UMB.Browsers['ie'].minimum,
                opera: UMB.Browsers['opera'].minimum,
                safari: UMB.Browsers['safari'].minimum,
                edge: UMB.Browsers['edge'].minimum
            },
            display: true,
            nonCritical: false
        };
        config = mergeRecursive(config, _umb);
    };

    return {

        load: function () {
            if (hasLoaded) {
                return;
            }
            hasLoaded = true;

            UMB.attach(window, 'load', function () {
                init();
                // Display at all?
                if (config.display) {
                    UMB.autoDisplayWidget();
                }
            });
        },

        // http://stackoverflow.com/questions/9434/how-do-i-add-an-additional-window-onload-event-in-javascript
        attach: function (elm, event, callback) {
            if (elm.addEventListener) { // W3C standard
                window.addEventListener(event, callback, false);
            } else if (elm.attachEvent) { // Microsoft
                elm.attachEvent('on' + event, callback);
            }
        },

        getConfig: function () {
            init();
            return config;
        },

        getCurrentBrowser: function () {
            init();
            return UMB.Detect.browser;
        },

        getCurrentVersion: function () {
            init();
            return UMB.Detect.version;
        },

        getBrowserInfo: function (browser) {
            init();
            return UMB.Browsers[browser];
        },

        getStatus: function () {
            init();
            return UMB.Status.getStatus();
        },

        displayWidget: function () {
            init();
            UMB.Widget.display();
        },

        hideWidget: function () {
            init();
            UMB.Widget.hide();
        },

        autoDisplayWidget: function () {
            init();

            // Cookie set to hide bar?
            if (document.cookie.indexOf('_umb=hide') == -1) {
                var status = UMB.getStatus();

                if (status == 'update' && config.nonCritical) {
                    // Display on recommended update
                    UMB.displayWidget();
                } else if (status == 'warning') {
                    // Display on critical update
                    UMB.displayWidget();
                }
            }
        },

        scrollToTop: function () {
            // http://stackoverflow.com/questions/871399/cross-browser-method-for-detecting-the-scrolltop-of-the-browser-window
            var B = document.body; //IE 'quirks'
            var D = document.documentElement; //IE with doctype
            D = (B.clientHeight) ? B : D;
            D.scrollTop = 0;
        }
    };
}();
UMB.load();/*!
 * updatemybrowser.org JavaScript Library v1
 * http://updatemybrowser.org/
 *
 * Copyright 2012, Joram van den Boezem
 * Licensed under the GPL Version 3 license.
 * http://www.gnu.org/licenses/gpl.html
 * 
 */
;if (typeof UMB === "undefined") {UMB = function() {}};

UMB.Browsers = {
		chrome: {
				name: "Chrome",
				vendor: "Google",
				current: "62",
				minimum: "61",
				update_url: "https://www.google.com/chrome/browser/desktop/index.html",
				info_url: "http://www.google.com/chrome/intl/en/more/index.html"
		},
		safari: {
				name: "Safari",
				vendor: "Apple",
				current: "11",
				minimum: "10",
				update_url: "http://www.apple.com/safari/",
				info_url: "http://www.apple.com/safari/"
		},
		edge: {
				name: "Edge",
				vendor: "Microsoft",
				current: "16",
				minimum: "15",
				update_url: "https://www.microsoft.com/en-us/download/details.aspx?id=48126",
				info_url: "https://www.microsoft.com/en-us/windows/microsoft-edge"
		},
		firefox: {
				name: "Firefox",
				vendor: "Mozilla",
				current: "56",
				minimum: "55",
				update_url: "http://www.getfirefox.com/",
				info_url: "https://www.mozilla.org/firefox/desktop/"
		},
		ie: {
				name: "Internet Explorer",
				vendor: "Microsoft",
				current: "11",
				minimum: "10",
				update_url: "http://www.microsoft.com/ie",
				info_url: "http://windows.microsoft.com/internet-explorer"
		},
		opera: {
				name: "Opera",
				vendor: null,
				current: "48",
				minimum: "47",
				update_url: "http://www.opera.com/browser/",
				info_url: "http://www.opera.com/browser/features/"
		}
};
/*!
 * updatemybrowser.org JavaScript Library v1
 * http://updatemybrowser.org/
 *
 * Copyright 2015, Joram van den Boezem
 * Licensed under the GPL Version 3 license.
 * http://www.gnu.org/licenses/gpl.html
 * 
 */
/*!
 * Based on Browser detect script by Peter-Paul Koch
 * See http://www.quirksmode.org/js/detect.html
 */
;if (typeof UMB === "undefined") {UMB = function(){}};

UMB.Detect = {
    init: function () {
        this.browser = this.searchString(this.dataBrowser) || "unknown";
        this.version = this.searchVersion(navigator.userAgent)
            || this.searchVersion(navigator.appVersion)
            || "an unknown version";
        this.OS = this.searchString(this.dataOS) || "unknown";
    },
    searchString: function (data) {
        for (var i = 0; i < data.length; i++) {
            var dataString = data[i].string;
            var dataProp = data[i].prop;
            this.versionSearchString = data[i].versionSearch || data[i].identity;
            if (dataString) {
                if (dataString.indexOf(data[i].subString) != -1)
                    return data[i].identity;
            }
            else if (dataProp)
                return data[i].identity;
        }
    },
    searchVersion: function (dataString) {
        var index = dataString.indexOf(this.versionSearchString);
        if (index == -1) return;
        return parseFloat(dataString.substring(index + this.versionSearchString.length + 1));
    },
    dataBrowser: [
        {
            string: navigator.userAgent,
            subString: "OPR/",
            identity: "opera",
            versionSearch: "OPR"
        },
        {
            string: navigator.userAgent,
            subString: "Edge",
            identity: "edge",
            versionSearch: "Edge"
        },
        {
            string: navigator.userAgent,
            subString: "Chrome",
            versionSearch: "Chrome",
            identity: "chrome"
        },
        {
            string: navigator.vendor,
            subString: "Apple",
            identity: "safari",
            versionSearch: "Version"
        },
        {
            string: navigator.userAgent,
            subString: "Firefox",
            versionSearch: "Firefox",
            identity: "firefox"
        },
        {
            string: navigator.userAgent,
            subString: "MSIE",
            identity: "ie",
            versionSearch: "MSIE"
        },
        {
            string: navigator.userAgent,
            subString: "Trident",
            identity: "ie",
            versionSearch: "rv"
        }
    ],
    dataOS: [
        {
            string: navigator.userAgent,
            subString: "iPhone",
            identity: "iOS"
        },
        {
            string: navigator.userAgent,
            subString: "iPad",
            identity: "iOS"
        },
        {
            string: navigator.userAgent,
            subString: "Android",
            identity: "Android"
        },
        {
            string: navigator.platform,
            subString: "Win",
            identity: "Windows"
        },
        {
            string: navigator.platform,
            subString: "Mac",
            identity: "Mac"
        },
        {
            string: navigator.platform,
            subString: "Linux",
            identity: "Linux"
        }
    ]
};/*!
 * updatemybrowser.org JavaScript Library v1
 * http://updatemybrowser.org/
 *
 * Copyright 2015, Joram van den Boezem
 * Licensed under the GPL Version 3 license.
 * http://www.gnu.org/licenses/gpl.html
 * 
 */
/*!
 * Require UMB.Detect
 * Require UMB.Browsers
 */
;if (typeof UMB === "undefined") {UMB = function(){}};

UMB.Status = function () {

    var STATUS_LATEST = 'latest';
    var STATUS_UPDATE = 'update';
    var STATUS_WARNING = 'warning';
    var STATUS_UNSUPPORTED = 'unsupported';

    return {
        getStatus: function () {
            var browser = UMB.getBrowserInfo(UMB.Detect.browser);
            var os = UMB.Detect.OS;
            if (!browser || os == 'iOS' || os == 'Android') return STATUS_UNSUPPORTED;
            var latestVersion = parseFloat(browser.current);
            var minimumVersion = parseFloat(UMB.getConfig().require[UMB.Detect.browser]);
            if (UMB.Detect.version >= latestVersion) {
                return STATUS_LATEST;
            } else if (UMB.Detect.version >= minimumVersion) {
                return STATUS_UPDATE;
            } else {
                return STATUS_WARNING;
            }
        }
    };
}();/*!
 * updatemybrowser.org JavaScript Library v1
 * http://updatemybrowser.org/
 *
 * Copyright 2012, Joram van den Boezem
 * Licensed under the GPL Version 3 license.
 * http://www.gnu.org/licenses/gpl.html
 * 
 */
/*!
 * Require UMB.Status
 */
;if (typeof UMB === "undefined") {UMB = function(){}};

UMB.Widget = function () {

    var hasInit = false;
    var isFixed = false;

    var oldBodyMarginTop;

    var applyStyle = function (style, elm) {
        for (var x in style) {
            elm.style[x] = style[x];
        }
        ;
    };

    var setCookie = function (key, value, days) {
        var exdate = new Date();
        exdate.setDate(exdate.getDate() + days);
        var content = encodeURIComponent(value) + ((days == null) ? '' : '; expires=' + exdate.toUTCString()) + '; path=/';
        document.cookie = key + '=' + content;
    };

    var insertHtml = function () {

        // CLEAN UP OLD WRAPPER
        isFixed = false;
        var oldWrapper = document.getElementById('BrowserBar');
        if (oldWrapper) {
            document.getElementsByTagName('body')[0].removeChild(oldWrapper);
        }

        // WRAPPER
        var wrapper = document.createElement('div');
        var wrapperStyle = {
            display: 'none',
            position: 'absolute',
            height: '19px',
            fontSize: '14px',
            lineHeight: '1em',
            fontFamily: 'Arial, sans-serif',
            color: 'black',
            padding: '10px 0',
            top: '-40px',
            left: '0px',
            backgroundColor: '#FDF2AB',
            backgroundImage: 'url(//updatemybrowser.org/warning.gif)',
            backgroundPosition: '10px center',
            backgroundRepeat: 'no-repeat',
            borderBottom: '1px solid #A29330',
            width: '100%',
            textAlign: 'left',
            cursor: 'pointer',
            zoom: '1',
            zIndex: 9999,
            '-webkit-box-sizing': 'content-box',
            '-moz-box-sizing': 'content-box',
            'box-sizing': 'content-box',
            overflow: 'hidden'
        };
        applyStyle(wrapperStyle, wrapper);
        wrapper.setAttribute('id', 'BrowserBar');

        // PARAGRAPH
        var p = document.createElement('p');
        var pStyle = {
            margin: '0px 0px 0px 40px',
            padding: '0px',
            lineHeight: '1.5em'
        };
        applyStyle(pStyle, p);

        // CLOSE BUTTON
        var a = document.createElement('a');
        a.href = 'javascript:void(0);';
        a.title = 'Don\'t show me this notification bar for the next 24 hours';
        a.onclick = function (e) {
            if (!e) {
                var e = window.event;
            }
            e.cancelBubble = true;
            if (e.stopPropagation) {
                e.stopPropagation();
            }

            UMB.Widget.hidePersistent(1);
            return false;
        };
        var aStyle = {
            display: 'block',
            width: '20px',
            height: '20px',
            margin: '0px 0px 0px 40px',
            padding: '0px',
            lineHeight: '1.5em',
            position: 'absolute',
            top: '10px',
            right: '10px',
            backgroundImage: 'url(//updatemybrowser.org/close.gif)',
            backgroundPosition: '0 0',
            backgroundRepeat: 'no-repeat'
        };
        applyStyle(aStyle, a);

        wrapper.appendChild(p);
        wrapper.appendChild(a);
        document.getElementsByTagName('body')[0].appendChild(wrapper);
    };

    var prepareHtml = function () {
        // Get current browser info and status
        var status = UMB.getStatus();
        var browser = UMB.getBrowserInfo(UMB.getCurrentBrowser());
        var version = UMB.getCurrentVersion();

        if (!status || !browser || !version) return;

        var wrapper = document.getElementById('BrowserBar');
        var link = document.createElement('a');
        link.href = 'https://www.updatemybrowser.org';
        link.onclick = function () {
            return false;
        };
        link.style.color = '#2183d0';
        link.style.fontWeight = 'bold';
        link.target = '_blank';

        var message = '';
        var post = '';
        if (status == 'latest') {
            message = 'You have the latest version of your browser installed (' + browser.name + ' ' + version + '). ';
            link.style.color = '#00A651';
            link.appendChild(document.createTextNode('Learn more'));
        } else if (status == 'update') {
            message = 'An update (' + browser.name + ' ' + browser.current + ') is available for your browser. Please ';
            link.appendChild(document.createTextNode('install this browser update'));
            post = '.';
        } else if (status == 'warning') {
            message = 'An important update (' + browser.name + ' ' + browser.current + ') is available for your browser. Please ';
            link.style.color = '#ED1C24';
            link.appendChild(document.createTextNode('install this critical browser update'));
            post = '.';
            isFixed = true;	// make position fixed
        }
        wrapper.getElementsByTagName('p')[0].appendChild(document.createTextNode(message));
        wrapper.getElementsByTagName('p')[0].appendChild(link);
        wrapper.getElementsByTagName('p')[0].appendChild(document.createTextNode(post));

        // Make click event on BrowserBar go to link
        document.getElementById('BrowserBar').onclick = function () {
            window.open(link.href);
        };
    };

    var getComputedVal = function (elm, property) {
        var r;
        if (window.getComputedStyle) {
            r = window.getComputedStyle(elm)[property];
        } else if (elm.currentStyle) {
            r = elm.currentStyle[property];
        }
        if (!r) {
            r = elm.style[property];
        }
        return r;
    };

    var animate = function (elm, property, end, length, callback, pre, post) {
        // Animate opacity for IE
        if (property == 'opacity') {
            animate(elm, 'filter', end * 100, length, callback, 'alpha(opacity=', ')');
        }

        // Set property syntax
        var pxProps = '|top|marginTop|';
        pre = pre || '';
        post = post || '';
        if (pxProps.indexOf(property) > -1) {
            post = post || 'px';
        }

        // Begin value
        var begin = parseFloat(getComputedVal(elm, property).replace(pre, '').replace(post, '')) || 0;

        // Relative value?
        if (end.toString().indexOf('+') == 0 || end.toString().indexOf('-') == 0) {
            end = begin + parseFloat(end);
        }

        // Setup variables
        var interval = 10;
        var percstep = 1 / (length / interval);
        var perc = 0;

        // Setup helpers
        var prop = function (p) {
            var easedP = 0.5 - Math.cos(p * Math.PI) / 2;
            var propStep = (end - begin) * easedP;
            var newProp = begin + propStep;
            return Math.round(newProp * 100) / 100;
        };
        var apply = function (v) {
            elm.style[property] = pre + v + post;
        };

        // Make an interval
        var timer = setInterval(function () {
            perc = perc + percstep;
            apply(prop(perc));

            if (perc >= 1) {
                clearInterval(timer);
                apply(prop(1));
                if (callback) {
                    callback();
                }
            }
        }, interval);
    };

    var showBar = function () {
        var body = document.getElementsByTagName('body')[0];
        var BrowserBar = document.getElementById('BrowserBar');

        // Hide bar body only when BrowserBar is invisible
        if (getComputedVal(BrowserBar, 'display') !== 'none') {
            return;
        }

        // Add body class
        body.className += ' umb-active';

        // BrowserBar
        BrowserBar.style.opacity = '0';
        BrowserBar.style.filter = 'alpha(opacity=0)';
        BrowserBar.style.display = 'block';
        animate(BrowserBar, 'opacity', 0.95, 600);

        if ((UMB.getCurrentBrowser() == 'ie' && document.compatMode == 'BackCompat')) {
            // Reposition BrowserBar for IE quirks workaround
            BrowserBar.style.top = '0px';
            BrowserBar.style.width = (document.documentElement.clientWidth || document.body.clientWidth) + 'px';
        } else {
            // Reposition body element
            body.style.position = 'relative';
            body.style.overflow = 'visible';
            animate(body, 'top', "+40", 300);

            if (!isFixed) {
                // Body margin fix
                UMB.attach(window, 'resize', function () {
                    BrowserBar.style.width = (document.documentElement.clientWidth || document.body.clientWidth) + 'px';
                });
                BrowserBar.style.width = (document.documentElement.clientWidth || document.body.clientWidth) + 'px';
                BrowserBar.style.top = '-' + (parseFloat(getComputedVal(body, 'marginTop')) + 40) + 'px';
                BrowserBar.style.left = '-' + parseFloat(getComputedVal(body, 'marginLeft')) + 'px';
            }
        }
        if (isFixed) {
            if ((UMB.getCurrentBrowser() == 'ie' && document.compatMode == 'BackCompat')) {
                // Fixed position for Quirks mode
                UMB.attach(window, 'scroll', function () {
                    BrowserBar.style.top = ((document.documentElement.scrollTop || document.body.scrollTop) + (!BrowserBar.offsetHeight && 0)) + 'px';
                });
                BrowserBar.style.top = ((document.documentElement.scrollTop || document.body.scrollTop) + (!BrowserBar.offsetHeight && 0)) + 'px';
            } else if (UMB.getCurrentBrowser() == 'ie' && UMB.getCurrentVersion() <= 6) {
                // Fixed position IE6
                UMB.attach(window, 'resize', function () {
                    BrowserBar.style.width = (document.documentElement.clientWidth || document.body.clientWidth) + 'px';
                });
                BrowserBar.style.width = (document.documentElement.clientWidth || document.body.clientWidth) + 'px';
                var bbTop = parseFloat(getComputedVal(body, 'marginTop')) + 40;
                BrowserBar.style.top = '-' + bbTop + 'px';
                BrowserBar.style.left = '-' + parseFloat(getComputedVal(body, 'marginLeft')) + 'px';
                UMB.attach(window, 'scroll', function () {
                    BrowserBar.style.top = ((document.documentElement.scrollTop || document.body.scrollTop) - bbTop) + 'px';
                });
                BrowserBar.style.top = ((document.documentElement.scrollTop || document.body.scrollTop) - bbTop) + 'px';
            } else {
                // Fixed position
                BrowserBar.style.top = '0px';
                BrowserBar.style.position = 'fixed';
            }
        }
    };

    var hideBar = function () {
        var body = document.getElementsByTagName('body')[0];
        var BrowserBar = document.getElementById('BrowserBar');

        // Hide bar body only when BrowserBar is visible
        if (getComputedVal(BrowserBar, 'display') !== 'block') {
            return;
        }

        // Remove body class
        body.className = body.className.replace(' umb-active', '');

        // BrowserBar
        animate(BrowserBar, 'opacity', 0, 600, function () {
            BrowserBar.style.display = 'none';
        });

        // IE Quirks workaround
        if (UMB.getCurrentBrowser() == 'ie' && document.compatMode == 'BackCompat') {
        } else {
            animate(body, 'top', "-40", 300);
        }
    };

    return {

        init: function () {
            if (hasInit) {
                return;
            }
            hasInit = true;

            UMB.Widget.redraw();
        },

        redraw: function () {
            insertHtml();
            prepareHtml();
        },

        display: function () {
            UMB.Widget.init();
            showBar();
        },

        hide: function () {
            UMB.Widget.init();
            hideBar();
        },

        hidePersistent: function (days) {
            days = days || 1;
            setCookie('_umb', 'hide', days);
            UMB.hideWidget();
        }

    };
}();const svg_address = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIGhlaWdodD0nMjgnIHdpZHRoPScyOCcgdmlld0JveD0iMCAwIDI0IDI0Ij4gPHBhdGggZmlsbD0nIzY5QjdDRicgZD0iTTE0IDE3SDR2MmgxMHYtMnptNi04SDR2MmgxNlY5ek00IDE1aDE2di0ySDR2MnpNNCA1djJoMTZWNUg0eiIgLz4gPHBhdGggZmlsbD0nbm9uZScgZD0iTTAgMGgyNHYyNEgweiIgLz4gPC9zdmc+IA==";
const svg_copy = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIGhlaWdodD0nMjAnIHdpZHRoPScyMCcgdmlld0JveD0iMCAwIDI0IDI0Ij4gPHBhdGggZmlsbD0nbm9uZScgZD0iTTAgMGgyNHYyNEgweiIgLz4gPHBhdGggZmlsbD0nIzY5QjdDRicgZD0iTTE2IDFINGMtMS4xIDAtMiAuOS0yIDJ2MTRoMlYzaDEyVjF6bTMgNEg4Yy0xLjEgMC0yIC45LTIgMnYxNGMwIDEuMS45IDIgMiAyaDExYzEuMSAwIDItLjkgMi0yVjdjMC0xLjEtLjktMi0yLTJ6bTAgMTZIOFY3aDExdjE0eiIgLz4gPC9zdmc+IA==";
const svg_link = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIGhlaWdodD0nMjYnIHdpZHRoPSc2Micgdmlld0JveD0iMCA0IDQ2LjQ5OTk5OSAxOS40OTk5OTkiPiA8cGF0aCBzdHlsZT0nZmlsbDpub25lJyBkPSJNIC0wLjAwMzE3NzI5LDUuOTk5OTk5NSBIIDIzLjk5NjgyMyBWIDMwIEggLTAuMDAzMTc3MjkgWiIgLz4gPHBhdGggc3R5bGU9ImZpbGw6IzY5YjdjZjtzdHJva2Utd2lkdGg6MC45IiBkPSJtIDE1LjE0MzI4NSwxMy43NSBjIDAsLTEuNTIzODI0IDEuMzkxMTUzLC0yLjc2MjQ4OCAzLjEwMjU3MSwtMi43NjI0ODggaCA0LjAwMzMxNiBWIDkuMjk0Mzc1MSBoIC00LjAwMzMxNiBjIC0yLjc2MjI4OSwwIC01LjAwNDE0NiwxLjk5NjExOTkgLTUuMDA0MTQ2LDQuNDU1NjI0OSAwLDIuNDU5NTA0IDIuMjQxODU3LDQuNDU1NjI0IDUuMDA0MTQ2LDQuNDU1NjI0IGggNC4wMDMzMTYgdiAtMS42OTMxMzcgaCAtNC4wMDMzMTYgYyAtMS43MTE0MTgsMCAtMy4xMDI1NzEsLTEuMjM4NjY0IC0zLjEwMjU3MSwtMi43NjI0ODcgeiBtIDQuMTAzNCwwLjg5MTEyNSBoIDguMDA2NjMyIHYgLTEuNzgyMjUgSCAxOS4yNDY2ODUgWiBNIDI4LjI1NDE0Niw5LjI5NDM3NTEgSCAyNC4yNTA4MyB2IDEuNjkzMTM2OSBoIDQuMDAzMzE2IGMgMS43MTE0MTgsMCAzLjEwMjU3MSwxLjIzODY2NCAzLjEwMjU3MSwyLjc2MjQ4OCAwLDEuNTIzODIzIC0xLjM5MTE1MywyLjc2MjQ4NyAtMy4xMDI1NzEsMi43NjI0ODcgSCAyNC4yNTA4MyB2IDEuNjkzMTM3IGggNC4wMDMzMTYgYyAyLjc2MjI4OSwwIDUuMDA0MTQ2LC0xLjk5NjEyIDUuMDA0MTQ2LC00LjQ1NTYyNCAwLC0yLjQ1OTUwNSAtMi4yNDE4NTcsLTQuNDU1NjI0OSAtNS4wMDQxNDYsLTQuNDU1NjI0OSB6IiAvPiA8cmVjdCBzdHlsZT0iZmlsbDpub25lO3N0cm9rZTojRENEQ0RDO3N0cm9rZS13aWR0aDowLjY1Nzk0MzQ5O3N0cm9rZS1vcGFjaXR5OjEiIHk9JzQuMzI4OTcyMycgeD0nMC4zMjg5NzE3NCcgaGVpZ2h0PScxOC44NDIwNTYnIHdpZHRoPSc0NS44NDIwNicgLz4gPC9zdmc+IA==";
const svg_map = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScyMCcgaGVpZ2h0PScyMCcgdmlld0JveD0iMCAwIDI0IDI0Ij4gPHBhdGggZmlsbD0nIzY5QjdDRicgZD0iTTIwLjUgM2wtLjE2LjAzTDE1IDUuMSA5IDMgMy4zNiA0LjljLS4yMS4wNy0uMzYuMjUtLjM2LjQ4VjIwLjVjMCAuMjguMjIuNS41LjVsLjE2LS4wM0w5IDE4LjlsNiAyLjEgNS42NC0xLjljLjIxLS4wNy4zNi0uMjUuMzYtLjQ4VjMuNWMwLS4yOC0uMjItLjUtLjUtLjV6TTE1IDE5bC02LTIuMTFWNWw2IDIuMTFWMTl6IiAvPiA8cGF0aCBmaWxsPSdub25lJyBkPSdNMCAwaDI0djI0SDB6JyAvPiA8L3N2Zz4g";
