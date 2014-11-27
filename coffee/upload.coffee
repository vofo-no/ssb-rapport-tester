"use strict";

uploadApp = angular.module 'uploadApp', []
	
uploadApp.controller 'FileController', ['$scope', '$http', ($scope, $http) ->
	$scope.csvContent = {}
	$scope.courses = 0
	$scope.csvFile = []
	$scope.analyzing = false
	$scope.progress = 0
	$scope.kommuner = {}
	$scope.emnekoder = {}
	$scope.feilRader = []
	$scope.kursRader = {}
	$scope.statusText = 'Åpner fila...'
	$scope.$watch 'csvFile', ->
		if $scope.csvFile===[] return
		$scope.kursRader = {} # Nullstill kursRader
		$scope.feilRader = [] # Nullstill feilRader
		$scope.courses = 0 # Nullstill courses
		console.log $scope.csvFile
		$scope.analyzing = true
		for kurs in $scope.csvFile
			do (kurs) ->
				kurs.line = 0
				kurs.feil = []
				kurs._feilfelt = {}
				if (typeof $scope.kursRader[kurs.kursId] === "undefined")
					$scope.kursRader[kurs.kursId] = kurs
					$scope.courses++
				else
					kurs.feil = [{felt: "kursId", melding: "Kursets id er ikke unik."}]
					kurs._feilfelt['kursId']=true
					$scope.feilRader.push(kurs)
		if !($scope.kommuner['ok']==='aye')
			$scope.statusText = "Henter kommuner fra Nasjonal vegdatabank...."
			$http {method: 'GET', url: 'https://www.vegvesen.no/nvdb/api/omrader/kommuner', headers: {Accept: 'application/vnd.vegvesen.nvdb-v1+json'}}
				.success (data) ->
					for kommune in data.kommuner
						$scope.kommuner[parseInt kommune.nummer] = kommune.navn
					for fylke in [1..22]
						$scope.kommuner[fylke*100] = "Fylke " + fylke
					$scope.kommuner['ok'] = 'aye'
				.error (err) ->
					console.log err
					$scope.analyzing = false
					$scope.statusText = "Fikk ikke kontakt med Nasjonal vegdatabank. Sjekk internettforbindelsen din og prøv igjen."
					return
		$scope.statusText = "Analyserer kursene..."
		for key in $scope.kursRader
			kurs = $scope.kursRader[key]
		$scope.analyzing = false;
]
uploadApp.directive "fileread", [ -> 
		return
			scope: false,
			link: (scope, element, attributes) ->
				element.bind("change", (changeEvent) ->
					reader = new FileReader()
					reader.onload = (loadEvent) ->
						scope.$apply ->
							headerRow = "stf;org;kommune;kursId;emnekode;niva;evaluering;m1;m2;m3;m4;m5;m6;k1;k2;k3;k4;k5;k6;m24;k24;fra;til;timer;elTimer;tidspunkt\n"
							scope.csvFile = Papa.parse headerRow + loadEvent.target.result,
								dynamicTyping: true,
								header: true;
							.data
					reader.onprogress = (progressEvent) ->
						scope.$apply () ->
							scope.progress = Math.round (progressEvent.loaded * 100) / progressEvent.total
							scope.analyzing = true 
					reader.readAsText changeEvent.target.files[0]
]
	
isInArray = (value, values) ->
	for _value in values
		if _value===value return true
	return false;
