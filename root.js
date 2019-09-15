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
// var database;
// var refCityCenter;
// var geoFire;

function firebaseInit() {
	firebase.initializeApp(FIREBASE_CONFIG);
	database = firebase.database();
	refCityCenter = database.ref('CityCenter');
	geoFire = new GeoFire(refCityCenter);
}
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

function getAddress(latLng, callback) {
	var geocoder = new google.maps.Geocoder;
	geocoder.geocode({'location': latLng}, function(address_components, status) {
		latLng_p = latLng;
		if (status === 'OK') {
			if (address_components[0]) {
				address = address_components[0].formatted_address;
				gpId = address_components[0].place_id;
				refreshAddress();
				if(typeof callback != 'undefined')
					callback(address_components);
			} else {
				console.log('No geoCoding results found');
			}
		} else {
			console.log('Geocoder failed due to: ' + status);
		}
		if(pendingCitySubmit) {
			execSubmitCity();
			pendingCitySubmit = false;
		}
	});
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
	address = null;
	gpId = null;
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
// const CURRENT_VERSION;
// var initWCode;
// var initWCode_jumpToMap;

function setLocationAccess(status) {
	if (typeof(Storage) !== 'undefined') {
		localStorage.location_access = (status == true);
	}
}

function locationAccessInitCheck() {
	if(typeof(Storage) !== 'undefined' && typeof(localStorage.location_access) !== 'undefined')
		return true;
	else
		return false;
}

function locationAccessCheck() {
	if (locationAccessInitCheck() === true && localStorage.location_access != '' && JSON.parse(localStorage.location_access) === true)
		return true;
	else
		return false;
}

function setLocationAccessDND(status) {
	if (typeof(Storage) !== 'undefined') {
		localStorage.location_access_dnd = (status == true);
	}
}

function locationAccessDNDcheck() {
	if(locationAccessDNDstatus() && JSON.parse(localStorage.location_access_dnd) === true)
		return true;
	else
		return false;
}

function locationAccessDNDstatus() {
	if (typeof(Storage) !== 'undefined' && typeof(localStorage.location_access_dnd) !== 'undefined' && localStorage.location_access_dnd != '')
		return true;
	else {
		setLocationAccessDND(false);
		return false;
	}
}

function versionCheck() {
	var set = false;
	if (typeof(Storage) !== 'undefined') {
		if(typeof(localStorage.note_version) === 'undefined')
			set = true;
		else if(localStorage.note_version != '' && localStorage.note_version != 'undefined' && JSON.parse(localStorage.note_version) < CURRENT_VERSION)
			set = true;
	}
	if(set) {
		localStorage.note_version = CURRENT_VERSION;
		showOverlay();
	}
	else
		activateOverlayInfo_full();
}

function activateOverlayInfo_full() {
	info_intro.classList.add('hide');
	info_full.classList.remove('hide');
}

function urlDecode() {
	if(window.location.pathname.substr(1) != '') {
		var code_string;
		if(window.location.pathname.substr(1).endsWith('/')) {
			code_string = window.location.pathname.substr(1, window.location.pathname.length-2);
			initWCode_jumpToMap = true;
		}
		else {
			code_string = window.location.pathname.substr(1);
			initWCode_jumpToMap = false;
		}
		var code = code_string.toLowerCase().replace('_', ' ');
		pendingWords = code.split('.');
		initWCode = true;
		return true;
	}
	else
		return false;
}
var chooseCityCallback;
var chooseCityList;

function showChooseCityMessage() {
	clearChooseCityList();
	choose_city_message.classList.remove('hide');
	var container = document.getElementById('choose_city_message_list');
	for(let key in chooseCityList) {
		var row = document.createElement('div');
		row.innerHTML = getFullCity(chooseCityList[key]);
		container.appendChild(row);
		row.addEventListener('click', chooseCityContinue);
		row.data_id = key;
	}
}

function hideChooseCityMessage() {
	choose_city_message.classList.add('hide');
	clearChooseCityList();
}

function clearChooseCityList() {
	document.getElementById('choose_city_message_list').innerHTML = '';
}

function chooseCity(list, callback) {
	chooseCityList = list;
	chooseCityCallback = callback;
	showChooseCityMessage();
}

function chooseCityContinue(e) {
	hideChooseCityMessage();
	var id = e.target.data_id;
	var city = chooseCityList[id];
	city.id = id;
	chooseCityCallback(city);
}

function getFullCity(city) {
	var fullCity = city.country + ' \\ ';
	if(typeof (city.group) != 'undefined' && city.group != null && city.group.length > 0)
		fullCity += city.group + ' ~ ';
	fullCity += city.accent;
	return fullCity;
}
// const DEFAULT_WCODE;
// var pendingCity;
// var pendingCitySubmit;
var multiple_city;
var multiple_country;
var multiple_group;

function getProperCityAccent(city) {
	if(typeof city.accent != 'undefined') {
		var city_accent_normalized = city.accent.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
		if(city.name.toLocaleLowerCase().localeCompare(city_accent_normalized.toLocaleLowerCase()) == 0)
			return city_accent_normalized;
	}
	return city.name;
}

function getCityFromPositionThenEncode(latLng) {
	var nearCity = new Object;

	var geoQuery = geoFire.query({
		center: [latLng.lat, latLng.lng],
		radius: CITY_RANGE_RADIUS
	});

	wait_loader.classList.remove('hide');;
	geoQuery.on('ready', function() {
		wait_loader.classList.add('hide');
		geoQuery.cancel();
		if(Object.keys(nearCity).length === 0)
			encode_continue(null, latLng);
		else
			getCityFromIdThenEncode(nearCity.city.id, nearCity.city.center, latLng);
	});

	geoData = geoQuery.on('key_entered', function(key, location, distance) {
		if(typeof nearCity.distance == 'undefined' || distance < nearCity.distance) {
			nearCity.city = {id:key, center:{ lat: location[0], lng: location[1]} };
			nearCity.distance = distance;
		}
	});

}

function getCityFromIdThenEncode(city_id, city_center, latLng) {
	getCityFromId(city_id, function(city) {
		city.center = city_center;
		encode_continue(city, latLng);
	});
}

function getCityFromPositionThenDecode(latLng, wcode) {
	var nearCity = new Object;

	var geoQuery = geoFire.query({
	  center: [latLng.lat, latLng.lng],
	  radius: CITY_RANGE_RADIUS
	});

	wait_loader.classList.remove('hide');
	geoQuery.on('ready', function() {
		wait_loader.classList.add('hide');
	  geoQuery.cancel();
		if(nearCity == null)
			decode_continue(null, wcode);
		else
			getCityFromId(nearCity.id, function(city) {
				city.center = nearCity.center;
				decode_continue(city, wcode);
			});
	});

	geoData = geoQuery.on('key_entered', function(key, location, distance) {
		if(typeof nearCity.distance == 'undefined' || distance < nearCity.distance) {
			nearCity = {
				id:key,
				center: {
					lat: location[0],
					lng: location[1]
				},
				distance: distance
			};
		}
	});

}

function getCityFromId(id, callback) {
	var ref = database.ref('CityDetail'+'/'+id);
	wait_loader.classList.remove('hide');
	ref.once('value').then(function(snapshot) {
		wait_loader.classList.add('hide');
		var city = snapshot.val();
		city.id = id;
		callback(city);
	});
}

function getCityFromName(name, callback) {
	var ref = database.ref('CityDetail');
	wait_loader.classList.remove('hide');
	ref.orderByChild('name_id').equalTo(name).on('value', function(snapshot) {
		wait_loader.classList.add('hide');
		var list = snapshot.val();
		if(list == null)
			decode_continue();
		else {
			if (Object.keys(list).length > 1)
				chooseCity(list, callback);
			else {
				var id = Object.keys(list)[0];
				var city = list[id];
				city.id = id;
				callback(city);
			}
		}
	});
}

function getCityCenterFromId(city, callback) {
	refCityCenter.child(city.id).once('value', function(snapshot) {
		var location = snapshot.val().l;
		city.center = { lat: location[0], lng: location[1]};
		callback(city);
	});
}

function getCitiesFromNameId(name_id, callback) {
	var ref = database.ref('CityDetail');
	wait_loader.classList.remove('hide');
	ref.orderByChild('name_id').startAt(name_id).endAt(name_id+'\uf8ff').limitToFirst(10).on('value', function(snapshot) {
		wait_loader.classList.add('hide');
		callback(snapshot.val());
	});
}

function getCityIdFromNameId(name_id, callback) {
	var ref = database.ref('CityDetail');
	wait_loader.classList.remove('hide');
	ref.orderByChild('name_id').equalTo(name_id).on('child_added', function(snapshot) {
		wait_loader.classList.add('hide');
		callback(snapshot.key);
	});
}

function noCity(position) {
	showAddress();
	showNoCityMessage();
	infoWindow.setContent("Location not in database");
}

function submitCity() {
	if(address == '')
		pendingCitySubmit = true;
	else {
		execSubmitCity();
		pendingCity = true;
	}
}

function execSubmitCity() {
	var newPostKey = database.ref().child('CityRequest').push().key;
	var updates = {};
	var data = {
			"time": firebase.database.ServerValue.TIMESTAMP,
			"lat_lng": latLng_p,
			"gp_id": gpId,
			"address": address,
			"processed": false
		};
	updates['/CityRequest/' + newPostKey] = data;
	database.ref().update(updates);
	showNotification("Request submitted");
}

function tryDefaultCity() {
	decode(DEFAULT_WCODE);
	notification_top.classList.add('hide');
	infoWindow.close();
}
function addCity(gp_id, callback) {

	var http = new XMLHttpRequest();
	http.open('POST', FUNCTIONS_BASE_URL+'/'+'add-city', true);

	http.setRequestHeader('Content-type', 'application/json');
	http.setRequestHeader('version', '1');
	http.requestId = ++curAddCityRequestId;

	wait_loader.classList.remove('hide');
	http.onreadystatechange = function() {
		if(http.readyState == 4 && http.status == 200) {
			if(http.requestId == curAddCityRequestId) {
				callback(JSON.parse(http.responseText).added);
				wait_loader.classList.add('hide');
			}
		}
	}

	http.send( stringifyAddCityData(gp_id) );

}

function stringifyAddCityData(gp_id) {
	var object = {};
	object['place_id'] = gp_id;
	return JSON.stringify(object);
}
// const FUNCTIONS_BASE_URL;
// var curEncRequestId;
// var curDecRequestId;
// var curAddCityRequestId;

function encode_(city, position) {
	var http = new XMLHttpRequest();
	http.open('POST', FUNCTIONS_BASE_URL+'/'+'encode', true);

	http.setRequestHeader('Content-type', 'application/json');
	http.setRequestHeader('version', '1');
	http.requestId = ++curEncRequestId;

	wait_loader.classList.remove('hide');
	http.onreadystatechange = function() {
		if(http.readyState == 4) {
			if(http.requestId == curEncRequestId) {
				if(http.status == 200) {
					setCodeWords(http.responseText, city, position);
					wait_loader.classList.add('hide');
				}
				else if(http.status == 204) {
					noCity(position);
					notification_top.classList.remove('hide');
					wait_loader.classList.add('hide');
				}
			}
		}
	}

	http.send( stringifyEncodeData(city.center, position) );
	return '';
}

function setCodeWords(code, city, position) {
	var message = [];
	var object = JSON.parse(code).code;

	for(const i of object)
		message.push(wordList.getWord(i));

	setCode(city, message, position);
}

function stringifyEncodeData(city_center, position) {
	var object = {};
	object['city_center'] = city_center;
	object['position'] = position;
	return JSON.stringify(object);
}

function decode_(city, code) {

	var http = new XMLHttpRequest();
	http.open('POST', FUNCTIONS_BASE_URL+'/'+'decode', true);

	http.setRequestHeader('Content-type', 'application/json');
	http.setRequestHeader('version', '1');
	http.requestId = ++curDecRequestId;

	wait_loader.classList.remove('hide');
	http.onreadystatechange = function() {
		if(http.readyState == 4 && http.status == 200) {
			if(http.requestId == curDecRequestId) {
				setCodeCoord(city, http.responseText, code);
				notification_top.classList.add('hide');
				wait_loader.classList.add('hide');
			}
		}
	}

	var data = [];
	data[0] = wordList.indexOf(code[0]);
	data[1] = wordList.indexOf(code[1]);
	data[2] = wordList.indexOf(code[2]);
	http.send( stringifyDecodeData(city.center, data) );

}

function stringifyDecodeData(city_center, code) {
	var object = {};
	object['city_center'] = city_center;
	object['code'] = code;
	return JSON.stringify(object);
}

function setCodeCoord(city, codeIndex, code) {
	var latLng = JSON.parse(codeIndex);
	if(initWCode_jumpToMap) {
		initWCode_jumpToMap = false;
		window.location.replace(getIntentURL(latLng, city.name + ' ' + code.join(' ')));
		return;
	}
	getAddress(latLng);
	focus__(city, latLng, code);
}
// const WCODE_CODE_COPIED_MESSAGE;
// const WCODE_LINK_COPIED_MESSAGE;

function showCopyWcodeMessage() {
	var city_name_id = getCodeCityNameId();
	var country_name = getCodeCityCountryName();
	var group_name = getCodeCityGroupName();
	var country_repeat_count = 0;
	var group_repeat_count = 0;
	var city_repeat_count = 0;
	getCitiesFromNameId(city_name_id, function(cities) {
		for(let key in cities) {
			if(cities[key].country == country_name)
				country_repeat_count++;
			if(cities[key].group == group_name)
				group_repeat_count++;
			city_repeat_count++;
		}
		var prefix = '';
		if(country_repeat_count != city_repeat_count) {
			prefix = country_name + '\\';
			multiple_country = true;
		}
		else
			multiple_country = false;

		if(group_repeat_count != city_repeat_count) {
			prefix += group_name + '\\';
			multiple_group = true;
		}
		else
			multiple_group = false;
		if(city_repeat_count)
			multiple_city = true;
		else
			multiple_city = false;

		copy_wcode_message_city_name.innerText = prefix+getCodeCityProperCityAccent();
		copy_wcode_message.classList.remove('hide');
	} );
}

function hideCopyCodeMessage() {
	copy_wcode_message.classList.add('hide');
	copy_wcode_message_city_name.innerText = '';
}

function copyWcodeFull() {
	showAndCopy(getWcodeFull_formatted().join(' '));
	showNotification(WCODE_CODE_COPIED_MESSAGE);
	hideCopyCodeMessage();
}

function copyWcodeCode() {
	showAndCopy(getCodeWcode_formatted().join(' '));
	showNotification(WCODE_CODE_COPIED_MESSAGE);
	hideCopyCodeMessage();
}

function copyWcodeLink() {
	var code_url = location.hostname + '/' + getCodeFull().join('.').toLowerCase().replace(' ', '_');
	showAndCopy(code_url);
	showNotification(WCODE_LINK_COPIED_MESSAGE);
	hideCopyCodeMessage();
}

function copyWcodeJumpLink() {
	var code_url = location.hostname + '/' + getCodeFull().join('.').toLowerCase().replace(' ', '_') + '/';
	showAndCopy(code_url);
	showNotification(WCODE_LINK_COPIED_MESSAGE);
	hideCopyCodeMessage();
}

function shareWCodeCopy() {
	if(share_include_city.checked)
		copyWcodeFull();
	else
		copyWcodeCode();
}

function shareWCodeLink() {
	if(share_jumto_map.checked)
		copyWcodeJumpLink();
	else
		copyWcodeLink();
}
var pendingPosition;
var pendingWords;
var wordList;

// const PURE_WCODE_CITY_PICKED;
// const PURE_WCODE_CITY_FAILED;

function encode(position) {
	clearCode();
	getCityFromPositionThenEncode(position);
}

function encode_continue(city, position) {
	if(city == null) {
		if(!pendingCity) {
			pendingPosition = position;
			getAddress(position, function(address_components) {
				var city_gp_id = getCityGpId(address_components);
				if(city_gp_id != null)
					addCity(city_gp_id, function(city_id) {
						getCityFromId(city_id, function(city) {
							getCityCenterFromId(city, function(city) {
								encode_(city, position);
							});
						});
					});
			});
		}
	}
	else {
		if(pendingCity) {
			hideNoCityMessage();
			infoWindow_setContent(MESSAGE_LOADING);
			pendingCity = false;
		}
		encode_(city, position);
	}
}

function getCityGpId(address_components) {
	var found_city_i;
	for(var i = address_components.length-1; i >= 0; i--) {
		if ( address_components[i].types.includes('administrative_area_level_1') || address_components[i].types.includes('administrative_area_level_2') ) {
			found_city_i = i;
		} else if(address_components[i].types.includes('locality')) {
			found_city_i = i;
			break;
		} else if ( found_city_i == null && (address_components[i].types.includes('sublocality') || address_components[i].types.includes('sublocality_level_1')) ) {
			found_city_i = i;
			break;
		}
	}

	if(found_city_i != null)
		return address_components[found_city_i].place_id;
	else {
		noCity(latLng_p);
		return null;
	}
}

function decode(words) {
	var city_words_length = words.length-3;

	var valid = true;

	if(words.length >= 3) {
		for (var i = 0; i < 3; i++) {
			if (wordList.includes(words[city_words_length+i]) != true) {
				valid = false;
				break;
			}
		}
	}

	if(valid) {

			if(city_words_length > 0) {
				var ipCityName = words.slice(0, city_words_length).join(' ');
				getCityFromName(ipCityName, function(city) {
					if(city == null)
						decode_continue(null, words.slice(city_words_length, words.length));
					else
						getCityCenterFromId(city, function(city) { decode_continue(city, words.slice(city_words_length, words.length)); });
				});
			}
			else if (words.length == 3) {
				var position;
				if(myLocDot == null) {
					if(marker != null && marker.position != null) {
						position = marker.position;
						focus_(position);
						showNotification(PURE_WCODE_CITY_PICKED);
					}
					else
						showNotification(PURE_WCODE_CITY_FAILED);
					return;
				}
				else {
					position = myLocDot.position;
				}

				if(position != null)
					getCityFromPositionThenDecode(resolveLatLng(position), words);
			}

	}
	else
		showNotification(INCORRECT_WCODE);
}

function decode_continue(city, wcode) {
	if(city != null)
		decode_(city, wcode);
	else
		showNotification(INCORRECT_WCODE);
}
var code_city;
var code_wcode;
var code_postition;

function setCode(city, wcode, latLng) {
	code_city = city;
	code_wcode = wcode;
	code_postition = latLng;

	setInfoWindowText(getProperCityAccent(city), city.name_id, wcode.join(' '), latLng);
}

function clearCode() {
	code_postition = null;
}

function getCodeFull() {
	var codeFull_city_part = [code_city.name_id].concat(code_wcode);
	var prefix;

	if(!multiple_country)
		prefix = [];
	else
		prefix = [code_city.country.toLowerCase()];
	if(multiple_group)
		prefix = prefix.concat([code_city.group.toLowerCase()]);

	if(multiple_city)
		return prefix.concat(codeFull_city_part);
	else
		return codeFull_city_part;
}

function getWcodeFull_formatted() {
	return formatWcode(getCodeFull());
}

function getCodeWCode() {
	return code_wcode;
}

function getCodeWcode_formatted() {
	return formatWcode(getCodeWCode());
}

function getCodeCityName() {
	return code_city.name;
}

function getCodeCityNameId() {
	return code_city.name_id;
}

function getCodeGroupName() {
	return code_city.group;
}

function getCodeCityCountryName() {
	return code_city.country;
}

function getCodeCityGroupName() {
	return code_city.group;
}

function getCodeCity() {
	return code_city;
}

function formatWcode(code) {
	return ["\\"].concat(code).concat(["/"]);
}

function getCodeCityProperCityAccent() {
	return getProperCityAccent(code_city);
}
function WordList(list) {
	this.wordList = list;
	this.curList = [];
	
	for(const subList of this.wordList)
		this.curList.push(subList[0]);
	
	this.indexOf = function(word) {
		for(var index = 0; index < 1024; index++) {
			var i = this.wordList[index].indexOf(word);
			if(i != -1)
				return index;
		}
		return -1;
	};
	
	this.getWord = function(index) {
		return this.curList[index];
	};
	
	this.includes = function(word) {
		for(const group of this.wordList) {
			for(const entry of group) {
				if(entry == word)
					return true;
			}
		}
		return false;
	};
	
}
function dbInit() {
	database.ref('WordList').on('value', function(snapshot) {
		wordList = new WordList(snapshot.val());
		city_styled_wordlist = wordList.curList;
		initData();
	});
}

function initData() {
	if(pendingPosition != null) {
		encode(pendingPosition);
	}
	else if(pendingWords != null) {
		decode(pendingWords);
	}
}
function focus__(city, pos, code) {
	focus_(pos);
	setCode(city, code, pos);
}

const ZOOM_ANIMATION_SPEED = 250;
var firstFocus = true;
function focus_(pos, bounds) {

	hideNoCityMessage();

	if(typeof marker === 'undefined') {
		marker = new google.maps.Marker({
			position: pos,
			map: map,
			title: 'Hello World!'
		});
		marker.addListener('click', function() {
			if(!isInfoWindowOpen())
				infoWindow.open(map, marker);
			else
				infoWindow.close();
		});
	}
	else {
		marker.setPosition(pos);
	}

	if(marker.getMap() == null)
		marker.setMap(map);

	map.panTo(pos);

	var idleListenerPan = map.addListener('idle', function() {
		idleListenerPan.remove();
		var newZoom;
		if(typeof bounds !== 'undefined')
			newZoom = getZoomByBounds(map, bounds);
		else {
			newZoom = DEFAULT_LOCATE_ZOOM;
			if (typeof accuCircle !== 'undefined') {
				accuCircle.setOptions({'fillOpacity': 0.10});
			}
		}
		if(firstFocus == true) {
			smoothZoomToBounds(bounds, map, newZoom, map.getZoom());
			firstFocus = false;
		}
	});

	infoWindow_setContent(MESSAGE_LOADING);
	infoWindow.open(map, marker);

}

const ZOOM_ANIMATION_INCREMENT = 1;
const ZOOM_BOUND_PADDING = 36;
var smoothZoomToBounds_callCount = 0;
function smoothZoomToBounds(bounds, map, max, current) {
	if (current >= max) {
		if(smoothZoomToBounds_callCount-- == 0) {
			if(typeof bounds !== 'undefined')
				setTimeout(function() {
					map.fitBounds(bounds, ZOOM_BOUND_PADDING);
					map.panBy(0, getPanByOffset());
				}, ZOOM_ANIMATION_SPEED);
		}
		return;
	}
	else {
		smoothZoomToBounds_callCount++;
		var z = google.maps.event.addListener(map, 'zoom_changed', function(event) {
			google.maps.event.removeListener(z);
			smoothZoomToBounds(bounds, map, max, current + ZOOM_ANIMATION_INCREMENT);
		});
		setTimeout(function() {
			map.setZoom(current);
		}, ZOOM_ANIMATION_SPEED);
	}
}

function getZoomByBounds(map, bounds) {
	var MAX_ZOOM = map.mapTypes.get(map.getMapTypeId()).maxZoom || DEFAULT_LOCATE_ZOOM;
	var MIN_ZOOM = map.mapTypes.get(map.getMapTypeId()).minZoom || 0;

	var ne = map.getProjection().fromLatLngToPoint( bounds.getNorthEast() );
	var sw = map.getProjection().fromLatLngToPoint( bounds.getSouthWest() );

	var worldCoordWidth = Math.abs(ne.x-sw.x)/2;
	var worldCoordHeight = Math.abs(ne.y-sw.y)/2;

	var FIT_PAD = 10;

	for(var zoom = MAX_ZOOM; zoom >= MIN_ZOOM; --zoom) {
		if( worldCoordWidth*(1<<zoom)+2*FIT_PAD < document.body.scrollWidth &&
				worldCoordHeight*(1<<zoom)+2*FIT_PAD < document.body.scrollHeight )
			return zoom;
	}
	return 0;
}
function infoWindow_setContent(string) {
	if(typeof infoWindow == 'undefined')
		infoWindow = new google.maps.InfoWindow({'map': map});
	infoWindow.setContent(string);
}

function setInfoWindowText(city_accent, city_name, code_string, latLng) {
	infoWindow_setContent("<div id='infowindow_code'><div id='infowindow_code_left'><span class='slash'>\\</span> <span class='infowindow_code' id='infowindow_code_left_code'>" + city_accent + "</span></div><div id='infowindow_code_right'>" + "<span class='infowindow_code' id='infowindow_code_right_code'>" + code_string + "</span> <span class='slash'>/</span></div></div><div id='infowindow_actions' class='center'><img id='show_address_button' class='control' onclick='toggleAddress();' src=" + svg_address + " ><a href='"+ getIntentURL(latLng, city_name + ' ' + code_string) + "'><img id='external_map_button' class='control' onclick='' src=" + svg_map + " ></a><img id='share_code_button' class='control' onclick='showCopyWcodeMessage();' src=" + svg_share + " ></div>")
}

function isInfoWindowOpen() {
	var map = infoWindow.getMap();
	return (map !== null && typeof map !== "undefined");
}
function initLocate(override_dnd) {
	if(!locationAccessInitCheck())
		showLocateRightMessage(true);
	else
		locateExec(function() {
			if(!locationAccessCheck()) {
				var hide_dnd = typeof override_dnd == 'undefined' || override_dnd || !locationAccessDNDstatus();
				if(override_dnd || !locationAccessDNDcheck()) {
					showLocateRightMessage(hide_dnd);
				}
				else
					wait_loader.classList.add('hide');
			}
		});
}

function locateExec(failure) {
	wait_loader.classList.remove('hide');
	if (navigator.geolocation) {
		wait_loader.classList.add('hide');
		navigator.geolocation.getCurrentPosition(
			function(position) {

				setLocationAccess(true);
				var pos = {
					lat: position.coords.latitude,
					lng: position.coords.longitude
				};
				if(typeof accuCircle === 'undefined') {
					accuCircle = new google.maps.Circle({
						strokeColor: '#69B7CF',
						strokeOpacity: 0,
						strokeWeight: 0,
						fillColor: '#69B7CF',
						fillOpacity: 0.35,
						map: map,
						center: pos,
						radius: position.coords.accuracy,
						clickable: false
					});
				}
				else {
					accuCircle.setOptions({'fillOpacity': 0.35});
					accuCircle.setCenter(pos);
					accuCircle.setRadius(position.coords.accuracy);
				}

				if(typeof myLocDot === 'undefined') {
					myLocDot = new google.maps.Marker({
						clickable: false,
						icon: new google.maps.MarkerImage('https://maps.gstatic.com/mapfiles/mobile/mobileimgs2.png',
								new google.maps.Size(22,22),
								new google.maps.Point(0,18),
								new google.maps.Point(11,11)),
						shadow: null,
						zIndex: 999,
						map: map,
						position: pos
					});
				}
				else {
					myLocDot.setPosition(pos);
				}
				if(initWCode == false) {
					focus_(pos, accuCircle.getBounds());
					encode(pos);
					clearAddress();
					getAddress(pos);
				}
				else {
					initWCode = false;
				}

			},
			function(error) {
				if(error.code = error.PERMISSION_DENIED) {
					showNotification(LOCATION_PERMISSION_DENIED);
					setLocationAccess(false);
					wait_loader.classList.add('hide');
					failure();
				}
				else
					handleLocationError(true, infoWindow, map.getCenter());
			},
			{ maximumAge:10000, timeout:5000, enableHighAccuracy:true }
		);
	} else {
		// Browser doesn't support Geolocation
		handleLocationError(false, infoWindow, map.getCenter());
	}
}

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
	showNotification(browserHasGeolocation ?
												'Error: The Geolocation service failed' :
												'Error: Your browser doesn\'t support geolocation');
	notification_top.classList.remove('hide');
	syncCheckIncompatibleBrowserMessage();
}
function showLocateRightMessage(hide_dnd) {
	if(hide_dnd == true)
		locate_right_message_dnd.classList.add('hide');
	else
		locate_right_message_dnd.classList.remove('hide');
	locate_right_message.classList.remove('hide');
}

function hideLocateRightMessage() {
	locate_right_message.classList.add('hide');
}

function locateRight_grant() {
	setLocationAccess(true);
	initLocate(false);
	hideLocateRightMessage();
	locateRight_DND_check();
}

function locateRight_deny() {
	wait_loader.classList.add('hide');
	hideLocateRightMessage();
	locateRight_DND_check();
	showNotification("Choose a place on the map");
}

function locateRight_DND_check() {
	if(locate_right_message_dnd_input.checked) {
		setLocationAccessDND(true);
	}
	else {
		setLocationAccessDND(false);
	}
}
var marker;
var infoWindow;
var accuCircle;
var myLocDot;
var poiPlace;

// const INCORRECT_WCODE;
// const MESSAGE_LOADING;
// const LOCATION_PERMISSION_DENIED;

function initMap() {

	var input = document.getElementById('pac-input');
	var searchBox = new google.maps.places.SearchBox(input);
	map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

	// Bias the SearchBox results towards current map's viewport.
	map.addListener('bounds_changed', function() {
		searchBox.setBounds(map.getBounds());
	});

	var markers = [];
	// Listen for the event fired when the user selects a prediction and retrieve
	// more details for that place.
	searchBox.addListener('places_changed', function() {
		var places = searchBox.getPlaces();

		if (places.length == 0) {
			return;
		}

		clearMap();
		markers.forEach(function(marker) {
			marker.setMap(null);
		});
		markers = [];

		var bounds = new google.maps.LatLngBounds();
		if(places.length == 1) {
			clearAddress();
			var pos = resolveLatLng(places[0].geometry.location);
			focus_(pos);
			encode(pos);
			clearAddress();
			getAddress(pos);
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

				var resultMarker = new google.maps.Marker({
					map: map,
					icon: icon,
					title: place.name,
					position: place.geometry.location
				});
				resultMarker.addListener('click', function() {
					load(this);
				});
				markers.push(resultMarker);

				if (place.geometry.viewport) {
					bounds.union(place.geometry.viewport);
				} else {
					bounds.extend(place.geometry.location);
				}
			});
			map.fitBounds(bounds);
		}
	});

	map.addListener('click', function(event) {
		pendingPosition = null;
		pendingCity = null;
		notification_top.classList.add('hide');
		clearAddress();
		clearURL();
		var pos = resolveLatLng(event.latLng);
		focus_(pos);
		encode(pos);
	});

	decode_button.addEventListener('click', function() {
		clearMap();
		firstFocus = true;
		suggestion_result.setInnerText = '';
		var code = document.getElementById('pac-input').value;
		execDecode(code);
	});

	map_type_button.addEventListener('click', function() {
		toggleMapType(true);
	});

	location_button.addEventListener('click', function() {
		syncLocate(true);
	});

	document.getElementById('pac-input').addEventListener('input', suggestWrapper);
	clickHandler = new ClickEventHandler(map);

	postMap();

}

function resolveLatLng(latLng) {
	return {'lat':latLng.lat(), 'lng':latLng.lng()};
}

function execDecode(code) {

	code = code.replace(/(\\|\/)/gm, '').trim().toLowerCase();
	var valid = true;
	if(code.length > 0) {
		var splitChar;
		if(code.indexOf(' ') != -1)
			splitChar = ' ';
		else {
			splitChar = '.';
		}
		var words = code.split(splitChar);
		if(words.length < 3)
			valid = false;
		else
			decode(words);
	}

	if(!valid)
		showNotification(INCORRECT_WCODE);

}

var lastMarker;
function load(marker) {
	focus_(marker.position);
	window.marker.title = marker.title;
	infoWindow.open(map, window.marker);
	marker.setVisible(false);
	lastMarker = marker;
	infoWindow_setContent(MESSAGE_LOADING);
	encode(marker.position);
}

function getPanByOffset() {
	if(window.innerHeight < 1000)
		return -118;
	else
		return 0;
}

function getIntentURL(latLng, code_string) {
	if((navigator.userAgent.match(/android/i)))
		return 'geo:0,0?q='+latLng.lat+','+latLng.lng+'(\\ '+code_string+' /)';
	else
		return 'https://maps.google.com/maps?q=loc:'+latLng.lat+','+latLng.lng+'&t=h';
}

function clearMap() {
	if(marker != null)
		marker.setMap(null);
}

function toggleMapType() {
	if(map.getMapTypeId() == google.maps.MapTypeId.SATELLITE.toLowerCase()) {
		map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
		map_type_button.value = 'Map';
	}
	else {
		map.setMapTypeId(google.maps.MapTypeId.SATELLITE);
		map_type_button.value = 'Sattelite';
	}
}
function showNoCityMessage() {
	no_city_message.classList.remove('hide');
}

function hideNoCityMessage() {
	no_city_message.classList.add('hide');
	noCity_hideLoader();
}

function noCity_add() {
	submitCity();
	noCity_showLoader();
}

function noCity_showLoader() {
	no_city_message_prompt.classList.add('hide');
	no_city_message_wait.classList.remove('hide');
}

function noCity_hideLoader() {
	no_city_message_prompt.classList.remove('hide');
	no_city_message_wait.classList.add('hide');
}

function noCity_cancel() {
	hideNoCityMessage();
	notification_top.classList.remove('hide');
}

function noCityWait_continue() {
	infoWindow_setContent("Waiting for update");
	hideNoCityMessage();
}

function noCityWait_stop() {
	pendingPosition = null;
	pendingCity = false;
	hideNoCityMessage();
	notification_top.classList.remove('hide');
}
function hideOverlay() {
	document.getElementById('overlay').classList.add('hide');
	activateOverlayInfo_full();
}

function showOverlay() {
	document.getElementById('overlay').classList.remove('hide');
}
function postMap() {
	if(pendingLocate)
		syncLocate();
}
function suggestWrapper(event) {
	cityNameList = [];
	getCitiesFromNameId(document.getElementById('pac-input').value.toLowerCase(), function(cityList) {
		for(let key in cityList)
			cityNameList.push(getProperCityAccent(cityList[key]));
		city_styled_wordlist = cityNameList.concat(wordList.curList);
		suggestComplete();
	});
	suggestComplete();
}

function suggestComplete() {
	var input_array = document.getElementById('pac-input').value.toLowerCase().split(' ');
	var curList;
	if(input_array.length > 0)
		curList = getPossibleList(input_array.slice(0, -1));
	if(curList !=  null) {
		var curWord = input_array[input_array.length-1];
		if(curList != city_styled_wordlist && curList != wordList.curList) {
			var compareWord = input_array.slice(0, -1).join(' ')+' ';
			var newList = [];
			var regEx = new RegExp(compareWord, 'ig');
			curList.forEach(function(city_name) {
				if(city_name.toLowerCase().startsWith(compareWord))
					newList.push(city_name.replace(regEx, ''));
			});
			curList = newList;
		}
		changeInput(curList, curWord);
	}
	else
		suggestion_result.innerText = '';
};

function getPossibleList(code) {
	var list;

	if(code.length == 0)
		list = city_styled_wordlist;
	else {
		var i;
		for(i = code.length; i > 0; i--) {
			var cityName = code.slice(0, i).join(' ');
			if(cityNameList.includes(cityName)) {
				list = wordList.curList;
				break;
			}
			else {
				list = matchWord(city_styled_wordlist, cityName+' ');
				if(list && list.length > 0)
					break;
			}
		}
		for(; i < code.length; i++) {
			if(!wordList.indexOf(code[i]))
				return null;
			else
				list = wordList.curList;
		}
	}
	return list;
}

function matchWord(list, input) {
	var regEx = new RegExp(input.split('').join('\\w*').replace(/\W/, ''), 'i');
	return list.filter(function(word) {
		if (word.match(regEx)) {
			if(word.toLowerCase().startsWith(input))
				if(word.toLowerCase() != input)
					return word;
		}
	});
}

function changeInput(list, val) {
	var autoCompleteResult = matchWord(list, val);
	suggestion_result.innerText = '';
	if(autoCompleteResult.length < 5 || val.length > 2)
		for(var i = 0; i < autoCompleteResult.length && i < 10; i++) {
			var option = document.createElement('div');
			option.innerText = autoCompleteResult[i];
			option.addEventListener('click', chooseWord);
			suggestion_result.appendChild(option);
		}
}

function chooseWord(event) {
	var cur_word = document.getElementById('pac-input').value.split(' ');
	cur_word[cur_word.length-1] = this.innerText;
	document.getElementById('pac-input').value = cur_word.join(' ') + ' ';
	document.getElementById('pac-input').focus();
	suggestion_result.innerText = '';
}
function arrayContainsArray(superset, subset) {
	return subset.every(function (value) {
		return (superset.indexOf(value.toLowerCase()) >= 0);
	});
}

function clearURL() {
	if(window.location.pathname.substr(1) != '')
		window.history.pushState({"html":'',"pageTitle":''}, '', '/');
}

function capitalizeWords(s) {
	return s.replace(/(^|\s)\S/g, l => l.toUpperCase());
}
function initLoad () {
	if(!initLoadDone && document.readyState === 'interactive') {
		firebaseInit();
		dbInit();
		versionCheck();
		if(!urlDecode())
			syncLocate();
		syncInitMap();
		setupControls();
		initLoadDone = true;
	}
};

function setupControls() {
	document.getElementById('overlay').addEventListener('click', hideOverlay);
	document.getElementById('overlay_message_close').addEventListener('click', hideOverlay);
	document.getElementById('info').addEventListener('click', showOverlay);
	document.getElementById('no_city_message_close').addEventListener('click', hideNoCityMessage);
	document.getElementById('locate_right_message_close').addEventListener('click', hideLocateRightMessage);
	document.getElementById('locate_right_message_yes').addEventListener('click', locateRight_grant);
	document.getElementById('locate_right_message_no').addEventListener('click', locateRight_deny);
	document.getElementById('no_city_submit_yes').addEventListener('click', noCity_add);
	document.getElementById('no_city_submit_no').addEventListener('click', noCity_cancel);
	document.getElementById('no_city_submit_wait_continue').addEventListener('click', noCityWait_continue);
	document.getElementById('no_city_submit_wait_stop').addEventListener('click', noCityWait_stop);
	document.getElementById('notification_top').addEventListener('click', tryDefaultCity);
	document.getElementById('share_wcode_message_close').addEventListener('click', hideCopyCodeMessage);
	document.getElementById('incompatible_browser_message_close').addEventListener('click', hideIncompatibleBrowserMessage);
	document.getElementById('incompatible_browser_message_continue').addEventListener('click', hideIncompatibleBrowserMessage);
	document.getElementById('address_text_close').addEventListener('click', hideAddress);
	document.getElementById('address_text_copy').addEventListener('click', copyAddress);
	document.getElementById('choose_city_message_close').addEventListener('click', hideChooseCityMessage);
	document.getElementById('share_copy_button').addEventListener('click', shareWCodeCopy);
	document.getElementById('share_link_button').addEventListener('click', shareWCodeLink);
}

function showAndCopy(message) {
	showNotification(message);
	copyNodeText(notification_bottom);
}

function copyNodeText(node) {
	var range = document.createRange();
	range.selectNode(node);
	window.getSelection().removeAllRanges();
	window.getSelection().addRange(range);
	document.execCommand('copy');
	window.getSelection().removeAllRanges();
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
const svg_share = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScyNCcgaGVpZ2h0PScyNCcgdmlld0JveD0iMCAwIDI0IDI0Ij4gPHBhdGggZD0iTTAgMGgyNHYyNEgweiIgZmlsbD0nbm9uZScvPiA8cGF0aCBkPSJNMTggMTYuMDhjLS43NiAwLTEuNDQuMy0xLjk2Ljc3TDguOTEgMTIuN2MuMDUtLjIzLjA5LS40Ni4wOS0uN3MtLjA0LS40Ny0uMDktLjdsNy4wNS00LjExYy41NC41IDEuMjUuODEgMi4wNC44MSAxLjY2IDAgMy0xLjM0IDMtM3MtMS4zNC0zLTMtMy0zIDEuMzQtMyAzYzAgLjI0LjA0LjQ3LjA5LjdMOC4wNCA5LjgxQzcuNSA5LjMxIDYuNzkgOSA2IDljLTEuNjYgMC0zIDEuMzQtMyAzczEuMzQgMyAzIDNjLjc5IDAgMS41LS4zMSAyLjA0LS44MWw3LjEyIDQuMTZjLS4wNS4yMS0uMDguNDMtLjA4LjY1IDAgMS42MSAxLjMxIDIuOTIgMi45MiAyLjkyIDEuNjEgMCAyLjkyLTEuMzEgMi45Mi0yLjkycy0xLjMxLTIuOTItMi45Mi0yLjkyeiIgZmlsbD0nIzY5YjdjZicvPiA8L3N2Zz4g";
const svg_link = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMCIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCA0IDIyLjUgMTIiPiA8cGF0aCBkPSJtLTAuMDAzMTc3My0xLjVoMjR2MjRoLTI0eiIgZmlsbD0ibm9uZSIvPiA8cGF0aCBkPSJtMy4xNDMzIDEwYzAtMS41MjM4IDEuMzkxMi0yLjc2MjUgMy4xMDI2LTIuNzYyNWg0LjAwMzN2LTEuNjkzMWgtNC4wMDMzYy0yLjc2MjMgMC01LjAwNDEgMS45OTYxLTUuMDA0MSA0LjQ1NTYgMCAyLjQ1OTUgMi4yNDE5IDQuNDU1NiA1LjAwNDEgNC40NTU2aDQuMDAzM3YtMS42OTMxaC00LjAwMzNjLTEuNzExNCAwLTMuMTAyNi0xLjIzODctMy4xMDI2LTIuNzYyNXptNC4xMDM0IDAuODkxMTJoOC4wMDY2di0xLjc4MjJoLTguMDA2NnptOS4wMDc1LTUuMzQ2N2gtNC4wMDMzdjEuNjkzMWg0LjAwMzNjMS43MTE0IDAgMy4xMDI2IDEuMjM4NyAzLjEwMjYgMi43NjI1IDAgMS41MjM4LTEuMzkxMiAyLjc2MjUtMy4xMDI2IDIuNzYyNWgtNC4wMDMzdjEuNjkzMWg0LjAwMzNjMi43NjIzIDAgNS4wMDQxLTEuOTk2MSA1LjAwNDEtNC40NTU2IDAtMi40NTk1LTIuMjQxOS00LjQ1NTYtNS4wMDQxLTQuNDU1NnoiIGZpbGw9IiM2OWI3Y2YiIHN0cm9rZS13aWR0aD0iLjkiLz4gPC9zdmc+IA==";
const svg_map = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScyMCcgaGVpZ2h0PScyMCcgdmlld0JveD0iMCAwIDI0IDI0Ij4gPHBhdGggZD0ibTIwLjUgMy43Ni0wLjE2IDAuMDMtNS4zNCAyLjA3LTYtMi4xLTUuNjQgMS45Yy0wLjIxIDAuMDctMC4zNiAwLjI1LTAuMzYgMC40OHYxNS4xMmMwIDAuMjggMC4yMiAwLjUgMC41IDAuNWwwLjE2LTAuMDMgNS4zNC0yLjA3IDYgMi4xIDUuNjQtMS45YzAuMjEtMC4wNyAwLjM2LTAuMjUgMC4zNi0wLjQ4di0xNS4xMmMwLTAuMjgtMC4yMi0wLjUtMC41LTAuNXptLTUuNSAxNi02LTIuMTF2LTExLjg5bDYgMi4xMXoiIGZpbGw9IiM2OWI3Y2YiLz4gPHBhdGggZD0iTTAgMGgyNHYyNEgweiIgZmlsbD0nbm9uZScvPiA8L3N2Zz4g";
