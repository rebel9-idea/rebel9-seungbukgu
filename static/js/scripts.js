
	//http://192.168.0.188:7999/init POST data={"code": "rebel9266!"}
	//http://192.168.0.188:7999/place/%placeid% POST data={"code": "rebel9266!"}

	// local test domain
	//var domain = "http://192.168.0.188:7999/"
	// actual domain
	var domain = "https://sbculture.project9.co.kr/";


	var all_data;
	var data_detail;
	var data_current_authors = [];
	var current_place_index, current_work_index;
	var current_type;


	// MAPBOX STUFF
	
	var map;
	var location_data = {"country":"", "city":"", "sublocality_level_1" : "", "sublocality_level_2" : ""}

	var geocoder;
	var built_address = "";
	var is_seongbukgu = false;
	var user_coordinates;
	var geocode_results;
	var distance_from_seongbukgu;
	var map_markers;
	var floaters_markers;
	var link_lines_features;

	var supports_location = false;
	var check_location_interval;
	var location_interval_is_running = false;
	var is_checking_location = false;

	var first_load = true;
	var url_params;

	var hiddenHeight;

	// screen.orientation.addEventListener("change", function(e) {
	//   alert(screen.orientation.type + " " + screen.orientation.angle);
	// }, false);


	// FN load mapbox map
	function init_mapbox() {

		$(" .ui_intro_bg").fadeIn('slow', function(){

		    setTimeout(function(){ 
		    	$(" .ui_intro_bg").addClass('animate');
			}, 600);
		});

		mapboxgl.accessToken = "pk.eyJ1IjoiZmFyaXNrYXNzaW0iLCJhIjoiSk1MaUthdyJ9.vkxtdDbYdLi524WwlKORBw";
		map = new mapboxgl.Map({
		    container: "map",
		    style: "mapbox://styles/rebel9act/cjmxg6xwa1w182roluzcnmsbc",
		    center: [127.013387, 37.590479],
		    maxBounds: [
	    	// 	// strictly seongbukgu
	    	// 	// [126.972368, 37.572532], // Southwest coordinates
	    	// 	// [127.073682, 37.629226]  // Northeast coordinates
	    		
	    	// 	// limit hapjeong <-> nowon 
	    	// 	[126.907793, 37.547946], // Southwest limit coordinates 
	    	// 	[127.093138, 37.643414]  // Northeast limit coordinates

	    	// limit seoul city 
	    	[126.763987, 37.409558], // Southwest limit coordinates 
	    	[127.139709, 37.791012] // Northeast limit coordinates


		    ],
		    zoom: 14,
		    // minZoom: 14,
		    maxZoom: 16
		    // pitch: 60, // pitch in degrees
		    // bearing: -60, // bearing in degrees
		});
		var language = new MapboxLanguage({
			  defaultLanguage: "ko"
		});
		map.addControl(language);

		geocoder = new MapboxGeocoder({
		    accessToken: mapboxgl.accessToken
		});

		map.addControl(geocoder);

		// After the map style has loaded on the page, add a source layer and default
		// styling for a single point.
		map.on("load", function() {	

			console.log('mapbox loaded')

		    map.addSource("single-point", {
		        "type": "geojson",
		        "data": {
		            "type": "FeatureCollection",
		            "features": []
		        }
		    });


			map.loadImage("img/icn/icn_me.png", function(error, image) {
			  if (error) throw error;
			  map.addImage("custom-marker", image);
			  /* Style layer: A style layer ties together the source and image and specifies how they are displayed on the map. */
			  map.addLayer({
			    id: "markers",
			    type: "symbol",
			    /* Source: A data source specifies the geographic coordinate where the image marker gets placed. */
			    "source": "single-point",
			    layout: {
			      "icon-image": "custom-marker",
			      "icon-size": 0.5
			    }
			  });
			});

			map_markers = {
			    "type": "FeatureCollection",
			    "features": []
			};

			console.log('before ajax data request')
			// DATA get all place data
		    $.ajax({
				method: "POST",
				url: domain+"init",
				data: JSON.stringify({"code": "rebel9266!"}),
				dataType: "json",
				contentType: "application/json",
				crossDomain: true,
		    })

		    .done(function( json, textStatus, jqXHR ) {
		      	// detail_data = json.response.data;
		      	console.log("all_data received:", json)
		      	all_data = json;
				
				// on first site load, check browser url
				// if has place / work / author  param, show detail panel
				if (first_load) {
					url_params = window.location.search;

					// if url has place / work / author 
					if (url_params.indexOf("?place") >= 0 || url_params.indexOf("?work") >= 0 || url_params.indexOf("?author") >= 0) {
					  
						var data_type = url_params.substring(0, url_params.indexOf("=")).replace("?","");
						var data_code = url_params.substring(url_params.indexOf("=") + 1);
						// only show detail panel if theres such a data type / data_index
						if (all_data[data_type+"s"] != undefined) {
							populate_details(data_type, null, data_code)
						}
					} 
					// if url doesnt match anything, wipe clean
					else {
					  console.log("case3")
					  wipeclean_url("all");
					}	
					// toggle first_load
					first_load = false;
				};
				// END first_load


		      	// add all place markers to map
				for (var i = 0; i < all_data.places.length; i++) {
					var data_to_add = 	{
								            "type": "Feature",
								            "properties": {
								                "message": "Marker "+i,
								                "index": i,
								                "iconSize": [22, 30]
								            },
								            "geometry": {
								                "type": "Point",
								                "coordinates": [
								                    all_data.places[i].longitude,
								                    all_data.places[i].latitude
								                ]
								            }
								        }
				    //console.log(data_to_add);

					map_markers.features.push(data_to_add);

				    // create place marker and add to map
				    var el = document.createElement("div");
				    el.className = "marker_places";
				    el.dataset.index = i;
				    el.dataset.code = all_data.places[i].code;
				    el.style.backgroundImage = "url(img/icn/marker_place.svg)";
				    el.style.width = map_markers.features[i].properties.iconSize[0] + "px";
				    el.style.height = map_markers.features[i].properties.iconSize[1] + "px";

				    el.addEventListener('click', function() {
				        // window.alert(marker.properties.message);
				    });

				    // add marker to map
				    new mapboxgl.Marker(el)
				        .setLngLat(map_markers.features[i].geometry.coordinates)
				        .addTo(map);

				};

				// show 'get location' button when all places are added to map
				$(".intro_loading").fadeOut(function() {
					$(".intro_where").fadeIn();	
				});


		    })
		    .fail(function(jqXHR, textStatus, errorThrown) {
		        console.log("HTTP Request Failed",jqXHR);
		    })
		    .always(function() {
		    	//console.log("init request made");
		    });


		});
		// END map.on("load")

		map.on("click", function(e) {
			//console.log("clicked", e.originalEvent.path[0]) ;
			// event.path || (event.composedPath && event.composedPath()
			// console.log('pos',e)
			var clicked_element = e.originalEvent.srcElement.className;

			// if not clicking on markers, clear all relations + conencting lines
			if ( clicked_element == "mapboxgl-canvas"  ) {
				clear_map();
			}
		});


	};
	// END init_mapbox()



	// FN get user location
	function getUserLocation(method) {

		toggle_updatelocation(true);

		// request to allow user position 
	    if (navigator.geolocation) {
	    	supports_location = true;

	    	toggle_updatelocation(false);

	    	console.log("L1, getUserLocation()")
	        navigator.geolocation.getCurrentPosition(showPosition, show_location_error);
			function showPosition(position) {

				// get user current coordinates and center map on coordiates
				console.log("L2", position)
				//console.log(position.coords.latitude, position.coords.latitude)
	            user_coordinates = {
	              lat: position.coords.latitude,
	              lng: position.coords.longitude
	            };

	            // convert users coordinates to place address
	            getReverseGeocode(user_coordinates, method)

				distance_from_seongbukgu = getDistanceFromLatLonInKm(user_coordinates.lat,user_coordinates.lng,37.598378,127.017768)

			    setTimeout(function(){ 
					$(".intro_check").fadeOut();
					$(".intro_success").fadeIn();
				}, 1000);

			}
	    } else {
	    	// if device doesnt support location
	    	console.log("E1, device doesnt support location")
	    	show_location_error(error)
	    }

	    // if device supports camera, show camera buttons
	    DetectRTC.load(function() {
	    	if (DetectRTC.hasWebcam == false && detectrtc_tested != true) {
	    		console.log("device has no cam" );
	    		$(".btn_opencam").hide();
	    		$(".ui_map_bottom").addClass("no_cam");
	    		detectrtc_tested = true;
	    	} 
	    });
	}; 
	/* END getUserLocation(); */

    // calcalute distance to from 2 points in km
	function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
		function deg2rad(deg) {
		  return deg * (Math.PI/180)
		}

		var R = 6371; // Radius of the earth in km
		var dLat = deg2rad(lat2-lat1);  // deg2rad below
		var dLon = deg2rad(lon2-lon1); 
		var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
		var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
		var d = R * c; // Distance in km
		return d;
	}


	// FN NO LOCATION FEATURE OR DISABLED OR ERROR
	function show_location_error(error) {
		supports_location = false;

		// hide location update if user no location 
		toggle_updatelocation(false);
		$(".btn_update_loc").hide();
		$(".ui_map_bottom").addClass("no_location")

		console.log("error",error);
		$(".map_status").html(error.message);	  

		setTimeout(function(){ 
		  $(".intro_check").fadeOut();
		  $(".intro_fail").fadeIn();
		}, 1000);

		if (error.code == 1) {
			console.log("User denied the request for Geolocation.") 
			$(".intro_fail span").html("You have denied request for Geolocation.");
		} 
		else if (error.code == 2) {
			console.log("Location information is unavailable.") 	
			$(".intro_fail span").html("Your location is unavailable.");	
		}
		else if (error.code == 3) {
			console.log("The request to get user location timed out.")	
			$(".intro_fail span").html("Your location is unavailable.");		
		}
		else if (error.code == 4) {
			console.log("An unknown error occurred.")		
			$(".intro_fail span").html("Your location is unavailable.");	
		} else {
			console.log("An unknown error occurred.")		
			$(".intro_fail span").html("Your location is unavailable.");	
		}


	};
	// END show_location_error()


	// FN reverse geocoding (convert coordinates to address)
	function getReverseGeocode(coordinates, method) {

		geocoder.mapboxClient.geocodeReverse({
			latitude: coordinates.lat, 
			longitude: coordinates.lng
		}, function(err, res) {

			// if success
			if (res.type == "FeatureCollection") {
				//console.log(err, res)
				geocode_results = res
				built_address = geocode_results.features[1].place_name;

				// draw user location on map
				map.getSource("single-point").setData({type: "Point", coordinates: [user_coordinates.lng,user_coordinates.lat]});
		   		
		   		// if user is in SBG
		        if (built_address.includes("Seongbuk-gu") || built_address.includes("성북구") ) {
		        	is_seongbukgu = true;
		        	//console.log("is_seongbukgu");
		        	$('.intro_success span').html('당신은 현재 성북구에 있군요! 지금, 성북구의 이야기를 만나보세요');
		        	// center map on user only if its not an interval location check
		        	if ( method != "interval") {
		        		map.easeTo({center: [coordinates.lng, coordinates.lat], zoom : 14});	
		        	}
		        	
					$(".btn_update_loc").show();
					$(".ui_map_bottom").removeClass("no_location")
					if (cam_denied != true) {
						$(".btn_opencam").show();	
						$(".ui_map_bottom").removeClass("no_cam")
					}
					

					// start checking user location every x seconds
					if (location_interval_is_running == false) {
						check_location_interval = setInterval(location_interval, 10000);	
					}
					
		        } else {
		        	console.log("not seongbukgu");
		        	map.easeTo({center: [127.016043, 37.589432 ]});

		        	// if user is out of SBG but nearby SBG
		        	//update user location
		        	if (distance_from_seongbukgu < 6) {
		        		$(".btn_update_loc").show();
		        		$(".ui_map_bottom").removeClass("no_location")
		        	} else {
		        		$(".btn_update_loc").hide();
		        		$(".ui_map_bottom").addClass("no_location")
		        	}

		        	// // hide cam buttons if user not in SBG
		        	// $(".btn_opencam").hide();
		        	// $(".ui_map_bottom").addClass("no_cam")

		        	// show cam even if user is not in sbg
					$(".btn_opencam").show();	
					$(".ui_map_bottom").removeClass("no_cam")


		        	// stop checking interval if user goes out of SBG
		        	clear_location_interval()
		        }

				$(".map_status").html( built_address +".<BR>In Seongbuk-gu?: "+ is_seongbukgu+ ".<BR>Distance from Seongbuk-gu: "+ parseInt(distance_from_seongbukgu)+"km" );
			}

		});

	    // function makeHtml(data) {
	    //     var feature = data.features[0];
	    //     var name = feature.text;
	    //     var type = feature.type;
	    //     var formattedHtml = "<strong>" + name + "</strong><br>" + type;
	    //     return formattedHtml;
	    // }
	};
	// END getReverseGeocode()


	// FN 
	function location_interval() {
		location_interval_is_running = true;
		getUserLocation("interval");
	};
	// END location_interval()


	// FN
	function clear_location_interval() {
		if (location_interval_is_running) {
			clearInterval(check_location_interval);	
			location_interval_is_running = false;
		}
	};
	// END clear_location_interval()


	// FN enable disable "update location" and cam button
	function toggle_updatelocation(condition) {
		is_checking_location = condition
		if (is_checking_location == true) {
			$(".btn_update_loc").addClass("disabled");
		} else {
			$(".btn_update_loc").removeClass("disabled");
		}
	};
	// END toggle_updatelocation()



	// FN find and show related places, works, people in relation to clicked place marker
	function check_relation(data_index) {

		var related_data = all_data.places[data_index].work
		data_current_authors = [];

		clear_map();

		// set up empty features for floater markers
		floaters_markers = {
		    "type": "FeatureCollection",
		    "features": []
		};


		// check for related works and add to floaters_markers.features
		if (related_data.length > 0) {

			for (var i = 0; i < related_data.length; i++) {

				var works_to_add = {
							            "type": "Feature",
							            "properties": {
							                "message": "Work "+i,
							                "markertype": "work",
							                "code": related_data[i].code,
							                "index": i,
							                "name": related_data[i].name
							            },
							            "geometry": {
							                "type": "Point",
							                "coordinates": [
							                    0,
							                    0
							                ]
							            }
							        }

				// add related works to all-floaters array
				floaters_markers.features.push(works_to_add);


				// make related authors array, and only if its not duplicate
				var this_works_author = related_data[i].author;
				//console.log(data_current_authors[0], this_works_author, data_current_authors[0] == this_works_author);
				if ( JSON.stringify(data_current_authors).indexOf(JSON.stringify(this_works_author) ) === -1) {
					data_current_authors.push(this_works_author);	
				} 

			}
		};

		// // check for related people and add to floaters_markers.features
		if (data_current_authors.length > 0) {
			
			for (var i = 0; i < data_current_authors.length; i++) {

				var person_to_add = {
							            "type": "Feature",
							            "properties": {
							                "message": "author "+i,
							                "markertype": "author",
							                "code": data_current_authors[i].code,
							                "index": i,
							                "related_places": data_current_authors[i].rel_places,
							                "name": data_current_authors[i].name,
							                "thumb": domain+'img/icn/marker_author_active_default.png',
							            },
							            "geometry": {
							                "type": "Point",
							                "coordinates": [
							                    0,
							                    0
							                ]
							            }
							        }

 				// if author has images, change thumbnail image to his image instead of using default
   	 			if (data_current_authors[i].images.length > 0) {
   	 				person_to_add.properties.thumb = domain+data_current_authors[i].images[0].image_thumb
   	 			} 

		        // add related persons to all-floaters array
				floaters_markers.features.push(person_to_add);

			}
		}


		// add all floaters_markers to map as markers
		if (floaters_markers.features.length > 0) {

			for (var i = 0; i < floaters_markers.features.length; i++) {

				// radius of related items
				var floaters_rad = 0.0023;
				
				floaters_markers.features[i].geometry.coordinates = [
	                all_data.places[data_index].longitude + (floaters_rad + floaters_rad *  Math.sin((360 / floaters_markers.features.length / 180) * (i + 0) * Math.PI)) - floaters_rad,
	                all_data.places[data_index].latitude + (floaters_rad + -floaters_rad * Math.cos((360 / floaters_markers.features.length / 180) * (i + 0) * Math.PI)) - floaters_rad
				]

			    // create marker and add to map
				    var el = document.createElement("div");  
				    el.className = "marker_floaters floater_"+floaters_markers.features[i].properties.markertype;
				    el.dataset.index = i;
				    el.dataset.code = floaters_markers.features[i].properties.code;
				    el.dataset.type = floaters_markers.features[i].properties.markertype;

				    // append thumbnail image to author floater
				    if (floaters_markers.features[i].properties.markertype == "author") {
				    	var author_thumb = document.createElement('div');
				    	author_thumb.className = "author_thumb";
				    	var author_thumb_img = document.createElement("img");
				    	author_thumb_img.src = floaters_markers.features[i].properties.thumb;
				    	author_thumb.appendChild(author_thumb_img);
				    	el.appendChild(author_thumb)
				    }

				    // append author name to author floater
				    var name_span = document.createElement('span')
				    name_span.innerHTML = floaters_markers.features[i].properties.name;
				    el.appendChild(name_span);

				    // add marker to map
				    new mapboxgl.Marker(el)
				        .setLngLat(floaters_markers.features[i].geometry.coordinates)
				        .addTo(map);

				   //console.log("R2 HERE", floaters_markers.features[i].geometry.coordinates)    

			}
		};

		//draw relation lines between markers
		draw_lines(data_index)
		
	};  
	// END check_relation()


	// FN draw relation lines between markers
	function draw_lines(data_index) {
	 
		link_lines_features = [];

	    for (var i = 0; i < floaters_markers.features.length; i++) {

            // LINK LINES : work marker to place marker
    	    if (floaters_markers.features[i].properties.markertype == "work") {

		    	// set up empty features for single line
		    	// from coordinates of clicked place marker -> coordinates of related marker
		    	link_lines_features_to_add = {
											    "type": "Feature",
							                    "properties": {
							                        "dasharray": [3,3],
							                        "width": 1,
							                    },
											    "geometry": {
											        "type": "LineString",
											        "coordinates": [
											            [ all_data.places[data_index].longitude , all_data.places[data_index].latitude ],
											            floaters_markers.features[i].geometry.coordinates
											        ]
											    }
											 };

	    		link_lines_features.push(link_lines_features_to_add)
	    	};


	    	//  LINK LINES : author marker to related places 
    	    if (floaters_markers.features[i].properties.markertype == "author") {

		    	// set up empty features for single line
		    	// from coordinates of author marker -> coordinates of related marker
		    	var related_shortcode = floaters_markers.features[i].properties.related_places

		    	// 2nd loop to draw lines for each related place -> author

		    	// stop gap measure to limit author's place relation
		    	if (related_shortcode.length < 5) {
		    		var author_place_links = related_shortcode.length	
		    	} else {
		    		var author_place_links = 5;
		    	}
		    	

		    	// for (var y = 0; y < related_shortcode.length; y++) {
		    	for (var y = 0; y < author_place_links; y++) {
			    	link_lines_features_to_add = {
												    "type": "Feature",
								                    "properties": {
								                        "dasharray": [0.1,0.1],
								                        "width": 0.5,
								                    },
												    "geometry": {
												        "type": "LineString",
												        "coordinates": [
												            [ related_shortcode[y].longitude , related_shortcode[y].latitude ],
												            floaters_markers.features[i].geometry.coordinates
												        ]
												    }
												 };
												 
		    		link_lines_features.push(link_lines_features_to_add)
		    	}
	    	};
	    };



	    map.addSource("link-lines-source", {
	        "type": "geojson",
	        "data": {
	            "type": "FeatureCollection",
	            "features": link_lines_features
	        }
	    });

	    // add lines to map
		map.addLayer({
		    "id": "link-lines-id",
		    "type": "line",
		    "source": "link-lines-source",
		    "paint": {
		        "line-color": "#000",
		        "line-width": ['get', 'width'],
		        "line-dasharray": [3,3]
		    }
		});	    	

	};
	// END draw_lines()


	// FN clear floater markers on map
	function clear_map() {
		$(".marker_people").remove();
		$(".marker_floaters").remove();
		$('.marker_places').css('background-image', 'url(img/icn/marker_place.svg)');	

		$(".mapboxgl-canvas-container").removeClass("showing_relations");
		$(".marker_places").removeClass("show_relations");	

		// remove and reset layers and source on each click
		if (map.getLayer("link-lines-id") != undefined) {
			map.removeLayer("link-lines-id");
		}
		if (map.getSource("link-lines-source") != undefined) {
			map.removeSource("link-lines-source");
		}

	};
	// END clear_map()



	/*** CAMERA AND SHARE FUNCTIONS ***/

	var supports_cam = false;

    var canvas_width;
    var canvas_height;
    var captured_img;

    var filter_overlay = "noise_overlay.png"
    var filter_effect = "sepia"

	// START WEBCAM / PHONE CAMERA
	var cam_feed = document.getElementById("cam_feed");
	var snapshot_canvas = document.getElementById("snapshot_canvas");
	var constraints = {
		video: { facingMode: "environment" } 
	};
	var snapshot;

	var cam_denied = false;

	var closest_location_arr = [];
	var lowest_index;
	var lowest_value;
	var closest_place_text;
	var closest_place_name;

    // start camera feed
    function start_camera() {

    	$('.location_text').empty();
    	$('.location_name').empty();

    	// BLOCK : look for shortest distance between user and all places
    	closest_location_arr = [];
    	for (var i = 0; i < all_data.places.length; i++) {
    		closest_location_arr.push( getDistanceFromLatLonInKm(user_coordinates.lat, user_coordinates.lng, all_data.places[i].latitude, all_data.places[i].longitude) ) ;
    	}

		lowest_index = 0;
		lowest_value = closest_location_arr[0];
		for (var i = 1; i < closest_location_arr.length; i++) {
		  if (closest_location_arr[i] < lowest_value) {
		    lowest_value = closest_location_arr[i];
		    lowest_index = i;
		  }
		};
		var closest_place_code = all_data.places[lowest_index].code;
		closest_place_name = '<'+all_data.places[lowest_index].name+'> 중';
		// the following doesnt have a quote, use a fallback instaed; P9, 13, P15, 16,17,  P25
		if ( closest_place_code == 'P00009' || closest_place_code == 'P00013' || closest_place_code == 'P00015' || closest_place_code == 'P00016' || closest_place_code == 'P00017' || closest_place_code == 'P00018' || closest_place_code == 'P00025' ) {
			closest_place_code = 'P00001';
		}
		//console.log(all_data.places[lowest_index].code)
		// closest_place_text = all_data.places[lowest_index].cam_text;
		// console.log("closest place cam text:", closest_place_text);
		// end BLOCK  

	    $.ajax({
	      method: "POST",
	      url: domain+"getquote/"+closest_place_code,
	      data: JSON.stringify({"code": "rebel9266!"}),
	      dataType: "json",
	      contentType: "application/json",
	      crossDomain: true,
	    })
	    .done(function( json, textStatus, jqXHR ) {
	    	console.log(json)
	    	closest_place_text = json.Result;
	    	$('.location_text').html(closest_place_text);
	    	$('.location_name').html(closest_place_name);
				
	    	// add linebreak '\n' for every nth space in string
			var n = 9;
			var ch = ' ';
			var regex = new RegExp("((?:[^" +ch+ "]*" +ch+ "){" + (n-1) + "}[^" +ch+ "]*)" +ch, "g");
			closest_place_text = closest_place_text.replace(regex, '$1\n');
			console.log(closest_place_text);

	    })	
	    .fail(function(jqXHR, textStatus, errorThrown) {
	        console.log("HTTP Request Failed",jqXHR);
	    })
	    .always(function() {
	    	// console.log("detail data request made")
	    });


	                    
    	$(".ui_share").hide();

        navigator.mediaDevices.getUserMedia(constraints)
        .then((stream) => {

		    $(".cam_component").show();
		    resize_event();

            setTimeout(function(){ 
                snapshot_canvas.width = $("#cam_feed").width();
                snapshot_canvas.height = $("#cam_feed").height();
            }, 100);
          // Attach the video stream to the video element and autoplay.
          cam_feed.srcObject = stream;
          $("#cam_capture").attr("class", "cam_live");
          $('.cam_share').css('display', 'none');
          $(".cam_filter").show();
          
        })
        .catch(function(err) {
  			show_camera_error(err)
		});
    };

    // FN no camera supported
	function show_camera_error(error) {
		console.log(error);
		cam_denied = true;

		$(".btn_opencam").hide();
		$(".ui_map_bottom").addClass("no_cam");

		$(".no_camera").fadeIn(function() {
            setTimeout(function(){ 
                $(".no_camera").fadeOut()
            }, 4000);

		})
	};

    // FN stop camera feed
    function stop_camera() {
        cam_feed.srcObject.getVideoTracks().forEach(track => track.stop());
        $('.cam_share').css('display', 'flex');
        $(".cam_filter").hide();
    };
    // END fn stop_camera();

    // take a photo
    $("#cam_capture").click(function() {

        if (this.classList.contains("cam_live")) {
            // flip context first
            //snapshot_canvas.getContext("2d").setTransform(-1, 0, 0, 1, snapshot_canvas.width, 0);
            snapshot_canvas.getContext("2d").drawImage(cam_feed, 0, 0, snapshot_canvas.width, snapshot_canvas.height);
            snapshot = snapshot_canvas.toDataURL("image/png");
            //console.log(snapshot);
            
            $(".snapshot_store").attr("src", snapshot)
            setTimeout(function(){ 
                add_fabric_img()
            }, 500);

            // stop camera when photo is snapped
            stop_camera();

            $("#cam_capture").attr("class", "cam_ended");
        } else {
            start_camera();
        }
    });

    $('.cam_share').click(function() {
		$('.share_modal').fadeIn('fast');
		$('.share_modal .loading').fadeIn('fast');
		$('.camera_buttons').fadeOut('fast');
		$('.share_modal pre').html('로딩 중...');
		$('.share_modal pre').removeClass('copied');
		$('.copy_url').hide();
		$('.copy_url').html('복사');
		send_image();

    });

    new ClipboardJS('.copy_url');

    $('.copy_url').click(function() {
		var text = $('.share_modal pre').html();
		$('.share_modal pre').addClass('copied');
		$('.copy_url').html('복사하였습니다');

    });



    $('.close_share').click(function() {
    	$('.share_modal').fadeOut('fast');
    	$('.camera_buttons').fadeIn('fast');
    });


    var d_canvas;
    var detectrtc_tested = false;

  	// FABRIC CANVAS DRAWING 
    d_canvas = new fabric.Canvas("d_canvas", {
        isDrawingMode: false,
        selection: false
    });
    //d_canvas.enableGLFiltering = false;

    // resize canvas on resize
    window.addEventListener("resize", resize_event, false);

    // make canvas aspect ratio 3:4
    var canvas_padding = 50;
    canvas_width = window.innerWidth - canvas_padding;
    canvas_height = (window.innerWidth/3)* 4 - canvas_padding;

    // resize fabric canvas
    function resize_event() {
        d_canvas.setDimensions({
            width: canvas_width,
            height: canvas_height
        });

		snapshot_canvas.width = canvas_width;
		snapshot_canvas.height = canvas_height;
    };
    //FN resize_event

    d_canvas.on({
        "touch:gesture": function() {
        //console.log("gesture")
        },
        "touch:drag": function() {
        //console.log("dragging")
        },
        "mouse:down": function(e) {
        // console.log("mousedown",e);
        },
        "mouse:up": function() {
        //console.log("mouseup")
        },
        "touch:orientation": function() {
        //console.log("orientation")
        },
        "touch:shake": function() {
        //console.log("shaking")
        },
        "touch:longpress": function() {
        //console.log("longpress")
        },
        "object:moving": function(e) {
        }

    });

    // FN RESET CANVAS
    function reset_canvas() {
      
      // clear canvas
      d_canvas.clear();

      // add bg color to canvas
      d_canvas.setBackgroundColor("rgba(255, 255, 255, 1)", d_canvas.renderAll.bind(d_canvas));  

    };
    // END fn reset_canvas()

    // FN add image to fabriccanvas
    function add_fabric_img() {

        reset_canvas();

		captured_img = document.getElementsByClassName("snapshot_store")[0];
		//console.log(captured_img, captured_img.width, captured_img.height);

        // make image "object-fit:contain" on the fabric canvas
        var canvas_aspect = canvas_width / canvas_height;
        var img_aspect = captured_img.width / captured_img.height;
        var snap_left, snap_top, snap_scale_factor;

        if (canvas_aspect >= img_aspect) {
            snap_scale_factor = canvas_width / captured_img.width;
            snap_left = 0;
            snap_top = 0;
        } else {
            snap_scale_factor = canvas_height / captured_img.height;
            snap_top = 0;
            snap_top = -((captured_img.width * snap_scale_factor) - canvas_width) / 2;
        }

		var captured_img_instance = new fabric.Image(captured_img, {
            top: snap_top,
            left: snap_left,
            originX: "left",
            originY: "top",
            scaleX: snap_scale_factor,
            scaleY: snap_scale_factor,
            flipX:false
        });

		// add filter
        
        if (filter_effect == "sepia") {
            captured_img_instance.filters.push(new fabric.Image.filters.Sepia());
            console.log("matched")
        } else {
            captured_img_instance.filters.push(new fabric.Image.filters.Grayscale());
        }
        
		// apply filters and re-render canvas when done
		captured_img_instance.applyFilters();
		d_canvas.add(captured_img_instance);

        // add noise overlay
        fabric.Image.fromURL("img/"+filter_overlay, function(noiseImg) {

            // make noise overlay "object-fit:cover" on the fabric canvas
            var noise_aspect = noiseImg.width / noiseImg.height;
            var noise_left, noise_top, noise_scale_factor;

            if (canvas_aspect >= noise_aspect) {
                var noise_scale_factor = canvas_width / noiseImg.width;
                noise_left = 0;
                noise_top = -((noiseImg.height * noise_scale_factor) - canvas_height) / 2;
            } else {
                var noise_scale_factor = canvas_height / noiseImg.height;
                noise_top = 0;
                noise_left = -((noiseImg.width * noise_scale_factor) - canvas_width) / 2;
            }

            var noise_overlay = noiseImg.set({
                top: noise_top,
                left: noise_left,
                originX: "left",
                originY: "top",
                scaleX: noise_scale_factor,
                scaleY: noise_scale_factor,
            });
            d_canvas.add(noise_overlay); 

            // show ui_share when captured image has been added
            $(".ui_share").show();
        });


        // add frame overlay
        fabric.Image.fromURL("img/ratio_overlay.png", function(noiseImg) {

            // make noise overlay "object-fit:cover" on the fabric canvas
            var noise_aspect = noiseImg.width / noiseImg.height;
            var noise_left, noise_top, noise_scale_factor;

            if (canvas_aspect >= noise_aspect) {
                var noise_scale_factor = canvas_width / noiseImg.width;
                noise_left = 0;
                noise_top = -((noiseImg.height * noise_scale_factor) - canvas_height) / 2;
            } else {
                var noise_scale_factor = canvas_height / noiseImg.height;
                noise_top = 0;
                noise_left = -((noiseImg.width * noise_scale_factor) - canvas_width) / 2;
            }

            var noise_overlay = noiseImg.set({
                top: noise_top,
                left: noise_left,
                originX: "left",
                originY: "top",
                scaleX: noise_scale_factor,
                scaleY: noise_scale_factor
            });
            d_canvas.add(noise_overlay); 

            // show ui_share when captured image has been added
            $(".ui_share").show();


	        var svgtext = new fabric.Text(closest_place_text, { 
		        fontFamily: "Noto Serif",
		        fontWeight: "400",
		        left: 0, 
		        top: 200,
		        fill: "black",
		        textAlign : "right",
		        fill:'#2C4997',
		        id:"",
		        fontSize: 10.5
	        });

	        var svgtext2 = new fabric.Text(closest_place_name, { 
		        fontFamily: "Noto Serif",
		        // fontWeight: "bold",
		        left: 0, 
		        top: 200,
		        fill: "black",
		        textAlign : "right",
		        fill:'#2C4997',
		        id:"",
		        fontSize: 10.5
	        });

	        svgtext.left = canvas_width - svgtext.width - 10;
	        svgtext.top = canvas_height - svgtext.height - 40;

	        svgtext2.left = canvas_width - svgtext2.width - 10;
	        svgtext2.top = canvas_height - svgtext2.height - 10;

	        d_canvas.add(svgtext);
	        d_canvas.bringToFront(svgtext);

	        d_canvas.add(svgtext2);
	        d_canvas.bringToFront(svgtext2);


	        fabric.loadSVGFromURL('img/title.svg' ,function(objects,options){
	            var svgObj = fabric.util.groupSVGElements(objects, options);

	            svgObj.scaleX = 1;
	            svgObj.scaleY = 1;

	            var svgObjWidth = svgObj.width * svgObj.scaleX;
	            var svgObjHeight = svgObj.height * svgObj.scaleY;

	            svgObj.scale(0.7).set({
	                left: 12,
	                top:  9,
	                width: 185,
	                height: 19,
	                id:'svg_title',
	                objType:'object'//,
	                //hasControls: false,
	                //hasBorders: false
	            });

	            d_canvas.add(svgObj);
	            d_canvas.bringToFront(svgObj);
	            //d_canvas.setActiveObject(svgObj);

	        });
        });

    };
    // END FN add_fabric_img();


    // FN send base64
    function send_image() {

		// var base64_export = {)};
		//console.log(base64_export);

		$.ajax({
			method: "POST",
			url: domain+'upload',
			// dataType: "json",
			// contentType: "application/json",
			crossDomain: true,
			data: 	{
						"code": "rebel9266!", 
						"file": d_canvas.toDataURL({format: 'jpeg', quality:1, enableRetinaScaling:true}) 
					}
		})
		.done(function( json, textStatus, jqXHR ) {
			console.log('base64 post success',json);
			$('.share_modal pre').html(domain+'share/'+json.Result.path);
			$('.copy_url').fadeIn('fast');
		})
		.fail(function(jqXHR, textStatus, errorThrown) {
		  	console.log("HTTP Request Failed",jqXHR);
		})
		.always(function() {
			//console.log('made post base64 request')
		});


    };



    // FN populate list
    function populate_list(data_type, is_now_on_list) {
		
		var datatouse = all_data[data_type+'s'];
		
		function get_list_data(data_type) {
			$(".ui_list .list_content").empty();

	    	for (var i = 0; i < datatouse.length; i++) {
	    		$(".ui_list .list_content").append("<li data-type="+data_type+" data-code="+datatouse[i].code+" data-index='"+i+"'>"+datatouse[i].name+"</li>");
	    	}
	    	$(".ui_list .list_content").fadeIn();
	    	// timeout needed because scrolltop wont reset when its hidden
		    setTimeout(function(){ 
		    	$(".ui_list .list_content").scrollTop(0);
			}, 50);
	    	
		};     	

    	$(".ui_list .list_buttons li").removeClass("active");
    	$(".list_"+data_type+'s').addClass("active");


    	if (is_now_on_list) {
    		$(".ui_list .list_content").fadeOut("fast", function() {
    			get_list_data(data_type);
    		});
    	} else {
    		$(".ui_list").fadeIn();
    		get_list_data(data_type);
    	}

    };
    // END FN populate_list()


    //FN populate detail panel
    function populate_details(data_type, data_id, data_code) {

    	$('#meta_wrap').attr('class', 'type_'+data_type);
    	// prevent double click on markers
    	$('#map').addClass('disabled');

		//update url of detail page with data_type + data_id
		updateURL("?"+data_type+"="+data_code);	

		get_single_data(data_type, data_code);


    };
    // END populate_details() 


    // FN request single data. use params eg ('place', 'P00004')
	function get_single_data(data_type, data_code) {

		// use to show correct data on list when closing detail panel
		current_type = data_type;

	    $.ajax({
	      method: "POST",
	      url: domain+data_type+"/"+data_code,
	      data: JSON.stringify({"code": "rebel9266!"}),
	      dataType: "json",
	      contentType: "application/json",
	      crossDomain: true,
	    })
	    .done(function( json, textStatus, jqXHR ) {
			// detail_data = json.response.data;8
			console.log("data_detail received", json)
			data_detail = json.Result;

			$(".ui_detail").fadeIn();
			$(".ui_detail").scrollTop(0);
			$('#meta_wrap').fadeIn();
			show_sticky_title();

			// check for images	and populate
			if ( data_detail.images.length > 0) {
				$(".meta_image").hide()
				$(".slider_wrap").empty();
				// for (var i = 0; i < data_detail.img_path.length; i++) {
				for (var i = 0; i < data_detail.images.length; i++) {
					$(".slider_wrap").append('\
						<li>\
							<img src="'+domain.substring(0, domain.length - 1)+data_detail.images[i].image_orig+'">\
						</li>');
				}
				
				// init slick with slight delay because of adaptive height issue for 1st image
				setTimeout(function(){ 
					$(".meta_image").show()

					$(".slider_wrap").slick({
						dots: true,
						arrows:false,
						infinite: true,
						mobileFirst:true,
						adaptiveHeight: true
					});
		
					// slider caption
					if  (data_detail.images[0].image_caption.length > 0) {
						$('<span class="slider_caption">'+data_detail.images[0].image_caption+'</span>').insertBefore('.slick-dots');
					} else {
						$('.slider_caption').remove();
					}

				}, 700);




			} else {
				$(".meta_image").hide()
			};

			//  title 
			$('.meta_title, .meta_title_sticky').html(data_detail.name)


			// subtitle 
			if (data_type == 'place') {
				$(".meta_subtitle1").hide()
				$(".meta_subtitle2").show()
				$(".meta_subtitle2").html(data_detail.address);
			} 
			else if (data_type == 'work') {
				$(".meta_subtitle1").hide()
				$(".meta_subtitle2").show()

				var dob = data_detail.author.dob.toString().replace(/(\d{4})(\d{2})(\d{2})/, "$1.$2.$3");
				var dod = data_detail.author.dod.toString().replace(/(\d{4})(\d{2})(\d{2})/, "$1.$2.$3");

				$(".meta_subtitle2").html('<span data-type="author" data-code="'+data_detail.author.code+'">'+ data_detail.author.name +'</span><br>'+dob +' - '+dod);
			}
			else if (data_type == 'author') {
				$(".meta_subtitle1").hide()
				$(".meta_subtitle2").show()
				

				var dob = data_detail.dob.toString().replace(/(\d{4})(\d{2})(\d{2})/, "$1.$2.$3");
				var dod = data_detail.dod.toString().replace(/(\d{4})(\d{2})(\d{2})/, "$1.$2.$3");


				$(".meta_subtitle2").html(dob +' - '+dod);
			};


			// description
			$(".meta_desc").empty();

			if (data_type == 'work') {

				$(".meta_desc").append('\
					<span>'+data_detail.desc+'</span>\
					<div class="chapter_header">\
						<div class="chapter_read read_off">\
							<div class="tts_read"><img src="img/icn/icn_tts_turnon.svg"> 부분듣기</div>\
							<div class="tts_divider">|</div>\
							<div class="tts_read_all">전체듣기</div>\
							<div class="tts_stopread"><img src="img/icn/icn_tts_turnoff.svg">  듣기종료</div>\
						</div>\
					</div>\
					<div class="expand_desc"><img class="expand_arrow" src="img/icn/icn_arrow_down.svg"> 작품설명 더보기</div>\
				')
				tts_text = data_detail.desc;

				// set up accordion description text
			    hiddenHeight; 
			    // console.log('height', $('.meta_desc span').get(0).scrollHeight)
			    if ($('.meta_desc span').get(0).scrollHeight <= 310) {
			      $('.meta_desc').removeClass('expandable');
			      $('.expand_desc').hide();
			      $('.meta_desc span').height($('.meta_desc span').get(0).scrollHeight);
			      console.log('case1')
			    } else {
				  console.log('case2')		    	
			      $('.expand_desc').show();
			      $('.meta_desc span, .meta_desc').removeClass('open');
			      hiddenHeight = 200;
			      $('.meta_desc').addClass('expandable');
			      $('.meta_desc span').height(hiddenHeight);
			      $('.expand_desc').html('<img class="expand_arrow" src="img/icn/icn_arrow_down.svg"> 작품설명 더보기');
			    }

			} else {

				if (data_detail.desc.length > 2) {
					$(".meta_desc").show();
					$(".meta_desc").append('\
						<div class="ribbon"><img src="img/ribbon.svg"></div>\
						<div class="chapter_read read_off"><div class="tts_read"><img src="img/icn/icn_tts_turnon.svg"> 전체듣기</div><div class="tts_stopread"><img src="img/icn/icn_tts_turnoff.svg">  듣기종료</div></div>\
						<span>'+data_detail.desc+'</span>\
					')
				} else {
					$(".meta_desc").hide();
				}

			}



			// related docs
			if (data_type == 'work') {	
				$(".meta_rel_doc").show();
				$(".meta_rel_doc span").html(data_detail.author.rel_docs);
			}
			else if (data_type == 'author') {
				$(".meta_rel_doc").show();
				$(".meta_rel_doc span").html(data_detail.rel_docs);
			} else {
				$(".meta_rel_doc").hide();
			}

			// work chapters
			if (data_type == 'work') {	
				if (data_detail.chapters.length > 0) {
					$(".meta_chapters").empty();
					$(".meta_chapters").show();

					for (var i = data_detail.chapters.length - 1; i >= 0; i--) {
						$(".meta_chapters").prepend('\
							<div class="ribbon"><img src="img/ribbon.svg"></div>\
							<div class="single_chapter">\
								<span>'+data_detail.chapters[i].desc+'</span>\
								<div class="chapters_rel">'+data_detail.chapters[i].rel_docs+'</div>\
								<div class="chapter_header">\
									<div class="chapter_read read_off">\
										<div class="tts_read"><img src="img/icn/icn_tts_turnon.svg"> 부분듣기</div>\
										<div class="tts_divider">|</div>\
										<div class="tts_read_all">전체듣기</div>\
										<div class="tts_stopread"><img src="img/icn/icn_tts_turnoff.svg">  듣기종료</div>\
									</div>\
								</div>\
							</div>\
							')
					}

					$(".meta_chapters").prepend('\
						<div class="chapters_title">'+data_detail.author.name+'가 남긴 성북구 이야기</div>'
						);
					$(".meta_chapters").append('\
							<div class="ribbon"><img src="img/ribbon.svg"></div>'
						);

				} else {
					$(".meta_chapters").hide();
				}
				
			} else {
				$(".meta_chapters").hide();
			}

			// all works
			if (data_type == 'author') {
				if (data_detail.works.length > 0) {
					$('.meta_allworks ul').empty();
					$('.meta_allworks').show();
					for (var i = 0; i < data_detail.works.length; i++) {
						$(".meta_allworks ul").append('<li data-type="work" data-code="'+data_detail.works[i].code+'">'+data_detail.works[i].name+'</li>');
					}						
				} else {
					$('.meta_allworks').hide();
				}
			}  else {
				$('.meta_allworks').hide();
			}

			//  related data
			if (data_type == 'place') {
				console.log(data_detail)
				if (data_detail.work.length > 0) {
					// clear related each time on new detail load
					$('.meta_related').show();
					$('.meta_related ul').empty();
					var related_authors = []

					// add all related works
					for (var i = 0; i < data_detail.work.length; i++) {
						$('.meta_related ul').append('<li data-type="work" data-code="'+data_detail.work[i].code+'">'+data_detail.work[i].name+'</li>')
					}

					// create an array for each author from each work
					for (var i = 0; i < data_detail.work.length; i++) {

						// empty object for pushing into the array
						var single_author = {
							"name": data_detail.work[i].author.name,
							"code": data_detail.work[i].author.code,
						}

						// only push to the array if its not a duplicate of whats inside the array
						if ( JSON.stringify(related_authors).indexOf(JSON.stringify(single_author) ) === -1) {
							related_authors.push(single_author);	
						} 
						
					}

					// use related author array created above and append to meta_related
					for (var i = 0; i < related_authors.length; i++) {
						$('.meta_related ul').append('<li data-type="author" data-code="'+related_authors[i].code+'">'+related_authors[i].name+'</li>')
					}

				} else {
					$('.meta_related').hide();
					$('.meta_related ul').empty();
				}
			} else {
				$('.meta_related').hide();
				$('.meta_related ul').empty();
			}

			// define what to read for tts_text_all
			if (data_type == 'place' || data_type == 'author') {
				tts_text_all = $('.meta_desc').text();	
			} else {
				tts_text_all = $('.meta_desc').text();
				
				$('.single_chapter span').each(function(){
				  tts_text_all += $(this).text();
				})		
			}
			

	    })
	    .fail(function(jqXHR, textStatus, errorThrown) {
	        console.log("HTTP Request Failed",jqXHR);
	    })
	    .always(function() {
	    	// console.log("detail data request made")
	    });
	};
	// END


    $(document).on("click",".expand_desc",function(){

      if ( $('.meta_desc span').hasClass('open') ) {	
        
        $('.expand_desc').html('<img class="expand_arrow" src="img/icn/icn_arrow_down.svg"> 작품설명 더보기');

        $('.meta_desc span').animate({
            height: hiddenHeight
        }, 300, function(){
        });  
        console.log('case4')	
        $('.meta_desc span, .meta_desc').removeClass('open');
      } else {
	    
        $('.expand_desc').html('<img class="expand_arrow" src="img/icn/icn_arrow_up.svg"> 작품설명 닫기');

        $('.meta_desc span').animate({
            height: $('.meta_desc span').get(0).scrollHeight
        }, 300, function(){
            $('.meta_desc span').height('auto');
        });
        console.log('case3')	
        $('.meta_desc span, .meta_desc').addClass('open');
      }

      
    });


	// check location in intro
	$(".location_check").click(function() {
		$(".intro_where").fadeOut();
		$(".intro_check").fadeIn();
		getUserLocation();

	});

	// go to map from intro
	$(".btn_start").click(function() {
		$(".ui_intro").fadeOut();
	});
	
	// refresh location while viewing map
	$(".btn_update_loc").click( function() {
		getUserLocation();
		clear_map();
	})

	// click on PLACE markers
	$(document).on("click",".marker_places",function(){

		console.log('clicked marker_places')

		current_place_index = $(this).attr("data-index");
		var data_code = $(this).attr("data-code");
			

		// check if this place has related places
		// if no, directly open details panel instead of zooming in to place marker first
		// if 1st click, zoom to place marker
		// if 2nd click, open detail

		// console.log(all_data.places[current_place_index].work.length)
		if ( $(this).hasClass("show_relations")  ) {
			// console.log('case1');
			populate_details("place", current_place_index, data_code);
		} else {

			if (all_data.places[current_place_index].work.length == 0) {
				// console.log('case2');
				clear_map();
				map.easeTo(
				{
					center 	: [map_markers.features[current_place_index].geometry.coordinates[0], map_markers.features[current_place_index].geometry.coordinates[1]],
					zoom 	: 15,
					duration: 600
				});	
			    setTimeout(function(){ 
					populate_details("place", current_place_index, data_code);	
				}, 400);

			} else {
				// console.log('case3');
				map.easeTo(
					{
						center 	: [map_markers.features[current_place_index].geometry.coordinates[0], map_markers.features[current_place_index].geometry.coordinates[1]],
						zoom 	: 15,
						duration: 600
					});	

				check_relation(current_place_index);	
				
				if ( all_data.places[current_place_index].images.length > 0 ) {
					$(this).css('background-image', 'url('+domain.substring(0, domain.length - 1)+all_data.places[1].images[0].image_thumb+')');	
					console.log('case1')
				} else {
					console.log('case2')
					$(this).css('background-image', 'url(img/icn/marker_places_active_default.png)');	
				}

				// $(".ui_detail").fadeIn();
				$('.marker_places').removeClass("show_relations");	
				$(this).addClass("show_relations");	
				$(".mapboxgl-canvas-container").addClass("showing_relations");
			}


		}
	});

	// click on RELATED markers
	$(document).on("click",".marker_floaters",function(){

		current_work_index = $(this).attr("data-index");
		var related_type = $(this).attr("data-type");
		var related_code = $(this).attr("data-code");

		populate_details(related_type, current_work_index, related_code);

		// $(".ui_detail").fadeIn();
		// $(".ui_detail").scrollTop(0);
	});


    // change filter 
    $(".cam_filter").click(function() {
        if (filter_effect == "sepia") {
            filter_effect = "grayscale";
            $("#cam_feed").attr("class", "filter_grayscale");
        } else {
            filter_effect = "sepia"
            $("#cam_feed").attr("class", "filter_sepia");
        }
    });

    // open camera
    $(".btn_opencam").click(function() {
	    start_camera();
    });

    // close camera
    $(".cam_close").click(function(){
		stop_camera();
		$(".cam_component").hide();
    });

    // open list view
    $(".btn_listview").click(function() {
    	populate_list('place');
    });

    // change list data
    $(".ui_list .list_buttons li").click(function() {
    	var data_type = $(this).attr("data-type")
    	populate_list(data_type, true);

    });
    
    // click on single list item
    $(document).on("click",".ui_list .list_content li",function(){
    	var data_index = $(this).attr("data-index");
    	var data_type = $(this).attr("data-type");
    	var data_code = $(this).attr("data-code");
    	populate_details(data_type, data_index, data_code );

    	$('.ui_list .list_content').addClass('disabled');
    });

	// close list panel
	$(".close_list").click(function() {
		$(".ui_list").fadeOut();
	});

	// FN close detail panel and unslick slider
	function close_detail() {
		$(".ui_detail").fadeOut();
		off_tts();
		wipeclean_url();

		$('.meta_desc span').height('auto');
		$('#map, .ui_list .list_content').removeClass('disabled');

		if ( !$(".detail_bottom_ui").hasClass("hide_share") ) {
			toggle_detail_share();	
		};

	    setTimeout(function(){ 
	    	if ($(".slider_wrap").hasClass("slick-slider")) {
	    		$(".meta_image ul")[0].slick.unslick();	
	    	}
		}, 600);
	};
	// END fn close_detail();

	// close detail panel
	$(".close_detail").click(function() {
		close_detail()
	});

	$(document).on("click",".meta_allworks li, .meta_related li, .meta_subtitle1 span",function(){
		var data_code = $(this).attr('data-code');
		var data_type = $(this).attr('data-type');
		$('#meta_wrap').fadeOut("fast", function() {
			populate_details(data_type, null, data_code);	
		})
		
	});


	// close detail page and show list
	$(".detail_menu_list").click(function() {
		close_detail();
    	$(".ui_list .list_buttons li").removeClass("active");
    	$(".list_places").addClass("active");
    	populate_list(current_type)
	})

	
	/*** TEXT-TO-SPEECH data_detail.work ***/

	var tts_text;
	var tts_text_all;
	var tts_voice = "Korean Male";



	// FN show / hide share to fb kakao
	function toggle_tts(all) {
		// turn on tts
		if ($(".detail_tts").hasClass("tts_nowoff") ) {
			$(".detail_tts").removeClass("tts_nowoff")
			$(".tts_turnon").hide();
			$(".tts_turnoff").show();
			$('.detail_tts').css('display', 'flex');
			if (all) {
				responsiveVoice.speak(tts_text_all, tts_voice, {pitch: 1.0, rate:0.9, onend: off_tts})	
			} else {
				responsiveVoice.speak(tts_text, tts_voice, {pitch: 1.0, rate:0.9, onend: off_tts})
			}
			
		} 
		// turn off tts
		else {
			off_tts()
		}
	};
	// END

	// CLICKING ON READ CHAPER
	function read_chapter(that, all) {
		$('.chapter_read').addClass('read_off');
		responsiveVoice.cancel();
		$(".detail_tts").removeClass("tts_nowoff");
		$(".tts_turnon").hide();
		$(".tts_turnoff").show();
		$('.detail_tts').css('display', 'flex');
		if (all) {
			responsiveVoice.speak(tts_text_all, tts_voice, {pitch: 1.0, rate:0.9, onend: off_tts})	
		} else {
			responsiveVoice.speak(tts_text, tts_voice, {pitch: 1.0, rate:0.9, onend: off_tts})
		}

		if (that != undefined) {
			// $('.chapter_read').addClass('read_off');
			$('.chapter_read').removeClass('read_off');
		}	
	}

	// FN turn off tts
	function off_tts() {
		console.log('off_tts called')
		$(".detail_tts").addClass("tts_nowoff")
		$(".tts_turnon").show();
		$(".tts_turnoff").hide();
		$('.chapter_read').addClass('read_off');
		responsiveVoice.cancel();
	};
	// END


	$(".detail_tts").click(function() {
		toggle_tts();
	});

	$(document).on("click",".tts_read",function(){

		// different text for meta_desc and chapters
		if ( $(this).parent('.chapter_read').parent('.meta_desc').length > 0 ) {
			tts_text = $(this).closest('.meta_desc').find('span').html();	
			console.log('ttsxx', tts_text)
		} 
		else if ( $(this).parent('.chapter_read').parent('.chapter_header').parent('.single_chapter').length > 0 ) {
			tts_text = $(this).closest('.single_chapter').find('span').html();
		}
		
		//	console.log(tts_text)
		var that = $(this).parent('.chapter_read')
		if ( that.hasClass('read_off') ) {
			console.log('case1 x')
			read_chapter(that);	
		}
	});

	$(document).on("click",".tts_read_all",function(){

		//	console.log(tts_text)
		var that = $(this).parent('.chapter_read')
		if ( that.hasClass('read_off') ) {
			console.log('case1 x')
			read_chapter(that, true);	
		} 
	});

	$(document).on("click",".tts_stopread",function(){
		off_tts();
	});

	$( ".ui_detail" ).scroll(function() {
		show_sticky_title();
	});

	// show sticky detail title when scrolling
	function show_sticky_title() {
		if ($(".ui_detail").scrollTop() > 155) {
			$('.meta_title_sticky').addClass('show');
		} else {
			$('.meta_title_sticky').removeClass('show');
		}
	};




	// FN show / hide share to fb kakao
	function toggle_detail_share() {
		if ( $(".detail_bottom_ui").hasClass("hide_share") ) {
			$(".detail_bottom_ui").removeClass("hide_share")
			$(".share_share").hide();
			$(".share_close").show();
		} else {
			$(".detail_bottom_ui").addClass("hide_share")
			$(".share_share").show();
			$(".share_close").hide();
		}
	};
	// END

	$(".detail_share, .single_share").click(function() {
		toggle_detail_share();
	});
	
	/*** FB SHARE ***/



	$(".share_fb").click(function() {
		//var share_url = window.location.href;
		
		// var share_img = "http://mud-kage.kakao.co.kr/dn/Q2iNx/btqgeRgV54P/VLdBs9cvyn8BJXB3o7N8UK/kakaolink40_original.png";
		// //var share_url = "https://www.fariskassim.com/stage/rebel9/seongbukgu/master/v6/";
		var share_url = window.location.href;
		// window.open(
		// 	"https://m.facebook.com/sharer.php?s=100&p[url]="+share_url,
		// 	"targetWindow",
		// 	"toolbar=no,location=0,status=no,menubar=no,scrollbars=yes,resizable=yes,width=600,height=600");
	 //    return false;
		FB.ui({
		  method: 'share',
		  mobile_iframe: false,
		  href: share_url,
		}, function(response){});
	});

	/*** KAKAO SHARE ***/

	$(".share_kakao").click(function() {
		var share_url = window.location.href;
		share_kakao(share_url);
	});

	// FN share url on kakao
	Kakao.init("3489c6b8547744faa0c4ad6aa1dac864");
    function share_kakao(share_url) {
      Kakao.Link.sendDefault({
        objectType: "feed",
        content: {
          title: "성북구 - 물 따라 이야기 따라",
          description: "성북구 - 물 따라 이야기 따라 description",
          // 800x800
          imageUrl: "https://sbculture.project9.co.kr/img/ograph/ograph.jpg",
          link: {
            mobileWebUrl: "https://sbculture.project9.co.kr",
            webUrl: "https://sbculture.project9.co.kr"
          }
        },
        buttons: [
          {
            title: "웹으로 보기",
            link: {
              mobileWebUrl: share_url,
              webUrl: share_url
            }
          },
        ]
      });
    };


	/*** UPDATE URL ***/

	// FN UPDATE BROWSER URL
	function updateURL(params) {
		if (history.pushState) {
		    var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + params;
		    window.history.pushState({path:newurl},"",newurl);
		}
	};
	// END


	// FN to delete params from browser url
	function wipeclean_url() {
		var current_url = window.location.href.split("?")[0]; 
		window.history.pushState({}, "", current_url );      
	};
  	// END

  	// INIT ALL AT START
	$( document ).ready(function() {
		init_mapbox();
	}); 



