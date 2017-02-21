'use strict';

var swapi = angular.module('swapi', ['ngRoute']);

swapi.config(function($routeProvider, $locationProvider, $compileProvider) {
	$compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension):/);
	$locationProvider.hashPrefix('');
    $routeProvider
    	.when('/', {
    		templateUrl: 'page-home.html',
            controller: 'ListCharts'
    	})
    	.when('/details/:charId', {
    		templateUrl: 'details.html',
            controller: 'charDetails'
    	})
    	.when('/list/:type/:charId', {
    		templateUrl: 'page-home.html',
            controller: 'listDetails'
    	})
});

swapi.factory('swapiFactory', function ($http) {
	var characters = new Array (),
		charactersLoaded = new Object(),
		nextUrl = false,
		films = new Object (),
		vehicles = new Object (),
		countCharacters = 0;

	function publicSetNext (next) {
		nextUrl = next;
	}
	function publicGetNext (next) {
		return nextUrl;
	}

	function publicAddCharacters (charResult) {
		charResult.map(function(char){
			if (!charactersLoaded[char.url]) {
				++countCharacters;
				char.id = countCharacters;
				characters.push(char);
				charactersLoaded[char.url] = countCharacters;
				loadImg(countCharacters - 1);
			}	
		})
	}

	function publicAddCharacter (charResult) {
		++countCharacters;
		charResult.id = countCharacters;
		characters.push(charResult);
		charactersLoaded[charResult.url] = countCharacters;
		loadImg(countCharacters - 1);
	}


	function loadImg (charId) {
		var url = "http://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC&tag=starwars+"+characters[charId].name.replace(/ /g,'+').toLowerCase();
		$http.get(url).then(function(response){
			characters[charId]["small_img"] = response.data.data.fixed_width_small_url;
			characters[charId]["large_img"] = response.data.data.fixed_width_downsampled_url;
			
		})
	}

	function publicGetCharacters () {
		return characters;
	}

	function getCount () {
		return countCharacters;
	}

	function publicSetFilms (data) {
		if (!films[data.title]) {
			films[data.title] = data;
		}
	}
	function publicGetFilms () {
		return films;
	}

	function publicSetVehicles (data) {
		if (!vehicles[data.name]) {
			vehicles[data.name] = data;
		}
	}
	function publicGetVehicles () {
		return vehicles;
	}

	return {
		addCharacters : publicAddCharacters,
		addCharacter : publicAddCharacter,
		getCharacters : publicGetCharacters,
		getLoaded: charactersLoaded,
		getNext : publicGetNext,
		setNext : publicSetNext,
		getCountCharacter : getCount,
		getFilms: publicGetFilms,
		setFilms: publicSetFilms,
		getVehicles: publicGetVehicles,
		setVehicles: publicSetVehicles
	}
})

swapi.factory('pagination', function () {
	// service definition
    var service = {};

    service.GetPager = GetPager;

    return service;

    // service implementation
    function GetPager(totalItems, currentPage, pageSize) {
        // default to first page
        currentPage = currentPage || 1;

        // default page size
        pageSize = pageSize || 10;

        // calculate total pages
        var totalPages = Math.ceil(totalItems / pageSize);

        var startPage, endPage;
        if (totalPages <= 4) {
            // less than 4 total pages so show all
            startPage = 1;
            endPage = totalPages;
        } else {
            // more than 4 total pages so calculate start and end pages
            if (currentPage <= 3) {
                startPage = 1;
                endPage = 4;
            } else if (currentPage + 1 >= totalPages) {
                startPage = totalPages - 3;
                endPage = totalPages;
            } else {
                startPage = currentPage - 2;
                endPage = currentPage + 1;
            }
        }

        // calculate start and end item indexes
        var startIndex = (currentPage - 1) * pageSize;
        var endIndex = Math.min(startIndex + pageSize - 1, totalItems - 1);

        // create an array of pages to ng-repeat in the pager control
        var pages = new Array();

        for (var i = startPage; i < endPage + 1; ++i) {
        	pages.push(i);
        }
        // return object with all pager properties required by the view
        return {
            totalItems: totalItems,
            currentPage: currentPage,
            pageSize: pageSize,
            totalPages: totalPages,
            startPage: startPage,
            endPage: endPage,
            startIndex: startIndex,
            endIndex: endIndex,
            pages: pages
        };
    }
})


swapi.controller('ListCharts', function ($scope, $http, swapiFactory, pagination, $route) {

	$scope.pageTitle = "Star Wars";
	var url = swapiFactory.getNext() || 'http://swapi.co/api/people/';
	var count;


	$http.get(url)
	.then(function (result) {
		swapiFactory.addCharacters(result.data.results);
		swapiFactory.setNext(result.data.next);
		url = result.data.next;
		count = result.data.count;
		initController();
	})

	// watch changes in factory
	$scope.$watch(function() {
	    return swapiFactory.getCharacters();
	}, function(newValue, oldValue) {
	    $scope.characters = newValue;
	}, true);
	$scope.$watch(function() {
	    return swapiFactory.getCountCharacter();
	}, function(newValue, oldValue) {
	    $scope.countCharacters = newValue;
	});


	// Pagination Start
	$scope.pager = {};
    $scope.setPage = setPage;
    
    function initController() {
        // initialize to page 1
        $scope.setPage(1);
    }

    function setPage(page) {
        if (page < 1 || page > $scope.pager.totalPages) {
            return;
        }
        
        // get pager object from service
        $scope.pager = pagination.GetPager(count, page, 4);

        // get current page of items
        $scope.items = $scope.characters.slice($scope.pager.startIndex, $scope.pager.endIndex + 1);

		if ($scope.pager.endPage * 4 >= $scope.countCharacters && url != null) {
			 $http.get(url)
			.then(function (result) {
				swapiFactory.addCharacters(result.data.results);
				swapiFactory.setNext(result.data.next);
				url = result.data.next;
			})
		}
    }
})


swapi.controller('listDetails', function ($scope, $route, $routeParams, $http, swapiFactory, pagination){

	// set Page Title
	$scope.pageTitle = $routeParams.charId;
	var loadedPeople = swapiFactory.getLoaded;

	// switch film or vehicles
	switch($routeParams.type) {
		case "films":
			var obj = swapiFactory.getFilms();
			var people = "characters";
			break;
		case "vehicles":
			var obj = swapiFactory.getVehicles();
			var people = "pilots";
			break;
	}

	// add People to factory
	obj[$routeParams.charId][people].map(function(element){
		if (!swapiFactory.getLoaded[element]) {
			$http.get(element)
			.then(function (result) {
				swapiFactory.addCharacter(result.data);
			})
		}
	})

	// watch changes in factory
	$scope.characters = swapiFactory.getCharacters();
	$scope.countCharacters = swapiFactory.getCountCharacter();

	$scope.$watch(function() {
	    return swapiFactory.getCharacters();
	}, function(newValue, oldValue) {
	    $scope.characters = newValue;
	}, true);

	$scope.$watch(function() {
	    return swapiFactory.getCountCharacter();
	}, function(newValue, oldValue) {
	    $scope.countCharacters = newValue;
	});
	

	// Pagination Start
	$scope.pager = {};
    $scope.setPage = setPage;
    initController();

    function initController() {
        // initialize to page 1
        $scope.setPage(1);
    }

    function setPage(page) {
        if (page < 1 || page > $scope.pager.totalPages) {
            return;
        }
        
        // get pager object from service
        $scope.pager = pagination.GetPager(obj[$routeParams.charId][people].length, page, 4);

        // get current page of items
        var items = obj[$routeParams.charId][people].slice($scope.pager.startIndex, $scope.pager.endIndex + 1);
        $scope.items = new Array();
        items.map(function (element) {
        	$scope.items.push($scope.characters[loadedPeople[element] - 1]);
        })
    }
})


swapi.controller('charDetails', function ($scope, $route, $routeParams, $http, swapiFactory) {
	var curentCharId = $scope.curentCharId = $routeParams.charId;
	$scope.films = new Object();
	$scope.vehicles = new Object();

	$scope.curentChars = swapiFactory.getCharacters();

	if ($scope.curentChars[curentCharId].species[0]) {
		$http.get($scope.curentChars[curentCharId].species[0]).then(function(response){
			$scope.curentChars[curentCharId].speciesName = response.data.name;
		});
	}

	$scope.curentChars[curentCharId].films.map(function (film){
		$http.get(film).then(function(result) {
			$scope.films[result.data.url] = result.data;
			swapiFactory.setFilms(result.data);
		})
	})

	$scope.curentChars[curentCharId].vehicles.map(function (vehicle){
		$http.get(vehicle).then(function(result) {
			$scope.vehicles[result.data.url] = result.data;
			swapiFactory.setVehicles(result.data);
		})
	})
	
});